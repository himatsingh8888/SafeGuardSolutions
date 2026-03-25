import Navbar from "../../components/Navbar";
import { useEffect, useState } from "react";
import "./ClientDashboard.css";

const defaultClientProfile = {
  name: "Alex Carter",
  email: "alex.carter@example.com",
  phone: "(604) 555-0187",
  location: "Burnaby, BC",
};

export default function ClientDashboard() {
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [clientProfile, setClientProfile] = useState(defaultClientProfile);
  const [profileDraft, setProfileDraft] = useState(defaultClientProfile);

  useEffect(() => {
    const savedProfile = localStorage.getItem("clientProfile");
    if (!savedProfile) return;

    try {
      const parsedProfile = JSON.parse(savedProfile);
      setClientProfile(parsedProfile);
      setProfileDraft(parsedProfile);
    } catch (error) {
      console.error("Invalid saved profile data", error);
    }
  }, []);

  const workHistory = [
    { id: "WO-1205", service: "CCTV Camera Installation", completedOn: "2026-02-18", status: "Completed" },
    { id: "WO-1179", service: "Alarm Panel Repair", completedOn: "2026-01-29", status: "Completed" },
    { id: "WO-1143", service: "Motion Sensor Replacement", completedOn: "2025-12-12", status: "Completed" },
  ];

  const currentJob = {
    id: "WO-1241",
    service: "Smart Lock + Door Sensor Upgrade",
    progress: 65,
    eta: "2026-03-28",
  };

  const handleSubmitMessage = (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    // TODO: replace with backend endpoint when available.
    // Example: POST /api/client/messages
    setMessageSent(true);
    setMessage("");
  };

  const handleEditProfile = () => {
    setProfileDraft(clientProfile);
    setProfileSaved(false);
    setProfileError("");
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setProfileDraft(clientProfile);
    setProfileError("");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    setProfileSaved(false);

    const trimmedProfile = {
      name: profileDraft.name.trim(),
      email: profileDraft.email.trim(),
      phone: profileDraft.phone.trim(),
      location: profileDraft.location.trim(),
    };

    if (!trimmedProfile.name || !trimmedProfile.email || !trimmedProfile.phone || !trimmedProfile.location) {
      setProfileError("All profile fields are required.");
      return;
    }

    const emailIsValid = /\S+@\S+\.\S+/.test(trimmedProfile.email);
    if (!emailIsValid) {
      setProfileError("Enter a valid email address.");
      return;
    }

    // TODO: replace with backend endpoint when available.
    // Example: PUT /api/client/profile
    setClientProfile(trimmedProfile);
    setProfileDraft(trimmedProfile);
    localStorage.setItem("clientProfile", JSON.stringify(trimmedProfile));
    setProfileError("");
    setProfileSaved(true);
    setIsEditingProfile(false);
  };

  return (
    <div>
      <Navbar />

      <div className="client-dashboard-page">
        <h2>Client Dashboard</h2>
        <p className="client-dashboard-note">
          Frontend preview mode with placeholder data.
        </p>

        <section className="client-section">
          <h3>Client Profile</h3>
          <div className="client-card">
            {!isEditingProfile ? (
              <>
                <p><strong>Name:</strong> {clientProfile.name}</p>
                <p><strong>Email:</strong> {clientProfile.email}</p>
                <p><strong>Phone:</strong> {clientProfile.phone}</p>
                <p><strong>Location:</strong> {clientProfile.location}</p>
                <button type="button" className="secondary-button" onClick={handleEditProfile}>
                  Edit Profile
                </button>
                {profileSaved && (
                  <p className="message-success">
                    Profile updated in frontend. Connect API when endpoint is ready.
                  </p>
                )}
              </>
            ) : (
              <form className="profile-form" onSubmit={handleSaveProfile}>
                <label>
                  Name
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
                  Location
                  <input
                    type="text"
                    value={profileDraft.location}
                    onChange={(event) => {
                      setProfileDraft({ ...profileDraft, location: event.target.value });
                      setProfileError("");
                    }}
                  />
                </label>
                {profileError && <p className="message-error">{profileError}</p>}
                <div className="profile-actions">
                  <button type="submit" className="message-button">Save</button>
                  <button type="button" className="secondary-button" onClick={handleCancelEditProfile}>
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
            <p><strong>Work Order:</strong> {currentJob.id}</p>
            <p><strong>Service:</strong> {currentJob.service}</p>
            <p><strong>Estimated Completion:</strong> {currentJob.eta}</p>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
            <p className="progress-text">{currentJob.progress}% complete</p>
          </div>
        </section>

        <section className="client-section">
          <h3>History of Work</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Work Order</th>
                <th>Service</th>
                <th>Completed On</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workHistory.map((work) => (
                <tr key={work.id}>
                  <td>{work.id}</td>
                  <td>{work.service}</td>
                  <td>{work.completedOn}</td>
                  <td>{work.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                Message queued in frontend. Connect API when endpoint is ready.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}