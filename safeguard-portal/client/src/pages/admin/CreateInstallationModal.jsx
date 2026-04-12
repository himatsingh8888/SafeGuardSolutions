import './adminShared.css'

export default function CreateInstallationModal({
  open,
  onClose,
  locations,
  locationsLoading,
  createError,
  todayMin,
  onSubmit,
}) {
  if (!open) return null

  return (
    <div className="overlay" onClick={() => !locationsLoading && onClose()} role="presentation">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New installation</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
            disabled={locationsLoading}
          >
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="modal-body">
            {createError && (
              <p className="clients-delete-modal-error" role="alert" style={{ marginBottom: 12 }}>
                {createError}
              </p>
            )}
            {locationsLoading ? (
              <p className="adm-muted-inline">Loading sites…</p>
            ) : locations.length === 0 ? (
              <p className="adm-muted-inline">
                No locations (sites) in the database. Add clients and locations first, then create an installation.
              </p>
            ) : (
              <>
                <div className="form-field full">
                  <label className="form-label" htmlFor="inst-siteid">Site (location)</label>
                  <select id="inst-siteid" name="siteid" className="form-select" required>
                    <option value="">Select a site…</option>
                    {locations.map((loc) => (
                      <option key={loc.siteid} value={loc.siteid}>
                        #{loc.siteid} — {loc.address} ({[loc.fname, loc.lname].filter(Boolean).join(' ') || `client ${loc.client}`})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="inst-scheduled">Scheduled date</label>
                    <input
                      id="inst-scheduled"
                      name="scheduleddate"
                      className="form-input"
                      type="date"
                      required
                      min={todayMin}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="inst-techs">Technicians</label>
                    <input
                      id="inst-techs"
                      name="techniciannumbs"
                      className="form-input"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={1}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label" htmlFor="inst-internal">Internal cost</label>
                    <input
                      id="inst-internal"
                      name="internalcost"
                      className="form-input"
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={0}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label" htmlFor="inst-price">Price</label>
                    <input
                      id="inst-price"
                      name="price"
                      className="form-input"
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={0}
                    />
                  </div>
                </div>
                <div className="form-field full">
                  <label className="form-label" htmlFor="inst-desc">Description</label>
                  <input id="inst-desc" name="description" className="form-input" type="text" placeholder="Optional" />
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="clients-btn-edit" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="clients-btn-primary"
              disabled={locationsLoading || locations.length === 0}
            >
              Create installation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
