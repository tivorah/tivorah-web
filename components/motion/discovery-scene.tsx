"use client";
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { useCallback, useRef } from "react";
import type { Group } from "three";
function Shapes({ kind }: { kind: string }) {
  const group = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const move = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!group.current) return;
      group.current.rotation.y = event.pointer.x * 0.3;
      group.current.rotation.x = -event.pointer.y * 0.2;
      invalidate();
    },
    [invalidate],
  );
  return (
    <group ref={group} onPointerMove={move} rotation={[0.15, -0.2, 0.15]}>
      <mesh position={[-0.8, 0.2, 0]} rotation={[0.5, 0.4, 0.2]}>
        <torusGeometry args={[0.8, 0.25, 12, 40]} />
        <meshStandardMaterial color="#8F5FED" roughness={0.45} />
      </mesh>
      <mesh position={[0.85, -0.3, 0.3]} rotation={[0.3, 0.4, 0.5]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={kind === "items" ? "#f4b994" : "#b9d2b5"}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0.8, 0.85, -0.1]}>
        <sphereGeometry args={[0.32, 20, 12]} />
        <meshStandardMaterial color="#f6d073" />
      </mesh>
    </group>
  );
}
export default function DiscoveryScene({ kind }: { kind: string }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 4]} intensity={3} />
      <Shapes kind={kind} />
    </Canvas>
  );
}
