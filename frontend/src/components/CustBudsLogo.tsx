import React, { useId } from "react";

export function CustBudsLogoIcon({ className = "w-9 h-9" }: { className?: string }) {
    const id = useId().replace(/:/g, "");

    return (
        <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
            <defs>
                {/* Badge background */}
                <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="55%" stopColor="#0369a1" />
                    <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                {/* Front person */}
                <linearGradient id={`p1-${id}`} x1="30" y1="18" x2="54" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                {/* Back person */}
                <linearGradient id={`p2-${id}`} x1="10" y1="18" x2="40" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#5eead4" />
                    <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
            </defs>

            {/* Rounded square badge */}
            <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#bg-${id})`} />

            {/* ── Back person (left, slightly behind) ── */}
            {/* Head */}
            <circle cx="24" cy="22" r="8.5" fill={`url(#p2-${id})`} />
            {/* Body / torso arc */}
            <path
                d="M8 52 C8 40 14 35 24 35 C30 35 34 37.5 36.5 42"
                fill={`url(#p2-${id})`}
                opacity="0.85"
                stroke="none"
            />
            {/* Shoulder fill to make it a proper solid silhouette */}
            <path
                d="M8 54 L8 42 C8 38 14 34 24 34 C31 34 35.5 37 37.5 43 L37.5 54 Z"
                fill={`url(#p2-${id})`}
                opacity="0.7"
            />

            {/* ── Front person (right, on top) ── */}
            {/* Head */}
            <circle cx="38" cy="24" r="9" fill={`url(#p1-${id})`} />
            {/* Body silhouette */}
            <path
                d="M20 58 L20 47 C20 40 26 35.5 38 35.5 C50 35.5 56 40 56 47 L56 58 Z"
                fill={`url(#p1-${id})`}
            />

            {/* White highlight dots on heads for depth */}
            <circle cx="21" cy="19" r="2.5" fill="white" opacity="0.25" />
            <circle cx="35" cy="21" r="2.8" fill="white" opacity="0.22" />
        </svg>
    );
}

export function CustBudsLogoLockup() {
    return (
        <div className="flex items-center gap-3 min-w-0">
            <CustBudsLogoIcon />
            <div className="min-w-0">
                <div className="text-[15px] font-black leading-none tracking-[0.1em]">
                    <span className="text-white">Cust</span>
                    <span className="text-sky-300">Buds</span>
                </div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
                    Customers as buddies
                </div>
            </div>
        </div>
    );
}
