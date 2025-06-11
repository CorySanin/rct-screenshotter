import fs from 'fs';
import * as fsp from 'node:fs/promises';
import path from 'path';
import spawn from 'child_process';
import express from 'express';
import { expressjwt } from "express-jwt"
import multer from 'multer';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import ky from 'ky';
import { Server } from 'node:http';
import type { UnauthorizedError, Request as JWTRequest } from "express-jwt";
import type { StringValue } from "ms";

type ScreenshotOptions = {
    zoom: number | string,
    rotation: number | string,
};

const PORT = process.env.PORT || 8080;
const TOKENPORT = process.env.TOKENPORT || null;
const TOKENSECRET = process.env.TOKENSECRET || null;
const TOKENEXP = process.env.TOKENEXP || '1y';
const HOME = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const GAMEDIR = process.env.GAMEDIR || path.join(HOME, (process.platform === 'win32') ? 'Documents' : '.config', 'OpenRCT2');
const PARKDIR = process.env.PARKDIR || path.join(GAMEDIR, 'save');
const SCREENSHOTDIR = process.env.SCREENSHOTDIR || path.join(GAMEDIR, 'screenshot');
const FILENUMMAX = 100000;
const TIMEOUT = process.env.TIMEOUT || 20000;

const app = express();
const secureapp: express.Express | null = TOKENPORT && TOKENSECRET && express();
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
        const destination = path.join(SCREENSHOTDIR, `screenshot_${dayjs().format('HHmmssSS')}_${getFileNum()}.png`);
        const proc = spawn.spawn('openrct2-cli', ['screenshot', `${file}`, destination, 'giant', Math.min(Math.abs(notStupidParseInt(options.zoom || 3)), 7).toString(), (notStupidParseInt(options.rotation || 0) % 4).toString()], {
            stdio: ['ignore', process.stdout, process.stderr]
        });
        const timeout = setTimeout(() => {
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

async function serveScreenshot(filename: string, options: Partial<ScreenshotOptions>, res: express.Response): Promise<void> {
    const image = await getScreenshot(filename, options);

    res.sendFile(image, { dotfiles: 'allow' }, (err) => {
        if (err) {
            console.error(err);
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

app.set('trust proxy', 1);
app.set('view engine', 'ejs');

app.use('/assets/', express.static('assets'));

app.get('/healthcheck', (_, res: express.Response) => {
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
        const options: ScreenshotOptions = {
            zoom: req.body.zoom || req.query.zoom,
            rotation: req.body.rotation || req.query.rotation,
        };
        await serveScreenshot(req.file.path, options, res);
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
        const park = await ky.get(req.query.url);
        const filename = path.join(PARKDIR, `download_${dayjs().format('YYYYMMDD')}_${getFileNum()}.sv6`);

        await fsp.writeFile(filename, park.body);

        await serveScreenshot(filename, req.query, res);
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

const servers: Server[] = [];

if (secureapp) {
    app.get('/token/:appname', (req: express.Request, res: express.Response) => {
        const resp: any = {
            status: 'bad'
        }
        jwt.sign({ application: req.params['appname'] }, TOKENSECRET, { algorithm: 'HS256', expiresIn: TOKENEXP as StringValue }, (err, token) => {
            if (err) {
                console.error(err);
            }
            else {
                resp.status = 'ok';
                resp.token = token;
            }
            res.send(JSON.stringify(resp));
        });
    });

    secureapp.set('trust proxy', 1);
    secureapp.use(expressjwt({
        secret: TOKENSECRET,
        algorithms: ['HS256'],
        credentialsRequired: true
    }));
    secureapp.use(function (err: UnauthorizedError | Error, _: express.Request, res: express.Response, next: (err: Error) => void) {
        if (err?.name === "UnauthorizedError") {
            res.status(401).send(JSON.stringify({
                status: 'bad',
                error: "invalid token"
            }));
        } else {
            next(err);
        }
    });
    secureapp.use(app);
    servers.push(secureapp.listen(TOKENPORT, () => {
        console.log(`Secure server listening on port ${TOKENPORT}.`);
    }));
}

servers.push(app.listen(PORT, () => {
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
}));

process.on('SIGTERM', () => servers.forEach(s => s.close()));
