const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const CWD = process.cwd();

async function cropSvg(filePath) {
    const relativePath = path.relative(CWD, filePath);
    try {
        const originalContent = fs.readFileSync(filePath, 'utf8');
        
        // Find the root <svg> opening tag using regex
        const svgTagMatch = originalContent.match(/(<svg[^>]*>)/i);
        if (!svgTagMatch) {
            console.warn(`⚠️  Skip ${relativePath}: No root <svg> opening tag found.`);
            return;
        }
        const originalSvgTag = svgTagMatch[1];

        // Parse viewBox from the root svg tag
        const viewBoxMatch = originalSvgTag.match(/viewBox=["']\s*([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s+([-\d.eE]+)\s*["']/i);
        let vx = 0, vy = 0, vw = 0, vh = 0;
        let hasViewBox = false;

        if (viewBoxMatch) {
            [vx, vy, vw, vh] = viewBoxMatch.slice(1, 5).map(Number);
            hasViewBox = true;
        } else {
            // Fallback to width and height attributes if viewBox is missing
            const wMatch = originalSvgTag.match(/width=["']\s*([-\d.eE]+)\s*["']/i);
            const hMatch = originalSvgTag.match(/height=["']\s*([-\d.eE]+)\s*["']/i);
            if (wMatch && hMatch) {
                vw = parseFloat(wMatch[1]);
                vh = parseFloat(hMatch[1]);
            } else {
                console.warn(`⚠️  Skip ${relativePath}: Could not parse viewBox or width/height from root <svg> tag.`);
                return;
            }
        }

        if (vw <= 0 || vh <= 0) {
            console.warn(`⚠️  Skip ${relativePath}: SVG has non-positive dimensions (${vw}x${vh}).`);
            return;
        }

        // Render SVG scaled up for high precision (max dimension 2000px)
        const targetMax = 2000;
        let renderWidth, renderHeight;
        if (vw > vh) {
            renderWidth = targetMax;
            renderHeight = Math.round((vh / vw) * targetMax);
        } else {
            renderHeight = targetMax;
            renderWidth = Math.round((vw / vh) * targetMax);
        }

        const { data, info } = await sharp(Buffer.from(originalContent))
            .resize({ width: renderWidth, height: renderHeight })
            .raw()
            .toBuffer({ resolveWithObject: true });

        // Scan the alpha channel to find the visual bounding box of the graphic
        let left = info.width;
        let right = 0;
        let top = info.height;
        let bottom = 0;

        const channels = info.channels;
        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * channels;
                const alpha = data[idx + 3];
                if (alpha > 0) { // Found non-transparent pixel
                    if (x < left) left = x;
                    if (x > right) right = x;
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                }
            }
        }

        if (left > right || top > bottom) {
            console.warn(`⚠️  Skip ${relativePath}: Image appears to be completely transparent.`);
            return;
        }

        // Map pixel boundaries back to original viewBox coordinates
        const scaleX = vw / info.width;
        const scaleY = vh / info.height;

        let newVx = vx + (left * scaleX);
        let newVy = vy + (top * scaleY);
        let newVw = (right - left + 1) * scaleX;
        let newVh = (bottom - top + 1) * scaleY;

        // Add a tiny safety margin (0.5%) to avoid cutting off anti-aliased edge pixels or thick strokes
        const marginX = newVw * 0.005;
        const marginY = newVh * 0.005;
        
        newVx = Math.max(vx, newVx - marginX);
        newVy = Math.max(vy, newVy - marginY);
        newVw = Math.min(vw, newVw + marginX * 2);
        newVh = Math.min(vh, newVh + marginY * 2);

        // Format viewBox values to 2 decimal places to keep markup clean
        const newViewBox = `${newVx.toFixed(2)} ${newVy.toFixed(2)} ${newVw.toFixed(2)} ${newVh.toFixed(2)}`;

        // Build the updated root <svg> tag using string manipulation
        let updatedSvgTag = originalSvgTag;
        
        // Remove width and height attributes (to let CSS/viewBox handle responsiveness)
        updatedSvgTag = updatedSvgTag.replace(/\s+width=["'][^"']*["']/gi, '');
        updatedSvgTag = updatedSvgTag.replace(/\s+height=["'][^"']*["']/gi, '');

        // Update or insert the viewBox attribute
        if (/viewBox=/i.test(updatedSvgTag)) {
            updatedSvgTag = updatedSvgTag.replace(/viewBox=["'][^"']*["']/gi, `viewBox="${newViewBox}"`);
        } else {
            updatedSvgTag = updatedSvgTag.replace(/<svg/i, `<svg viewBox="${newViewBox}"`);
        }

        // Replace only the first occurrence of the root tag to guarantee nested <svg> tags are left untouched
        const tagIndex = originalContent.indexOf(originalSvgTag);
        if (tagIndex === -1) {
            console.error(`❌ Error cropping ${relativePath}: Root tag matching index lost.`);
            return;
        }

        const updatedContent = originalContent.substring(0, tagIndex) + 
                               updatedSvgTag + 
                               originalContent.substring(tagIndex + originalSvgTag.length);

        // Only save if the viewBox actually changed or width/height attributes were removed
        const hasViewBoxChanged = !hasViewBox || (originalSvgTag.match(/viewBox=["']([^"']*)["']/i)?.[1] !== newViewBox);
        const hasSizeAttrsRemoved = /\s+(width|height)=/i.test(originalSvgTag);

        if (hasViewBoxChanged || hasSizeAttrsRemoved) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Cropped ${relativePath}:`);
            console.log(`   - Old viewBox:  ${hasViewBox ? viewBoxMatch[0] : 'none'}`);
            console.log(`   - New viewBox:  viewBox="${newViewBox}"`);
        } else {
            console.log(`ℹ️  No changes needed for ${relativePath}`);
        }
    } catch (err) {
        console.error(`❌ Error cropping ${relativePath}:`, err.message);
    }
}

async function main() {
    const files = fs.readdirSync(CWD);
    const svgFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        const stat = fs.statSync(path.join(CWD, file));
        return ext === '.svg' && stat.isFile();
    });

    console.log(`Found ${svgFiles.length} SVG files to process.`);
    for (const file of svgFiles) {
        await cropSvg(path.join(CWD, file));
    }
}

main();
