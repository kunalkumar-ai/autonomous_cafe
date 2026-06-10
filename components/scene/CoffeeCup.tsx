'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'

const STEP_FILL: Record<string, number> = {
  grinding: 0,
  tamping: 0,
  pulling_espresso: 0.3,
  steaming_milk: 0.6,
  pouring: 0.9,
  done: 1.0,
}

export function CoffeeCup() {
  const { order } = useCafeState()
  const step = order?.coffeeStep
  const fillRef = useRef<THREE.Mesh>(null)
  const targetFill = step ? (STEP_FILL[step] ?? 0) : 0

  useFrame(() => {
    if (!fillRef.current) return
    const mat = fillRef.current.material as THREE.MeshStandardMaterial
    const currentScale = fillRef.current.scale.y
    fillRef.current.scale.y = THREE.MathUtils.lerp(currentScale, targetFill, 0.04)
    fillRef.current.position.y = -0.08 + fillRef.current.scale.y * 0.08
    mat.color.lerp(
      new THREE.Color(step === 'done' ? '#8B4513' : '#3d1a08'),
      0.05
    )
  })

  return (
    <group position={[0, 1.1, -3.0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.16, 16]} />
        <meshStandardMaterial color="#f0e6d3" roughness={0.9} />
      </mesh>
      <mesh ref={fillRef} position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.063, 0.048, 0.16, 16]} />
        <meshStandardMaterial color="#3d1a08" roughness={1} />
      </mesh>
      <mesh position={[0.09, 0, 0]}>
        <torusGeometry args={[0.035, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f0e6d3" roughness={0.9} />
      </mesh>
      {step === 'done' && (
        <pointLight position={[0, 0.3, 0]} color="#c8922a" intensity={0.5} distance={1} />
      )}
    </group>
  )
}
