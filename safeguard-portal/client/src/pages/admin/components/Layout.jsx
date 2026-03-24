import React from 'react'
import { Outlet } from "react-router-dom"
import AdminNavbar from "./AdminNavbar.jsx";
import AdminSubNavbar from "./AdminSubNavbar.jsx";
export default function Layout() {
    return (
        <>
            <AdminNavbar />
            <AdminSubNavbar />
            <Outlet />
        </>
    )
}