import express from 'express'
import { getClients, getEmployees, getInstallations, getPayments } from '../controllers/apiController.js'

export const apiRouter = express.Router()

apiRouter.get('/clients', getClients)
apiRouter.get('/employees', getEmployees)
apiRouter.get('/installations', getInstallations)
apiRouter.get('/payments', getPayments)
