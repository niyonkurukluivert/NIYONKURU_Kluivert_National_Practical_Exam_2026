// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

export default function Dashboard({ setTab }) {
    const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, totalSales: 0, totalRevenue: 0 });
    const [recentSales, setRecentSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data.stats);
                    setRecentSales(data.recentSales);
                } else {
                    setError('Failed to fetch dashboard data.');
                }
            } catch (err) {
                console.error(err);
                setError('Network error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatMoney = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}></i>
                <p>Loading Dashboard Overview...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <div>{error}</div>
            </div>
        );
    }

    return (
        <div>
            {/* Statistics Cards */}
            <div className="stats-grid">
                {/* Total Items */}
                <div className="card-stat">
                    <div className="stat-details">
                        <h3>Total Products</h3>
                        <div className="stat-value">{stats.totalItems}</div>
                    </div>
                    <div className="stat-icon info">
                        <i className="fa-solid fa-boxes-stacked"></i>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="card-stat">
                    <div className="stat-details">
                        <h3>Low Stock Alerts</h3>
                        <div className="stat-value">{stats.lowStock}</div>
                    </div>
                    <div className="stat-icon style" style={{
                        backgroundColor: stats.lowStock > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: stats.lowStock > 0 ? 'var(--color-danger)' : 'var(--color-success)'
                    }}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                </div>

                {/* Total Sales Count */}
                <div className="card-stat">
                    <div className="stat-details">
                        <h3>Total Orders</h3>
                        <div className="stat-value">{stats.totalSales}</div>
                    </div>
                    <div className="stat-icon success">
                        <i className="fa-solid fa-cart-shopping"></i>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="card-stat">
                    <div className="stat-details">
                        <h3>Total Revenue</h3>
                        <div className="stat-value" style={{ fontSize: '1.45rem' }}>{formatMoney(stats.totalRevenue)} RWF</div>
                    </div>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(224, 169, 109, 0.1)', color: 'var(--color-accent)' }}>
                        <i className="fa-solid fa-money-bill-wave"></i>
                    </div>
                </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="panel">
                <div className="panel-header">
                    <h2 className="panel-title">Recent Transactions</h2>
                    <button onClick={() => setTab('sales')} className="btn btn-primary btn-sm">
                        <i className="fa-solid fa-plus"></i> New Sale
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table-custom">
                        <thead>
                            <tr>
                                <th>Sale ID</th>
                                <th>Date / Time</th>
                                <th>Customer Name</th>
                                <th>Items Sold</th>
                                <th>Total Price</th>
                                <th>Recorded By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSales.length > 0 ? (
                                recentSales.map((sale) => (
                                    <tr key={sale.sale_id}>
                                        <td>#{sale.sale_id}</td>
                                        <td>{new Date(sale.saledate).toLocaleString('en-US', { hour12: false }).replace(',', '')}</td>
                                        <td><strong>{sale.customername}</strong></td>
                                        <td>{sale.items_count} item(s)</td>
                                        <td>
                                            <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>
                                                {formatMoney(sale.totalprice)} RWF
                                            </span>
                                        </td>
                                        <td><span className="badge badge-success">{sale.username}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No sales records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
