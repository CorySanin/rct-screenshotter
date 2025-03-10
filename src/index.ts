import fs from 'fs';
import * as fsp from 'node:fs/promises';
import path from 'path';
import spawn from 'child_process';
import express from 'express';
import multer from 'multer';
import dayjs from 'dayjs';
import ky from 'ky';

type ScreenshotOptions = {
    zoom: number | string,
    rotation: number | string,
};

const PORT = process.env.PORT || 8080;
const HOME = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const GAMEDIR = process.env.GAMEDIR || path.join(HOME, (process.platform === 'win32') ? 'Documents' : '.config', 'OpenRCT2');
const PARKDIR = process.env.PARKDIR || path.join(GAMEDIR, 'save');
const SCREENSHOTDIR = process.env.SCREENSHOTDIR || path.join(GAMEDIR, 'screenshot');
const FILENUMMAX = 100000;
const TIMEOUT = process.env.TIMEOUT || 20000;

const app = express();
const upload = multer({ dest: PARKDIR });

let filenum = 0;

function notStupidParseInt(v: string | undefined | number): number {
    if (typeof v === 'number') {
        return v;
    }
    return v === undefined ? NaN : parseInt(v);
}

function getFileNum(): number {
    return (filenum = (filenum + 1) % FILENUMMAX);
}

function getScreenshot(file: string, options: Partial<ScreenshotOptions> = {}): Promise<string> {
    return new Promise((resolve, reject) => {
        let destination = path.join(SCREENSHOTDIR, `screenshot_${dayjs().format('HHmmssSS')}_${getFileNum()}.png`);
        let proc = spawn.spawn('openrct2-cli', ['screenshot', `${file}`, destination, 'giant', Math.min(Math.abs(notStupidParseInt(options.zoom || 3)), 7).toString(), (notStupidParseInt(options.rotation || 0) % 4).toString()], {
            stdio: ['ignore', process.stdout, process.stderr]
        });
        let timeout = setTimeout(() => {
            reject('Timed out');
            proc.kill();
        }, notStupidParseInt(TIMEOUT));

        proc.on('exit', (code) => {
            if (code !== null) {
                clearTimeout(timeout);
                try {
                    resolve(destination);
                }
                catch (ex) {
                    reject(ex);
                }
            }
        });
    });
}

app.set('trust proxy', 1);
app.set('view engine', 'ejs');

app.use('/assets/', express.static('assets'));

app.get('/healthcheck', async (_, res: express.Response) => {
    res.send('Healthy');
});

app.post('/upload', upload.single('park'), async (req: express.Request, res: express.Response) => {
    try {
        if (!req.file) {
            res.status(400).send({
                status: 'bad'
            });
            return;
        }
        let options: ScreenshotOptions = {
            zoom: req.body.zoom || req.query.zoom,
            rotation: req.body.rotation || req.query.rotation,
        };
        let image = await getScreenshot(req.file.path, options);
        res.sendFile(image, (err) => {
            if (err) {
                res.status(500).send({
                    status: 'bad'
                });
            }
            fs.unlink(image, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        });
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error(err);
            }
        });
    }
    catch (ex) {
        console.error(ex);
        res.status(500).send({
            status: 'bad'
        });
    }
});

app.get('/upload', async (req: express.Request, res: express.Response) => {
    try {
        if (!req.query || !req.query.url || typeof req.query.url !== 'string') {
            res.status(400).send({
                status: 'bad'
            });
            return;
        }
        let park = await ky.get(req.query.url);
        let filename = path.join(PARKDIR, `download_${dayjs().format('YYYYMMDD')}_${getFileNum()}.sv6`);

        await fsp.writeFile(filename, park.body);

        let image = await getScreenshot(filename, req.query);
        res.sendFile(image, (err) => {
            if (err) {
                res.status(500).send({
                    status: 'bad'
                });
            }
            fs.unlink(image, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            fs.unlink(filename, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        });
    }
    catch (ex) {
        console.log(ex);
        res.send({
            status: 'bad'
        });
    }
});

app.get('/', (_, res: express.Response) => {
    res.render('index', (err: Error | null, html: string | undefined) => {
        if (!err) {
            return res.send(html);
        }
        console.log(err);
        res.send();
    });
});

let server = app.listen(PORT, () => {
    console.log(`RCT Screenshotter listening on port ${PORT}.`);
    fs.mkdir(PARKDIR, { recursive: true }, err => {
        if (err) {
            console.log(err);
        }
    });
    fs.mkdir(SCREENSHOTDIR, { recursive: true }, err => {
        if (err) {
            console.log(err);
        }
    });
});

process.on('SIGTERM', server.close);