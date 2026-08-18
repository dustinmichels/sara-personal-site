#!/bin/bash

# Exit on error
set -e
shopt -s nocaseglob

if [ ! -d "node_modules/sharp" ]; then
    echo "Installing cropping dependencies..."
    npm install --no-save sharp
fi

echo "Cropping SVG files (trimming visual whitespace)..."
node crop_svgs.js

echo "Optimizing SVG files with SVGO..."
for file in *.svg; do
    if [ -f "$file" ]; then
        echo "Optimizing $file..."
        npx svgo --config=svgo.config.js --multipass "$file" -o "$file"
    fi
done

echo "SVG optimization complete!"
