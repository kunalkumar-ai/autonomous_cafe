import { AgentRole } from '@/types/cafe'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function streamAgentMessage(
  agentRole: AgentRole,
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<string> {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentRole, messages }),
  })

  if (!response.body) throw new Error('No stream body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const lines = decoder.decode(value).split('\n')
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') return fullText
      try {
        const { text } = JSON.parse(data)
        onChunk(text)
        fullText += text
      } catch {}
    }
  }

  return fullText
}
