import { cn } from "../../lib/utils";

/** Premium phone mockup — deeper shadow, Dynamic Island notch */
export const PhoneMockup = ({ src, alt = "App screenshot", className }: { src: string; alt?: string; className?: string }) => (
    <div className={cn("relative", className)}>
        <div className="relative bg-[#1a1a1f] rounded-[36px] p-[6px] shadow-mockup">
            {/* Dynamic Island */}
            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-20 h-[22px] bg-[#1a1a1f] rounded-full z-10" />
            {/* Screen */}
            <div className="rounded-[30px] overflow-hidden bg-white">
                <img src={src} alt={alt} className="w-full h-auto block" draggable={false} />
            </div>
        </div>
    </div>
);

/** Premium browser mockup — deeper shadow, traffic lights */
export const BrowserMockup = ({ src, alt = "Dashboard screenshot", url = "bewo.health/clinical", className }: { src: string; alt?: string; url?: string; className?: string }) => (
    <div className={cn("relative shadow-mockup rounded-lg overflow-hidden", className)}>
        {/* Chrome bar */}
        <div className="bg-[#f8f8f8] border-b border-[#e0e0e0]">
            <div className="flex items-center gap-2 px-3.5 py-2">
                <div className="flex gap-[6px]">
                    <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
                    <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
                    <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 bg-white border border-[#e5e5e5] rounded px-3 py-[3px] text-[10px] text-[#8585a0] font-mono ml-2 tracking-wide">
                    {url}
                </div>
            </div>
        </div>
        {/* Content */}
        <div className="bg-white">
            <img src={src} alt={alt} className="w-full h-auto block" draggable={false} />
        </div>
    </div>
);
