'use client'
import { useCafeState } from '@/lib/cafe-state'
import { CafeScene3D } from './scene/CafeScene3D'
import { CustomerMode } from './customer/CustomerMode'
import { ViewToggle } from './ui/ViewToggle'
import { OrderStatusBar } from './ui/OrderStatusBar'

export function CafeApp() {
  const { viewMode } = useCafeState()

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      {viewMode === 'god' ? <CafeScene3D allowOrbit={true} /> : <CustomerMode />}
      <ViewToggle />
      <OrderStatusBar />
    </div>
  )
}
