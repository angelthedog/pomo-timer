import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      maxlength: [60, 'Username cannot be more than 60 characters'],
    },
    displayName: {
      type: String,
      required: false,
      trim: true,
      maxlength: [60, 'Display name cannot be more than 60 characters'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    timerSettings: {
      workMinutes: {
        type: Number,
        default: 45,
      },
      breakMinutes: {
        type: Number,
        default: 15,
      },
      noiseCancellation: {
        type: Boolean,
        default: false,
      },
      pinkNoiseEnabled: {
        type: Boolean,
        default: false,
      },
      pinkNoiseType: {
        type: String,
        enum: ['Rainfall', 'Ocean waves', 'Wind', 'Rustling leaves', 'Heartbeat', 'Fire crackling'],
        default: 'Rainfall',
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.displayName) {
    this.displayName = this.username;
  }
  
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', UserSchema); 