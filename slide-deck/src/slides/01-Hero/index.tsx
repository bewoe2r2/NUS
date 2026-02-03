import { Canvas } from "@react-three/fiber";
import { HeroScene } from "./HeroScene";
import { HeroOverlay } from "./HeroOverlay";

export function HeroSlide() {
    return (
        <div className="relative w-full h-full bg-slide overflow-hidden">
            {/* 3D Layer */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
                    <HeroScene />
                </Canvas>
            </div>

            {/* 2D UI Layer */}
            <HeroOverlay />
        </div>
    );
}
