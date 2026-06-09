// src/App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Items from './components/Items';
import Sales from './components/Sales';
import Reports from './components/Reports';
import './App.css';

export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [tab, setTab] = useState('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('srms-theme') || 'sunset';
    });

    // Apply theme on load or change
    useEffect(() => {
        document.body.classList.remove('theme-sunset', 'theme-emerald', 'theme-nordic', 'theme-royal', 'theme-cyberpunk');
        document.body.classList.add(`theme-${theme}`);
        localStorage.setItem('srms-theme', theme);
    }, [theme]);

    // Verify session status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const data = await response.json();
                    setCurrentUser(data.username);
                }
            } catch (err) {
                console.error("Auth verify error:", err);
            } finally {
                setAuthLoading(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to sign out?")) {
            return;
        }
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            if (response.ok) {
                setCurrentUser(null);
                setTab('dashboard');
            }
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleLinkClick = (selectedTab) => {
        setTab(selectedTab);
        setMobileMenuOpen(false); // Close menu on mobile
    };

    if (authLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
                backgroundColor: '#0b0f19',
                color: 'var(--text-primary)'
            }}>
                <i className="fa-solid fa-helmet-safety fa-spin fa-3x" style={{ color: 'var(--color-accent)', marginBottom: '1.5rem' }}></i>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem' }}>Verifying Secure Session...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Login onLoginSuccess={(username) => setCurrentUser(username)} />;
    }

    // Tab details for labels
    const getPageDetails = () => {
        switch (tab) {
            case 'items':
                return { title: 'Inventory Items', subtitle: 'Manage construction tools, materials, stock levels, and prices' };
            case 'sales':
                return { title: 'Record New Sale', subtitle: 'Create a new client invoice and update inventory levels' };
            case 'reports':
                return { title: 'Sales Report', subtitle: 'View detailed sales transactions, sold items, and aggregate revenue' };
            case 'dashboard':
            default:
                return { title: 'Dashboard Overview', subtitle: 'Operational status and statistics for DAB Enterprise LTD' };
        }
    };

    const details = getPageDetails();

    return (
        <div className="app-container">
            {/* Mobile Header */}
            <div className="mobile-header">
                <div className="brand-name" style={{ fontSize: '1.1rem' }}>DAB Enterprise</div>
                <div className="menu-toggle" onClick={toggleMobileMenu}>
                    <i className={mobileMenuOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"}></i>
                </div>
            </div>

            {/* Sidebar Navigation */}
            <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <i className="fa-solid fa-helmet-safety brand-icon"></i>
                    <span className="brand-name">DAB Enterprise</span>
                </div>

                <ul className="sidebar-menu">
                    <li>
                        <button
                            onClick={() => handleLinkClick('dashboard')}
                            className={`sidebar-link ${tab === 'dashboard' ? 'active' : ''}`}
                        >
                            <i className="fa-solid fa-chart-pie"></i>
                            <span>Dashboard</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleLinkClick('items')}
                            className={`sidebar-link ${tab === 'items' ? 'active' : ''}`}
                        >
                            <i className="fa-solid fa-boxes-stacked"></i>
                            <span>Items (Stock)</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleLinkClick('sales')}
                            className={`sidebar-link ${tab === 'sales' ? 'active' : ''}`}
                        >
                            <i className="fa-solid fa-cart-shopping"></i>
                            <span>Record Sale</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleLinkClick('reports')}
                            className={`sidebar-link ${tab === 'reports' ? 'active' : ''}`}
                        >
                            <i className="fa-solid fa-file-invoice-dollar"></i>
                            <span>Sales Report</span>
                        </button>
                    </li>
                </ul>

                {/* Theme Switcher */}
                <div className="theme-switcher">
                    <span className="theme-label">Theme switcher</span>
                    <div className="theme-buttons">
                        <button className={`theme-dot dot-sunset ${theme === 'sunset' ? 'active' : ''}`} onClick={() => setTheme('sunset')} title="Sunset Brass"></button>
                        <button className={`theme-dot dot-emerald ${theme === 'emerald' ? 'active' : ''}`} onClick={() => setTheme('emerald')} title="Emerald Forest"></button>
                        <button className={`theme-dot dot-nordic ${theme === 'nordic' ? 'active' : ''}`} onClick={() => setTheme('nordic')} title="Nordic Frost"></button>
                        <button className={`theme-dot dot-royal ${theme === 'royal' ? 'active' : ''}`} onClick={() => setTheme('royal')} title="Royal Amethyst"></button>
                        <button className={`theme-dot dot-cyberpunk ${theme === 'cyberpunk' ? 'active' : ''}`} onClick={() => setTheme('cyberpunk')} title="Cyberpunk Amber"></button>
                    </div>
                </div>

                <div className="sidebar-user">
                    <div className="user-info">
                        <span className="user-name">{currentUser}</span>
                        <span className="user-role">System Operator</span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Sign Out">
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="content-header">
                    <div>
                        <h1 className="page-title">{details.title}</h1>
                        <p className="page-subtitle">{details.subtitle}</p>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                        <i className="fa-solid fa-calendar-days" style={{ color: 'var(--color-accent)', marginRight: '0.5rem' }}></i>
                        <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>

                {/* Tab Rendering */}
                {tab === 'dashboard' && <Dashboard setTab={setTab} />}
                {tab === 'items' && <Items />}
                {tab === 'sales' && <Sales currentUser={currentUser} />}
                {tab === 'reports' && <Reports />}
            </main>
        </div>
    );
}
