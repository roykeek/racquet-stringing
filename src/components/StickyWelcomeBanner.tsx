"use client";

import { useEffect, useState } from "react";

export default function StickyWelcomeBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Becomes visible after scrolling past the logo (~120px)
            setVisible(window.scrollY > 120);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            className={`
        fixed top-0 left-0 right-0 z-50
        flex flex-col items-center justify-center py-2
        bg-white/55 backdrop-blur-md border-b border-gray-100/80
        transition-all duration-300 ease-in-out
        md:hidden
        ${visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-full pointer-events-none"
                }
      `}
        >
            <p className="text-sm font-bold text-gray-800/80 text-center">
                ברוכים הבאים למועדון הטניס אלוני יצחק
            </p>
            <p className="text-xs text-gray-500/70 text-center">
                הרבה יותר מטניס
            </p>
        </div>
    );
}
