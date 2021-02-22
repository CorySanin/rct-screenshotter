#!/bin/bash
su - user -c "export DISPLAY=:1 && timeout -s SIGKILL 10 openrct2 `[ -z "$OPENRCT2ARGS" ] && echo "~/.config/OpenRCT2/save/save.sv6" || echo "$OPENRCT2ARGS"`"
ps -eaf | grep supervisord | grep python3 | awk '{ print $2 }' | xargs kill -9