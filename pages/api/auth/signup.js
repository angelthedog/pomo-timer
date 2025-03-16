import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { username, displayName, password } = req.body;

    // Validate input
    if (!username || !password || !displayName) {
      return res.status(400).json({ message: 'Username, display name, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new user
    const user = await User.create({
      username,
      displayName,
      password,
      timerSettings: {
        workMinutes: 45,
        breakMinutes: 15
      }
    });

    // Return success without password
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Error creating user', 
      error: error.message 
    });
  }
} 