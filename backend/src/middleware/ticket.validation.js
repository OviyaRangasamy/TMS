const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const allowedStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const MAX_DESCRIPTION_LENGTH = 10000;

const validateTicket = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: ['Request body must be a JSON object']
    });
  }

  for (const field of ['title', 'description']) {
    if (typeof body[field] !== 'string' || body[field].trim().length === 0) {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  if (
    body.priority !== undefined
    && !allowedPriorities.includes(body.priority)
  ) {
    errors.push(`priority must be one of: ${allowedPriorities.join(', ')}`);
  }

  if (
    body.status !== undefined
    && !allowedStatuses.includes(body.status)
  ) {
    errors.push(`status must be one of: ${allowedStatuses.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  return next();
};

const validateTicketStatus = (req, res, next) => {
  const { status } = req.body || {};

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: [`status is required and must be one of: ${allowedStatuses.join(', ')}`]
    });
  }

  return next();
};

const validateTicketDescription = (req, res, next) => {
  const body = req.body;
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: ['Request body must be a JSON object']
    });
  }

  if (typeof body.description !== 'string' || body.description.trim().length === 0) {
    errors.push('description is required and must be a non-empty string');
  } else if (body.description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  return next();
};

module.exports = {
  validateTicket,
  validateTicketStatus,
  validateTicketDescription
};
