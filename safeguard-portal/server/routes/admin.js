import express from 'express'
import { getEmployees } from '../controllers/adminController.js';

export const adminRouter = express.Router();

adminRouter.get('/getEmployees', getEmployees)

