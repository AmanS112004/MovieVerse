import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function Particles({ count = 120 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const { size } = useThree();

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
      sz[i] = Math.random() * 3 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.03;
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.02) * 0.1;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ACC8A2"
        size={0.08}
        sizeAttenuation={true}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}

function FloatingRings() {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.x = clock.getElapsedTime() * 0.05;
    group.current.rotation.z = clock.getElapsedTime() * 0.03;
  });

  return (
    <group ref={group}>
      {[3.5, 5.5, 7.5].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 4 + i * 0.3, i * 0.5, 0]}>
          <torusGeometry args={[r, 0.02, 8, 80]} />
          <meshBasicMaterial color="#ACC8A2" transparent opacity={0.08 - i * 0.02} />
        </mesh>
      ))}
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 60 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.2} />
      <Particles count={150} />
      <FloatingRings />
    </Canvas>
  );
}
