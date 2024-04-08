#!/bin/bash

TARGET=/mnt/c/Users/Lorenz/Documents/Obsidian-vault/.obsidian/plugins/time-tracker
WATCH="styles.css manifest.json main.js"

function copy() {
    mkdir -p $TARGET
    cp -v $WATCH $TARGET
}


if [ "$1" == "watch" ]; then
    npm run dev &
    while inotifywait -e modify $WATCH; do
        copy
    done
else
    copy
fi

