# rct-screenshotter

[![Docker Pulls](https://img.shields.io/docker/pulls/corysanin/rct-screenshotter)](https://hub.docker.com/r/corysanin/rct-screenshotter)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/CorySanin/rct-screenshotter/docker-image.yml)](https://github.com/CorySanin/rct-screenshotter/actions)
[![GitHub repo size](https://img.shields.io/github/repo-size/CorySanin/rct-screenshotter)](https://github.com/CorySanin/rct-screenshotter)
[![GitHub](https://img.shields.io/github/license/CorySanin/rct-screenshotter)](https://github.com/CorySanin/rct-screenshotter/blob/master/LICENSE)

`rct-screenshotter` is a simple web server that generates screenshots of Rollercoaster Tycoon save files.

This project is intended to be used as a REST API for projects like [ffa-tycoon](https://github.com/CorySanin/ffa-tycoon). But it also has a form on its homepage to allow for use in a web browser.

It uses OpenRCT2 to generate screenshots, and as such is compatible with RCT1, RCT2, and OpenRCT2 save formats.

A demo is available [here](https://screenshot.ffa-tycoon.com/). Expect this free instance to perform slowly.

## API

Submit a multipart post request to /upload with the following fields:

| Name     | Description                                             |
|----------|---------------------------------------------------------|
| park     | The save file to generate a screenshot of               |
| zoom     | The zoom level to use in the screenshot. 0-7 (optional) |
| rotation | The rotation of the map. 0-3 (optional)                 |

## Cloud Deployment

Can't or don't want to mount a volume in production? Not a problem.

The following arguments in the Dockerfile can be used to download the game files from Steam:

| Arg      | Description                                                                  |
|----------|------------------------------------------------------------------------------|
| USERNAME | Steam username. Downloading the game files will be skipped if this is empty. |
| PASSWORD | Steam password.                                                              |
| GUARD    | A current Steam Guard token.                                                 |
| SECRET   | The key to generate Steam Guard tokens.                                      |

Only `GUARD` *or* `SECRET` need to be provided, not both.