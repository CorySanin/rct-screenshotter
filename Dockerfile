FROM corysanin/openrct2-cli:develop-alpine AS rct2

FROM node:alpine3.16 as build

WORKDIR /usr/src/screenshotter

COPY ./package*json ./

RUN npm install

FROM node:alpine3.16

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl freetype fontconfig icu sdl2 speexdsp \
  && ln -sf /game /rct2
COPY --from=rct2 /usr /usr

WORKDIR /usr/src/screenshotter

COPY --from=build /usr/src/screenshotter /usr/src/screenshotter

COPY ./config /home/node/.config/OpenRCT2/
COPY . .

RUN npm run build \
  && npm install --production\
  && mkdir /home/node/.config/OpenRCT2/object \
  && chown -R node:node /home/node/.config/OpenRCT2

USER node

CMD [ "node", "index.js" ]