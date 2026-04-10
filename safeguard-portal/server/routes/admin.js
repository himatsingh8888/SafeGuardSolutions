import express from 'express'
import {
    deleteEmployee, getEmployees, addEmployee, updateEmployee,
    addInventory, deleteInventory, updateInventory, getInventory,
    updateQuoteRequest, deleteQuoteRequest,
    getClients, addClient, deleteClient, updateClient, getReviews, getEmployeesAllSkills
} from '../controllers/adminController.js';



export const adminRouter = express.Router();

adminRouter.get('/getReviews', getReviews)
//Employee Routes
adminRouter.get('/getEmployees', getEmployees)
adminRouter.post('/addEmployee', addEmployee)
adminRouter.delete('/deleteEmployee', deleteEmployee)
adminRouter.put('/updateEmployee', updateEmployee)

// Inventory routes
adminRouter.get('/getInventory', getInventory)
adminRouter.post('/addInventory', addInventory)
adminRouter.delete('/deleteInventory', deleteInventory)
adminRouter.put('/updateInventory', updateInventory)

// Quote Request routes
adminRouter.put('/updateQuoteRequest', updateQuoteRequest)
adminRouter.delete('/deleteQuoteRequest', deleteQuoteRequest)

//Client Routes
adminRouter.get('/getClients', getClients)
adminRouter.post('/addClient', addClient)
adminRouter.put('/updateClient', updateClient)
adminRouter.delete('/deleteClient', deleteClient)
adminRouter.get('/employeesAllSkills', getEmployeesAllSkills)



