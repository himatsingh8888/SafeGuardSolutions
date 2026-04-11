import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/apiBase.js";
import "./EmployeeDashboard.css";

const ALL_SKILLS = ["Camera Installation", "Alarm Systems", "Access Control", "Network Setup"];
const VISIT_TYPES = ["Inspection", "Repair", "Upgrade"];
const OUTCOME_STATUSES = ["Completed", "Pending", "Follow-up required"];

function badge(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete")) return "ed-badge ed-badge-complete";
  if (s.includes("progress")) return "ed-badge ed-badge-progress";
  if (s.includes("cancel"))   return "ed-badge ed-badge-cancel";
  if (s.includes("schedule")) return "ed-badge ed-badge-schedule";
  if (s.includes("pending"))  return "ed-badge ed-badge-pending";
  if (s.includes("follow"))   return "ed-badge ed-badge-follow";
  return "ed-badge";
}

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA");
}

const EMPTY_VISIT = { installationid: "", visitdate: "", visittype: "Inspection", outcomestatus: "Pending", notes: "" };

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [profile, setProfile]         = useState(null);
  const [stats, setStats]             = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [breakdown, setBreakdown]     = useState([]);
  const [visits, setVisits]           = useState([]);
  const [colleagues, setColleagues]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [staleBanner, setStaleBanner] = useState("");
  const [scrolled, setScrolled]       = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [pForm, setPForm]             = useState({ phonenum: "", skills: [] });
  const [pSaving, setPSaving]         = useState(false);
  const [pMsg, setPMsg]               = useState("");
  const [newSkill, setNewSkill]       = useState("");


  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling]     = useState(false);
  const [cancelMsg, setCancelMsg]       = useState("");

  const [visitModal, setVisitModal] = useState(null);
  const [vForm, setVForm]           = useState(EMPTY_VISIT);
  const [vSaving, setVSaving]       = useState(false);
  const [vMsg, setVMsg]             = useState("");

  const [delVisit, setDelVisit]   = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [delMsg, setDelMsg]       = useState("");

  const H = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadAll = useCallback(async () => {
    if (!token) { navigate("/employee/login"); return; }
    setLoading(true);
    setError("");
    try {
      const [pR, sR, aR, bR, vR, cR] = await Promise.all([
        fetch(`${API_BASE}/api/employee/profile`,       { headers: H }),
        fetch(`${API_BASE}/api/employee/stats`,         { headers: H }),
        fetch(`${API_BASE}/api/employee/assignments`,   { headers: H }),
        fetch(`${API_BASE}/api/employee/job-breakdown`, { headers: H }),
        fetch(`${API_BASE}/api/employee/service-visits`,{ headers: H }),
        fetch(`${API_BASE}/api/employee/skill-matches`, { headers: H }),
      ]);
      if (pR.status === 401 || pR.status === 403) {
        localStorage.clear(); navigate("/employee/login"); return;
      }
      const [p, s, a, b, v, c] = await Promise.all([
        pR.ok ? pR.json() : null,
        sR.ok ? sR.json() : null,
        aR.ok ? aR.json() : [],
        bR.ok ? bR.json() : [],
        vR.ok ? vR.json() : [],
        cR.ok ? cR.json() : [],
      ]);
      setProfile(p); setStats(s);
      setAssignments(Array.isArray(a) ? a : []);
      setBreakdown(Array.isArray(b) ? b : []);
      setVisits(Array.isArray(v) ? v : []);
      setColleagues(Array.isArray(c) ? c : []);
    } catch { setError("Could not load dashboard. Make sure the server is running."); }
    finally  { setLoading(false); }
  }, [token]); // eslint-disable-line

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function logout() { localStorage.clear(); navigate("/employee/login"); }

  function handleStale(msg = "Data was changed by another session. Refreshed — please review and try again.") {
    setStaleBanner(msg);
    loadAll();
  }

  function openProfile() {
    setPForm({ phonenum: profile?.phonenum || "", skills: [...(profile?.skills || [])] });
    setPMsg(""); setNewSkill(""); setProfileOpen(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setPSaving(true); setPMsg("");

    if (pForm.phonenum !== (profile?.phonenum || "")) {
      const res = await fetch(`${API_BASE}/api/employee/update-profile`, {
        method: "PUT", headers: H, body: JSON.stringify({ phonenum: pForm.phonenum }),
      });
      const d = await res.json();
      if (!res.ok) { setPMsg(d.message || "Failed to update phone."); setPSaving(false); return; }
    }

    const current = profile?.skills || [];
    const toAdd    = pForm.skills.filter(s => !current.includes(s));
    const toRemove = current.filter(s => !pForm.skills.includes(s));

    for (const skill of toAdd) {
      const res = await fetch(`${API_BASE}/api/employee/add-skill`, {
        method: "POST", headers: H, body: JSON.stringify({ skill }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPMsg(d.message || `Failed to add "${skill}".`); setPSaving(false); return;
      }
    }
    for (const skill of toRemove) {
      const res = await fetch(`${API_BASE}/api/employee/remove-skill`, {
        method: "DELETE", headers: H, body: JSON.stringify({ skill }),
      });
      if (!res.ok && res.status !== 404) {
        const d = await res.json();
        setPMsg(d.message || `Failed to remove "${skill}".`); setPSaving(false); return;
      }
    }

    setProfileOpen(false);
    await loadAll();
    setPSaving(false);
  }

  async function confirmCancel() {
    setCancelling(true); setCancelMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/employee/cancel-job/${cancelTarget.installationid}`, {
        method: "DELETE", headers: H,
      });
      const d = await res.json();
      if (res.ok)              { setCancelTarget(null); await loadAll(); }
      else if (res.status === 404) { setCancelTarget(null); handleStale("Job not found — it may have already been removed."); }
      else if (res.status === 400) { setCancelTarget(null); handleStale("Job status has changed. Data refreshed — please review."); }
      else                     { setCancelMsg(d.message || "Could not cancel job."); }
    } catch { setCancelMsg("Could not reach server."); }
    finally  { setCancelling(false); }
  }

  function openAddVisit() {
    setVForm({ ...EMPTY_VISIT, installationid: assignments[0]?.installationid ?? "" });
    setVMsg(""); setVisitModal("add");
  }
  function openEditVisit(v) {
    setVForm({
      visitnumber: v.visitnumber,
      installationid: v.installationid,
      visitdate: v.visitdate ? v.visitdate.slice(0, 10) : "",
      visittype: v.visittype,
      outcomestatus: v.outcomestatus,
      notes: v.notes || "",
    });
    setVMsg(""); setVisitModal("edit");
  }

  async function saveVisit(e) {
    e.preventDefault();
    setVSaving(true); setVMsg("");
    const isEdit = visitModal === "edit";
    try {
      const res = await fetch(`${API_BASE}/api/employee/${isEdit ? "update-service-visit" : "add-service-visit"}`, {
        method: isEdit ? "PUT" : "POST", headers: H, body: JSON.stringify(vForm),
      });
      const d = await res.json();
      if (res.ok)              { setVisitModal(null); await loadAll(); }
      else if (res.status === 404) { setVisitModal(null); handleStale(); }
      else                     { setVMsg(d.message || "Failed to save visit."); }
    } catch { setVMsg("Could not reach server."); }
    finally  { setVSaving(false); }
  }

  async function confirmDeleteVisit() {
    setDeleting(true); setDelMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/employee/delete-service-visit`, {
        method: "DELETE", headers: H,
        body: JSON.stringify({ visitnumber: delVisit.visitnumber, installationid: delVisit.installationid }),
      });
      const d = await res.json();
      if (res.ok)              { setDelVisit(null); await loadAll(); }
      else if (res.status === 404) { setDelVisit(null); handleStale("Visit no longer exists — data refreshed."); }
      else                     { setDelMsg(d.message || "Failed to delete."); }
    } catch { setDelMsg("Could not reach server."); }
    finally  { setDeleting(false); }
  }

  const availableSkills = ALL_SKILLS.filter(s => !pForm.skills.includes(s));

  return (
    <div className="ed-shell">
      <header className={`ed-header${scrolled ? " ed-header-scrolled" : ""}`}>
        <div className="ed-header-left">
          <span className="ed-brand">SafeGuard Solutions</span>
          <span className="ed-sep" />
          <span className="ed-portal">Employee Portal</span>
        </div>
        <div className="ed-header-right">
          {profile && <span className="ed-user">{profile.fname} {profile.lname}</span>}
          <button className="ed-signout" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="ed-main">
        {staleBanner && (
          <div className="ed-stale-banner">
            <span>{staleBanner}</span>
            <button className="ed-stale-x" onClick={() => setStaleBanner("")}>×</button>
          </div>
        )}
        {error && <div className="ed-error-banner">{error}</div>}

        {loading ? <div className="ed-loading">Loading…</div> : (
          <>
            <div className="ed-page-title">
              <h1>{profile ? `${profile.fname} ${profile.lname}` : "Dashboard"}</h1>
              <p>Employee #{profile?.employeeid} · {profile?.email}</p>
            </div>

            <div className="ed-stats-row">
              <div className="ed-stat">
                <div className="ed-stat-val">{stats?.total_jobs ?? "—"}</div>
                <div className="ed-stat-lbl">Jobs assigned</div>
              </div>
              <div className="ed-stat">
                <div className="ed-stat-val">{stats ? `${Number(stats.total_hours).toFixed(1)}` : "—"}<span className="ed-stat-unit">h</span></div>
                <div className="ed-stat-lbl">Total hours</div>
              </div>
              <div className="ed-stat">
                <div className="ed-stat-val">{stats ? `${Number(stats.avg_hours).toFixed(1)}` : "—"}<span className="ed-stat-unit">h</span></div>
                <div className="ed-stat-lbl">Avg per job</div>
              </div>
              <div className="ed-stat">
                <div className="ed-stat-val">{profile ? `$${Number(profile.wage).toFixed(2)}` : "—"}</div>
                <div className="ed-stat-lbl">Hourly wage</div>
              </div>
            </div>

            <section className="ed-section">
              <div className="ed-section-hd">
                <h2 className="ed-section-title">Profile</h2>
                <button className="ed-btn ed-btn-ghost" onClick={openProfile}>Edit</button>
              </div>
              <div className="ed-card">
                <dl className="ed-dl">
                  <div className="ed-dl-row"><dt>Name</dt><dd>{profile?.fname} {profile?.lname}</dd></div>
                  <div className="ed-dl-row"><dt>Email</dt><dd>{profile?.email || "—"}</dd></div>
                  <div className="ed-dl-row"><dt>Phone</dt><dd>{profile?.phonenum || "—"}</dd></div>
                  <div className="ed-dl-row">
                    <dt>Skills</dt>
                    <dd>
                      {(profile?.skills || []).length > 0
                        ? profile.skills.map(s => <span key={s} className="ed-tag">{s}</span>)
                        : <span className="ed-muted">None on file</span>
                      }
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="ed-section">
              <div className="ed-section-hd">
                <h2 className="ed-section-title">Hours by Job Status</h2>
              </div>
              {breakdown.length === 0
                ? <div className="ed-card"><p className="ed-muted">No job data yet.</p></div>
                : (
                  <div className="ed-table-wrap">
                    <table className="ed-table">
                      <thead><tr><th>Status</th><th>Jobs</th><th>Total Hours</th><th>Avg / Job</th></tr></thead>
                      <tbody>
                        {breakdown.map(r => (
                          <tr key={r.status}>
                            <td><span className={badge(r.status)}>{r.status}</span></td>
                            <td>{r.job_count}</td>
                            <td>{Number(r.total_hours).toFixed(1)}h</td>
                            <td>{Number(r.avg_hours).toFixed(1)}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </section>

            <section className="ed-section">
              <div className="ed-section-hd">
                <h2 className="ed-section-title">My Assignments</h2>
              </div>
              {assignments.length === 0
                ? <div className="ed-card"><p className="ed-muted">No assignments found.</p></div>
                : (
                  <div className="ed-table-wrap">
                    <table className="ed-table">
                      <thead><tr><th>Job #</th><th>Site</th><th>Scheduled</th><th>Status</th><th>Hours</th><th></th></tr></thead>
                      <tbody>
                        {assignments.map(a => (
                          <tr key={a.installationid}>
                            <td className="ed-mono">#{a.installationid}</td>
                            <td>{a.siteaddress || "—"}</td>
                            <td>{fmt(a.scheduleddate)}</td>
                            <td><span className={badge(a.status)}>{a.status}</span></td>
                            <td>{a.hoursworked != null ? `${a.hoursworked}h` : "—"}</td>
                            <td>
                              {a.status === "Scheduled" && (
                                <button className="ed-btn ed-btn-danger" onClick={() => { setCancelTarget(a); setCancelMsg(""); }}>Cancel</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </section>

            <section className="ed-section">
              <div className="ed-section-hd">
                <h2 className="ed-section-title">Service Visits</h2>
                {assignments.length > 0 && (
                  <button className="ed-btn ed-btn-primary" onClick={openAddVisit}>+ Add Visit</button>
                )}
              </div>
              {visits.length === 0
                ? <div className="ed-card"><p className="ed-muted">No service visits yet.</p></div>
                : (
                  <div className="ed-table-wrap">
                    <table className="ed-table">
                      <thead><tr><th>Date</th><th>Site</th><th>Type</th><th>Outcome</th><th>Notes</th><th></th></tr></thead>
                      <tbody>
                        {visits.map(v => (
                          <tr key={`${v.visitnumber}-${v.installationid}`}>
                            <td>{fmt(v.visitdate)}</td>
                            <td>{v.siteaddress || "—"}</td>
                            <td>{v.visittype}</td>
                            <td><span className={badge(v.outcomestatus)}>{v.outcomestatus}</span></td>
                            <td className="ed-notes">{v.notes || "—"}</td>
                            <td>
                              <div className="ed-row-actions">
                                <button className="ed-btn ed-btn-ghost" onClick={() => openEditVisit(v)}>Edit</button>
                                <button className="ed-btn ed-btn-danger" onClick={() => { setDelVisit(v); setDelMsg(""); }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            </section>

            <section className="ed-section">
              <div className="ed-section-hd">
                <h2 className="ed-section-title">Colleagues with Your Full Skill Set</h2>
              </div>
              <div className="ed-card">
                {colleagues.length === 0
                  ? <p className="ed-muted">No colleagues currently match your complete skill set.</p>
                  : (
                    <div className="ed-colleagues">
                      {colleagues.map(c => (
                        <div key={c.employeeid} className="ed-colleague">
                          <div className="ed-colleague-name">{c.fname} {c.lname}</div>
                          <div className="ed-tags">
                            {c.skills.map(s => <span key={s} className="ed-tag">{s}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </section>
          </>
        )}
      </main>

      {profileOpen && (
        <div className="ed-overlay" onClick={e => e.target === e.currentTarget && setProfileOpen(false)}>
          <div className="ed-modal">
            <div className="ed-modal-head">
              <span>Edit Profile</span>
              <button className="ed-modal-x" onClick={() => setProfileOpen(false)}>×</button>
            </div>
            <form onSubmit={saveProfile}>
              <div className="ed-modal-body">
                <div className="ed-field">
                  <label className="ed-label">Phone Number</label>
                  <input
                    className="ed-input"
                    type="text"
                    value={pForm.phonenum}
                    onChange={e => setPForm({ ...pForm, phonenum: e.target.value })}
                    placeholder="e.g. 6041234567"
                    required
                  />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Skills</label>
                  {pForm.skills.length > 0 && (
                    <div className="ed-tags ed-tags-edit">
                      {pForm.skills.map(s => (
                        <span key={s} className="ed-tag ed-tag-rm">
                          {s}
                          <button
                            type="button"
                            className="ed-tag-x"
                            onClick={() => setPForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }))}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {availableSkills.length > 0 && (
                    <div className="ed-add-row">
                      <select className="ed-select" value={newSkill} onChange={e => setNewSkill(e.target.value)}>
                        <option value="">Add a skill…</option>
                        {availableSkills.map(s => <option key={s}>{s}</option>)}
                      </select>
                      <button
                        type="button"
                        className="ed-btn ed-btn-ghost"
                        disabled={!newSkill}
                        onClick={() => {
                          if (!newSkill) return;
                          setPForm(f => ({ ...f, skills: [...f.skills, newSkill].sort() }));
                          setNewSkill("");
                        }}
                      >Add</button>
                    </div>
                  )}
                </div>
                {pMsg && <p className="ed-form-err">{pMsg}</p>}
              </div>
              <div className="ed-modal-foot">
                <button type="button" className="ed-btn ed-btn-ghost" onClick={() => setProfileOpen(false)}>Cancel</button>
                <button type="submit" className="ed-btn ed-btn-primary" disabled={pSaving}>
                  {pSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="ed-overlay" onClick={e => e.target === e.currentTarget && setCancelTarget(null)}>
          <div className="ed-modal ed-modal-sm">
            <div className="ed-modal-head">
              <span>Cancel Job #{cancelTarget.installationid}?</span>
              <button className="ed-modal-x" onClick={() => setCancelTarget(null)}>×</button>
            </div>
            <div className="ed-modal-body">
              <p className="ed-modal-ctx">{cancelTarget.siteaddress}</p>
              <p className="ed-warning-box">This permanently removes the job and all linked service visit records.</p>
              {cancelMsg && <p className="ed-form-err">{cancelMsg}</p>}
            </div>
            <div className="ed-modal-foot">
              <button className="ed-btn ed-btn-ghost" onClick={() => setCancelTarget(null)}>Keep Job</button>
              <button className="ed-btn ed-btn-danger-fill" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {visitModal && (
        <div className="ed-overlay" onClick={e => e.target === e.currentTarget && setVisitModal(null)}>
          <div className="ed-modal">
            <div className="ed-modal-head">
              <span>{visitModal === "edit" ? "Edit Service Visit" : "Log Service Visit"}</span>
              <button className="ed-modal-x" onClick={() => setVisitModal(null)}>×</button>
            </div>
            <form onSubmit={saveVisit}>
              <div className="ed-modal-body ed-modal-grid">
                <div className="ed-field">
                  <label className="ed-label">Job</label>
                  <select
                    className="ed-select"
                    value={vForm.installationid}
                    onChange={e => setVForm({ ...vForm, installationid: e.target.value })}
                    disabled={visitModal === "edit"}
                    required
                  >
                    <option value="">Select job…</option>
                    {assignments.map(a => (
                      <option key={a.installationid} value={a.installationid}>
                        #{a.installationid} — {a.siteaddress}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ed-field">
                  <label className="ed-label">Visit Date</label>
                  <input
                    className="ed-input"
                    type="date"
                    value={vForm.visitdate}
                    onChange={e => setVForm({ ...vForm, visitdate: e.target.value })}
                    required
                  />
                </div>
                <div className="ed-field">
                  <label className="ed-label">Type</label>
                  <select className="ed-select" value={vForm.visittype} onChange={e => setVForm({ ...vForm, visittype: e.target.value })} required>
                    {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="ed-field">
                  <label className="ed-label">Outcome</label>
                  <select className="ed-select" value={vForm.outcomestatus} onChange={e => setVForm({ ...vForm, outcomestatus: e.target.value })} required>
                    {OUTCOME_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="ed-field ed-field-full">
                  <label className="ed-label">Notes</label>
                  <textarea
                    className="ed-textarea"
                    rows={3}
                    value={vForm.notes}
                    onChange={e => setVForm({ ...vForm, notes: e.target.value })}
                    placeholder="Optional…"
                  />
                </div>
                {vMsg && <p className="ed-form-err ed-field-full">{vMsg}</p>}
              </div>
              <div className="ed-modal-foot">
                <button type="button" className="ed-btn ed-btn-ghost" onClick={() => setVisitModal(null)}>Cancel</button>
                <button type="submit" className="ed-btn ed-btn-primary" disabled={vSaving}>
                  {vSaving ? "Saving…" : visitModal === "edit" ? "Save Changes" : "Log Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delVisit && (
        <div className="ed-overlay" onClick={e => e.target === e.currentTarget && setDelVisit(null)}>
          <div className="ed-modal ed-modal-sm">
            <div className="ed-modal-head">
              <span>Delete Visit?</span>
              <button className="ed-modal-x" onClick={() => setDelVisit(null)}>×</button>
            </div>
            <div className="ed-modal-body">
              <p className="ed-modal-ctx">{delVisit.visittype} at {delVisit.siteaddress} · {fmt(delVisit.visitdate)}</p>
              <p className="ed-warning-box">This cannot be undone.</p>
              {delMsg && <p className="ed-form-err">{delMsg}</p>}
            </div>
            <div className="ed-modal-foot">
              <button className="ed-btn ed-btn-ghost" onClick={() => setDelVisit(null)}>Keep</button>
              <button className="ed-btn ed-btn-danger-fill" onClick={confirmDeleteVisit} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
