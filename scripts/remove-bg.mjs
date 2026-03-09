import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const spritesDir = join(__dirname, '../public/sprites')

const files = readdirSync(spritesDir).filter(f => f.endsWith('.png'))

for (const file of files) {
  const input = join(spritesDir, file)
  const output = join(spritesDir, file) // overwrite in place

  const image = sharp(input)
  const { width, height } = await image.metadata()

  // Get raw RGBA pixel data
  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = Buffer.from(data)
  const total = width * height

  for (let i = 0; i < total; i++) {
    const offset = i * 4
    const r = pixels[offset]
    const g = pixels[offset + 1]
    const b = pixels[offset + 2]

    // "Grayish" = R, G, B all close together AND not a warm fire color
    // Fire is orange/yellow: R >> G >> B, so skip pixels where R >> G
    const isGray = Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30
    const isBright = r > 80 || g > 80 || b > 80

    if (isGray && isBright) {
      // Make transparent — blend based on how "gray" it is
      // More gray = more transparent
      const grayness = 1 - Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) / 30
      pixels[offset + 3] = Math.round(pixels[offset + 3] * (1 - grayness))
    }
  }

  await sharp(pixels, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toFile(output)

  console.log(`✓ ${file} — ${width}×${height}`)
}

console.log('\nDone. Sprites have transparent backgrounds.')
