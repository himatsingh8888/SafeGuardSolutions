import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/apiBase.js";
import "./EmployeeDashboard.css";

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete")) return "emp-badge emp-badge-complete";
  if (s.includes("progress")) return "emp-badge emp-badge-progress";
  if (s.includes("cancel")) return "emp-badge emp-badge-cancel";
  if (s.includes("schedule")) return "emp-badge emp-badge-schedule";
  if (s.includes("pending")) return "emp-badge emp-badge-schedule";
  if (s.includes("follow")) return "emp-badge emp-badge-follow";
  return "emp-badge";
}

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA");
}

function QueryTag({ label }) {
  return <span className="emp-query-tag">{label}</span>;
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [jobBreakdown, setJobBreakdown] = useState([]);
  const [serviceVisits, setServiceVisits] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Phone edit state
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneMsg, setPhoneMsg] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  // Cancel job state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadAll = useCallback(async () => {
    if (!token) { navigate("/employee/login"); return; }
    setLoading(true);
    setError("");

    try {
      const [profileRes, statsRes, assignRes, breakdownRes, visitsRes, colleaguesRes] =
        await Promise.all([
          fetch(`${API_BASE}/api/employee/profile`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/employee/stats`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/employee/assignments`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/employee/job-breakdown`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/employee/service-visits`, { headers: authHeaders }),
          fetch(`${API_BASE}/api/employee/skill-matches`, { headers: authHeaders }),
        ]);

      if (profileRes.status === 401 || profileRes.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("employeeId");
        navigate("/employee/login");
        return;
      }

      const [profileData, statsData, assignData, breakdownData, visitsData, colleaguesData] =
        await Promise.all([
          profileRes.ok ? profileRes.json() : null,
          statsRes.ok ? statsRes.json() : null,
          assignRes.ok ? assignRes.json() : [],
          breakdownRes.ok ? breakdownRes.json() : [],
          visitsRes.ok ? visitsRes.json() : [],
          colleaguesRes.ok ? colleaguesRes.json() : [],
        ]);

      setProfile(profileData);
      setStats(statsData);
      setAssignments(Array.isArray(assignData) ? assignData : []);
      setJobBreakdown(Array.isArray(breakdownData) ? breakdownData : []);
      setServiceVisits(Array.isArray(visitsData) ? visitsData : []);
      setColleagues(Array.isArray(colleaguesData) ? colleaguesData : []);
    } catch (err) {
      console.error(err);
      setError("Could not load dashboard. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");
    navigate("/employee/login");
  }

  // UPDATE: save new phone number
  async function handleSavePhone(e) {
    e.preventDefault();
    setPhoneSaving(true);
    setPhoneMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/employee/update-profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ phonenum: phoneInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) => ({ ...prev, phonenum: data.phonenum }));
        setEditingPhone(false);
        setPhoneMsg("");
      } else {
        setPhoneMsg(data.message || "Update failed.");
      }
    } catch {
      setPhoneMsg("Could not reach server.");
    } finally {
      setPhoneSaving(false);
    }
  }

  // CASCADE DELETE: cancel a scheduled installation
  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelMsg("");
    try {
      const res = await fetch(
        `${API_BASE}/api/employee/cancel-job/${cancelTarget.installationid}`,
        { method: "DELETE", headers: authHeaders }
      );
      const data = await res.json();
      if (res.ok) {
        setCancelTarget(null);
        await loadAll();
      } else {
        setCancelMsg(data.message || "Could not cancel job.");
      }
    } catch {
      setCancelMsg("Could not reach server.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="emp-shell">
      {/* Header */}
      <header className="emp-header">
        <div className="emp-header-left">
          <span className="emp-brand">SafeGuard</span>
          <span className="emp-header-sep" />
          <span className="emp-header-label">Employee Portal</span>
        </div>
        <div className="emp-header-right">
          {profile && (
            <span className="emp-user-pill">{profile.fname} {profile.lname}</span>
          )}
          <button className="emp-logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="emp-main">
        {error && <div className="emp-error-banner">{error}</div>}

        {loading ? (
          <div className="emp-loading">Loading your dashboard…</div>
        ) : (
          <>
            <div className="emp-page-title">
              <h2>{profile ? `Welcome back, ${profile.fname}` : "Employee Dashboard"}</h2>
              <p>Here's an overview of your work, hours, and upcoming jobs.</p>
            </div>

            {/* ── AGGREGATION: COUNT / SUM / AVG / MIN / MAX ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">Work Stats</h3>
              <QueryTag label="Aggregation — COUNT · SUM · AVG · MIN · MAX" />
            </div>
            <div className="emp-stats-row">
              <div className="emp-stat-card">
                <span className="emp-stat-label">Hourly Wage</span>
                <span className="emp-stat-value">
                  ${profile ? Number(profile.wage).toFixed(2) : "—"}
                  <span className="emp-stat-unit">/hr</span>
                </span>
              </div>
              <div className="emp-stat-card">
                <span className="emp-stat-label">Total Jobs</span>
                <span className="emp-stat-value">{stats ? stats.total_jobs : "—"}</span>
              </div>
              <div className="emp-stat-card">
                <span className="emp-stat-label">Total Hours Logged</span>
                <span className="emp-stat-value">{stats ? Number(stats.total_hours).toFixed(1) : "—"}</span>
              </div>
              <div className="emp-stat-card">
                <span className="emp-stat-label">Avg Hours / Job</span>
                <span className="emp-stat-value">{stats ? Number(stats.avg_hours).toFixed(1) : "—"}</span>
              </div>
              <div className="emp-stat-card">
                <span className="emp-stat-label">Shortest Job</span>
                <span className="emp-stat-value">{stats ? `${stats.min_hours}h` : "—"}</span>
              </div>
              <div className="emp-stat-card">
                <span className="emp-stat-label">Longest Job</span>
                <span className="emp-stat-value">{stats ? `${stats.max_hours}h` : "—"}</span>
              </div>
            </div>

            {/* ── UPDATE: edit phone ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">My Profile</h3>
              <QueryTag label="Update — employee phone" />
            </div>
            <section className="emp-section">
              <div className="emp-panel">
                {profile ? (
                  <>
                    <div className="emp-profile-grid">
                      <div className="emp-field">
                        <span className="emp-field-label">Full Name</span>
                        <span className="emp-field-value">{profile.fname} {profile.lname}</span>
                      </div>
                      <div className="emp-field">
                        <span className="emp-field-label">Email</span>
                        <span className="emp-field-value">{profile.email || "—"}</span>
                      </div>
                      <div className="emp-field">
                        <span className="emp-field-label">Phone</span>
                        {editingPhone ? (
                          <form className="emp-inline-form" onSubmit={handleSavePhone}>
                            <input
                              className="emp-inline-input"
                              type="text"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="e.g. 6041234567"
                              required
                            />
                            <button type="submit" className="emp-btn-sm emp-btn-dark" disabled={phoneSaving}>
                              {phoneSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="emp-btn-sm"
                              onClick={() => { setEditingPhone(false); setPhoneMsg(""); }}
                            >
                              Cancel
                            </button>
                            {phoneMsg && <span className="emp-inline-err">{phoneMsg}</span>}
                          </form>
                        ) : (
                          <span className="emp-field-value">
                            {profile.phonenum || "—"}
                            <button
                              className="emp-link-btn"
                              onClick={() => { setPhoneInput(profile.phonenum || ""); setEditingPhone(true); }}
                            >
                              Edit
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="emp-field">
                        <span className="emp-field-label">Employee ID</span>
                        <span className="emp-field-value">#{profile.employeeid}</span>
                      </div>
                      <div className="emp-field emp-field-full">
                        <span className="emp-field-label">Skills</span>
                        <div className="emp-skills-row">
                          {profile.skills && profile.skills.length > 0
                            ? profile.skills.map((s) => <span key={s} className="emp-skill-tag">{s}</span>)
                            : <span className="emp-muted">No skills on file</span>
                          }
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="emp-muted">No profile data.</p>
                )}
              </div>
            </section>

            {/* ── AGGREGATION + GROUP BY: hours per installation status ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">Hours by Job Status</h3>
              <QueryTag label="Aggregation + Group By — status" />
            </div>
            <section className="emp-section">
              {jobBreakdown.length === 0 ? (
                <div className="emp-panel"><p className="emp-muted">No job data to break down yet.</p></div>
              ) : (
                <div className="emp-table-wrap">
                  <table className="emp-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Jobs</th>
                        <th>Total Hours</th>
                        <th>Avg Hours / Job</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobBreakdown.map((row) => (
                        <tr key={row.status}>
                          <td><span className={statusBadge(row.status)}>{row.status}</span></td>
                          <td>{row.job_count}</td>
                          <td>{Number(row.total_hours).toFixed(1)}h</td>
                          <td>{Number(row.avg_hours).toFixed(1)}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── JOIN (3 tables) + CASCADE DELETE ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">My Assignments</h3>
              <QueryTag label="Join — assignment · installation · location" />
            </div>
            <section className="emp-section">
              {assignments.length === 0 ? (
                <div className="emp-panel"><p className="emp-muted">No assignments found.</p></div>
              ) : (
                <div className="emp-table-wrap">
                  <table className="emp-table">
                    <thead>
                      <tr>
                        <th>Job #</th>
                        <th>Site Address</th>
                        <th>Description</th>
                        <th>Scheduled</th>
                        <th>Status</th>
                        <th>Hours</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.installationid}>
                          <td>#{a.installationid}</td>
                          <td>{a.siteaddress || "—"}</td>
                          <td>{a.description || "—"}</td>
                          <td>{fmt(a.scheduleddate)}</td>
                          <td><span className={statusBadge(a.status)}>{a.status}</span></td>
                          <td>{a.hoursworked != null ? `${a.hoursworked}h` : "—"}</td>
                          <td>
                            {a.status === "Scheduled" && (
                              <button
                                className="emp-btn-sm emp-btn-danger"
                                onClick={() => { setCancelTarget(a); setCancelMsg(""); }}
                              >
                                Cancel Job
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── JOIN ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">Service Visits</h3>
              <QueryTag label="Join — servicevisit · assignment · location" />
            </div>
            <section className="emp-section">
              {serviceVisits.length === 0 ? (
                <div className="emp-panel"><p className="emp-muted">No service visits linked to your assignments.</p></div>
              ) : (
                <div className="emp-table-wrap">
                  <table className="emp-table">
                    <thead>
                      <tr>
                        <th>Visit #</th>
                        <th>Job #</th>
                        <th>Site</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Outcome</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceVisits.map((v) => (
                        <tr key={`${v.visitnumber}-${v.installationid}`}>
                          <td>{v.visitnumber}</td>
                          <td>#{v.installationid}</td>
                          <td>{v.siteaddress || "—"}</td>
                          <td>{fmt(v.visitdate)}</td>
                          <td>{v.visittype}</td>
                          <td><span className={statusBadge(v.outcomestatus)}>{v.outcomestatus}</span></td>
                          <td className="emp-notes">{v.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ── DIVISION ── */}
            <div className="emp-section-header">
              <h3 className="emp-section-title">Colleagues with Your Full Skill Set</h3>
              <QueryTag label="Division — employees who have ALL your skills" />
            </div>
            <section className="emp-section">
              <div className="emp-panel">
                {colleagues.length === 0 ? (
                  <p className="emp-muted">
                    No other employees currently match your complete skill set.
                  </p>
                ) : (
                  <div className="emp-colleagues-grid">
                    {colleagues.map((c) => (
                      <div key={c.employeeid} className="emp-colleague-card">
                        <div className="emp-colleague-name">
                          {c.fname} {c.lname}
                        </div>
                        <div className="emp-skills-row emp-skills-sm">
                          {c.skills.map((s) => (
                            <span key={s} className="emp-skill-tag emp-skill-tag-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ── CANCEL CONFIRMATION MODAL (Cascade Delete) ── */}
      {cancelTarget && (
        <div className="emp-overlay">
          <div className="emp-modal">
            <div className="emp-modal-header">
              <h4>Cancel Job #{cancelTarget.installationid}?</h4>
              <button className="emp-modal-close" onClick={() => setCancelTarget(null)}>×</button>
            </div>
            <div className="emp-modal-body">
              <p>
                <strong>{cancelTarget.siteaddress}</strong> — {cancelTarget.description || "No description"}
              </p>
              <p className="emp-cascade-notice">
                This will permanently delete the installation record. All linked assignments
                and service visit records will be removed automatically via <strong>CASCADE</strong>.
              </p>
              {cancelMsg && <p className="emp-inline-err">{cancelMsg}</p>}
            </div>
            <div className="emp-modal-footer">
              <button className="emp-btn-sm" onClick={() => setCancelTarget(null)}>Keep Job</button>
              <button
                className="emp-btn-sm emp-btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Yes, Cancel Job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
