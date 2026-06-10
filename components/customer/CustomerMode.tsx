'use client'
import { CafeScene3D } from '@/components/scene/CafeScene3D'
import { AgentChat } from './AgentChat'

export function CustomerMode() {
  return (
    <div className="w-full h-full flex">
      <div className="flex-1">
        <CafeScene3D allowOrbit={false} />
      </div>
      <div className="w-96 flex-shrink-0">
        <AgentChat />
      </div>
    </div>
  )
}
