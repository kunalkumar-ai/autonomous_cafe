'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { CafeEnvironment } from './CafeEnvironment'
import { BarCounter } from './BarCounter'
import { RobotBarista } from './RobotBarista'
import { CoffeeMachine } from './CoffeeMachine'
import { Grinder } from './Grinder'
import { CoffeeCup } from './CoffeeCup'
import { ReceptionDesk } from './ReceptionDesk'
import { PaymentTerminal } from './PaymentTerminal'
import { useCafeState } from '@/lib/cafe-state'

interface Props {
  allowOrbit?: boolean
}

export function CafeScene3D({ allowOrbit = true }: Props) {
  const { viewMode } = useCafeState()

  const cameraPos: [number, number, number] = viewMode === 'god'
    ? [0, 6, 9]
    : [0, 2.2, 7]

  return (
    <Canvas
      shadows
      camera={{ position: cameraPos, fov: 50, near: 0.1, far: 100 }}
      style={{ background: '#0d0805' }}
    >
      <Suspense fallback={null}>
        <CafeEnvironment />
        <BarCounter />
        <RobotBarista />
        <CoffeeMachine />
        <Grinder />
        <CoffeeCup />
        <ReceptionDesk />
        <PaymentTerminal />

        {allowOrbit && viewMode === 'god' && (
          <OrbitControls
            target={[0, 1, -2]}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={4}
            maxDistance={16}
            enablePan={false}
          />
        )}
      </Suspense>
    </Canvas>
  )
}
