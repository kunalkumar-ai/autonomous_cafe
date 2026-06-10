'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'

export function CoffeeMachine() {
  const { order } = useCafeState()
  const step = order?.coffeeStep
  const leverRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!leverRef.current) return
    const target = step === 'pulling_espresso' ? -0.3 : 0
    leverRef.current.rotation.z = THREE.MathUtils.lerp(
      leverRef.current.rotation.z, target, 0.05
    )
  })

  return (
    <group position={[0.8, 1.1, -3.3]}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 0.65, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.72, 0.05, 0.52]} />
        <meshStandardMaterial color="#111" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, -0.05, 0.27]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial color="#222" metalness={0.8} />
      </mesh>
      <mesh ref={leverRef} position={[0.28, 0.1, 0.1]} castShadow>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.38, 0.2]}>
        <boxGeometry args={[0.5, 0.04, 0.2]} />
        <meshStandardMaterial color="#333" metalness={0.9} />
      </mesh>
      <mesh position={[-0.28, 0.2, 0.26]}>
        <sphereGeometry args={[0.025]} />
        <meshStandardMaterial
          color={step === 'pulling_espresso' ? '#ff6600' : '#004400'}
          emissive={step === 'pulling_espresso' ? '#ff6600' : '#00ff00'}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}
