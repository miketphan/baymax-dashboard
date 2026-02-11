import React, { useState, useEffect } from 'react';

const CORRECT_PASSWORD = 'poop';
const STORAGE_KEY = 'nexus_auth';

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          background: '#1e293b',
          padding: '32px',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '360px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>🧠</div>
            <h1 style={{
              margin: '0 0 8px 0',
              color: '#f8fafc',
              fontSize: '24px',
              fontWeight: 700,
            }}>Nexus</h1>
            <p style={{
              margin: 0,
              color: '#94a3b8',
              fontSize: '14px',
            }}>Command Center</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                autoFocus
              />
            </div>

            {error && (
              <div style={{
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Enter
            </button>
          </form>

          <p style={{
            margin: '16px 0 0 0',
            color: '#64748b',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            Authorized access only
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
