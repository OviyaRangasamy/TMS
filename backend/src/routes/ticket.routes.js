const express = require('express');
const ticketController = require('../controllers/ticket.controller');
const {
  validateTicket,
  validateTicketStatus
} = require('../middleware/ticket.validation');
const authenticate = require('../middleware/authentication');
const authorizeRoles = require('../middleware/authorization');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorizeRoles('create tickets', 'ADMIN', 'DEVELOPER'),
  validateTicket,
  ticketController.createTicket
);
router.get('/', ticketController.getAllTickets);
router.get('/:id', ticketController.getTicketById);
router.put(
  '/:id',
  authorizeRoles('edit tickets', 'ADMIN', 'DEVELOPER'),
  validateTicket,
  ticketController.updateTicket
);
router.delete('/:id', authorizeRoles('delete tickets', 'ADMIN'), ticketController.deleteTicket);
router.patch(
  '/:id/status',
  authorizeRoles('move tickets', 'ADMIN', 'DEVELOPER'),
  validateTicketStatus,
  ticketController.updateTicketStatus
);

module.exports = router;
