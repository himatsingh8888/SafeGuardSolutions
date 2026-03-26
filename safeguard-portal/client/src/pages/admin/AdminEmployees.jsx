import './AdminEmployee.css'
import React from 'react'

export default function AdminEmployees() {
    const [employees, setEmployees] = React.useState([])

    const employeeList = employees.map((employee) => (
        <div key={employee.id} className='employee'>
            <h4>{employee.fname} {employee.lname}</h4>
            <div>
                <p>{employee.email}</p>
                <p>{employee.phonenum}</p>
            </div>
            <div>
                <p className='skill-tag'>Camera Install</p>
                <p className='skill-tag'>Alarm System</p>
            </div>
            <h3 className='salary'>{employee.salary}</h3>
            <div className='buttons'>
                <button>Edit</button>
                <button>Delete</button>
            </div>


        </div>
    ))

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


    return (
        <div>
            <div className="Admin-Dashboard" style={{ padding: 24 }}>

                <div className="Employee-pg-header">
                    <div className='header-title'>
                        <h2>Employees</h2>
                        <p>Manage your team members</p>
                    </div>
                    <button>+Add Employee</button>
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