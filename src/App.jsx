import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "./src/firebase";
// ─── Helpers ────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9).toUpperCase();
const genId = (villageCode, serial) =>
  `${villageCode}-${String(serial).padStart(3, "0")}`;
const fmt = (n) =>
  n == null || n === "" || isNaN(n)
    ? "—"
    : "₹" + Number(n).toLocaleString("en-IN");
const WEEK_OPTIONS = [12, 21, 25];
const MAX_WEEKS = 25; // maximum possible weeks across all options
const ABSENT = -1; // sentinel value for absent week

// Generate a short code from a village name
const makeVillageCode = (name) => {
  if (!name || !name.trim()) return 'VLG';
  const clean = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length <= 3) return clean.padEnd(3, 'X');
  // Take first char + next 2 non-vowel chars
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  let code = clean[0];
  let i = 1;
  while (code.length < 3 && i < clean.length) {
    if (!vowels.has(clean[i])) code += clean[i];
    i++;
  }
  // Still need chars? just take next
  while (code.length < 3 && i < clean.length) {
    code += clean[i++];
  }
  return code.slice(0, 3);
};
// ─── Translations ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    appTitle: "FinanceBook",
    ledger: "📋 Ledger",
    weekly: "📅 Weekly View",
    schedule: "📆 Schedule",
    search: "🔍 Search",
    analytics: "📈 Analytics",
    settings: "⚙️ Settings",
    searchPlaceholder: "Search customer, ID, village, phone…",
    collected: "collected",
    addVillage: "+ Village",
    villageNamePlaceholder: "Village name",
    add: "Add",
    // Ledger
    customerLedger: "Customer Ledger",
    editPrompt: "Click any cell to edit · Changes sync to Master Data instantly",
    addCustomer: "+ Add Customer",
    customers: "Customers",
    active: "Active",
    paidOff: "Paid Off",
    capital: "Capital",
    outstanding: "Outstanding",
    colID: "ID", colName: "Name", colPhone: "Phone", colLoanDate: "Loan Date", colLoan: "Loan ₹", colCredit: "Credit ₹", colWeekly: "Weekly ₹", colWks: "Wks", colPaid: "Paid ₹", colRemaining: "Remaining ₹", colStatus: "Status", colActions: "Actions",
    noCustomers: "No customers yet",
    addFirst: "+ Add First Customer",
    // Settings
    passwordUpdate: "Update Password",
    capitalMgt: "Capital Management",
  },
  te: {
    appTitle: "ఫైనాన్స్ బుక్",
    ledger: "📋 లెడ్జర్",
    weekly: "📅 వారాంతపు వీక్షణ",
    schedule: "📆 షెడ్యూల్",
    search: "🔍 శోధన",
    analytics: "📈 విశ్లేషణలు",
    settings: "⚙️ సెట్టింగులు",
    searchPlaceholder: "కస్టమర్, ఐడి, గ్రామం శోధించండి…",
    collected: "వసూలైనది",
    addVillage: "+ గ్రామం",
    villageNamePlaceholder: "గ్రామం పేరు",
    add: "జోడించు",
    // Ledger
    customerLedger: "కస్టమర్ లెడ్జర్",
    editPrompt: "సవరించడానికి ఏదైనా సెల్‌పై క్లిక్ చేయండి · వెంటనే మాస్టర్ డేటాకు సింక్ అవుతుంది",
    addCustomer: "+ కస్టమర్ జోడించు",
    customers: "కస్టమర్లు",
    active: "యాక్టివ్",
    paidOff: "చెల్లించారు",
    capital: "పెట్టుబడి",
    outstanding: "బకాయి",
    colID: "ఐడి", colName: "పేరు", colPhone: "ఫోన్", colLoanDate: "లోన్ తేదీ", colLoan: "లోన్ ₹", colCredit: "క్రెడిట్ ₹", colWeekly: "వారం ₹", colWks: "వారాలు", colPaid: "చెల్లించిన ₹", colRemaining: "బకాయి ₹", colStatus: "స్థితి", colActions: "చర్యలు",
    noCustomers: "ఇంకా కస్టమర్లు లేరు",
    addFirst: "+ మొదటి కస్టమర్ జోడించు",
    // Settings
    passwordUpdate: "పాస్వర్డ్ నవీకరించండి",
    capitalMgt: "పెట్టుబడి నిర్వహణ",
  }
};

// Add 7*n days to a date string (YYYY-MM-DD), return formatted "DD-Mon" e.g. "11-Mar"
const addWeeks = (dateStr, weeksToAdd) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + weeksToAdd * 7);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// Get full date label for a week: "W3 / 25-Mar"
const weekLabel = (weekIndex, loanDate) => {
  const dateStr = addWeeks(loanDate, weekIndex);  // weekIndex 0 = week 1 = loanDate + 7 days
  return dateStr ? `W${weekIndex + 1}\n${dateStr}` : `W${weekIndex + 1}`;
};

// Generate full repayment schedule for a customer
const getRepaymentSchedule = (customer) => {
  const { loanDate, weeksTotal, creditValue, weeks } = customer;
  const installAmount = creditValue && weeksTotal ? Math.round(creditValue / weeksTotal) : 0;
  return Array.from({ length: weeksTotal || 12 }, (_, i) => {
    const dueDate = addWeeks(loanDate, i);  // Week 1 = loanDate + 7 days
    const paid = weeks[i] || 0;
    return {
      weekNum: i + 1,
      dueDate,
      expectedAmount: installAmount,
      paidAmount: paid,
      status: paid >= installAmount ? "paid" : paid > 0 ? "partial" : "pending",
    };
  });
};

// ─── Initial Villages & Seed Data ──────────────────────────────────────────
const VILLAGE_META = [
  { id: "VLG1", name: "Village 1", color: "#6366f1", light: "#eef2ff" },
  { id: "VLG2", name: "Village 2", color: "#10b981", light: "#ecfdf5" },
  { id: "VLG3", name: "Village 3", color: "#f59e0b", light: "#fffbeb" },
  { id: "VLG4", name: "Village 4", color: "#ef4444", light: "#fff1f2" },
  { id: "VLG5", name: "Village 5", color: "#8b5cf6", light: "#f5f3ff" },
];

const makeCustomer = (villageId, serial, data = {}) => ({
  uid: uid(),
  id: genId(villageId, serial),
  villageId,
  serial,
  name: data.name || "",
  phone: data.phone || "",
  address: data.address || "",
  guarantor: data.guarantor || "",
  loanAmount: data.loanAmount ?? null,
  creditValue: data.creditValue ?? null,
  loanDate: data.loanDate || "",       // ← NEW: date money was debited (YYYY-MM-DD)
  dueDate: data.dueDate || "",
  interestRate: data.interestRate ?? null,
  weeksTotal: data.weeksTotal ?? 12,   // ← default 12, can be 12 / 21 / 25
  weeks: data.weeks || Array(MAX_WEEKS).fill(null),  // ← now MAX_WEEKS slots
  notes: data.notes || "",
});

const EMPTY_VILLAGES = {
  VLG1: [],
  VLG2: [],
  VLG3: [],
  VLG4: [],
  VLG5: [],
};

// ─── Derived calculations ───────────────────────────────────────────────────
const calcCustomer = (c) => {
  const weeksData = c.weeks.slice(0, c.weeksTotal || 12);
  const absentCount = weeksData.filter(v => v === ABSENT).length;
  const effectiveTotal = (c.weeksTotal || 12) + absentCount;

  const paid = weeksData.reduce((s, v) => s + (v > 0 ? v : 0), 0);
  const remaining = (c.creditValue || 0) - paid;

  const weeksPaid = weeksData.filter(v => v != null && v > 0).length;
  const weeksRemaining = effectiveTotal - weeksPaid - absentCount;

  const weeklyInstall = c.creditValue && c.weeksTotal
    ? Math.round(c.creditValue / c.weeksTotal)
    : null;

  const status =
    !c.name ? "empty"
      : (c.creditValue > 0 && remaining <= 0) ? "paid"
        : (c.creditValue > 0 && remaining < c.creditValue * 0.1) ? "near"
          : "active";

  return {
    ...c,
    paid,
    remaining,
    weeksPaid,
    weeksRemaining,
    absentCount,
    effectiveTotal,
    weeklyInstall,
    status,
  };
};

// ─── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    paid: { label: "✅ PAID", bg: "#d1fae5", color: "#065f46" },
    near: { label: "🟡 NEAR DONE", bg: "#fef3c7", color: "#92400e" },
    active: { label: "🔴 ACTIVE", bg: "#fee2e2", color: "#991b1b" },
    empty: { label: "—", bg: "#f3f4f6", color: "#9ca3af" },
  }[status] || { label: "—", bg: "#f3f4f6", color: "#9ca3af" };
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, whiteSpace: "nowrap", letterSpacing: "0.5px",
    }}>{cfg.label}</span>
  );
};

// ─── Inline editable cell ───────────────────────────────────────────────────
const EditCell = ({ value, type = "text", onChange, placeholder = "", style = {} }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef();
  useEffect(() => { setDraft(value ?? ""); }, [value]);
  const commit = () => {
    setEditing(false);
    const v = type === "number" ? (draft === "" ? null : Number(draft)) : draft;
    if (v !== value) onChange(v);
  };
  if (editing) return (
    <input ref={ref} autoFocus type={type === "number" ? "number" : "text"}
      value={draft} placeholder={placeholder}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); } }}
      style={{
        width: "100%", border: "none", outline: "2px solid var(--accent, #6366f1)", borderRadius: 6,
        padding: "4px 8px", fontSize: 14, fontFamily: "inherit", fontWeight: 500,
        background: "var(--input-bg, #1a1d35)", color: "var(--text-primary, #f0f0ff)", caretColor: "var(--accent, #6366f1)", ...style
      }} />
  );
  return (
    <div onClick={() => setEditing(true)} title="Click to edit"
      style={{
        cursor: "text", minHeight: 28, padding: "5px 6px", borderRadius: 6,
        fontSize: type === "number" ? 15 : 14, fontWeight: value != null && value !== "" ? 600 : 400,
        color: value != null && value !== "" ? "var(--text-primary, #f0f0ff)" : "var(--text-muted, #4a5070)",
        transition: "background .15s", lineHeight: "1.4", ...style
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg, rgba(255,255,255,0.06))"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {value != null && value !== "" ? (type === "number" ? (value > 0 ? `₹${Number(value).toLocaleString("en-IN")}` : value) : value) : <span style={{ color: "var(--text-muted, #4a5070)", fontStyle: "italic", fontSize: 13 }}>{placeholder || "—"}</span>}
    </div>
  );
};

// ─── Multi-state Week Cell ───────────────────────────────────────────────────
const WeekCell = ({ weekIndex, value, loanDate, weeklyInstall, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const isAbsent = value === ABSENT;
  const isPaid = value > 0;
  const isEmpty = value == null;

  const dueDate = loanDate
    ? (() => {
      const d = new Date(loanDate);
      if (isNaN(d)) return null;
      d.setDate(d.getDate() + (weekIndex + 1) * 7);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    })()
    : null;

  const commit = () => {
    const num = parseFloat(draft);
    if (!isNaN(num) && num >= 0) onChange(num);
    else onChange(null);
    setEditing(false);
    setDraft('');
  };

  const markAbsent = (e) => {
    e.stopPropagation();
    onChange(ABSENT);
  };

  const clearAbsent = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const bg = isAbsent ? 'rgba(245,158,11,0.12)' : isPaid ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)';
  const borderColor = isAbsent ? '#f59e0b' : isPaid ? '#10b981' : 'var(--border-color)';

  return (
    <div style={{
      background: bg, border: `1px solid ${borderColor}`,
      borderRadius: 10, padding: '7px 6px', textAlign: 'center',
      minWidth: 80, position: 'relative', transition: 'all 0.2s',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 1 }}>W{weekIndex + 1}</div>
      {dueDate && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>📅 {dueDate}</div>}

      {isAbsent && !editing && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', marginBottom: 4, letterSpacing: '0.5px' }}>🔴 ABSENT</div>
          <div style={{ fontSize: 9, color: '#f59e0b', marginBottom: 6, opacity: 0.8 }}>+1 week added</div>
          <button onClick={clearAbsent} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(245,158,11,0.2)', border: '1px solid #f59e0b', borderRadius: 4, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit' }}>✕ Clear</button>
        </div>
      )}

      {isPaid && !editing && (
        <div onClick={() => { setEditing(true); setDraft(String(value)); }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#10b981', cursor: 'text' }}>₹{Number(value).toLocaleString('en-IN')}</div>
          {weeklyInstall && <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>/{weeklyInstall.toLocaleString('en-IN')}</div>}
        </div>
      )}

      {isEmpty && !editing && (
        <div>
          <div onClick={() => { setEditing(true); setDraft(''); }} style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'text', marginBottom: 5, minHeight: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {weeklyInstall ? `₹${weeklyInstall.toLocaleString('en-IN')}` : '—'}
          </div>
          <button onClick={markAbsent} style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 4, color: '#f59e0b', cursor: 'pointer', fontFamily: 'inherit', display: 'block', margin: '0 auto', transition: 'all 0.15s' }}>Mark Absent</button>
        </div>
      )}

      {editing && (
        <div>
          <input autoFocus type="number" value={draft} placeholder="Amt" onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(''); } }} style={{ width: '100%', textAlign: 'center', background: 'var(--input-bg)', color: 'var(--text-primary)', border: '2px solid #6366f1', borderRadius: 6, padding: '4px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>Enter → save</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function FinanceBook() {
  const [currentUser, setCurrentUser] = useState(null);
  const [villages, setVillages] = useState(EMPTY_VILLAGES);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [activeVillage, setActiveVillage] = useState("VLG1");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("ledger"); // ledger | weekly | search | analytics | settings
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillageName, setNewVillageName] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // V2 Features State
  const [villageNames, setVillageNames] = useState({});
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("dark");
  const [capitalAmount, setCapitalAmount] = useState(500000);
  const [isMobile, setIsMobile] = useState(false);
  const [editingVillage, setEditingVillage] = useState(null);
  const [villageDraft, setVillageDraft] = useState("");

  const t = (key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  // Effects for Persistence & Mobile
  useEffect(() => {
    const savedLang = localStorage.getItem("FB_lang");
    const savedTheme = localStorage.getItem("FB_theme");
    const savedCap = localStorage.getItem("FB_capital");

    if (savedLang) setLang(savedLang);
    if (savedTheme) setTheme(savedTheme);
    if (savedCap) setCapitalAmount(Number(savedCap));

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FIRESTORE SYNC & AUTH
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load THIS user's data from Firestore
        loadUserData(user.uid);
      } else {
        // User logged out — clear everything
        setVillages(EMPTY_VILLAGES);
        setVillageNames({});
        setDataLoaded(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Load user data from Firestore
  const loadUserData = async (uid) => {
    try {
      const ref = doc(db, 'users', uid, 'data', 'villages');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setVillages({ ...EMPTY_VILLAGES, ...(data.villages || {}) });
        if (data.villageNames) setVillageNames(data.villageNames);
      } else {
        // New user — start with empty data
        setVillages(EMPTY_VILLAGES);
        setVillageNames({});
      }
      setDataLoaded(true);
    } catch (err) {
      console.error('Failed to load user data:', err);
      // Fallback to empty if load fails
      setVillages(EMPTY_VILLAGES);
      setVillageNames({});
      setDataLoaded(true);
    }
  };

  // Save user data to Firestore whenever villages or villageNames changes
  const saveUserData = useCallback(async (newVillages, newVillageNames) => {
    if (!currentUser) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'data', 'villages');
      await setDoc(ref, {
        villages: newVillages,
        villageNames: newVillageNames
      }, { merge: true });
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      showToast('Save failed — check connection', 'error');
    }
  }, [currentUser]);

  // Debounced auto-save
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!dataLoaded || !currentUser) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveUserData(villages, villageNames);
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [villages, villageNames, dataLoaded, currentUser, saveUserData]);

  useEffect(() => { localStorage.setItem("FB_lang", lang); }, [lang]);
  useEffect(() => {
    localStorage.setItem("FB_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  useEffect(() => { localStorage.setItem("FB_capital", capitalAmount); }, [capitalAmount]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2000);
  };

  // ── Master: all customers flat ──────────────────────────────────────────
  const allCustomers = useMemo(() => {
    return Object.values(villages).flat().map(calcCustomer);
  }, [villages]);

  // ── Current village customers ───────────────────────────────────────────
  const currentCustomers = useMemo(() => {
    return (villages[activeVillage] || []).map(calcCustomer);
  }, [villages, activeVillage]);

  // ── Week totals for current village ────────────────────────────────────
  const weekTotals = useMemo(() => {
    const maxW = Math.max(...currentCustomers.map(c => c.weeksTotal || 12), 12);
    return Array.from({ length: maxW }, (_, wi) =>
      currentCustomers.reduce((s, c) => s + (c.weeks[wi] || 0), 0)
    );
  }, [currentCustomers]);

  // ── Grand totals current village ───────────────────────────────────────
  const villageSummary = useMemo(() => ({
    totalLoan: currentCustomers.reduce((s, c) => s + (c.loanAmount || 0), 0),
    totalCredit: currentCustomers.reduce((s, c) => s + (c.creditValue || 0), 0),
    totalPaid: currentCustomers.reduce((s, c) => s + c.paid, 0),
    totalRemaining: currentCustomers.reduce((s, c) => s + Math.max(c.remaining, 0), 0),
    activeCount: currentCustomers.filter(c => c.status === "active").length,
    paidCount: currentCustomers.filter(c => c.status === "paid").length,
    totalCount: currentCustomers.filter(c => c.name).length,
  }), [currentCustomers]);

  // ── Master analytics ────────────────────────────────────────────────────
  const masterAnalytics = useMemo(() => {
    const named = allCustomers.filter(c => c.name);
    return {
      totalCustomers: named.length,
      totalLoan: named.reduce((s, c) => s + (c.loanAmount || 0), 0),
      totalCredit: named.reduce((s, c) => s + (c.creditValue || 0), 0),
      totalPaid: named.reduce((s, c) => s + c.paid, 0),
      totalRemaining: named.reduce((s, c) => s + Math.max(c.remaining, 0), 0),
      grossProfit: named.reduce((s, c) => s + ((c.creditValue || 0) - (c.loanAmount || 0)), 0),
      byVillage: VILLAGE_META.concat(
        Object.keys(villages)
          .filter(id => !VILLAGE_META.find(v => v.id === id))
          .map(id => ({ id, name: id, color: "#64748b", light: "#f8fafc" }))
      ).map(vm => ({
        ...vm,
        customers: (villages[vm.id] || []).map(calcCustomer).filter(c => c.name),
        totalLoan: (villages[vm.id] || []).reduce((s, c) => s + (c.loanAmount || 0), 0),
        totalPaid: (villages[vm.id] || []).map(calcCustomer).reduce((s, c) => s + c.paid, 0),
        totalRemaining: (villages[vm.id] || []).map(calcCustomer).reduce((s, c) => s + Math.max(c.remaining, 0), 0),
      })),
    };
  }, [allCustomers, villages]);

  // ── Search results ──────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return allCustomers.filter(c => c.name);
    const q = searchQuery.toLowerCase();
    return allCustomers.filter(c =>
      c.name && (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        VILLAGE_META.find(v => v.id === c.villageId)?.name.toLowerCase().includes(q) ||
        c.villageId.toLowerCase().includes(q)
      )
    );
  }, [allCustomers, searchQuery]);

  // ── Mutators ───────────────────────────────────────────────────────────
  const commitVillageName = useCallback((villageId, newName) => {
    if (!newName.trim()) return;
    setVillageNames(p => ({ ...p, [villageId]: newName.trim() }));
    setVillages(prev => {
      const code = makeVillageCode(newName);
      const list = (prev[villageId] || []).map(c => ({
        ...c,
        id: `${code}-${String(c.serial).padStart(3, "0")}`
      }));
      return { ...prev, [villageId]: list };
    });
  }, []);

  const updateCustomer = useCallback((villageId, custUid, field, value) => {
    setVillages(prev => ({
      ...prev,
      [villageId]: prev[villageId].map(c =>
        c.uid === custUid ? { ...c, [field]: value } : c
      ),
    }));
  }, []);

  const updateWeek = useCallback((villageId, custUid, weekIdx, value) => {
    setVillages(prev => ({
      ...prev,
      [villageId]: prev[villageId].map(c => {
        if (c.uid !== custUid) return c;
        const weeks = [...c.weeks];
        // Ensure array is long enough
        while (weeks.length <= weekIdx) weeks.push(null);
        weeks[weekIdx] = value;

        // Count absent weeks in the plan range
        const planWeeks = weeks.slice(0, c.weeksTotal || 12);
        const absentCount = planWeeks.filter(v => v === ABSENT).length;

        // Effective total = base plan + absent extensions
        const effectiveTotal = (c.weeksTotal || 12) + absentCount;
        while (weeks.length < effectiveTotal) weeks.push(null);

        return { ...c, weeks };
      }),
    }));
  }, []);

  const addCustomer = useCallback((villageId) => {
    setVillages(prev => {
      const list = prev[villageId] || [];
      const serial = list.length + 1;
      const newCustomer = makeCustomer(villageId, serial);

      const defaultMeta = VILLAGE_META.find(v => v.id === villageId);
      const defaultName = defaultMeta ? defaultMeta.name : villageId;
      const name = villageNames[villageId] || defaultName;
      const code = makeVillageCode(name);

      newCustomer.id = `${code}-${String(serial).padStart(3, "0")}`;

      return { ...prev, [villageId]: [...list, newCustomer] };
    });
    showToast("New customer row added — click fields to edit");
  }, [villageNames]);

  const deleteCustomer = useCallback((villageId, custUid) => {
    setVillages(prev => {
      const filtered = prev[villageId].filter(c => c.uid !== custUid);
      // Re-serial
      const reindexed = filtered.map((c, i) => ({
        ...c, serial: i + 1, id: genId(c.villageId, i + 1),
      }));
      return { ...prev, [villageId]: reindexed };
    });
    setConfirmDelete(null);
    showToast("Customer removed and master data updated", "error");
  }, []);

  const addVillage = () => {
    if (!newVillageName.trim()) return;
    const id = "VLG" + uid().slice(0, 4);
    setVillages(prev => ({ ...prev, [id]: [] }));
    VILLAGE_META.push({ id, name: newVillageName.trim(), color: "#64748b", light: "#f8fafc" });
    setNewVillageName("");
    setShowAddVillage(false);
    setActiveVillage(id);
    showToast(`${newVillageName.trim()} village created`);
  };

  const allVillageIds = Object.keys(villages);
  const getVillageMeta = (id) => {
    const defaultMeta = VILLAGE_META.find(v => v.id === id) || { id, name: id, color: "#64748b", light: "#f8fafc" };
    return { ...defaultMeta, name: villageNames[id] || defaultMeta.name };
  };
  const getVillageName = (id) => getVillageMeta(id).name;
  const activeVillageMeta = getVillageMeta(activeVillage);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="app-content-container" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "var(--bg-main)", minHeight: "100vh", color: "var(--text-main)", transition: "background .3s ease" }}>

      {/* Loading state */}
      {!dataLoaded && currentUser && (
        <div style={{ position: "fixed", inset: 0, background: "var(--bg-main)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "var(--text-muted)" }}>Loading your data...</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 600, fontSize: 13, boxShadow: "var(--shadow)",
          animation: "slideIn .3s ease",
        }}>
          {toast.type === "error" ? "🗑️ " : "✅ "}{toast.msg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 9998,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ background: "var(--bg-surface-elevated)", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%", border: "1px solid var(--color-danger, #ef4444)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-danger, #ef4444)", marginBottom: 8 }}>⚠️ Delete Customer?</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
              "<strong style={{ color: "var(--text-strong)" }}>{confirmDelete.name || "Unnamed"}</strong>" will be permanently removed
              from <strong style={{ color: "var(--text-strong)" }}>{getVillageMeta(confirmDelete.villageId).name}</strong> and all master records.
              This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", border: "1px solid var(--border-color)", borderRadius: 8, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => deleteCustomer(confirmDelete.villageId, confirmDelete.uid)}
                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "var(--color-danger, #ef4444)", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BALANCE BAR (Sticky Top) ── */}
      <div className="mobile-balance-bar">
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text-strong)", letterSpacing: "-0.5px" }}>
          💼 <span style={{ color: "var(--primary-rgb, #7C3AED)" }}>Finance</span>Book
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 20, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>
            ↑ IN {fmt(masterAnalytics.totalPaid)}
          </div>
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 20, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "var(--color-danger, #ef4444)", whiteSpace: "nowrap" }}>
            ↓ BAL {fmt(masterAnalytics.totalRemaining)}
          </div>
        </div>
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="desktop-header" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", padding: "0 24px", transition: "background .3s" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, height: 64 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: "var(--text-strong)", letterSpacing: "-0.5px" }}>
            💼 <span style={{ color: "#6366f1" }}>Finance</span>Book
          </div>

          {/* Nav Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "ledger", label: t("ledger") },
              { key: "weekly", label: t("weekly") },
              { key: "schedule", label: t("schedule") },
              { key: "search", label: t("search") },
              { key: "analytics", label: t("analytics") },
              { key: "settings", label: t("settings") },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                style={{
                  background: view === key ? "#6366f1" : "transparent",
                  color: view === key ? "#fff" : "var(--text-muted)",
                  border: "none", borderRadius: 8, padding: "6px 14px",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                  transition: "all .2s",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Desktop Balance indicator */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 20, padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>
              ↑ IN {fmt(masterAnalytics.totalPaid)}
            </div>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 20, padding: "6px 12px", fontSize: 13, fontWeight: 700, color: "var(--color-danger, #ef4444)", whiteSpace: "nowrap" }}>
              ↓ BAL {fmt(masterAnalytics.totalRemaining)}
            </div>
          </div>

          {/* Theme & Lang Toggles */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", borderLeft: "1px solid var(--border-color)", paddingLeft: 16 }}>
            <button key="lang" onClick={() => setLang(l => l === "en" ? "te" : "en")}
              style={{ background: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", borderRadius: 8, padding: "6px 12px", color: "var(--text-strong)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              title="Toggle Language">
              {lang === "en" ? "A/ఆ" : "ఆ/A"}
            </button>
            <button key="theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
              style={{ background: "var(--bg-surface-elevated)", border: "1px solid var(--border-color)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-strong)", fontSize: 16, cursor: "pointer" }}
              title="Toggle Theme">
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="mobile-bottom-nav">
        {[
          { key: "ledger", icon: "📋", label: "Ledger" },
          { key: "weekly", icon: "📅", label: "Weekly" },
          { key: "schedule", icon: "📆", label: "Sched" },
          { key: "analytics", icon: "📈", label: "Stats" },
          { key: "settings", icon: "⚙️", label: "Set" },
        ].map(({ key, icon, label }) => (
          <button key={key} onClick={() => setView(key)}
            style={{
              background: "transparent", border: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, width: "18%", color: view === key ? "#6366f1" : "var(--text-muted)",
            }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === key ? 800 : 600 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Village tabs + Inline Editable Drafts */}
      {view !== "search" && view !== "analytics" && view !== "settings" && (
        <div style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {allVillageIds.map(id => {
            const vm = getVillageMeta(id);
            const isActive = id === activeVillage;
            const count = (villages[id] || []).filter(c => c.name).length;
            const isEditing = editingVillage === id;

            return (
              <div key={id} style={{ display: "flex", alignItems: "center" }}>
                {isEditing ? (
                  <input
                    autoFocus
                    onFocus={e => e.target.select()}
                    value={villageDraft}
                    onChange={e => setVillageDraft(e.target.value)}
                    onBlur={() => {
                      if (villageDraft.trim()) commitVillageName(id, villageDraft);
                      setEditingVillage(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter") e.target.blur();
                    }}
                    style={{ padding: "8px 12px", margin: "4px 0", border: "2px solid #6366f1", borderRadius: 6, background: "var(--bg-surface-elevated)", color: "var(--text-strong)", fontSize: 13, outline: "none", width: 100 }}
                  />
                ) : (
                  <button onClick={() => setActiveVillage(id)}
                    onDoubleClick={() => { setEditingVillage(id); setVillageDraft(vm.name); }}
                    title="Double-click to rename"
                    style={{
                      padding: "10px 20px", border: "none", background: isActive ? "var(--bg-surface-alt)" : "transparent",
                      borderBottom: isActive ? `2px solid ${vm.color}` : "2px solid transparent",
                      color: isActive ? vm.color : "var(--text-muted)", fontWeight: isActive ? 800 : 600,
                      fontSize: 14, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s",
                    }}>
                    🏘️ {getVillageName(vm.id)}
                    <span style={{ marginLeft: 6, background: isActive ? vm.color + "33" : "var(--bg-surface-elevated)", color: isActive ? vm.color : "var(--text-muted)", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{count}</span>
                  </button>
                )}
              </div>
            );
          })}
          <button onClick={() => setShowAddVillage(v => !v)}
            style={{ padding: "10px 16px", border: "none", background: "transparent", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            {t("addVillage")}
          </button>
          {showAddVillage && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <input value={newVillageName} onChange={e => setNewVillageName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addVillage()}
                placeholder={t("villageNamePlaceholder")} autoFocus
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-surface-elevated)", color: "var(--text-strong)", fontSize: 13, outline: "none" }} />
              <button onClick={addVillage}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {t("add")}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 24px" }}>
        {/* Search Input for Mobile/Desktop Unified Layout */}
        {(view === "ledger" || view === "weekly" || view === "schedule" || view === "search") && (
          <div className={view === "search" ? "" : "desktop-search"} style={{ position: "relative", maxWidth: view === "search" ? 600 : 340, marginBottom: 24, margin: view === "search" ? "0 0 24px" : "0 0 20px auto" }}>
            <span style={{ position: "absolute", left: view === "search" ? 16 : 12, top: "50%", transform: "translateY(-50%)", fontSize: view === "search" ? 18 : 14 }}>🔍</span>
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setView("search"); }}
              placeholder={t("searchPlaceholder")}
              style={{
                width: "100%", padding: view === "search" ? "14px 16px 14px 48px" : "10px 12px 10px 36px", borderRadius: view === "search" ? 14 : 10,
                border: view === "search" ? "2px solid #6366f1" : "1px solid var(--border-color)", background: "var(--bg-surface)", color: "var(--text-strong)",
                fontSize: view === "search" ? 15 : 13, outline: "none", boxSizing: "border-box", fontWeight: 500
              }} />
          </div>
        )}

        {/* ── SEARCH VIEW ─────────────────────────────────────────── */}
        {view === "search" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)", marginBottom: 4 }}>🔍 Customer Search</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} {searchQuery ? `for "${searchQuery}"` : "(all customers)"}</div>
            </div>

            {/* Big search bar */}
            <div style={{ position: "relative", maxWidth: 600, marginBottom: 24 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
                placeholder="Search by name, customer ID, village, phone number…"
                style={{
                  width: "100%", padding: "14px 16px 14px 48px", borderRadius: 14,
                  border: "2px solid #6366f1", background: "var(--bg-surface)", color: "var(--text-strong)",
                  fontSize: 15, outline: "none", boxSizing: "border-box", fontWeight: 500
                }} />
            </div>

            {searchResults.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60, fontSize: 15 }}>
                😶 No customers found. Try a different search.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {searchResults.map(c => {
                  const vm = getVillageMeta(c.villageId);
                  return (
                    <div key={c.uid}
                      style={{ background: "var(--bg-surface)", border: `1px solid ${vm.color}44`, borderRadius: 14, padding: 20, transition: "transform .15s", cursor: "pointer", boxShadow: "var(--shadow)" }}
                      onClick={() => { setActiveVillage(c.villageId); setView("ledger"); setExpandedCustomer(c.uid); }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-strong)" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: vm.color, fontWeight: 700, marginTop: 2 }}>{c.id}</div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ background: vm.color + "22", color: vm.color, padding: "2px 8px", borderRadius: 10, fontWeight: 700, fontSize: 10 }}>🏘️ {vm.name}</span>
                        {c.phone && <span>📞 {c.phone}</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[["Loan", c.loanAmount], ["Paid", c.paid], ["Remaining", c.remaining]].map(([l, v]) => (
                          <div key={l} style={{ background: "var(--bg-stripe-alt)", borderRadius: 8, padding: "8px 10px", border: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: l === "Remaining" && v > 0 ? "var(--color-danger, #ef4444)" : l === "Paid" ? "var(--color-success, #10b981)" : "var(--text-main)" }}>
                              {fmt(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS VIEW ──────────────────────────────────────── */}
        {view === "analytics" && (
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)", marginBottom: 20 }}>📈 Business Analytics</div>

            {/* Master KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Customers", value: masterAnalytics.totalCustomers, color: "#6366f1", icon: "👥" },
                { label: "Capital Deployed", value: masterAnalytics.totalLoan, color: "#f59e0b", icon: "💰", money: true },
                { label: "Credit Value", value: masterAnalytics.totalCredit, color: "var(--color-success, #10b981)", icon: "📈", money: true },
                { label: "Total Collected", value: masterAnalytics.totalPaid, color: "#0ea5e9", icon: "✅", money: true },
                { label: "Outstanding", value: masterAnalytics.totalRemaining, color: "var(--color-danger, #ef4444)", icon: "⏳", money: true },
                { label: "Expected Profit", value: masterAnalytics.grossProfit, color: "#a3e635", icon: "💹", money: true },
              ].map(({ label, value, color, icon, money }) => (
                <div key={label} style={{ background: "var(--bg-surface)", border: `1px solid ${color}33`, borderRadius: 14, padding: "20px 20px 16px", boxShadow: "var(--shadow)" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color }}>{money ? fmt(value) : value}</div>
                </div>
              ))}
            </div>

            {/* Village comparison */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", marginBottom: 16 }}>🏘️ Village Comparison</div>
            <div style={{ background: "var(--bg-surface)", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-stripe-alt)" }}>
                    {["Village", "Customers", "Capital ₹", "Collected ₹", "Outstanding ₹", "Collection %"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {masterAnalytics.byVillage.filter(v => villages[v.id]).map((v, i) => {
                    const pct = v.totalLoan ? Math.round((v.totalPaid / (v.totalLoan)) * 100) : 0;
                    return (
                      <tr key={v.id} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-stripe)", cursor: "pointer" }}
                        onClick={() => { setActiveVillage(v.id); setView("ledger"); }}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{ background: v.color + "22", color: v.color, padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>🏘️ {v.name}</span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, fontWeight: 700, color: v.color }}>{v.customers.length}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{fmt(v.totalLoan)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: "var(--color-success, #10b981)", fontWeight: 600 }}>{fmt(v.totalPaid)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, color: v.totalRemaining > 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)", fontWeight: 600 }}>{fmt(v.totalRemaining)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, background: "var(--border-color)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 100 ? "var(--color-success, #10b981)" : v.color, borderRadius: 99, transition: "width .5s" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", minWidth: 36 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* All Customers Master Table */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", margin: "32px 0 16px" }}>🗄️ Master Customer Database</div>
            <div style={{ background: "var(--bg-surface)", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border-color)", boxShadow: "var(--shadow)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-stripe-alt)" }}>
                    {["Customer ID", "Village", "Name", "Phone", "Loan Date", "Plan", "Loan ₹", "Credit ₹", "Paid ₹", "Remaining ₹", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCustomers.filter(c => c.name).map((c, i) => {
                    const vm = getVillageMeta(c.villageId);
                    return (
                      <tr key={c.uid} style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-stripe)" }}>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 11, fontWeight: 700, color: vm.color }}>{c.id}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)" }}>
                          <span style={{ background: vm.color + "22", color: vm.color, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{vm.name}</span>
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>{c.name}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "var(--text-muted)" }}>{c.phone || "—"}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "#6366f1" }}>
                          {c.loanDate ? new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>
                          {c.weeksTotal || 12}W
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{fmt(c.loanAmount)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "var(--text-main)" }}>{fmt(c.creditValue)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "var(--color-success, #10b981)", fontWeight: 600 }}>{fmt(c.paid)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: c.remaining > 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)", fontWeight: 600 }}>{fmt(Math.max(c.remaining, 0))}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-color)" }}><StatusBadge status={c.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LEDGER VIEW ─────────────────────────────────────────── */}
        {view === "ledger" && (
          <div>
            {/* Village header + summary cards */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>
                  <span style={{ color: activeVillageMeta.color }}>🏘️ {activeVillageMeta.name}</span> — {t("customerLedger")}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  {t("editPrompt")}
                </div>
              </div>
              <button onClick={() => addCustomer(activeVillage)}
                style={{
                  padding: "10px 22px", background: activeVillageMeta.color, border: "none", borderRadius: 10,
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                }}>
                {t("addCustomer")}
              </button>
            </div>

            {/* Summary bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { l: t("customers"), v: villageSummary.totalCount, color: activeVillageMeta.color },
                { l: t("active"), v: villageSummary.activeCount, color: "#f59e0b" },
                { l: t("paidOff"), v: villageSummary.paidCount, color: "#10b981" },
                { l: t("capital"), v: fmt(villageSummary.totalLoan), color: "var(--text-muted)" },
                { l: "Collected", v: fmt(villageSummary.totalPaid), color: "#10b981" },
                { l: t("outstanding"), v: fmt(villageSummary.totalRemaining), color: "var(--color-danger, #ef4444)" },
              ].map(({ l, v, color }) => (
                <div key={l} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "16px " }}>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{l}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Ledger table */}
            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid var(--border-color)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "var(--bg-stripe-alt)" }}>
                    {[t("colID"), t("colName"), t("colPhone"), t("colLoanDate"), t("colLoan"), t("colCredit"), t("colWeekly"), t("colWks"), t("colPaid"), t("colRemaining"), t("colStatus"), t("colActions")].map(h => (
                      <th key={h} className={h === t("colName") ? "ledger-name-col" : ""} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c, i) => {
                    const isExpanded = expandedCustomer === c.uid;
                    const rowBg = i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-stripe)";
                    return [
                      <tr key={c.uid} style={{ background: rowBg }} onClick={() => setExpandedCustomer(isExpanded ? null : c.uid)}>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", fontSize: 13, fontWeight: 700, color: activeVillageMeta.color, whiteSpace: "nowrap" }}>{c.id}</td>
                        <td className="ledger-name-col" style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", background: rowBg }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.name} placeholder="Customer name" onChange={v => updateCustomer(c.villageId, c.uid, "name", v)} />
                          {c.absentCount > 0 && (
                            <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, marginTop: 4, padding: "2px 6px", background: "rgba(245,158,11,0.1)", borderRadius: 4, display: "inline-block" }}>
                              🔴 {c.absentCount} ABSENT ({c.effectiveTotal}W Total)
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.phone} placeholder="Phone" onChange={v => updateCustomer(c.villageId, c.uid, "phone", v)} style={{ fontSize: 13 }} />
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <input
                            type="date"
                            value={c.loanDate || ""}
                            onChange={e => updateCustomer(c.villageId, c.uid, "loanDate", e.target.value)}
                            style={{
                              background: "transparent", border: "1px solid var(--border-color)", borderRadius: 6,
                              color: c.loanDate ? "var(--text-strong)" : "var(--text-muted)", fontSize: 13, padding: "4px 8px",
                              cursor: "pointer", outline: "none", width: 130,
                            }}
                          />
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.loanAmount} type="number" placeholder="0" onChange={v => updateCustomer(c.villageId, c.uid, "loanAmount", v)} style={{ fontWeight: 700 }} />
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.creditValue} type="number" placeholder="0" onChange={v => updateCustomer(c.villageId, c.uid, "creditValue", v)} style={{ fontWeight: 700 }} />
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", fontSize: 15, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {c.weeklyInstall ? fmt(c.weeklyInstall) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <select
                            value={c.weeksTotal || 12}
                            onChange={e => updateCustomer(c.villageId, c.uid, "weeksTotal", Number(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            style={{
                              background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 6,
                              color: "var(--text-strong)", fontSize: 14, padding: "6px 10px", cursor: "pointer",
                              outline: "none", width: 80,
                            }}>
                            {WEEK_OPTIONS.map(w => (
                              <option key={w} value={w}>{w}W</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", fontSize: 16, fontWeight: 800, color: "var(--color-success, #10b981)", whiteSpace: "nowrap" }}>{fmt(c.paid)}</td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)", fontSize: 16, fontWeight: 800, color: c.remaining > 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)", whiteSpace: "nowrap" }}>{fmt(Math.max(c.remaining, 0))}</td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--border-color)" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setExpandedCustomer(isExpanded ? null : c.uid)}
                              title="Show weekly payments" style={{ padding: "6px 12px", border: "1px solid var(--border-color)", borderRadius: 6, background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>
                              {isExpanded ? "▲" : "▼"}
                            </button>
                            <button onClick={() => setConfirmDelete(c)}
                              title="Delete customer" style={{ padding: "6px 12px", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, background: "rgba(239, 68, 68, 0.1)", color: "var(--color-danger, #ef4444)", cursor: "pointer", fontSize: 14 }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>,
                      // Expanded weekly row
                      isExpanded && (
                        <tr key={c.uid + "_exp"} style={{ background: "var(--bg-stripe-alt)" }}>
                          <td colSpan={12} style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Weekly Payments — {c.name || "Customer"}
                              {c.loanDate && <span style={{ marginLeft: 12, color: "#6366f1", fontWeight: 600 }}>📅 Loan date: {new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                            </div>

                            {/* Week payment cells */}
                            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`, gap: 8, marginBottom: 8 }}>
                              {Array.from({ length: c.effectiveTotal }, (_, wi) => (
                                <WeekCell
                                  key={wi}
                                  weekIndex={wi}
                                  value={c.weeks[wi]}
                                  loanDate={c.loanDate}
                                  weeklyInstall={c.weeklyInstall}
                                  onChange={v => updateWeek(c.villageId, c.uid, wi, v)}
                                />
                              ))}
                            </div>

                            {/* Repayment summary bar */}
                            <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                ✅ Paid: <strong style={{ color: "var(--color-success, #10b981)" }}>{c.weeksPaid}/{c.weeksTotal} weeks</strong>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                ⏳ Remaining weeks: <strong style={{ color: "#f59e0b" }}>{c.weeksRemaining}</strong>
                              </div>
                              {c.loanDate && c.weeksTotal && (
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                  🏁 Final due: <strong style={{ color: "#6366f1" }}>
                                    {addWeeks(c.loanDate, c.weeksTotal - 1)}
                                  </strong>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>
                              Notes:&nbsp;
                              <span onClick={e => e.stopPropagation()}>
                                <EditCell value={c.notes} placeholder="Add notes…" onChange={v => updateCustomer(c.villageId, c.uid, "notes", v)} />
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    ];
                  })}

                  {/* Empty state */}
                  {currentCustomers.length === 0 && (
                    <tr>
                      <td colSpan={12} style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
                        {t("noCustomers")} {activeVillageMeta.name}.<br />
                        <button onClick={() => addCustomer(activeVillage)}
                          style={{ marginTop: 16, padding: "10px 24px", background: activeVillageMeta.color, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                          {t("addFirst")}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WEEKLY VIEW ──────────────────────────────────────────── */}
        {view === "weekly" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                  📅 Weekly Collection — <span style={{ color: activeVillageMeta.color }}>{activeVillageMeta.name}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Week totals update instantly as you enter payments
                </div>
              </div>
              <button onClick={() => addCustomer(activeVillage)}
                style={{ padding: "10px 22px", background: activeVillageMeta.color, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                + Add Customer
              </button>
            </div>

            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid var(--border-color)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: "var(--bg-stripe-alt)" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)", position: "sticky", left: 0, background: "var(--bg-stripe-alt)", zIndex: 2 }}>Customer</th>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Install ₹</th>
                    {/* Determine common loan date from first customer with a date */}
                    {(() => {
                      const refDate = currentCustomers.find(c => c.loanDate)?.loanDate || null;
                      const maxWeeks = Math.max(...currentCustomers.map(c => c.effectiveTotal || 12), 12);
                      return Array.from({ length: maxWeeks }, (_, wi) => {
                        const dateLabel = refDate ? addWeeks(refDate, wi) : null;
                        const colTotal = currentCustomers.reduce((s, c) => s + (c.weeks[wi] > 0 ? c.weeks[wi] : 0), 0);
                        return (
                          <th key={wi} style={{
                            padding: "10px 8px", textAlign: "center", fontSize: 9, fontWeight: 700,
                            color: colTotal > 0 ? activeVillageMeta.color : "var(--text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                            borderBottom: "1px solid var(--border-color)", minWidth: 72,
                          }}>
                            <div>W{wi + 1}</div>
                            {dateLabel && <div style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>📅 {dateLabel}</div>}
                          </th>
                        );
                      });
                    })()}
                    <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--color-success, #10b981)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Total Paid</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--color-danger, #ef4444)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--border-color)" }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c, i) => {
                    const rowBg = i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-stripe)";
                    return (
                      <tr key={c.uid} style={{ background: rowBg }}>
                        <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-color)", position: "sticky", left: 0, background: rowBg, zIndex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-strong)" }}>
                            <EditCell value={c.name} placeholder="Customer name" onChange={v => updateCustomer(c.villageId, c.uid, "name", v)} />
                          </div>
                          <div style={{ fontSize: 10, color: activeVillageMeta.color, fontWeight: 700 }}>{c.id}</div>
                        </td>
                        <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-color)", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {c.weeklyInstall ? fmt(c.weeklyInstall) : "—"}
                        </td>
                        {Array.from({ length: Math.max(...currentCustomers.map(c => c.effectiveTotal || 12), 12) }, (_, wi) => {
                          const isWithinCustomerPlan = wi < (c.effectiveTotal || 12);
                          const val = c.weeks[wi];
                          const isAbsent = val === ABSENT;
                          const isPaid = val > 0;
                          return (
                            <td key={wi} style={{
                              padding: "4px 6px", borderBottom: "1px solid var(--border-color)", textAlign: "center",
                              opacity: isWithinCustomerPlan ? 1 : 0.25,
                            }}>
                              {isWithinCustomerPlan ? (
                                <div style={{
                                  background: isAbsent ? "rgba(245,158,11,0.1)" : isPaid ? activeVillageMeta.color + "22" : "transparent",
                                  borderRadius: 6, padding: "2px 0",
                                  border: isAbsent ? "1px solid rgba(245,158,11,0.3)" : isPaid ? `1px solid ${activeVillageMeta.color}44` : "1px solid transparent",
                                }}>
                                  {isAbsent ? (
                                    <div onClick={() => updateWeek(c.villageId, c.uid, wi, null)} title="Click to clear" style={{ cursor: "pointer", fontSize: 10, fontWeight: 800, color: "#f59e0b", padding: "4px 0" }}>
                                      ABSENT
                                    </div>
                                  ) : (
                                    <EditCell
                                      value={val}
                                      type="number"
                                      placeholder="—"
                                      onChange={v => updateWeek(c.villageId, c.uid, wi, v)}
                                      style={{ textAlign: "center", fontSize: 11, fontWeight: isPaid ? 700 : 400, color: isPaid ? "var(--color-success, #10b981)" : "var(--text-muted)" }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>—</div>
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-color)", textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--color-success, #10b981)", whiteSpace: "nowrap" }}>{fmt(c.paid)}</td>
                        <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--border-color)", textAlign: "center", fontSize: 13, fontWeight: 700, color: c.remaining > 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)", whiteSpace: "nowrap" }}>
                          {fmt(Math.max(c.remaining, 0))}
                        </td>
                      </tr>
                    );
                  })}

                  {currentCustomers.length === 0 && (
                    <tr><td colSpan={16} style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
                      No customers yet. <button onClick={() => addCustomer(activeVillage)}
                        style={{ background: "none", border: "none", color: activeVillageMeta.color, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                        + Add one
                      </button>
                    </td></tr>
                  )}
                </tbody>

                {/* ── WEEK TOTALS ROW — auto-updates ── */}
                {currentCustomers.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "var(--bg-stripe)", borderTop: `2px solid ${activeVillageMeta.color}` }}>
                      <td style={{ padding: "14px 14px", position: "sticky", left: 0, background: "var(--bg-stripe)", zIndex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: activeVillageMeta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          📊 WEEK TOTALS
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Auto-calculated</div>
                      </td>
                      <td style={{ padding: "14px 14px", fontSize: 11, color: "var(--text-muted)" }}>—</td>
                      {weekTotals.map((total, wi) => (
                        <td key={wi} style={{ padding: "14px 10px", textAlign: "center" }}>
                          <div style={{
                            background: total > 0 ? activeVillageMeta.color + "22" : "transparent",
                            border: `1px solid ${total > 0 ? activeVillageMeta.color + "55" : "var(--border-color)"}`,
                            borderRadius: 8, padding: "6px 4px",
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: total > 0 ? activeVillageMeta.color : "var(--text-muted)" }}>
                              {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: "14px 14px", textAlign: "center", fontSize: 14, fontWeight: 800, color: "var(--color-success, #10b981)" }}>
                        {fmt(villageSummary.totalPaid)}
                      </td>
                      <td style={{ padding: "14px 14px", textAlign: "center", fontSize: 14, fontWeight: 800, color: villageSummary.totalRemaining > 0 ? "var(--color-danger, #ef4444)" : "var(--color-success, #10b981)" }}>
                        {fmt(villageSummary.totalRemaining)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Weekly collection progress bars */}
            {currentCustomers.length > 0 && (
              <div style={{ marginTop: 24, background: "var(--bg-surface)", borderRadius: 14, padding: 24, border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)", marginBottom: 16 }}>📊 Weekly Collection Progress</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {weekTotals.map((total, wi) => {
                    const refDate = currentCustomers.find(c => c.loanDate)?.loanDate || null;
                    const dateLabel = refDate ? addWeeks(refDate, wi) : null;
                    const maxWeekTotal = villageSummary.totalCredit / (currentCustomers[0]?.weeksTotal || 12) || 1;
                    const pct = Math.min((total / maxWeekTotal) * 100, 100);
                    return (
                      <div key={wi} style={{ background: "var(--bg-stripe-alt)", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>W{wi + 1}</span>
                            {dateLabel && <div style={{ fontSize: 9, color: "var(--text-muted)" }}>📅 {dateLabel}</div>}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: total > 0 ? activeVillageMeta.color : "var(--text-muted)" }}>
                            {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                          </span>
                        </div>
                        <div style={{ background: "var(--border-color)", borderRadius: 99, height: 5, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: activeVillageMeta.color, borderRadius: 99, transition: "width .4s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE VIEW ─────────────────────────────────────── */}
        {view === "schedule" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)" }}>
                📆 Repayment Schedule — <span style={{ color: activeVillageMeta.color }}>{activeVillageMeta.name}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Per-customer week-by-week repayment plan with due dates · supports 12 / 21 / 25 week plans
              </div>
            </div>

            {currentCustomers.filter(c => c.name).length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 60 }}>
                {t("noCustomers")} {activeVillageMeta.name}. Add customers in the Ledger tab.
              </div>
            )}

            {currentCustomers.filter(c => c.name).map(c => {
              const schedule = getRepaymentSchedule(c);
              const paidWeeks = schedule.filter(s => s.status === "paid").length;
              const partialWeeks = schedule.filter(s => s.status === "partial").length;
              const pendingWeeks = schedule.filter(s => s.status === "pending").length;
              const completionPct = Math.round((paidWeeks / (c.weeksTotal || 12)) * 100) || 0;

              return (
                <div key={c.uid} style={{
                  background: "var(--bg-surface)", border: `1px solid ${activeVillageMeta.color}33`,
                  borderRadius: 16, padding: 24, marginBottom: 20,
                  boxShadow: "var(--shadow)"
                }}>
                  {/* Customer header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-strong)" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: activeVillageMeta.color, fontWeight: 700 }}>{c.id}</div>
                      {c.loanDate && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                          💰 Debited: <strong style={{ color: "var(--text-main)" }}>
                            {new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </strong>
                          &nbsp;·&nbsp;
                          🏁 Final due: <strong style={{ color: "#6366f1" }}>
                            {addWeeks(c.loanDate, (c.weeksTotal || 12) - 1) || "—"}
                          </strong>
                        </div>
                      )}
                      {!c.loanDate && (
                        <div style={{ fontSize: 11, color: "var(--color-danger, #ef4444)", marginTop: 4 }}>
                          ⚠️ Set loan date in Ledger to see due dates
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ background: "var(--bg-stripe-alt)", borderRadius: 10, padding: "10px 16px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>PLAN</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: activeVillageMeta.color }}>{c.weeksTotal}W</div>
                      </div>
                      <div style={{ background: "var(--bg-stripe-alt)", borderRadius: 10, padding: "10px 16px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>WEEKLY</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>₹{(c.weeklyInstall || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{ background: "var(--bg-stripe-alt)", borderRadius: 10, padding: "10px 16px", textAlign: "center", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>CREDIT</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--color-success, #10b981)" }}>₹{(c.creditValue || 0).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        ✅ {paidWeeks} paid &nbsp;·&nbsp; 🟡 {partialWeeks} partial &nbsp;·&nbsp; ⏳ {pendingWeeks} pending
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: activeVillageMeta.color }}>{completionPct}% complete</span>
                    </div>
                    <div style={{ background: "var(--border-color)", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${completionPct}%`, height: "100%", background: activeVillageMeta.color, borderRadius: 99, transition: "width .4s" }} />
                    </div>
                  </div>

                  {/* Schedule grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: 8 }}>
                    {schedule.map((s, i) => {
                      const statusColor = s.status === "paid" ? "var(--color-success, #10b981)" : s.status === "partial" ? "#f59e0b" : "var(--text-muted)";
                      const statusBg = s.status === "paid" ? "rgba(16, 185, 129, 0.1)" : s.status === "partial" ? "rgba(245, 158, 11, 0.1)" : "var(--bg-stripe-alt)";
                      const statusBorder = s.status === "paid" ? "rgba(16, 185, 129, 0.2)" : s.status === "partial" ? "rgba(245, 158, 11, 0.2)" : "var(--border-color)";
                      return (
                        <div key={i} style={{
                          background: statusBg, border: `1px solid ${statusBorder}`,
                          borderRadius: 10, padding: "10px 8px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: activeVillageMeta.color, marginBottom: 2 }}>
                            W{s.weekNum}
                          </div>
                          {s.dueDate ? (
                            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 6 }}>📅 {s.dueDate}</div>
                          ) : (
                            <div style={{ fontSize: 9, color: "var(--border-color)", marginBottom: 6 }}>—</div>
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                            {s.paidAmount > 0 ? `₹${s.paidAmount.toLocaleString("en-IN")}` : "—"}
                          </div>
                          <div style={{ fontSize: 8, color: "var(--text-muted)", marginTop: 2 }}>
                            exp ₹{s.expectedAmount.toLocaleString("en-IN")}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 8, fontWeight: 700, color: statusColor, textTransform: "uppercase" }}>
                            {s.status === "paid" ? "✅" : s.status === "partial" ? "🟡" : "⏳"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── SETTINGS VIEW ─────────────────────────────────────── */}
        {view === "settings" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-strong)", marginBottom: 8 }}>
              {t("settings")}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
              Configure app preferences, initial capital, and language options.
            </div>

            {/* Capital Management */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 }}>💰 {t("capitalMgt")}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Set your initial business capital to calculate profit accurately.</div>

              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ position: "relative", width: 200 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    value={capitalAmount}
                    onChange={e => setCapitalAmount(Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 12px 10px 24px", borderRadius: 8, border: "2px solid #6366f1", background: "var(--bg-stripe-alt)", color: "var(--text-strong)", fontWeight: 700, outline: "none" }}
                  />
                </div>
                <div style={{ fontSize: 13, color: "var(--text-strong)" }}>
                  Total Loaned: <strong style={{ color: "var(--color-danger, #ef4444)" }}>{fmt(masterAnalytics.totalLoan)}</strong>
                  <br />
                  Available Cash: <strong style={{ color: "var(--color-success, #10b981)" }}>{fmt(capitalAmount - masterAnalytics.totalLoan + masterAnalytics.totalPaid)}</strong>
                </div>
              </div>
            </div>

            {/* Application Settings (Theme/Lang) */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", marginBottom: 16 }}>⚙️ Display Settings</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Theme */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Theme</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Light or Dark mode</div>
                  </div>
                  <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-surface-elevated)", color: "var(--text-strong)", fontWeight: 700, cursor: "pointer" }}>
                    {theme === "dark" ? "Dark 🌙" : "Light ☀️"}
                  </button>
                </div>

                {/* Language */}
                <div style={{ border: "1px solid var(--border-color)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-strong)" }}>Language</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>English or Telugu</div>
                  </div>
                  <button onClick={() => setLang(l => l === "en" ? "te" : "en")} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-surface-elevated)", color: "var(--text-strong)", fontWeight: 700, cursor: "pointer" }}>
                    {lang === "en" ? "English" : "తెలుగు"}
                  </button>
                </div>
              </div>
            </div>

            {/* Password (Mock) */}
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24, boxShadow: "var(--shadow)" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-strong)", marginBottom: 6 }}>🔒 {t("passwordUpdate")}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Secured by Firebase Admin (Mock interface)</div>

              <div style={{ display: "flex", gap: 12 }}>
                <input type="password" placeholder="New Password..." style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border-color)", background: "var(--bg-stripe-alt)", color: "var(--text-strong)" }} />
                <button onClick={() => showToast("Password updated successfully")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Save</button>
              </div>
            </div>

          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0f0f1a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
