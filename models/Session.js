import mongoose from 'mongoose';

// Define the schema
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
      type: Number, // 1-5 star rating
      min: 1,
      max: 5,
      default: null,
    },
    endTimeUTC: {
      type: Date,
      default: Date.now,
    },
    endTimeLocal: {
      type: String,
      default: function() {
        return new Date().toLocaleString();
      }
    },
    timezone: {
      type: String,
      default: function() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    }
  },
  { timestamps: true }
);

// Log the schema for debugging
console.log('Session Schema:', SessionSchema);

// Delete the model if it exists to ensure it's recompiled with the new schema
if (mongoose.models.Session) {
  delete mongoose.models.Session;
}

// Create the model
const Session = mongoose.model('Session', SessionSchema);

export default Session; 