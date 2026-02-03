import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Icosahedron, MeshTransmissionMaterial, Stars, Environment, AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import * as THREE from 'three';

function Crystal({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
        }
    });

    return (
        <group position={position}>
            <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                <Icosahedron args={[1, 0]} ref={meshRef} scale={[2.5, 2.5, 2.5]}>
                    <MeshTransmissionMaterial
                        backside={true}
                        samples={16}
                        thickness={2}
                        chromaticAberration={0.05}
                        anisotropy={0.1}
                        distortion={0.1}
                        distortionScale={0.1}
                        temporalDistortion={0}
                        iridescence={1}
                        iridescenceIOR={1}
                        iridescenceThicknessRange={[0, 1400]}
                        roughness={0.1}
                        clearcoat={1}
                        attenuationDistance={0.5}
                        attenuationColor="#ffffff"
                        color="#e2e8f0" // Slate-200 base
                        bg="transparent"
                    />
                </Icosahedron>
            </Float>

            {/* Internal Geometry for Refraction */}
            <Float speed={2} rotationIntensity={1} floatIntensity={0.2}>
                <Icosahedron args={[0.5, 0]} position={[0.2, 0.2, 0]}>
                    <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={2} toneMapped={false} />
                </Icosahedron>
            </Float>
            <Float speed={3} rotationIntensity={2} floatIntensity={0.5}>
                <Icosahedron args={[0.3, 0]} position={[-0.5, -0.2, 0.5]}>
                    <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={2} toneMapped={false} />
                </Icosahedron>
            </Float>
        </group>
    );
}

function DataParticles({ count = 100 }) {
    const points = useMemo(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360);
            const phi = THREE.MathUtils.randFloatSpread(360);

            const r = 4 + Math.random() * 4;
            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(theta);

            p[i * 3] = x;
            p[i * 3 + 1] = y;
            p[i * 3 + 2] = z;
        }
        return p;
    }, [count]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={points.length / 3}
                    array={points}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color="#0f172a"
                sizeAttenuation={true}
                transparent
                opacity={0.6}
            />
        </points>
    );
}

export function HeroScene() {
    return (
        <>
            <color attach="background" args={['#F8FAFC']} /> {/* Slate-50 Background */}

            <Environment preset="studio" blur={1} />

            <group position={[2, 0, 0]}> {/* Shifted right to allow text on left */}
                <Crystal />
                <DataParticles />
            </group>

            <AccumulativeShadows temporal frames={100} color="#94a3b8" colorBlend={0.5} opacity={1} scale={20} position={[0, -4, 0]}>
                <RandomizedLight amount={8} radius={4} ambient={0.5} intensity={1} position={[5, 5, -10]} bias={0.001} />
            </AccumulativeShadows>
        </>
    );
}
