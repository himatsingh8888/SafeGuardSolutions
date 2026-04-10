import './AdminClients.css'
import { API_BASE } from '../../config/apiBase.js'

import { useState, useEffect } from 'react'

export default function AdminClients() {
    const [clients, setClients] = useState([]);
    const [expanded, setExpanded] = useState(null);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");
    const [refresh, setRefresh] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState(null)
    const [selectedClient, setSelectedClient] = useState(null)

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        fetchClients();
    }, [refresh]);

    async function deleteClient(clientid) {
        try {
            const res = await fetch(`${API_BASE}/api/admin/deleteClient`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ clientid })
            })
            const data = await res.json()

            if (res.ok) {
                console.log(data.message)
                setRefresh(prev => prev + 1)
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function handleAddClient(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const firstName = formData.get("firstName");
        const lastName = formData.get("lastName");
        const email = formData.get("email");
        const phone = formData.get("phone");
        const billingaddress = formData.get("billingaddress");
        const customertype = formData.get("customertype");

        try {
            const res = await fetch(`${API_BASE}/api/admin/addClient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firstName, lastName, email, phone, billingaddress, customertype })
            });

            const data = await res.json();

            if (res.ok) {
                setRefresh(prev => prev + 1);
                setShowModal(false);
            } else {
                console.log(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

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

    async function updateClient(e) {
        e.preventDefault();
        const formData = new FormData(e.target)

        const firstName = formData.get("firstName")
        const lastName = formData.get("lastName")
        const email = formData.get("email")
        const phone = formData.get("phone")
        const billingaddress = formData.get("billingaddress")
        const customertype = formData.get("customertype")
        const clientid = selectedClient.clientid

        try {
            const res = await fetch(`${API_BASE}/api/admin/updateClient`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firstName, lastName, email, phone, billingaddress, customertype, clientid })
            })
            const data = await res.json()

            if (res.ok) {
                setRefresh(prev => prev + 1)
                setShowModal(false)
            } else {
                console.log(data.message)
            }
        } catch (error) {
            console.error(error)
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
        <div>
            {showModal && (
                <div className='overlay'>
                    <div className='modal'>
                        <div className='add-header'>
                            <h1>{modalMode === 'edit' ? 'Edit Client' : 'Add Client'}</h1>
                            <button onClick={() => setShowModal(false)}>x</button>
                        </div>
                        <form onSubmit={modalMode === 'edit' ? updateClient : handleAddClient}>
                            <div className='name-fields'>
                                <div>
                                    <h3>FIRST NAME</h3>
                                    <input type="text" name="firstName" placeholder="eg. Alice" defaultValue={modalMode === 'edit' ? selectedClient?.fname : ''} required />
                                </div>
                                <div>
                                    <h3>LAST NAME</h3>
                                    <input type="text" name="lastName" placeholder="eg. Wong" defaultValue={modalMode === 'edit' ? selectedClient?.lname : ''} required />
                                </div>
                            </div>
                            <h3>EMAIL</h3>
                            <input className='email-input' type="text" name="email" placeholder="eg. alice@wong.com" defaultValue={modalMode === 'edit' ? selectedClient?.email : ''} required />
                            <div className='phoneNwage'>
                                <div>
                                    <h3>PHONE</h3>
                                    <input type="text" name="phone" placeholder="eg. 6041234567" defaultValue={modalMode === 'edit' ? selectedClient?.phone : ''} required />
                                </div>
                                <div>
                                    <h3>TYPE</h3>
                                    <select name="customertype" defaultValue={modalMode === 'edit' ? selectedClient?.customertype : 'Residential'} required>
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                    </select>
                                </div>
                            </div>
                            <h3>BILLING ADDRESS</h3>
                            <input className='email-input' type="text" name="billingaddress" placeholder="eg. 123 Main St" defaultValue={modalMode === 'edit' ? selectedClient?.billingaddress : ''} />
                            <div className='form-buttons'>
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">{modalMode === 'edit' ? 'Edit Client' : 'Add Client'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <div className="clients-page">
                <div className="clients-main">

                    {/* Page header */}
                    <div className="clients-page-header">
                        <div>
                            <h1 className="clients-page-title">Clients</h1>
                            <p className="clients-page-sub">Manage your clients</p>
                        </div>
                        <button onClick={() => { setShowModal(true) }} className="clients-add-btn">
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
                                                    <button className="clients-btn-edit" onClick={() => {
                                                        setModalMode('edit');
                                                        setShowModal(true);
                                                        setSelectedClient(client);
                                                    }}>Edit</button>
                                                    <button onClick={() => deleteClient(client.clientid)} className="clients-btn-delete">Delete</button>
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
        </div>
    );
}