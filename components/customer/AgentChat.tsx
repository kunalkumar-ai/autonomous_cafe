'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'
import { MessageBubble } from './MessageBubble'
import { streamAgentMessage, ChatMessage } from '@/lib/stream-agent'
import { Message, AgentRole } from '@/types/cafe'
import { parseOrderConfirmation } from '@/lib/agents/receptionist'
import { parseCoffeeStep } from '@/lib/agents/barista'
import { parsePaymentComplete, calculateTotal } from '@/lib/agents/payment'

function buildHistory(messages: Message[], role: AgentRole): ChatMessage[] {
  return messages
    .filter((m) => m.agentRole === role || m.role === 'user')
    .map((m) => ({ role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content }))
}

export function AgentChat() {
  const store = useCafeState()
  const [input, setInput] = useState('')
  const [streamText, setStreamText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [store.messages, streamText])

  const callAgent = useCallback(async (role: AgentRole, userText: string, extraHistory?: ChatMessage[]) => {
    if (useCafeState.getState().isAgentTyping) return
    store.setAgentTyping(true)
    setStreamText('')

    const history = extraHistory ?? buildHistory(useCafeState.getState().messages, role)
    if (userText) history.push({ role: 'user', content: userText })

    let full = ''
    try {
      full = await streamAgentMessage(role, history, (chunk) => {
        setStreamText((p) => p + chunk)
      })
    } finally {
      setStreamText('')
      store.setAgentTyping(false)
    }

    store.addMessage({ id: crypto.randomUUID(), role: 'agent', agentRole: role, content: full, timestamp: Date.now() })

    if (role === 'receptionist') {
      const confirmed = parseOrderConfirmation(full)
      if (confirmed) {
        store.setOrderDetails(confirmed.name, confirmed.items)
        store.updateOrderStage('confirmed')
        store.setActiveAgent('barista')
        setTimeout(() => startBarista(confirmed.items), 600)
      } else {
        store.updateOrderStage('ordering')
      }
    }

    if (role === 'barista') {
      const step = parseCoffeeStep(full)
      if (step === 'done') {
        store.updateOrderStage('coffee_ready')
        store.updateCoffeeStep('done')
        store.setActiveAgent('payment')
        const items = useCafeState.getState().order?.items ?? []
        setTimeout(() => callAgent('payment', `Order complete: ${items.join(', ')}. Calculate total and request payment.`), 700)
      } else if (step) {
        store.updateOrderStage('making_coffee')
        store.updateCoffeeStep(step)
        setTimeout(() => continueBarista(), 2800)
      }
    }

    if (role === 'payment') {
      if (parsePaymentComplete(full)) {
        store.updateOrderStage('complete')
        store.setActiveAgent(null)
        const items = useCafeState.getState().order?.items ?? []
        store.setOrderTotal(calculateTotal(items))
      } else {
        store.updateOrderStage('payment')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startBarista(items: string[]) {
    await callAgent('barista', '', [
      { role: 'user', content: `New order received: ${items.join(', ')}. Begin making the coffee, start with the first step.` },
    ])
  }

  async function continueBarista() {
    const state = useCafeState.getState()
    if (state.order?.stage === 'coffee_ready' || state.order?.stage === 'payment') return
    const history = buildHistory(state.messages, 'barista')
    history.push({ role: 'user', content: 'Continue to the next step.' })
    await callAgent('barista', '', history)
  }

  useEffect(() => {
    const state = useCafeState.getState()
    if (state.order && state.messages.length === 0 && state.activeAgent === 'receptionist') {
      callAgent('receptionist', '', [{ role: 'user', content: 'A customer just walked in. Greet them warmly.' }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.order?.id])

  async function handleSend() {
    if (!input.trim() || !store.activeAgent || store.isAgentTyping) return
    const text = input.trim()
    setInput('')
    store.addMessage({ id: crypto.randomUUID(), role: 'user', content: text, timestamp: Date.now() })
    await callAgent(store.activeAgent, text)
  }

  const agentName = store.activeAgent === 'receptionist' ? 'MIA'
    : store.activeAgent === 'barista' ? 'ROBO-1'
    : store.activeAgent === 'payment' ? 'PAY-BOT' : null

  const canType = !!store.activeAgent
    && store.order?.stage !== 'making_coffee'
    && store.order?.stage !== 'complete'
    && store.order?.stage !== 'confirmed'

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0a0603', borderLeft: '1px solid #2a1a0d' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #2a1a0d' }}>
        <div>
          <div className="font-bold text-sm" style={{ color: '#f5d07a' }}>Brew & Bits</div>
          {agentName && <div className="text-xs mt-0.5" style={{ color: '#c8922a' }}>with {agentName}</div>}
        </div>
        {store.order?.stage === 'complete' && (
          <div className="text-xs px-3 py-1 rounded-full font-bold" style={{ backgroundColor: '#4a7c59', color: '#fff' }}>
            ✓ DONE
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {store.messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        </AnimatePresence>

        {streamText && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1 items-start">
            <span className="text-xs font-bold px-1" style={{ color: '#c8922a' }}>{agentName}</span>
            <div className="max-w-xs px-4 py-2.5 text-sm leading-relaxed"
              style={{ backgroundColor: '#1a1208', color: '#f0e6d3', border: '1px solid rgba(200,146,42,0.2)', borderRadius: '16px 16px 16px 4px' }}>
              {streamText.replace(/\[ORDER_CONFIRMED:[^\]]+\]/g, '').replace(/\[STEP:\w+\]/g, '').replace(/\[PAYMENT_COMPLETE\]/g, '')}
              <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>▋</motion.span>
            </div>
          </motion.div>
        )}

        {store.isAgentTyping && !streamText && (
          <div className="flex gap-1 px-2">
            {[0,1,2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c8922a' }}
                animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-4" style={{ borderTop: '1px solid #2a1a0d' }}>
        {canType ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Say something..."
              disabled={store.isAgentTyping}
              className="flex-1 px-4 py-2 rounded-full text-sm outline-none disabled:opacity-40"
              style={{ backgroundColor: '#1a1208', color: '#f0e6d3', border: '1px solid #2a1a0d' }}
            />
            <button onClick={handleSend} disabled={store.isAgentTyping || !input.trim()}
              className="w-10 h-10 rounded-full font-bold flex items-center justify-center disabled:opacity-40"
              style={{ backgroundColor: '#c8922a', color: '#0d0805' }}>
              ↑
            </button>
          </div>
        ) : store.order?.stage === 'making_coffee' ? (
          <p className="text-xs text-center" style={{ color: '#7a5c3a' }}>☕ ROBO-1 is making your coffee...</p>
        ) : store.order?.stage === 'complete' ? (
          <p className="text-xs text-center" style={{ color: '#4a7c59' }}>Thanks for visiting! Come back soon ✨</p>
        ) : (
          <p className="text-xs text-center" style={{ color: '#5a3820' }}>Click "Enter Cafe" to start</p>
        )}
      </div>
    </div>
  )
}
