import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';

export default async function handler(req, res) {
  // Only allow this to be run in development or by an admin
  if (process.env.NODE_ENV !== 'development' && req.headers.authorization !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    // Find all users without a displayName
    const users = await User.find({ displayName: { $exists: false } });
    
    console.log(`Found ${users.length} users without a display name`);
    
    // Update each user to set displayName = username
    const updatePromises = users.map(user => {
      return User.findByIdAndUpdate(
        user._id,
        { displayName: user.username },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      success: true, 
      message: `Updated ${users.length} users with display names` 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      message: 'Error running migration', 
      error: error.message 
    });
  }
} 