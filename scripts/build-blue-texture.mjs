import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

// Figma's visible wave vectors use #3E8AB0 with Multiply over the base fill.
const basePath = fileURLToPath(
  new URL('../public/images/base.png', import.meta.url),
);
const outputPath = fileURLToPath(
  new URL('../public/images/base-blue.png', import.meta.url),
);
const image = PNG.sync.read(readFileSync(basePath));
const blue = [0x3e, 0x8a, 0xb0];

for (let index = 0; index < image.data.length; index += 4) {
  for (let channel = 0; channel < 3; channel += 1) {
    image.data[index + channel] = Math.round(
      (image.data[index + channel] * blue[channel]) / 255,
    );
  }
}

writeFileSync(outputPath, PNG.sync.write(image));
