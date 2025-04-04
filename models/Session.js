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
    }
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model('Session', SessionSchema); 