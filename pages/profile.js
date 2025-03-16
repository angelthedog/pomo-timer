import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Profile() {
  const router = useRouter();
  const { data: session, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
    
    if (session?.user) {
      console.log('Current displayName from session:', session.user.displayName);
      console.log('Current name from session:', session.user.name);
      setDisplayName(session.user.displayName || session.user.name || '');
    }
  }, [session, status]);

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
          displayName,
        }),
      });

      const data = await res.json();
      console.log('Update response:', data);

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        // Update the session with the new display name
        // This will trigger the jwt callback with trigger="update"
        try {
          console.log('Updating session with new displayName:', displayName);
          await update({
            user: {
              displayName: displayName
            }
          });
          console.log('Session update completed');
        } catch (error) {
          console.error('Error updating session:', error);
        }
        
        // Redirect to the main page after a short delay
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
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
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <small>This is how you'll be identified in the app</small>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="cancel-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
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

        .button-group {
          display: flex;
          gap: 1rem;
        }

        .submit-button {
          flex: 1;
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

        .cancel-button {
          flex: 1;
          padding: 0.75rem;
          background-color: transparent;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-button:hover {
          background-color: #3dd67a;
        }

        .cancel-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
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