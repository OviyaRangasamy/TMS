const ticketService = require('../services/ticket.service');
const aiService = require('../services/ai.service');

const allowedTicketFields = [
  'title',
  'description',
  'priority',
  'status',
  'category',
  'assignee'
];

const pickTicketFields = (body) =>
  Object.fromEntries(
    allowedTicketFields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, body[field]])
  );

const handleError = (res, error) => {
  const statusCode = error.statusCode
    || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : null)
    || (error.code === 11000 ? 409 : 500);

  if (statusCode >= 500) {
    console.error('Ticket request failed:', error);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : error.message
  });
};

const createTicket = async (req, res) => {
  try {
    const ticket = await ticketService.createTicket({
      ...pickTicketFields(req.body),
      createdBy: req.user.id
    });
    return res.status(201).json({ data: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

const analyzeTicketDescription = async (req, res) => {
  try {
    const analysis = await aiService.analyzeTicketDescription(req.body.description);
    return res.status(200).json({ data: analysis });
  } catch (error) {
    if (error.code === 'AI_INVALID_INPUT') {
      return res.status(400).json({ message: error.message });
    }
    return handleError(res, error);
  }
};

const getAllTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getAllTickets();
    return res.status(200).json({ data: tickets });
  } catch (error) {
    return handleError(res, error);
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    return res.status(200).json({ data: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTicket = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicket(
      req.params.id,
      pickTicketFields(req.body)
    );
    return res.status(200).json({ data: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await ticketService.deleteTicket(req.params.id);
    return res.status(200).json({
      message: 'Ticket deleted successfully',
      data: ticket
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketStatus(
      req.params.id,
      req.body.status
    );
    return res.status(200).json({ data: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createTicket,
  analyzeTicketDescription,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus
};
