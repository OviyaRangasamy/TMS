const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const {
  validateTicket,
  validateTicketStatus
} = require('../middleware/ticket.validation');

const router = express.Router();

router.post('/', validateTicket, ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', validateTicket, ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);
router.patch(
  '/:id/status',
  validateTicketStatus,
  ticketController.updateTicketStatus
);

module.exports = router;
