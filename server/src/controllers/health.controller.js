const mongoose = require('mongoose');

// GET /api/health — lets us (and Railway) check that the API is up and the DB is connected.
function getHealth(req, res) {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      // readyState is a number (0-3); mongoose.STATES turns it into 'connected', 'disconnected'...
      database: mongoose.STATES[mongoose.connection.readyState],
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getHealth };
