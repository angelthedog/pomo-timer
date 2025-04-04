import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // Log session data for debugging
  useEffect(() => {
    if (session) {
      console.log('Navbar session:', session);
      console.log('Navbar displayName:', session.user.displayName);
      console.log('Navbar name:', session.user.name);
    }
  }, [session]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignIn = () => {
    window.location.href = '/auth/signin';
  };

  const handleSignUp = () => {
    window.location.href = '/auth/signup';
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  // Get display name from session
  const displayName = session?.user?.displayName || session?.user?.name || '';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <a href="/" className="logo">
          <img src="/focusMind.png" alt="Focus Mind Icon" className="brand-icon" />
          <img src="/focusMindText.png" alt="Focus Mind" className="brand-text-logo" />
        </a>
      </div>

      <div className="navbar-menu">
        {session ? (
          <>
            <span className="welcome-text">Welcome, {displayName}</span>
            <div className="auth-buttons">
              <button 
                className="profile-button" 
                onClick={handleProfileClick}
              >
                Profile
              </button>
              <button 
                className="signout-button" 
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="auth-buttons">
            <button 
              className="signin-button" 
              onClick={handleSignIn}
            >
              Sign In
            </button>
            <button 
              className="signup-button" 
              onClick={handleSignUp}
            >
              Sign Up
            </button>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <div className="mobile-menu-button" onClick={toggleMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="menu-icon">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          {session ? (
            <>
              <span className="welcome-text">Welcome, {displayName}</span>
              <button 
                className="profile-button" 
                onClick={handleProfileClick}
              >
                Profile
              </button>
              <button 
                className="signout-button" 
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button 
                className="signin-button" 
                onClick={handleSignIn}
              >
                Sign In
              </button>
              <button 
                className="signup-button" 
                onClick={handleSignUp}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 10;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .navbar-brand {
          display: flex;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: inherit;
          transition: opacity 0.3s ease;
        }

        .logo:hover {
          opacity: 0.9;
        }

        .brand-icon {
          height: 32px;
          width: auto;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .brand-text-logo {
          height: 24px;
          width: auto;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .navbar-menu {
          display: flex;
          align-items: center;
        }

        .welcome-text {
          margin-right: 1rem;
          color: white;
        }

        .auth-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .signin-button, .profile-button {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .signup-button, .signout-button {
          background-color: #30384b;
          border: 1px solid rgba(255, 255, 255, 0.5);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .signin-button:hover, .profile-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .signup-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .signout-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .mobile-menu-button {
          display: none;
        }

        .menu-icon {
          width: 24px;
          height: 24px;
          color: white;
        }

        .mobile-menu {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 0.6rem 1rem;
          }

          .navbar-menu {
            display: none;
          }

          .mobile-menu-button {
            display: block;
            cursor: pointer;
          }

          .mobile-menu {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #30384b;
            padding: 1rem;
            gap: 0.5rem;
            z-index: 10;
          }

          .mobile-menu .welcome-text {
            margin-bottom: 0.5rem;
          }

          .mobile-menu button {
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .brand-icon {
            height: 28px;
          }

          .brand-text-logo {
            height: 20px;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar; 