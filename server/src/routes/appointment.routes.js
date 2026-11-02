const express = require('express');
const {
  bookAppointment,
  listMyAppointments,
  cancelMyAppointment,
} = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common.validators');
const { bookAppointmentSchema, myAppointmentsQuery } = require('../validators/appointment.validators');

const router = express.Router();

// Every appointment route needs a logged-in user
router.use(protect);

router.post('/', validate(bookAppointmentSchema), bookAppointment);
router.get('/me', validate(myAppointmentsQuery, 'query'), listMyAppointments);
router.patch('/:id/cancel', validate(idParam, 'params'), cancelMyAppointment);

module.exports = router;
