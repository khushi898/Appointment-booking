// Builds and configures the Express app. It does NOT start listening or connect to the DB —
// that happens in server.js — so tests can import the app directly.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { env } = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/service.routes');
const availabilityRoutes = require('./routes/availability.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Railway/Render sit behind one proxy. Trusting it lets req.ip be the real
// client IP, so the rate limiter limits each user rather than the proxy.
app.set('trust proxy', 1);

// Security headers (hides "X-Powered-By: Express", adds anti-sniffing headers, etc.)
app.use(helmet());

// Only our frontend origin(s) may call the API from a browser — never "*".
app.use(cors({ origin: env.clientOrigins }));

// Parse JSON bodies; cap size so huge payloads can't be used to overload the server.
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

// Must come after all routes: 404 for unknown routes, then the central error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
