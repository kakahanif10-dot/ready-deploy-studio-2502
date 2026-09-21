// Direct Google Gemini API client (no gateway, no SDK abstraction).
// Auth uses VITE_GEMINI_API_KEY so Vercel/Lovable env vars are read as-is.

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export type GeminiTurn = { role: 'user' | 'assistant'; content: string }

export function geminiApiKey(): string {
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>
  // Server runtime env first (set GEMINI_API_KEY on Vercel), then the
  // build-time inlined VITE_ vars as fallback.
  return (
    env['GEMINI_API_KEY'] ||
    env['GOOGLE_API_KEY'] ||
    env['VITE_GEMINI_API_KEY'] ||
    import.meta.env.VITE_GEMINI_API_KEY ||
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

// Free-tier key safety net: some model ids are retired (404) or have a tiny
// daily quota (429). Map them onto models that still work on a free key so the
// agents keep answering without editing every call site.
const MODEL_ALIASES: Record<string, string> = {
  'gemini-2.5-flash': 'gemini-3.5-flash',
  'gemini-2.5-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.6-flash': 'gemini-3.5-flash',
  'gemini-flash-latest': 'gemini-flash-lite-latest',
}

function resolveModel(model: string): string {
  return MODEL_ALIASES[model] ?? model
}

async function callGemini(path: string, opts: GeminiOptions, query = '') {
  const key = geminiApiKey()
  if (!key) throw new Error('Missing VITE_GEMINI_API_KEY')

  const res = await fetch(`${API_BASE}/${resolveModel(opts.model)}:${path}${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key,
    },
    body: JSON.stringify(buildBody(opts)),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[purple] Gemini ${opts.model} ${path} -> ${res.status}: ${detail.slice(0, 300)}`)
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
