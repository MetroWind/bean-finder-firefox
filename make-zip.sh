#!/bin/zsh

TARGET=bean-finder.zip

if [[ -e ${TARGET} ]]; then
    rm ${TARGET}
fi

zip ${TARGET} *.js *.html *.css manifest.json icon.svg
