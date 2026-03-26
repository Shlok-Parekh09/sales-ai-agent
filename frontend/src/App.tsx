import React, { useState, useEffect, useRef, useMemo } from "react";

// ── TableRow type ────────────────────────────────────────────
type TableRow = {
    id: number;
    [key: string]: any;
};

// ── Agent Result type — mirrors the JSON returned by /api/agent/prospect ──
type AgentResult = {
    fitScore: number;
    scoreReasoning: string;
    email1: string;
    email2: string;
    enrichedProfile?: {
        recent_news: string;
        tech_stack: string[];
        key_contact: { name: string; title: string };
        pain_points: string[];
        industry: string;
        headcount_range: string;
    };
    companyName: string; // added by the frontend before storing
};

/* ═══════════════════════════════════════════════════════
   PROSPECTING AGENT RESULT PANEL
   Rendered in the main content area after the agent runs.
═══════════════════════════════════════════════════════ */
function AgentResultPanel({ result, onClose }: { result: AgentResult; onClose: () => void }) {
    const [activeEmail, setActiveEmail] = useState<"email1" | "email2">("email1");
    const [copied, setCopied] = useState(false);

    const scoreColor = result.fitScore >= 80 ? "#22c55e" : result.fitScore >= 60 ? "#f59e0b" : "#ef4444";
    const scoreBg   = result.fitScore >= 80 ? "#f0fdf4" : result.fitScore >= 60 ? "#fffbeb" : "#fef2f2";

    const rawBody = (result[activeEmail] || "").trim();
    const lines = rawBody.split("\n").map(l => l.trim()).filter(l => l !== "");
    let subject = lines.length > 0 ? lines[0] : "New Email";
    // Clean up "Subject:" prefix if the AI included it
    subject = subject.replace(/^subject:\s*/i, "");
    const body = lines.length > 1 ? lines.slice(1).join("\n\n") : rawBody;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(rawBody).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="bg-white rounded-xl border border-sky-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-sky-100"
                 style={{ background: "linear-gradient(135deg, #0a1628, #0ea5e9)" }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                        <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-white font-bold text-sm">Prospecting Agent Result</div>
                        <div className="text-white/70 text-xs">{result.companyName}</div>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="p-6 space-y-5">
                {/* Fit Score + Reasoning */}
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 flex-shrink-0"
                         style={{ background: scoreBg, borderColor: scoreColor }}>
                        <span className="text-2xl font-black" style={{ color: scoreColor }}>{result.fitScore}</span>
                        <span className="text-xs font-semibold" style={{ color: scoreColor }}>/ 100</span>
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fit Score Reasoning</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.scoreReasoning}</p>
                    </div>
                </div>

                {/* Enriched intel pills */}
                {result.enrichedProfile && (
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">🏭 {result.enrichedProfile.industry}</span>
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">👥 {result.enrichedProfile.headcount_range}</span>
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">👤 {result.enrichedProfile.key_contact.name} · {result.enrichedProfile.key_contact.title}</span>
                        {result.enrichedProfile.tech_stack.slice(0, 3).map(t => (
                            <span key={t} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full font-medium">{t}</span>
                        ))}
                    </div>
                )}

                {/* Email Sequencer */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-1">
                            <button onClick={() => setActiveEmail("email1")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeEmail === "email1"
                                        ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                }`}
                                style={activeEmail === "email1" ? { background: "#0ea5e9" } : {}}>
                                Email 1 — Cold Outreach
                            </button>
                            <button onClick={() => setActiveEmail("email2")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeEmail === "email2"
                                        ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                }`}
                                style={activeEmail === "email2" ? { background: "#0ea5e9" } : {}}>
                                Email 2 — Follow-up
                            </button>
                        </div>
                        <button onClick={copyToClipboard}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            {copied ? "✓ Copied" : "Copy"}
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="font-semibold text-sm text-gray-800">{subject}</div>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{body}</div>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-2 pt-1">
                    <button className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ background: "#0ea5e9" }}
                        onClick={() => alert("Sequence started! (Connect to your email provider)")}>▶ Start Sequence</button>
                    <button className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors">↻ Regenerate</button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">📅 Schedule</button>
                </div>
            </div>
        </div>
    );
}

/* ───────── Icons ───────── */
const DealsIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
    </svg>
);
const MeetingsIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>
);
const CallsIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.438a1 1 0 01-.32.893L4.6 10.123a13.013 13.013 0 005.275 5.275l1.956-1.956a1 1 0 01.893-.32l4.438.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);
const ContactsIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
);
const CompaniesIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
            clipRule="evenodd"
        />
    </svg>
);
const SearchIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
        />
    </svg>
);
const ChevronDownIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
        <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
        />
    </svg>
);
const XIcon = ({ size = "w-4 h-4" }: { size?: string }) => (
    <svg viewBox="0 0 20 20" fill="currentColor" className={size}>
        <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
        />
    </svg>
);
const ExternalLinkIcon = () => (
    <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-3 h-3 inline ml-0.5 opacity-70"
    >
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
);

const GmailIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M15.75 21H21C21.4142 21 21.75 20.6642 21.75 20.25V6.75L16.5 10.5V21H15.75Z" fill="#34A853"/>
        <path d="M3 20.25C3 20.6642 3.33579 21 3.75 21H8.25V10.5L3 6.75V20.25Z" fill="#4285F4"/>
        <path d="M16.5 3.375V10.5L21.75 6.75V4.5C21.75 3.1934 20.231 2.47353 19.2 3.3L16.5 5.25V3.375Z" fill="#FBBC04"/>
        <path d="M16.5 3.375L12 6L7.5 3.375V10.5L3 6.75V4.5C3 3.1934 4.51901 2.47353 5.55 3.3L7.5 5.25V3.375Z" fill="#EA4335"/>
        <path d="M16.5 5.25L12 9.5L7.5 5.25L7.5 3.375L12 6L16.5 3.375V5.25Z" fill="#C5221F"/>
    </svg>
);

const HubSpotLogoIcon = () => (
    <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
        <circle cx="16" cy="16" r="16" fill="#FF7A59" />
        <path
            d="M20 10.5c0-1.1-.9-2-2-2s-2 .9-2 2v5.5H10.5c-1.1 0-2 .9-2 2s.9 2 2 2H16v2c0 1.1.9 2 2 2s2-.9 2-2V10.5z"
            fill="white"
        />
        <circle cx="22" cy="10" r="2.5" fill="white" />
    </svg>
);

/* ───────── Editable Cell ───────── */
function EditableCell({ value, onChange, className = "", link = false }: {
    value: string;
    onChange: (val: string) => void;
    className?: string;
    link?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [local, setLocal] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocal(value);
    }, [value]);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = () => {
        setEditing(false);
        onChange(local);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                    if (e.key === "Escape") {
                        setLocal(value);
                        setEditing(false);
                    }
                }}
                className="border border-sky-400 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-sky-400 min-w-24"
            />
        );
    }
    return (
        <span
            onDoubleClick={() => {
                setLocal(value);
                setEditing(true);
            }}
            title="Double-click to edit"
            className={`cursor-text rounded px-0.5 py-0.5 hover:bg-sky-50 transition-colors inline-block ${link ? "text-sky-600 hover:underline" : ""
                } ${className}`}
        >
            {value && value !== "--" ? (
                <>
                    {value}
                    {link && <ExternalLinkIcon />}
                </>
            ) : (
                <span className="text-gray-300 select-none">--</span>
            )}
        </span>
    );
}

/* ───────── Create Company Modal ───────── */
function CreateCompanyModal({ onClose, onSave, onAgentStart, onAgentResult }: {
    onClose: () => void;
    onSave: (form: any) => void;
    onAgentStart?: () => void;
    onAgentResult?: (result: AgentResult | null) => void;
}) {
    const [form, setForm] = useState({
        domain: "",
        name: "",
        email: "",
        companySize: "",
        type: "",
        city: "",
        state: "",
        revenue: "",
    });

    const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Create Company
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
                    >
                        <XIcon size="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                            Company domain name
                        </label>
                        <input
                            autoFocus
                            value={form.domain}
                            onChange={set("domain")}
                            className="w-full border-2 border-sky-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200 bg-white transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                            Company name
                        </label>
                        <input
                            value={form.name}
                            onChange={set("name")}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-sky-400 bg-white transition-colors"
                        />
                    </div>



                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Company Email ID
                        </label>
                        <input
                            value={form.email}
                            onChange={set("email")}
                            placeholder="hello@company.com"
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-sky-400 bg-white transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Company Size
                        </label>
                        <div className="relative">
                            <select
                                value={form.companySize}
                                onChange={set("companySize")}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-500 appearance-none focus:outline-none focus:border-sky-400 bg-white"
                            >
                                <option value=""></option>
                                <option>1-10 employees</option>
                                <option>11-50 employees</option>
                                <option>51-200 employees</option>
                                <option>201-500 employees</option>
                                <option>501-1000 employees</option>
                                <option>1001-5000 employees</option>
                                <option>5000+ employees</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Annual Revenue
                        </label>
                        <input
                            type="text"
                            value={form.revenue}
                            onChange={set("revenue")}
                            placeholder="$1,000,000"
                            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-sky-400 bg-white transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Type
                        </label>
                        <div className="relative">
                            <select
                                value={form.type}
                                onChange={set("type")}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-500 appearance-none focus:outline-none focus:border-sky-400 bg-white"
                            >
                                <option value=""></option>
                                <option>Prospect</option>
                                <option>Partner</option>
                                <option>Customer</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            City
                        </label>
                        <input
                            value={form.city}
                            onChange={set("city")}
                            className="w-full border-b border-gray-300 px-0 py-1.5 text-sm focus:outline-none focus:border-sky-400 transition-colors bg-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            State/Region
                        </label>
                        <div className="relative border-b border-gray-300">
                            <select
                                value={form.state}
                                onChange={set("state")}
                                className="w-full py-1.5 text-sm text-gray-400 appearance-none focus:outline-none focus:border-sky-400 bg-transparent"
                            >
                                <option value=""></option>
                                <option>Maharashtra</option>
                                <option>California</option>
                                <option>New York</option>
                                <option>Texas</option>
                            </select>
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button
        onClick={async () => {
                            if (!form.name && !form.domain) { alert("Please enter a company name or domain."); return; }
                            // 1. Save to CRM table immediately
                            onSave(form);
                            onClose();
                            // 2. Fire the Prospecting Agent in the background
                            if (onAgentStart && onAgentResult) {
                                onAgentStart(); // shows loading banner
                                try {
                                    const res = await fetch("http://localhost:5000/api/agent/prospect", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            companyName: form.name || form.domain,
                                            city: form.city,
                                            companySize: form.companySize,
                                            type: form.type,
                                        }),
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    const data: AgentResult = await res.json();
                                    data.companyName = form.name || form.domain;
                                    onAgentResult(data);
                                } catch (err) {
                                    console.error("Agent error:", err);
                                    alert("Could not reach the Prospecting Agent. Make sure 'npm start' is running in the backend folder on port 5000, and your Groq API key is valid.");
                                    onAgentResult(null); // clears loading banner
                                }
                            }
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors hover:opacity-90"
                        style={{ background: "#0ea5e9" }}
                    >
                        Create + Prospect
                    </button>
                    <button
                        onClick={() => {
                            if (form.name || form.domain) {
                                onSave(form);
                                setForm({
                                    domain: "",
                                    name: "",
                                    email: "",
                                    companySize: "",
                                    type: "",
                                    city: "",
                                    state: "",
                                    revenue: "",
                                });
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-sky-300 rounded-md hover:bg-sky-50 transition-colors"
                    >
                        Create and add another
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-sky-700 border-2 border-sky-700 rounded-md hover:bg-sky-50 transition-colors ml-auto"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ───────── CSV/Excel Import Modal ───────── */
function ImportModal({ columns, onClose, onImport }: {
    columns: string[];
    onClose: () => void;
    onImport: (rows: Record<string, string>[]) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);

    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) return null;
        const headers = lines[0].split(",").map(s => s.trim().replace(/^"|"$/g, ""));
        const rows = lines.slice(1).map(l => l.split(",").map(s => s.trim().replace(/^"|"$/g, "")));
        return { headers, rows };
    };

    const handleFile = async (file: File) => {
        setError(""); setPreview(null);
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext === "csv") {
            const text = await file.text();
            const parsed = parseCSV(text);
            if (!parsed) { setError("CSV must have a header row and at least one data row."); return; }
            setPreview(parsed);
        } else if (ext === "xlsx" || ext === "xls") {
            setError("Excel support: please export your file as CSV first, then import.");
        } else {
            setError("Only .csv or .xlsx/.xls files are supported.");
        }
    };

    const mapAndImport = () => {
        if (!preview) return;
        const { headers, rows } = preview;
        const colMap: Record<string, number> = {};
        columns.forEach(col => {
            const colLower = col.toLowerCase().replace(/[^a-z0-9]/g, "");
            const idx = headers.findIndex(h => {
                const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, "");
                return hLower === colLower || hLower.includes(colLower) || colLower.includes(hLower);
            });
            if (idx >= 0) colMap[col] = idx;
        });
        const mapped: Record<string, string>[] = rows.map(row => {
            const rec: Record<string, string> = {};
            columns.forEach(col => {
                const idx = colMap[col];
                rec[col] = idx !== undefined ? (row[idx] || "--") : "--";
            });
            return rec;
        });
        onImport(mapped);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
            <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900">Import from CSV</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"><XIcon size="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <p className="text-xs text-gray-500">Upload a <strong>CSV</strong> file. The first row must be a header row matching the table columns (e.g. <em>{columns.slice(0, 3).join(", ")}</em>…). Data rows below will be auto-sorted into the correct columns.</p>
                    <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-400 transition-colors"
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 mx-auto mb-2 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                        <p className="text-sm text-gray-500">Click or drag & drop a <strong>CSV</strong> or <strong>Excel</strong> file here</p>
                        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    </div>
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                    {preview && (
                        <div className="space-y-2">
                            <p className="text-xs text-green-600 font-semibold">✓ Detected {preview.rows.length} data row(s) with columns: {preview.headers.join(", ")}</p>
                            <div className="overflow-x-auto border border-gray-200 rounded">
                                <table className="text-xs w-full min-w-max">
                                    <thead><tr className="bg-gray-50 border-b">{preview.headers.map(h => <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                                    <tbody>{preview.rows.slice(0, 4).map((r, i) => <tr key={i} className="border-b border-gray-100">{r.map((c, j) => <td key={j} className="px-2 py-1 text-gray-700 whitespace-nowrap">{c}</td>)}</tr>)}</tbody>
                                </table>
                            </div>
                            {preview.rows.length > 4 && <p className="text-xs text-gray-400">…and {preview.rows.length - 4} more rows</p>}
                        </div>
                    )}
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button onClick={mapAndImport} disabled={!preview} className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-40" style={{ background: "#0ea5e9" }}>Import</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-sky-700 border border-sky-300 rounded-md hover:bg-sky-50">Cancel</button>
                </div>
            </div>
        </div>
    );
}

/* ───────── Create Contact Modal ───────── */
function CreateContactModal({ onClose, onSave }: { onClose: () => void; onSave: (form: any) => void; }) {
    const [form, setForm] = useState({ email: "", firstName: "", lastName: "", jobTitle: "", phone: "" });
    const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
    const showHint = !form.email && !form.firstName && !form.lastName;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Create Contact</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"><XIcon size="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">Email</label>
                        <input autoFocus value={form.email} onChange={set("email")} className="w-full border-2 border-sky-400 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-200 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">First name</label>
                        <input value={form.firstName} onChange={set("firstName")} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-400 transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">Last name</label>
                        <input value={form.lastName} onChange={set("lastName")} className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-400 transition-colors" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Job title</label>
                        <input value={form.jobTitle} onChange={set("jobTitle")} className="w-full border-b border-gray-300 px-0 py-1.5 text-sm focus:outline-none focus:border-sky-400 bg-transparent" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Phone number</label>
                        <input value={form.phone} onChange={set("phone")} type="tel" className="w-full border-b border-gray-300 px-0 py-1.5 text-sm focus:outline-none focus:border-sky-400 bg-transparent" />
                    </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                    <button onClick={() => { if (form.email || form.firstName || form.lastName) { onSave(form); onClose(); } else alert("Please enter a name or email."); }}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-md hover:opacity-90" style={{ background: "#0ea5e9" }}>Create</button>
                    <button onClick={() => { if (form.email || form.firstName || form.lastName) { onSave(form); setForm({ email: "", firstName: "", lastName: "", jobTitle: "", phone: "" }); } }}
                        className="px-4 py-2 text-sm font-medium text-sky-700 border border-sky-300 rounded-md hover:bg-sky-50">Create and add another</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-sky-700 border-2 border-sky-700 rounded-md hover:bg-sky-50 ml-auto">Cancel</button>
                </div>
            </div>
        </div>
    );
}

/* ───────── Contacts View ───────── */
const CONTACTS_KEY = "custbuds_contacts";
const CONTACTS_COLS_KEY = "custbuds_contacts_cols";

function ContactsView() {
    const [activeTab, setActiveTab] = useState("all");
    const [tableSearch, setTableSearch] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [showCreateContact, setShowCreateContact] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);

    // ── Pagination State ──
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
    const addBtnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [columns, setColumns] = useState<string[]>(() => {
        const stripOwnerCols = (cols: any[]): string[] =>
            (cols || []).filter(c => typeof c === "string" && !c.toLowerCase().includes("owner"));
        try {
            const s = localStorage.getItem(CONTACTS_COLS_KEY);
            const parsed = s ? (JSON.parse(s) as any[]) : ["Name", "Email", "Phone Number", "Contact owner"];
            const cleaned = stripOwnerCols(parsed);
            return cleaned.length ? cleaned : ["Name", "Email", "Phone Number"];
        } catch {
            return ["Name", "Email", "Phone Number"];
        }
    });

    const [contacts, setContacts] = useState<TableRow[]>(() => {
        try {
            const s = localStorage.getItem(CONTACTS_KEY);
            return s ? JSON.parse(s) : [];
        } catch { return []; }
    });

    const update = (id: number, field: string, val: string) =>
        setContacts(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));

    const deleteRow = (id: number) => setContacts(cs => cs.filter(c => c.id !== id));

    const deleteCol = (col: string) => {
        setColumns(cols => cols.filter(c => c !== col));
        setContacts(cs => cs.map(c => { const n = { ...c }; delete n[col]; return n; }));
    };

    // 3. Removed TS assertion here
    const handleImport = (rows: Record<string, string>[]) => {
        const newRows = rows.map((r, i) => ({ id: Date.now() + i, ...r }));
        setContacts(cs => [...cs, ...newRows]);
    };

    const handleSaveContact = (form: any) => {
        const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ") || form.email || "New Contact";
        setContacts(cs => [...cs, {
            id: Date.now(),
            "Name": fullName,
            "Email": form.email || "--",
            "Phone Number": form.phone || "--",
        }]);
    };

    // Persist contacts & columns to localStorage on every change
    useEffect(() => { try { localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)); } catch {} }, [contacts]);
    useEffect(() => { try { localStorage.setItem(CONTACTS_COLS_KEY, JSON.stringify(columns)); } catch {} }, [columns]);

    const filtered = contacts.filter(c =>
        !tableSearch ||
        (c["Name"] || "").toLowerCase().includes(tableSearch.toLowerCase()) ||
        (c["Email"] || "").toLowerCase().includes(tableSearch.toLowerCase())
    );

    const [sortRule, setSortRule] = useState<{ col: string, asc: boolean }>({ col: "", asc: true });
    const [showSort, setShowSort] = useState(false);
    const [showEditCols, setShowEditCols] = useState(false);
    const [newColName, setNewColName] = useState("");

    const exportExcel = () => {
        const header = ["id", ...columns].join(",");
        const rows = contacts.map(c => [c.id, ...columns.map(col => `"${String(c[col] || "").replace(/"/g, '""')}"`)].join(","));
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "contacts_export.csv";
        a.click();
    };

    const sortedFiltered = useMemo(() => {
        let res = [...filtered];
        if (sortRule.col) {
            res.sort((a, b) => {
                const av = String(a[sortRule.col] || "");
                const bv = String(b[sortRule.col] || "");
                return sortRule.asc ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }
        return res;
    }, [filtered, sortRule]);

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    
    useEffect(() => {
        if (currentPage !== safeCurrentPage) setCurrentPage(safeCurrentPage);
    }, [safeCurrentPage, currentPage]);

    const paginatedData = sortedFiltered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                addBtnRef.current && !addBtnRef.current.contains(e.target as Node)
            ) setShowAddMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <>
            {showImport && <ImportModal columns={columns} onClose={() => setShowImport(false)} onImport={handleImport} />}
            {showCreateContact && <CreateContactModal onClose={() => setShowCreateContact(false)} onSave={handleSaveContact} />}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-0">
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600">Contacts <ChevronDownIcon /></button>
                    <div className="relative">
                        <button
                            ref={addBtnRef}
                            onClick={() => setShowAddMenu(v => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-90 select-none"
                            style={{ background: "#0ea5e9" }}
                        >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            Add contacts <ChevronDownIcon />
                        </button>
                        {showAddMenu && (
                            <div ref={menuRef} className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                                <button onClick={() => { setShowAddMenu(false); setShowCreateContact(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Create new
                                </button>
                                <button onClick={() => { setShowAddMenu(false); setShowImport(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Import
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center border-b border-gray-200 px-4 mt-2 gap-0.5">
                    {[
                        { id: "all", label: "All contacts", badge: filtered.length },
                        { id: "my", label: "My contacts" },
                        { id: "unassigned", label: "Unassigned contacts" },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-sky-500 text-sky-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold"
                                    style={{ background: activeTab === tab.id ? "#0ea5e9" : "#e0f2fe", color: activeTab === tab.id ? "white" : "#0369a1" }}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
                        <input type="text" placeholder="Search..." value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-sky-400 w-36" />
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Table view <ChevronDownIcon /></button>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <div className="relative">
                            <button onClick={() => setShowEditCols(v => !v)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">
                                Edit columns
                            </button>
                            {showEditCols && (
                                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-20 p-2">
                                    <div className="flex gap-1 mb-2">
                                        <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="New column name" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-400" />
                                        <button onClick={() => {
                                            if (!newColName.trim() || columns.includes(newColName.trim())) return;
                                            setColumns([...columns, newColName.trim()]);
                                            setNewColName("");
                                        }} className="px-2 py-1 bg-sky-500 text-white text-xs rounded hover:bg-sky-600">Add</button>
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 px-1">Active Columns</div>
                                    <div className="max-h-40 overflow-y-auto pr-1">
                                        {columns.map(c => (
                                            <div key={c} className="flex items-center justify-between px-1.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded group/col">
                                                <span className="truncate">{c}</span>
                                                <button onClick={() => deleteCol(c)} className="opacity-0 group-hover/col:opacity-100 text-gray-400 hover:text-red-500"><XIcon size="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Filters</button>
                        
                        <div className="relative">
                            <button onClick={() => setShowSort(v => !v)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm flex items-center gap-1">
                                Sort {sortRule.col && <span className="text-sky-600 font-bold ml-1">({sortRule.col})</span>}
                            </button>
                            {showSort && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-20 overflow-hidden py-1">
                                    {["Name", "Email", "Phone Number"].map(opt => (
                                        <button key={opt} onClick={() => {
                                            if (sortRule.col === opt) setSortRule({ col: opt, asc: !sortRule.asc });
                                            else setSortRule({ col: opt, asc: true });
                                            setShowSort(false);
                                        }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            {opt}
                                            {sortRule.col === opt && (
                                                <span className="text-sky-500 font-bold">{sortRule.asc ? "↑" : "↓"}</span>
                                            )}
                                        </button>
                                    ))}
                                    {sortRule.col && (
                                        <button onClick={() => { setSortRule({ col: "", asc: true }); setShowSort(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1">
                                            Clear sorting
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button onClick={exportExcel} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Export</button>
                        <button className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Save</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: 'max-content', width: '100%' }} className="text-sm border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-300">
                                <th className="w-8 px-2 py-1.5 border-r border-gray-300 bg-slate-50 sticky left-0 z-10"><input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500" /></th>
                                {columns.map(h => (
                                    <th key={h} className="px-3 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap border-r border-gray-300">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((c: any) => (
                                <tr key={c.id} className="border-b border-gray-200 hover:bg-sky-50/30 transition-colors group">
                                    <td className="w-8 px-2 py-1.5 border-r border-gray-200 bg-white group-hover:bg-sky-50/30 sticky left-0 text-center align-middle transition-colors z-10"><input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500" /></td>
                                    {columns.map((col, ci) => (
                                        <td key={col} className="px-3 py-1.5 border-r border-gray-200 relative">
                                            {ci === 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-gray-200"><HubSpotLogoIcon /></div>
                                                    <EditableCell value={c[col] || "--"} onChange={v => update(c.id, col, v)} link className="text-sm font-medium" />
                                                </div>
                                            ) : (
                                                <EditableCell value={c[col] || "--"} onChange={v => update(c.id, col, v)} className="text-sm text-gray-500" />
                                            )}
                                            {ci === columns.length - 1 && (
                                                <button onClick={() => deleteRow(c.id)} title="Delete row"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-50 bg-white border border-gray-200 shadow-sm z-10 flex items-center justify-center">
                                                    <XIcon size="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-gray-400">No contacts found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 relative">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                            className={`px-2.5 py-1 text-xs font-medium ${safeCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            ‹ Prev
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${safeCurrentPage === pageNum ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                style={safeCurrentPage === pageNum ? { background: "#0ea5e9" } : {}}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className={`px-2.5 py-1 text-xs font-medium ${safeCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Next ›
                        </button>
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            {pageSize} per page <ChevronDownIcon />
                        </button>
                        {showPageSizeMenu && (
                            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden" style={{ minWidth: '120px' }}>
                                {[25, 50, 100].map(sz => (
                                    <button 
                                        key={sz} 
                                        onClick={() => { setPageSize(sz); setShowPageSizeMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {sz} per page
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ───────── Companies View ───────── */
function CompaniesView({ onAgentStart, onAgentResult }: { onAgentStart?: () => void, onAgentResult?: (r: AgentResult | null) => void }) {
    const [activeTab, setActiveTab] = useState("all");
    const [tableSearch, setTableSearch] = useState("");
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImport, setShowImport] = useState(false);

    // ── Pagination State ──
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

    const addBtnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [columns, setColumns] = useState<string[]>(() => {
        const stripOwnerCols = (cols: any[]): string[] =>
            (cols || []).filter(c => typeof c === "string" && !c.toLowerCase().includes("owner")) as string[];
        try {
            const s = localStorage.getItem("custbuds_company_cols");
            let parsed = s ? JSON.parse(s) : ["Company name", "Date created", "Email ID", "City", "Company Size", "Annual Revenue"];
            parsed = stripOwnerCols(parsed);
            return parsed.map((c: string) => {
                if (c === "Phone Number" || c === "Email") return "Email ID";
                if (c === "Create Date (GMT +5:30)") return "Date created";
                if (c === "Create Date (IST)") return "Date created";
                return c;
            });
        } catch {
            return ["Company name", "Date created", "Email ID", "City", "Company Size", "Annual Revenue"];
        }
    });

    useEffect(() => {
        setColumns(prev => prev.filter(c => typeof c === "string" && !c.toLowerCase().includes("owner")));
    }, []);

    const [companies, setCompanies] = useState<TableRow[]>(() => {
        try {
            const s = localStorage.getItem("custbuds_companies");
            if (!s) return [];
            
            const parsed = JSON.parse(s);
            return parsed.map((c: any) => {
                const migrated = { ...c };
                // Legacy key migration
                if (migrated["Create Date (IST)"] !== undefined) {
                    migrated["Date created"] = migrated["Create Date (IST)"];
                    delete migrated["Create Date (IST)"];
                }
                if (migrated["Phone Number"] !== undefined) {
                    migrated["Email ID"] = migrated["Phone Number"];
                    delete migrated["Phone Number"];
                }
                if (migrated["Email"] !== undefined) {
                    migrated["Email ID"] = migrated["Email"];
                    delete migrated["Email"];
                }
                if (migrated["Create Date (GMT +5:30)"] !== undefined) {
                    migrated["Date created"] = migrated["Create Date (GMT +5:30)"];
                    delete migrated["Create Date (GMT +5:30)"];
                }
                return migrated;
            });
        } catch { return []; }
    });

    const update = (id: number, field: string, val: string) =>
        setCompanies(cs => cs.map(c => c.id === id ? { ...c, [field]: val } : c));

    const deleteRow = (id: number) => setCompanies(cs => cs.filter(c => c.id !== id));

    const deleteCol = (col: string) => {
        setColumns(cols => cols.filter(c => c !== col));
        setCompanies(cs => cs.map(c => { const n = { ...c }; delete n[col]; return n; }));
    };

    const handleSaveNew = (form: any) => {
        setCompanies(cs => [
            ...cs,
            {
                id: Date.now(),
                "Company name": form.name || form.domain || "New Company",
                "Date created": "Just now",
                "Email ID": form.email || "--",
                "City": form.city || "--",
                "Company Size": form.companySize || "--",
                "Annual Revenue": form.revenue || "--",
            },
        ]);
    };

    // 5. Removed TS assertion here
    const handleImport = (rows: Record<string, string>[]) => {
        const newRows = rows.map((r, i) => ({ id: Date.now() + i, ...r }));
        setCompanies(cs => [...cs, ...newRows]);
    };

    // Persist companies & columns to localStorage on every change
    useEffect(() => { try { localStorage.setItem("custbuds_companies", JSON.stringify(companies)); } catch {} }, [companies]);
    useEffect(() => { try { localStorage.setItem("custbuds_company_cols", JSON.stringify(columns)); } catch {} }, [columns]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                addBtnRef.current && !addBtnRef.current.contains(e.target as Node)
            ) setShowAddMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = companies.filter(c =>
        !tableSearch || (c["Company name"] || "").toLowerCase().includes(tableSearch.toLowerCase())
    );

    const [sortRule, setSortRule] = useState<{ col: string, asc: boolean }>({ col: "", asc: true });
    const [showSort, setShowSort] = useState(false);
    const [showEditCols, setShowEditCols] = useState(false);
    const [newColName, setNewColName] = useState("");

    const exportExcel = () => {
        const header = ["id", ...columns].join(",");
        const rows = companies.map(c => [c.id, ...columns.map(col => `"${String(c[col] || "").replace(/"/g, '""')}"`)].join(","));
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "companies_export.csv";
        a.click();
    };

    const sortedFiltered = useMemo(() => {
        let res = [...filtered];
        if (sortRule.col) {
            res.sort((a, b) => {
                const av = String(a[sortRule.col] || "");
                const bv = String(b[sortRule.col] || "");
                return sortRule.asc ? av.localeCompare(bv) : bv.localeCompare(av);
            });
        }
        return res;
    }, [filtered, sortRule]);

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    
    useEffect(() => {
        if (currentPage !== safeCurrentPage) setCurrentPage(safeCurrentPage);
    }, [safeCurrentPage, currentPage]);

    const paginatedData = sortedFiltered.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

    return (
        <>
            {showCreateModal && <CreateCompanyModal onClose={() => setShowCreateModal(false)} onSave={handleSaveNew} onAgentStart={onAgentStart} onAgentResult={onAgentResult} />}
            {showImport && <ImportModal columns={columns} onClose={() => setShowImport(false)} onImport={handleImport} />}
            {/* Note: CompaniesView passes onAgentResult through the dashboard — see CRMDashboard */}

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-0">
                    <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600">
                        Companies <ChevronDownIcon />
                    </button>
                    <div className="relative">
                        <button
                            ref={addBtnRef}
                            onClick={() => setShowAddMenu((v) => !v)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-90 select-none"
                            style={{ background: "#0ea5e9" }}
                        >
                            Add companies <ChevronDownIcon />
                        </button>
                        {showAddMenu && (
                            <div ref={menuRef} className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden">
                                <button onClick={() => { setShowAddMenu(false); setShowCreateModal(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Create new
                                </button>
                                <button onClick={() => { setShowAddMenu(false); setShowImport(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    Import
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center border-b border-gray-200 px-4 mt-2">
                    {[
                        { id: "all", label: "All companies", badge: filtered.length },
                        { id: "my", label: "My companies" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-1 py-2.5 text-sm font-medium border-b-2 mr-4 transition-colors ${activeTab === tab.id
                                ? "border-sky-500 text-sky-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold"
                                    style={{
                                        background: activeTab === tab.id ? "#e0f2fe" : "#f3f4f6",
                                        color: activeTab === tab.id ? "#0284c7" : "#6b7280",
                                    }}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 px-4 py-3 flex-wrap">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={tableSearch}
                            onChange={(e) => setTableSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-sky-400 w-40"
                        />
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        Table view <ChevronDownIcon />
                    </button>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <div className="relative">
                            <button onClick={() => setShowEditCols(v => !v)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">
                                Edit columns
                            </button>
                            {showEditCols && (
                                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 shadow-xl rounded-lg z-20 p-2">
                                    <div className="flex gap-1 mb-2">
                                        <input value={newColName} onChange={e => setNewColName(e.target.value)} placeholder="New column name" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-sky-400" />
                                        <button onClick={() => {
                                            if (!newColName.trim() || columns.includes(newColName.trim())) return;
                                            setColumns([...columns, newColName.trim()]);
                                            setNewColName("");
                                        }} className="px-2 py-1 bg-sky-500 text-white text-xs rounded hover:bg-sky-600">Add</button>
                                    </div>
                                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1 px-1">Active Columns</div>
                                    <div className="max-h-40 overflow-y-auto pr-1">
                                        {columns.map(c => (
                                            <div key={c} className="flex items-center justify-between px-1.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded group/col">
                                                <span className="truncate">{c}</span>
                                                <button onClick={() => deleteCol(c)} className="opacity-0 group-hover/col:opacity-100 text-gray-400 hover:text-red-500"><XIcon size="w-3 h-3" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Filters</button>
                        
                        <div className="relative">
                            <button onClick={() => setShowSort(v => !v)} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm flex items-center gap-1">
                                Sort {sortRule.col && <span className="text-sky-600 font-bold ml-1">({sortRule.col})</span>}
                            </button>
                            {showSort && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-lg z-20 overflow-hidden py-1">
                                    {["Annual Revenue", "Company name", "Date created"].map(opt => (
                                        <button key={opt} onClick={() => {
                                            if (sortRule.col === opt) setSortRule({ col: opt, asc: !sortRule.asc });
                                            else setSortRule({ col: opt, asc: true });
                                            setShowSort(false);
                                        }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                            {opt}
                                            {sortRule.col === opt && (
                                                <span className="text-sky-500 font-bold">{sortRule.asc ? "↑" : "↓"}</span>
                                            )}
                                        </button>
                                    ))}
                                    {sortRule.col && (
                                        <button onClick={() => { setSortRule({ col: "", asc: true }); setShowSort(false); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1">
                                            Clear sorting
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button onClick={exportExcel} className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Export</button>
                        <button className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm">Save</button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: 'max-content', width: '100%' }} className="text-sm border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-300">
                                <th className="w-8 px-2 py-1.5 border-r border-gray-300 bg-slate-50 sticky left-0 z-10"><input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500" /></th>
                                {columns.map(h => (
                                    <th key={h} className="px-3 py-1.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap border-r border-gray-300">
                                        {h}
                                    </th>
                                ))}
                                <th className="w-8 px-2 py-1.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((company: any) => (
                                <tr key={company.id} className="border-b border-gray-200 hover:bg-sky-50/30 transition-colors group">
                                    <td className="w-8 px-2 py-1.5 border-r border-gray-200 bg-white group-hover:bg-sky-50/30 sticky left-0 text-center align-middle transition-colors z-10"><input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500" /></td>
                                    {columns.map((col, ci) => (
                                        <td key={col} className="px-3 py-1.5 border-r border-gray-200 relative">
                                            {ci === 0 ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-5 h-5 text-[10px] rounded flex items-center justify-center flex-shrink-0 text-white font-bold" style={{ background: "#0ea5e9" }}>
                                                        {(company[col] || "?")[0].toUpperCase()}
                                                    </div>
                                                    <EditableCell value={company[col] || "--"} onChange={v => update(company.id, col, v)} className="text-sm font-medium text-gray-900" />
                                                </div>
                                            ) : (
                                                <EditableCell value={company[col] || "--"} onChange={v => update(company.id, col, v)} className="text-sm text-gray-500" />
                                            )}
                                            {ci === columns.length - 1 && (
                                                <button onClick={() => deleteRow(company.id)} title="Delete row"
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded hover:bg-red-50 bg-white border border-gray-200 shadow-sm z-10 flex items-center justify-center">
                                                    <XIcon size="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr><td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-gray-400">No companies found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 relative">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safeCurrentPage === 1}
                            className={`px-2.5 py-1 text-xs font-medium ${safeCurrentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            ‹ Prev
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${safeCurrentPage === pageNum ? 'text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                style={safeCurrentPage === pageNum ? { background: "#0ea5e9" } : {}}
                            >
                                {pageNum}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className={`px-2.5 py-1 text-xs font-medium ${safeCurrentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                            Next ›
                        </button>
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            {pageSize} per page <ChevronDownIcon />
                        </button>
                        {showPageSizeMenu && (
                            <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden" style={{ minWidth: '120px' }}>
                                {[25, 50, 100].map(sz => (
                                    <button 
                                        key={sz} 
                                        onClick={() => { setPageSize(sz); setShowPageSizeMenu(false); }}
                                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {sz} per page
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ═══════════════════════════════════════════════════════
   AI AGENT VIEWS
═══════════════════════════════════════════════════════ */

/* ──── Shared agent UI helpers ──── */
function AgentStatusBadge({ status }: { status: "running" | "idle" | "alert" }) {
    const cfg = {
        running: { dot: "#22c55e", label: "Running", bg: "#f0fdf4", text: "#166534" },
        idle:    { dot: "#94a3b8", label: "Idle",    bg: "#f8fafc", text: "#475569" },
        alert:   { dot: "#f59e0b", label: "Alert",   bg: "#fffbeb", text: "#92400e" },
    }[status];
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: cfg.bg, color: cfg.text }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    );
}

function MetricCard({ label, value, delta, deltaUp, sub }: { label: string; value: string; delta?: string; deltaUp?: boolean; sub?: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm flex flex-col gap-1 min-w-[150px]">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {delta && (
                <span className={`text-xs font-semibold ${deltaUp ? "text-green-600" : "text-red-500"}`}>
                    {deltaUp ? "▲" : "▼"} {delta}
                </span>
            )}
            {sub && <span className="text-xs text-gray-400">{sub}</span>}
        </div>
    );
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            {action}
        </div>
    );
}

/* ───────── 1. Prospecting Agent View ───────── */
function ProspectingAgentView({ agentResults = [], onProspectAll }: { agentResults?: AgentResult[], onProspectAll?: () => void }) {
    const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
    const [emailTab, setEmailTab] = useState<'email1' | 'email2'>('email1');
    const [editedEmail1, setEditedEmail1] = useState('');
    const [editedEmail2, setEditedEmail2] = useState('');
    const [forwardTo, setForwardTo] = useState('');
    const [forwarded, setForwarded] = useState(false);

    const scoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 75 ? "#f59e0b" : "#94a3b8";

    // Compute stats from actual data
    const targetsResearched = agentResults.length;
    const sequencesActive = agentResults.filter(r => r.email1 || r.email2).length;
    const avgFitScore = agentResults.length > 0
        ? Math.round(agentResults.reduce((sum, r) => sum + (r.fitScore || 0), 0) / agentResults.length)
        : 0;

    // Build activity log from actual results
    const activityLog = agentResults.map((r, i) => ({
        time: `${i + 1}m ago`,
        action: `Researched ${r.enrichedProfile?.key_contact?.name || 'target'} (${r.companyName}) · Score: ${r.fitScore}`,
        color: "#6366f1",
    }));

    const openTarget = (idx: number) => {
        const t = agentResults[idx];
        setEmailTab('email1');
        setEditedEmail1(t.email1 || '');
        setEditedEmail2(t.email2 || '');
        setForwardTo('');
        setForwarded(false);
        setSelectedTarget(selectedTarget === idx ? null : idx);
    };

    const handleForward = (emailBody: string) => {
        if (!forwardTo.trim()) return;
        const subject = encodeURIComponent(`Outreach from CustBuds`);
        const body = encodeURIComponent(emailBody);
        window.open(`mailto:${forwardTo.trim()}?subject=${subject}&body=${body}`, '_blank');
        setForwarded(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Prospecting Agent</h1>
                            <p className="text-xs text-gray-400">Researches targets · scores fit · writes personalized sequences · adapts on engagement</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <AgentStatusBadge status={agentResults.length > 0 ? "running" : "idle"} />
                        {onProspectAll && (
                            <button
                                onClick={onProspectAll}
                                className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                            >
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                                Prospect All
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Metrics — computed from real data */}
            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Targets Researched" value={String(targetsResearched)} sub={targetsResearched === 0 ? "No targets yet" : `${targetsResearched} processed`} />
                <MetricCard label="Sequences Active" value={String(sequencesActive)} sub={sequencesActive === 0 ? "None active" : `${sequencesActive} ready`} />
                <MetricCard label="Avg. Fit Score" value={avgFitScore > 0 ? String(avgFitScore) : "—"} sub="/ 100" />
                <MetricCard label="Reply Rate" value="—" sub="No data yet" />
                <MetricCard label="Meetings Booked" value="—" sub="No data yet" />
            </div>

            {/* Target Queue */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-6 pt-5 pb-3">
                    <SectionHeader
                        title="Target Queue"
                        description="Dynamically populated with targets processed by the AI Agent in this session"
                    />
                </div>

                {agentResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center mb-4 text-sky-500">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Queue is empty</h3>
                        <p className="text-xs text-gray-500 max-w-sm">No companies have been prospected yet. Go to the CRM → Companies tab and click "Create + Prospect" to generate targeted outreach!</p>
                    </div>
                ) : (
                    <div className="px-6 pb-2">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {["Prospect", "Company", "Fit Score", "Status", "Stage"].map(h => (
                                        <th key={h} className="py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pr-4">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {agentResults.map((t, idx) => {
                                    const contactName = t.enrichedProfile?.key_contact?.name || "Target";
                                    const contactTitle = t.enrichedProfile?.key_contact?.title || "Leadership";
                                    const cName = t.companyName || "Unknown";
                                    const isSelected = selectedTarget === idx;

                                    return (
                                        <React.Fragment key={idx}>
                                            <tr onClick={() => openTarget(idx)}
                                                className={`border-b border-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}>
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-sm flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-sky-500">
                                                            {contactName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-xs">{contactName}</div>
                                                            <div className="text-xs text-gray-400">{contactTitle}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 text-xs font-semibold text-sky-700">{cName}</td>
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${t.fitScore}%`, background: scoreColor(t.fitScore) }} />
                                                        </div>
                                                        <span className="text-xs font-bold" style={{ color: scoreColor(t.fitScore) }}>{t.fitScore}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">Processed</span>
                                                </td>
                                                <td className="py-3 pr-4 text-xs text-slate-500">Sequence Ready</td>
                                            </tr>

                                            {isSelected && (
                                                <tr>
                                                    <td colSpan={5} className="bg-sky-50/30 p-0 border-b border-gray-100">
                                                        <div className="p-4 mx-6 my-2 bg-white rounded-xl shadow-sm border border-sky-100">
                                                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">AI Outreach Sequence — {contactName.split(" ")[0]}</span>
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedTarget(null); }} className="text-gray-400 hover:text-gray-600"><XIcon size="w-4 h-4" /></button>
                                                            </div>

                                                            {/* Tab switcher */}
                                                            <div className="flex gap-2 mb-3">
                                                                {(['email1', 'email2'] as const).map(tab => (
                                                                    <button key={tab} onClick={(e) => { e.stopPropagation(); setEmailTab(tab); }}
                                                                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${emailTab === tab ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                                        {tab === 'email1' ? 'Email 1' : 'Email 2 (Follow-up)'}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            {/* Editable email body */}
                                                            <textarea
                                                                onClick={e => e.stopPropagation()}
                                                                value={emailTab === 'email1' ? editedEmail1 : editedEmail2}
                                                                onChange={e => emailTab === 'email1' ? setEditedEmail1(e.target.value) : setEditedEmail2(e.target.value)}
                                                                className="w-full h-52 text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded p-3 resize-y focus:outline-none focus:border-sky-400 leading-relaxed font-mono"
                                                            />

                                                            {/* Forward section */}
                                                            <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    type="email"
                                                                    value={forwardTo}
                                                                    onChange={e => { setForwardTo(e.target.value); setForwarded(false); }}
                                                                    placeholder="Recipient email address..."
                                                                    className="flex-1 text-xs border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:border-sky-400"
                                                                />
                                                                <button
                                                                    onClick={() => handleForward(emailTab === 'email1' ? editedEmail1 : editedEmail2)}
                                                                    className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${forwarded ? 'bg-green-500 text-white' : 'bg-sky-500 text-white hover:bg-sky-600'}`}
                                                                >
                                                                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                                                                    {forwarded ? 'Sent ✓' : 'Send Email'}
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedTarget(null); }}
                                                                    className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                                                                    Discard
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Agent Activity Log — dynamic */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <SectionHeader title="Agent Activity Log" description="Real-time actions taken by the Prospecting Agent" />
                {activityLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                        </div>
                        <p className="text-xs text-gray-400">No activity found. Prospect a company to see agent logs here.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activityLog.map((l, i) => (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: l.color }} />
                                <div className="flex-1 text-xs text-gray-700">{l.action}</div>
                                <span className="text-xs text-gray-400 flex-shrink-0">{l.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ───────── 2. Deal Intelligence Agent View ───────── */
function DealIntelligenceView() {
    const deals = [
        { id: 1, name: "Meesho Enterprise Plan", value: "₹18L", stage: "Negotiation", health: 34, risk: "High", signals: ["No reply 8 days", "Champion left company"], owner: "Shlok", close: "Apr 15", recovery: "Schedule exec call, share ROI case study" },
        { id: 2, name: "Nykaa B2B Expansion", value: "₹42L", stage: "Proposal Sent", health: 71, risk: "Medium", signals: ["Opened proposal 3x", "Competitor Salesforce mentioned"], owner: "Priya", close: "Apr 28", recovery: "Send competitive battlecard, offer POC" },
        { id: 3, name: "OYO SaaS Suite", value: "₹65L", stage: "Demo Done", health: 88, risk: "Low", signals: ["Champion highly engaged", "Use-case mapping doc shared"], owner: "Shlok", close: "May 5", recovery: null },
        { id: 4, name: "PhonePe Analytics", value: "₹29L", stage: "Discovery", health: 62, risk: "Medium", signals: ["Budget freeze rumor", "3 stakeholders added"], owner: "Arjun", close: "May 20", recovery: "Prepare multi-threading plan for new stakeholders" },
        { id: 5, name: "Paytm Dashboard", value: "₹11L", stage: "Proposal Sent", health: 45, risk: "High", signals: ["No engagement 5 days", "Legal asked for security docs"], owner: "Kavya", close: "Apr 18", recovery: "Send security one-pager, loop in solutions engineer" },
    ];

    const healthColor = (h: number) => h >= 75 ? "#22c55e" : h >= 50 ? "#f59e0b" : "#ef4444";
    const riskBg = (r: string) => r === "High" ? "bg-red-50 text-red-700" : r === "Medium" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700";

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Deal Intelligence Agent</h1>
                            <p className="text-xs text-gray-400">Watches pipeline health · detects risk signals · generates recovery plays</p>
                        </div>
                    </div>
                    <AgentStatusBadge status="alert" />
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Active Deals" value="23" sub="₹3.2Cr total" />
                <MetricCard label="At-Risk Deals" value="7" delta="2 new alerts" deltaUp={false} />
                <MetricCard label="Avg. Health Score" value="64" delta="4 pts this week" deltaUp={false} />
                <MetricCard label="Recovery Plays Sent" value="12" delta="3 today" deltaUp />
                <MetricCard label="Cycle Time (avg)" value="38d" delta="5d vs target" deltaUp={false} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <SectionHeader title="Pipeline Risk Monitor" description="Agent-scored deals with AI-generated recovery plays" />
                </div>
                <div className="space-y-0">
                    {deals.map(d => (
                        <div key={d.id} className="px-6 py-4 border-t border-gray-100 hover:bg-amber-50/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900">{d.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskBg(d.risk)}`}>{d.risk} Risk</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span>{d.stage}</span><span>·</span><span className="font-semibold text-gray-700">{d.value}</span><span>·</span><span>Close {d.close}</span><span>·</span><span>Owner: {d.owner}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1 text-right">Health</div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${d.health}%`, background: healthColor(d.health) }} />
                                            </div>
                                            <span className="text-xs font-bold w-6" style={{ color: healthColor(d.health) }}>{d.health}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {d.signals.map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">⚡ {s}</span>
                                ))}
                            </div>
                            {d.recovery && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-amber-700">🎯 Recovery Play:</span>
                                    <span className="text-xs text-gray-600">{d.recovery}</span>
                                    <button className="ml-auto px-2.5 py-1 text-xs font-semibold text-white rounded-md hover:opacity-90 flex-shrink-0" style={{ background: "#f59e0b" }}>Execute</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Engagement Heatmap" description="Prospect activity this week" />
                    <div className="space-y-2">
                        {[
                            { name: "OYO SaaS Suite", bars: [3,5,4,7,6,8,7] },
                            { name: "PhonePe Analytics", bars: [2,1,4,2,5,3,4] },
                            { name: "Nykaa B2B", bars: [1,0,2,5,3,2,4] },
                            { name: "Meesho Enterprise", bars: [0,0,0,0,1,0,0] },
                            { name: "Paytm Dashboard", bars: [2,1,0,0,0,1,0] },
                        ].map(row => (
                            <div key={row.name} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 w-36 truncate">{row.name}</span>
                                <div className="flex gap-1 flex-1">
                                    {row.bars.map((v, i) => (
                                        <div key={i} className="flex-1 rounded-sm" style={{ height: "20px", background: v === 0 ? "#f1f5f9" : `rgba(99,102,241,${0.15 + v * 0.11})` }} />
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="flex justify-end gap-1 mt-1">
                            {["M","T","W","T","F","S","S"].map((d,i) => <span key={i} className="flex-1 text-center text-xs text-gray-300">{d}</span>)}
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Agent Alerts" description="Latest deal risk signals detected" />
                    <div className="space-y-3">
                        {[
                            { icon: "🔴", msg: "Meesho champion left company — deal re-routed to new contact", time: "1h ago" },
                            { icon: "🟡", msg: "Nykaa mentioned Salesforce on intro call recording", time: "3h ago" },
                            { icon: "🟡", msg: "Paytm deal went 5 days without any prospect engagement", time: "5h ago" },
                            { icon: "🟢", msg: "OYO champion shared proposal internally — strong buy signal", time: "8h ago" },
                            { icon: "🔴", msg: "Meesho — no reply to 3 follow-ups in sequence", time: "1d ago" },
                        ].map((a, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="text-sm">{a.icon}</span>
                                <span className="text-xs text-gray-700 flex-1">{a.msg}</span>
                                <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ───────── 3. Revenue Retention Agent View ───────── */
function RevenueRetentionView() {
    const accounts = [
        { id: 1, name: "IndiaMart", arr: "₹28L", churnRisk: 87, trend: "↓", signals: ["Usage dropped 62%", "Support tickets ×4", "Champion disengaged"], action: "Executive escalation", status: "Intervention Active" },
        { id: 2, name: "PolicyBazaar", arr: "₹19L", churnRisk: 71, trend: "↓", signals: ["Logged in 2x this month", "Negative NPS survey"], action: "Personalized offer generated", status: "Offer Sent" },
        { id: 3, name: "Delhivery", arr: "₹44L", churnRisk: 38, trend: "→", signals: ["Stable DAUs", "Feature adoption +8%"], action: null, status: "Healthy" },
        { id: 4, name: "CarDekho", arr: "₹15L", churnRisk: 59, trend: "↓", signals:["Contract renewal in 30d", "Budget discussions started"], action: "Renewal outreach triggered", status: "Monitoring" },
        { id: 5, name: "Lenskart", arr: "₹31L", churnRisk: 22, trend: "↑", signals: ["New power user added", "Upsell signal detected"], action: "Upsell sequence started", status: "Expanding" },
    ];

    const riskColor = (r: number) => r >= 70 ? "#ef4444" : r >= 45 ? "#f59e0b" : "#22c55e";

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}>
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Revenue Retention Agent</h1>
                            <p className="text-xs text-gray-400">Predicts churn · triggers interventions · generates offers · escalates to account teams</p>
                        </div>
                    </div>
                    <AgentStatusBadge status="running" />
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Accounts Monitored" value="84" sub="across all tiers" />
                <MetricCard label="High Churn Risk" value="9" delta="2 new today" deltaUp={false} />
                <MetricCard label="Interventions Active" value="14" delta="3 escalated" deltaUp />
                <MetricCard label="Retention Rate" value="91%" delta="2% improvement" deltaUp />
                <MetricCard label="NRR (est.)" value="118%" delta="vs 106% target" deltaUp />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <SectionHeader title="Account Health Board" description="Churn predictions from usage, sentiment and engagement signals" />
                </div>
                <div>
                    {accounts.map(a => (
                        <div key={a.id} className="px-6 py-4 border-t border-gray-100 hover:bg-cyan-50/20 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-gray-900">{a.name}</span>
                                        <span className="text-xs font-medium text-gray-500">{a.arr} ARR</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            a.status === "Healthy" ? "bg-green-50 text-green-700" :
                                            a.status === "Expanding" ? "bg-blue-50 text-blue-700" :
                                            a.status === "Intervention Active" ? "bg-red-50 text-red-700" :
                                            "bg-amber-50 text-amber-700"
                                        }`}>{a.status}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {a.signals.map(s => (
                                            <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>
                                        ))}
                                    </div>
                                    {a.action && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs font-semibold text-cyan-700">⚡ Agent Action:</span>
                                            <span className="text-xs text-gray-600">{a.action}</span>
                                            <button className="ml-auto px-2.5 py-1 text-xs font-semibold text-white rounded-md hover:opacity-90 flex-shrink-0" style={{ background: "#06b6d4" }}>Review</button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs text-gray-400 mb-1">Churn Risk</div>
                                    <div className="flex items-center gap-1 justify-end">
                                        <span className="text-lg font-black" style={{ color: riskColor(a.churnRisk) }}>{a.churnRisk}%</span>
                                        <span className="text-sm">{a.trend}</span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${a.churnRisk}%`, background: riskColor(a.churnRisk) }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Intervention Workflows" description="Agent-triggered actions in progress" />
                    <div className="space-y-3">
                        {[
                            { account: "IndiaMart", workflow: "Executive Escalation", step: "Step 2/3", status: "In Progress" },
                            { account: "PolicyBazaar", workflow: "Discount Offer", step: "Sent", status: "Awaiting" },
                            { account: "CarDekho", workflow: "Renewal Campaign", step: "Step 1/4", status: "In Progress" },
                            { account: "Lenskart", workflow: "Upsell Sequence", step: "Step 1/5", status: "Active" },
                        ].map((w, i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div>
                                    <div className="text-xs font-semibold text-gray-800">{w.account}</div>
                                    <div className="text-xs text-gray-400">{w.workflow} · {w.step}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    w.status === "In Progress" ? "bg-blue-50 text-blue-700" :
                                    w.status === "Awaiting" ? "bg-amber-50 text-amber-700" :
                                    "bg-green-50 text-green-700"
                                }`}>{w.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Sentiment Signals" description="From usage data & support interactions" />
                    <div className="space-y-3">
                        {[
                            { account: "IndiaMart", sentiment: "Negative", note: "3 unresolved tickets, team frustrated with onboarding" },
                            { account: "PolicyBazaar", sentiment: "Neutral", note: "NPS score dropped from 7 to 4 in last survey" },
                            { account: "Lenskart", sentiment: "Positive", note: "Power user added, API usage up 40% MoM" },
                            { account: "Delhivery", sentiment: "Positive", note: "Feature adoption growing steadily across 3 teams" },
                        ].map((s, i) => (
                            <div key={i} className="flex items-start gap-2 border-b border-gray-50 pb-2 last:border-0">
                                <span className={`mt-0.5 px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                                    s.sentiment === "Negative" ? "bg-red-100 text-red-700" :
                                    s.sentiment === "Positive" ? "bg-green-100 text-green-700" :
                                    "bg-gray-100 text-gray-600"
                                }`}>{s.sentiment}</span>
                                <div>
                                    <div className="text-xs font-semibold text-gray-700">{s.account}</div>
                                    <div className="text-xs text-gray-400">{s.note}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ───────── 4. Competitive Intelligence Agent View ───────── */
function CompetitiveIntelligenceView() {
    const [activeCompetitor, setActiveCompetitor] = useState("Salesforce");

    const competitors = ["Salesforce", "HubSpot", "Zoho", "Freshsales"];
    const compData: Record<string, any> = {
        Salesforce: {
            mentions: 14, trend: "↑", recentMoves: [
                "Launched Einstein Copilot with GPT-4o on Apr 2",
                "Cut SMB pricing by 20% — effective April pricing",
                "Signed 3 enterprise logos in India (Q1)",
            ],
            battlecard: { win: "CustBuds is 60% faster to deploy · No per-user pricing · Native WhatsApp integration", lose: "Their brand recognition in ENT · deeper ERP integrations", talk: "Show deployment speed benchmarks · emphasize India-first features" },
        },
        HubSpot: {
            mentions: 9, trend: "→", recentMoves: [
                "Launched 'HubSpot for Startups' India cohort",
                "Integrated with Razorpay natively",
                "Price hike for Marketing Hub — 15% starting May",
            ],
            battlecard: { win: "CustBuds AI agents are proactive · Better pipeline intelligence · Flat pricing", lose: "HS marketing automation depth · Partner ecosystem", talk: "Demo AI prospecting vs HS static sequences · cost calculator" },
        },
        Zoho: {
            mentions: 6, trend: "↓", recentMoves: [
                "Zoho One bundle promoted aggressively in SMB segment",
                "Launched Zia AI 3.0 update",
                "Channel partner program expanded",
            ],
            battlecard: { win: "CustBuds AI quality is superior · Modern UX · Better support", lose: "Zoho's price point and bundle value", talk: "ROI vs cost · show agent intelligence demo · time-to-value" },
        },
        Freshsales: {
            mentions: 4, trend: "↓", recentMoves: [
                "Acquired a data enrichment tool",
                "New GTM hire from Salesforce India",
                "Bundling with Freshdesk for mid-market push",
            ],
            battlecard: { win: "Deeper AI agents · Better prospecting · Stronger pipeline health", lose: "Freshworks ecosystem lock-in", talk: "Focus on AI differentiation · buyer journey intelligence" },
        },
    };

    const cd = compData[activeCompetitor];

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)" }}>
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Competitive Intelligence Agent</h1>
                            <p className="text-xs text-gray-400">Tracks market signals · pushes battlecards · updates positioning in active deals</p>
                        </div>
                    </div>
                    <AgentStatusBadge status="running" />
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Signals Tracked" value="93" delta="12 this week" deltaUp />
                <MetricCard label="Competitor Mentions" value="33" sub="in active deals" />
                <MetricCard label="Battlecards Pushed" value="18" delta="5 today" deltaUp />
                <MetricCard label="Win Rate vs Top Comp." value="61%" delta="4% improvement" deltaUp />
                <MetricCard label="Deals Influenced" value="8" sub="by battlecards" />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-5">
                    <SectionHeader title="Competitors" description="Select to view intelligence" />
                    <div className="space-y-2">
                        {competitors.map(c => (
                            <button key={c} onClick={() => setActiveCompetitor(c)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium border transition-all ${activeCompetitor === c ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-gray-100 text-gray-700 hover:bg-gray-50"}`}>
                                <div className="flex items-center justify-between">
                                    <span>{c}</span>
                                    <span className="text-xs text-gray-400">{compData[c].mentions} mentions {compData[c].trend}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Latest Market Signals</div>
                        <div className="space-y-2">
                            {[
                                { sig: "Salesforce Indian pricing change", time: "2h ago" },
                                { sig: "HubSpot startup cohort launched", time: "1d ago" },
                                { sig: "Zoho Zia 3.0 feature release", time: "2d ago" },
                            ].map((s, i) => <div key={i} className="flex justify-between text-xs"><span className="text-gray-600">📡 {s.sig}</span><span className="text-gray-400 ml-2 flex-shrink-0">{s.time}</span></div>)}
                        </div>
                    </div>
                </div>

                <div className="col-span-2 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <div className="text-sm font-bold text-gray-900 mb-3">Recent Moves — {activeCompetitor}</div>
                        <div className="space-y-2">
                            {cd.recentMoves.map((m: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">{i + 1}</span>
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-bold text-gray-900">Battlecard — vs {activeCompetitor}</div>
                            <button className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: "#10b981" }}>Push to Active Deals</button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                <div className="text-xs font-bold text-green-800 mb-2">✅ Where We Win</div>
                                <p className="text-xs text-green-700">{cd.battlecard.win}</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                <div className="text-xs font-bold text-red-800 mb-2">⚠️ Watch Out For</div>
                                <p className="text-xs text-red-700">{cd.battlecard.lose}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <div className="text-xs font-bold text-blue-800 mb-2">💬 Talking Points</div>
                                <p className="text-xs text-blue-700">{cd.battlecard.talk}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                        <div className="text-sm font-bold text-gray-900 mb-3">Active Deals with {activeCompetitor} Mentions</div>
                        <div className="space-y-2">
                            {[
                                { deal: "Nykaa B2B Expansion", stage: "Proposal Sent", mention: "Prospect mentioned on intro call" },
                                { deal: "OYO SaaS Suite", stage: "Demo Done", mention: "Referenced in email thread" },
                            ].map((d, i) => (
                                <div key={i} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                                    <div className="flex-1">
                                        <div className="text-xs font-semibold text-gray-800">{d.deal}</div>
                                        <div className="text-xs text-gray-400">{d.stage} · {d.mention}</div>
                                    </div>
                                    <button className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100">Send Battlecard</button>
                                </div>
                            ))}
                            {["Salesforce", "HubSpot"].includes(activeCompetitor) ? null : (
                                <p className="text-xs text-gray-400 text-center py-3">No active deal mentions for {activeCompetitor} this week.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlaceholderView({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-sm text-gray-500 max-w-sm">{desc}</p>
        </div>
    );
}

/* ───────── Root Dashboard ───────── */
export default function CRMDashboard() {
    const [bannerVisible, setBannerVisible] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [activeNav, setActiveNav] = useState("companies");

    // ── Prospecting Agent state ─────────────────────────────────
    // isProspecting: true while we're waiting for the backend to respond
    const [isProspecting, setIsProspecting] = useState(false);
    // agentResult: populated once the backend returns
    const [agentResults, setAgentResults] = useState<AgentResult[]>(() => {
        try { const s = localStorage.getItem("custbuds_agent_results"); return s ? JSON.parse(s) : []; }
        catch { return []; }
    });
    useEffect(() => { try { localStorage.setItem("custbuds_agent_results", JSON.stringify(agentResults)); } catch {} }, [agentResults]);
    const [agentResult, setAgentResult] = useState<AgentResult | null>(null);

    // ── Avatar Options ──
    const accounts = [
        { name: "Shlok Parekh", email: "shlok@custbuds.com", color: "#0ea5e9" },
        { name: "Sales Team", email: "sales@custbuds.com", color: "#f59e0b" },
        { name: "Demo User", email: "demo@custbuds.com", color: "#10b981" },
    ];
    const [activeAccount, setActiveAccount] = useState(accounts[0]);
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const accountBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node) &&
                accountBtnRef.current && !accountBtnRef.current.contains(e.target as Node)
            ) setShowAccountMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /**
     * handleAgentResult
     * Called by CreateCompanyModal (via CompaniesView) after the backend
     * returns the AI-generated prospecting result.
     */
    const handleAgentResult = (result: AgentResult | null) => {
        setIsProspecting(false);
        if (result) {
            setAgentResult(result);
            setAgentResults(prev => [result, ...prev]);
            setActiveNav("companies");
        }
    };

    // Show loading indicator immediately when the user submits the modal
    const handleAgentStart = () => {
        setIsProspecting(true);
        setAgentResult(null);
        setActiveNav("companies");
    };

    // ── Prospect All: iterate over all saved companies and prospect each ──
    const handleProspectAll = async () => {
        let companies: any[] = [];
        try { const s = localStorage.getItem("custbuds_companies"); if (s) companies = JSON.parse(s); } catch {}
        if (companies.length === 0) return;

        setIsProspecting(true);
        setActiveNav("prospecting");

        for (const company of companies) {
            const name = company["Company name"] || company.name || "";
            const domain = company.domain || "";
            if (!name && !domain) continue;
            try {
                const res = await fetch("http://localhost:5000/api/prospect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ companyName: name, domain }),
                });
                if (res.ok) {
                    const data = await res.json();
                    const result: AgentResult = { ...data, companyName: name };
                    setAgentResults(prev => [result, ...prev]);
                    setAgentResult(result);
                }
            } catch {}
        }
        setIsProspecting(false);
    };

    // ── Interactive Gmail Connect State ──
    const [isConnectingGmail, setIsConnectingGmail] = useState(false);
    const [isGmailConnected, setIsGmailConnected] = useState(false);

    const handleConnectGmail = () => {
        setIsConnectingGmail(true);
        // Simulate OAuth wait
        setTimeout(() => {
            setIsConnectingGmail(false);
            setIsGmailConnected(true);
            // Hide banner after 2 seconds of showing connected state
            setTimeout(() => setBannerVisible(false), 2000);
        }, 1500);
    };

    const crmNav = [
        { id: "contacts", label: "Contacts", icon: <ContactsIcon /> },
        { id: "companies", label: "Companies", icon: <CompaniesIcon /> },
        { id: "deals", label: "Deals", icon: <DealsIcon /> },
    ];
    
    const activitiesNav = [
        { id: "meetings", label: "Meetings", icon: <MeetingsIcon /> },
        { id: "calls", label: "Calls", icon: <CallsIcon /> },
    ];
    
    // Upgraded Agent SVGs
    const SparklesIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>;
    const TargetIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    const ShieldIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
    const EyeIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

    const agentNav = [
        { id: "prospecting", label: "Prospecting",    icon: SparklesIcon },
        { id: "deal-intel",  label: "Deal Intel",     icon: TargetIcon },
        { id: "retention",   label: "Retention",      icon: ShieldIcon },
        { id: "competitive", label: "Competitive",    icon: EyeIcon },
    ];

    const NavBtn = ({ id, label, icon, grad }: { id: string; label: string; icon?: React.ReactNode; grad?: string }) => {
        const isActive = activeNav === id;
        return (
            <button key={id} onClick={() => setActiveNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 text-left ${isActive ? "" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"}`}
                style={isActive ? { background: "#0ea5e9", color: "white" } : {}}>
                {grad ? (
                    <span className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg,${grad})` }}>
                        <svg viewBox="0 0 8 8" fill="white" className="w-2.5 h-2.5"><circle cx="4" cy="4" r="2" /></svg>
                    </span>
                ) : (
                    <span className={isActive ? "text-white" : "text-sky-300 opacity-80 group-hover:opacity-100"}>{icon}</span>
                )}
                {label}
            </button>
        );
    };

    return (
        <div
            className="flex h-screen bg-slate-100 overflow-hidden"
            style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
        >
            <aside
                className="w-52 flex-shrink-0 flex flex-col"
                style={{ background: "#0a1628" }}
            >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <HubSpotLogoIcon />
                    <span className="text-white font-semibold text-sm tracking-wide">
                        CustBuds
                    </span>
                </div>
                <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 px-3 pb-1 uppercase tracking-wider">CRM</div>
                    {crmNav.map(item => <NavBtn key={item.id} {...item} />)}
                    
                    <div className="text-xs font-semibold text-gray-500 px-3 pt-4 pb-1 uppercase tracking-wider">Activities</div>
                    {activitiesNav.map(item => <NavBtn key={item.id} {...item} />)}

                    <div className="text-xs font-semibold text-gray-500 px-3 pt-4 pb-1 uppercase tracking-wider">AI Agents</div>
                    {agentNav.map(item => <NavBtn key={item.id} {...item} />)}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header
                    className="flex items-center px-4 py-2.5 gap-4 border-b border-white/10 flex-shrink-0"
                    style={{ background: "#0a1628" }}
                >
                    <div className="w-36">
                        <span className="text-white text-xs font-semibold opacity-60 tracking-widest uppercase">
                            CRM
                        </span>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="relative w-full max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Search CustBuds"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 rounded-md text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-sky-400 transition-colors"
                                style={{ background: "#132140" }}
                            />
                        </div>
                    </div>
                    <div className="w-48 flex justify-end relative">
                        <button 
                            ref={accountBtnRef}
                            onClick={() => setShowAccountMenu(v => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                        >
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                                style={{ background: activeAccount.color }}
                            >
                                {activeAccount.name.charAt(0)}
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="text-[11px] font-semibold text-white">{activeAccount.name}</span>
                                <span className="text-[10px] text-gray-400 opacity-80">{activeAccount.email.split('@')[0]}</span>
                            </div>
                            <ChevronDownIcon />
                        </button>

                        {showAccountMenu && (
                            <div ref={accountMenuRef} className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 overflow-hidden">
                                <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Switch Account</p>
                                </div>
                                {accounts.map((acc, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => { setActiveAccount(acc); setShowAccountMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: acc.color }}>
                                            {acc.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className={`text-sm font-semibold truncate transition-colors ${activeAccount.email === acc.email ? 'text-sky-600' : 'text-gray-900 group-hover:text-sky-600'}`}>
                                                {acc.name}
                                            </span>
                                            <span className="text-xs text-gray-500 truncate">{acc.email}</span>
                                        </div>
                                        {activeAccount.email === acc.email && (
                                            <svg className="w-4 h-4 text-sky-500 ml-auto flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                    <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-gray-900 transition-colors">
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
                        {bannerVisible && (
                            <div className="relative bg-white rounded-lg border border-gray-200 px-5 py-4 shadow-sm">
                                <button
                                    onClick={() => setBannerVisible(false)}
                                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                                >
                                    <XIcon />
                                </button>
                                <p className="text-sm font-bold text-gray-900 mb-1 pr-6">
                                    Connect your email to sync all your contacts and conversations
                                    in one place
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                    CustBuds uses this connection to organize communication history
                                    and enrich profiles with accurate job titles, locations, and
                                    more.
                                </p>
                                <button
                                    onClick={handleConnectGmail}
                                    disabled={isConnectingGmail || isGmailConnected}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                                        isGmailConnected ? "bg-green-50 border-green-200 text-green-700" :
                                        isConnectingGmail ? "bg-gray-100 border-gray-200 text-gray-500 cursor-wait" :
                                        "border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {isConnectingGmail ? (
                                        <>
                                            <div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : isGmailConnected ? (
                                        <>✓ Connected</>
                                    ) : (
                                        <>
                                            <GmailIcon />
                                            Connect Gmail
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* ── Prospecting Loading Banner ── */}
                        {isProspecting && (
                            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-sky-200 shadow-sm"
                                style={{ background: "linear-gradient(135deg,#e0f2fe,#f0f9ff)" }}>
                                <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping flex-shrink-0" />
                                <span className="text-sm font-semibold text-sky-800">Prospecting Agent is researching your target…</span>
                                <span className="text-xs text-sky-500 ml-auto">This takes ~5–10 seconds</span>
                            </div>
                        )}

                        {/* ── Agent Result Panel ── */}
                        {agentResult && (
                            <AgentResultPanel
                                result={agentResult}
                                onClose={() => setAgentResult(null)}
                            />
                        )}

                        {activeNav === "contacts" ? <ContactsView /> :
                         activeNav === "companies" ? <CompaniesView onAgentStart={handleAgentStart} onAgentResult={handleAgentResult} /> :
                         activeNav === "deals" ? <PlaceholderView title="Deals Pipeline" desc="Manage your sales pipeline, track deal stages, and forecast revenue." /> :
                         activeNav === "meetings" ? <PlaceholderView title="Meetings" desc="Schedule, review, and follow up on your upcoming and past meetings." /> :
                         activeNav === "calls" ? <PlaceholderView title="Calls" desc="Log calls, review call transcripts, and track your outreach." /> :
                         activeNav === "prospecting" ? <ProspectingAgentView agentResults={agentResults} onProspectAll={handleProspectAll} /> :
                         activeNav === "deal-intel" ? <DealIntelligenceView /> :
                         activeNav === "retention" ? <RevenueRetentionView /> :
                         activeNav === "competitive" ? <CompetitiveIntelligenceView /> :
                         <CompaniesView onAgentStart={handleAgentStart} onAgentResult={handleAgentResult} />}
                    </div>
                </main>
            </div>
        </div>
    );
}