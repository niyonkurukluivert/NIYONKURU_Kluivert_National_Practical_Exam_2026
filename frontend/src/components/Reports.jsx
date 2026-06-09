// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';

export default function Reports() {
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportRows, setReportRows] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0.00);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchReport = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);

            const response = await fetch(`/api/reports?${queryParams.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setReportRows(data.report);
                setGrandTotal(data.grandTotal);
            } else {
                setErrorMsg('Failed to compile sales report.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error compiling report.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const handleClearFilters = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        // Perform clean fetch by bypassing local state synchronization delay
        setTimeout(() => {
            fetch('/api/reports')
                .then(r => r.json())
                .then(data => {
                    setReportRows(data.report);
                    setGrandTotal(data.grandTotal);
                });
        }, 50);
    };

    const formatMoney = (amount) => {
        return parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div>
            {errorMsg && (
                <div className="alert alert-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div>{errorMsg}</div>
                </div>
            )}

            {/* Filter Panel */}
            <div className="panel filter-bar">
                <form onSubmit={handleApplyFilters} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flexGrow: 1, minWidth: '200px', marginBottom: 0 }}>
                        <label htmlFor="search" className="form-label">Search Keyword</label>
                        <div className="search-input-wrapper" style={{ minWidth: '100%' }}>
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                id="search"
                                className="form-control"
                                placeholder="Search customer or item..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                        <label htmlFor="start_date" className="form-label">Start Date</label>
                        <input
                            type="date"
                            id="start_date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
                        <label htmlFor="end_date" className="form-label">End Date</label>
                        <input
                            type="date"
                            id="end_date"
                            className="form-control"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: 0 }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            <i className="fa-solid fa-filter"></i> Apply Filters
                        </button>
                        {(search || startDate || endDate) && (
                            <button type="button" className="btn btn-secondary" onClick={handleClearFilters} style={{ background: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.2)' }} title="Clear all filters">
                                Clear
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Report Display Panel */}
            <div className="panel">
                <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 class="panel-title">DAB Enterprise LTD - Sales Activity Report</h2>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {startDate || endDate ? (
                                <span>Date Range: {startDate || 'Beginning'} to {endDate || 'Present'}</span>
                            ) : (
                                <span>Showing all recorded transactions</span>
                            )}
                        </div>
                    </div>

                    <div className="print-btn-container">
                        <button onClick={() => window.print()} className="btn btn-secondary">
                            <i className="fa-solid fa-print"></i> Print Report
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--color-accent)', marginBottom: '1rem' }}></i>
                        <p>Compiling Report...</p>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="table-custom">
                                <thead>
                                    <tr>
                                        <th>Date / Time</th>
                                        <th>Customer</th>
                                        <th>Item Name</th>
                                        <th>Specification</th>
                                        <th>Unit Measure</th>
                                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ textAlign: 'center' }}>Qty Sold</th>
                                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportRows.length > 0 ? (
                                        reportRows.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{new Date(row.saledate).toLocaleString('en-US', { hour12: false }).replace(',', '')}</td>
                                                <td><strong>{row.customername}</strong></td>
                                                <td>{row.itemname}</td>
                                                <td><span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.specification}</span></td>
                                                <td><span className="badge badge-warning">{row.unitmeasure}</span></td>
                                                <td style={{ textAlign: 'right' }}>{formatMoney(row.unitprice)} RWF</td>
                                                <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.quantitysold}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--color-accent)' }}>
                                                    {formatMoney(row.subtotalprice)} RWF
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                                                No matching sales records found for the active filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Report Aggregation Footer */}
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="panel" style={{ backgroundColor: 'rgba(224, 169, 109, 0.05)', borderColor: 'var(--color-accent)', padding: '1rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '2rem', minWidth: '320px', marginBottom: 0 }}>
                                <div style={{ fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    Total Amount for all Sales
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
                                    {formatMoney(grandTotal)} RWF
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
