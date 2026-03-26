import express from 'express'
const clientRouter = express.Router();

import {
  getClient,
  updateClient,
  getClientInstallations,
  getInstallationDetail,
  getClientPayments,
}  from '../controllers/clientController.js';

router.get('/:clientID', getClient);
router.put('/:clientID', updateClient);
router.get('/:clientID/installations', getClientInstallations);
router.get('/:clientID/installations/:installationID', getInstallationDetail);
router.get('/:clientID/payments', getClientPayments);

