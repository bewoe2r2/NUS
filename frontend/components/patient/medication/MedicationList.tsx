
"use client";

import { useEffect, useState, useRef } from "react";
import { MedicationItem } from "./MedicationItem";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animation-utils";
import { api } from "@/lib/api";
import { Sun, CloudSun, Moon, Loader2 } from "lucide-react";

interface Med {
    id: number;
    name: string;
    dose: string;
    time: string; // HH:MM
    taken: boolean; // Backend uses 'taken'
    with_food?: boolean;
}

export function MedicationList() {
    const [meds, setMeds] = useState<Med[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMeds = async () => {
        try {
            const data = await api.getMedications("P001");
            if (data && data.length > 0) {
                setMeds(data);
            } else {
                // Fallback demo medications for fresh database
                setMeds([
                    { id: 101, name: "Metformin", dose: "500mg", time: "08:00", taken: false, with_food: true },
                    { id: 102, name: "Lisinopril", dose: "10mg", time: "09:00", taken: false },
                    { id: 103, name: "Atorvastatin", dose: "20mg", time: "20:00", taken: false, with_food: false }
                ]);
            }
        } catch (e) {
            console.error("Failed to fetch meds", e);
            // Fallback on error too
            setMeds([
                { id: 101, name: "Metformin", dose: "500mg", time: "08:00", taken: false, with_food: true },
                { id: 102, name: "Lisinopril", dose: "10mg", time: "09:00", taken: false }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const togglingRef = useRef(false);

    useEffect(() => {
        fetchMeds();
        const interval = setInterval(() => {
            if (!togglingRef.current) fetchMeds();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = async (id: number) => {
        togglingRef.current = true;
        let targetName = "";
        let newTaken = false;
        setMeds(prev => {
            const target = prev.find(m => m.id === id);
            if (target) {
                targetName = target.name;
                newTaken = !target.taken;
            }
            return prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m);
        });
        if (targetName) {
            try {
                const result = await api.logMedication(targetName, newTaken);
                if (!result.success) {
                    // Revert on failure
                    setMeds(prev => prev.map(m => m.name === targetName ? { ...m, taken: !newTaken } : m));
                }
            } catch (err) {
                console.error(err);
                // Revert on unexpected error
                setMeds(prev => prev.map(m => m.name === targetName ? { ...m, taken: !newTaken } : m));
            } finally {
                togglingRef.current = false;
            }
        } else {
            togglingRef.current = false;
        }
    };

    const getCategory = (timeStr: string) => {
        const hour = parseInt(timeStr?.split(':')[0]) || 0;
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    const grouped = {
        morning: meds.filter(m => getCategory(m.time) === 'morning'),
        afternoon: meds.filter(m => getCategory(m.time) === 'afternoon'),
        evening: meds.filter(m => getCategory(m.time) === 'evening'),
    };

    if (loading && meds.length === 0) {
        return <div className="py-8 flex justify-center text-neutral-400"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">

            {/* MORNING GROUP */}
            {grouped.morning.length > 0 && (
                <div className="space-y-3">
                    <motion.div variants={fadeInUp} className="flex items-center gap-2 px-4 py-1.5 bg-warning-50/50 rounded-full w-fit mb-3 border border-warning-100/50">
                        <Sun size={16} className="text-[var(--warning-solid)]" />
                        <span className="text-xs font-bold uppercase tracking-widest text-warning-700">Morning</span>
                    </motion.div>
                    {grouped.morning.map(med => (
                        <MedicationItem
                            key={med.id}
                            id={med.id}
                            name={med.name}
                            dose={med.dose}
                            time={med.time}
                            isTaken={med.taken} // Map 'taken' to 'isTaken' prop
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {/* AFTERNOON GROUP */}
            {grouped.afternoon.length > 0 && (
                <div className="space-y-3">
                    <motion.div variants={fadeInUp} className="flex items-center gap-2 px-4 py-1.5 bg-accent-50/50 rounded-full w-fit mb-3 border border-accent-100/50">
                        <CloudSun size={16} className="text-accent-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-accent-700">Afternoon</span>
                    </motion.div>
                    {grouped.afternoon.map(med => (
                        <MedicationItem
                            key={med.id}
                            id={med.id}
                            name={med.name}
                            dose={med.dose}
                            time={med.time}
                            isTaken={med.taken}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {/* EVENING GROUP */}
            {grouped.evening.length > 0 && (
                <div className="space-y-3">
                    <motion.div variants={fadeInUp} className="flex items-center gap-2 px-4 py-1.5 bg-accent-50/50 rounded-full w-fit mb-3 border border-accent-100/50">
                        <Moon size={16} className="text-accent-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-accent-700">Evening</span>
                    </motion.div>
                    {grouped.evening.map(med => (
                        <MedicationItem
                            key={med.id}
                            id={med.id}
                            name={med.name}
                            dose={med.dose}
                            time={med.time}
                            isTaken={med.taken}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            {meds.length === 0 && !loading && (
                <div className="text-center py-8 text-neutral-500 text-base">
                    No medications scheduled for today.
                </div>
            )}

        </motion.div>
    );
}
