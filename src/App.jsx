import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const DEPARTMENTS = ["CUCINA", "SALA", "PIZZERIA"];
const CODE_OPTIONS = ["", "F", "P", "M", "R", "AS"];
const CODE_LABELS = {
  F: "Ferie",
  P: "Permesso",
  M: "Malattia",
  R: "Riposo",
  AS: "Assenza",
};
const LOGO_SRC = "/logo-amici-miei.png";

const APP_CSS = `
:root {
  --bg: #f5efe8;
  --bg-2: #fbf8f4;
  --panel: #ffffff;
  --panel-soft: #faf6f0;
  --line: #ded3c6;
  --line-2: #eee7dc;
  --text: #332d27;
  --muted: #7d746b;
  --accent: #c8871f;
  --accent-2: #a96d10;
  --danger: #b23a2f;
  --success: #18794e;
  --monday: #fbf4e5;
  --monday-head: #f4e4b7;
  --shadow: 0 16px 34px rgba(76, 56, 31, 0.08);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: var(--text);
  background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg) 100%);
}
.page {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px;
}
.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: var(--shadow);
}
.hero {
  padding: 18px;
  margin-bottom: 14px;
}
.heroTop {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.brandWrap {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}
.logo {
  width: 62px;
  height: 62px;
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid var(--line-2);
  background: white;
  padding: 7px;
  flex: 0 0 auto;
}
.title {
  margin: 0;
  font-size: 34px;
  line-height: 1.04;
  letter-spacing: -0.02em;
}
.subtitle {
  margin-top: 8px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 860px;
}
.stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(150px, 1fr));
  min-width: min(100%, 360px);
}
.stat {
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--line-2);
  background: var(--panel-soft);
}
.statLabel {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.statValue {
  margin-top: 7px;
  font-size: 14px;
  font-weight: 700;
}
.mobileHint {
  display: none;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid #ecd7a8;
  background: #fff4d6;
  color: #7a5f1a;
  font-size: 13px;
  line-height: 1.45;
}
.toolbar,
.legend,
.monthBar {
  padding: 16px;
  margin-bottom: 14px;
}
.toolbarGrid {
  display: grid;
  gap: 12px;
  grid-template-columns: 2fr 1fr 160px 170px;
  align-items: end;
}
.monthGrid {
  display: grid;
  gap: 12px;
  grid-template-columns: 180px 150px 200px 170px 170px 170px;
  align-items: end;
}
.control label {
  display: block;
  margin-bottom: 7px;
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.input,
.select,
.textarea,
.button {
  width: 100%;
  border-radius: 16px;
  font: inherit;
}
.input,
.select,
.textarea {
  border: 1px solid var(--line);
  background: white;
  color: var(--text);
  padding: 11px 13px;
}
.textarea {
  min-height: 88px;
  resize: vertical;
}
.button {
  border: none;
  padding: 11px 14px;
  cursor: pointer;
  font-weight: 700;
  background: var(--accent);
  color: white;
}
.button:hover { background: var(--accent-2); }
.button.secondary {
  background: #efe6db;
  color: var(--text);
  border: 1px solid var(--line);
}
.button.secondary:hover { background: #e6dbcf; }
.button.green { background: var(--success); }
.button.green:hover { background: #11633f; }
.button.danger { background: var(--danger); }
.button.danger:hover { background: #942e26; }
.button.ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--line);
}
.legendTop {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}
.legendRow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: white;
  font-size: 13px;
}
.monthCurrent {
  padding: 12px 16px;
  border-radius: 18px;
  border: 1px solid #ead7aa;
  background: #fff4d6;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.monthCurrentLabel {
  color: #88691f;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.monthCurrentValue {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
  color: #65490b;
}
.notice {
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: #fffaf3;
  color: var(--muted);
  line-height: 1.55;
  margin-bottom: 14px;
}
.noticeError {
  border-color: #f0c3bb;
  background: #fff1ef;
  color: #a23e35;
}
.adminBox {
  margin-top: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: end;
}
.section {
  overflow: hidden;
  margin-bottom: 16px;
}
.sectionHead {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: #fcfaf7;
  border-bottom: 1px solid var(--line-2);
}
.sectionTitle {
  margin: 0;
  font-size: 21px;
}
.sectionMeta {
  color: var(--muted);
  font-size: 13px;
}
.tableWrap { overflow: auto; }
.table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
  background: white;
}
.table th,
.table td {
  border-bottom: 1px solid #eadfd1;
  border-right: 1px solid #f0e8de;
  text-align: center;
  padding: 4px;
}
.table thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background: #faf5ee;
  font-size: 11px;
}
.table tbody tr:nth-child(odd) { background: #fffdfb; }
.table tbody tr:hover { background: #fff8ee; }
.nameHead,
.nameCell {
  position: sticky;
  left: 0;
  z-index: 6;
  min-width: 220px;
  text-align: left;
  padding: 8px 10px !important;
}
.nameHead { background: #f5efe7 !important; }
.nameCell {
  z-index: 4;
  font-weight: 700;
  background: inherit;
}
.dayHead {
  min-width: 46px;
}
.dayNum {
  display: block;
  font-size: 12px;
  color: var(--text);
  font-weight: 700;
}
.dayName {
  display: block;
  font-size: 10px;
  color: var(--muted);
  margin-top: 2px;
}
.isMonday { background: var(--monday) !important; }
.isMondayHead { background: var(--monday-head) !important; }
.cellWrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cellChip,
.cellButton {
  min-width: 38px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  position: relative;
}
.cellButton {
  cursor: pointer;
  background: transparent;
}
.compact .nameHead,
.compact .nameCell {
  min-width: 168px;
  font-size: 12px;
  padding: 6px 8px !important;
}
.compact .dayHead { min-width: 36px; }
.compact .cellChip,
.compact .cellButton {
  min-width: 31px;
  height: 24px;
  font-size: 11px;
  border-radius: 8px;
}
.compact .dayName { display: none; }
.codeEmpty { background: #f8f5f1; color: #a39a90; border-color: #ebe2d8; }
.codeF { background: rgba(245,158,11,.16); color: #ad6800; border-color: rgba(245,158,11,.28); }
.codeP { background: rgba(56,189,248,.16); color: #0c6f8e; border-color: rgba(56,189,248,.28); }
.codeM { background: rgba(239,68,68,.14); color: #af2c2c; border-color: rgba(239,68,68,.25); }
.codeR { background: rgba(34,197,94,.14); color: #1f7a43; border-color: rgba(34,197,94,.25); }
.codeAS { background: rgba(168,85,247,.15); color: #7a3cc2; border-color: rgba(168,85,247,.25); }
.noteDot {
  position: absolute;
  top: 2px;
  right: 3px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #7c3aed;
  box-shadow: 0 0 0 1px rgba(255,255,255,.85);
}
.footerNote {
  color: var(--muted);
  margin-top: 12px;
  line-height: 1.55;
  font-size: 13px;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(43, 33, 21, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 70;
}
.modal {
  width: min(100%, 520px);
  background: white;
  border: 1px solid var(--line);
  border-radius: 22px;
  box-shadow: 0 26px 40px rgba(58, 39, 18, 0.18);
  padding: 18px;
}
.modalTitle {
  margin: 0 0 8px;
  font-size: 22px;
}
.modalMeta {
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 14px;
  font-size: 14px;
}
.modalActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 14px;
}
.fieldNote {
  font-size: 12px;
  color: var(--muted);
  margin-top: 6px;
  line-height: 1.4;
}
@media (max-width: 1250px) {
  .toolbarGrid { grid-template-columns: 1fr 1fr; }
  .monthGrid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 860px) {
  .page { padding: 12px; }
  .title { font-size: 28px; }
  .stats { grid-template-columns: 1fr; width: 100%; }
  .toolbarGrid,
  .monthGrid { grid-template-columns: 1fr; }
  .mobileHint { display: block; }
}
`;

function fmtDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthDays(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1));
}

function entryKey(employeeId, dateKey) {
  return `${employeeId}|${dateKey}`;
}

function normalizeCode(code) {
  const value = String(code || "").trim().toUpperCase();
  if (!value) return "";
  if (value === "PER") return "P";
  return value;
}

function buildClient() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

function codeClass(code) {
  const c = normalizeCode(code);
  if (!c) return "codeEmpty";
  if (c === "AS") return "codeAS";
  return `code${c}`;
}

function MiniStat({ label, value }) {
  return (
    <div className="stat">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

export default function App() {
  const today = new Date();
  const client = useMemo(() => buildClient(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState({});
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState("In attesa");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("TUTTI");
  const [showAdminBox, setShowAdminBox] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [compactView, setCompactView] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [editorState, setEditorState] = useState(null);

  const monthDays = useMemo(() => getMonthDays(year, monthIndex), [year, monthIndex]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const depOk = departmentFilter === "TUTTI" || employee.department === departmentFilter;
      const textOk = !q || employee.name.toLowerCase().includes(q);
      return employee.active !== false && depOk && textOk;
    });
  }, [employees, search, departmentFilter]);

  const grouped = useMemo(() => {
    const result = { CUCINA: [], SALA: [], PIZZERIA: [] };
    filteredEmployees.forEach((employee) => {
      const dep = DEPARTMENTS.includes(employee.department) ? employee.department : "SALA";
      result[dep].push(employee);
    });
    DEPARTMENTS.forEach((dep) => {
      result[dep].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name));
    });
    return result;
  }, [filteredEmployees]);

  useEffect(() => {
    const tests = [
      fmtDateKey(new Date(2026, 5, 3)) === "2026-06-03",
      getMonthDays(2026, 1).length === 28,
      entryKey("a", "2026-06-03") === "a|2026-06-03",
      normalizeCode("PER") === "P",
    ];
    if (tests.some((x) => !x)) {
      console.error("Self tests falliti", tests);
    }
  }, []);

  useEffect(() => {
    if (!client) {
      setError("Variabili ambiente mancanti. Controlla VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in Netlify.");
      setStatus("Configurazione mancante");
      return;
    }

    let mounted = true;

    async function init() {
      try {
        setLoading(true);
        const { data, error: sessionError } = await client.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mounted) return;
        const nextSession = data?.session ?? null;
        setSession(nextSession);
        await refreshData(nextSession);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Errore di inizializzazione");
        setStatus("Errore");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    const { data: authListener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      await refreshData(nextSession);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [client, year, monthIndex]);

  async function refreshData(forcedSession = session) {
    if (!client) return;

    setLoading(true);
    setError("");
    try {
      const start = fmtDateKey(monthDays[0]);
      const end = fmtDateKey(monthDays[monthDays.length - 1]);

      const [{ data: employeeRows, error: employeeError }, { data: entryRows, error: entryError }] = await Promise.all([
        client.from("employees").select("id,name,department,sort_order,active").order("department").order("sort_order").order("name"),
        client.from("vacation_entries").select("employee_id,entry_date,code,note").gte("entry_date", start).lte("entry_date", end),
      ]);

      if (employeeError) throw employeeError;
      if (entryError) throw entryError;

      const nextEntries = {};
      (entryRows || []).forEach((row) => {
        nextEntries[entryKey(row.employee_id, row.entry_date)] = {
          code: normalizeCode(row.code),
          note: String(row.note || ""),
        };
      });

      setEmployees(employeeRows || []);
      setEntries(nextEntries);

      let admin = false;
      if (forcedSession?.user?.id) {
        const { data: profileRow, error: profileError } = await client
          .from("admin_profiles")
          .select("user_id,role")
          .eq("user_id", forcedSession.user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        admin = Boolean(profileRow?.user_id);
      }

      setIsAdmin(admin);
      setStatus(admin ? "Connesso come amministratore" : "Visualizzazione dipendenti");
    } catch (err) {
      setError(err.message || "Errore nel caricamento dati");
      setStatus("Errore");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!client) return;

    setLoading(true);
    setError("");
    try {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      setPassword("");
      setShowAdminBox(false);
    } catch (err) {
      setError(err.message || "Login non riuscito");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
      setIsAdmin(false);
      setStatus("Visualizzazione dipendenti");
    } catch (err) {
      setError(err.message || "Logout non riuscito");
    } finally {
      setLoading(false);
    }
  }

  function getEntry(employeeId, dateKey) {
    return entries[entryKey(employeeId, dateKey)] || { code: "", note: "" };
  }

  function openEditor(employee, date) {
    const dateKey = fmtDateKey(date);
    const current = getEntry(employee.id, dateKey);
    setEditorState({
      employeeId: employee.id,
      employeeName: employee.name,
      dateKey,
      dateLabel: `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[monthIndex]} ${year}`,
      code: current.code || "",
      note: current.note || "",
    });
  }

  function clearEditor() {
    if (!editorState) return;
    setEditorState({ ...editorState, code: "", note: "" });
  }

  async function saveEditor() {
    if (!client || !isAdmin || !editorState) return;

    const code = normalizeCode(editorState.code) || null;
    const note = String(editorState.note || "").trim() || null;

    setLoading(true);
    setError("");
    try {
      if (!code && !note) {
        const { error: deleteError } = await client
          .from("vacation_entries")
          .delete()
          .eq("employee_id", editorState.employeeId)
          .eq("entry_date", editorState.dateKey);
        if (deleteError) throw deleteError;
      } else {
        const { error: upsertError } = await client.from("vacation_entries").upsert(
          {
            employee_id: editorState.employeeId,
            entry_date: editorState.dateKey,
            code,
            note,
          },
          { onConflict: "employee_id,entry_date" }
        );
        if (upsertError) throw upsertError;
      }

      setEditorState(null);
      await refreshData();
      setStatus("Modifica salvata");
    } catch (err) {
      setError(err.message || "Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex((m) => m - 1);
    }
  }

  function nextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex((m) => m + 1);
    }
  }

  return (
    <div className={`page ${compactView ? "compact" : ""}`}>
      <style>{APP_CSS}</style>

      <div className="mobileHint">
        Per leggere meglio il calendario da telefono, ti consiglio la visualizzazione <strong>orizzontale</strong>.
      </div>

      <section className="card hero">
        <div className="heroTop">
          <div className="brandWrap">
            {showLogo ? (
              <img
                src={LOGO_SRC}
                alt="Logo Amici Miei"
                className="logo"
                onError={() => setShowLogo(false)}
              />
            ) : null}

            <div>
              <h1 className="title">Piano ferie · Amici Miei</h1>
              <div className="subtitle">
                Consultazione pubblica in sola lettura per i dipendenti, con gestione riservata all&apos;amministratore.
                I lunedì sono evidenziati come giorno di chiusura abituale, ma restano modificabili in caso di apertura occasionale.
              </div>
            </div>
          </div>

          <div className="stats">
            <MiniStat label="Modalità" value={isAdmin ? "Admin" : "Dipendente"} />
            <MiniStat label="Stato" value={loading ? "Caricamento..." : status} />
            <MiniStat label="Anno" value={String(year)} />
            <MiniStat label="Vista" value={compactView ? "Compatta" : "Dettagliata"} />
          </div>
        </div>
      </section>

      <section className="card toolbar">
        <div className="toolbarGrid">
          <div className="control">
            <label>Cerca dipendente</label>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome o cognome"
            />
          </div>

          <div className="control">
            <label>Reparto</label>
            <select className="select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="TUTTI">Tutti</option>
              {DEPARTMENTS.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={() => refreshData()} type="button">Aggiorna</button>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            {!isAdmin ? (
              <button className="button" onClick={() => setShowAdminBox((v) => !v)} type="button">Area amministratore</button>
            ) : (
              <button className="button danger" onClick={handleLogout} type="button">Esci admin</button>
            )}
          </div>
        </div>

        {showAdminBox && !isAdmin ? (
          <form onSubmit={handleLogin} className="adminBox">
            <div className="control">
              <label>Email admin</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            </div>
            <div className="control">
              <label>Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            </div>
            <div className="control">
              <label>&nbsp;</label>
              <button className="button green" type="submit">Entra</button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="card legend">
        <div className="legendTop">
          <div className="legendRow">
            {Object.entries(CODE_LABELS).map(([code, label]) => (
              <span key={code} className={`chip ${codeClass(code)}`}>
                <strong>{code}</strong> {label}
              </span>
            ))}
            <span className="chip"><strong>●</strong> Nota presente</span>
            <span className="chip isMonday"><strong>Lun</strong> Chiusura abituale</span>
          </div>

          <button className="button ghost" style={{ width: "auto" }} onClick={() => setCompactView((v) => !v)} type="button">
            {compactView ? "Vista dettagliata" : "Vista compatta"}
          </button>
        </div>
      </section>

      <section className="card monthBar">
        <div className="monthGrid">
          <div className="control">
            <label>Mese</label>
            <select className="select" value={monthIndex} onChange={(e) => setMonthIndex(Number(e.target.value))}>
              {MONTHS.map((month, idx) => (
                <option key={month} value={idx}>{month}</option>
              ))}
            </select>
          </div>

          <div className="control">
            <label>Anno</label>
            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || today.getFullYear())} />
          </div>

          <div className="monthCurrent">
            <div className="monthCurrentLabel">Mese corrente</div>
            <div className="monthCurrentValue">{MONTHS[monthIndex]}</div>
          </div>

          <div className="control">
            <label>Vista</label>
            <div className="monthCurrent">
              <div className="monthCurrentLabel">Visualizzazione</div>
              <div className="monthCurrentValue" style={{ fontSize: 18 }}>{compactView ? "Compatta" : "Dettagliata"}</div>
            </div>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={prevMonth} type="button">← Mese prec.</button>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button" onClick={nextMonth} type="button">Mese succ. →</button>
          </div>
        </div>
      </section>

      {error ? <div className="notice noticeError">{error}</div> : null}
      {!error && !loading && employees.length === 0 ? (
        <div className="notice">Non risultano dipendenti caricati nella tabella <strong>employees</strong>.</div>
      ) : null}

      {DEPARTMENTS.map((department) => {
        const rows = grouped[department] || [];
        if (!rows.length) return null;

        return (
          <section key={department} className="card section">
            <div className="sectionHead">
              <div>
                <h2 className="sectionTitle">{department}</h2>
                <div className="sectionMeta">{rows.length} dipendenti</div>
              </div>
              {isAdmin ? <div className="sectionMeta">Modifica attiva</div> : null}
            </div>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="nameHead">Dipendente</th>
                    {monthDays.map((date) => {
                      const isMonday = date.getDay() === 1;
                      return (
                        <th key={fmtDateKey(date)} className={`dayHead ${isMonday ? "isMondayHead" : ""}`}>
                          <span className="dayNum">{date.getDate()}</span>
                          <span className="dayName">{WEEKDAYS[date.getDay()]}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((employee) => (
                    <tr key={employee.id}>
                      <td className="nameCell">{employee.name}</td>
                      {monthDays.map((date) => {
                        const dateKey = fmtDateKey(date);
                        const entry = getEntry(employee.id, dateKey);
                        const isMonday = date.getDay() === 1;
                        const title = entry.note ? `Nota: ${entry.note}` : "";
                        return (
                          <td key={dateKey} className={isMonday ? "isMonday" : ""}>
                            <div className="cellWrap" title={title}>
                              {isAdmin ? (
                                <button
                                  type="button"
                                  className={`cellButton ${codeClass(entry.code)}`}
                                  onClick={() => openEditor(employee, date)}
                                >
                                  {entry.code || "·"}
                                  {entry.note ? <span className="noteDot" /> : null}
                                </button>
                              ) : (
                                <span className={`cellChip ${codeClass(entry.code)}`}>
                                  {entry.code || "·"}
                                  {entry.note ? <span className="noteDot" /> : null}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <div className="footerNote">
        Il link può essere condiviso ai dipendenti senza login. Solo il tuo utente presente in <strong>admin_profiles</strong> può modificare i codici e inserire note.
      </div>

      {editorState ? (
        <div className="overlay" onClick={() => setEditorState(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Modifica giornata</h3>
            <div className="modalMeta">
              <strong>{editorState.employeeName}</strong><br />
              {editorState.dateLabel}
            </div>

            <div className="control">
              <label>Causale</label>
              <select
                className="select"
                value={editorState.code}
                onChange={(e) => setEditorState({ ...editorState, code: e.target.value })}
              >
                {CODE_OPTIONS.map((code) => (
                  <option key={code || "EMPTY"} value={code}>{code || "Vuoto"}</option>
                ))}
              </select>
            </div>

            <div className="control" style={{ marginTop: 12 }}>
              <label>Note</label>
              <textarea
                className="textarea"
                value={editorState.note}
                onChange={(e) => setEditorState({ ...editorState, note: e.target.value })}
                placeholder="Aggiungi una nota per questa giornata"
              />
              <div className="fieldNote">
                Le note sono visibili come indicatore nella cella. Il lunedì resta evidenziato ma può essere gestito normalmente in caso di apertura.
              </div>
            </div>

            <div className="modalActions">
              <button className="button secondary" style={{ width: "auto" }} onClick={() => setEditorState(null)} type="button">Annulla</button>
              <button className="button ghost" style={{ width: "auto" }} onClick={clearEditor} type="button">Svuota</button>
              <button className="button green" style={{ width: "auto" }} onClick={saveEditor} type="button">Salva</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
