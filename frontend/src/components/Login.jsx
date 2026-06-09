// src/components/Login.jsx
import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please fill in both fields.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                onLoginSuccess(data.username);
            } else {
                setError(data.error || 'Authentication failed. Please try again.');
            }
        } catch (err) {
            setError('Unable to connect to the authentication server.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-body" style={{ width: '100vw', height: '100vh', margin: 0 }}>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <i className="fa-solid fa-helmet-safety"></i>
                    </div>
                    <h1 className="login-title">DAB Enterprise LTD</h1>
                    <p className="login-subtitle">Sales Record Management System</p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <div>{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <div className="search-input-wrapper" style={{ minWidth: '100%' }}>
                            <i className="fa-solid fa-user"></i>
                            <input
                                type="text"
                                id="username"
                                className="form-control"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label htmlFor="password" className="form-label">Password</label>
                        <div className="search-input-wrapper" style={{ minWidth: '100%' }}>
                            <i className="fa-solid fa-lock"></i>
                            <input
                                type="password"
                                id="password"
                                className="form-control"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? (
                            <span><i className="fa-solid fa-spinner fa-spin"></i> Signing In...</span>
                        ) : (
                            <span><i className="fa-solid fa-right-to-bracket"></i> Sign In</span>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Kigali City, Rwanda &copy; 2026. All rights reserved.
                </div>
            </div>
        </div>
    );
}
