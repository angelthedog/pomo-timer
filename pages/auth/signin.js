import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Signing in with:', { username, password });
      
      const result = await signIn('credentials', {
        redirect: false,
        username: username, // Changed from email to username
        password,
      });
      
      console.log('Sign in result:', result);
      
      if (result.error) {
        setError('Invalid username or password');
        setLoading(false);
      } else {
        router.push(router.query.callbackUrl || '/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - Focus Mind</title>
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          <h1>Sign In</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account?{' '}
            <button 
              className="auth-link" 
              onClick={() => router.push('/auth/signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: calc(100vh - 150px);
          padding: 2rem;
        }
        
        .auth-card {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
        }
        
        h1 {
          text-align: center;
          margin-bottom: 1.5rem;
          color: white;
        }
        
        .error-message {
          background-color: rgba(245, 78, 78, 0.2);
          color: #f54e4e;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          text-align: center;
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
          border-color: rgba(255, 255, 255, 0.8);
        }
        
        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #30384b;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 4px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
        }
        
        .submit-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .auth-link {
          color: white;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-decoration: underline;
          transition: opacity 0.3s ease;
        }

        .auth-link:hover {
          opacity: 0.8;
        }
      `}</style>
    </>
  );
} 