// Direct Google Gemini API client (no gateway, no SDK abstraction).
// Auth uses VITE_GEMINI_API_KEY so Vercel/Lovable env vars are read as-is.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export type GeminiTurn = { role: 'user' | 'assistant'; content: string }

export function geminiApiKey(): string {
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>
  return (
    env['VITE_GEMINI_API_KEY'] ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    env['GEMINI_API_KEY'] ||
    ''
  )
}

type GeminiOptions = {
  model: string
  system?: string
  messages: GeminiTurn[]
  temperature?: number
  topP?: number
  maxOutputTokens?: number
}

function buildBody(opts: GeminiOptions) {
  return {
    contents: opts.messages
      .filter((m) => typeof m.content === 'string' && m.content.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    generationConfig: {
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      ...(opts.topP !== undefined ? { topP: opts.topP } : {}),
      ...(opts.maxOutputTokens !== undefined ? { maxOutputTokens: opts.maxOutputTokens } : {}),
    },
  }
}

async function callGemini(path: string, opts: GeminiOptions, query = '') {
  const key = geminiApiKey()
  if (!key) throw new Error('Missing VITE_GEMINI_API_KEY')

  const res = await fetch(`${API_BASE}/${opts.model}:${path}${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(buildBody(opts)),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`)
  }
  return res
}

function extractText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ''
  return parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).join('')
}

// One-shot generation — returns the full text.
export async function geminiGenerateText(opts: GeminiOptions): Promise<string> {
  const res = await callGemini('generateContent', opts)
  return extractText(await res.json())
}

// Streaming generation — yields text deltas as they arrive (SSE).
export async function* geminiStreamText(opts: GeminiOptions): AsyncGenerator<string> {
  const res = await callGemini('streamGenerateContent', opts, '?alt=sse')
  if (!res.body) return

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let index: number
    while ((index = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const text = extractText(JSON.parse(data))
        if (text) yield text
      } catch {
        // Ignore partial/non-JSON keepalive frames.
      }
    }
  }
}
