import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Signing up with:', { username, password });
      
      // Register user
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      
      const data = await res.json();
      
      console.log('Sign up response:', data);
      
      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email: username, // Using username as email for authentication
        password,
      });
      
      console.log('Sign in result after signup:', result);
      
      if (result.error) {
        setError('Registration successful, but could not sign in automatically. Please sign in manually.');
        router.push('/auth/signin');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up - Focus Mind</title>
      </Head>
      
      <div className="auth-container">
        <div className="auth-card">
          <h1>Create Account</h1>
          
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
              <small>Must be at least 6 characters</small>
            </div>
            
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account?{' '}
            <button 
              className="auth-link" 
              onClick={() => router.push('/auth/signin')}
            >
              Sign In
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
          margin-top: 1rem;
        }
        
        .submit-button:hover {
          background-color: #3dd67a;
        }
        
        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .auth-footer {
          margin-top: 1.5rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .auth-link {
          color: #4aec8c;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </>
  );
} 