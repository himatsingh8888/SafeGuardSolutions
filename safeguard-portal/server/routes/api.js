import express from 'express'
import { getClients, getEmployees, getInstallations, getPayments, getInventory, createQuoteRequest, getQuoteRequests, updateQuoteRequestStatus } from '../controllers/apiController.js'

export const apiRouter = express.Router()

apiRouter.get('/clients', getClients)
apiRouter.get('/employees', getEmployees)
apiRouter.get('/installations', getInstallations)
apiRouter.get('/payments', getPayments)
apiRouter.get('/inventory', getInventory)
apiRouter.get('/quote-request', getQuoteRequests)
apiRouter.post('/quote-request', createQuoteRequest)
apiRouter.patch('/quote-request/:id', updateQuoteRequestStatus)
