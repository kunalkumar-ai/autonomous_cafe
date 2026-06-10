'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'

export function ReceptionDesk() {
  const { activeAgent } = useCafeState()
  const isActive = activeAgent === 'receptionist'
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive
        ? 0.4 + Math.sin(Date.now() * 0.003) * 0.2
        : 0.05
    }
  })

  return (
    <group position={[-5, 0, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[2, 1.2, 1]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.21, 0]} castShadow>
        <boxGeometry args={[2, 0.05, 1]} />
        <meshStandardMaterial color="#3d2510" roughness={0.3} metalness={0.1} />
      </mesh>
      <group position={[0, 1.8, -0.3]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.28, 0.4, 0.18]} />
          <meshStandardMaterial color="#c8922a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.35, 0]} castShadow>
          <sphereGeometry args={[0.14]} />
          <meshStandardMaterial color="#f0c8a0" roughness={0.8} />
        </mesh>
        <mesh ref={glowRef} position={[0, -0.05, 0.12]} castShadow>
          <boxGeometry args={[0.18, 0.22, 0.02]} />
          <meshStandardMaterial
            color="#4a9eff"
            emissive="#4a9eff"
            emissiveIntensity={isActive ? 0.6 : 0.1}
          />
        </mesh>
      </group>
      {isActive && (
        <pointLight position={[0, 2.5, 0]} color="#c8922a" intensity={1.5} distance={3} />
      )}
    </group>
  )
}
