import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Solid indigo core with strong emissive — visible on any background
function Core({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x += (mouse.current[1] * 0.5 - meshRef.current.rotation.x) * 0.06;
    meshRef.current.rotation.y += (mouse.current[0] * 0.5 - meshRef.current.rotation.y) * 0.06;
    meshRef.current.rotation.z = t * 0.1;
    const s = 1 + Math.sin(t * 1.4) * 0.03;
    meshRef.current.scale.setScalar(s);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 4]} />
      <meshPhongMaterial
        color="#4f46e5"
        emissive="#6366f1"
        emissiveIntensity={0.8}
        shininess={160}
        specular={new THREE.Color('#a5b4fc')}
      />
    </mesh>
  );
}

// Dark wireframe shell — indigo, fully opaque enough to show on white
function WireShell({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x += (-mouse.current[1] * 0.3 - meshRef.current.rotation.x) * 0.04;
    meshRef.current.rotation.y += (-mouse.current[0] * 0.3 - meshRef.current.rotation.y) * 0.04;
    meshRef.current.rotation.z = -t * 0.15;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.65, 2]} />
      <meshBasicMaterial color="#4338ca" wireframe transparent opacity={0.55} />
    </mesh>
  );
}

// Primary ring — deep violet, clearly visible
function Ring({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.PI / 2.8 + mouse.current[1] * 0.25;
    meshRef.current.rotation.y = t * 0.5 + mouse.current[0] * 0.25;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.8, 0.028, 16, 100]} />
      <meshBasicMaterial color="#4f46e5" transparent opacity={0.85} />
    </mesh>
  );
}

// Secondary ring — cyan accent
function Ring2({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.PI / 1.5 - mouse.current[1] * 0.2;
    meshRef.current.rotation.y = -t * 0.3 - mouse.current[0] * 0.2;
    meshRef.current.rotation.z = t * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[1.6, 0.016, 16, 100]} />
      <meshBasicMaterial color="#0891b2" transparent opacity={0.7} />
    </mesh>
  );
}

// Particles — dark enough to show on light bg, bright enough for dark bg
function Particles() {
  const count = 80;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.4 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y += 0.0008;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#4338ca" size={0.055} transparent opacity={0.9} sizeAttenuation />
      </points>
    </group>
  );
}

function FloatGroup({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.7) * 0.12;
  });
  return <group ref={groupRef}>{children}</group>;
}

function Scene({ mouse }: { mouse: React.MutableRefObject<[number, number]> }) {
  return (
    <>
      {/* Strong directional lights so the core shines on light backgrounds too */}
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 4]}   intensity={4}   color="#818cf8" />
      <pointLight position={[-4, -2, -4]} intensity={2}   color="#06b6d4" />
      <pointLight position={[0, -4, 2]}  intensity={1.5} color="#7c3aed" />
      <directionalLight position={[0, 0, 5]} intensity={1} color="#ffffff" />

      <FloatGroup>
        <Core mouse={mouse} />
        <WireShell mouse={mouse} />
        <Ring mouse={mouse} />
        <Ring2 mouse={mouse} />
      </FloatGroup>

      <Particles />
    </>
  );
}

export default function HeroOrb() {
  const mouse = useRef<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current = [
      ((e.clientX - rect.left) / rect.width  - 0.5) * 2,
      -((e.clientY - rect.top)  / rect.height - 0.5) * 2,
    ];
  };

  return (
    <div className="w-full h-full" onMouseMove={handleMouseMove} onMouseLeave={() => { mouse.current = [0, 0]; }}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
