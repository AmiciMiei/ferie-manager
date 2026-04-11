import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const DEPARTMENTS = ['CUCINA', 'SALA', 'PIZZERIA']
const CODE_OPTIONS = ['', 'F', 'P', 'M', 'R', 'AS']
const CODE_LABELS = {
  '': 'Vuoto',
  F: 'Ferie',
  P: 'Permesso',
  M: 'Malattia',
  R: 'Riposo',
  AS: 'Assenza',
}
const EMPTY_ENTRY = { code: '', note: '' }
const LOGO_SRC = '/logo-amici-miei.png'

const APP_CSS = `
  :root {
    --bg: #f4efe7;
    --bg-2: #faf7f2;
    --panel: #ffffff;
    --panel-soft: #f8f4ee;
    --line: #ddd2c4;
    --line-2: #e9e1d6;
    --text: #2f2a25;
    --muted: #7d7367;
    --accent: #d58b1d;
    --accent-2: #b66f08;
    --danger: #c2410c;
    --green: #15803d;
    --shadow: 0 14px 30px rgba(79, 55, 27, .08);
    --monday: #f8f0df;
    --monday-head: #f1e1bf;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: var(--text);
    background: linear-gradient(180deg, #fbf8f3 0%, #f1ebe2 100%);
  }

  .ferie-shell {
    max-width: 1600px;
    margin: 0 auto;
    padding: 18px;
  }

  .ferie-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 22px;
    box-shadow: var(--shadow);
  }

  .hero-card {
    padding: 20px;
    margin-bottom: 14px;
  }

  .hero-top {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .brand-box {
    display: flex;
    gap: 14px;
    align-items: center;
    min-width: 0;
  }

  .brand-logo {
    width: 64px;
    height: 64px;
    object-fit: contain;
    border-radius: 16px;
    border: 1px solid var(--line-2);
    background: #fff;
    padding: 8px;
    flex: 0 0 auto;
  }

  .brand-title {
    margin: 0;
    font-size: 34px;
    line-height: 1.03;
    letter-spacing: -.02em;
  }

  .hero-side {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(160px, 1fr));
    min-width: min(100%, 380px);
  }

  .mini-stat {
    padding: 12px 14px;
    border-radius: 18px;
    border: 1px solid var(--line-2);
    background: var(--panel-soft);
  }

  .mini-stat-label {
    font-size: 11px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .mini-stat-value {
    margin-top: 7px;
    font-size: 14px;
    font-weight: 700;
  }

  .mobile-rotate-hint {
    display: none;
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid #edd8aa;
    background: #fff5d9;
    color: #7b5d16;
    font-size: 13px;
    line-height: 1.45;
  }

  .toolbar-card {
    padding: 16px;
    margin-bottom: 14px;
  }

  .toolbar-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: 2.2fr 1fr 150px 200px;
    align-items: end;
  }

  .control label {
    display: block;
    margin-bottom: 7px;
    font-size: 12px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .input, .select, .button, .textarea {
    width: 100%;
    border-radius: 16px;
    border: 1px solid var(--line);
    font: inherit;
  }

  .input, .select, .textarea {
    padding: 11px 13px;
    background: #fff;
    color: var(--text);
  }

  .textarea {
    min-height: 90px;
    resize: vertical;
  }

  .button {
    padding: 11px 14px;
    cursor: pointer;
    font-weight: 700;
    background: var(--accent);
    color: #fff;
    border: none;
  }

  .button:hover { background: var(--accent-2); }
  .button.secondary {
    background: #efe7dc;
    color: var(--text);
    border: 1px solid var(--line);
  }
  .button.secondary:hover { background: #e7ddd0; }
  .button.danger {
    background: #b45309;
    color: #fff;
  }
  .button.danger:hover { background: #9a3412; }
  .button.green {
    background: var(--green);
    color: #fff;
  }
  .button.green:hover { background: #166534; }
  .button.ghost {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--line);
  }
  .button.highlight {
    background: #b66f08;
    color: #fff;
    border: none;
  }
  .button.highlight:hover {
    background: #8f5606;
  }

  .button:disabled {
    opacity: .65;
    cursor: not-allowed;
  }

  .legend-card {
    padding: 16px;
    margin-bottom: 14px;
  }

  .legend-top {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
  }

  .legend-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .legend-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 11px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #fff;
    font-size: 13px;
  }

  .month-banner {
    padding: 16px;
    margin-bottom: 14px;
    background: linear-gradient(180deg, #fffdfa 0%, #f8f2e8 100%);
  }

  .month-banner-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: 180px 200px 140px minmax(220px, 1fr) 170px 170px;
    align-items: end;
  }

  .month-current {
    padding: 12px 16px;
    border-radius: 18px;
    border: 1px solid #ead5aa;
    background: #fff4d8;
    min-height: 62px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .month-current-label {
    color: #8a6b22;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .month-current-value {
    margin-top: 6px;
    font-size: 22px;
    font-weight: 800;
    color: #62460b;
  }

  .compact-toggle {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
  }

  .view-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .notice {
    padding: 14px 16px;
    border-radius: 18px;
    border: 1px solid var(--line);
    background: #fffaf2;
    color: var(--muted);
    margin-bottom: 14px;
    line-height: 1.55;
  }

  .notice.error {
    border-color: #f0c0b6;
    background: #fff1ee;
    color: #a14432;
  }

  .admin-box {
    margin-top: 14px;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    align-items: end;
  }

  .section-card {
    overflow: hidden;
    margin-bottom: 16px;
  }

  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    background: #fcfaf7;
    border-bottom: 1px solid var(--line-2);
  }

  .section-head h2 {
    margin: 0;
    font-size: 21px;
  }

  .section-meta {
    color: var(--muted);
    font-size: 13px;
  }

  .table-wrap {
    overflow: auto;
  }

  .table {
    width: 100%;
    min-width: 1060px;
    border-collapse: collapse;
    background: #fff;
  }

  .table th,
  .table td {
    border-bottom: 1px solid #eadfd1;
    border-right: 1px solid #f0e8de;
    text-align: center;
    padding: 4px 4px;
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

  .table .name-cell {
    position: sticky;
    left: 0;
    z-index: 4;
    min-width: 220px;
    background: inherit;
    text-align: left;
    font-weight: 700;
    padding: 8px 10px;
  }

  .table .name-cell-head {
    position: sticky;
    left: 0;
    z-index: 6;
    min-width: 220px;
    background: #f5efe7;
    text-align: left;
    padding: 8px 10px;
  }

  .day-head {
    min-width: 46px;
  }

  .day-num {
    display: block;
    font-size: 12px;
    color: var(--text);
    font-weight: 700;
  }

  .day-name {
    display: block;
    font-size: 10px;
    color: var(--muted);
    margin-top: 2px;
  }

  .is-monday {
    background: var(--monday) !important;
  }

  .is-monday.day-head-cell {
    background: var(--monday-head) !important;
  }

  .cell-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .cell-chip,
  .cell-button {
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
    gap: 2px;
  }

  .cell-button {
    cursor: pointer;
    background: transparent;
  }

  .compact .table .name-cell,
  .compact .table .name-cell-head {
    min-width: 168px;
    font-size: 12px;
    padding: 6px 8px;
  }

  .compact .day-head {
    min-width: 36px;
  }

  .compact .cell-chip,
  .compact .cell-button {
    min-width: 31px;
    height: 24px;
    font-size: 11px;
    border-radius: 8px;
  }

  .compact .day-name {
    display: none;
  }

  .code-empty { background: #f8f5f1; color: #a39a90; border-color: #ebe2d8; }
  .code-F { background: rgba(245,158,11,.16); color: #ad6800; border-color: rgba(245,158,11,.28); }
  .code-P { background: rgba(56,189,248,.16); color: #0c6f8e; border-color: rgba(56,189,248,.28); }
  .code-M { background: rgba(239,68,68,.14); color: #af2c2c; border-color: rgba(239,68,68,.25); }
  .code-R { background: rgba(34,197,94,.14); color: #1f7a43; border-color: rgba(34,197,94,.25); }
  .code-AS { background: rgba(168,85,247,.15); color: #7a3cc2; border-color: rgba(168,85,247,.25); }

  .note-dot {
    position: absolute;
    top: 2px;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #7c3aed;
    box-shadow: 0 0 0 1px rgba(255,255,255,.9);
  }

  .note-mobile-badge {
    display: none;
    font-size: 9px;
    line-height: 1;
    margin-left: 2px;
    color: #7c3aed;
  }

  .editor-overlay {
    position: fixed;
    inset: 0;
    background: rgba(43, 33, 21, .24);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 70;
  }

  .editor-modal {
    width: min(100%, 560px);
    max-height: min(92vh, 860px);
    overflow: auto;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 22px;
    box-shadow: 0 26px 40px rgba(58, 39, 18, .18);
    padding: 18px;
  }

  .editor-title {
    margin: 0 0 8px;
    font-size: 22px;
  }

  .editor-meta {
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: 14px;
    font-size: 14px;
  }

  .editor-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 14px;
  }

  .field-note {
    font-size: 12px;
    color: var(--muted);
    margin-top: 6px;
    line-height: 1.4;
  }

  .quick-code-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
    margin-top: 10px;
  }

  .quick-code-btn {
    border-radius: 12px;
    border: 1px solid var(--line);
    padding: 9px 8px;
    background: #fff;
    font-weight: 800;
    cursor: pointer;
  }

  .quick-code-btn.active {
    outline: 2px solid rgba(213,139,29,.35);
  }

  .range-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  @media (max-width: 1250px) {
    .toolbar-grid { grid-template-columns: 1fr 1fr; }
    .month-banner-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 860px) {
    .ferie-shell { padding: 12px; }
    .brand-title { font-size: 28px; }
    .hero-side { grid-template-columns: 1fr; width: 100%; }
    .toolbar-grid,
    .month-banner-grid,
    .range-row { grid-template-columns: 1fr; }
    .mobile-rotate-hint { display: block; }
    .note-mobile-badge { display: inline; }
    .note-dot { width: 10px; height: 10px; top: 1px; right: 1px; }
  }
`

function fmtDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthDays(year, monthIndex) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1))
}

function makeEntryKey(employeeId, dateKey) {
  return `${employeeId}|${dateKey}`
}

function normalizeCode(code) {
  const value = String(code || '').trim().toUpperCase()
  if (!value) return ''
  if (value === 'PER') return 'P'
  return value
}

function getCodeClass(code) {
  const normalized = normalizeCode(code)
  if (!normalized) return 'code-empty'
  return `code-${normalized}`
}

function buildClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    return createClient(url, key)
  } catch {
    return null
  }
}

function runSelfTests() {
  const tests = [
    ['fmtDateKey', fmtDateKey(new Date(2026, 5, 3)) === '2026-06-03'],
    ['getMonthDays febbraio 2026', getMonthDays(2026, 1).length === 28],
    ['makeEntryKey', makeEntryKey('a', '2026-06-03') === 'a|2026-06-03'],
    ['normalizeCode PER->P', normalizeCode('PER') === 'P'],
    ['normalizeCode vuoto', normalizeCode('') === ''],
  ]
  const failed = tests.filter(([, ok]) => !ok)
  if (failed.length) console.error('Self-tests falliti:', failed)
  else console.info('Self-tests ok:', tests)
}

function patchEntriesMap(current, keys, nextValue) {
  const copy = { ...current }
  for (const key of keys) {
    if (!nextValue.code && !nextValue.note) delete copy[key]
    else copy[key] = { code: nextValue.code || '', note: nextValue.note || '' }
  }
  return copy
}

export default function App() {
  const now = new Date()
  const [client] = useState(() => buildClient())
  const [year, setYear] = useState(now.getFullYear())
  const [monthIndex, setMonthIndex] = useState(now.getMonth())
  const [employees, setEmployees] = useState([])
  const [entries, setEntries] = useState({})
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [status, setStatus] = useState('In attesa')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('TUTTI')
  const [showAdminBox, setShowAdminBox] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [compactView, setCompactView] = useState(true)
  const [logoVisible, setLogoVisible] = useState(true)
  const [editorState, setEditorState] = useState(null)
  const [viewState, setViewState] = useState(null)

  const monthDays = useMemo(() => getMonthDays(year, monthIndex), [year, monthIndex])

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees.filter((employee) => {
      const okDepartment = departmentFilter === 'TUTTI' || employee.department === departmentFilter
      const okSearch = !query || employee.name.toLowerCase().includes(query)
      return employee.active !== false && okDepartment && okSearch
    })
  }, [employees, search, departmentFilter])

  const grouped = useMemo(() => {
    const map = { CUCINA: [], SALA: [], PIZZERIA: [] }
    for (const employee of filteredEmployees) {
      const dep = DEPARTMENTS.includes(employee.department) ? employee.department : 'SALA'
      map[dep].push(employee)
    }
    for (const dep of DEPARTMENTS) {
      map[dep].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    }
    return map
  }, [filteredEmployees])

  useEffect(() => {
    runSelfTests()
  }, [])

  useEffect(() => {
    if (!client) {
      setError('Variabili ambiente mancanti. Controlla VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in Netlify.')
      setStatus('Configurazione mancante')
      return
    }

    let mounted = true

    async function initAuth() {
      try {
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!mounted) return
        setSession(data?.session ?? null)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Errore di inizializzazione')
        setStatus('Errore')
      }
    }

    initAuth()

    const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe?.()
    }
  }, [client])

  useEffect(() => {
    if (!client) return
    let cancelled = false

    async function loadMonthData() {
      setLoading(true)
      setError('')
      try {
        const start = fmtDateKey(monthDays[0])
        const end = fmtDateKey(monthDays[monthDays.length - 1])

        const [{ data: employeeRows, error: employeeError }, { data: entryRows, error: entryError }] = await Promise.all([
          client.from('employees').select('id,name,department,sort_order,active').order('department').order('sort_order').order('name'),
          client.from('vacation_entries').select('employee_id,entry_date,code,note').gte('entry_date', start).lte('entry_date', end),
        ])

        if (employeeError) throw employeeError
        if (entryError) throw entryError

        const nextEntries = {}
        for (const row of entryRows || []) {
          nextEntries[makeEntryKey(row.employee_id, row.entry_date)] = {
            code: normalizeCode(row.code),
            note: String(row.note || ''),
          }
        }

        if (cancelled) return
        setEmployees(employeeRows || [])
        setEntries(nextEntries)
        setStatus((prev) => (prev === 'Modifica salvata' || prev === 'Modifica multipla salvata' ? prev : session ? 'Dati aggiornati' : 'Visualizzazione dipendenti'))
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Errore nel caricamento dati')
        setStatus('Errore')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadMonthData()

    return () => {
      cancelled = true
    }
  }, [client, monthDays, session])

  useEffect(() => {
    if (!client) return
    let cancelled = false

    async function checkAdmin() {
      if (!session?.user?.id) {
        if (!cancelled) {
          setIsAdmin(false)
          setStatus('Visualizzazione dipendenti')
        }
        return
      }

      try {
        const { data: profileRow, error: profileError } = await client
          .from('admin_profiles')
          .select('user_id,role')
          .eq('user_id', session.user.id)
          .maybeSingle()
        if (profileError) throw profileError
        if (cancelled) return
        const admin = Boolean(profileRow?.user_id)
        setIsAdmin(admin)
        setStatus(admin ? 'Connesso come amministratore' : 'Visualizzazione dipendenti')
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Errore nel controllo admin')
      }
    }

    checkAdmin()

    return () => {
      cancelled = true
    }
  }, [client, session])

  async function handleLogin(event) {
    event.preventDefault()
    if (!client) return

    setSaving(true)
    setError('')
    try {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      setShowAdminBox(false)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Login non riuscito')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    if (!client) return
    setSaving(true)
    setError('')
    try {
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) throw signOutError
      setIsAdmin(false)
      setStatus('Visualizzazione dipendenti')
    } catch (err) {
      setError(err.message || 'Logout non riuscito')
    } finally {
      setSaving(false)
    }
  }

  async function saveEditor() {
    if (!client || !isAdmin || !editorState) return

    const code = normalizeCode(editorState.code) || null
    const note = String(editorState.note || '').trim() || null
    const fromDate = editorState.dateKey
    const toDate = editorState.applyUntil || editorState.dateKey
    const isSingleDay = fromDate === toDate

    const targetDates = monthDays
      .map((date) => ({ dateKey: fmtDateKey(date), dayOfWeek: date.getDay() }))
      .filter((item) => item.dateKey >= fromDate && item.dateKey <= toDate)
      .filter((item) => isSingleDay || item.dayOfWeek !== 1)
      .map((item) => item.dateKey)

    if (!targetDates.length) {
      setError('Nel range selezionato ci sono solo lunedì. Riduci il range o salva il singolo giorno.')
      return
    }

    const applyKeys = targetDates.map((dateKey) => makeEntryKey(editorState.employeeId, dateKey))
    const optimisticValue = { code: code || '', note: note || '' }
    const previousEntries = entries

    setEntries((current) => patchEntriesMap(current, applyKeys, optimisticValue))
    setSaving(true)
    setError('')
    setStatus('Salvataggio in corso...')

    try {
      if (!code && !note) {
        const { error: deleteError } = await client
          .from('vacation_entries')
          .delete()
          .eq('employee_id', editorState.employeeId)
          .in('entry_date', targetDates)
        if (deleteError) throw deleteError
      } else {
        const rows = targetDates.map((dateKey) => ({
          employee_id: editorState.employeeId,
          entry_date: dateKey,
          code,
          note,
        }))

        const { error: upsertError } = await client.from('vacation_entries').upsert(rows, {
          onConflict: 'employee_id,entry_date',
        })
        if (upsertError) throw upsertError
      }

      setEditorState(null)
      setStatus(targetDates.length > 1 ? 'Modifica multipla salvata' : 'Modifica salvata')
    } catch (err) {
      setEntries(previousEntries)
      setError(err.message || 'Errore nel salvataggio')
      setStatus('Errore')
    } finally {
      setSaving(false)
    }
  }

  function getEntry(employeeId, dateKey) {
    return entries[makeEntryKey(employeeId, dateKey)] || EMPTY_ENTRY
  }

  function openEditor(employee, date) {
    const dateKey = fmtDateKey(date)
    const entry = getEntry(employee.id, dateKey)
    setEditorState({
      employeeId: employee.id,
      employeeName: employee.name,
      dateKey,
      dateLabel: `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[monthIndex]} ${year}`,
      code: entry.code || '',
      note: entry.note || '',
      applyUntil: dateKey,
    })
  }

  function openViewer(employee, date) {
    const dateKey = fmtDateKey(date)
    const entry = getEntry(employee.id, dateKey)
    setViewState({
      employeeName: employee.name,
      dateLabel: `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[monthIndex]} ${year}`,
      code: entry.code || '',
      note: entry.note || '',
      isMonday: date.getDay() === 1,
    })
  }

  function clearEditor() {
    if (!editorState) return
    setEditorState({ ...editorState, code: '', note: '', applyUntil: editorState.dateKey })
  }

  function prevMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11)
      setYear((y) => y - 1)
    } else {
      setMonthIndex((m) => m - 1)
    }
  }

  function nextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0)
      setYear((y) => y + 1)
    } else {
      setMonthIndex((m) => m + 1)
    }
  }

  return (
    <div className={`ferie-shell ${compactView ? 'compact' : ''}`}>
      <style>{APP_CSS}</style>

      <div className="mobile-rotate-hint">
        Per leggere meglio il calendario da telefono, ti consiglio la visualizzazione <strong>orizzontale</strong>.
      </div>

      <section className="ferie-card hero-card">
        <div className="hero-top">
          <div className="brand-box">
            {logoVisible ? (
              <img
                src={LOGO_SRC}
                alt="Logo Amici Miei"
                className="brand-logo"
                onError={() => setLogoVisible(false)}
              />
            ) : null}

            <div>
              <h1 className="brand-title">PIANO FERIE · Amici Miei</h1>
            </div>
          </div>

          <div className="hero-side">
            <MiniStat label="Modalità" value={isAdmin ? 'Admin' : 'Dipendente'} />
            <MiniStat label="Stato" value={loading ? 'Caricamento...' : saving ? 'Salvataggio...' : status} />
            <MiniStat label="Anno" value={String(year)} />
            <MiniStat label="Vista" value={compactView ? 'Compatta' : 'Dettagliata'} />
          </div>
        </div>
      </section>

      <section className="ferie-card toolbar-card">
        <div className="toolbar-grid">
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
              {DEPARTMENTS.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={() => window.location.reload()}>
              Ricarica pagina
            </button>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            {!isAdmin ? (
              <button className="button" onClick={() => setShowAdminBox((v) => !v)}>
                Area amministratore
              </button>
            ) : (
              <button className="button danger" onClick={handleLogout} disabled={saving}>
                Esci admin
              </button>
            )}
          </div>
        </div>

        {showAdminBox && !isAdmin ? (
          <form onSubmit={handleLogin} className="admin-box">
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
              <button className="button green" type="submit" disabled={saving}>Entra</button>
            </div>
          </form>
        ) : null}
      </section>

      <section className="ferie-card legend-card">
        <div className="legend-top">
          <div className="legend-row">
            {Object.entries(CODE_LABELS).filter(([code]) => code).map(([code, label]) => (
              <span key={code} className={`legend-chip ${getCodeClass(code)}`}>
                <strong>{code}</strong> {label}
              </span>
            ))}
            <span className="legend-chip">
              <strong>●</strong> Nota presente
            </span>
            <span className="legend-chip is-monday">
              <strong>Lun</strong> Chiusura abituale
            </span>
          </div>
        </div>
      </section>

      <section className="ferie-card month-banner">
        <div className="month-banner-grid">
          <div className="control">
            <label>Mese</label>
            <select className="select" value={monthIndex} onChange={(e) => setMonthIndex(Number(e.target.value))}>
              {MONTHS.map((month, idx) => <option key={month} value={idx}>{month}</option>)}
            </select>
          </div>

          <div className="control">
            <label>Anno</label>
            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())} />
          </div>

          <div className="month-current">
            <div className="month-current-label">Mese corrente</div>
            <div className="month-current-value">{MONTHS[monthIndex]}</div>
          </div>

          <div className="control">
            <label>Visualizzazione</label>
            <div className="month-current compact-toggle">
              <strong>{compactView ? 'Compatta' : 'Dettagliata'}</strong>
            </div>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={prevMonth}>← Mese prec.</button>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={nextMonth}>Mese succ. →</button>
          </div>
        </div>
      </section>

      <div className="view-toolbar">
        <button className="button highlight" style={{ width: 'auto' }} onClick={() => setCompactView((v) => !v)}>
          {compactView ? 'Passa a vista dettagliata' : 'Passa a vista compatta'}
        </button>
      </div>

      {error ? <div className="notice error">{error}</div> : null}
      {saving ? <div className="notice">Sto salvando la modifica. Ora il salvataggio è ottimizzato e non ricarica più tutto il mese dopo ogni clic.</div> : null}

      {employees.length === 0 && !loading && !error ? (
        <div className="notice">Non risultano dipendenti caricati nella tabella <strong>employees</strong>.</div>
      ) : null}

      {DEPARTMENTS.map((department) => {
        const rows = grouped[department] || []
        if (!rows.length) return null
        return (
          <section key={department} className="ferie-card section-card">
            <div className="section-head">
              <div>
                <h2>{department}</h2>
                <div className="section-meta">{rows.length} dipendenti</div>
              </div>
              {isAdmin ? <div className="section-meta">Modifica attiva · tocca una cella per aprire l&apos;editor rapido</div> : null}
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="name-cell-head">Dipendente</th>
                    {monthDays.map((date) => (
                      <th key={fmtDateKey(date)} className={`day-head ${date.getDay() === 1 ? 'is-monday day-head-cell' : ''}`}>
                        <span className="day-num">{date.getDate()}</span>
                        <span className="day-name">{WEEKDAYS[date.getDay()]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((employee) => (
                    <tr key={employee.id}>
                      <td className="name-cell">{employee.name}</td>
                      {monthDays.map((date) => {
                        const dateKey = fmtDateKey(date)
                        const entry = getEntry(employee.id, dateKey)
                        const mondayClass = date.getDay() === 1 ? 'is-monday' : ''
                        const noteTitle = entry.note ? `Nota: ${entry.note}` : ''
                        return (
                          <td key={dateKey} className={mondayClass}>
                            <div className="cell-wrap" title={noteTitle}>
                              {isAdmin ? (
                                <button
                                  className={`cell-button ${getCodeClass(entry.code)}`}
                                  onClick={() => openEditor(employee, date)}
                                  disabled={saving}
                                  type="button"
                                >
                                  {entry.code || '·'}
                                  {entry.note ? <span className="note-dot" /> : null}
                                  {entry.note ? <span className="note-mobile-badge">N</span> : null}
                                </button>
                              ) : (
                                <button
                                  className={`cell-button ${getCodeClass(entry.code)}`}
                                  onClick={() => openViewer(employee, date)}
                                  type="button"
                                >
                                  {entry.code || '·'}
                                  {entry.note ? <span className="note-dot" /> : null}
                                  {entry.note ? <span className="note-mobile-badge">N</span> : null}
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      {editorState ? (
        <div className="editor-overlay" onClick={() => !saving && setEditorState(null)}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="editor-title">Modifica giornata</h3>
            <div className="editor-meta">
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
                  <option key={code || 'EMPTY'} value={code}>{code || 'Vuoto'}</option>
                ))}
              </select>

              <div className="quick-code-grid">
                {CODE_OPTIONS.map((code) => (
                  <button
                    key={code || 'VUOTO'}
                    className={`quick-code-btn ${getCodeClass(code)} ${editorState.code === code ? 'active' : ''}`}
                    onClick={() => setEditorState({ ...editorState, code })}
                    type="button"
                  >
                    {code || '·'}
                  </button>
                ))}
              </div>
            </div>

            <div className="control" style={{ marginTop: 12 }}>
              <label>Note</label>
              <textarea
                className="textarea"
                value={editorState.note}
                onChange={(e) => setEditorState({ ...editorState, note: e.target.value })}
                placeholder="Aggiungi una nota per questa giornata"
              />
            </div>

            <div className="range-row">
              <div className="control">
                <label>Applica da</label>
                <input className="input" value={editorState.dateKey} disabled />
              </div>
              <div className="control">
                <label>Applica fino a</label>
                <select
                  className="select"
                  value={editorState.applyUntil}
                  onChange={(e) => setEditorState({ ...editorState, applyUntil: e.target.value })}
                >
                  {monthDays
                    .map((date) => fmtDateKey(date))
                    .filter((dateKey) => dateKey >= editorState.dateKey)
                    .map((dateKey) => <option key={dateKey} value={dateKey}>{dateKey}</option>)}
                </select>
              </div>
            </div>

            <div className="field-note">
              La copia su più giorni esclude automaticamente i lunedì. Per modificare un singolo lunedì, seleziona solo quel giorno.
            </div>

            <div className="editor-actions">
              <button className="button secondary" style={{ width: 'auto' }} onClick={() => setEditorState(null)} disabled={saving} type="button">Annulla</button>
              <button className="button ghost" style={{ width: 'auto' }} onClick={clearEditor} disabled={saving} type="button">Svuota</button>
              <button className="button green" style={{ width: 'auto' }} onClick={saveEditor} disabled={saving} type="button">
                {saving ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewState ? (
        <div className="editor-overlay" onClick={() => setViewState(null)}>
          <div className="editor-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="editor-title">Dettaglio giornata</h3>
            <div className="editor-meta">
              <strong>{viewState.employeeName}</strong><br />
              {viewState.dateLabel}
            </div>

            <div className="notice" style={{ marginBottom: 12 }}>
              <strong>Causale:</strong> {viewState.code || 'Nessuna'}
              {viewState.isMonday ? <><br /><strong>Nota operativa:</strong> lunedì evidenziato come chiusura abituale.</> : null}
            </div>

            <div className="control">
              <label>Note</label>
              <div className="notice" style={{ marginBottom: 0 }}>
                {viewState.note || 'Nessuna nota per questa giornata.'}
              </div>
            </div>

            <div className="editor-actions">
              <button className="button green" style={{ width: 'auto' }} onClick={() => setViewState(null)} type="button">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat-label">{label}</div>
      <div className="mini-stat-value">{value}</div>
    </div>
  )
}
