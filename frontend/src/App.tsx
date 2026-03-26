import React, { useState, useEffect, useRef, useMemo } from "react";

// â”€â”€ TableRow type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type TableRow = {
    id: number;
    [key: string]: any;
};

// â”€â”€ Agent Result type â€” mirrors the JSON returned by /api/agent/prospect â”€â”€
type AgentResult = {
    fitScore: number;
    scoreReasoning: string;
    email1: string;
    email2: string;
    researchSummary?: string;
    publicSignals?: {
        label: string;
        detail: string;
        source?: string;
        impact?: string;
    }[];
    fitBreakdown?: {
        label: string;
        score: number;
        summary: string;
    }[];
    buyerPersonas?: {
        name: string;
        title: string;
        why: string;
    }[];
    sequence?: {
        step: string;
        channel: string;
        timing: string;
        objective: string;
        message: string;
    }[];
    callOpener?: string;
    messagingAdjustments?: {
        signal: string;
        adjustment: string;
        talkingPoints: string[];
    }[];
    nextActions?: string[];
    generatedAt?: string;
    fallback?: boolean;
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

type DealRecord = {
    id: number;
    name: string;
    stage: string;
    owner: string;
    value: string;
    contact: string;
    account: string;
    priority: string;
    duration: string;
    expectedClose: string;
    status: "active" | "won";
};

type DealIntelRecovery = {
    headline: string;
    action: string;
    talkingPoints: string[];
};

type DealIntelRecord = {
    id: number;
    name: string;
    value: string;
    stage: string;
    health: number;
    risk: "High" | "Medium" | "Low";
    signals: string[];
    owner: string;
    close: string;
    company: string;
    contact: string;
    activityCount: number;
    lastActivityLabel: string;
    heatmapBars: number[];
    recovery: DealIntelRecovery | null;
};

type DealIntelAlert = {
    icon: string;
    msg: string;
    time: string;
    tone: "danger" | "info" | "positive";
};

type DealIntelRemoteAlert = DealIntelAlert & {
    dealId: number;
};

type DealIntelRemoteMonitor = DealIntelRecovery & {
    dealId: number;
};

type DealIntelModelResponse = {
    generatedAt?: string;
    fallback?: boolean;
    alerts: DealIntelRemoteAlert[];
    monitor: DealIntelRemoteMonitor[];
};

type DealHeatmapRow = {
    name: string;
    bars: number[];
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PROSPECTING AGENT RESULT PANEL
   Rendered in the main content area after the agent runs.
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

                {result.researchSummary && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Research Summary</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.researchSummary}</p>
                    </div>
                )}

                {/* Enriched intel pills */}
                {result.enrichedProfile && (
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">Industry: {result.enrichedProfile.industry}</span>
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">Team: {result.enrichedProfile.headcount_range}</span>
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-xs rounded-full font-medium">Contact: {result.enrichedProfile.key_contact.name} - {result.enrichedProfile.key_contact.title}</span>
                        {result.enrichedProfile.tech_stack.slice(0, 3).map(t => (
                            <span key={t} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full font-medium">{t}</span>
                        ))}
                    </div>
                )}

                {result.publicSignals && result.publicSignals.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Public Signals</div>
                        <div className="grid gap-2 md:grid-cols-3">
                            {result.publicSignals.slice(0, 3).map((signal, index) => (
                                <div key={`${signal.label}-${index}`} className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                                    <div className="text-xs font-semibold text-sky-700">{signal.label}</div>
                                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{signal.detail}</p>
                                </div>
                            ))}
                        </div>
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
                                Email 1 - Cold Outreach
                            </button>
                            <button onClick={() => setActiveEmail("email2")}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    activeEmail === "email2"
                                        ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                }`}
                                style={activeEmail === "email2" ? { background: "#0ea5e9" } : {}}>
                                Email 2 - Follow-up
                            </button>
                        </div>
                        <button onClick={copyToClipboard}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="font-semibold text-sm text-gray-800">{subject}</div>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{body}</div>
                    </div>
                </div>

                {result.messagingAdjustments && result.messagingAdjustments.length > 0 && (
                    <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Adaptive Messaging</div>
                        <div className="space-y-2">
                            {result.messagingAdjustments.slice(0, 2).map((item, index) => (
                                <div key={`${item.signal}-${index}`} className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                                    <div className="text-xs font-semibold text-amber-700">{item.signal}</div>
                                    <p className="mt-1 text-xs text-gray-700">{item.adjustment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {result.nextActions && result.nextActions.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Next Actions</div>
                        <div className="space-y-1.5">
                            {result.nextActions.slice(0, 3).map((action, index) => (
                                <div key={`${action}-${index}`} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                                    <span>{action}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTAs */}
                <div className="flex gap-2 pt-1">
                    <button className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                        style={{ background: "#0ea5e9" }}
                        onClick={() => alert("Sequence started! (Connect to your email provider)")}>Start Sequence</button>
                    <button className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors">Regenerate</button>
                    <button className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Schedule</button>
                </div>
            </div>
        </div>
    );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Editable Cell â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Create Company Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
                            placeholder="Rs 10,00,000"
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ CSV/Excel Import Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ImportModal({ columns, onClose, onImport }: {
    columns: string[];
    onClose: () => void;
    onImport: (rows: Record<string, string>[]) => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);

    const normaliseHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const tokeniseHeader = (value: string) =>
        value
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter(Boolean)
            .map(token => {
                if (token.endsWith("ies") && token.length > 3) return `${token.slice(0, -3)}y`;
                if (token.endsWith("ed") && token.length > 4) return token.slice(0, -1);
                if (token.endsWith("s") && token.length > 3) return token.slice(0, -1);
                return token;
            });

    const findMatchingHeaderIndex = (headers: string[], column: string) => {
        const columnNormalised = normaliseHeader(column);
        const columnTokens = tokeniseHeader(column);
        let bestIndex = -1;
        let bestScore = -1;

        headers.forEach((header, index) => {
            const headerNormalised = normaliseHeader(header);
            const headerTokens = tokeniseHeader(header);
            let score = -1;

            if (headerNormalised === columnNormalised) {
                score = 4;
            } else if (headerTokens.join("") === columnTokens.join("")) {
                score = 3;
            } else if (
                columnTokens.length > 1 &&
                columnTokens.every(token => headerTokens.includes(token))
            ) {
                score = 2;
            } else if (
                headerTokens.length > 1 &&
                headerTokens.every(token => columnTokens.includes(token))
            ) {
                score = 1;
            }

            if (score > bestScore) {
                bestScore = score;
                bestIndex = index;
            }
        });

        return bestScore >= 0 ? bestIndex : -1;
    };

    const reconcileRowLength = (headers: string[], row: string[]) => {
        if (row.length === headers.length) return row;

        let nextRow = [...row];
        if (nextRow.length > headers.length) {
            const moneyColumnIndex = headers.findIndex(header =>
                /(dealvalue|amount|revenue|value)/.test(normaliseHeader(header))
            );

            if (moneyColumnIndex >= 0) {
                const extraCells = nextRow.length - headers.length;
                const mergedValue = nextRow
                    .slice(moneyColumnIndex, moneyColumnIndex + extraCells + 1)
                    .join(",");
                nextRow = [
                    ...nextRow.slice(0, moneyColumnIndex),
                    mergedValue,
                    ...nextRow.slice(moneyColumnIndex + extraCells + 1),
                ];
            }
        }

        if (nextRow.length < headers.length) {
            return [...nextRow, ...Array(headers.length - nextRow.length).fill("")];
        }

        return nextRow.slice(0, headers.length);
    };

    const parseCSV = (text: string) => {
        const source = text.replace(/^\uFEFF/, "");
        const firstLine = source.split(/\r?\n/).find(line => line.trim() !== "") || "";
        const delimiter = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? "\t" : ",";
        const parsedRows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = "";
        let inQuotes = false;

        for (let i = 0; i < source.length; i += 1) {
            const char = source[i];
            const nextChar = source[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentCell += '"';
                    i += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (!inQuotes && char === delimiter) {
                currentRow.push(currentCell.trim());
                currentCell = "";
                continue;
            }

            if (!inQuotes && (char === "\n" || char === "\r")) {
                if (char === "\r" && nextChar === "\n") i += 1;
                currentRow.push(currentCell.trim());
                currentCell = "";
                if (currentRow.some(cell => cell !== "")) parsedRows.push(currentRow);
                currentRow = [];
                continue;
            }

            currentCell += char;
        }

        if (currentCell !== "" || currentRow.length > 0) {
            currentRow.push(currentCell.trim());
            if (currentRow.some(cell => cell !== "")) parsedRows.push(currentRow);
        }

        if (parsedRows.length < 2) return null;
        const [headers, ...dataRows] = parsedRows;
        const rows = dataRows.map(row => reconcileRowLength(headers, row));
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
            const idx = findMatchingHeaderIndex(headers, col);
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
                    <p className="text-xs text-gray-500">Upload a <strong>CSV</strong> file. The first row must be a header row matching the table columns (e.g. <em>{columns.slice(0, 3).join(", ")}</em>...). Data rows below will be auto-sorted into the correct columns.</p>
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
                            <p className="text-xs text-green-600 font-semibold">Detected {preview.rows.length} data row(s) with columns: {preview.headers.join(", ")}</p>
                            <div className="overflow-x-auto border border-gray-200 rounded">
                                <table className="text-xs w-full min-w-max">
                                    <thead><tr className="bg-gray-50 border-b">{preview.headers.map(h => <th key={h} className="px-2 py-1.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                                    <tbody>{preview.rows.slice(0, 4).map((r, i) => <tr key={i} className="border-b border-gray-100">{r.map((c, j) => <td key={j} className="px-2 py-1 text-gray-700 whitespace-nowrap">{c}</td>)}</tr>)}</tbody>
                                </table>
                            </div>
                            {preview.rows.length > 4 && <p className="text-xs text-gray-400">...and {preview.rows.length - 4} more rows</p>}
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

function AddOptionsMenu({
    buttonLabel,
    onCreate,
    onImport,
}: {
    buttonLabel: string;
    onCreate: () => void;
    onImport: () => void;
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setOpen(current => !current)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#0ea5e9,#14b8a6)" }}
            >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {buttonLabel}
                <ChevronDownIcon />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden"
                >
                    <button
                        onClick={() => {
                            setOpen(false);
                            onCreate();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Create new
                    </button>
                    <button
                        onClick={() => {
                            setOpen(false);
                            onImport();
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Import
                    </button>
                </div>
            )}
        </div>
    );
}

function SelectAllCheckbox({
    checked,
    indeterminate,
    onChange,
    className = "",
}: {
    checked: boolean;
    indeterminate: boolean;
    onChange: () => void;
    className?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate && !checked;
        }
    }, [checked, indeterminate]);

    return (
        <input
            ref={inputRef}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className={`w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500 ${className}`}
        />
    );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Create Contact Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

function ContactDetailsModal({
    contact,
    columns,
    onClose,
}: {
    contact: TableRow;
    columns: string[];
    onClose: () => void;
}) {
    const displayName = String(contact["Name"] || contact["Email"] || "Contact").trim();
    const avatarLetter = displayName.charAt(0).toUpperCase() || "?";
    const orderedFields = Array.from(
        new Set([
            ...columns.filter(column => column !== "id"),
            ...Object.keys(contact).filter(key => key !== "id"),
        ])
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Full details for this contact</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100">
                        <XIcon size="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-sky-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                                {avatarLetter}
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-bold text-gray-900 break-words">{displayName}</div>
                                <div className="text-sm text-slate-500 break-words">{String(contact["Email"] || "No email")}</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {orderedFields.map(field => (
                            <div key={field} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{field}</div>
                                <div className="mt-1 text-sm text-gray-800 break-words">{String(contact[field] || "--")}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Contacts View â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CONTACTS_KEY = "custbuds_contacts";
const CONTACTS_COLS_KEY = "custbuds_contacts_cols";

function ContactsView() {
    const [tableSearch, setTableSearch] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [showCreateContact, setShowCreateContact] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<number | null>(null);

    // â”€â”€ Pagination State â”€â”€
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
    const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);

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
    useEffect(() => {
        setSelectedContactIds(current => current.filter(id => contacts.some(contact => contact.id === id)));
    }, [contacts]);

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
    const visibleContactIds = paginatedData.map(contact => contact.id);
    const allVisibleContactsSelected = visibleContactIds.length > 0 && visibleContactIds.every(id => selectedContactIds.includes(id));
    const someVisibleContactsSelected = visibleContactIds.some(id => selectedContactIds.includes(id)) && !allVisibleContactsSelected;

    const toggleContactSelection = (id: number) => {
        setSelectedContactIds(current =>
            current.includes(id)
                ? current.filter(selectedId => selectedId !== id)
                : [...current, id]
        );
    };

    const toggleSelectAllContacts = () => {
        setSelectedContactIds(current =>
            allVisibleContactsSelected
                ? current.filter(id => !visibleContactIds.includes(id))
                : Array.from(new Set([...current, ...visibleContactIds]))
        );
    };

    const deleteSelectedContacts = () => {
        setContacts(current => current.filter(contact => !selectedContactIds.includes(contact.id)));
        setSelectedContactIds([]);
    };

    const activeContact = selectedContactId !== null
        ? contacts.find(contact => contact.id === selectedContactId) || null
        : null;

    const handleContactNameClick = (event: React.MouseEvent, contactId: number) => {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            setSelectedContactId(contactId);
        }
    };

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
            {activeContact && <ContactDetailsModal contact={activeContact} columns={columns} onClose={() => setSelectedContactId(null)} />}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                    <div className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 border-sky-500 text-sky-600">
                        <span>All contacts</span>
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold bg-sky-500 text-white">
                            {filtered.length}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon /></span>
                        <input type="text" placeholder="Search..." value={tableSearch} onChange={e => setTableSearch(e.target.value)}
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-sky-400 w-36" />
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">Table view <ChevronDownIcon /></button>
                    <div className="flex items-center gap-1.5 ml-auto">
                        {selectedContactIds.length > 0 && (
                            <button
                                onClick={deleteSelectedContacts}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                            >
                                Delete selected ({selectedContactIds.length})
                            </button>
                        )}
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
                                                <span className="text-sky-500 font-bold">{sortRule.asc ? "ASC" : "DESC"}</span>
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
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: 'max-content', width: '100%' }} className="text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-200">
                                <th className="w-8 px-2 py-2.5 border-r border-gray-200 bg-slate-50 sticky left-0 z-10">
                                    <SelectAllCheckbox
                                        checked={allVisibleContactsSelected}
                                        indeterminate={someVisibleContactsSelected}
                                        onChange={toggleSelectAllContacts}
                                    />
                                </th>
                                {columns.map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap border-r border-gray-200">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((c: any) => (
                                <tr key={c.id} className="border-b border-gray-100 hover:bg-sky-50/20 transition-colors group">
                                    <td className="w-8 px-2 py-3 border-r border-gray-200 bg-white group-hover:bg-sky-50/20 sticky left-0 text-center align-middle transition-colors z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedContactIds.includes(c.id)}
                                            onChange={() => toggleContactSelection(c.id)}
                                            className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500"
                                        />
                                    </td>
                                    {columns.map((col, ci) => (
                                        <td key={col} className="px-3 py-3 border-r border-gray-200 relative">
                                            {ci === 0 ? (
                                                <div
                                                    className="flex items-center gap-2"
                                                    onClick={(event) => handleContactNameClick(event, c.id)}
                                                    title="Ctrl + click to view full contact details"
                                                >
                                                    <div className="w-5 h-5 rounded-full flex-shrink-0 bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                                                        {String(c[col] || c["Email"] || "?").trim().charAt(0).toUpperCase() || "?"}
                                                    </div>
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
                            {"< Prev"}
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
                            {"Next >"}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Companies View â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CompaniesView({ onAgentStart, onAgentResult }: { onAgentStart?: () => void, onAgentResult?: (r: AgentResult | null) => void }) {
    const [tableSearch, setTableSearch] = useState("");
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [isProspectingSelected, setIsProspectingSelected] = useState(false);

    // â”€â”€ Pagination State â”€â”€
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
    const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);

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
        setSelectedCompanyIds(current => current.filter(id => companies.some(company => company.id === id)));
    }, [companies]);

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
    const visibleCompanyIds = paginatedData.map(company => company.id);
    const allVisibleCompaniesSelected = visibleCompanyIds.length > 0 && visibleCompanyIds.every(id => selectedCompanyIds.includes(id));
    const someVisibleCompaniesSelected = visibleCompanyIds.some(id => selectedCompanyIds.includes(id)) && !allVisibleCompaniesSelected;

    const toggleCompanySelection = (id: number) => {
        setSelectedCompanyIds(current =>
            current.includes(id)
                ? current.filter(selectedId => selectedId !== id)
                : [...current, id]
        );
    };

    const toggleSelectAllCompanies = () => {
        setSelectedCompanyIds(current =>
            allVisibleCompaniesSelected
                ? current.filter(id => !visibleCompanyIds.includes(id))
                : Array.from(new Set([...current, ...visibleCompanyIds]))
        );
    };

    const deleteSelectedCompanies = () => {
        setCompanies(current => current.filter(company => !selectedCompanyIds.includes(company.id)));
        setSelectedCompanyIds([]);
    };

    const handleProspectSelectedCompany = async () => {
        if (!onAgentStart || !onAgentResult || selectedCompanyIds.length !== 1 || isProspectingSelected) return;
        const selectedCompany = companies.find(company => company.id === selectedCompanyIds[0]);
        if (!selectedCompany) return;

        const companyName = selectedCompany["Company name"] || selectedCompany.name || "";
        if (!companyName) return;

        setIsProspectingSelected(true);
        onAgentStart();

        try {
            const res = await fetch("http://localhost:5000/api/agent/prospect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyName,
                    city: selectedCompany["City"] || selectedCompany.city || "",
                    companySize: selectedCompany["Company Size"] || selectedCompany.companySize || "",
                    type: selectedCompany["Type"] || selectedCompany.type || "Prospect",
                }),
            });

            if (!res.ok) throw new Error(`Prospecting failed with status ${res.status}`);

            const data: AgentResult = await res.json();
            onAgentResult({ ...data, companyName });
        } catch {
            onAgentResult(null);
        } finally {
            setIsProspectingSelected(false);
        }
    };

    return (
        <>
            {showCreateModal && <CreateCompanyModal onClose={() => setShowCreateModal(false)} onSave={handleSaveNew} onAgentStart={onAgentStart} onAgentResult={onAgentResult} />}
            {showImport && <ImportModal columns={columns} onClose={() => setShowImport(false)} onImport={handleImport} />}
            {/* Note: CompaniesView passes onAgentResult through the dashboard â€” see CRMDashboard */}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                    <div className="flex items-center gap-1.5 px-1 py-2.5 text-sm font-medium border-b-2 mr-4 border-sky-500 text-sky-600">
                        <span>All companies</span>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold bg-sky-500 text-white">
                            {filtered.length}
                        </span>
                    </div>
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
                        {onAgentStart && onAgentResult && (
                            <button
                                onClick={handleProspectSelectedCompany}
                                disabled={selectedCompanyIds.length !== 1 || isProspectingSelected}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    selectedCompanyIds.length === 1 && !isProspectingSelected
                                        ? "bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100"
                                        : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                }`}
                            >
                                {isProspectingSelected
                                    ? "Prospecting..."
                                    : selectedCompanyIds.length === 1
                                    ? "Prospect selected"
                                    : "Select one to prospect"}
                            </button>
                        )}
                        {selectedCompanyIds.length > 0 && (
                            <button
                                onClick={deleteSelectedCompanies}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                            >
                                Delete selected ({selectedCompanyIds.length})
                            </button>
                        )}
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
                                                <span className="text-sky-500 font-bold">{sortRule.asc ? "ASC" : "DESC"}</span>
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
                    </div>
                </div>

                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: 'max-content', width: '100%' }} className="text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-200">
                                <th className="w-8 px-2 py-2.5 border-r border-gray-200 bg-slate-50 sticky left-0 z-10">
                                    <SelectAllCheckbox
                                        checked={allVisibleCompaniesSelected}
                                        indeterminate={someVisibleCompaniesSelected}
                                        onChange={toggleSelectAllCompanies}
                                    />
                                </th>
                                {columns.map(h => (
                                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide whitespace-nowrap border-r border-gray-200">
                                        {h}
                                    </th>
                                ))}
                                <th className="w-8 px-2 py-1.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((company: any) => (
                                <tr key={company.id} className="border-b border-gray-100 hover:bg-sky-50/20 transition-colors group">
                                    <td className="w-8 px-2 py-3 border-r border-gray-200 bg-white group-hover:bg-sky-50/20 sticky left-0 text-center align-middle transition-colors z-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedCompanyIds.includes(company.id)}
                                            onChange={() => toggleCompanySelection(company.id)}
                                            className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500"
                                        />
                                    </td>
                                    {columns.map((col, ci) => (
                                        <td key={col} className="px-3 py-3 border-r border-gray-200 relative">
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
                            {"< Prev"}
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
                            {"Next >"}
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

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   AI AGENT VIEWS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€â”€â”€ Shared agent UI helpers â”€â”€â”€â”€ */
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
                    {deltaUp ? "+" : "-"} {delta}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ 1. Prospecting Agent View â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ProspectingAgentView({
    agentResults = [],
    onProspectAll,
    isProspecting = false,
}: {
    agentResults?: AgentResult[];
    onProspectAll?: () => void;
    isProspecting?: boolean;
}) {
    const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
    const [emailTab, setEmailTab] = useState<'email1' | 'email2'>('email1');
    const [editedEmail1, setEditedEmail1] = useState('');
    const [editedEmail2, setEditedEmail2] = useState('');
    const [forwardTo, setForwardTo] = useState('');
    const [forwarded, setForwarded] = useState(false);

    const scoreColor = (s: number) => s >= 90 ? "#22c55e" : s >= 75 ? "#f59e0b" : "#94a3b8";

    const targetsResearched = agentResults.length;
    const sequencesReady = agentResults.filter(r => (r.sequence?.length || 0) > 0 || r.email1 || r.email2).length;
    const avgFitScore = agentResults.length > 0
        ? Math.round(agentResults.reduce((sum, r) => sum + (r.fitScore || 0), 0) / agentResults.length)
        : 0;
    const highFitTargets = agentResults.filter(r => r.fitScore >= 80).length;
    const researchSignals = agentResults.reduce((sum, r) => sum + (r.publicSignals?.length || 0), 0);
    const adaptivePlays = agentResults.reduce((sum, r) => sum + (r.messagingAdjustments?.length || 0), 0);

    const activityLog = agentResults.flatMap((result, index) => {
        const items = [
            {
                time: `${index + 1}m ago`,
                action: `Researched ${result.companyName} across ${result.publicSignals?.length || 0} public signals`,
                color: "#6366f1",
            },
            {
                time: `${index + 2}m ago`,
                action: `Built ${Math.max(result.sequence?.length || 0, result.email1 || result.email2 ? 2 : 0)} outreach steps for ${result.enrichedProfile?.key_contact?.name || "the buying team"}`,
                color: "#0ea5e9",
            },
        ];

        if (result.messagingAdjustments && result.messagingAdjustments.length > 0) {
            items.push({
                time: `${index + 3}m ago`,
                action: `Prepared adaptive messaging for ${result.companyName} based on engagement scenarios`,
                color: "#f59e0b",
            });
        }

        return items;
    }).slice(0, 12);

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
                            <h1 className="text-lg font-bold text-gray-900">Prospecting agents</h1>
                            <p className="text-xs text-gray-400 max-w-3xl">Prospecting agents — that research targets across public data sources, score fit, write personalized outreach sequences, and adjust messaging based on engagement signals — without manual intervention.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <AgentStatusBadge status={isProspecting ? "running" : "idle"} />
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

            {/* Metrics â€” computed from real data */}
            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Targets Researched" value={String(targetsResearched)} sub={targetsResearched === 0 ? "No targets yet" : `${targetsResearched} processed`} />
                <MetricCard label="High-Fit Accounts" value={String(highFitTargets)} sub={highFitTargets === 0 ? "Awaiting strong fits" : "80+ fit score"} />
                <MetricCard label="Sequences Ready" value={String(sequencesReady)} sub={sequencesReady === 0 ? "No sequences yet" : `${sequencesReady} ready to send`} />
                <MetricCard label="Avg. Fit Score" value={avgFitScore > 0 ? String(avgFitScore) : "--"} sub="/ 100" />
                <MetricCard label="Research Signals" value={String(researchSignals)} sub="Captured from public inputs" />
                <MetricCard label="Adaptive Plays" value={String(adaptivePlays)} sub="Messaging adjustments ready" />
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
                        <p className="text-xs text-gray-500 max-w-sm">No companies have been prospected yet. Go to the CRM {"->"} Companies tab and click "Create + Prospect" to generate targeted outreach!</p>
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
                                                                <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">AI Outreach Sequence - {contactName.split(" ")[0]}</span>
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
                                                                    {forwarded ? 'Sent' : 'Send Email'}
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedTarget(null); }}
                                                                    className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                                                                    Discard
                                                                </button>
                                                            </div>

                                                            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                                                                <div className="space-y-3">
                                                                    {t.researchSummary && (
                                                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Research Brief</div>
                                                                            <p className="text-sm text-gray-700 leading-relaxed">{t.researchSummary}</p>
                                                                        </div>
                                                                    )}

                                                                    {t.publicSignals && t.publicSignals.length > 0 && (
                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Public Signals</div>
                                                                            <div className="space-y-2">
                                                                                {t.publicSignals.slice(0, 3).map((signal, signalIndex) => (
                                                                                    <div key={`${signal.label}-${signalIndex}`} className="rounded-lg border border-sky-100 bg-sky-50/70 p-3">
                                                                                        <div className="text-xs font-semibold text-sky-700">{signal.label}</div>
                                                                                        <p className="mt-1 text-xs text-gray-700">{signal.detail}</p>
                                                                                        {signal.impact && <p className="mt-1 text-[11px] text-slate-500">{signal.impact}</p>}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {t.fitBreakdown && t.fitBreakdown.length > 0 && (
                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Fit Breakdown</div>
                                                                            <div className="space-y-3">
                                                                                {t.fitBreakdown.slice(0, 4).map((item, itemIndex) => (
                                                                                    <div key={`${item.label}-${itemIndex}`}>
                                                                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                                                                                            <span>{item.label}</span>
                                                                                            <span>{item.score}/100</span>
                                                                                        </div>
                                                                                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1.5">
                                                                                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${item.score}%` }} />
                                                                                        </div>
                                                                                        <p className="text-[11px] text-slate-500">{item.summary}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {t.sequence && t.sequence.length > 0 && (
                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Outreach Sequence</div>
                                                                            <div className="space-y-2">
                                                                                {t.sequence.slice(0, 4).map((step, stepIndex) => (
                                                                                    <div key={`${step.step}-${stepIndex}`} className="rounded-lg border border-gray-100 bg-slate-50 p-3">
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <span className="text-xs font-semibold text-gray-800">{step.step} · {step.channel}</span>
                                                                                            <span className="text-[11px] text-slate-500">{step.timing}</span>
                                                                                        </div>
                                                                                        <div className="mt-1 text-xs font-medium text-sky-700">{step.objective}</div>
                                                                                        <p className="mt-1 text-xs text-gray-600 leading-relaxed">{step.message}</p>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {t.messagingAdjustments && t.messagingAdjustments.length > 0 && (
                                                                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                                                            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Adaptive Messaging</div>
                                                                            <div className="space-y-2">
                                                                                {t.messagingAdjustments.slice(0, 3).map((item, itemIndex) => (
                                                                                    <div key={`${item.signal}-${itemIndex}`} className="rounded-lg border border-amber-200 bg-white/70 p-3">
                                                                                        <div className="text-xs font-semibold text-gray-800">{item.signal}</div>
                                                                                        <p className="mt-1 text-xs text-gray-700">{item.adjustment}</p>
                                                                                        <div className="mt-2 space-y-1">
                                                                                            {item.talkingPoints.slice(0, 3).map((point, pointIndex) => (
                                                                                                <div key={`${point}-${pointIndex}`} className="flex items-start gap-2 text-[11px] text-slate-600">
                                                                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                                                                                    <span>{point}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {t.nextActions && t.nextActions.length > 0 && (
                                                                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                                                                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Next Best Actions</div>
                                                                            <div className="space-y-2">
                                                                                {t.nextActions.slice(0, 4).map((action, actionIndex) => (
                                                                                    <div key={`${action}-${actionIndex}`} className="flex items-start gap-2 text-sm text-gray-700">
                                                                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                                                                                        <span>{action}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
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

            {/* Agent Activity Log â€” dynamic */}
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ 2. Deal Intelligence Agent View â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DealIntelligenceView({ agentResults = [] }: { agentResults?: AgentResult[] }) {
    const [refreshTick, setRefreshTick] = useState(0);
    const [modelIntel, setModelIntel] = useState<DealIntelModelResponse | null>(null);

    useEffect(() => {
        const intervalId = window.setInterval(() => setRefreshTick(tick => tick + 1), 15000);
        const focusHandler = () => setRefreshTick(tick => tick + 1);
        window.addEventListener("focus", focusHandler);
        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", focusHandler);
        };
    }, []);

    const healthColor = (health: number) => health >= 75 ? "#22c55e" : health >= 50 ? "#f59e0b" : "#ef4444";
    const riskBg = (risk: string) => risk === "High" ? "bg-red-50 text-red-700" : risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700";

    const recoveryForDeal = (categories: Set<string>, deal: DealRecord, research?: AgentResult) => {
        if (categories.size === 0) return null;
        const companyLabel = hasMeaningfulValue(deal.account) ? deal.account : deal.name;
        const proofPoint = research?.publicSignals?.[0]?.detail || research?.researchSummary || `${companyLabel}'s growth priorities`;

        if (categories.has("competitive")) {
            return {
                headline: "Reframe differentiation before the comparison hardens",
                action: "Share a short battlecard and ask which competitor claim needs to be answered.",
                talkingPoints: [
                    "Lead with why an AI-native CRM changes seller workflow, not just reporting.",
                    `Reference ${proofPoint}.`,
                    "Ask which evaluation criterion matters most before the next call.",
                ],
            };
        }

        if (categories.has("engagement")) {
            return {
                headline: "Reset momentum with a sharper business hypothesis",
                action: "Run a re-engagement touch that names one problem and one low-friction next step.",
                talkingPoints: [
                    `Anchor on the cost of stalled follow-up or weak pipeline visibility at ${companyLabel}.`,
                    `Tie the message back to ${deal.stage.toLowerCase()} momentum instead of product features.`,
                    "Offer a 15-minute workflow teardown with two concrete outcomes.",
                ],
            };
        }

        if (categories.has("stakeholder")) {
            return {
                headline: "Broaden stakeholder coverage before the deal stalls",
                action: "Add one operational stakeholder and one economic stakeholder to the next step.",
                talkingPoints: [
                    "Confirm who owns the workflow problem internally.",
                    "Ask who will evaluate process impact and implementation effort.",
                    "Position CustBuds as a shared workflow layer across sales leadership and RevOps.",
                ],
            };
        }

        if (categories.has("timeline")) {
            return {
                headline: "Close the gap between stage and close date",
                action: "Re-baseline the mutual plan and agree on a realistic decision path.",
                talkingPoints: [
                    `Point out the compressed timeline between ${deal.stage.toLowerCase()} and the target close.`,
                    "Ask which approvals or proof points are still missing.",
                    "Offer a tighter pilot or success plan instead of a broad rollout conversation.",
                ],
            };
        }

        return {
            headline: "Tighten coverage before the deal weakens further",
            action: "Fill the missing CRM context and reconnect the opportunity to a clear business pain.",
            talkingPoints: [
                `Use ${proofPoint} as the opening context.`,
                "Confirm owner, contact, and next-step accountability.",
                "Move the conversation from generic interest to a concrete workflow bottleneck.",
            ],
        };
    };

    const localIntelligence = useMemo(() => {
        const activeDeals = (readStoredRows(DEALS_STORAGE_KEY) as DealRecord[]).filter(deal => deal.status === "active");
        const meetings = readStoredRows("custbuds_meetings");
        const calls = readStoredRows("custbuds_calls");
        const storedResults = readStoredRows("custbuds_agent_results") as unknown as AgentResult[];
        const researchMap = new Map<string, AgentResult>();
        [...agentResults, ...storedResults].forEach(result => {
            const key = normaliseLookupKey(result.companyName);
            if (key && !researchMap.has(key)) researchMap.set(key, result);
        });

        const liveDeals = activeDeals.map(deal => {
            const companyLabel = hasMeaningfulValue(deal.account) ? deal.account : deal.name;
            const companyKey = normaliseLookupKey(companyLabel);
            const contactKey = normaliseLookupKey(deal.contact);
            const relatedMeetings = meetings.filter(row => {
                const rowCompany = normaliseLookupKey(row["Company"]);
                const rowContact = normaliseLookupKey(row["Contact"]);
                return (companyKey && rowCompany === companyKey) || (contactKey && rowContact === contactKey);
            });
            const relatedCalls = calls.filter(row => {
                const rowCompany = normaliseLookupKey(row["Company"]);
                const rowContact = normaliseLookupKey(row["Contact"]);
                return (companyKey && rowCompany === companyKey) || (contactKey && rowContact === contactKey);
            });
            const relatedActivities = [...relatedMeetings, ...relatedCalls];
            const parsedDates = relatedActivities
                .map(row => extractParsedActivityDate(row))
                .filter((value): value is Date => Boolean(value))
                .sort((a, b) => b.getTime() - a.getTime());
            const lastActivity = parsedDates[0] || null;
            const daysSinceActivity = lastActivity ? Math.max(0, -daysBetween(lastActivity)) : null;
            const closeDate = parseLooseDate(deal.expectedClose);
            const daysToClose = closeDate ? daysBetween(closeDate) : null;
            const research = researchMap.get(companyKey);
            const stageKey = deal.stage.toLowerCase();
            const lateStage = ["proposal", "proposal sent", "negotiation", "demo done"].includes(stageKey);
            const activityText = relatedActivities
                .map(row => [row["Meeting"], row["Call"], row["Status"], row["Next Step"], row["Company"], row["Contact"]].filter(Boolean).join(" "))
                .join(" ");

            let health = 76;
            const signals: string[] = [];
            const categories = new Set<string>();
            let severeSignals = 0;

            const addSignal = (category: string, text: string, impact: number, severe = false) => {
                categories.add(category);
                signals.push(text);
                health -= impact;
                if (severe) severeSignals += 1;
            };

            if (!hasMeaningfulValue(deal.owner)) addSignal("ownership", "Deal owner is still unassigned", 16, true);
            if (!hasMeaningfulValue(deal.contact)) addSignal("stakeholder", "No active stakeholder mapped on the deal", 16, true);
            if (!hasMeaningfulValue(deal.account)) addSignal("coverage", "Deal is not linked to a company record", 10);
            if (!research) addSignal("research", "No prospect research brief captured for this company yet", 8);

            if (relatedActivities.length === 0) {
                addSignal("engagement", lateStage ? "Late-stage deal has no meetings or calls logged" : "No engagement activity logged yet", lateStage ? 20 : 12, lateStage);
            } else if (daysSinceActivity !== null && daysSinceActivity > 7) {
                addSignal("engagement", `Engagement dropped: no dated activity in ${daysSinceActivity} days`, 18, true);
            }

            if (/cancel|no show|no-show|missed|no answer|voicemail|resched|stalled/i.test(activityText)) addSignal("engagement", "Recent activity status suggests friction or a stalled follow-up", 14);
            if (/salesforce|hubspot|zoho|freshsales|pipedrive|competitor/i.test(activityText)) addSignal("competitive", "Competitor language detected in meeting or call notes", 16, true);
            if (lateStage && relatedActivities.length < 2) addSignal("stakeholder", "Late-stage deal is under-threaded across stakeholders", 10);
            if (daysToClose !== null && daysToClose <= 10 && !lateStage) addSignal("timeline", "Close date is aggressive for the current stage", 12);

            if (daysSinceActivity !== null && daysSinceActivity <= 3) health += 8;
            if (relatedActivities.length >= 2) health += 5;
            if ((research?.fitScore || 0) >= 80) health += 4;

            health = Math.max(0, Math.min(100, Math.round(health)));
            const risk: "High" | "Medium" | "Low" = health < 50 || severeSignals >= 2 ? "High" : health < 75 || signals.length >= 2 ? "Medium" : "Low";
            const heatmapBars = [0, 0, 0, 0, 0, 0, 0];
            relatedActivities.forEach(row => {
                const parsedDate = extractParsedActivityDate(row);
                if (!parsedDate) return;
                const daysAgo = Math.max(0, -daysBetween(parsedDate));
                if (daysAgo <= 6) heatmapBars[6 - daysAgo] += 1;
            });

            return {
                id: deal.id,
                name: deal.name,
                value: deal.value,
                stage: deal.stage,
                health,
                risk,
                signals: signals.length > 0 ? signals.slice(0, 4) : ["No material risk signals detected from current CRM data"],
                owner: deal.owner,
                close: deal.expectedClose,
                company: companyLabel,
                contact: deal.contact,
                activityCount: relatedActivities.length,
                lastActivityLabel: formatRelativeDayLabel(lastActivity),
                heatmapBars,
                recovery: recoveryForDeal(categories, deal, research),
            } as DealIntelRecord;
        }).sort((a, b) => a.health - b.health);

        return {
            deals: liveDeals,
            atRiskDeals: liveDeals.filter(deal => deal.risk !== "Low").length,
            avgHealth: liveDeals.length > 0 ? Math.round(liveDeals.reduce((sum, deal) => sum + deal.health, 0) / liveDeals.length) : 0,
            pipelineValue: liveDeals.reduce((sum, deal) => sum + parseDealValue(deal.value), 0),
            recoveryCount: liveDeals.filter(deal => deal.recovery).length,
            signalCount: liveDeals.reduce((sum, deal) => sum + deal.signals.length, 0),
            heatmapRows: liveDeals.slice(0, 5).map(deal => ({ name: deal.name, bars: deal.heatmapBars })),
            alerts: liveDeals.flatMap(deal => deal.signals.slice(0, 2).map(signal => ({
                icon: deal.risk === "High" ? "!" : deal.risk === "Medium" ? "i" : "+",
                msg: `${deal.name}: ${signal}`,
                time: deal.lastActivityLabel,
                tone: deal.risk === "High" ? "danger" : deal.risk === "Medium" ? "info" : "positive",
            } as DealIntelAlert))).slice(0, 5),
        };
    }, [agentResults, refreshTick]);

    const modelPayload = useMemo(() => JSON.stringify({
        deals: localIntelligence.deals.map(deal => ({
            id: deal.id,
            name: deal.name,
            value: deal.value,
            stage: deal.stage,
            health: deal.health,
            risk: deal.risk,
            signals: deal.signals,
            owner: deal.owner,
            close: deal.close,
            company: deal.company,
            contact: deal.contact,
            activityCount: deal.activityCount,
            lastActivityLabel: deal.lastActivityLabel,
            recovery: deal.recovery,
        })),
    }), [localIntelligence.deals]);

    useEffect(() => {
        if (localIntelligence.deals.length === 0) {
            setModelIntel(null);
            return;
        }

        let ignore = false;

        const run = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/agent/deal-intelligence", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: modelPayload,
                });
                if (!res.ok) throw new Error(`Deal intelligence failed with status ${res.status}`);
                const data: DealIntelModelResponse = await res.json();
                if (!ignore) setModelIntel(data);
            } catch {
                if (!ignore) setModelIntel(null);
            }
        };

        run();

        return () => {
            ignore = true;
        };
    }, [localIntelligence.deals.length, modelPayload]);

    const intelligence = useMemo(() => {
        if (!modelIntel) return localIntelligence;

        const monitorByDealId = new Map(modelIntel.monitor.map(entry => [entry.dealId, entry]));

        return {
            ...localIntelligence,
            deals: localIntelligence.deals.map(deal => ({
                ...deal,
                recovery: monitorByDealId.get(deal.id) || deal.recovery,
            })),
            alerts: modelIntel.alerts.length > 0 ? modelIntel.alerts : localIntelligence.alerts,
        };
    }, [localIntelligence, modelIntel]);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)" }}>
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" /></svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Deal intelligence agents</h1>
                            <p className="text-xs text-gray-400 max-w-3xl">Deal intelligence agents — that monitor pipeline health in real time, pick up risk signals (engagement drops, competitor mentions, stakeholder changes), and generate recovery plays with specific talking points.</p>
                        </div>
                    </div>
                    <AgentStatusBadge status={intelligence.atRiskDeals > 0 ? "alert" : "idle"} />
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Active Deals" value={String(intelligence.deals.length)} sub={formatDealValue(intelligence.pipelineValue)} />
                <MetricCard label="At-Risk Deals" value={String(intelligence.atRiskDeals)} sub={intelligence.atRiskDeals === 0 ? "No active alerts" : "Needs recovery attention"} />
                <MetricCard label="Avg. Health Score" value={intelligence.deals.length > 0 ? String(intelligence.avgHealth) : "--"} sub="/ 100" />
                <MetricCard label="Recovery Plays Ready" value={String(intelligence.recoveryCount)} sub="Generated from CRM signals" />
                <MetricCard label="Signals Detected" value={String(intelligence.signalCount)} sub="Across deals, calls, and meetings" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5">
                    <SectionHeader title="Pipeline Risk Monitor" description="Live scoring generated from saved deal, meeting, call, and research data" />
                </div>
                {intelligence.deals.length === 0 ? (
                    <div className="px-6 pb-8">
                        <div className="rounded-xl border border-dashed border-gray-200 bg-slate-50 px-6 py-12 text-center">
                            <div className="text-sm font-semibold text-gray-900">No active deals to analyze yet</div>
                            <p className="mt-2 text-xs text-gray-500">Add deals, meetings, or calls in the CRM tabs and this agent will start surfacing live risk signals and recovery plays.</p>
                        </div>
                    </div>
                ) : (
                <div className="space-y-0">
                    {intelligence.deals.map(d => (
                        <div key={d.id} className="px-6 py-4 border-t border-gray-100 hover:bg-amber-50/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm text-gray-900">{d.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskBg(d.risk)}`}>{d.risk} Risk</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                        <span>{d.stage}</span><span>-</span><span className="font-semibold text-gray-700">{d.value}</span><span>-</span><span>Close {d.close}</span><span>-</span><span>Owner: {d.owner}</span><span>-</span><span>{d.activityCount} activities</span><span>-</span><span>{d.lastActivityLabel}</span>
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
                                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{s}</span>
                                ))}
                            </div>
                            {d.recovery && (
                                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Recovery Play</div>
                                            <div className="mt-1 text-sm font-semibold text-gray-900">{d.recovery.headline}</div>
                                        </div>
                                        <span className="text-xs font-medium text-amber-700">{d.recovery.action}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {d.recovery.talkingPoints.map(point => (
                                            <span key={point} className="px-2.5 py-1 rounded-full bg-white text-xs text-gray-700 border border-amber-200">
                                                {point}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Engagement Heatmap" description="Daily meeting and call activity captured against active deals" />
                    {intelligence.heatmapRows.length === 0 ? (
                        <p className="text-xs text-gray-400">Add dated meetings or calls to populate the last 7 days of activity.</p>
                    ) : (
                        <div className="space-y-2">
                            {intelligence.heatmapRows.map(row => (
                                <div key={row.name} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-36 truncate">{row.name}</span>
                                    <div className="flex gap-1 flex-1">
                                        {row.bars.map((v, i) => (
                                            <div key={i} className="flex-1 rounded-sm" style={{ height: "20px", background: v === 0 ? "#f1f5f9" : `rgba(99,102,241,${0.15 + v * 0.18})` }} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end gap-1 mt-1">
                                {["-6d","-5d","-4d","-3d","-2d","-1d","Today"].map(day => <span key={day} className="flex-1 text-center text-xs text-gray-300">{day}</span>)}
                            </div>
                        </div>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                    <SectionHeader title="Agent Alerts" description="Latest risk signals generated from CRM activity and deal coverage" />
                    {intelligence.alerts.length === 0 ? (
                        <p className="text-xs text-gray-400">No alerts yet. As deals and activity are added, this panel will surface the highest-priority warnings.</p>
                    ) : (
                        <div className="space-y-3">
                            {intelligence.alerts.map((a, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    <span className={`text-sm ${a.tone === "danger" ? "text-red-500" : a.tone === "positive" ? "text-green-500" : "text-amber-500"}`}>{a.icon}</span>
                                    <span className="text-xs text-gray-700 flex-1">{a.msg}</span>
                                    <span className="text-xs text-gray-400 flex-shrink-0">{a.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const DEALS_STORAGE_KEY = "custbuds_deals";
const DEFAULT_DEALS: DealRecord[] = [];
const LEGACY_SEEDED_DEAL_NAMES = [
    "Web Design Retainer",
    "Deal 1",
    "Deal 2",
    "Deal 3",
    "Deal name 5",
];

const isLegacySeededDeals = (rows: DealRecord[]) =>
    rows.length > 0 &&
    rows.length <= LEGACY_SEEDED_DEAL_NAMES.length &&
    rows.every(row => LEGACY_SEEDED_DEAL_NAMES.includes(row.name));

const dealStageTone = (stage: string) => {
    const key = stage.toLowerCase();
    if (key === "new") return { bg: "#ffedd5", text: "#c2410c" };
    if (key === "discovery") return { bg: "#dbeafe", text: "#1d4ed8" };
    if (key === "proposal") return { bg: "#dcfce7", text: "#166534" };
    if (key === "negotiation") return { bg: "#ede9fe", text: "#6d28d9" };
    if (key === "won") return { bg: "#dcfce7", text: "#15803d" };
    return { bg: "#e5e7eb", text: "#4b5563" };
};

const dealPriorityTone = (priority: string) => {
    const key = priority.toLowerCase();
    if (key === "high") return { bg: "#fee2e2", text: "#b91c1c" };
    if (key === "medium") return { bg: "#fef3c7", text: "#b45309" };
    if (key === "low") return { bg: "#dcfce7", text: "#15803d" };
    return { bg: "#e5e7eb", text: "#6b7280" };
};

const parseDealValue = (value: string) => {
    const numeric = Number(String(value || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
};

const parseDealDays = (value: string) => {
    const match = String(value || "").match(/(\d+)/);
    return match ? Number(match[1]) : 0;
};

const formatDealValue = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

const readStoredRows = (key: string): TableRow[] => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const normaliseLookupKey = (value: unknown) =>
    String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const hasMeaningfulValue = (value: unknown) => {
    const normalised = String(value || "").trim().toLowerCase();
    return !["", "--", "tbd", "unassigned", "closed", "none", "no owner"].includes(normalised);
};

const parseLooseDate = (value: unknown) => {
    const raw = String(value || "").trim();
    if (!hasMeaningfulValue(raw)) return null;

    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) return new Date(parsed);

    const currentYear = new Date().getFullYear();
    const parsedWithYear = Date.parse(`${raw}, ${currentYear}`);
    if (!Number.isNaN(parsedWithYear)) return new Date(parsedWithYear);

    return null;
};

const daysBetween = (target: Date, base = new Date()) =>
    Math.round((target.getTime() - base.getTime()) / 86400000);

const formatRelativeDayLabel = (date: Date | null) => {
    if (!date) return "No dated activity";
    const delta = daysBetween(date);
    if (delta === 0) return "Today";
    if (delta === -1) return "1d ago";
    if (delta < 0) return `${Math.abs(delta)}d ago`;
    if (delta === 1) return "In 1d";
    return `In ${delta}d`;
};

const extractParsedActivityDate = (row: TableRow) =>
    parseLooseDate(row["Date"] || row["Meeting date"] || row["Call date"]);

const upsertAgentResults = (current: AgentResult[], incoming: AgentResult) => {
    const nextKey = normaliseLookupKey(incoming.companyName);
    if (!nextKey) return [incoming, ...current];
    return [incoming, ...current.filter(result => normaliseLookupKey(result.companyName) !== nextKey)];
};

const ownerInitials = (name: string) =>
    String(name || "?")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join("") || "?";

function InlineChipSelect({
    value,
    options,
    onChange,
    tone,
}: {
    value: string;
    options: string[];
    onChange: (value: string) => void;
    tone: (value: string) => { bg: string; text: string };
}) {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const colors = tone(value);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div className="relative inline-block">
            <button
                ref={buttonRef}
                onClick={() => setOpen(v => !v)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm"
                style={{ background: colors.bg, color: colors.text }}
            >
                <span>{value}</span>
                <ChevronDownIcon />
            </button>
            {open && (
                <div
                    ref={menuRef}
                    className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                >
                    {options.map(option => {
                        const optionTone = tone(option);
                        return (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors"
                            >
                                <span>{option}</span>
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: optionTone.text }}
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function DealsTableSection({
    title,
    description,
    accent,
    deals,
    addLabel,
    isOpen,
    onToggle,
    onAddDeal,
    selectedDealIds,
    toggleDealSelection,
    toggleAllDealSelection,
    updateDeal,
}: {
    title: string;
    description: string;
    accent: string;
    deals: DealRecord[];
    addLabel: string;
    isOpen: boolean;
    onToggle: () => void;
    onAddDeal: () => void;
    selectedDealIds: number[];
    toggleDealSelection: (id: number) => void;
    toggleAllDealSelection: (ids: number[]) => void;
    updateDeal: (id: number, field: keyof DealRecord, value: string) => void;
}) {
    const totalValue = deals.reduce((sum, deal) => sum + parseDealValue(deal.value), 0);
    const avgCycle = deals.length
        ? Math.round(deals.reduce((sum, deal) => sum + parseDealDays(deal.duration), 0) / deals.length)
        : 0;
    const nextClose = deals
        .map(deal => deal.expectedClose)
        .find(value => value && value !== "TBD") || "TBD";
    const visibleDealIds = deals.map(deal => deal.id);
    const allVisibleDealsSelected = visibleDealIds.length > 0 && visibleDealIds.every(id => selectedDealIds.includes(id));
    const someVisibleDealsSelected = visibleDealIds.some(id => selectedDealIds.includes(id)) && !allVisibleDealsSelected;

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                <button onClick={onToggle} className="flex items-center gap-3 text-left">
                    <div className={`transition-transform ${isOpen ? "" : "-rotate-90"}`}>
                        <ChevronDownIcon />
                    </div>
                    <div className="h-8 w-1 rounded-full" style={{ background: accent }} />
                    <div>
                        <div className="text-sm font-bold text-gray-900">{title}</div>
                        <div className="text-xs text-gray-400">{description}</div>
                    </div>
                </button>
                <button
                    onClick={onAddDeal}
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    {addLabel}
                </button>
            </div>

            {isOpen && (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-[1120px] w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200">
                                    <th className="w-10 px-3 py-2.5 border-r border-gray-200">
                                        <SelectAllCheckbox
                                            checked={allVisibleDealsSelected}
                                            indeterminate={someVisibleDealsSelected}
                                            onChange={() => toggleAllDealSelection(visibleDealIds)}
                                        />
                                    </th>
                                    {["Deal", "Stage", "Owner", "Deal Value", "Contacts", "Companies", "Priority", "Deal length", "Expected Close"].map(header => (
                                        <th
                                            key={header}
                                            className="whitespace-nowrap border-r border-gray-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {deals.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                                            No deals match this view yet.
                                        </td>
                                    </tr>
                                ) : (
                                    deals.map(deal => (
                                        <tr key={deal.id} className="border-b border-gray-100 align-top hover:bg-sky-50/20 transition-colors">
                                            <td className="px-3 py-3 border-r border-gray-200 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedDealIds.includes(deal.id)}
                                                    onChange={() => toggleDealSelection(deal.id)}
                                                    className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500"
                                                />
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <div className="space-y-1">
                                                    <EditableCell
                                                        value={deal.name}
                                                        onChange={value => updateDeal(deal.id, "name", value)}
                                                        className="text-sm font-semibold text-gray-900"
                                                    />
                                                    <div className="text-[11px] text-gray-400">
                                                        {deal.status === "won" ? "Closed won" : "Open deal"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <InlineChipSelect
                                                    value={deal.stage}
                                                    options={["New", "Discovery", "Proposal", "Negotiation", "Won"]}
                                                    onChange={value => updateDeal(deal.id, "stage", value)}
                                                    tone={dealStageTone}
                                                />
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                                                        {ownerInitials(deal.owner)}
                                                    </div>
                                                    <EditableCell
                                                        value={deal.owner}
                                                        onChange={value => updateDeal(deal.id, "owner", value)}
                                                        className="text-sm text-gray-700"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <EditableCell
                                                    value={deal.value}
                                                    onChange={value => updateDeal(deal.id, "value", value)}
                                                    className="text-sm font-semibold text-gray-900"
                                                />
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <div className="inline-flex max-w-[180px] items-center rounded-md bg-teal-50 px-2.5 py-1">
                                                    <EditableCell
                                                        value={deal.contact}
                                                        onChange={value => updateDeal(deal.id, "contact", value)}
                                                        className="text-xs font-semibold text-teal-700"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <div className="inline-flex max-w-[180px] items-center rounded-md bg-sky-50 px-2.5 py-1">
                                                    <EditableCell
                                                        value={deal.account}
                                                        onChange={value => updateDeal(deal.id, "account", value)}
                                                        className="text-xs font-semibold text-sky-700"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <InlineChipSelect
                                                    value={deal.priority}
                                                    options={["High", "Medium", "Low", "None"]}
                                                    onChange={value => updateDeal(deal.id, "priority", value)}
                                                    tone={dealPriorityTone}
                                                />
                                            </td>
                                            <td className="px-3 py-3 border-r border-gray-200">
                                                <EditableCell
                                                    value={deal.duration}
                                                    onChange={value => updateDeal(deal.id, "duration", value)}
                                                    className="text-sm text-gray-600"
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-sm text-gray-600">
                                                <EditableCell
                                                    value={deal.expectedClose}
                                                    onChange={value => updateDeal(deal.id, "expectedClose", value)}
                                                    className="text-sm text-gray-600"
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 border-t border-gray-100 bg-slate-50/80 px-4 py-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Total value</div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{formatDealValue(totalValue)}</div>
                        </div>
                        <div className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Average cycle</div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{avgCycle} days</div>
                        </div>
                        <div className="rounded-lg border border-white bg-white px-3 py-2 shadow-sm">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Next close</div>
                            <div className="mt-1 text-sm font-bold text-gray-900">{nextClose}</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function DealsView() {
    const [tableSearch, setTableSearch] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [deals, setDeals] = useState<DealRecord[]>(() => {
        try {
            const stored = localStorage.getItem(DEALS_STORAGE_KEY);
            if (!stored) return DEFAULT_DEALS;
            const parsed = JSON.parse(stored) as DealRecord[];
            return isLegacySeededDeals(parsed) ? [] : parsed;
        } catch {
            return DEFAULT_DEALS;
        }
    });
    const [sectionsOpen, setSectionsOpen] = useState({ active: true, won: true });
    const [selectedDealIds, setSelectedDealIds] = useState<number[]>([]);

    useEffect(() => {
        try {
            localStorage.setItem(DEALS_STORAGE_KEY, JSON.stringify(deals));
        } catch {}
    }, [deals]);

    useEffect(() => {
        setSelectedDealIds(current => current.filter(id => deals.some(deal => deal.id === id)));
    }, [deals]);

    const updateDeal = (id: number, field: keyof DealRecord, value: string) => {
        setDeals(current =>
            current.map(deal => {
                if (deal.id !== id) return deal;
                const nextDeal = { ...deal, [field]: value } as DealRecord;
                if (field === "stage") {
                    nextDeal.status = value.toLowerCase() === "won" ? "won" : "active";
                }
                return nextDeal;
            })
        );
    };

    const addDeal = (status: DealRecord["status"]) => {
        const newDeal: DealRecord = {
            id: Date.now(),
            name: status === "won" ? "New Won Deal" : "New Deal",
            stage: status === "won" ? "Won" : "New",
            owner: "Unassigned",
            value: "--",
            contact: "--",
            account: "--",
            priority: status === "won" ? "None" : "Medium",
            duration: "0 days",
            expectedClose: status === "won" ? "Closed" : "TBD",
            status,
        };

        setDeals(current =>
            status === "active" ? [newDeal, ...current] : [...current, newDeal]
        );
        setSectionsOpen(current => ({ ...current, [status]: true }));
    };

    const handleImportDeals = (importedRows: Record<string, string>[]) => {
        const importedDeals = importedRows.map((row, index) => {
            const rawStage = String(row["Stage"] || "New").trim();
            const normalisedStage = rawStage.toLowerCase();
            const importedStage =
                normalisedStage === "closedwon" || normalisedStage === "closed won"
                    ? "Won"
                    : rawStage;
            const inferredStatus = String(row["Status"] || importedStage).toLowerCase().includes("won") ? "won" : "active";
            const importedValue = String(row["Deal Value"] || "--")
                .trim()
                .replace(/^[?�]\s*/, "Rs ");
            return {
                id: Date.now() + index,
                name: row["Deal"] || "New Deal",
                stage: importedStage,
                owner: row["Owner"] || "Unassigned",
                value: importedValue || "--",
                contact: row["Contacts"] || "--",
                account: row["Companies"] || "--",
                priority: String(row["Priority"] || (inferredStatus === "won" ? "None" : "Medium")).trim(),
                duration: row["Deal length"] || "0 days",
                expectedClose: row["Expected Close"] || (inferredStatus === "won" ? "Closed" : "TBD"),
                status: inferredStatus,
            } as DealRecord;
        });

        setDeals(current => [
            ...importedDeals.filter(deal => deal.status === "active"),
            ...current,
            ...importedDeals.filter(deal => deal.status === "won"),
        ]);
    };

    const toggleDealSelection = (id: number) => {
        setSelectedDealIds(current =>
            current.includes(id)
                ? current.filter(selectedId => selectedId !== id)
                : [...current, id]
        );
    };

    const toggleAllDealSelection = (dealIds: number[]) => {
        setSelectedDealIds(current =>
            dealIds.length > 0 && dealIds.every(id => current.includes(id))
                ? current.filter(id => !dealIds.includes(id))
                : Array.from(new Set([...current, ...dealIds]))
        );
    };

    const deleteSelectedDeals = () => {
        setDeals(current => current.filter(deal => !selectedDealIds.includes(deal.id)));
        setSelectedDealIds([]);
    };

    const filteredDeals = useMemo(() => {
        const query = tableSearch.trim().toLowerCase();
        if (!query) return deals;
        return deals.filter(deal =>
            [deal.name, deal.owner, deal.contact, deal.account, deal.stage, deal.priority]
                .some(value => String(value || "").toLowerCase().includes(query))
        );
    }, [deals, tableSearch]);

    const activeDeals = filteredDeals.filter(deal => deal.status === "active");
    const wonDeals = filteredDeals.filter(deal => deal.status === "won");
    const activePipelineValue = activeDeals.reduce((sum, deal) => sum + parseDealValue(deal.value), 0);
    const highPriorityDeals = activeDeals.filter(deal => deal.priority === "High").length;
    const closingSoonDeals = activeDeals.filter(deal => parseDealDays(deal.duration) <= 14).length;
    const wonRevenue = wonDeals.reduce((sum, deal) => sum + parseDealValue(deal.value), 0);

    return (
        <div className="space-y-6">
            {showImport && (
                <ImportModal
                    columns={["Deal", "Stage", "Owner", "Deal Value", "Contacts", "Companies", "Priority", "Deal length", "Expected Close", "Status"]}
                    onClose={() => setShowImport(false)}
                    onImport={handleImportDeals}
                />
            )}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#0ea5e9,#14b8a6)" }}
                        >
                            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                                <path d="M3 5.75A1.75 1.75 0 014.75 4h10.5A1.75 1.75 0 0117 5.75v8.5A1.75 1.75 0 0115.25 16H4.75A1.75 1.75 0 013 14.25v-8.5z" />
                                <path d="M6 7h8v2H6V7zm0 4h5v2H6v-2z" fill="#dff9fb" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Deals Pipeline</h1>
                            <p className="text-xs text-gray-400">Grouped tables for open opportunities and closed-won deals, styled to match the CRM.</p>
                        </div>
                    </div>
                    <AddOptionsMenu buttonLabel="Add deal" onCreate={() => addDeal("active")} onImport={() => setShowImport(true)} />
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <MetricCard label="Active Deals" value={String(activeDeals.length)} sub={`${highPriorityDeals} high priority`} />
                <MetricCard label="Open Pipeline" value={formatDealValue(activePipelineValue)} sub="Current active value" />
                <MetricCard label="Closing Soon" value={String(closingSoonDeals)} sub="14 days or less" />
                <MetricCard label="Closed Won" value={String(wonDeals.length)} sub={formatDealValue(wonRevenue)} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 flex-wrap">
                    <div className="relative flex-1 min-w-[240px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={tableSearch}
                            onChange={e => setTableSearch(e.target.value)}
                            placeholder="Search deals, contacts, companies, or owners..."
                            className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-sky-400"
                        />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        {selectedDealIds.length > 0 && (
                            <button
                                onClick={deleteSelectedDeals}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                            >
                                Delete selected ({selectedDealIds.length})
                            </button>
                        )}
                        <div className="text-xs text-gray-400">Double-click any text cell to edit it.</div>
                    </div>
                </div>

                <div className="space-y-4 p-4">
                    <DealsTableSection
                        title="Active Deals"
                        description="Opportunities currently moving through the pipeline"
                        accent="#0ea5e9"
                        deals={activeDeals}
                        addLabel="Add active deal"
                        isOpen={sectionsOpen.active}
                        onToggle={() => setSectionsOpen(current => ({ ...current, active: !current.active }))}
                        onAddDeal={() => addDeal("active")}
                        selectedDealIds={selectedDealIds}
                        toggleDealSelection={toggleDealSelection}
                        toggleAllDealSelection={toggleAllDealSelection}
                        updateDeal={updateDeal}
                    />
                    <DealsTableSection
                        title="Closed Won"
                        description="Deals already landed and ready for handoff"
                        accent="#22c55e"
                        deals={wonDeals}
                        addLabel="Add won deal"
                        isOpen={sectionsOpen.won}
                        onToggle={() => setSectionsOpen(current => ({ ...current, won: !current.won }))}
                        onAddDeal={() => addDeal("won")}
                        selectedDealIds={selectedDealIds}
                        toggleDealSelection={toggleDealSelection}
                        toggleAllDealSelection={toggleAllDealSelection}
                        updateDeal={updateDeal}
                    />
                </div>
            </div>
        </div>
    );
}

function ActivityTableView({
    title,
    description,
    storageKey,
    addLabel,
    columns,
    createRow,
    emptyMessage,
}: {
    title: string;
    description: string;
    storageKey: string;
    addLabel: string;
    columns: string[];
    createRow: () => TableRow;
    emptyMessage: string;
}) {
    const [tableSearch, setTableSearch] = useState("");
    const [showImport, setShowImport] = useState(false);
    const [rows, setRows] = useState<TableRow[]>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(rows));
        } catch {}
    }, [rows, storageKey]);

    useEffect(() => {
        setSelectedRowIds(current => current.filter(id => rows.some(row => row.id === id)));
    }, [rows]);

    const updateRow = (id: number, field: string, value: string) => {
        setRows(current => current.map(row => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const addRow = () => {
        setRows(current => [createRow(), ...current]);
    };

    const handleImport = (importedRows: Record<string, string>[]) => {
        const nextRows = importedRows.map((row, index) => ({
            id: Date.now() + index,
            ...columns.reduce<Record<string, string>>((acc, column) => {
                acc[column] = row[column] || "--";
                return acc;
            }, {}),
        }));
        setRows(current => [...nextRows, ...current]);
    };

    const toggleRowSelection = (id: number) => {
        setSelectedRowIds(current =>
            current.includes(id)
                ? current.filter(selectedId => selectedId !== id)
                : [...current, id]
        );
    };

    const deleteSelectedRows = () => {
        setRows(current => current.filter(row => !selectedRowIds.includes(row.id)));
        setSelectedRowIds([]);
    };

    const filteredRows = useMemo(() => {
        const query = tableSearch.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter(row =>
            columns.some(column => String(row[column] || "").toLowerCase().includes(query))
        );
    }, [columns, rows, tableSearch]);
    const visibleRowIds = filteredRows.map(row => row.id);
    const allVisibleRowsSelected = visibleRowIds.length > 0 && visibleRowIds.every(id => selectedRowIds.includes(id));
    const someVisibleRowsSelected = visibleRowIds.some(id => selectedRowIds.includes(id)) && !allVisibleRowsSelected;

    const toggleSelectAllRows = () => {
        setSelectedRowIds(current =>
            allVisibleRowsSelected
                ? current.filter(id => !visibleRowIds.includes(id))
                : Array.from(new Set([...current, ...visibleRowIds]))
        );
    };

    return (
        <div className="space-y-6">
            {showImport && <ImportModal columns={columns} onClose={() => setShowImport(false)} onImport={handleImport} />}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                        <p className="text-xs text-gray-400 mt-1">{description}</p>
                    </div>
                    <AddOptionsMenu buttonLabel={addLabel} onCreate={addRow} onImport={() => setShowImport(true)} />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 flex-wrap">
                    <div className="relative flex-1 min-w-[240px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={tableSearch}
                            onChange={e => setTableSearch(e.target.value)}
                            placeholder={`Search ${title.toLowerCase()}...`}
                            className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-sky-400"
                        />
                    </div>
                    {selectedRowIds.length > 0 && (
                        <button
                            onClick={deleteSelectedRows}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                        >
                            Delete selected ({selectedRowIds.length})
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-gray-200">
                                <th className="w-10 px-3 py-2.5 border-r border-gray-200">
                                    <SelectAllCheckbox
                                        checked={allVisibleRowsSelected}
                                        indeterminate={someVisibleRowsSelected}
                                        onChange={toggleSelectAllRows}
                                    />
                                </th>
                                {columns.map(column => (
                                    <th
                                        key={column}
                                        className="whitespace-nowrap border-r border-gray-200 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 last:border-r-0"
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-gray-400">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map(row => (
                                    <tr key={row.id} className="border-b border-gray-100 hover:bg-sky-50/20 transition-colors">
                                        <td className="px-3 py-3 border-r border-gray-200 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedRowIds.includes(row.id)}
                                                onChange={() => toggleRowSelection(row.id)}
                                                className="w-3.5 h-3.5 rounded-sm border-gray-300 accent-sky-500"
                                            />
                                        </td>
                                        {columns.map((column, index) => (
                                            <td key={column} className="px-3 py-3 border-r border-gray-200 last:border-r-0">
                                                <EditableCell
                                                    value={row[column] || "--"}
                                                    onChange={value => updateRow(row.id, column, value)}
                                                    className={index === 0 ? "text-sm font-semibold text-gray-900" : "text-sm text-gray-600"}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MeetingsView() {
    return (
        <ActivityTableView
            title="Meetings"
            description="Track scheduled meetings, owners, and next steps in the same table-driven layout as the rest of the CRM."
            storageKey="custbuds_meetings"
            addLabel="Add meeting"
            columns={["Meeting", "Company", "Owner", "Date", "Status", "Next Step"]}
            createRow={() => ({
                id: Date.now(),
                "Meeting": "New meeting",
                "Company": "--",
                "Owner": "Unassigned",
                "Date": "TBD",
                "Status": "Planned",
                "Next Step": "--",
            })}
            emptyMessage="No meetings yet. Add one to start tracking your schedule."
        />
    );
}

function CallsView() {
    return (
        <ActivityTableView
            title="Calls"
            description="Log call activity, attach owners, and keep follow-up actions visible from one shared table view."
            storageKey="custbuds_calls"
            addLabel="Add call"
            columns={["Call", "Company", "Contact", "Owner", "Date", "Status"]}
            createRow={() => ({
                id: Date.now(),
                "Call": "New call",
                "Company": "--",
                "Contact": "--",
                "Owner": "Unassigned",
                "Date": "TBD",
                "Status": "Scheduled",
            })}
            emptyMessage="No calls logged yet. Add one to build your call history."
        />
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ Root Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function CRMDashboard() {
    const [bannerVisible, setBannerVisible] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [activeNav, setActiveNav] = useState("companies");

    // â”€â”€ Prospecting Agent state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // isProspecting: true while we're waiting for the backend to respond
    const [isProspecting, setIsProspecting] = useState(false);
    // agentResult: populated once the backend returns
    const [agentResults, setAgentResults] = useState<AgentResult[]>(() => {
        try { const s = localStorage.getItem("custbuds_agent_results"); return s ? JSON.parse(s) : []; }
        catch { return []; }
    });
    useEffect(() => { try { localStorage.setItem("custbuds_agent_results", JSON.stringify(agentResults)); } catch {} }, [agentResults]);
    const [agentResult, setAgentResult] = useState<AgentResult | null>(null);

    // â”€â”€ Avatar Options â”€â”€
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
            setAgentResults(prev => upsertAgentResults(prev, result));
            setActiveNav("companies");
        }
    };

    // Show loading indicator immediately when the user submits the modal
    const handleAgentStart = () => {
        setIsProspecting(true);
        setAgentResult(null);
        setActiveNav("companies");
    };

    // â”€â”€ Prospect All: iterate over all saved companies and prospect each â”€â”€
    const handleProspectAll = async () => {
        let companies: any[] = [];
        try { const s = localStorage.getItem("custbuds_companies"); if (s) companies = JSON.parse(s); } catch {}
        if (companies.length === 0) return;

        setIsProspecting(true);
        setActiveNav("prospecting");

        for (const company of companies) {
            const name = company["Company name"] || company.name || "";
            if (!name) continue;
            try {
                const res = await fetch("http://localhost:5000/api/agent/prospect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        companyName: name,
                        city: company["City"] || company.city || "",
                        companySize: company["Company Size"] || company.companySize || "",
                        type: company["Type"] || company.type || "Prospect",
                    }),
                });
                if (res.ok) {
                    const data: AgentResult = await res.json();
                    const result: AgentResult = { ...data, companyName: name };
                    setAgentResults(prev => upsertAgentResults(prev, result));
                    setAgentResult(result);
                }
            } catch {}
        }
        setIsProspecting(false);
    };

    // â”€â”€ Interactive Gmail Connect State â”€â”€
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
    const agentNav = [
        { id: "prospecting", label: "Prospecting",    icon: SparklesIcon },
        { id: "deal-intel",  label: "Deal Intel",     icon: TargetIcon },
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
                                        <>Connected</>
                                    ) : (
                                        <>
                                            <GmailIcon />
                                            Connect Gmail
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* â”€â”€ Prospecting Loading Banner â”€â”€ */}
                        {isProspecting && (
                            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-sky-200 shadow-sm"
                                style={{ background: "linear-gradient(135deg,#e0f2fe,#f0f9ff)" }}>
                                <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping flex-shrink-0" />
                                <span className="text-sm font-semibold text-sky-800">Prospecting Agent is researching your target...</span>
                                <span className="text-xs text-sky-500 ml-auto">This takes ~5-10 seconds</span>
                            </div>
                        )}

                        {/* â”€â”€ Agent Result Panel â”€â”€ */}
                        {agentResult && (
                            <AgentResultPanel
                                result={agentResult}
                                onClose={() => setAgentResult(null)}
                            />
                        )}

                        {activeNav === "contacts" ? <ContactsView /> :
                         activeNav === "companies" ? <CompaniesView onAgentStart={handleAgentStart} onAgentResult={handleAgentResult} /> :
                         activeNav === "deals" ? <DealsView /> :
                         activeNav === "meetings" ? <MeetingsView /> :
                         activeNav === "calls" ? <CallsView /> :
                         activeNav === "prospecting" ? <ProspectingAgentView agentResults={agentResults} onProspectAll={handleProspectAll} isProspecting={isProspecting} /> :
                         activeNav === "deal-intel" ? <DealIntelligenceView agentResults={agentResults} /> :
                         <CompaniesView onAgentStart={handleAgentStart} onAgentResult={handleAgentResult} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
