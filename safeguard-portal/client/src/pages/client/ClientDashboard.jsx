import Navbar from "../../components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import "../../index.css";
import "../admin/AdminDashboard.css";
import "./ClientDashboard.css";
import {
  fetchClient,
  fetchClientReviews,
  fetchInstallationDetail,
  fetchInstallations,
  fetchPayments,
  getStoredClientId,
  statusToProgress,
  submitClientReview,
  updateClient,
} from "../../api/clientApi.js";

const INSTALLATION_LIST_LIMIT = 100;

function pickCurrentInstallation(list) {
  if (!list.length) return null;
  const active = list.find((row) => {
    const s = row.status.toLowerCase();
    return !s.includes("complete") && !s.includes("cancel");
  });
  return active ?? list[0];
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("paid")) return "status-completed";
  if (s.includes("overdue")) return "status-cancelled";
  if (s.includes("pending")) return "status-in-progress";
  if (s.includes("complete")) return "status-completed";
  if (s.includes("progress")) return "status-in-progress";
  if (s.includes("cancel")) return "status-cancelled";
  if (s.includes("schedule")) return "status-scheduled";
  return "status-scheduled";
}

function formatReviewDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClientDashboard() {
  const clientId = getStoredClientId();

  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);

  const [loading, setLoading] = useState(!!clientId);
  const [loadError, setLoadError] = useState("");

  const [profile, setProfile] = useState({
    fname: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    customerType: "",
  });
  const [installations, setInstallations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [myReviews, setMyReviews] = useState([]);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState(profile);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [installationDetail, setInstallationDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadDashboard = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const [clientRow, instList, payList, reviewList] = await Promise.all([
        fetchClient(clientId),
        fetchInstallations(clientId, INSTALLATION_LIST_LIMIT),
        fetchPayments(clientId),
        fetchClientReviews(clientId),
      ]);

      if (clientRow) {
        setProfile({
          fname: clientRow.fname,
          name: clientRow.name,
          email: clientRow.email,
          phone: clientRow.phone,
          address: clientRow.address,
          customerType: clientRow.customerType,
        });
        setProfileDraft({
          fname: clientRow.fname,
          name: clientRow.name,
          email: clientRow.email,
          phone: clientRow.phone,
          address: clientRow.address,
          customerType: clientRow.customerType,
        });
      }

      setInstallations(instList);
      setPayments(payList);
      setMyReviews(reviewList);
    } catch (err) {
      console.error(err);
      setLoadError(err.message || "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const currentInstallation = useMemo(
    () => pickCurrentInstallation(installations),
    [installations]
  );

  const historyRows = useMemo(() => {
    if (!currentInstallation) return installations;
    return installations.filter((row) => row.id !== currentInstallation.id);
  }, [installations, currentInstallation]);

  const completedCount = useMemo(
    () =>
      installations.filter((i) => String(i.status || "").toLowerCase().includes("complete"))
        .length,
    [installations]
  );

  const pendingPaymentsCount = useMemo(
    () => payments.filter((p) => String(p.status || "").toLowerCase() === "pending").length,
    [payments]
  );

  const handleOpenDetail = async (installationId) => {
    if (!clientId || !installationId) return;
    setDetailError("");
    setInstallationDetail(null);
    setDetailLoading(true);
    try {
      const raw = await fetchInstallationDetail(clientId, installationId);
      setInstallationDetail(raw);
    } catch (err) {
      console.error(err);
      setDetailError(err.message || "Could not load installation details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;
    setMessageSent(true);
    setMessage("");
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess(false);

    const name = reviewName.trim();
    const ratingNum = parseInt(reviewRating, 10);
    if (!name) {
      setReviewError("Enter the name you want shown with your review.");
      return;
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      setReviewError("Choose a rating from 0 to 5.");
      return;
    }

    if (!clientId) return;
    setReviewSubmitting(true);
    try {
      await submitClientReview(clientId, {
        reviewName: name,
        rating: ratingNum,
        reviewComment: reviewComment.trim(),
      });
      setReviewSuccess(true);
      setReviewComment("");
      const list = await fetchClientReviews(clientId);
      setMyReviews(list);
    } catch (err) {
      console.error(err);
      setReviewError(err.message || "Could not submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditProfile = () => {
    setProfileDraft(profile);
    setProfileSaved(false);
    setProfileError("");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileDraft(profile);
    setProfileError("");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSaved(false);
    setProfileError("");

    const trimmed = {
      fname: profileDraft.fname.trim(),
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
      address: profileDraft.address.trim(),
    };

    if (!trimmed.fname || !trimmed.name || !trimmed.email || !trimmed.phone || !trimmed.address) {
      setProfileError("All profile fields are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmed.email)) {
      setProfileError("Enter a valid email address.");
      return;
    }

    if (!clientId) {
      setProfileError("No client ID — log in as a client or set VITE_DEV_CLIENT_ID.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateClient(clientId, trimmed);
      setProfile({ ...profile, ...trimmed, customerType: profile.customerType });
      setProfileDraft({ ...profileDraft, ...trimmed });
      const refreshed = await fetchClient(clientId);
      if (refreshed) {
        setProfile({
          fname: refreshed.fname,
          name: refreshed.name,
          email: refreshed.email,
          phone: refreshed.phone,
          address: refreshed.address,
          customerType: refreshed.customerType,
        });
      }
      setProfileError("");
      setProfileSaved(true);
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
      setProfileError(err.message || "Could not save profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  if (!clientId) {
    return (
      <div>
        <Navbar />
        <div className="admin-dashboard client-dashboard-shell">
          <div className="dashboard-container">
            <h2 className="dashboard-title">Client Dashboard</h2>
            <div className="client-empty-card">
              <p className="client-empty-text">
                No client ID found. Log in with an account that returns <code>clientId</code> from{" "}
                <code>/api/auth/login</code>, or set <code>VITE_DEV_CLIENT_ID</code> in{" "}
                <code>client/.env</code> for local testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="admin-dashboard client-dashboard-shell">
        <div className="dashboard-container">
          <h2 className="dashboard-title">Client Dashboard</h2>
          <p className="client-subtitle">
            Signed in as client <span className="client-id-pill">ID {clientId}</span>
            {loading ? <span className="client-loading"> · Loading…</span> : null}
          </p>

          {loadError && (
            <div className="client-banner error" role="alert">
              {loadError}{" "}
              <button type="button" className="link-button" onClick={loadDashboard}>
                Retry
              </button>
            </div>
          )}

          <section className="dashboard-section">
            <h3 className="section-title">Overview</h3>
            <div className="overview-grid client-overview-grid">
              <div className="stat-card">
                <span className="stat-label">Active job</span>
                <span className="stat-value client-stat-compact">
                  {loading ? "…" : currentInstallation ? `#${currentInstallation.id}` : "—"}
                </span>
                {currentInstallation && (
                  <span
                    className={`activity-status ${statusBadgeClass(currentInstallation.status)}`}
                  >
                    {currentInstallation.status}
                  </span>
                )}
              </div>
              <div className="stat-card">
                <span className="stat-label">Completed work</span>
                <span className="stat-value">{loading ? "…" : completedCount}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total installations</span>
                <span className="stat-value">{loading ? "…" : installations.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pending payments</span>
                <span className="stat-value">{loading ? "…" : pendingPaymentsCount}</span>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h3 className="section-title">Profile</h3>
            <div className="client-panel-card">
              {!isEditingProfile ? (
                <>
                  <div className="client-profile-grid">
                    <div className="client-field">
                      <span className="client-field-label">Name</span>
                      <span className="client-field-value">
                        {[profile.fname, profile.name].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                    <div className="client-field">
                      <span className="client-field-label">Email</span>
                      <span className="client-field-value">{profile.email || "—"}</span>
                    </div>
                    <div className="client-field">
                      <span className="client-field-label">Phone</span>
                      <span className="client-field-value">{profile.phone || "—"}</span>
                    </div>
                    <div className="client-field client-field-full">
                      <span className="client-field-label">Address</span>
                      <span className="client-field-value">{profile.address || "—"}</span>
                    </div>
                    {profile.customerType ? (
                      <div className="client-field">
                        <span className="client-field-label">Customer type</span>
                        <span className="client-field-value">{profile.customerType}</span>
                      </div>
                    ) : null}
                  </div>
                  <button type="button" className="client-btn-primary" onClick={handleEditProfile}>
                    Edit profile
                  </button>
                  {profileSaved && <p className="message-success">Profile saved.</p>}
                </>
              ) : (
                <form className="profile-form client-profile-form" onSubmit={handleSaveProfile}>
                  <div className="client-form-grid">
                    <label>
                      First name
                      <input
                        type="text"
                        value={profileDraft.fname}
                        onChange={(event) => {
                          setProfileDraft({ ...profileDraft, fname: event.target.value });
                          setProfileError("");
                        }}
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        type="text"
                        value={profileDraft.name}
                        onChange={(event) => {
                          setProfileDraft({ ...profileDraft, name: event.target.value });
                          setProfileError("");
                        }}
                      />
                    </label>
                    <label className="client-field-full">
                      Email
                      <input
                        type="email"
                        value={profileDraft.email}
                        onChange={(event) => {
                          setProfileDraft({ ...profileDraft, email: event.target.value });
                          setProfileError("");
                        }}
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        type="text"
                        value={profileDraft.phone}
                        onChange={(event) => {
                          setProfileDraft({ ...profileDraft, phone: event.target.value });
                          setProfileError("");
                        }}
                      />
                    </label>
                    <label className="client-field-full">
                      Address
                      <input
                        type="text"
                        value={profileDraft.address}
                        onChange={(event) => {
                          setProfileDraft({ ...profileDraft, address: event.target.value });
                          setProfileError("");
                        }}
                      />
                    </label>
                  </div>
                  {profileError && <p className="message-error">{profileError}</p>}
                  <div className="profile-actions">
                    <button type="submit" className="client-btn-primary" disabled={profileSaving}>
                      {profileSaving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="client-btn-secondary"
                      onClick={handleCancelEditProfile}
                      disabled={profileSaving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <h3 className="section-title">Current job</h3>
            <div className="client-panel-card">
              {!currentInstallation ? (
                <p className="client-muted">No installation data yet.</p>
              ) : (
                <>
                  <div className="client-job-header">
                    <div>
                      <div className="client-job-title">Installation #{currentInstallation.id}</div>
                      <div className="client-muted">
                        {currentInstallation.description || "No description"}
                      </div>
                    </div>
                    <span className={`activity-status ${statusBadgeClass(currentInstallation.status)}`}>
                      {currentInstallation.status}
                    </span>
                  </div>
                  <div className="client-job-meta">
                    <span>
                      <strong>Site</strong> {currentInstallation.address || "—"}
                    </span>
                    <span>
                      <strong>Scheduled</strong> {String(currentInstallation.scheduledDate || "—")}
                    </span>
                  </div>
                  <div className="progress-track client-progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${statusToProgress(currentInstallation.status)}%` }}
                    />
                  </div>
                  <p className="progress-text client-progress-label">
                    {statusToProgress(currentInstallation.status)}% complete (estimated from status)
                  </p>
                  <button
                    type="button"
                    className="client-btn-secondary"
                    onClick={() => handleOpenDetail(currentInstallation.id)}
                  >
                    View full details
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="dashboard-section">
            <h3 className="section-title">Work history</h3>
            {!historyRows.length ? (
              <div className="client-panel-card">
                <p className="client-muted">No past installations to show.</p>
              </div>
            ) : (
              <div className="client-table-wrap">
                <table className="client-data-table">
                  <thead>
                    <tr>
                      <th>Installation</th>
                      <th>Description</th>
                      <th>Completed</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((work) => (
                      <tr key={work.id}>
                        <td>{work.id}</td>
                        <td>{work.description || "—"}</td>
                        <td>{String(work.completedDate || "—")}</td>
                        <td>
                          <span className={`activity-status ${statusBadgeClass(work.status)}`}>
                            {work.status || "—"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => handleOpenDetail(work.id)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {(detailLoading || detailError || installationDetail) && (
            <section className="dashboard-section">
              <h3 className="section-title">Installation detail</h3>
              <div className="client-panel-card">
                {detailLoading && <p className="client-muted">Loading detail…</p>}
                {detailError && <p className="message-error">{detailError}</p>}
                {installationDetail && !detailLoading && (
                  <pre className="detail-json">{JSON.stringify(installationDetail, null, 2)}</pre>
                )}
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <h3 className="section-title">Payments</h3>
            {!payments.length ? (
              <div className="client-panel-card">
                <p className="client-muted">No payments on file.</p>
              </div>
            ) : (
              <div className="client-table-wrap">
                <table className="client-data-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th>Created</th>
                      <th>Amount</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id || `${p.createDate}-${p.totalAmount}`}>
                        <td>{p.id || "—"}</td>
                        <td>
                          <span className={`activity-status ${statusBadgeClass(p.status)}`}>
                            {p.status || "—"}
                          </span>
                        </td>
                        <td>{String(p.dueDate || "—")}</td>
                        <td>{String(p.createDate || "—")}</td>
                        <td>{p.totalAmount !== "" ? String(p.totalAmount) : "—"}</td>
                        <td>{p.paymentType || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-section client-reviews-dashboard-section">
            <h3 className="section-title">Your reviews</h3>
            <div className="client-panel-card client-reviews-card">
              <p className="client-reviews-intro">
                Share feedback linked to your account. Your team sees it on the admin reviews page;
                the review date is set automatically when you submit.
              </p>

              <div className="client-reviews-block">
                <h4 className="client-reviews-subtitle">Past reviews</h4>
                {myReviews.length > 0 ? (
                  <ul className="client-review-list">
                    {myReviews.map((r) => (
                      <li key={r.id} className="client-review-item">
                        <div className="client-review-item-top">
                          <span className="client-review-display-name">
                            {r.reviewName || "Review"}
                          </span>
                          <time
                            className="client-review-date-badge"
                            dateTime={String(r.reviewDate || "")}
                          >
                            {formatReviewDate(r.reviewDate)}
                          </time>
                        </div>
                        <div className="client-review-rating-row" aria-label={`${r.rating} out of 5 stars`}>
                          <span className="client-review-stars" aria-hidden>
                            {"★".repeat(Math.min(5, Math.max(0, r.rating)))}
                          </span>
                          <span className="client-review-rating-label">{r.rating} / 5</span>
                        </div>
                        {r.reviewComment ? (
                          <blockquote className="client-review-comment">{r.reviewComment}</blockquote>
                        ) : (
                          <p className="client-review-no-comment">No written comment</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="client-reviews-empty">
                    <p>You haven&apos;t submitted a review yet.</p>
                    <span className="client-reviews-empty-hint">
                      Use the form below when you&apos;re ready.
                    </span>
                  </div>
                )}
              </div>

              <div className="client-review-compose">
                <h4 className="client-reviews-subtitle">Write a new review</h4>
                <form className="client-review-form" onSubmit={handleSubmitReview}>
                  <div className="client-review-form-grid">
                    <label className="client-review-label">
                      <span className="client-review-label-text">Name to display</span>
                      <input
                        type="text"
                        className="client-review-input"
                        maxLength={100}
                        value={reviewName}
                        onChange={(e) => {
                          setReviewName(e.target.value);
                          setReviewError("");
                          setReviewSuccess(false);
                        }}
                        placeholder="How you'd like to appear publicly"
                        required
                      />
                    </label>
                    <label className="client-review-label client-review-label-rating">
                      <span className="client-review-label-text">Rating</span>
                      <select
                        className="client-review-select"
                        value={reviewRating}
                        onChange={(e) => {
                          setReviewRating(e.target.value);
                          setReviewError("");
                          setReviewSuccess(false);
                        }}
                      >
                        <option value="5">5 — Excellent</option>
                        <option value="4">4 — Good</option>
                        <option value="3">3 — Okay</option>
                        <option value="2">2 — Poor</option>
                        <option value="1">1 — Very poor</option>
                        <option value="0">0 — Lowest</option>
                      </select>
                    </label>
                    <label className="client-review-label client-review-label-full">
                      <span className="client-review-label-text">Comment (optional)</span>
                      <textarea
                        rows={4}
                        value={reviewComment}
                        onChange={(e) => {
                          setReviewComment(e.target.value);
                          setReviewError("");
                          setReviewSuccess(false);
                        }}
                        placeholder="Installation experience, support, quality — anything that helps us improve."
                        className="client-textarea client-review-textarea"
                      />
                    </label>
                  </div>
                  {reviewError && <p className="message-error client-review-feedback">{reviewError}</p>}
                  {reviewSuccess && (
                    <p className="message-success client-review-feedback">
                      Thanks — your review was saved.
                    </p>
                  )}
                  <div className="client-review-actions">
                    <button type="submit" className="client-btn-primary" disabled={reviewSubmitting}>
                      {reviewSubmitting ? "Submitting…" : "Submit review"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h3 className="section-title">Message admin</h3>
            <div className="client-panel-card">
              <form onSubmit={handleSubmitMessage} className="message-form client-message-form">
                <textarea
                  rows={5}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value);
                    setMessageSent(false);
                  }}
                  placeholder="Write your message to the admin team…"
                  className="message-textarea client-textarea"
                />
                <button type="submit" className="client-btn-primary">
                  Send message
                </button>
                {messageSent && (
                  <p className="message-success">
                    Message not sent to the server yet — wire up your team&apos;s message endpoint
                    when ready.
                  </p>
                )}
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
