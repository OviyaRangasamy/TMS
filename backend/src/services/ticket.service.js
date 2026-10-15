const mongoose = require('mongoose');
const Ticket = require('../models/ticket.model');

class TicketServiceError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'TicketServiceError';
    this.statusCode = statusCode;
  }
}

const validateTicketId = (ticketId) => {
  if (!mongoose.isValidObjectId(ticketId)) {
    throw new TicketServiceError('Invalid ticket ID', 400);
  }
};

const getTicketById = async (ticketId) => {
  validateTicketId(ticketId);

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new TicketServiceError('Ticket not found', 404);
  }

  return ticket;
};

const createTicket = async (ticketData) => {
  const ticket = new Ticket(ticketData);
  return ticket.save();
};

const getAllTickets = async () => Ticket.find().sort({ createdAt: -1 });

const updateTicket = async (ticketId, updates) => {
  validateTicketId(ticketId);

  const ticket = await Ticket.findByIdAndUpdate(ticketId, updates, {
    new: true,
    runValidators: true
  });

  if (!ticket) {
    throw new TicketServiceError('Ticket not found', 404);
  }

  return ticket;
};

const deleteTicket = async (ticketId) => {
  validateTicketId(ticketId);

  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) {
    throw new TicketServiceError('Ticket not found', 404);
  }

  return ticket;
};

const updateTicketStatus = async (ticketId, status) =>
  updateTicket(ticketId, { status });

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus
};
