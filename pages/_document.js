import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* PWA manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Theme color for browser UI */}
          <meta name="theme-color" content="#1e2433" />
          
          {/* Apple touch icon */}
          <link rel="apple-touch-icon" href="/icons/192.png" />
          
          {/* iOS meta tags */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Focus Mind" />
          
          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#1e2433" />
          <meta name="msapplication-TileImage" content="/icons/192.png" />
          
          {/* Favicon */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icons/32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/icons/16.png" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 