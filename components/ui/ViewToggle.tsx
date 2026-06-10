'use client'
import { motion } from 'framer-motion'
import { useCafeState } from '@/lib/cafe-state'

export function ViewToggle() {
  const { viewMode, setViewMode, startOrder, order, resetCafe } = useCafeState()

  return (
    <div className="absolute top-5 right-5 z-10 flex flex-col items-end gap-2">
      <div className="flex rounded-full p-1 gap-1" style={{ backgroundColor: 'rgba(26,15,10,0.85)', border: '1px solid #3d2510', backdropFilter: 'blur(8px)' }}>
        {(['god', 'customer'] as const).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              backgroundColor: viewMode === mode ? '#c8922a' : 'transparent',
              color: viewMode === mode ? '#0d0805' : '#7a5c3a',
            }}>
            {mode === 'god' ? '👁 GOD VIEW' : '🚶 CUSTOMER'}
          </button>
        ))}
      </div>

      {viewMode === 'customer' && (
        <motion.button
          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          onClick={order ? resetCafe : startOrder}
          className="px-5 py-2 rounded-full text-sm font-bold"
          style={{
            backgroundColor: order ? 'rgba(26,15,10,0.85)' : '#c8922a',
            color: order ? '#f0e6d3' : '#0d0805',
            border: `1px solid ${order ? '#5a3820' : '#c8922a'}`,
            backdropFilter: 'blur(8px)',
          }}>
          {order ? '↩ Reset' : '☕ Enter Cafe'}
        </motion.button>
      )}
    </div>
  )
}
