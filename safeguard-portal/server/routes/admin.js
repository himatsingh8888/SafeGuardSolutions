import express from 'express'
import { deleteEmployee, getEmployees } from '../controllers/adminController.js';
import { addEmployee } from '../controllers/adminController.js';


export const adminRouter = express.Router();

adminRouter.get('/getEmployees', getEmployees)
adminRouter.post('/addEmployee', addEmployee)
adminRouter.delete('/deleteEmployee', deleteEmployee)

