
FROM corysanin/openrct2-cli:develop-ubuntu AS rct2

FROM dorowu/ubuntu-desktop-lxde-vnc:focal

USER root
ENV DEBIAN_FRONTEND=noninteractive
COPY --from=rct2 /usr /usr

COPY ./scripts/start.sh /usr/start.sh

RUN chmod 777 /usr/start.sh \
  && apt-get update \
  && apt-get install --no-install-recommends -y libsdl2-2.0 libspeexdsp1 libgl1 apt-utils software-properties-common -y \
  && rm -rf /var/lib/apt/lists/* \
  && cp /startup.sh /startdesktop.sh

COPY ./lib/screenshotter.js ./.config/OpenRCT2/plugin/

COPY ./config/* ./.config/OpenRCT2/

EXPOSE 5900

ENV OPENBOX_ARGS="--startup /usr/start.sh"
ENV RESOLUTION=1280x900
ENV USER=user
ENV DISPLAY=:1

#same entrypoint as parent
ENTRYPOINT ["/startup.sh"]