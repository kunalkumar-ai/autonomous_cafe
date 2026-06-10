export function BarCounter() {
  return (
    <group position={[0, 0, -3]}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 0.1, 1.2]} />
        <meshStandardMaterial color="#3d2510" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.0, 1.2]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.07, 0.6]}>
        <boxGeometry args={[7, 0.04, 0.04]} />
        <meshStandardMaterial color="#c8922a" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}
