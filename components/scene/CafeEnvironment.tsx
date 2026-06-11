import * as THREE from 'three'

function FloorTiles() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 14]} />
      <meshStandardMaterial color="#1a0e08" roughness={0.8} metalness={0.1} />
    </mesh>
  )
}

function TileGrid() {
  return (
    <gridHelper
      args={[20, 20, '#2a1a0d', '#2a1a0d']}
      position={[0, 0.001, 0]}
    />
  )
}

function Walls() {
  return (
    <>
      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[20, 5, 0.2]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
      <mesh position={[-10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
      <mesh position={[10, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5, 14]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.9} />
      </mesh>
    </>
  )
}

function PendantLights() {
  const positions: [number, number, number][] = [[-3, 4, -2], [3, 4, -2], [0, 4, 1]]
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 1]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color="#c8922a" emissive="#c8922a" emissiveIntensity={1} />
          </mesh>
          <pointLight color="#f5d07a" intensity={4} distance={10} decay={1.5} castShadow />
        </group>
      ))}
    </>
  )
}

export function CafeEnvironment() {
  return (
    <>
      <ambientLight intensity={1.2} color="#f5d07a" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={2.5}
        color="#f5d07a"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 6, 3]} intensity={1.0} color="#fff8e7" />
      <FloorTiles />
      <TileGrid />
      <Walls />
      <PendantLights />
    </>
  )
}
