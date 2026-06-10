'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'

export function Grinder() {
  const { order } = useCafeState()
  const isGrinding = order?.coffeeStep === 'grinding'
  const hopperRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (hopperRef.current && isGrinding) {
      hopperRef.current.rotation.y += 0.08
    }
  })

  return (
    <group position={[-0.8, 1.1, -3.3]}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.5, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={hopperRef} position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.3, 8]} />
        <meshStandardMaterial
          color={isGrinding ? '#c8922a' : '#222'}
          metalness={0.6}
          roughness={0.4}
          emissive={isGrinding ? '#c8922a' : '#000'}
          emissiveIntensity={isGrinding ? 0.3 : 0}
        />
      </mesh>
      <mesh position={[0, -0.1, 0.15]}>
        <cylinderGeometry args={[0.04, 0.06, 0.2, 8]} />
        <meshStandardMaterial color="#333" metalness={0.7} />
      </mesh>
    </group>
  )
}
