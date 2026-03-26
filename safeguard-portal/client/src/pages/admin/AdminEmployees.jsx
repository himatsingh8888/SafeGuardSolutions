import './AdminEmployee.css'

export default function AdminEmployees() {

    const employees =
        <div className='employee'>
            <h4>Alice Wong</h4>
            <div>
                <p>alice@wong.com</p>
                <p>604-511-1796</p>
            </div>
            <div>
                <p className='skill-tag'>Camera Install</p>
                <p className='skill-tag'>Alarm System</p>
            </div>
            <h3 className='salary'>$25/hr</h3>
            <div className='buttons'>
                <button>Edit</button>
                <button>Delete</button>
            </div>


        </div>
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
                    {employees}
                    {employees}
                    {employees}
                    {employees}
                    {employees}
                    {employees}
                </div>



            </div>
        </div>
    );
}