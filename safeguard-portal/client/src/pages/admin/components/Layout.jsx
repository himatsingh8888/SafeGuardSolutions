import React from 'react'
import { Outlet } from "react-router-dom"
import AdminNavbar from "./AdminNavbar.jsx";
import AdminSubNavbar from "./AdminSubNavbar.jsx";
import '../adminLayoutOverrides.css'

export default function Layout() {
    return (
        <div className="admin-layout-root">
            <AdminNavbar />
            <AdminSubNavbar />
            <Outlet />
        </div>
    )
}