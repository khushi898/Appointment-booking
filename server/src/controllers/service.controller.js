const Service = require('../models/Service');
const ApiError = require('../utils/ApiError');
const { getSkip, buildPagination, escapeRegex } = require('../utils/pagination');

const isAdmin = (req) => req.user?.role === 'admin';

// GET /api/services?page=&limit=&search=&sort=&includeInactive=
async function listServices(req, res) {
  const { page, limit, search, sort, includeInactive } = req.validatedQuery;

  if (includeInactive && !isAdmin(req)) {
    throw new ApiError(403, 'Forbidden: only admins can view inactive services');
  }

  const filter = includeInactive ? {} : { isActive: true };
  if (search) {
    // case-insensitive "contains" match on name or description
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  // Run the page query and the total count at the same time
  const [services, total] = await Promise.all([
    Service.find(filter).sort(sort).skip(getSkip(page, limit)).limit(limit),
    Service.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { services, pagination: buildPagination(page, limit, total) },
  });
}

// Finds a service by id. Inactive services count as "not found" for non-admins.
async function findServiceOr404(req) {
  const service = await Service.findById(req.params.id);
  if (!service || (!service.isActive && !isAdmin(req))) {
    throw new ApiError(404, 'Service not found');
  }
  return service;
}

// GET /api/services/:id
async function getService(req, res) {
  const service = await findServiceOr404(req);
  res.status(200).json({ success: true, data: { service } });
}

// POST /api/services (admin)
async function createService(req, res) {
  // A duplicate name hits the unique index -> error handler returns 409
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: { service } });
}

// PATCH /api/services/:id (admin) — updates only the fields sent
async function updateService(req, res) {
  const service = await findServiceOr404(req);
  service.set(req.body);
  await service.save(); // save() re-runs schema validation
  res.status(200).json({ success: true, data: { service } });
}

// DELETE /api/services/:id (admin) — soft delete, see isActive in the model
async function deleteService(req, res) {
  const service = await findServiceOr404(req);
  service.isActive = false;
  await service.save();
  res.status(200).json({ success: true, message: 'Service deleted', data: { service } });
}

module.exports = { listServices, getService, createService, updateService, deleteService };
