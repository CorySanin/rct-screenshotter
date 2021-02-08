#!/bin/bash
su - user -c "export DISPLAY=:1 && echo '$OPENRCT2ARGS' | xargs -d ' ' openrct2"; ps -eaf | grep supervisord | grep python3 | awk '{ print $2 }' | xargs kill -9