import express from 'express'

import {
  getClient,
  updateClient,
  getClientInstallations,
  getInstallationDetail,
  getClientPayments,
} from '../controllers/clientController.js';



const clientRouter = express.Router();
clientRouter.get('/:clientID', getClient);
clientRouter.put('/:clientID', updateClient);
clientRouter.get('/:clientID/installations', getClientInstallations);
clientRouter.get('/:clientID/installations/:installationID', getInstallationDetail);
clientRouter.get('/:clientID/payments', getClientPayments);

export { clientRouter };

