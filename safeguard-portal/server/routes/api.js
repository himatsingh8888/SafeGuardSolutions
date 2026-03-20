import express from 'express'
import { getClients } from '../controllers/apiController.js'

export const apiRouter = express.Router()

apiRouter.get('/clients', getClients)