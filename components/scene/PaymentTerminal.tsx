'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'

export function PaymentTerminal() {
  const { activeAgent, order } = useCafeState()
  const isActive = activeAgent === 'payment'
  const screenRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isActive
        ? 0.5 + Math.sin(Date.now() * 0.004) * 0.2
        : 0.08
    }
  })

  return (
    <group position={[5, 0, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#1a0f0a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.12]} />
        <meshStandardMaterial color="#1a0f0a" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={screenRef} position={[0, 1.4, 0.07]}>
        <boxGeometry args={[0.42, 0.58, 0.01]} />
        <meshStandardMaterial
          color={order?.stage === 'complete' ? '#4a7c59' : '#4a9eff'}
          emissive={order?.stage === 'complete' ? '#4a7c59' : '#4a9eff'}
          emissiveIntensity={isActive ? 0.5 : 0.08}
        />
      </mesh>
      <group position={[0, 2.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.3, 0.16]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.27, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        {[-0.05, 0.05].map((x, i) => (
          <mesh key={i} position={[x, 0.28, 0.09]}>
            <sphereGeometry args={[0.025]} />
            <meshStandardMaterial
              color={isActive ? '#4a9eff' : '#1a2a3a'}
              emissive={isActive ? '#4a9eff' : '#000'}
              emissiveIntensity={isActive ? 1 : 0}
            />
          </mesh>
        ))}
      </group>
      {isActive && (
        <pointLight position={[0, 2.5, 0]} color="#4a9eff" intensity={1.5} distance={3} />
      )}
    </group>
  )
}
