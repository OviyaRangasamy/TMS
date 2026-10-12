const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Priority must be LOW, MEDIUM, HIGH, or CRITICAL'
      }
    },
    status: {
      type: String,
      enum: {
        values: ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        message: 'Status must be NEW, IN_PROGRESS, RESOLVED, or CLOSED'
      }
    },
    category: {
      type: String,
      trim: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
