import express from 'express'
import { addEmployee, deleteEmployee, getEmployees, getReviews } from '../controllers/adminController.js';


export const adminRouter = express.Router();

adminRouter.get('/getReviews', getReviews)
adminRouter.get('/getEmployees', getEmployees)
adminRouter.post('/addEmployee', addEmployee)
adminRouter.delete('/deleteEmployee', deleteEmployee)

