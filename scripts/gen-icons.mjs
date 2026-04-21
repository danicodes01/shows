import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { join } from 'path'

const logoData = readFileSync(
  join(process.cwd(), 'public', 'images', 'logo.PNG'),
).toString('base64')
const logoUrl = `data:image/png;base64,${logoData}`

const BG = '#0B0D12'
const FG = '#FFFFFF'

function maskedLogo(size) {
  return `
<div style="
  width:${size}px;height:${size}px;
  background-color:${FG};
  -webkit-mask-image:url('${logoUrl}');
  -webkit-mask-size:contain;
  -webkit-mask-repeat:no-repeat;
  -webkit-mask-position:center;
  mask-image:url('${logoUrl}');
  mask-size:contain;
  mask-repeat:no-repeat;
  mask-position:center;
"></div>`
}

async function screenshot(width, height, bodyHtml, outPath) {
  const html = `
<!doctype html><html><body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:${FG};">
  ${bodyHtml}
</body></html>`
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width, height },
    // Render at 2x so strokes don't look soft — matches how the live site
    // renders on retina displays.
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  await page.setContent(html)
  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width, height },
  })
  await browser.close()
}

async function renderIcon(size, padPct, outPath) {
  const padding = Math.round(size * padPct)
  const inner = size - padding * 2
  const body = `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">${maskedLogo(inner)}</div>`
  await screenshot(size, size, body, outPath)
}

async function renderOg(outPath) {
  const body = `
<div style="
  width:1200px;height:630px;
  display:flex;align-items:center;justify-content:center;
  background:${BG};
">
  ${maskedLogo(440)}
</div>`
  await screenshot(1200, 630, body, outPath)
}

await renderIcon(256, 0.14, 'app/icon.png')
await renderIcon(180, 0.22, 'app/apple-icon.png')
await renderOg('app/opengraph-image.png')
console.log('icons + og written')
