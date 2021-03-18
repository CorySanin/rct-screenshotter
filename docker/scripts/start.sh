#!/bin/bash
su - user -c "export DISPLAY=:1 && node /usr/src/screenshotter/index.js > /usr/src/screenshotter/stdout.log"
ps -eaf | grep supervisord | grep python3 | awk '{ print $2 }' | xargs kill -9