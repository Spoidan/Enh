/**
 * Run with: node scripts/generate-icons.js
 * Generates placeholder PWA icons (192x192 and 512x512 PNG)
 * Requires: npm install canvas (optional, uses fallback SVG if not available)
 */

const fs = require('fs')
const path = require('path')

const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

// Try to use canvas for real PNG generation
try {
  const { createCanvas } = require('canvas')

  function generateIcon(size) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#2563eb'
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, size * 0.18)
    ctx.fill()

    // School icon (simplified)
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'white'
    ctx.lineWidth = size * 0.05
    ctx.lineCap = 'round'

    const cx = size / 2
    const cy = size / 2

    // Circle (head)
    ctx.beginPath()
    ctx.arc(cx, cy * 0.65, size * 0.1, 0, Math.PI * 2)
    ctx.fill()

    // Lines
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.2, cy)
    ctx.lineTo(cx + size * 0.2, cy)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(cx - size * 0.2, cy + size * 0.1)
    ctx.lineTo(cx + size * 0.15, cy + size * 0.1)
    ctx.stroke()

    return canvas.toBuffer('image/png')
  }

  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), generateIcon(192))
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), generateIcon(512))
  console.log('✓ Generated icon-192.png and icon-512.png')
} catch {
  // Fallback: copy SVG as placeholder note
  console.log('⚠ canvas not available. PNG icons not generated.')
  console.log('  To generate PNG icons, run: npm install canvas && node scripts/generate-icons.js')
  console.log('  Or upload a real logo in the Établissement settings page.')
}
