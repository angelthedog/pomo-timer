import { getToken } from 'next-auth/jwt';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the token from the request
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    await dbConnect();

    // Find and delete the user
    const user = await User.findByIdAndDelete(token.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return success response
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      message: 'Error deleting account', 
      error: error.message 
    });
  }
} 