FROM corysanin/openrct2-cli:develop-alpine AS rct2

FROM node:alpine3.13

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl duktape freetype fontconfig icu sdl2 speexdsp
COPY --from=rct2 /usr /usr

WORKDIR /usr/src/screenshotter

COPY ./docker .
COPY ./config /home/node/.config/OpenRCT2/

RUN chown -R node:node /home/node/.config/OpenRCT2

USER node

CMD [ "node", "index.js" ]