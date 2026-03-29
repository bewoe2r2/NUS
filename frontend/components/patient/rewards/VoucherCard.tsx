"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Loader2, Ticket, QrCode, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoucherState {
    current_value: number;
    max_value: number;
    days_until_redemption: number;
    can_redeem: boolean;
    streak_days: number;
}

const FALLBACK_VOUCHER: VoucherState = {
    current_value: 5.00,
    max_value: 5.00,
    days_until_redemption: 3,
    can_redeem: false,
    streak_days: 5,
};

export function VoucherCard() {
    const [voucher, setVoucher] = useState<VoucherState>(FALLBACK_VOUCHER);
    const [showQR, setShowQR] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVoucher() {
            try {
                const data = await api.getVoucher("P001");
                if (data && typeof data === "object" && data.current_value != null) {
                    setVoucher(data);
                }
                // If API returns null/fallback, keep initial fallback — never show skeleton
            } catch (e) {
                console.error("Voucher fetch failed", e);
                // Keep fallback data
            }
        }
        fetchVoucher();
    }, []);

    const handleRedeem = async () => {
        if (!voucher?.can_redeem) return;
        try {
            const res = await api.getVoucherQR("P001");
            if (!res.qr_code) {
                setShowQR(false);
                return;
            }
            setQrCode(res.qr_code);
            setShowQR(true);
        } catch (e) {
            console.error("QR Gen failed", e);
        }
    };

    // Color Logic for Loss Aversion
    const value = voucher.current_value;
    const isHigh = value >= 4.0;
    const isMed = value >= 2.0 && value < 4.0;
    const isLow = value < 2.0;

    const textColor = cn({
        "text-success-600": isHigh,
        "text-warning-600": isMed,
        "text-error-600": isLow,
    });

    return (
        <div className="w-full">
            {/* MAIN CARD */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={voucher.can_redeem ? handleRedeem : undefined}
                role={voucher.can_redeem ? "button" : undefined}
                style={{ cursor: voucher.can_redeem ? "pointer" : "default" }}
                className="bg-white rounded-3xl shadow-card border border-neutral-100 p-6 flex items-center justify-between relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
            >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50 blur-2xl pointer-events-none"></div>

                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-2 text-neutral-500 mb-1">
                        <Ticket size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">Weekly Reward</span>
                    </div>

                    <div className={cn("font-display text-4xl tracking-tighter", textColor)}>
                        ${value.toFixed(2)}
                    </div>

                    <div className="text-base text-neutral-500 font-medium">
                        {voucher.can_redeem
                            ? "Ready to redeem!"
                            : `${voucher.days_until_redemption} days until Sunday`
                        }
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 z-10">
                    <div className="px-3 py-1.5 bg-neutral-100 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200">
                        {"\uD83D\uDD25"} {voucher.streak_days} Day Streak
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRedeem();
                        }}
                        disabled={!voucher.can_redeem}
                        className={cn(
                            "h-12 px-5 rounded-full font-semibold transition-all shadow-sm flex items-center gap-2 text-base",
                            voucher.can_redeem
                                ? "bg-black text-white active:scale-95 hover:bg-neutral-800"
                                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                        )}
                    >
                        <QrCode size={16} />
                        {voucher.can_redeem ? "Redeem" : "Locked"}
                    </button>
                </div>
            </motion.div>

            {/* QR MODAL */}
            <AnimatePresence>
                {showQR && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQR(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-3xl p-6 shadow-xl z-[1000]"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-neutral-900">Redeem Voucher</h3>
                                    <p className="text-sm text-neutral-500">Show to staff at Kopitiam</p>
                                </div>
                                <button onClick={() => setShowQR(false)} className="p-3 bg-neutral-100 rounded-full text-neutral-500 hover:bg-neutral-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center justify-center p-4 bg-white border border-neutral-100 rounded-2xl shadow-inner mb-6">
                                {qrCode ? (
                                    <img src={`data:image/png;base64,${qrCode}`} alt="Voucher QR Code" className="w-full h-auto rounded-lg mix-blend-multiply" />
                                ) : (
                                    <div className="h-48 w-48 flex items-center justify-center text-neutral-300">
                                        <Loader2 className="animate-spin" size={32} />
                                    </div>
                                )}
                                <div className="mt-4 text-3xl font-bold font-display text-neutral-900">
                                    ${voucher.current_value.toFixed(2)}
                                </div>
                            </div>

                            <div className="text-center text-sm text-neutral-500">
                                Valid for one-time use only. Expires in 24 hours.
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
