import { getToken } from 'next-auth/jwt';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the token from the request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('Token from request:', token);

    await dbConnect();

    const { displayName } = req.body;

    if (!displayName) {
      return res.status(400).json({ message: 'Display name is required' });
    }

    console.log('Updating user with ID:', token.id);
    console.log('New display name:', displayName);

    // Find user before update to check current values
    const userBefore = await User.findById(token.id);
    console.log('User before update:', userBefore);

    if (!userBefore) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user directly to ensure the displayName is set
    userBefore.displayName = displayName;
    await userBefore.save();

    // Get the updated user
    const user = await User.findById(token.id);
    console.log('User after update:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found after update' });
    }

    // Return the updated user
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: error.message 
    });
  }
} 