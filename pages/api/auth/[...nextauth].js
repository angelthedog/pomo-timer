import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '../../../lib/mongoose';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          await dbConnect();
          console.log('Authorizing with credentials:', credentials);

          // Find user by username
          const user = await User.findOne({ username: credentials.username }).select('+password');
          console.log('User found:', user ? 'Yes' : 'No');
          
          // Check if user exists and password matches
          if (user && await bcrypt.compare(credentials.password, user.password)) {
            console.log('Password matched, returning user');
            return {
              id: user._id.toString(),
              name: user.username,
              email: user.username, // Using username as email for NextAuth
              timerSettings: user.timerSettings
            };
          }
          
          // Authentication failed
          console.log('Authentication failed');
          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.timerSettings = user.timerSettings;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.username;
      session.user.timerSettings = token.timerSettings;
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions); 