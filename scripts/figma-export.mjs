import fs from 'node:fs/promises'
import path from 'node:path'

function parseArgs(argv) {
  const out = {}
  for (let i = 2; i < argv.length; i += 1) {
    const raw = argv[i]
    if (!raw.startsWith('--')) continue
    const [k, v] = raw.slice(2).split('=')
    out[k] = v ?? true
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv)
  const token = process.env.FIGMA_TOKEN

  if (!token) {
    throw new Error('Missing FIGMA_TOKEN env var.')
  }

  const fileKey = args.fileKey || args.file || 'jE7vS4IJZjw2Ivj8Auyy1k'
  const ids = args.ids || args.id || '692-2519'
  const outPath = args.out || args.output || ''

  const url = new URL(`https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}`)
  url.searchParams.set('ids', ids)

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Figma API error: ${res.status} ${res.statusText}${text ? `\n${text}` : ''}`)
  }

  const data = await res.json()
  const json = JSON.stringify(data, null, 2)

  if (outPath) {
    const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
    await fs.mkdir(path.dirname(abs), { recursive: true })
    await fs.writeFile(abs, json, 'utf8')
  } else {
    process.stdout.write(json)
  }
}

main().catch((err) => {
  process.stderr.write(String(err?.stack || err?.message || err))
  process.stderr.write('\n')
  process.exit(1)
})
