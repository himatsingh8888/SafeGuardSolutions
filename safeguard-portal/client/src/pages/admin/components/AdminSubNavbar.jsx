import { NavLink } from "react-router-dom";
import '../../../index.css'

export default function AdminSubNavbar() {
    return (
        <div className="admin-sub-navbar">
            <NavLink
                to="/admin"
                end
                className={({ isActive }) => isActive ? "active-link" : null}
            >Home</NavLink>

            <NavLink
                to="/admin/clients"
                className={({ isActive }) => isActive ? "active-link" : null}
            >Clients</NavLink>

            <NavLink
                to="/admin/employees"
                className={({ isActive }) => isActive ? "active-link" : null}
            >Employees</NavLink>

            <NavLink
                to="/admin/installations"
                className={({ isActive }) => isActive ? "active-link" : null}
            >Installations</NavLink>

            <NavLink
                className={({ isActive }) => isActive ? "active-link" : null}
                to="/admin/inventory"
            >Inventory</NavLink>

            <NavLink
                className={({ isActive }) => isActive ? "active-link" : null}
                to="/admin/payments"
            >Payments</NavLink>

            <NavLink
                className={({ isActive }) => isActive ? "active-link" : null}
                to="/admin/service"
            >Service Visit</NavLink>

            <NavLink
                className={({ isActive }) => isActive ? "active-link" : null}
                to="/admin/reviews"
            >Reviews</NavLink>

            <NavLink
                className={({ isActive }) => isActive ? "active-link" : null}
                to="/admin/quote-requests"
            >Quote Requests</NavLink>
        </div>
    )
}