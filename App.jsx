import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const DEPARTMENTS = ['CUCINA', 'SALA', 'PIZZERIA']
const CODE_OPTIONS = ['', 'F', 'PER', 'P', 'M', 'R', 'AS']
const CODE_LABELS = {
  '': 'Vuoto',
  F: 'Ferie',
  PER: 'Permesso',
  P: 'Permesso',
  M: 'Malattia',
  R: 'Riposo',
  AS: 'Assenza',
}

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

function getCodeClass(code) {
  if (!code) return 'code-empty'
  return `code-${String(code).toUpperCase()}`
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
  ]
  const failed = tests.filter(([, ok]) => !ok)
  if (failed.length) console.error('Self-tests falliti:', failed)
  else console.info('Self-tests ok:', tests)
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
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('TUTTI')
  const [showAdminBox, setShowAdminBox] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

    async function init() {
      try {
        setLoading(true)
        const { data, error: sessionError } = await client.auth.getSession()
        if (sessionError) throw sessionError
        if (!mounted) return
        const nextSession = data?.session ?? null
        setSession(nextSession)
        await refreshData(nextSession)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Errore di inizializzazione')
        setStatus('Errore')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      await refreshData(nextSession)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, year, monthIndex])

  async function refreshData(forcedSession = session) {
    if (!client) return

    setLoading(true)
    setError('')
    try {
      const start = fmtDateKey(monthDays[0])
      const end = fmtDateKey(monthDays[monthDays.length - 1])

      const [{ data: employeeRows, error: employeeError }, { data: entryRows, error: entryError }] = await Promise.all([
        client.from('employees').select('id,name,department,sort_order,active').order('department').order('sort_order').order('name'),
        client.from('vacation_entries').select('employee_id,entry_date,code').gte('entry_date', start).lte('entry_date', end),
      ])

      if (employeeError) throw employeeError
      if (entryError) throw entryError

      const nextEntries = {}
      for (const row of entryRows || []) {
        nextEntries[makeEntryKey(row.employee_id, row.entry_date)] = row.code || ''
      }

      setEmployees(employeeRows || [])
      setEntries(nextEntries)

      let admin = false
      if (forcedSession?.user?.id) {
        const { data: profileRow, error: profileError } = await client
          .from('admin_profiles')
          .select('user_id,role')
          .eq('user_id', forcedSession.user.id)
          .maybeSingle()
        if (profileError) throw profileError
        admin = Boolean(profileRow?.user_id)
      }

      setIsAdmin(admin)
      setStatus(admin ? 'Connesso come amministratore' : 'Visualizzazione dipendenti')
    } catch (err) {
      setError(err.message || 'Errore nel caricamento dati')
      setStatus('Errore')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    if (!client) return

    setLoading(true)
    setError('')
    try {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      setShowAdminBox(false)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Login non riuscito')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    if (!client) return
    setLoading(true)
    setError('')
    try {
      const { error: signOutError } = await client.auth.signOut()
      if (signOutError) throw signOutError
      setIsAdmin(false)
      setStatus('Visualizzazione dipendenti')
    } catch (err) {
      setError(err.message || 'Logout non riuscito')
    } finally {
      setLoading(false)
    }
  }

  async function updateEntry(employeeId, dateKey, nextCode) {
    if (!client || !isAdmin) return

    setLoading(true)
    setError('')
    try {
      const code = nextCode || null
      if (!code) {
        const { error: deleteError } = await client
          .from('vacation_entries')
          .delete()
          .eq('employee_id', employeeId)
          .eq('entry_date', dateKey)
        if (deleteError) throw deleteError
      } else {
        const { error: upsertError } = await client.from('vacation_entries').upsert(
          { employee_id: employeeId, entry_date: dateKey, code },
          { onConflict: 'employee_id,entry_date' },
        )
        if (upsertError) throw upsertError
      }
      await refreshData()
      setStatus('Modifica salvata')
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
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
    <div className="app-shell">
      <section className="card header">
        <div className="header-top">
          <div>
            <div className="badge-row">
              <span className="pill">Link pubblico in sola lettura</span>
              <span className="pill">Admin con login</span>
              <span className="pill">Mese per mese</span>
            </div>
            <h1 className="title">Piano ferie · Amici Miei</h1>
            <div className="subtitle">
              I dipendenti vedono soltanto. L&apos;amministratore autenticato può modificare direttamente le celle del calendario.
            </div>
          </div>

          <div className="stats">
            <StatCard label="Modalità" value={isAdmin ? 'Admin' : 'Dipendente'} />
            <StatCard label="Stato" value={loading ? 'Caricamento...' : status} />
            <StatCard label="Mese" value={`${MONTHS[monthIndex]} ${year}`} />
          </div>
        </div>
      </section>

      <section className="card panel">
        <div className="controls-grid">
          <div className="control">
            <label>Cerca dipendente</label>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome o cognome" />
          </div>

          <div className="control">
            <label>Reparto</label>
            <select className="select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="TUTTI">Tutti</option>
              {DEPARTMENTS.map((dep) => <option key={dep} value={dep}>{dep}</option>)}
            </select>
          </div>

          <div className="control">
            <label>Anno</label>
            <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value) || now.getFullYear())} />
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button secondary" onClick={prevMonth}>← Mese prec.</button>
          </div>

          <div className="control">
            <label>&nbsp;</label>
            <button className="button" onClick={nextMonth}>Mese succ. →</button>
          </div>
        </div>
      </section>

      <section className="card panel">
        <div className="grid-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="legend-row">
            {Object.entries(CODE_LABELS).filter(([code]) => code).map(([code, label]) => (
              <span key={code} className={`code-legend ${getCodeClass(code)}`}>
                <strong>{code}</strong> {label}
              </span>
            ))}
          </div>

          <div className="action-row">
            <button className="button secondary" style={{ width: 'auto' }} onClick={() => refreshData()}>
              Aggiorna
            </button>
            {!isAdmin ? (
              <button className="button" style={{ width: 'auto' }} onClick={() => setShowAdminBox((v) => !v)}>
                Area amministratore
              </button>
            ) : (
              <button className="button danger" style={{ width: 'auto' }} onClick={handleLogout}>
                Esci admin
              </button>
            )}
          </div>
        </div>

        {showAdminBox && !isAdmin && (
          <div style={{ marginTop: 16 }} className="notice">
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
                <button className="button green" type="submit">Entra</button>
              </div>
            </form>
          </div>
        )}
      </section>

      {error ? <div className="notice error" style={{ marginBottom: 18 }}>{error}</div> : null}

      {employees.length === 0 && !loading && !error ? (
        <div className="notice">Non risultano dipendenti caricati nella tabella <strong>employees</strong>.</div>
      ) : null}

      {DEPARTMENTS.map((department) => {
        const rows = grouped[department] || []
        if (!rows.length) return null
        return (
          <section key={department} className="card section">
            <div className="section-head">
              <div>
                <h2>{department}</h2>
                <div className="section-meta">{rows.length} dipendenti</div>
              </div>
              {isAdmin ? <div className="section-meta">Modifica attiva</div> : null}
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="name-cell">Dipendente</th>
                    {monthDays.map((date) => (
                      <th key={fmtDateKey(date)}>
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
                        const value = entries[makeEntryKey(employee.id, dateKey)] || ''
                        return (
                          <td key={dateKey}>
                            {isAdmin ? (
                              <select
                                className={`select code-edit ${getCodeClass(value)}`}
                                value={value}
                                onChange={(e) => updateEntry(employee.id, dateKey, e.target.value)}
                              >
                                {CODE_OPTIONS.map((code) => (
                                  <option key={code || 'EMPTY'} value={code}>{code || '·'}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`code-view ${getCodeClass(value)}`}>{value || '·'}</span>
                            )}
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

      <div className="footer-note">
        Il link può essere condiviso ai dipendenti senza login. Solo il tuo utente presente in <strong>admin_profiles</strong> può modificare i codici del calendario.
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}
