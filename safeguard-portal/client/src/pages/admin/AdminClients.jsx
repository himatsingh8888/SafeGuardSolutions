import './AdminClients.css'
import { API_BASE } from '../../config/apiBase.js'

import { useState, useEffect } from 'react'

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");

    useEffect(() => {
        fetchClients();
    }, []);

    async function fetchClients() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/getClients`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            const data = await res.json();
            setClients(data);
        } catch (error) {
            console.error(error);
        }
    }

    const filtered = clients.filter((c) => {
        const fullName = `${c.fname} ${c.lname}`.toLowerCase();
        const matchSearch =
            fullName.includes(search.toLowerCase()) ||
            c.email?.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filterType === "All" || c.customertype === filterType;
        return matchSearch && matchFilter;
    });

    function getInitials(fname, lname) {
        return `${fname?.[0] ?? ""}${lname?.[0] ?? ""}`.toUpperCase();
    }

    function toggle(id) {
        setExpanded((prev) => (prev === id ? null : id));
    }

    return (
        <div className="clients-page">
            <div className="clients-main">

                {/* Page header */}
                <div className="clients-page-header">
                    <div>
                        <h1 className="clients-page-title">Clients</h1>
                        <p className="clients-page-sub">Manage your clients</p>
                    </div>
                    <button className="clients-add-btn">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Client
                    </button>
                </div>

                {/* Toolbar */}
                <div className="clients-toolbar">
                    <div className="clients-search-wrap">
                        <svg className="clients-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            className="clients-search-input"
                            placeholder="Search clients…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="clients-filter-row">
                        {["All", "Commercial", "Residential"].map((f) => (
                            <button
                                key={f}
                                className={`clients-filter-btn${filterType === f ? " active" : ""}`}
                                onClick={() => setFilterType(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card list */}
                <div className="clients-card-list">
                    {filtered.length === 0 ? (
                        <div className="clients-empty">No clients found.</div>
                    ) : (
                        filtered.map((client) => {
                            const isOpen = expanded === client.clientid;
                            return (
                                <div
                                    key={client.clientid}
                                    className={`clients-card${isOpen ? " open" : ""}`}
                                    onClick={() => toggle(client.clientid)}
                                >
                                    {/* Card row */}
                                    <div className="clients-card-row">
                                        <div className="clients-avatar">
                                            {getInitials(client.fname, client.lname)}
                                        </div>
                                        <div className="clients-card-info">
                                            <div className="clients-card-name">{client.fname} {client.lname}</div>
                                            <div className="clients-card-email">{client.email}</div>
                                        </div>
                                        <span className={`clients-badge ${client.customertype === "Commercial" ? "commercial" : "residential"}`}>
                                            {client.customertype}
                                        </span>
                                        <svg
                                            className={`clients-chevron${isOpen ? " open" : ""}`}
                                            width="14" height="14" viewBox="0 0 24 24"
                                            fill="none" stroke="currentColor" strokeWidth="2"
                                        >
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>

                                    {/* Expanded details */}
                                    {isOpen && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <div className="clients-detail-grid">
                                                <div>
                                                    <div className="clients-detail-label">Phone</div>
                                                    <div className="clients-detail-value">{client.phone || "—"}</div>
                                                </div>
                                                <div>
                                                    <div className="clients-detail-label">Billing Address</div>
                                                    <div className="clients-detail-value">{client.billingaddress || "—"}</div>
                                                </div>
                                                <div>
                                                    <div className="clients-detail-label">Type</div>
                                                    <div className="clients-detail-value">{client.customertype}</div>
                                                </div>
                                            </div>
                                            <div className="clients-card-actions">
                                                <button className="clients-btn-edit">Edit</button>
                                                <button className="clients-btn-delete">Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="clients-footer">
                    Showing {filtered.length} of {clients.length} clients
                </div>

            </div>
        </div>
    );
}