import express from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import {
    loginEmployee,
    getMyProfile,
    getMyAssignments,
    getMyServiceVisits,
    getMyStats,
    getJobBreakdown,
    getSkillMatchedColleagues,
    cancelJob,
    updateMyProfile
} from '../controllers/employeeController.js'

dotenv.config()

export const employeeRouter = express.Router()

function requireEmployee(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' })
    }
    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.role !== 'employee') {
            return res.status(403).json({ message: 'Access denied' })
        }
        req.employeeId = decoded.id
        next()
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

employeeRouter.post('/login', loginEmployee)
employeeRouter.get('/profile', requireEmployee, getMyProfile)
employeeRouter.get('/assignments', requireEmployee, getMyAssignments)
employeeRouter.get('/service-visits', requireEmployee, getMyServiceVisits)
employeeRouter.get('/stats', requireEmployee, getMyStats)
employeeRouter.get('/job-breakdown', requireEmployee, getJobBreakdown)
employeeRouter.get('/skill-matches', requireEmployee, getSkillMatchedColleagues)
employeeRouter.delete('/cancel-job/:installationid', requireEmployee, cancelJob)
employeeRouter.put('/update-profile', requireEmployee, updateMyProfile)
