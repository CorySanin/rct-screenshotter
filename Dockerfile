FROM corysanin/openrct2-cli:develop-alpine AS rct2

FROM node:alpine3.16

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl duktape freetype fontconfig icu sdl2 speexdsp \
  && ln -sf /game /rct2
COPY --from=rct2 /usr /usr

WORKDIR /usr/src/screenshotter

COPY ./config /home/node/.config/OpenRCT2/
COPY . .

RUN npm install \
  && mkdir /home/node/.config/OpenRCT2/object \
  && chown -R node:node /home/node/.config/OpenRCT2

USER node

CMD [ "node", "index.js" ]