'use client'
import { motion } from 'framer-motion'
import { Message } from '@/types/cafe'

const AGENT_COLORS: Record<string, string> = {
  receptionist: '#c8922a',
  barista: '#4a9eff',
  payment: '#4a7c59',
}

const AGENT_NAMES: Record<string, string> = {
  receptionist: 'MIA',
  barista: 'ROBO-1',
  payment: 'PAY-BOT',
}

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const color = message.agentRole ? AGENT_COLORS[message.agentRole] : '#7a5c3a'
  const name = message.agentRole ? AGENT_NAMES[message.agentRole] : 'YOU'

  const display = message.content
    .replace(/\[ORDER_CONFIRMED:[^\]]+\]/g, '')
    .replace(/\[STEP:\w+\]/g, '')
    .replace(/\[PAYMENT_COMPLETE\]/g, '')
    .trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}
    >
      <span className="text-xs font-bold px-1" style={{ color }}>
        {name}
      </span>
      <div
        className="max-w-xs px-4 py-2.5 text-sm leading-relaxed"
        style={{
          backgroundColor: isUser ? '#3d2510' : '#1a1208',
          color: '#f0e6d3',
          border: `1px solid ${isUser ? '#5a3820' : color + '30'}`,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}
      >
        {display}
      </div>
    </motion.div>
  )
}
