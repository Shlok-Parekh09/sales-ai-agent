import { useState, useRef, useEffect } from "react";

/* ───────── Icons ───────── */
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
    <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M2 6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            fill="#F2F2F2"
        />
        <path d="M2 6l10 7 10-7" stroke="#EA4335" strokeWidth="0" fill="none" />
        <path
            d="M2 6.5L12 13l10-6.5V18a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"
            fill="#4285F4"
            opacity="0"
        />
        <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            fill="white"
            stroke="#E0E0E0"
            strokeWidth="0.5"
        />
        <path
            d="M2 6l10 7.5L22 6"
            fill="none"
            stroke="#EA4335"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path d="M2 6v12h20V6L12 13.5 2 6z" fill="none" />
        <text
            x="5"
            y="17"
            fontSize="7"
            fontWeight="bold"
            fill="#4285F4"
            fontFamily="Arial,sans-serif"
        >
            G
        </text>
        <path d="M2 6l10 7.5L22 6" fill="#EA4335" opacity="0.15" />
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
                className="border border-blue-400 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-24"
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
            className={`cursor-text rounded px-0.5 py-0.5 hover:bg-blue-50 transition-colors inline-block ${link ? "text-teal-600 hover:underline" : ""
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
function CreateCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (form: any) => void; }) {
    const [form, setForm] = useState({
        domain: "",
        name: "",
        owner: "",
        industry: "",
        type: "",
        city: "",
        state: "",
    });

    // Fixed: Telling TS exactly what `k` is, and allowing `e` to be any input event
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
                    <div className="flex justify-end">
                        <button className="text-sm text-blue-600 hover:underline flex items-center gap-0.5">
                            Edit this form <ExternalLinkIcon />
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                            Company domain name
                        </label>
                        <input
                            autoFocus
                            value={form.domain}
                            onChange={set("domain")}
                            className="w-full border-2 border-blue-400 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                            Company name
                        </label>
                        <input
                            value={form.name}
                            onChange={set("name")}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                        />
                    </div>

                    {!form.domain && !form.name && (
                        <p className="text-xs text-gray-400 text-center py-1 bg-gray-50 rounded-lg px-4">
                            Start by entering a domain name, an account name, or both.
                        </p>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Company owner
                        </label>
                        <div className="relative">
                            <div
                                className="w-20 h-4 bg-gray-200 rounded mb-1 absolute top-2 left-3 animate-pulse"
                                style={{ display: form.owner ? "none" : "block" }}
                            />
                            <select
                                value={form.owner}
                                onChange={set("owner")}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-500 appearance-none focus:outline-none focus:border-blue-400 bg-gray-50"
                            >
                                <option value=""></option>
                                <option>Avataar</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Industry
                        </label>
                        <div className="relative">
                            <select
                                value={form.industry}
                                onChange={set("industry")}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 appearance-none focus:outline-none focus:border-blue-400 bg-gray-50"
                            >
                                <option value=""></option>
                                <option>Technology</option>
                                <option>Finance</option>
                                <option>Healthcare</option>
                                <option>Retail</option>
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <ChevronDownIcon />
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1.5">
                            Type
                        </label>
                        <div className="relative">
                            <select
                                value={form.type}
                                onChange={set("type")}
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-400 appearance-none focus:outline-none focus:border-blue-400 bg-gray-50"
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
                            className="w-full border-b border-gray-300 px-0 py-1.5 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-transparent"
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
                                className="w-full py-1.5 text-sm text-gray-400 appearance-none focus:outline-none bg-transparent"
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
                        onClick={() => {
                            if (form.name || form.domain) {
                                onSave(form);
                                onClose();
                            } else alert("Please enter a company name or domain.");
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors hover:opacity-90"
                        style={{ background: "#1a1f2e" }}
                    >
                        Create
                    </button>
                    <button
                        onClick={() => {
                            if (form.name || form.domain) {
                                onSave(form);
                                setForm({
                                    domain: "",
                                    name: "",
                                    owner: "",
                                    industry: "",
                                    type: "",
                                    city: "",
                                    state: "",
                                });
                            }
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-white transition-colors"
                    >
                        Create and add another
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-800 border-2 border-gray-800 rounded-md hover:bg-gray-100 transition-colors ml-auto"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ───────── Contacts View ───────── */
function ContactsView() {
    const [activeTab, setActiveTab] = useState("all");
    const [tableSearch, setTableSearch] = useState("");
    const [contacts, setContacts] = useState([
        {
            id: 1,
            name: "Brian Halligan (Sampl...",
            email: "bh@hubspot.com",
            phone: "--",
            owner: "No owner",
        },
        {
            id: 2,
            name: "Maria Johnson (Samp...",
            email: "emailmaria@hubspot.com...",
            phone: "--",
            owner: "No owner",
        },
    ]);

    // Fixed: Telling TS the exact types for the parameters
    const update = (id: number, field: string, val: string) =>
        setContacts((cs) =>
            cs.map((c) => (c.id === id ? { ...c, [field]: val } : c))
        );

    const filtered = contacts.filter(
        (c) =>
            !tableSearch ||
            c.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
            c.email.toLowerCase().includes(tableSearch.toLowerCase())
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-gray-600">
                    Contacts <ChevronDownIcon />
                </button>
                <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white hover:opacity-90"
                    style={{ background: "#1a1f2e" }}
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Add contacts
                </button>
            </div>

            <div className="flex items-center border-b border-gray-200 px-4 mt-2 gap-0.5">
                {[
                    { id: "all", label: "All contacts", badge: filtered.length },
                    { id: "my", label: "My contacts" },
                    { id: "unassigned", label: "Unassigned contacts" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-orange-500 text-orange-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span
                                className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-xs font-semibold"
                                style={{
                                    background: activeTab === tab.id ? "#1a1f2e" : "#f3f4f6",
                                    color: activeTab === tab.id ? "white" : "#6b7280",
                                }}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
                <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </span>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={tableSearch}
                        onChange={(e) => setTableSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-orange-400 w-36"
                    />
                </div>
                <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                    Table view <ChevronDownIcon />
                </button>
                <div className="flex items-center gap-1.5 ml-auto">
                    {["Edit columns", "Filters", "Sort", "Export", "Save"].map((l) => (
                        <button
                            key={l}
                            className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50/60 flex-wrap">
                {[
                    "Contact owner ▾",
                    "Create date ▾",
                    "Last activity date ▾",
                    "Lead status ▾",
                    "+ More",
                    "≡ Advanced filters",
                ].map((f) => (
                    <button key={f} className="hover:text-gray-700 whitespace-nowrap">
                        {f}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-10 px-4 py-2.5">
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 rounded border-gray-300 accent-orange-500"
                                />
                            </th>
                            {["Name", "Email", "Phone Number", "Contact owner"].map((h) => (
                                <th
                                    key={h}
                                    className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr
                                key={c.id}
                                className="border-b border-gray-100 hover:bg-orange-50/20 transition-colors"
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-gray-300 accent-orange-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                                            <HubSpotLogoIcon />
                                        </div>
                                        <EditableCell
                                            value={c.name}
                                            onChange={(v) => update(c.id, "name", v)}
                                            link
                                            className="text-sm font-medium"
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <EditableCell
                                        value={c.email}
                                        onChange={(v) => update(c.id, "email", v)}
                                        link
                                        className="text-sm"
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <EditableCell
                                        value={c.phone}
                                        onChange={(v) => update(c.id, "phone", v)}
                                        className="text-gray-400"
                                    />
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <EditableCell
                                        value={c.owner}
                                        onChange={(v) => update(c.id, "owner", v)}
                                        className="text-gray-400"
                                    />
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-10 text-center text-sm text-gray-400"
                                >
                                    No contacts found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-1">
                    <button
                        className="flex items-center gap-0.5 px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-gray-600"
                        disabled
                    >
                        ‹ Prev
                    </button>
                    <button
                        className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                        style={{ background: "#FF7A59" }}
                    >
                        1
                    </button>
                    <button className="flex items-center gap-0.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                        Next ›
                    </button>
                </div>
                <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                    25 per page <ChevronDownIcon />
                </button>
            </div>
        </div>
    );
}

/* ───────── Companies View ───────── */
function CompaniesView() {
    const [activeTab, setActiveTab] = useState("all");
    const [tableSearch, setTableSearch] = useState("");
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Fixed: Telling TS what kind of HTML elements these Refs refer to
    const addBtnRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const [companies, setCompanies] = useState([
        {
            id: 1,
            name: "",
            owner: "No owner",
            createDate: "Yesterday at 6:27 PM...",
            phone: "--",
            city: "--",
            industry: "--",
            revenue: "--",
        },
    ]);

    // Fixed: Telling TS the exact types for the parameters
    const update = (id: number, field: string, val: string) =>
        setCompanies((cs) =>
            cs.map((c) => (c.id === id ? { ...c, [field]: val } : c))
        );

    // Fixed: Adding 'any' so it knows form is an object being passed from the modal
    const handleSaveNew = (form: any) => {
        setCompanies((cs) => [
            ...cs,
            {
                id: Date.now(),
                name: form.name || form.domain || "New Company",
                owner: form.owner || "No owner",
                createDate: "Just now",
                phone: "--",
                city: form.city || "--",
                industry: form.industry || "--",
                revenue: "--",
            },
        ]);
    };

    useEffect(() => {
        // Fixed: Tell TS this is a standard MouseEvent
        const handler = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                addBtnRef.current &&
                !addBtnRef.current.contains(e.target as Node)
            )
                setShowAddMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = companies.filter(
        (c) =>
            !tableSearch ||
            (c.name || "").toLowerCase().includes(tableSearch.toLowerCase())
    );

    return (
        <>
            {showCreateModal && (
                <CreateCompanyModal
                    onClose={() => setShowCreateModal(false)}
                    onSave={handleSaveNew}
                />
            )}

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
                            style={{ background: "#1a1f2e" }}
                        >
                            Add companies <ChevronDownIcon />
                        </button>
                        {showAddMenu && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        setShowAddMenu(false);
                                        setShowCreateModal(true);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Create new
                                </button>
                                <button
                                    onClick={() => setShowAddMenu(false)}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
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
                                ? "border-orange-500 text-orange-600"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && (
                                <span
                                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold"
                                    style={{
                                        background: activeTab === tab.id ? "#FFF0EC" : "#f3f4f6",
                                        color: activeTab === tab.id ? "#FF7A59" : "#6b7280",
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
                            className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-orange-400 w-40"
                        />
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        Table view <ChevronDownIcon />
                    </button>
                    <div className="flex items-center gap-1.5 ml-auto">
                        {["Edit columns", "Filters", "Sort", "Export", "Save"].map((l) => (
                            <button
                                key={l}
                                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full min-w-max text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="w-10 px-4 py-2.5">
                                    <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5 rounded border-gray-300 accent-orange-500"
                                    />
                                </th>
                                {[
                                    "Company name",
                                    "Company owner",
                                    "Create Date (GMT +5:30)",
                                    "Phone Number",
                                    "City",
                                    "Industry",
                                    "Annual Revenue",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((company) => (
                                <tr
                                    key={company.id}
                                    className="border-b border-gray-100 hover:bg-orange-50/20 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-gray-300 accent-orange-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                                                style={{ background: "#FF7A59" }}
                                            >
                                                {(company.name || "?")[0].toUpperCase()}
                                            </div>
                                            <EditableCell
                                                value={company.name}
                                                onChange={(v) => update(company.id, "name", v)}
                                                className="text-sm font-medium text-gray-900"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <EditableCell
                                            value={company.owner}
                                            onChange={(v) => update(company.id, "owner", v)}
                                            className="text-sm text-gray-400"
                                        />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <EditableCell
                                            value={company.createDate}
                                            onChange={(v) => update(company.id, "createDate", v)}
                                            className="text-sm text-gray-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <EditableCell
                                            value={company.phone}
                                            onChange={(v) => update(company.id, "phone", v)}
                                            className="text-sm text-gray-400"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <EditableCell
                                            value={company.city}
                                            onChange={(v) => update(company.id, "city", v)}
                                            className="text-sm text-gray-400"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <EditableCell
                                            value={company.industry}
                                            onChange={(v) => update(company.id, "industry", v)}
                                            className="text-sm text-gray-400"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <EditableCell
                                            value={company.revenue}
                                            onChange={(v) => update(company.id, "revenue", v)}
                                            className="text-sm text-gray-400"
                                        />
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td
                                    colSpan={8}
                                    className="px-4 py-4 text-center text-xs text-gray-400"
                                >
                                    Showing {filtered.length}{" "}
                                    {filtered.length === 1 ? "company" : "companies"} ·{" "}
                                    <span className="text-orange-500 cursor-pointer hover:underline">
                                        Import more
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <button
                            className="px-2.5 py-1 text-xs font-medium text-gray-400"
                            disabled
                        >
                            ‹ Prev
                        </button>
                        <button
                            className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                            style={{ background: "#FF7A59" }}
                        >
                            1
                        </button>
                        <button className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">
                            Next ›
                        </button>
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                        25 per page <ChevronDownIcon />
                    </button>
                </div>
            </div>
        </>
    );
}

/* ───────── Root Dashboard ───────── */
export default function CRMDashboard() {
    const [bannerVisible, setBannerVisible] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [activeNav, setActiveNav] = useState("companies");

    const navItems = [
        { id: "contacts", label: "Contacts", icon: <ContactsIcon /> },
        { id: "companies", label: "Companies", icon: <CompaniesIcon /> },
    ];

    return (
        <div
            className="flex h-screen bg-gray-100 overflow-hidden"
            style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
        >
            <aside
                className="w-52 flex-shrink-0 flex flex-col"
                style={{ background: "#1a1f2e" }}
            >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                    <HubSpotLogoIcon />
                    <span className="text-white font-semibold text-sm tracking-wide">
                        HubSpot
                    </span>
                </div>
                <nav className="flex-1 py-4 space-y-0.5 px-2">
                    {navItems.map((item) => {
                        const isActive = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 text-left ${isActive
                                    ? ""
                                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                    }`}
                                style={
                                    isActive ? { background: "#FF7A59", color: "white" } : {}
                                }
                            >
                                <span className={isActive ? "text-white" : "text-gray-400"}>
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header
                    className="flex items-center px-4 py-2.5 gap-4 border-b border-white/10 flex-shrink-0"
                    style={{ background: "#1a1f2e" }}
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
                                placeholder="Search HubSpot"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 rounded-md text-sm text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-orange-400 transition-colors"
                                style={{ background: "#252b3b" }}
                            />
                        </div>
                    </div>
                    <div className="w-36 flex justify-end">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-white/5 transition-colors border border-white/10">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: "#FF7A59" }}
                            >
                                A
                            </div>
                            <span className="text-xs font-medium">Avataar</span>
                            <ChevronDownIcon />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-gray-50">
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
                                    HubSpot uses this connection to organize communication history
                                    and enrich profiles with accurate job titles, locations, and
                                    more.
                                </p>
                                <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <GmailIcon />
                                    Connect Gmail
                                </button>
                            </div>
                        )}

                        {activeNav === "contacts" ? <ContactsView /> : <CompaniesView />}
                    </div>
                </main>
            </div>
        </div>
    );
}