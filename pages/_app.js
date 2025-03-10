import '../styles/globals.css';
import 'react-circular-progressbar/dist/styles.css';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SessionProvider } from 'next-auth/react';
import Navbar from '../components/Navbar';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <SettingsProvider>
        <Navbar />
        <main>
          <Component {...pageProps} />
        </main>
      </SettingsProvider>
    </SessionProvider>
  );
}

export default MyApp; 