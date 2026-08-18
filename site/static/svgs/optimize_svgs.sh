#!/bin/bash

# Exit on error
set -e
shopt -s nocaseglob

echo "Optimizing SVG files with SVGO..."
for file in *.svg; do
    if [ -f "$file" ]; then
        echo "Optimizing $file..."
        npx svgo --multipass "$file" -o "$file"
    fi
done

echo "SVG optimization complete!"
