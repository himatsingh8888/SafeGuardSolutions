import express from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import {
    loginClient,
    getMyProfile,
    updateMyProfile,
    getMyInstallations,
    cancelInstallation,
    getMyPayments,
    getPaymentSummary,
    getPaymentBreakdown,
    getSimilarClients,
    getMyReviews,
    submitReview,
} from '../controllers/clientAuthController.js'

dotenv.config()

const router = express.Router()

function requireClient(req, res, next) {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token provided' })
    try {
        const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET)
        if (payload.role !== 'client') return res.status(403).json({ message: 'Not a client account' })
        req.clientId = payload.id
        next()
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

router.post('/login', loginClient)
router.get('/me', requireClient, getMyProfile)
router.put('/profile', requireClient, updateMyProfile)
router.get('/installations', requireClient, getMyInstallations)
router.delete('/installations/:id', requireClient, cancelInstallation)
router.get('/payments', requireClient, getMyPayments)
router.get('/payment-summary', requireClient, getPaymentSummary)
router.get('/payment-breakdown', requireClient, getPaymentBreakdown)
router.get('/similar-clients', requireClient, getSimilarClients)
router.get('/reviews', requireClient, getMyReviews)
router.post('/reviews', requireClient, submitReview)

export { router as clientAuthRouter }
