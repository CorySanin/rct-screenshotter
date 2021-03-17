#!/bin/bash
su - user -c "export DISPLAY=:1 && node /usr/src/screenshotter/index.js"
ps -eaf | grep supervisord | grep python3 | awk '{ print $2 }' | xargs kill -9