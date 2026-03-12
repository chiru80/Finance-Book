import { useState, useMemo, useCallback, useEffect, useRef } from "react";

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

const SEED = {
  VLG1: [
    makeCustomer("VLG1", 1, {
      name: "Saibabu", phone: "", loanAmount: 4900, creditValue: 6000,
      weeksTotal: 12, loanDate: "2026-03-04", weeks: [500, ...Array(24).fill(null)],
    }),
    makeCustomer("VLG1", 2, {
      name: "Surya", phone: "", loanAmount: 9800, creditValue: 12000,
      weeksTotal: 12, loanDate: "2026-03-04", weeks: [1000, ...Array(24).fill(null)],
    }),
  ],
  VLG2: [], VLG3: [], VLG4: [], VLG5: [],
};

// ─── Derived calculations ───────────────────────────────────────────────────
const calcCustomer = (c) => {
  const activeWeeks = c.weeksTotal || 12;
  const paid = c.weeks.slice(0, activeWeeks).reduce((s, v) => s + (v || 0), 0);
  const remaining = (c.creditValue || 0) - paid;
  const weeksPaid = c.weeks.slice(0, activeWeeks).filter((v) => v != null && v > 0).length;
  const weeksRemaining = activeWeeks - weeksPaid;
  const weeklyInstall =
    c.creditValue && activeWeeks ? Math.round(c.creditValue / activeWeeks) : null;
  const status =
    !c.name ? "empty"
    : remaining <= 0 ? "paid"
    : remaining < (c.creditValue || 0) * 0.1 ? "near"
    : "active";
  return { ...c, paid, remaining, weeksPaid, weeksRemaining, weeklyInstall, status };
};

// ─── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    paid:   { label: "✅ PAID",      bg: "#d1fae5", color: "#065f46" },
    near:   { label: "🟡 NEAR DONE", bg: "#fef3c7", color: "#92400e" },
    active: { label: "🔴 ACTIVE",    bg: "#fee2e2", color: "#991b1b" },
    empty:  { label: "—",            bg: "#f3f4f6", color: "#9ca3af" },
  }[status] || { label: "—", bg: "#f3f4f6", color: "#9ca3af" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
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
      style={{ width: "100%", border: "none", outline: "2px solid #6366f1", borderRadius: 4,
        padding: "2px 6px", fontSize: 12, background: "#fff", ...style }} />
  );
  return (
    <div onClick={() => setEditing(true)} title="Click to edit"
      style={{ cursor: "text", minHeight: 22, padding: "2px 4px", borderRadius: 4,
        fontSize: 12, color: value != null && value !== "" ? "#1e293b" : "#cbd5e1",
        transition: "background .15s", ...style }}
      onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      {value != null && value !== "" ? (type === "number" ? (value > 0 ? `₹${Number(value).toLocaleString("en-IN")}` : value) : value) : placeholder || "—"}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function FinanceBook() {
  const [villages, setVillages] = useState(SEED);
  const [activeVillage, setActiveVillage] = useState("VLG1");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("ledger"); // ledger | weekly | search | analytics
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillageName, setNewVillageName] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
        return { ...c, weeks };
      }),
    }));
  }, []);

  const addCustomer = useCallback((villageId) => {
    setVillages(prev => {
      const list = prev[villageId] || [];
      const serial = list.length + 1;
      return { ...prev, [villageId]: [...list, makeCustomer(villageId, serial)] };
    });
    showToast("New customer row added — click fields to edit");
  }, []);

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
  const getVillageMeta = (id) =>
    VILLAGE_META.find(v => v.id === id) || { id, name: id, color: "#64748b", light: "#f8fafc" };
  const activeVillageMeta = getVillageMeta(activeVillage);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#0f0f1a", minHeight: "100vh", color: "#e2e8f0" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#991b1b" : "#065f46",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 600, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,.4)",
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
          <div style={{ background: "#1e1e2e", borderRadius: 16, padding: 32, maxWidth: 400, width: "90%", border: "1px solid #ef4444" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>⚠️ Delete Customer?</div>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 24 }}>
              "<strong style={{ color: "#e2e8f0" }}>{confirmDelete.name || "Unnamed"}</strong>" will be permanently removed
              from <strong style={{ color: "#e2e8f0" }}>{getVillageMeta(confirmDelete.villageId).name}</strong> and all master records.
              This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: "10px 0", border: "1px solid #334155", borderRadius: 8, background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => deleteCustomer(confirmDelete.villageId, confirmDelete.uid)}
                style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: "#13131f", borderBottom: "1px solid #1e2a4a", padding: "0 24px" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "flex", alignItems: "center", gap: 24, height: 60 }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>
            💼 <span style={{ color: "#6366f1" }}>Finance</span>Book
          </div>

          {/* Nav */}
          {[
            { key: "ledger",    label: "📋 Ledger" },
            { key: "weekly",    label: "📅 Weekly View" },
            { key: "schedule",  label: "📆 Schedule" },
            { key: "search",    label: "🔍 Search" },
            { key: "analytics", label: "📈 Analytics" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setView(key)}
              style={{
                background: view === key ? "#6366f1" : "transparent",
                color: view === key ? "#fff" : "#94a3b8",
                border: "none", borderRadius: 8, padding: "6px 16px",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
                transition: "all .2s",
              }}>
              {label}
            </button>
          ))}

          {/* Global search bar */}
          <div style={{ flex: 1, maxWidth: 340, marginLeft: "auto", position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 14 }}>🔍</span>
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setView("search"); }}
              placeholder="Search customer, ID, village, phone…"
              style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: 10,
                border: "1px solid #1e2a4a", background: "#0f0f1a", color: "#e2e8f0",
                fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Balance indicator */}
          <div style={{ background: "#14532d", border: "1px solid #166534", borderRadius: 20, padding: "4px 16px", fontSize: 13, fontWeight: 700, color: "#86efac", whiteSpace: "nowrap" }}>
            💰 {fmt(masterAnalytics.totalCredit - masterAnalytics.totalRemaining)} collected
          </div>
        </div>
      </div>

      {/* Village tabs */}
      {view !== "search" && view !== "analytics" && (
        <div style={{ background: "#13131f", borderBottom: "1px solid #1e2a4a", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {allVillageIds.map(id => {
            const vm = getVillageMeta(id);
            const isActive = id === activeVillage;
            const count = (villages[id] || []).filter(c => c.name).length;
            return (
              <button key={id} onClick={() => setActiveVillage(id)}
                style={{
                  padding: "10px 20px", border: "none", background: isActive ? "#1a1a2e" : "transparent",
                  borderBottom: isActive ? `2px solid ${vm.color}` : "2px solid transparent",
                  color: isActive ? vm.color : "#64748b", fontWeight: isActive ? 700 : 500,
                  fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", transition: "all .2s",
                }}>
                🏘️ {vm.name}
                <span style={{ marginLeft: 6, background: isActive ? vm.color + "33" : "#1e293b", color: isActive ? vm.color : "#64748b", borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{count}</span>
              </button>
            );
          })}
          <button onClick={() => setShowAddVillage(v => !v)}
            style={{ padding: "10px 16px", border: "none", background: "transparent", color: "#475569", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Village
          </button>
          {showAddVillage && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <input value={newVillageName} onChange={e => setNewVillageName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addVillage()}
                placeholder="Village name" autoFocus
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #334155", background: "#0f0f1a", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
              <button onClick={addVillage}
                style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Add
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 24px" }}>

        {/* ── SEARCH VIEW ─────────────────────────────────────────── */}
        {view === "search" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>🔍 Customer Search</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} {searchQuery ? `for "${searchQuery}"` : "(all customers)"}</div>
            </div>

            {/* Big search bar */}
            <div style={{ position: "relative", maxWidth: 600, marginBottom: 24 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus
                placeholder="Search by name, customer ID, village, phone number…"
                style={{ width: "100%", padding: "14px 16px 14px 48px", borderRadius: 14,
                  border: "2px solid #6366f1", background: "#13131f", color: "#e2e8f0",
                  fontSize: 15, outline: "none", boxSizing: "border-box", fontWeight: 500 }} />
            </div>

            {searchResults.length === 0 ? (
              <div style={{ textAlign: "center", color: "#475569", padding: 60, fontSize: 15 }}>
                😶 No customers found. Try a different search.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {searchResults.map(c => {
                  const vm = getVillageMeta(c.villageId);
                  return (
                    <div key={c.uid}
                      style={{ background: "#13131f", border: `1px solid ${vm.color}44`, borderRadius: 14, padding: 20, transition: "transform .15s", cursor: "pointer" }}
                      onClick={() => { setActiveVillage(c.villageId); setView("ledger"); setExpandedCustomer(c.uid); }}
                      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "none"}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#f1f5f9" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: vm.color, fontWeight: 700, marginTop: 2 }}>{c.id}</div>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ background: vm.color + "22", color: vm.color, padding: "2px 8px", borderRadius: 10, fontWeight: 700, fontSize: 10 }}>🏘️ {vm.name}</span>
                        {c.phone && <span>📞 {c.phone}</span>}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[["Loan", c.loanAmount], ["Paid", c.paid], ["Remaining", c.remaining]].map(([l, v]) => (
                          <div key={l} style={{ background: "#0f0f1a", borderRadius: 8, padding: "8px 10px" }}>
                            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: l === "Remaining" && v > 0 ? "#ef4444" : l === "Paid" ? "#10b981" : "#f1f5f9" }}>
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
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 20 }}>📈 Business Analytics</div>

            {/* Master KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Customers", value: masterAnalytics.totalCustomers, color: "#6366f1", icon: "👥" },
                { label: "Capital Deployed", value: masterAnalytics.totalLoan, color: "#f59e0b", icon: "💰", money: true },
                { label: "Credit Value", value: masterAnalytics.totalCredit, color: "#10b981", icon: "📈", money: true },
                { label: "Total Collected", value: masterAnalytics.totalPaid, color: "#0ea5e9", icon: "✅", money: true },
                { label: "Outstanding", value: masterAnalytics.totalRemaining, color: "#ef4444", icon: "⏳", money: true },
                { label: "Expected Profit", value: masterAnalytics.grossProfit, color: "#a3e635", icon: "💹", money: true },
              ].map(({ label, value, color, icon, money }) => (
                <div key={label} style={{ background: "#13131f", border: `1px solid ${color}33`, borderRadius: 14, padding: "20px 20px 16px" }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color }}>{money ? fmt(value) : value}</div>
                </div>
              ))}
            </div>

            {/* Village comparison */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>🏘️ Village Comparison</div>
            <div style={{ background: "#13131f", borderRadius: 14, overflow: "hidden", border: "1px solid #1e2a4a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f0f1a" }}>
                    {["Village", "Customers", "Capital ₹", "Collected ₹", "Outstanding ₹", "Collection %"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {masterAnalytics.byVillage.filter(v => villages[v.id]).map((v, i) => {
                    const pct = v.totalLoan ? Math.round((v.totalPaid / (v.totalLoan)) * 100) : 0;
                    return (
                      <tr key={v.id} style={{ background: i % 2 === 0 ? "#13131f" : "#111119", cursor: "pointer" }}
                        onClick={() => { setActiveVillage(v.id); setView("ledger"); }}>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a" }}>
                          <span style={{ background: v.color + "22", color: v.color, padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>🏘️ {v.name}</span>
                        </td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 13, fontWeight: 700, color: v.color }}>{v.customers.length}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>{fmt(v.totalLoan)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 13, color: "#10b981", fontWeight: 600 }}>{fmt(v.totalPaid)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 13, color: v.totalRemaining > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{fmt(v.totalRemaining)}</td>
                        <td style={{ padding: "14px 16px", borderBottom: "1px solid #1e2a4a" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, background: "#1e293b", borderRadius: 99, height: 6, overflow: "hidden" }}>
                              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: pct >= 100 ? "#10b981" : v.color, borderRadius: 99, transition: "width .5s" }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", minWidth: 36 }}>{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* All Customers Master Table */}
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "32px 0 16px" }}>🗄️ Master Customer Database</div>
            <div style={{ background: "#13131f", borderRadius: 14, overflow: "hidden", border: "1px solid #1e2a4a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#0f0f1a" }}>
                    {["Customer ID", "Village", "Name", "Phone", "Loan Date", "Plan", "Loan ₹", "Credit ₹", "Paid ₹", "Remaining ₹", "Status"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCustomers.filter(c => c.name).map((c, i) => {
                    const vm = getVillageMeta(c.villageId);
                    return (
                      <tr key={c.uid} style={{ background: i % 2 === 0 ? "#13131f" : "#111119" }}>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 11, fontWeight: 700, color: vm.color }}>{c.id}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a" }}>
                          <span style={{ background: vm.color + "22", color: vm.color, padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{vm.name}</span>
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{c.name}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#94a3b8" }}>{c.phone || "—"}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#6366f1" }}>
                          {c.loanDate ? new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>
                          {c.weeksTotal || 12}W
                        </td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>{fmt(c.loanAmount)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#f1f5f9" }}>{fmt(c.creditValue)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#10b981", fontWeight: 600 }}>{fmt(c.paid)}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: c.remaining > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{fmt(Math.max(c.remaining, 0))}</td>
                        <td style={{ padding: "10px 16px", borderBottom: "1px solid #1e2a4a" }}><StatusBadge status={c.status} /></td>
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
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                  <span style={{ color: activeVillageMeta.color }}>🏘️ {activeVillageMeta.name}</span> — Customer Ledger
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                  Click any cell to edit · Changes sync to Master Data instantly
                </div>
              </div>
              <button onClick={() => addCustomer(activeVillage)}
                style={{ padding: "10px 22px", background: activeVillageMeta.color, border: "none", borderRadius: 10,
                  color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                + Add Customer
              </button>
            </div>

            {/* Summary bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { l: "Customers", v: villageSummary.totalCount, color: activeVillageMeta.color },
                { l: "Active", v: villageSummary.activeCount, color: "#f59e0b" },
                { l: "Paid Off", v: villageSummary.paidCount, color: "#10b981" },
                { l: "Capital", v: fmt(villageSummary.totalLoan), color: "#94a3b8" },
                { l: "Collected", v: fmt(villageSummary.totalPaid), color: "#10b981" },
                { l: "Outstanding", v: fmt(villageSummary.totalRemaining), color: "#ef4444" },
              ].map(({ l, v, color }) => (
                <div key={l} style={{ background: "#13131f", border: `1px solid #1e2a4a`, borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color, marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Ledger table */}
            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #1e2a4a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr style={{ background: "#0c0c18" }}>
                    {["ID", "Name", "Phone", "Loan Date", "Loan ₹", "Credit ₹", "Weekly ₹", "Wks", "Paid ₹", "Remaining ₹", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c, i) => {
                    const isExpanded = expandedCustomer === c.uid;
                    const rowBg = i % 2 === 0 ? "#13131f" : "#111119";
                    return [
                      <tr key={c.uid} style={{ background: rowBg }} onClick={() => setExpandedCustomer(isExpanded ? null : c.uid)}>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a", fontSize: 11, fontWeight: 700, color: activeVillageMeta.color, whiteSpace: "nowrap" }}>{c.id}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.name} placeholder="Customer name" onChange={v => updateCustomer(c.villageId, c.uid, "name", v)} />
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.phone} placeholder="Phone" onChange={v => updateCustomer(c.villageId, c.uid, "phone", v)} />
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <input
                            type="date"
                            value={c.loanDate || ""}
                            onChange={e => updateCustomer(c.villageId, c.uid, "loanDate", e.target.value)}
                            style={{
                              background: "transparent", border: "1px solid #1e2a4a", borderRadius: 6,
                              color: c.loanDate ? "#e2e8f0" : "#475569", fontSize: 11, padding: "3px 6px",
                              cursor: "pointer", outline: "none", width: 120,
                            }}
                          />
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.loanAmount} type="number" placeholder="0" onChange={v => updateCustomer(c.villageId, c.uid, "loanAmount", v)} />
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <EditCell value={c.creditValue} type="number" placeholder="0" onChange={v => updateCustomer(c.villageId, c.uid, "creditValue", v)} />
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                          {c.weeklyInstall ? fmt(c.weeklyInstall) : "—"}
                        </td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <select
                            value={c.weeksTotal || 12}
                            onChange={e => updateCustomer(c.villageId, c.uid, "weeksTotal", Number(e.target.value))}
                            onClick={e => e.stopPropagation()}
                            style={{
                              background: "#13131f", border: "1px solid #334155", borderRadius: 6,
                              color: "#e2e8f0", fontSize: 12, padding: "4px 8px", cursor: "pointer",
                              outline: "none", width: 70,
                            }}>
                            {WEEK_OPTIONS.map(w => (
                              <option key={w} value={w}>{w}W</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a", fontSize: 13, fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>{fmt(c.paid)}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a", fontSize: 13, fontWeight: 700, color: c.remaining > 0 ? "#ef4444" : "#10b981", whiteSpace: "nowrap" }}>{fmt(Math.max(c.remaining, 0))}</td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a" }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: "10px 12px", borderBottom: "1px solid #1e2a4a" }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setExpandedCustomer(isExpanded ? null : c.uid)}
                              title="Show weekly payments" style={{ padding: "4px 10px", border: "1px solid #334155", borderRadius: 6, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>
                              {isExpanded ? "▲" : "▼"}
                            </button>
                            <button onClick={() => setConfirmDelete(c)}
                              title="Delete customer" style={{ padding: "4px 10px", border: "1px solid #ef444433", borderRadius: 6, background: "#ef444411", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>,
                      // Expanded weekly row
                      isExpanded && (
                        <tr key={c.uid + "_exp"} style={{ background: "#0a0a14" }}>
                          <td colSpan={12} style={{ padding: "16px 20px", borderBottom: "1px solid #1e2a4a" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Weekly Payments — {c.name || "Customer"}
                              {c.loanDate && <span style={{ marginLeft: 12, color: "#6366f1", fontWeight: 600 }}>📅 Loan date: {new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>}
                            </div>

                            {/* Week payment cells — only show weeksTotal columns */}
                            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(c.weeksTotal, 12)}, 1fr)`, gap: 8, marginBottom: 8 }}>
                              {Array.from({ length: c.weeksTotal }, (_, wi) => {
                                const dueDate = addWeeks(c.loanDate, wi);
                                const isPaid = !!c.weeks[wi];
                                return (
                                  <div key={wi} style={{
                                    background: "#13131f",
                                    border: `1px solid ${isPaid ? activeVillageMeta.color + "66" : "#1e2a4a"}`,
                                    borderRadius: 8, padding: "8px 6px", textAlign: "center",
                                    minWidth: 70,
                                  }}>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: activeVillageMeta.color, textTransform: "uppercase", marginBottom: 2 }}>
                                      W{wi + 1}
                                    </div>
                                    {dueDate && (
                                      <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>
                                        📅 {dueDate}
                                      </div>
                                    )}
                                    <EditCell
                                      value={c.weeks[wi]}
                                      type="number"
                                      placeholder="0"
                                      onChange={v => updateWeek(c.villageId, c.uid, wi, v)}
                                      style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: isPaid ? "#10b981" : "#475569" }}
                                    />
                                    {/* Expected amount hint */}
                                    {c.weeklyInstall && (
                                      <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>
                                        exp: ₹{c.weeklyInstall?.toLocaleString("en-IN")}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* If weeksTotal > 12, show remainder in second row */}
                            {c.weeksTotal > 12 && (
                              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Weeks 13–{c.weeksTotal}:</div>
                            )}
                            {c.weeksTotal > 12 && (
                              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(c.weeksTotal - 12, 13)}, 1fr)`, gap: 8, marginBottom: 8 }}>
                                {Array.from({ length: c.weeksTotal - 12 }, (_, wi) => {
                                  const actualWi = wi + 12;
                                  const dueDate = addWeeks(c.loanDate, actualWi);
                                  const isPaid = !!c.weeks[actualWi];
                                  return (
                                    <div key={actualWi} style={{
                                      background: "#13131f",
                                      border: `1px solid ${isPaid ? activeVillageMeta.color + "66" : "#1e2a4a"}`,
                                      borderRadius: 8, padding: "8px 6px", textAlign: "center", minWidth: 70,
                                    }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: activeVillageMeta.color, textTransform: "uppercase", marginBottom: 2 }}>
                                        W{actualWi + 1}
                                      </div>
                                      {dueDate && <div style={{ fontSize: 9, color: "#64748b", marginBottom: 4 }}>📅 {dueDate}</div>}
                                      <EditCell
                                        value={c.weeks[actualWi]}
                                        type="number"
                                        placeholder="0"
                                        onChange={v => updateWeek(c.villageId, c.uid, actualWi, v)}
                                        style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: isPaid ? "#10b981" : "#475569" }}
                                      />
                                      {c.weeklyInstall && <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>exp: ₹{c.weeklyInstall?.toLocaleString("en-IN")}</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Repayment summary bar */}
                            <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                ✅ Paid: <strong style={{ color: "#10b981" }}>{c.weeksPaid}/{c.weeksTotal} weeks</strong>
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                ⏳ Remaining weeks: <strong style={{ color: "#f59e0b" }}>{c.weeksRemaining}</strong>
                              </div>
                              {c.loanDate && c.weeksTotal && (
                                <div style={{ fontSize: 11, color: "#64748b" }}>
                                  🏁 Final due: <strong style={{ color: "#6366f1" }}>
                                    {addWeeks(c.loanDate, c.weeksTotal - 1)}
                                  </strong>
                                </div>
                              )}
                            </div>

                            {/* Notes */}
                            <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
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
                      <td colSpan={11} style={{ padding: 60, textAlign: "center", color: "#475569", fontSize: 14 }}>
                        No customers in {activeVillageMeta.name} yet.<br />
                        <button onClick={() => addCustomer(activeVillage)}
                          style={{ marginTop: 16, padding: "10px 24px", background: activeVillageMeta.color, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                          + Add First Customer
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

            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid #1e2a4a" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
                <thead>
                  <tr style={{ background: "#0c0c18" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a", position: "sticky", left: 0, background: "#0c0c18", zIndex: 2 }}>Customer</th>
                    <th style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a" }}>Install ₹</th>
                    {/* Determine common loan date from first customer with a date */}
                    {(() => {
                      const refDate = currentCustomers.find(c => c.loanDate)?.loanDate || null;
                      const maxWeeks = Math.max(...currentCustomers.map(c => c.weeksTotal || 12), 12);
                      return Array.from({ length: maxWeeks }, (_, wi) => {
                        const dateLabel = refDate ? addWeeks(refDate, wi) : null;
                        const colTotal = currentCustomers.reduce((s, c) => s + (c.weeks[wi] || 0), 0);
                        return (
                          <th key={wi} style={{
                            padding: "10px 8px", textAlign: "center", fontSize: 9, fontWeight: 700,
                            color: colTotal > 0 ? activeVillageMeta.color : "#64748b",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                            borderBottom: "1px solid #1e2a4a", minWidth: 72,
                          }}>
                            <div>W{wi + 1}</div>
                            {dateLabel && <div style={{ fontSize: 8, color: "#475569", fontWeight: 500, marginTop: 2 }}>📅 {dateLabel}</div>}
                          </th>
                        );
                      });
                    })()}
                    <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a" }}>Total Paid</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1e2a4a" }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCustomers.map((c, i) => (
                    <tr key={c.uid} style={{ background: i % 2 === 0 ? "#13131f" : "#111119" }}>
                      <td style={{ padding: "8px 14px", borderBottom: "1px solid #1e2a4a", position: "sticky", left: 0, background: i % 2 === 0 ? "#13131f" : "#111119", zIndex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                          <EditCell value={c.name} placeholder="Customer name" onChange={v => updateCustomer(c.villageId, c.uid, "name", v)} />
                        </div>
                        <div style={{ fontSize: 10, color: activeVillageMeta.color, fontWeight: 700 }}>{c.id}</div>
                      </td>
                      <td style={{ padding: "8px 14px", borderBottom: "1px solid #1e2a4a", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {c.weeklyInstall ? fmt(c.weeklyInstall) : "—"}
                      </td>
                      {Array.from({ length: Math.max(...currentCustomers.map(c => c.weeksTotal || 12), 12) }, (_, wi) => {
                        const isWithinCustomerPlan = wi < (c.weeksTotal || 12);
                        return (
                          <td key={wi} style={{ padding: "4px 6px", borderBottom: "1px solid #1e2a4a", textAlign: "center",
                            opacity: isWithinCustomerPlan ? 1 : 0.25,
                          }}>
                            {isWithinCustomerPlan ? (
                              <div style={{
                                background: c.weeks[wi] ? activeVillageMeta.color + "22" : "transparent",
                                borderRadius: 6, padding: "2px 0",
                                border: c.weeks[wi] ? `1px solid ${activeVillageMeta.color}44` : "1px solid transparent",
                              }}>
                                <EditCell
                                  value={c.weeks[wi]}
                                  type="number"
                                  placeholder="—"
                                  onChange={v => updateWeek(c.villageId, c.uid, wi, v)}
                                  style={{ textAlign: "center", fontSize: 11, fontWeight: c.weeks[wi] ? 700 : 400, color: c.weeks[wi] ? "#10b981" : "#475569" }}
                                />
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: "#1e2a4a" }}>—</div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: "8px 14px", borderBottom: "1px solid #1e2a4a", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#10b981", whiteSpace: "nowrap" }}>{fmt(c.paid)}</td>
                      <td style={{ padding: "8px 14px", borderBottom: "1px solid #1e2a4a", textAlign: "center", fontSize: 13, fontWeight: 700, color: c.remaining > 0 ? "#ef4444" : "#10b981", whiteSpace: "nowrap" }}>
                        {fmt(Math.max(c.remaining, 0))}
                      </td>
                    </tr>
                  ))}

                  {currentCustomers.length === 0 && (
                    <tr><td colSpan={16} style={{ padding: 60, textAlign: "center", color: "#475569" }}>
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
                    <tr style={{ background: "#0a0a14", borderTop: `2px solid ${activeVillageMeta.color}` }}>
                      <td style={{ padding: "14px 14px", position: "sticky", left: 0, background: "#0a0a14", zIndex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: activeVillageMeta.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          📊 WEEK TOTALS
                        </div>
                        <div style={{ fontSize: 10, color: "#475569" }}>Auto-calculated</div>
                      </td>
                      <td style={{ padding: "14px 14px", fontSize: 11, color: "#64748b" }}>—</td>
                      {weekTotals.map((total, wi) => (
                        <td key={wi} style={{ padding: "14px 10px", textAlign: "center" }}>
                          <div style={{
                            background: total > 0 ? activeVillageMeta.color + "22" : "transparent",
                            border: `1px solid ${total > 0 ? activeVillageMeta.color + "55" : "#1e2a4a"}`,
                            borderRadius: 8, padding: "6px 4px",
                          }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: total > 0 ? activeVillageMeta.color : "#475569" }}>
                              {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: "14px 14px", textAlign: "center", fontSize: 14, fontWeight: 800, color: "#10b981" }}>
                        {fmt(villageSummary.totalPaid)}
                      </td>
                      <td style={{ padding: "14px 14px", textAlign: "center", fontSize: 14, fontWeight: 800, color: villageSummary.totalRemaining > 0 ? "#ef4444" : "#10b981" }}>
                        {fmt(villageSummary.totalRemaining)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Weekly collection progress bars */}
            {currentCustomers.length > 0 && (
              <div style={{ marginTop: 24, background: "#13131f", borderRadius: 14, padding: 24, border: "1px solid #1e2a4a" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>📊 Weekly Collection Progress</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                  {weekTotals.map((total, wi) => {
                    const refDate = currentCustomers.find(c => c.loanDate)?.loanDate || null;
                    const dateLabel = refDate ? addWeeks(refDate, wi) : null;
                    const maxWeekTotal = villageSummary.totalCredit / (currentCustomers[0]?.weeksTotal || 12) || 1;
                    const pct = Math.min((total / maxWeekTotal) * 100, 100);
                    return (
                      <div key={wi} style={{ background: "#0f0f1a", borderRadius: 10, padding: "12px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>W{wi + 1}</span>
                            {dateLabel && <div style={{ fontSize: 9, color: "#475569" }}>📅 {dateLabel}</div>}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: total > 0 ? activeVillageMeta.color : "#475569" }}>
                            {total > 0 ? `₹${total.toLocaleString("en-IN")}` : "—"}
                          </span>
                        </div>
                        <div style={{ background: "#1e293b", borderRadius: 99, height: 5, overflow: "hidden" }}>
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
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                📆 Repayment Schedule — <span style={{ color: activeVillageMeta.color }}>{activeVillageMeta.name}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Per-customer week-by-week repayment plan with due dates · supports 12 / 21 / 25 week plans
              </div>
            </div>

            {currentCustomers.filter(c => c.name).length === 0 && (
              <div style={{ textAlign: "center", color: "#475569", padding: 60 }}>
                No customers yet. Add customers in the Ledger tab.
              </div>
            )}

            {currentCustomers.filter(c => c.name).map(c => {
              const schedule = getRepaymentSchedule(c);
              const paidWeeks = schedule.filter(s => s.status === "paid").length;
              const partialWeeks = schedule.filter(s => s.status === "partial").length;
              const pendingWeeks = schedule.filter(s => s.status === "pending").length;
              const completionPct = Math.round((paidWeeks / (c.weeksTotal || 12)) * 100);

              return (
                <div key={c.uid} style={{
                  background: "#13131f", border: `1px solid ${activeVillageMeta.color}33`,
                  borderRadius: 16, padding: 24, marginBottom: 20,
                }}>
                  {/* Customer header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: activeVillageMeta.color, fontWeight: 700 }}>{c.id}</div>
                      {c.loanDate && (
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                          💰 Debited: <strong style={{ color: "#e2e8f0" }}>
                            {new Date(c.loanDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </strong>
                          &nbsp;·&nbsp;
                          🏁 Final due: <strong style={{ color: "#6366f1" }}>
                            {addWeeks(c.loanDate, (c.weeksTotal || 12) - 1) || "—"}
                          </strong>
                        </div>
                      )}
                      {!c.loanDate && (
                        <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                          ⚠️ Set loan date in Ledger to see due dates
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ background: "#0f0f1a", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>PLAN</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: activeVillageMeta.color }}>{c.weeksTotal}W</div>
                      </div>
                      <div style={{ background: "#0f0f1a", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>WEEKLY</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b" }}>₹{(c.weeklyInstall || 0).toLocaleString("en-IN")}</div>
                      </div>
                      <div style={{ background: "#0f0f1a", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>CREDIT</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{(c.creditValue || 0).toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        ✅ {paidWeeks} paid &nbsp;·&nbsp; 🟡 {partialWeeks} partial &nbsp;·&nbsp; ⏳ {pendingWeeks} pending
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: activeVillageMeta.color }}>{completionPct}% complete</span>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${completionPct}%`, height: "100%", background: activeVillageMeta.color, borderRadius: 99, transition: "width .4s" }} />
                    </div>
                  </div>

                  {/* Schedule grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: 8 }}>
                    {schedule.map((s, i) => {
                      const statusColor = s.status === "paid" ? "#10b981" : s.status === "partial" ? "#f59e0b" : "#475569";
                      const statusBg = s.status === "paid" ? "#10b98122" : s.status === "partial" ? "#f59e0b22" : "#0f0f1a";
                      const statusBorder = s.status === "paid" ? "#10b98144" : s.status === "partial" ? "#f59e0b44" : "#1e2a4a";
                      return (
                        <div key={i} style={{
                          background: statusBg, border: `1px solid ${statusBorder}`,
                          borderRadius: 10, padding: "10px 8px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: activeVillageMeta.color, marginBottom: 2 }}>
                            W{s.weekNum}
                          </div>
                          {s.dueDate ? (
                            <div style={{ fontSize: 9, color: "#64748b", marginBottom: 6 }}>📅 {s.dueDate}</div>
                          ) : (
                            <div style={{ fontSize: 9, color: "#334155", marginBottom: 6 }}>—</div>
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>
                            {s.paidAmount > 0 ? `₹${s.paidAmount.toLocaleString("en-IN")}` : "—"}
                          </div>
                          <div style={{ fontSize: 8, color: "#475569", marginTop: 2 }}>
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
