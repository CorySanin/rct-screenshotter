# rct-screenshotter

[![Docker Pulls](https://img.shields.io/docker/pulls/corysanin/rct-screenshotter)](https://hub.docker.com/r/corysanin/rct-screenshotter)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/CorySanin/rct-screenshotter/docker-image.yml)](https://github.com/CorySanin/rct-screenshotter/actions)
![Depfu](https://img.shields.io/depfu/dependencies/github/CorySanin/rct-screenshotter)
[![GitHub repo size](https://img.shields.io/github/repo-size/CorySanin/rct-screenshotter)](https://github.com/CorySanin/rct-screenshotter)
[![GitHub](https://img.shields.io/github/license/CorySanin/rct-screenshotter)](https://github.com/CorySanin/rct-screenshotter/blob/master/LICENSE)

`rct-screenshotter` is a simple web server that generates screenshots of Rollercoaster Tycoon save files.

This project is intended to be used as a REST API for projects like [ffa-tycoon](https://github.com/CorySanin/ffa-tycoon). But it also has a form on its homepage to allow for use in a web browser.

It uses OpenRCT2 to generate screenshots, and as such is compatible with RCT1, RCT2, and OpenRCT2 save formats.

## API

Submit a multipart post request to /upload with the following fields:

| Name     | Description                                             |
|----------|---------------------------------------------------------|
| park     | The save file to generate a screenshot of               |
| zoom     | The zoom level to use in the screenshot. 0-7 (optional) |
| rotation | The rotation of the map. 0-3 (optional)                 |