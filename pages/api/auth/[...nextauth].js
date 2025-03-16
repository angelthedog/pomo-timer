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
            console.log('User displayName:', user.displayName);
            
            return {
              id: user._id.toString(),
              name: user.username,
              displayName: user.displayName,
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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        console.log('JWT callback - user:', user);
        token.id = user.id;
        token.username = user.name;
        token.displayName = user.displayName;
        token.timerSettings = user.timerSettings;
        console.log('JWT callback - token after update:', token);
      }

      // Handle session update
      if (trigger === "update" && session?.user) {
        console.log('JWT update triggered with session:', session);
        if (session.user.displayName) {
          token.displayName = session.user.displayName;
          console.log('Updated token displayName:', token.displayName);
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token);
      session.user.id = token.id;
      session.user.name = token.username;
      session.user.displayName = token.displayName;
      session.user.timerSettings = token.timerSettings;
      console.log('Session callback - session after update:', session);
      return session;
    }
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('Sign in event:', user);
    },
    async signOut({ token, session }) {
      console.log('Sign out event');
    },
    async createUser({ user }) {
      console.log('Create user event:', user);
    },
    async updateUser({ user }) {
      console.log('Update user event:', user);
    },
    async session({ session, token }) {
      console.log('Session event:', session);
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
  secret: process.env.NEXTAUTH_SECRET || 'pomodoro_nextauth_secret_key_123456789',
};

export default NextAuth(authOptions); 