const express = require('express');
const {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/service.controller');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuery,
} = require('../validators/service.validators');

const router = express.Router();

router
  .route('/')
  .get(optionalAuth, validate(listServicesQuery, 'query'), listServices)
  .post(protect, adminOnly, validate(createServiceSchema), createService);

router
  .route('/:id')
  .get(optionalAuth, getService)
  .patch(protect, adminOnly, validate(updateServiceSchema), updateService)
  .delete(protect, adminOnly, deleteService);

module.exports = router;
