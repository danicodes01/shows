function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderInline(s: string): string {
  let out = escapeHtml(s)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    return `<a href="${url}" style="color:#BF5AF2;text-decoration:underline;font-weight:600;">${text}</a>`
  })
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  return out
}

export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/)
  const blocks: string[] = []
  let paragraph: string[] = []
  let list: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p style="margin:0 0 16px 0;line-height:1.6;">${renderInline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      const items = list.map((li) => `<li style="margin-bottom:8px;">${renderInline(li)}</li>`).join('')
      blocks.push(`<ul style="margin:0 0 16px 0;padding-left:20px;line-height:1.6;">${items}</ul>`)
      list = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.+)$/)
    if (h) {
      flushParagraph()
      flushList()
      const level = h[1].length
      const size = level === 1 ? 28 : level === 2 ? 22 : 18
      blocks.push(
        `<h${level} style="margin:24px 0 12px 0;font-size:${size}px;line-height:1.2;">${renderInline(h[2])}</h${level}>`,
      )
      continue
    }
    const li = line.match(/^\s*[-*]\s+(.+)$/)
    if (li) {
      flushParagraph()
      if (!list) list = []
      list.push(li[1])
      continue
    }
    paragraph.push(line)
  }
  flushParagraph()
  flushList()

  return blocks.join('\n')
}

export function markdownToPlainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
}

export function wrapEmailHtml(innerHtml: string, unsubscribeUrl?: string): string {
  const unsubscribe = unsubscribeUrl
    ? `<p style="margin:24px 0 0 0;font-size:12px;color:#8a8a8e;">You're receiving this because you subscribed at distortnewyork.com. <a href="${unsubscribeUrl}" style="color:#8a8a8e;">Unsubscribe</a>.</p>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;color:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
      <tr>
        <td style="padding:32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;">
            <tr><td align="left" style="padding-bottom:24px;line-height:0;font-size:0;background-color:#ffffff;">
              <a href="https://distortnewyork.com" style="text-decoration:none;border:0;outline:none;display:inline-block;line-height:0;font-size:0;">
                <img src="cid:distort-logo" alt="DistortNewYork" width="100" style="display:block;max-width:100px;height:auto;border:0;outline:none;vertical-align:top;" />
              </a>
            </td></tr>
            <tr><td style="color:#111;font-size:16px;line-height:1.6;background-color:#ffffff;">
              ${innerHtml}
              ${unsubscribe}
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
