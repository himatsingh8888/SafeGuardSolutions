import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config/apiBase.js";
import "./ClientDashboard.css";

const TOKEN_KEY = "clientToken";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const err = new Error(typeof data === "object" && data?.message ? data.message : `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function fmt(val) {
  if (val === null || val === undefined || val === "") return "—";
  return String(val);
}

function fmtDate(val) {
  if (!val) return "—";
  return String(val).slice(0, 10);
}

function fmtMoney(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  return `$${n.toFixed(2)}`;
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete") || s.includes("paid")) return "cd-badge-complete";
  if (s.includes("progress")) return "cd-badge-progress";
  if (s.includes("cancel") || s.includes("overdue")) return "cd-badge-cancel";
  if (s.includes("schedule")) return "cd-badge-schedule";
  if (s.includes("pending")) return "cd-badge-pending";
  return "cd-badge-pending";
}

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [profile, setProfile] = useState(null);
  const [installations, setInstallations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [similarClients, setSimilarClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState("");
  const [staleBanner, setStaleBanner] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErrorBanner("");
    try {
      const [prof, inst, pays, summary, breakdown, similar] = await Promise.all([
        apiFetch("/api/client-auth/me"),
        apiFetch("/api/client-auth/installations"),
        apiFetch("/api/client-auth/payments"),
        apiFetch("/api/client-auth/payment-summary"),
        apiFetch("/api/client-auth/payment-breakdown"),
        apiFetch("/api/client-auth/similar-clients"),
      ]);
      setProfile(prof);
      setInstallations(inst);
      setPayments(pays);
      setPaymentSummary(summary);
      setPaymentBreakdown(breakdown);
      setSimilarClients(similar);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        navigate("/client/login");
        return;
      }
      setErrorBanner(err.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { navigate("/client/login"); return; }
    loadAll();
  }, [loadAll, navigate]);

  function handleStale(msg) {
    setStaleBanner(msg);
    loadAll();
  }

  function handleSignOut() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("clientId");
    navigate("/client/login");
  }



  // Profile edit modal 
  const [profileModal, setProfileModal] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ fname: "", lname: "", email: "", billingaddress: "", phone: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  function openProfileModal() {
    setProfileDraft({
      fname: profile?.fname || "",
      lname: profile?.lname || "",
      email: profile?.email || "",
      billingaddress: profile?.billingaddress || "",
      phone: profile?.phone || "",
    });
    setProfileErr("");
    setProfileModal(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileErr("");
    setProfileSaving(true);
    try {
      await apiFetch("/api/client-auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fname: profileDraft.fname || undefined,
          lname: profileDraft.lname || undefined,
          email: profileDraft.email || undefined,
          billingaddress: profileDraft.billingaddress || undefined,
          phone: profileDraft.phone || undefined,
        }),
      });
      setProfileModal(false);
      await loadAll();
    } catch (err) {
      setProfileErr(err.message);
    } finally {
      setProfileSaving(false);
    }
  }

  // Cancel installation modal 
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState("");

  async function confirmCancel() {
    setCancelErr("");
    setCancelling(true);
    try {
      await apiFetch(`/api/client-auth/installations/${cancelModal.installationid}`, { method: "DELETE" });
      setCancelModal(null);
      await loadAll();
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        handleStale(err.message);
        setCancelModal(null);
      } else {
        setCancelErr(err.message);
      }
    } finally {
      setCancelling(false);
    }
  }

  if (loading && !profile) {
    return <div className="cd-shell"><div className="cd-loading">Loading your portal…</div></div>;
  }

  const activeInstallations = installations.filter(i => !["Completed", "Cancelled"].includes(i.status));
  const totalPaid = parseFloat(paymentSummary?.total_amount || 0);
  const pendingCount = parseInt(paymentSummary?.pending_count || 0, 10);

  return (
    <div className="cd-shell">
      {/* Header */}
      <header className={`cd-header${scrolled ? " cd-header-scrolled" : ""}`}>
        <div className="cd-header-left">
          <span className="cd-brand">SafeGuard Solutions</span>
          <span className="cd-sep" />
          <span className="cd-portal">Client Portal</span>
        </div>
        <div className="cd-header-right">
          {profile && <span className="cd-user">{profile.fname} {profile.lname}</span>}
          <button className="cd-signout" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <main className="cd-main">
        {errorBanner && <div className="cd-error-banner">{errorBanner}</div>}
        {staleBanner && (
          <div className="cd-stale-banner">
            <span>{staleBanner} Data has been refreshed.</span>
            <button className="cd-stale-x" onClick={() => setStaleBanner("")}>×</button>
          </div>
        )}

        {/* Page title */}
        <div className="cd-page-title">
          <h1>My Dashboard</h1>
          <p>Manage your installations, payments, and profile</p>
        </div>

        {/* Stats row */}
        <div className="cd-stats-row">
          <div className="cd-stat">
            <div className="cd-stat-val">{installations.length}</div>
            <div className="cd-stat-lbl">Total Installations</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-val">{activeInstallations.length}</div>
            <div className="cd-stat-lbl">Active Jobs</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-val">{pendingCount}</div>
            <div className="cd-stat-lbl">Pending Payments</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-val">{fmtMoney(totalPaid)}</div>
            <div className="cd-stat-lbl">Total Billed</div>
          </div>
        </div>

        {/* Profile */}
        <div className="cd-section">
          <div className="cd-section-hd">
            <span className="cd-section-title">Profile</span>
            <button className="cd-btn cd-btn-ghost" onClick={openProfileModal}>Edit</button>
          </div>
          <div className="cd-card">
            <dl className="cd-dl">
              <div className="cd-dl-row">
                <dt>Name</dt>
                <dd>{profile ? `${profile.fname} ${profile.lname}` : "—"}</dd>
              </div>
              <div className="cd-dl-row">
                <dt>Username</dt>
                <dd>{fmt(profile?.username)}</dd>
              </div>
              <div className="cd-dl-row">
                <dt>Email</dt>
                <dd>{fmt(profile?.email)}</dd>
              </div>
              <div className="cd-dl-row">
                <dt>Phone</dt>
                <dd>{fmt(profile?.phone)}</dd>
              </div>
              <div className="cd-dl-row">
                <dt>Billing Addr.</dt>
                <dd>{fmt(profile?.billingaddress)}</dd>
              </div>
              <div className="cd-dl-row">
                <dt>Customer Type</dt>
                <dd>{fmt(profile?.customertype)}</dd>
              </div>
              {profile?.locations?.length > 0 && (
                <div className="cd-dl-row">
                  <dt>Sites</dt>
                  <dd>
                    <div className="cd-tags">
                      {profile.locations.map(l => (
                        <span key={l.siteid} className="cd-tag">{l.address}</span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Installations */}
        <div className="cd-section">
          <div className="cd-section-hd">
            <span className="cd-section-title">My Installations</span>
          </div>
          {installations.length === 0 ? (
            <div className="cd-card"><span className="cd-muted">No installations found.</span></div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Site</th>
                    <th>Scheduled</th>
                    <th>Completed</th>
                    <th>Price</th>
                    <th>Visits</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {installations.map(inst => (
                    <tr key={inst.installationid}>
                      <td className="cd-mono">{inst.installationid}</td>
                      <td>{fmt(inst.description)}</td>
                      <td>{fmt(inst.siteaddress)}</td>
                      <td>{fmtDate(inst.scheduleddate)}</td>
                      <td>{fmtDate(inst.completeddate)}</td>
                      <td>{fmtMoney(inst.price)}</td>
                      <td>{inst.visit_count}</td>
                      <td><span className={`cd-badge ${statusBadgeClass(inst.status)}`}>{inst.status}</span></td>
                      <td>
                        {inst.status === "Scheduled" && (
                          <button
                            className="cd-btn cd-btn-danger"
                            onClick={() => { setCancelErr(""); setCancelModal(inst); }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="cd-section">
          <div className="cd-section-hd">
            <span className="cd-section-title">Payments</span>
          </div>

          {/* Summary strip */}
          {paymentSummary && (
            <div className="cd-summary-strip">
              <div className="cd-summary-item">
                <div className="cd-summary-val">{paymentSummary.total_count}</div>
                <div className="cd-summary-lbl">Total</div>
              </div>
              <div className="cd-summary-item">
                <div className="cd-summary-val">{fmtMoney(paymentSummary.total_amount)}</div>
                <div className="cd-summary-lbl">Total Billed</div>
              </div>
              <div className="cd-summary-item">
                <div className="cd-summary-val">{fmtMoney(paymentSummary.avg_amount)}</div>
                <div className="cd-summary-lbl">Average</div>
              </div>
              <div className="cd-summary-item">
                <div className="cd-summary-val">{fmtMoney(paymentSummary.min_amount)}</div>
                <div className="cd-summary-lbl">Min</div>
              </div>
              <div className="cd-summary-item">
                <div className="cd-summary-val">{fmtMoney(paymentSummary.max_amount)}</div>
                <div className="cd-summary-lbl">Max</div>
              </div>
            </div>
          )}

          {/* Breakdown by status */}
          {paymentBreakdown.length > 0 && (
            <div className="cd-section" style={{ marginBottom: 16 }}>
              <div className="cd-section-hd">
                <span className="cd-section-title">Breakdown by Status</span>
              </div>
              <div className="cd-table-wrap">
                <table className="cd-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Count</th>
                      <th>Total</th>
                      <th>Average</th>
                      <th>Min</th>
                      <th>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentBreakdown.map(row => (
                      <tr key={row.status}>
                        <td><span className={`cd-badge ${statusBadgeClass(row.status)}`}>{row.status}</span></td>
                        <td>{row.count}</td>
                        <td>{fmtMoney(row.total)}</td>
                        <td>{fmtMoney(row.avg_amount)}</td>
                        <td>{fmtMoney(row.min_amount)}</td>
                        <td>{fmtMoney(row.max_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments list */}
          {payments.length === 0 ? (
            <div className="cd-card"><span className="cd-muted">No payments on file.</span></div>
          ) : (
            <div className="cd-table-wrap">
              <table className="cd-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.paymentid}>
                      <td className="cd-mono">{p.paymentid}</td>
                      <td>{fmt(p.paymenttype)}</td>
                      <td>{fmtMoney(p.totalamount)}</td>
                      <td><span className={`cd-badge ${statusBadgeClass(p.status)}`}>{p.status}</span></td>
                      <td>{fmtDate(p.duedate)}</td>
                      <td>{fmtDate(p.createdate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      
      </main>

      {/* Profile Edit Modal */}
      {profileModal && (
        <div className="cd-overlay" onClick={e => { if (e.target === e.currentTarget) setProfileModal(false); }}>
          <div className="cd-modal">
            <div className="cd-modal-head">
              Edit Profile
              <button className="cd-modal-x" onClick={() => setProfileModal(false)}>×</button>
            </div>
            <form onSubmit={saveProfile}>
              <div className="cd-modal-body cd-modal-grid">
                <div className="cd-field">
                  <label className="cd-label">First Name</label>
                  <input className="cd-input" value={profileDraft.fname}
                    onChange={e => setProfileDraft(d => ({ ...d, fname: e.target.value }))} />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Last Name</label>
                  <input className="cd-input" value={profileDraft.lname}
                    onChange={e => setProfileDraft(d => ({ ...d, lname: e.target.value }))} />
                </div>
                <div className="cd-field cd-field-full">
                  <label className="cd-label">Email</label>
                  <input className="cd-input" type="email" value={profileDraft.email}
                    onChange={e => setProfileDraft(d => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="cd-field cd-field-full">
                  <label className="cd-label">Billing Address</label>
                  <input className="cd-input" value={profileDraft.billingaddress}
                    onChange={e => setProfileDraft(d => ({ ...d, billingaddress: e.target.value }))}
                    placeholder="123 Main St, Vancouver, BC" />
                </div>
                <div className="cd-field">
                  <label className="cd-label">Phone</label>
                  <input className="cd-input" value={profileDraft.phone}
                    onChange={e => setProfileDraft(d => ({ ...d, phone: e.target.value }))}
                    placeholder="6041234567" />
                </div>
                {profileErr && <div className="cd-form-err cd-field-full">{profileErr}</div>}
              </div>
              <div className="cd-modal-foot">
                <button type="button" className="cd-btn cd-btn-ghost" onClick={() => setProfileModal(false)} disabled={profileSaving}>Cancel</button>
                <button type="submit" className="cd-btn cd-btn-primary" disabled={profileSaving}>
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Installation Modal */}
      {cancelModal && (
        <div className="cd-overlay" onClick={e => { if (e.target === e.currentTarget) setCancelModal(null); }}>
          <div className="cd-modal cd-modal-sm">
            <div className="cd-modal-head">
              Cancel Installation
              <button className="cd-modal-x" onClick={() => setCancelModal(null)}>×</button>
            </div>
            <div className="cd-modal-body">
              <p className="cd-modal-ctx">
                Cancel installation <strong>#{cancelModal.installationid}</strong>
                {cancelModal.siteaddress ? ` at ${cancelModal.siteaddress}` : ""}?
                This will also remove all related service visits and assignments.
              </p>
              <div className="cd-warning-box">
                This action cannot be undone. The installation record and all associated data will be permanently deleted.
              </div>
              {cancelErr && <div className="cd-form-err">{cancelErr}</div>}
            </div>
            <div className="cd-modal-foot">
              <button className="cd-btn cd-btn-ghost" onClick={() => setCancelModal(null)} disabled={cancelling}>Keep</button>
              <button className="cd-btn cd-btn-danger-fill" onClick={confirmCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel Installation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
