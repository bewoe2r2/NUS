import { useRef, useEffect } from "react";
import { SlideLayout } from "../components/layout/slide-layout";
import { H1, H3, BodyLg, Mono } from "../components/ui/typography";

const ECG = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let x = 0;
        const height = canvas.height;
        const width = canvas.width;
        let animationId: number;

        const draw = () => {
            ctx.strokeStyle = "oklch(60% 0.22 200)";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = "oklch(60% 0.22 200 / 0.5)";

            ctx.beginPath();
            ctx.moveTo(x, height / 2);

            // Simulate heartbeat structure
            const nextX = x + 2;
            let nextY = height / 2;

            // Heartbeat pulse every 100px
            const pulsePosition = x % 200;
            if (pulsePosition > 80 && pulsePosition < 120) {
                // P-QRS-T complex simulation
                if (pulsePosition < 90) nextY -= 10; // P
                else if (pulsePosition < 95) nextY += 10; // Q
                else if (pulsePosition < 100) nextY -= 60; // R
                else if (pulsePosition < 105) nextY += 20; // S
                else nextY -= 15; // T
            } else {
                // HRV noise (random jitter)
                nextY += (Math.random() - 0.5) * 5;
            }

            ctx.lineTo(nextX, nextY);
            ctx.stroke();

            x = nextX;
            if (x > width) {
                x = 0;
                ctx.clearRect(0, 0, width, height);
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} width={600} height={300} className="w-full opacity-80" />;
};

export const HRVSlide = () => {
    return (
        <SlideLayout>
            <div className="flex items-center gap-16 px-12">
                <div className="w-1/2">
                    <Mono className="mb-4 block text-accent-cyan">The Secret Weapon</Mono>
                    <H1 className="mb-6">Heart Rate Variability</H1>
                    <H3 className="mb-8 font-light text-white/80">The Autonomic Signal</H3>

                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <span className="text-accent-cyan text-xl">01</span>
                            <BodyLg>Predicts neuropathy <strong className="text-white">3-5 years early</strong>.</BodyLg>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-accent-cyan text-xl">02</span>
                            <BodyLg>Orthogonal to Heart Rate (independent signal).</BodyLg>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-accent-cyan text-xl">03</span>
                            <BodyLg>Captured via standard medical sensors.</BodyLg>
                        </li>
                    </ul>

                    <div className="mt-12 p-6 border border-status-warning/30 bg-status-warning/5 rounded-lg inline-block">
                        <Mono className="text-status-warning">{"<"}15ms = CRITICAL RISK</Mono>
                    </div>
                </div>

                <div className="w-1/2 relative bg-black/20 rounded-xl border border-white/5 p-8 overflow-hidden">
                    <div className="absolute top-4 right-4 animate-pulse">
                        <Mono className="text-accent-cyan">LIVE MONITORING</Mono>
                    </div>
                    <ECG />
                </div>
            </div>
        </SlideLayout>
    );
};
