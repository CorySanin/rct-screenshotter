FROM steamcmd/steamcmd:alpine as gamefiles

ARG USERNAME
ARG PASSWORD
ARG GUARD
ARG SECRET

# generate a steamguard token if one is not set.
RUN [ -z "$GUARD" ] && [ -n "$SECRET" ] \
  && apk add --no-cache git\
  && mkdir -p ~/.config/steamguard-cli \
  && git clone https://gist.github.com/a04673902e42ad4f2c58296d0209f923.git ~/.config/steamguard-cli/maFiles \
  && sed -i "s:%SECRET%:${SECRET}:g" ~/.config/steamguard-cli/maFiles/a.maFile  \
  && wget https://github.com/dyc3/steamguard-cli/releases/download/v0.7.1/steamguard-cli \
  && chmod +x ./steamguard-cli \
  && ./steamguard-cli > totp || echo "$GUARD" > totp

RUN [ -n "$USERNAME" ] \
  && steamcmd +@sSteamCmdForcePlatformType windows +login "$USERNAME" "$PASSWORD" "$(cat totp)" \
  +app_update 285330 +app_update 285310 +exit \
  || echo "No username provided, skipping..."
RUN mkdir -p "/root/Steam/steamapps/common/Rollercoaster Tycoon 2" "/root/Steam/steamapps/common/RollerCoaster Tycoon Deluxe" \
  && ls -al "/root/Steam/steamapps/common/Rollercoaster Tycoon 2/Data/g1.dat" \
  || [ -z "$USERNAME" ]

FROM corysanin/openrct2-cli:develop-alpine AS rct2

FROM node:alpine3.18 as build

WORKDIR /usr/src/screenshotter

COPY ./package*json ./

RUN npm install

FROM node:alpine3.18 as deploy

EXPOSE 8080

HEALTHCHECK  --timeout=3s \
  CMD curl --fail http://localhost:8080/healthcheck || exit 1

COPY --from=gamefiles ["/root/Steam/steamapps/common/Rollercoaster Tycoon 2", "/rct2"]
COPY --from=gamefiles ["/root/Steam/steamapps/common/RollerCoaster Tycoon Deluxe", "/rct1"]

RUN apk add --no-cache rsync ca-certificates libpng libzip libcurl freetype fontconfig icu sdl2 speexdsp curl \
  && ln -sf /game /rct2
COPY --from=rct2 /usr /usr
COPY --from=rct2 /lib /lib

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