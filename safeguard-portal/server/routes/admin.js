import express from 'express'
import { deleteEmployee, getEmployees, addEmployee, updateEmployee } from '../controllers/adminController.js';



export const adminRouter = express.Router();

adminRouter.get('/getEmployees', getEmployees)
adminRouter.post('/addEmployee', addEmployee)
adminRouter.delete('/deleteEmployee', deleteEmployee)
adminRouter.put('/updateEmployee', updateEmployee)

