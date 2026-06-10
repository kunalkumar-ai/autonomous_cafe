'use client'
import { motion } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'
import { OrderStage } from '@/types/cafe'

const STAGES: { key: OrderStage; label: string }[] = [
  { key: 'greeting', label: 'Welcome' },
  { key: 'ordering', label: 'Order' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'making_coffee', label: 'Brewing' },
  { key: 'coffee_ready', label: 'Ready' },
  { key: 'payment', label: 'Payment' },
  { key: 'complete', label: '✓ Done' },
]

export function OrderStatusBar() {
  const { order } = useCafeState()
  if (!order || order.stage === 'idle') return null
  const idx = STAGES.findIndex((s) => s.key === order.stage)

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1"
      style={{ backdropFilter: 'blur(8px)' }}>
      {STAGES.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <motion.div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: i === idx ? '#c8922a' : i < idx ? '#4a7c59' : 'rgba(26,15,10,0.8)',
              color: i <= idx ? '#fff' : '#5a3820',
              border: `1px solid ${i === idx ? '#c8922a' : i < idx ? '#4a7c59' : '#3d2510'}`,
            }}
            animate={i === idx ? { scale: [1, 1.06, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {s.label}
          </motion.div>
          {i < STAGES.length - 1 && (
            <div className="w-3 h-px mx-0.5" style={{ backgroundColor: i < idx ? '#4a7c59' : '#3d2510' }} />
          )}
        </div>
      ))}
    </div>
  )
}
