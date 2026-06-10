'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCafeState } from '@/lib/cafe-state'
import { CoffeeStep } from '@/types/cafe'

const ARM_TARGETS: Record<CoffeeStep, { rx: number; rz: number }> = {
  grinding:         { rx: -0.4, rz:  0.6 },
  tamping:          { rx: -0.8, rz:  0.0 },
  pulling_espresso: { rx: -0.3, rz: -0.2 },
  steaming_milk:    { rx: -0.5, rz: -0.5 },
  pouring:          { rx: -0.6, rz:  0.1 },
  done:             { rx:  0.0, rz:  0.0 },
}

const REST = { rx: 0, rz: 0 }

export function RobotBarista() {
  const { activeAgent, order } = useCafeState()
  const isActive = activeAgent === 'barista'
  const step = order?.coffeeStep

  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const rightArmGroupRef = useRef<THREE.Group>(null)
  const leftEyeRef = useRef<THREE.Mesh>(null)
  const rightEyeRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const target = step ? (ARM_TARGETS[step] ?? REST) : REST

    if (rightArmGroupRef.current) {
      rightArmGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmGroupRef.current.rotation.x, target.rx, 0.06
      )
      rightArmGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        rightArmGroupRef.current.rotation.z, target.rz, 0.06
      )
    }

    if (step === 'grinding' && rightArmGroupRef.current) {
      rightArmGroupRef.current.rotation.x += Math.sin(Date.now() * 0.005) * 0.02
    }

    if (step === 'tamping' && rightArmGroupRef.current) {
      rightArmGroupRef.current.position.y = -0.18 + Math.sin(Date.now() * 0.004) * 0.04
    } else if (rightArmGroupRef.current) {
      rightArmGroupRef.current.position.y = THREE.MathUtils.lerp(
        rightArmGroupRef.current.position.y, -0.18, 0.06
      )
    }

    if (headRef.current && isActive) {
      headRef.current.position.y = 0.52 + Math.sin(Date.now() * 0.002) * 0.01
    }

    if (bodyRef.current && isActive) {
      bodyRef.current.rotation.y = Math.sin(Date.now() * 0.0008) * 0.05
    }

    const eyeColor = step === 'done'
      ? new THREE.Color('#00ff88')
      : isActive
      ? new THREE.Color('#4a9eff')
      : new THREE.Color('#1a2a3a')

    ;[leftEyeRef, rightEyeRef].forEach((ref) => {
      if (ref.current) {
        const mat = ref.current.material as THREE.MeshStandardMaterial
        mat.emissive.lerp(eyeColor, 0.1)
        mat.emissiveIntensity = isActive ? 0.8 + Math.sin(Date.now() * 0.003) * 0.2 : 0.1
      }
    })
  })

  return (
    <group ref={bodyRef} position={[0, 1.1, -3.6]}>
      {/* TORSO */}
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.5, 0.28]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.05, 0.145]}>
        <boxGeometry args={[0.22, 0.18, 0.01]} />
        <meshStandardMaterial
          color="#1a2a3a"
          emissive="#4a9eff"
          emissiveIntensity={isActive ? 0.4 : 0.05}
        />
      </mesh>

      {/* HEAD */}
      <mesh ref={headRef} position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.3, 0.28, 0.26]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.52, 0.135]}>
        <boxGeometry args={[0.24, 0.1, 0.01]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#4a9eff" emissiveIntensity={isActive ? 0.3 : 0.05} />
      </mesh>
      <mesh ref={leftEyeRef} position={[-0.07, 0.54, 0.135]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#4a9eff" emissive="#4a9eff" emissiveIntensity={0.1} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.07, 0.54, 0.135]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color="#4a9eff" emissive="#4a9eff" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshStandardMaterial color="#555" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.79, 0]}>
        <sphereGeometry args={[0.025]} />
        <meshStandardMaterial
          color="#c8922a"
          emissive="#c8922a"
          emissiveIntensity={isActive ? 0.8 : 0.1}
        />
      </mesh>

      {/* LEFT ARM (static) */}
      <group position={[-0.24, 0.1, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.32, 0.04]} castShadow>
          <boxGeometry args={[0.09, 0.22, 0.09]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* RIGHT ARM (animated) */}
      <group ref={rightArmGroupRef} position={[0.24, -0.18, 0]}>
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.1, 0.28, 0.1]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshStandardMaterial color="#3a4a5a" metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.44, 0]} castShadow>
          <boxGeometry args={[0.09, 0.22, 0.09]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.8} roughness={0.2} />
        </mesh>
        <group position={[0, -0.58, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.08, 0.13]} />
            <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
          </mesh>
          {[-0.04, 0.04].map((x, i) => (
            <mesh key={i} position={[x, -0.06, 0.04]} castShadow>
              <boxGeometry args={[0.03, 0.08, 0.03]} />
              <meshStandardMaterial color="#c8922a" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>

      {isActive && (
        <pointLight position={[0, 1, 0.3]} color="#4a9eff" intensity={0.8} distance={2.5} />
      )}
    </group>
  )
}
