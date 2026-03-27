import './AdminEmployee.css'
import React from 'react'

export default function AdminEmployees() {
    const [employees, setEmployees] = React.useState([])
    const [showModal, setShowModal] = React.useState(false);
    const [selectedSkills, setSelectedSkills] = React.useState([])

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
                <button>Edit</button>
                <button>Delete</button>
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
                const res = await fetch('http://localhost:5000/api/admin/getEmployees', {
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
    }, [])

    /*async function addEmployee(){
        try {
            const res = await fetch('http://localhost:5000/api/admin/addEmployee',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            })
            
        } catch (error) {
            
        }
    }*/

    async function handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target)

        const firstName = formData.get("firstName")
        const lastName = formData.get("lastName")
        const email = formData.get("email")
        const phone = formData.get("phone")
        const wage = formData.get("wage")

        try {
            const res = await fetch('http://localhost:5000/api/admin/addEmployee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firstName, lastName, email, phone, wage })
            })

            const data = await res.json()

            if (res.ok) {
                console.log('Employee succefully added')
            }
            else {
                console.log(data.message)
            }



        } catch (error) {

        }
    }

    return (
        <div>
            {showModal &&
                <div className='overlay'>
                    <div className='modal'>
                        <div className='add-header'>
                            <h1>Add Employee</h1>
                            <button onClick={() => { setShowModal(false) }}>x</button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className='name-fields'>
                                <div>
                                    <h3>FIRST NAME</h3>
                                    <input type="text" name="firstName" placeholder="eg. Alice" required />
                                </div>
                                <div>
                                    <h3>LAST NAME</h3>
                                    <input type="text" name="lastName" placeholder="eg. Wong" required />
                                </div>
                            </div>
                            <h3>EMAIL</h3>
                            <input className='email-input' type="text" name="email" placeholder="eg alice@wong.com" required />
                            <div className='phoneNwage'>
                                <div>
                                    <h3>PHONE</h3>
                                    <input type="text" name="phone" placeholder="911" required />
                                </div>
                                <div>
                                    <h3>WAGE ($/hr)</h3>
                                    <input type="text" name="wage" placeholder="eg. 25" required />
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
                                <button type="submit">Add Employee</button>
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
                    <button onClick={() => { setShowModal(true) }}>+Add Employee</button>
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