import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }

    if (session?.user) {
      setUsername(session.user.name);
    }
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Profile - Focus Mind</title>
      </Head>

      <div className="profile-container">
        <div className="profile-card">
          <h1>Your Profile</h1>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <small>This is how you'll be identified in the app</small>
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .profile-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 150px);
          padding: 2rem;
        }

        .profile-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 2rem;
          width: 100%;
          max-width: 500px;
        }

        h1 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: white;
        }

        .message {
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
        }

        .message.success {
          background-color: rgba(74, 236, 140, 0.2);
          color: #4aec8c;
        }

        .message.error {
          background-color: rgba(245, 78, 78, 0.2);
          color: #f54e4e;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: white;
        }

        input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: #4aec8c;
        }

        small {
          display: block;
          margin-top: 0.25rem;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4aec8c;
          color: #30384b;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .submit-button:hover {
          background-color: #3dd67a;
        }

        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 150px);
          color: white;
          font-size: 1.2rem;
        }
      `}</style>
    </>
  );
} 