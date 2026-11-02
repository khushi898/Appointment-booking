// Builds and configures the Express app. It does NOT start listening or connect to the DB —
// that happens in server.js — so tests can import the app directly.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { env } = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers (hides "X-Powered-By: Express", adds anti-sniffing headers, etc.)
app.use(helmet());

// Only our frontend origin(s) may call the API from a browser — never "*".
app.use(cors({ origin: env.clientOrigins }));

// Parse JSON bodies; cap size so huge payloads can't be used to overload the server.
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/health', healthRoutes);

// Must come after all routes: 404 for unknown routes, then the central error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
