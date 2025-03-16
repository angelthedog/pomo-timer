import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    mode: {
      type: String,
      enum: ['work', 'break'],
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    feedback: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    events: [
      {
        type: {
          type: String,
          enum: ['started', 'paused', 'resumed', 'completed'],
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model('Session', SessionSchema); 