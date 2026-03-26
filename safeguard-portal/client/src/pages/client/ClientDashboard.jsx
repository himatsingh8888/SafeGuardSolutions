import Navbar from "../../components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import "./ClientDashboard.css";
import {
  fetchClient,
  fetchInstallationDetail,
  fetchInstallations,
  fetchPayments,
  getStoredClientId,
  statusToProgress,
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
      const [clientRow, instList, payList] = await Promise.all([
        fetchClient(clientId),
        fetchInstallations(clientId, INSTALLATION_LIST_LIMIT),
        fetchPayments(clientId),
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
        <div className="client-dashboard-page">
          <h2>Client Dashboard</h2>
          <p className="client-dashboard-note message-error">
            No client ID found. Log in with an account that returns <code>clientId</code> from
            <code> /api/auth/login</code>, or set <code>VITE_DEV_CLIENT_ID</code> in a{" "}
            <code>.env</code> file for local testing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className="client-dashboard-page">
        <h2>Client Dashboard</h2>
        <p className="client-dashboard-note">
          Client ID: <strong>{clientId}</strong>
          {loading && " · Loading…"}
        </p>

        {loadError && (
          <div className="client-banner error" role="alert">
            {loadError}{" "}
            <button type="button" className="link-button" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        <section className="client-section">
          <h3>Client Profile</h3>
          <div className="client-card">
            {!isEditingProfile ? (
              <>
                <p>
                  <strong>Name:</strong> {[profile.fname, profile.name].filter(Boolean).join(" ") || "—"}
                </p>
                <p><strong>Email:</strong> {profile.email || "—"}</p>
                <p><strong>Phone:</strong> {profile.phone || "—"}</p>
                <p><strong>Location:</strong> {profile.address || "—"}</p>
                {profile.customerType ? (
                  <p><strong>Customer type:</strong> {profile.customerType}</p>
                ) : null}
                <button type="button" className="secondary-button" onClick={handleEditProfile}>
                  Edit Profile
                </button>
                {profileSaved && (
                  <p className="message-success">Profile saved.</p>
                )}
              </>
            ) : (
              <form className="profile-form" onSubmit={handleSaveProfile}>
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
                <label>
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
                <label>
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
                {profileError && <p className="message-error">{profileError}</p>}
                <div className="profile-actions">
                  <button type="submit" className="message-button" disabled={profileSaving}>
                    {profileSaving ? "Saving…" : "Save"}
                  </button>
                  <button type="button" className="secondary-button" onClick={handleCancelEditProfile} disabled={profileSaving}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <section className="client-section">
          <h3>Progress on Current Job</h3>
          <div className="client-card">
            {!currentInstallation ? (
              <p>No installation data yet.</p>
            ) : (
              <>
                <p><strong>Installation:</strong> {currentInstallation.id}</p>
                <p><strong>Description:</strong> {currentInstallation.description || "—"}</p>
                <p><strong>Site address:</strong> {currentInstallation.address || "—"}</p>
                <p><strong>Scheduled:</strong> {String(currentInstallation.scheduledDate || "—")}</p>
                <p><strong>Status:</strong> {currentInstallation.status || "—"}</p>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${statusToProgress(currentInstallation.status)}%` }}
                  />
                </div>
                <p className="progress-text">{statusToProgress(currentInstallation.status)}% (estimated from status)</p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleOpenDetail(currentInstallation.id)}
                >
                  View full details
                </button>
              </>
            )}
          </div>
        </section>

        <section className="client-section">
          <h3>History of Work</h3>
          {!historyRows.length ? (
            <p className="client-dashboard-note">No past installations to show.</p>
          ) : (
            <table className="history-table">
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
                    <td>{work.status || "—"}</td>
                    <td>
                      <button type="button" className="link-button" onClick={() => handleOpenDetail(work.id)}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {(detailLoading || detailError || installationDetail) && (
          <section className="client-section">
            <h3>Installation detail</h3>
            <div className="client-card">
              {detailLoading && <p>Loading detail…</p>}
              {detailError && <p className="message-error">{detailError}</p>}
              {installationDetail && !detailLoading && (
                <pre className="detail-json">{JSON.stringify(installationDetail, null, 2)}</pre>
              )}
            </div>
          </section>
        )}

        <section className="client-section">
          <h3>Payments</h3>
          {!payments.length ? (
            <p className="client-dashboard-note">No payments on file.</p>
          ) : (
            <table className="history-table">
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
                    <td>{p.status || "—"}</td>
                    <td>{String(p.dueDate || "—")}</td>
                    <td>{String(p.createDate || "—")}</td>
                    <td>{p.totalAmount !== "" ? String(p.totalAmount) : "—"}</td>
                    <td>{p.paymentType || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="client-section">
          <h3>Message Admin</h3>
          <form onSubmit={handleSubmitMessage} className="message-form">
            <textarea
              rows="5"
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setMessageSent(false);
              }}
              placeholder="Write your message to admin..."
              className="message-textarea"
            />
            <button type="submit" className="message-button">
              Send Message
            </button>
            {messageSent && (
              <p className="message-success">
                Message not sent to server yet — add a message endpoint when your team is ready.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
