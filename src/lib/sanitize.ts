/**
 * Minimal HTML allow-list for rich text authored in the question editor.
 * The editor produces markup locally, but content also arrives from the API,
 * so it is sanitised again before ever being rendered.
 */
const ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'BR', 'P', 'DIV', 'SPAN',
  'UL', 'OL', 'LI', 'A', 'IMG', 'HR', 'SUB', 'SUP', 'CODE', 'BLOCKQUOTE',
])

const ALLOWED_ATTRS: Record<string, string[]> = {
  A: ['href', 'target', 'rel'],
  IMG: ['src', 'alt'],
  SPAN: ['style'],
  P: ['style'],
  DIV: ['style'],
}

/** Only text-alignment declarations survive, so styles cannot be weaponised. */
const SAFE_STYLE = /^(text-align:\s*(left|right|center|justify);?\s*)+$/i

function isSafeUrl(value: string) {
  const trimmed = value.trim().toLowerCase()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('data:image/')
  )
}

export function sanitizeHtml(html: string): string {
  if (!html) return ''
  const template = document.createElement('template')
  template.innerHTML = html

  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // Keep the text, drop the element.
        child.replaceWith(...child.childNodes)
        continue
      }

      const allowed = ALLOWED_ATTRS[child.tagName] ?? []
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase()
        if (!allowed.includes(name)) {
          child.removeAttribute(attr.name)
          continue
        }
        if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) {
          child.removeAttribute(attr.name)
        }
        if (name === 'style' && !SAFE_STYLE.test(attr.value)) {
          child.removeAttribute(attr.name)
        }
      }

      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank')
        child.setAttribute('rel', 'noopener noreferrer')
      }

      walk(child)
    }
  }

  walk(template.content as unknown as Element)
  return template.innerHTML
}
