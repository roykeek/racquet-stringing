"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getDismissedModelIds, addDismissedModelId } from "@/hooks/usePersistedState";

export interface RacquetChip {
    modelId: number;
    modelName: string;
    manufacturerId: number;
    manufacturerName: string;
    stringMain: string | null;
    stringCross: string | null;
    mainsTensionLbs: number | null;
    crossTensionLbs: number | null;
    lastUsed: string;
}

interface RacquetHistoryChipsProps {
    /** Current phone field value — the component watches this and debounces internally */
    phone: string;
    /** Called when the user clicks a chip to pre-fill the form */
    onChipClick: (chip: RacquetChip) => void;
}

export default function RacquetHistoryChips({ phone, onChipClick }: RacquetHistoryChipsProps) {
    const [chips, setChips] = useState<RacquetChip[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced fetch: wait 600ms after the phone value stabilises, only fire at 10 digits
    useEffect(() => {
        // Clear any pending call
        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Reset chips if phone is not a full 10-digit number
        const cleaned = phone?.replace(/\D/g, "") ?? "";
        if (cleaned.length !== 10 || !/^05\d{8}$/.test(cleaned)) {
            setChips([]);
            setIsVisible(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/client-history?phone=${encodeURIComponent(cleaned)}`);
                if (!res.ok) {
                    setChips([]);
                    setIsVisible(false);
                    return;
                }
                const data: RacquetChip[] = await res.json();

                // Filter out dismissed model IDs
                const dismissed = getDismissedModelIds();
                const filtered = data.filter((c) => !dismissed.includes(String(c.modelId)));

                setChips(filtered);
                // Trigger slide-in animation after a tiny delay so the DOM has the elements
                if (filtered.length > 0) {
                    requestAnimationFrame(() => setIsVisible(true));
                } else {
                    setIsVisible(false);
                }
            } catch {
                setChips([]);
                setIsVisible(false);
            } finally {
                setIsLoading(false);
            }
        }, 600);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [phone]);

    const handleDismiss = useCallback(
        (modelId: number, e: React.MouseEvent) => {
            e.stopPropagation(); // Don't trigger chip click
            addDismissedModelId(String(modelId));
            setChips((prev) => {
                const next = prev.filter((c) => c.modelId !== modelId);
                if (next.length === 0) setIsVisible(false);
                return next;
            });
        },
        []
    );

    // Nothing to show
    if (chips.length === 0 && !isLoading) return null;

    return (
        <div
            className={`transition-all duration-500 ease-out overflow-hidden ${isVisible ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
        >
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-emerald-700">
                    🎾 מצאנו את המחבטים שלך:
                </p>
                <div className="flex flex-col gap-2">
                    {chips.map((chip) => (
                        <button
                            key={chip.modelId}
                            type="button"
                            onClick={() => onChipClick(chip)}
                            className="group flex items-center justify-between gap-2 bg-white border border-emerald-200 
                                       rounded-lg px-3 py-2.5 text-sm text-gray-800 hover:bg-emerald-50 
                                       hover:border-emerald-400 transition-all cursor-pointer text-right"
                        >
                            <span className="flex-1 truncate">
                                <span className="font-semibold">{chip.manufacturerName} {chip.modelName}</span>
                                {(chip.stringMain || chip.stringCross) && (
                                    <span className="text-gray-500">
                                        {" · "}
                                        {chip.stringMain && chip.stringCross
                                            ? `${chip.stringMain} / ${chip.stringCross}`
                                            : chip.stringMain || chip.stringCross}
                                    </span>
                                )}
                                {chip.mainsTensionLbs != null && chip.crossTensionLbs != null && (
                                    <span className="text-gray-500">
                                        {" · "}
                                        <span dir="ltr">{chip.mainsTensionLbs}/{chip.crossTensionLbs} lbs</span>
                                    </span>
                                )}
                            </span>
                            <span
                                onClick={(e) => handleDismiss(chip.modelId, e)}
                                className="flex-shrink-0 text-gray-300 hover:text-red-500 font-bold text-base 
                                           leading-none transition-colors px-1"
                                aria-label={`הסר ${chip.modelName}`}
                            >
                                ✕
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
