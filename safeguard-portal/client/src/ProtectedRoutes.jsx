import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function ProtectedRoutes({ children }) {
    const token = localStorage.getItem('token')

    if (!token) {
        return <Navigate to="/login" />
    }
    return children
}