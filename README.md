# Focus Mind - Next.js App

A simple Focus Mind application built with Next.js, React, and API routes.

## Features

- Customizable work and break timers
- Visual progress indicator
- Settings persistence via API
- Timer event logging
- Statistics dashboard
- User authentication with MongoDB
- User profiles

## Getting Started

First, set up your environment variables by creating a `.env.local` file in the root directory with the following content:

```bash
MONGODB_URI=mongodb+srv://isabellaguan2009:<db_password>@cluster0.2rnab.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB=users
JWT_SECRET=your_jwt_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

Replace `<db_password>` with your actual MongoDB password.

Then, install the dependencies:

```bash
yarn install
# or
npm install
```

Run the development server:

```bash
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

This application includes several API routes:

- `/api/settings/default` - Get default timer settings
- `/api/settings/save` - Save user timer settings
- `/api/timer/log` - Log timer events (start, pause, resume, complete)
- `/api/timer/stats` - Get timer usage statistics
- `/api/auth/signup` - Register a new user
- `/api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `/api/user/update-profile` - Update user profile

## Project Structure

- `/components` - React components
- `/contexts` - React context providers
- `/pages` - Next.js pages and API routes
- `/styles` - CSS styles
- `/public` - Static assets
- `/models` - Mongoose models
- `/lib` - Utility functions and database connections

## Available Scripts

In the project directory, you can run:

### `yarn dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

### `yarn build`

Builds the app for production to the `.next` folder.

### `yarn start`

Starts the production server after building the app.

### `yarn lint`

Runs the linter to check for code issues.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
