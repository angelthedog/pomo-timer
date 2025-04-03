import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    duration: {
      type: Number, // in seconds
      required: true,
    },
    feedback: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    }
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model('Session', SessionSchema); 