const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const spawn = require('child_process').spawn;
const express = require('express');
const fileUpload = require('express-fileupload');
const moment = require('moment');

const PORT = process.env.PORT || 8080;
const HOME = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
const PARKDIR = process.env.PARKDIR || path.join(HOME, '.config', 'OpenRCT2', 'save');
const SCREENSHOTDIR = process.env.SCREENSHOTDIR || path.join(HOME, '.config', 'OpenRCT2', 'screenshot');
const TEMPDIR = path.join(SCREENSHOTDIR, 'temp');
const FILENUMMAX = 5000;

const app = express();

let filenum = 0;
let filequeue = [];

function getFileNum() {
    return (filenum = (filenum + 1) % FILENUMMAX);
}

function getScreenshot(file) {
    return new Promise(async (resolve, reject) => { //can remove async?
        if (filequeue.push({
            file,
            resolve,
            reject
        }) === 1) {
            processQueue();
        }
    });
}

function processQueue() {
    if (filequeue.length > 0) {
        emptyScreenshotsDir();

        let parkobj = filequeue[0];
        let process = spawn('openrct2', [`${parkobj.file}`], {
            windowsHide: true
        });
        let timeout = setTimeout(() => {
            parkobj.reject('Timed out');
            filequeue.shift();
            process.kill();
            processQueue();
        }, 10000);

        process.on('exit', async (code) => { // the file is actually generated sooner than this. Potential time saving?
            let children = await fsp.readdir(SCREENSHOTDIR, { withFileTypes: true });
            children.every((child) => {
                if (child.isFile()) {
                    clearTimeout(timeout);
                    let destination = path.join(TEMPDIR, child.name);
                    fs.rename(path.join(SCREENSHOTDIR, child.name), destination, (err) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            parkobj.resolve(destination);
                        }
                        filequeue.shift();
                        processQueue();
                    });
                    return false;
                }
                return true;
            });
        });
    }
}

async function emptyScreenshotsDir() {
    let children = await fsp.readdir(SCREENSHOTDIR, { withFileTypes: true });
    children.forEach(async (child) => {
        try {
            if (child.isFile()) {
                await fsp.rm(path.join(SCREENSHOTDIR, child.name));
            }
        }
        catch (ex) {
            console.log(ex);
        }
    });
}

app.use(fileUpload({
    createParentPath: true,
    abortOnLimit: true,
    limits: {
        fileSize: 100 * 1024 * 1024
    }
}));

app.post('/upload', async (req, res) => {
    try {
        if (!req.files || !req.files.park) {
            res.send({
                status: 'bad'
            });
        }
        else {
            let park = req.files.park;
            let filename = path.join(PARKDIR, `upload_${moment().format('YYYYMMDD')}_${getFileNum()}.sv6`);
            await park.mv(filename);
            //await fsp.writeFile(filename, park.data);

            image = await getScreenshot(filename);
            res.sendFile(image, () => {
                fs.unlink(image, (err) => {
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

app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}.`);
    fs.mkdir(PARKDIR, { recursive: true }, err => {
        if (err) {
            console.log(err);
        }
    });
    fs.mkdir(TEMPDIR, { recursive: true }, err => {
        if (err) {
            console.log(err);
        }
    })
});