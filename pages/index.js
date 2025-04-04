import Head from 'next/head';
import Timer from '../components/Timer';
import Settings from '../components/Settings';
import { useSettings } from '../contexts/SettingsContext';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { showSettings } = useSettings();
  const { data: session } = useSession();
  const isAuthenticated = !!session;

  return (
    <>
      <Head>
        <title>Focus Mind</title>
        <meta name="description" content="A simple Focus Mind app" />
        <link rel="icon" href="/focusMind.png" />
      </Head>

      {showSettings && isAuthenticated ? <Settings /> : <Timer />}
    </>
  );
} 