import './adminShared.css'
import React, { useState, useEffect } from 'react'
import { API_BASE } from '../../config/apiBase.js'

const SKILLS = ['Camera Installation', 'Alarm Systems', 'Access Control', 'Network Setup']

function getInitials(fname, lname) {
    return `${fname?.[0] ?? ''}${lname?.[0] ?? ''}`.toUpperCase()
}

export default function AdminEmployees() {
    const [employees, setEmployees] = useState([])
    const [expanded, setExpanded] = useState(null)
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState('all')
    const [refresh, setRefresh] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [modalMode, setModalMode] = useState(null)
    const [selectedEmployee, setSelectedEmployee] = useState(null)
    const [selectedSkills, setSelectedSkills] = useState([])

    useEffect(() => {
        if (viewMode === 'allSkills') {
            fetchAllSkillEmployees()
        } else {
            fetchEmployees()
        }
    }, [refresh, viewMode])

    async function fetchEmployees() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/getEmployees`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            setEmployees(data)
        } catch (err) { console.error(err) }
    }

    async function fetchAllSkillEmployees() {
        try {
            const res = await fetch(`${API_BASE}/api/admin/employeesAllSkills`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            setEmployees(data)
            
        } catch (err) { console.error(err) }
    }

    async function handleFormSubmit(e) {
        e.preventDefault()
        const fd = new FormData(e.target)
        const body = {
            firstName: fd.get('firstName'), lastName: fd.get('lastName'),
            email: fd.get('email'), phone: fd.get('phone'),
            wage: fd.get('wage'), skills: selectedSkills
        }
        const url = modalMode === 'edit'
            ? `${API_BASE}/api/admin/updateEmployee`
            : `${API_BASE}/api/admin/addEmployee`
        const method = modalMode === 'edit' ? 'PUT' : 'POST'
        if (modalMode === 'edit') body.employeeid = selectedEmployee.employeeid
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify(body)
            })
            if (res.ok) { setRefresh(p => p + 1); setShowModal(false) }
        } catch (err) { console.error(err) }
    }

    async function deleteEmployee(employeeid) {
        try {
            const res = await fetch(`${API_BASE}/api/admin/deleteEmployee`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ employeeid })
            })
            if (res.ok) { setRefresh(p => p + 1); setExpanded(null) }
        } catch (err) { console.error(err) }
    }

    function toggleSkill(skill) {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        )
    }

    function openAdd() {
        setModalMode('add')
        setSelectedSkills([])
        setShowModal(true)
    }

    function openEdit(emp) {
        setModalMode('edit')
        setSelectedEmployee(emp)
        setSelectedSkills(emp.skills?.filter(Boolean) ?? [])
        setShowModal(true)
    }

    const filtered = employees.filter(e => {
        const name = `${e.fname} ${e.lname}`.toLowerCase()
        const q = search.toLowerCase()
        return name.includes(q) || e.email?.toLowerCase().includes(q) || e.phonenum?.includes(q)
    })

    return (
        <div>
            {showModal && (
                <div className="overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'edit' ? 'Edit Employee' : 'Add Employee'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="form-label">First Name</label>
                                        <input className="form-input" name="firstName" placeholder="Alice"
                                            defaultValue={modalMode === 'edit' ? selectedEmployee?.fname : ''} required />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Last Name</label>
                                        <input className="form-input" name="lastName" placeholder="Wong"
                                            defaultValue={modalMode === 'edit' ? selectedEmployee?.lname : ''} required />
                                    </div>
                                </div>
                                <div className="form-field full">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" name="email" type="email" placeholder="alice@example.com"
                                        defaultValue={modalMode === 'edit' ? selectedEmployee?.email : ''} required />
                                </div>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" name="phone" placeholder="6041234567"
                                            defaultValue={modalMode === 'edit' ? selectedEmployee?.phonenum : ''} required />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Wage ($/hr)</label>
                                        <input className="form-input" name="wage" placeholder="25"
                                            defaultValue={modalMode === 'edit' ? selectedEmployee?.wage : ''} required />
                                    </div>
                                </div>
                                <div className="form-field full">
                                    <label className="form-label">Skills</label>
                                    <div className="skill-pills">
                                        {SKILLS.map(skill => (
                                            <button key={skill} type="button"
                                                className={`skill-pill${selectedSkills.includes(skill) ? ' selected' : ''}`}
                                                onClick={() => toggleSkill(skill)}>
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="clients-btn-edit" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="clients-btn-primary">
                                    {modalMode === 'edit' ? 'Save Changes' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="clients-page">
                <div className="clients-main">
                    <div className="clients-page-header">
                        <div>
                            <h1 className="clients-page-title">Employees</h1>
                            <p className="clients-page-sub">Manage your team members</p>
                        </div>
                        <button className="clients-add-btn" onClick={openAdd}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Add Employee
                        </button>
                    </div>

                    <div className="clients-toolbar">
                        <div className="clients-search-wrap">
                            <svg className="clients-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                            <input className="clients-search-input" placeholder="Search employees…"
                                value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="clients-filter-row">
                            <button className={`clients-filter-btn${viewMode === 'all' ? ' active' : ''}`}
                                onClick={() => setViewMode('all')}>All</button>
                            <button className={`clients-filter-btn${viewMode === 'allSkills' ? ' active' : ''}`}
                                onClick={() => setViewMode('allSkills')}>All Skills</button>
                        </div>
                    </div>

                    <div className="clients-card-list">
                        {filtered.length === 0 ? (
                            <div className="clients-empty">No employees found.</div>
                        ) : filtered.map(emp => {
                            const isOpen = expanded === emp.employeeid
                            const skills = emp.skills?.filter(Boolean) ?? []
                            return (
                                <div key={emp.employeeid}
                                    className={`clients-card${isOpen ? ' open' : ''}`}
                                    onClick={() => setExpanded(prev => prev === emp.employeeid ? null : emp.employeeid)}>
                                    <div className="clients-card-row">
                                        <div className="clients-avatar">{getInitials(emp.fname, emp.lname)}</div>
                                        <div className="clients-card-info">
                                            <div className="clients-card-name">{emp.fname} {emp.lname}</div>
                                            <div className="clients-card-sub">{emp.email}</div>
                                        </div>
                                        <div className="clients-skills-row">
                                            {skills.slice(0, 2).map(s => (
                                                <span key={s} className="clients-skill-tag">{s}</span>
                                            ))}
                                            {skills.length > 2 && (
                                                <span className="clients-skill-tag">+{skills.length - 2}</span>
                                            )}
                                        </div>
                                        <span className="clients-badge residential">${emp.wage}/hr</span>
                                        <svg className={`clients-chevron${isOpen ? ' open' : ''}`}
                                            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="m9 18 6-6-6-6" />
                                        </svg>
                                    </div>

                                    {isOpen && (
                                        <div onClick={e => e.stopPropagation()}>
                                            <div className="clients-detail-grid">
                                                <div>
                                                    <div className="clients-detail-label">Phone</div>
                                                    <div className="clients-detail-value">{emp.phonenum || '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="clients-detail-label">Wage</div>
                                                    <div className="clients-detail-value">${emp.wage}/hr</div>
                                                </div>
                                                <div>
                                                    <div className="clients-detail-label">Skills</div>
                                                    <div className="clients-skills-row" style={{ marginTop: 4 }}>
                                                        {skills.length > 0
                                                            ? skills.map(s => <span key={s} className="clients-skill-tag">{s}</span>)
                                                            : <span className="clients-detail-value">—</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="clients-card-actions">
                                                <button className="clients-btn-edit" onClick={() => openEdit(emp)}>Edit</button>
                                                <button className="clients-btn-delete" onClick={() => deleteEmployee(emp.employeeid)}>Delete</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div className="clients-footer">
                        Showing {filtered.length} of {employees.length} employees
                        {viewMode === 'allSkills' && ' · filtered to all-skills'}
                    </div>
                </div>
            </div>
        </div>
    )
}
