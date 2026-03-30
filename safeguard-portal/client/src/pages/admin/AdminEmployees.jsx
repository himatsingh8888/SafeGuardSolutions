import './AdminEmployee.css'
import React from 'react'
import { API_BASE } from '../../config/apiBase.js'

export default function AdminEmployees() {
    const [employees, setEmployees] = React.useState([])
    const [showModal, setShowModal] = React.useState(false);
    const [selectedSkills, setSelectedSkills] = React.useState([])
    const [refresh, setRefresh] = React.useState(0)
    const [modalMode, setModalMode] = React.useState(null)
    const [selectedEmployee, setSelectedEmployee] = React.useState(null)

    const skills = ['Camera Installation', 'Alarm Systems', 'Access Control', 'Network Setup']


    const employeeList = employees.map((employee) => (
        <div key={employee.employeeid} className='employee'>
            <h4>{employee.fname} {employee.lname}</h4>
            <div>
                <p>{employee.email}</p>
                <p>{employee.phonenum}</p>
            </div>
            <div>
                {employee.skills.map(skill => (
                    <p key={skill} className='skill-tag'>{skill}</p>
                ))}
            </div>
            <h2 className='salary'>${employee.wage}/hr</h2>
            <div className='buttons'>
                <button onClick={() => {
                    setModalMode('edit');
                    setShowModal(true);
                    setSelectedEmployee(employee);
                    setSelectedSkills(employee.skills || [])
                }}
                >Edit</button>

                <button onClick={() => { deleteEmployee(employee.employeeid) }}>Delete</button>
            </div>
        </div>
    ))

    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill))
        } else {
            setSelectedSkills([...selectedSkills, skill])
        }
    }

    React.useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/admin/getEmployees`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                const data = await res.json()
                setEmployees(data)
                console.log(data)
            } catch (error) {
                console.error(error)
            }
        }

        fetchEmployees()
    }, [refresh])



    async function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target)

        const firstName = formData.get("firstName")
        const lastName = formData.get("lastName")
        const email = formData.get("email")
        const phone = formData.get("phone")
        const wage = formData.get("wage")

        try {
            const res = await fetch(`${API_BASE}/api/admin/addEmployee`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firstName, lastName, email, phone, wage, skills: selectedSkills })
            })

            const data = await res.json()

            if (res.ok) {
                console.log('Employee succefully added')
                setRefresh(prev => prev + 1)
                setShowModal(false)
            }
            else {
                console.log(data.message)
            }



        } catch (error) {

        }
    }

    async function deleteEmployee(employeeid) {
        try {
            const res = await fetch(`${API_BASE}/api/admin/deleteEmployee`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ employeeid })

            })
            const data = await res.json()

            if (res.ok) {
                console.log(data.message)
                setRefresh(prev => prev + 1)


            }

        } catch (error) {
            console.log(error)

        }
    }

    async function updateEmployee(e) {
        e.preventDefault();
        const formData = new FormData(e.target)

        const firstName = formData.get("firstName")
        const lastName = formData.get("lastName")
        const email = formData.get("email")
        const phone = formData.get("phone")
        const wage = formData.get("wage")
        try {
            const res = await fetch(`${API_BASE}/api/admin/updateEmployee`, {
                method: 'UPDATE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firstName, lastName, email, phone, wage, skills: selectedSkills })

            })
            const data = await res.json()

            if (res.ok) {
                console.log(data.message)
                setRefresh(prev => prev + 1)


            }

        } catch (error) {
            console.log(error)

        }
    }


    return (
        <div>
            {showModal &&
                <div className='overlay'>
                    <div className='modal'>
                        <div className='add-header'>
                            <h1>{modalMode === 'edit' ? 'Edit Employee' : 'Add Employee'}</h1>
                            <button onClick={() => { setShowModal(false) }}>x</button>
                        </div>
                        <form onSubmit={modalMode === 'edit' ? updateEmployee : handleFormSubmit}>
                            <div className='name-fields'>
                                <div>
                                    <h3>FIRST NAME</h3>
                                    <input type="text" name="firstName" placeholder="eg. Alice" defaultValue={modalMode === 'edit' ? selectedEmployee?.fname : ''} required />
                                </div>
                                <div>
                                    <h3>LAST NAME</h3>
                                    <input type="text" name="lastName" placeholder="eg. Wong" defaultValue={modalMode === 'edit' ? selectedEmployee?.lname : ''} required />
                                </div>
                            </div>
                            <h3>EMAIL</h3>
                            <input className='email-input' type="text" name="email" placeholder="eg alice@wong.com" defaultValue={modalMode === 'edit' ? selectedEmployee?.email : ''} required />
                            <div className='phoneNwage'>
                                <div>
                                    <h3>PHONE</h3>
                                    <input type="text" name="phone" placeholder="911" defaultValue={modalMode === 'edit' ? selectedEmployee?.phonenum : ''} required />
                                </div>
                                <div>
                                    <h3>WAGE ($/hr)</h3>
                                    <input type="text" name="wage" placeholder="eg. 25" defaultValue={modalMode === 'edit' ? selectedEmployee?.wage : ''} required />
                                </div>
                            </div>
                            <h3>SKILLS</h3>
                            <div className="skills-options">
                                {skills.map(skill => (
                                    <span
                                        key={skill}
                                        className={`skill-option ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                                        onClick={() => toggleSkill(skill)}
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                            <div className='form-buttons'>
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit">{modalMode === 'edit' ? 'Edit Employee' : 'Add Employee'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            }
            <div className="Admin-Dashboard" style={{ padding: 24 }}>

                <div className="Employee-pg-header">
                    <div className='header-title'>
                        <h2>Employees</h2>
                        <p>Manage your team members</p>
                    </div>
                    <button onClick={() => { setShowModal(true); setModalMode('add') }}>+Add Employee</button>
                </div>
                <div className='Employees'>
                    <div className='Employee-Info'>
                        <h4>EMPLOYEE</h4>
                        <h4>CONTACT</h4>
                        <h4>SKILLS</h4>
                        <h4>WAGE</h4>
                        <h4>ACTIONS</h4>
                    </div>
                    {employeeList}
                </div>



            </div>
        </div>
    );
}