const express = require('express');
const {
  bookAppointment,
  listMyAppointments,
  cancelMyAppointment,
  listAllAppointments,
  updateAppointmentStatus,
  getAppointmentStats,
} = require('../controllers/appointment.controller');
const { protect, adminOnly } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validators');
const {
  bookAppointmentSchema,
  myAppointmentsQuery,
  adminListQuery,
  updateStatusSchema,
} = require('../validators/appointment.validators');

const router = express.Router();

// Every appointment route needs a logged-in user
router.use(protect);

// User
router.post('/', validate(bookAppointmentSchema), bookAppointment);
router.get('/me', validate(myAppointmentsQuery, 'query'), listMyAppointments);
router.patch('/:id/cancel', validate(idParam, 'params'), cancelMyAppointment);

// Admin
router.get('/', adminOnly, validate(adminListQuery, 'query'), listAllAppointments);
router.get('/stats', adminOnly, getAppointmentStats);
router.patch(
  '/:id/status',
  adminOnly,
  validate(idParam, 'params'),
  validate(updateStatusSchema),
  updateAppointmentStatus
);

module.exports = router;
