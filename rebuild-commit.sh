#!/bin/bash
git commit -m "Triggered rebuild on `date +'%Y-%m-%d'`" --allow-empty
git push origin HEAD
