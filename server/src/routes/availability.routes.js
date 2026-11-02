const express = require('express');
const {
  listAvailability,
  getAvailability,
  setAvailability,
  deleteAvailability,
} = require('../controllers/availability.controller');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { dateParam, setSlotsSchema, rangeQuery } = require('../validators/availability.validators');

const router = express.Router();

router.get('/', validate(rangeQuery, 'query'), listAvailability);

router
  .route('/:date')
  .get(validate(dateParam, 'params'), getAvailability)
  .put(protect, adminOnly, validate(dateParam, 'params'), validate(setSlotsSchema), setAvailability)
  .delete(protect, adminOnly, validate(dateParam, 'params'), deleteAvailability);

module.exports = router;
