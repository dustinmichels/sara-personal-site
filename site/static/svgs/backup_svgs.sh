#!/bin/bash

# Exit on error
set -e
shopt -s nocaseglob

BACKUP_DIR="_backup"

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "Backing up SVG files..."
# Copy all svg files in the current directory to the backup directory
for file in *.svg; do
    if [ -f "$file" ]; then
        cp -n "$file" "$BACKUP_DIR/" || true
    fi
done

echo "SVG backup complete!"
