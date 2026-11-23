const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const app = path.join(__dirname, "..", "src", "app");
const svg = fs.readFileSync(path.join(app, "icon.svg"));

async function png(size) {
  return sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
}

(async () => {
  const sizes = [16, 32, 48];
  const pngs = await Promise.all(sizes.map(png));
  // ICO container with PNG-encoded images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = 6 + 16 * sizes.length;
  const entries = sizes.map((s, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(s, 0);
    e.writeUInt8(s, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(pngs[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += pngs[i].length;
    return e;
  });
  fs.writeFileSync(path.join(app, "favicon.ico"), Buffer.concat([header, ...entries, ...pngs]));
  fs.writeFileSync(path.join(app, "apple-icon.png"), await png(180));
  console.log("favicon.ico + apple-icon.png written");
})();
