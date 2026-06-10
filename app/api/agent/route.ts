import { NextRequest } from 'next/server'
import { openai } from '@/lib/openai'
import { RECEPTIONIST_SYSTEM_PROMPT } from '@/lib/agents/receptionist'
import { BARISTA_SYSTEM_PROMPT } from '@/lib/agents/barista'
import { PAYMENT_SYSTEM_PROMPT } from '@/lib/agents/payment'
import { AgentRole } from '@/types/cafe'

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  receptionist: RECEPTIONIST_SYSTEM_PROMPT,
  barista: BARISTA_SYSTEM_PROMPT,
  payment: PAYMENT_SYSTEM_PROMPT,
}

export async function POST(req: NextRequest) {
  const { agentRole, messages } = await req.json()
  const systemPrompt = SYSTEM_PROMPTS[agentRole as AgentRole]
  if (!systemPrompt) return new Response('Unknown agent role', { status: 400 })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gptStream = await openai.chat.completions.create({
          model: 'gpt-4o',
          max_tokens: 200,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        })

        for await (const chunk of gptStream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
