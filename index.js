const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const spawn = require('child_process').spawn;
const express = require('express');
const multer  = require('multer');
const moment = require('moment');
const phin = require('phin');

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

function getFileNum() {
    return (filenum = (filenum + 1) % FILENUMMAX);
}

function getScreenshot(file, options = {}) {
    return new Promise((resolve, reject) => {
        let destination = path.join(SCREENSHOTDIR, `screenshot_${moment().format('HHmmssSS')}_${getFileNum()}.png`);
        let proc = spawn('openrct2-cli', ['screenshot', `${file}`, destination, 'giant', Math.min(Math.abs(parseInt(options.zoom || 3)), 7), parseInt(options.rotation || 0) % 4], {
            stdio: ['ignore', process.stdout, process.stderr]
        });
        let timeout = setTimeout(() => {
            reject('Timed out');
            proc.kill();
        }, TIMEOUT);

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

app.post('/upload', upload.single('park'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).send({
                status: 'bad'
            });
        }
        else {
            let options = {
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
                        console.log(err);
                    }
                });
            });
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    }
    catch (ex) {
        console.log(ex);
        res.status(500).send({
            status: 'bad'
        });
    }
});

app.get('/upload', async (req, res) => {
    try {
        if (!req.query || !req.query.url) {
            res.status(400).send({
                status: 'bad'
            });
        }
        else {
            let park = await phin({
                url: req.query.url,
                followRedirects: true
            });
            let filename = path.join(PARKDIR, `download_${moment().format('YYYYMMDD')}_${getFileNum()}.sv6`);

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
    }
    catch (ex) {
        console.log(ex);
        res.send({
            status: 'bad'
        });
    }
});

app.get('/', (req, res) => {
    res.render('index',
        function (err, html) {
            if (!err) {
                res.send(html);
            }
            else {
                console.log(err);
                res.send();
            }
        }
    )
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
    })
});

process.on('SIGTERM', server.close);