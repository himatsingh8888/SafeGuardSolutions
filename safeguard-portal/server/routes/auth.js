import express from 'express'
import { loginUser } from '../controllers/authController.js'

export const authRouter = express.Router();

authRouter.post('/login', loginUser)