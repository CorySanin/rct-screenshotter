# openrct2-screenshotter

This plugin takes a screenshot once a park is loaded. Optionally close the game once the screenshot has been taken (useful for autmation).

## Setup

Make sure the plugin (`lib/screenshotter.js`) is installed and configure your `plugin.store.json` if you desire to modify the screenshot parameters ([example](config/plugin.store.json)). To use the plugin, load up a park.

## Docker Setup

This command will join the specified server, save a screenshot to `./screenshot/`, then exit.

``docker run --rm --env OPENRCT2ARGS="join taunt.bot --port 11755" -v /path/to/rct2/files:/home/user/game -v `pwd`/screenshot:/home/user/.config/OpenRCT2/screenshot -it corysanin/openrct2-screenshotter:develop``