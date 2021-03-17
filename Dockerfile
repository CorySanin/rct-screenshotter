
FROM corysanin/openrct2-cli:develop-ubuntu AS rct2

FROM dorowu/ubuntu-desktop-lxde-vnc:focal

USER root
ENV DEBIAN_FRONTEND=noninteractive
ENV OPENBOX_ARGS="--startup /usr/src/screenshotter/scripts/start.sh"
ENV RESOLUTION=640x480
ENV USER=user
ENV DISPLAY=:1
COPY --from=rct2 /usr /usr

RUN curl -fsSL https://deb.nodesource.com/setup_12.x | bash - \
  && apt-get update \
  && apt-get install --no-install-recommends -y libsdl2-2.0 libspeexdsp1 libgl1 apt-utils software-properties-common nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && cp /startup.sh /startdesktop.sh

COPY ./lib/screenshotter.js ./.config/OpenRCT2/plugin/

COPY ./config/* ./.config/OpenRCT2/

WORKDIR /usr/src/screenshotter

COPY ./docker .

RUN chmod -R 777 /usr/src/screenshotter \
  && npm install

EXPOSE 5900
EXPOSE 8080

#same entrypoint as parent
ENTRYPOINT ["/startup.sh"]