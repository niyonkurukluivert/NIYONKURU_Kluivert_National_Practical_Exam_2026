// src/components/Sales.jsx
import React, { useState, useEffect } from 'react';

export default function Sales({ currentUser }) {
    const [availableItems, setAvailableItems] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [saleDate, setSaleDate] = useState(() => {
        // Return ISO local datetime string for input: YYYY-MM-DDTHH:MM
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        return localISOTime;
    });

    // Cart states
    const [cart, setCart] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState('');
    const [saleQty, setSaleQty] = useState('');
    const [qtyPlaceholder, setQtyPlaceholder] = useState('Quantity');

    // UI feedback
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchAvailableItems = async () => {
        try {
            const response = await fetch('/api/items');
            if (response.ok) {
                const data = await response.json();
                // Only allow items with stock > 0
                setAvailableItems(data.filter(item => item.quantity > 0));
            }
        } catch (err) {
            console.error('Failed to load items:', err);
        }
    };

    useEffect(() => {
        fetchAvailableItems();
    }, []);

    // Change input quantity boundaries when selection changes
    const handleItemChange = (e) => {
        const itemId = e.target.value;
        setSelectedItemId(itemId);
        
        const item = availableItems.find(i => i.item_id.toString() === itemId);
        if (item) {
            setQtyPlaceholder(`Stock: ${item.quantity} (${item.unitmeasure})`);
        } else {
            setQtyPlaceholder('Quantity');
        }
        setSaleQty('');
    };

    const handleAddItemToCart = () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!selectedItemId) {
            setErrorMsg('Please select an item.');
            return;
        }

        const qty = parseInt(saleQty);
        if (!qty || qty <= 0) {
            setErrorMsg('Please enter a valid quantity.');
            return;
        }

        const dbItem = availableItems.find(i => i.item_id.toString() === selectedItemId);
        if (!dbItem) return;

        // Check if item is already in cart
        const existingIndex = cart.findIndex(c => c.item_id === dbItem.item_id);
        let currentCartQty = 0;
        if (existingIndex !== -1) {
            currentCartQty = cart[existingIndex].quantity;
        }

        const prospectiveQty = currentCartQty + qty;

        if (prospectiveQty > dbItem.quantity) {
            setErrorMsg(`Insufficient stock! Only ${dbItem.quantity} ${dbItem.unitmeasure} available for '${dbItem.itemname}'.`);
            return;
        }

        if (existingIndex !== -1) {
            // Update quantity
            const newCart = [...cart];
            newCart[existingIndex].quantity = prospectiveQty;
            newCart[existingIndex].subtotal = prospectiveQty * parseFloat(dbItem.unitprice);
            setCart(newCart);
        } else {
            // Add new cart entry
            setCart([...cart, {
                item_id: dbItem.item_id,
                itemname: dbItem.itemname,
                specification: dbItem.specification,
                unitmeasure: dbItem.unitmeasure,
                unitprice: parseFloat(dbItem.unitprice),
                quantity: qty,
                subtotal: qty * parseFloat(dbItem.unitprice)
            }]);
        }

        // Reset item picker
        setSelectedItemId('');
        setSaleQty('');
        setQtyPlaceholder('Quantity');
    };

    const handleRemoveFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const grandTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

    const handleCompleteSale = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!customerName.trim()) {
            setErrorMsg('Please enter a customer name.');
            return;
        }

        if (cart.length === 0) {
            setErrorMsg('Your sales cart is empty. Please add at least one item.');
            return;
        }

        setLoading(true);
        const payload = {
            customername: customerName,
            saledate: saleDate,
            cart_items: cart.map(item => ({
                item_id: item.item_id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMsg(`Sale #${data.sale_id} for ${customerName} recorded successfully! Total: ${grandTotal.toLocaleString()} RWF.`);
                // Reset form
                setCustomerName('');
                setCart([]);
                fetchAvailableItems();
            } else {
                setErrorMsg(data.error || 'Failed to complete transaction.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error completing transaction.');
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div>
            {successMsg && (
                <div className="alert alert-success">
                    <i className="fa-solid fa-circle-check"></i>
                    <div>{successMsg}</div>
                </div>
            )}

            {errorMsg && (
                <div className="alert alert-danger">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div>{errorMsg}</div>
                </div>
            )}

            <div className="panel">
                <div className="panel-header">
                    <h2 className="panel-title">
                        <i className="fa-solid fa-cart-plus" style={{ color: 'var(--color-accent)' }}></i> Record Sale Transaction
                    </h2>
                </div>

                <form onSubmit={handleCompleteSale}>
                    {/* Header Details */}
                    <div className="filter-bar" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                        <div className="form-group" style={{ flexGrow: 1, minWidth: '250px', marginBottom: 0 }}>
                            <label htmlFor="customername" className="form-label">Customer Name *</label>
                            <div className="search-input-wrapper" style={{ minWidth: '100%' }}>
                                <i className="fa-solid fa-user-tag"></i>
                                <input
                                    type="text"
                                    id="customername"
                                    className="form-control"
                                    placeholder="Enter customer's name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ minWidth: '200px', marginBottom: 0 }}>
                            <label htmlFor="saledate" className="form-label">Sale Date / Time</label>
                            <input
                                type="datetime-local"
                                id="saledate"
                                className="form-control"
                                value={saleDate}
                                onChange={(e) => setSaleDate(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Layout body */}
                    <div className="transaction-layout">
                        {/* Selector and Cart Table */}
                        <div>
                            <div className="panel" style={{ backgroundColor: 'rgba(0,0,0,0.15)', border: '1px dashed var(--border-color)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Select Items to Sell</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.6fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Product Item</label>
                                        <select
                                            className="form-control"
                                            value={selectedItemId}
                                            onChange={handleItemChange}
                                            disabled={loading}
                                        >
                                            <option value="">-- Choose item --</option>
                                            {availableItems.map(item => (
                                                <option key={item.item_id} value={item.item_id}>
                                                    {item.itemname} ({item.specification}) - {parseFloat(item.unitprice).toLocaleString()} RWF
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            placeholder={qtyPlaceholder}
                                            value={saleQty}
                                            onChange={(e) => setSaleQty(e.target.value)}
                                            disabled={loading || !selectedItemId}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleAddItemToCart}
                                        disabled={loading || !selectedItemId || !saleQty}
                                    >
                                        <i className="fa-solid fa-plus"></i> Add Item
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Selected Items Invoice</h3>
                            <div className="table-responsive">
                                <table className="table-custom">
                                    <thead>
                                        <tr>
                                            <th>Item Details</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Subtotal</th>
                                            <th style={{ width: '80px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.length > 0 ? (
                                            cart.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <strong>{item.itemname}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {item.specification}
                                                        </div>
                                                    </td>
                                                    <td>{item.quantity} {item.unitmeasure}</td>
                                                    <td>{formatMoney(item.unitprice)} RWF</td>
                                                    <td>{formatMoney(item.subtotal)} RWF</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRemoveFromCart(idx)}
                                                            disabled={loading}
                                                        >
                                                            <i className="fa-solid fa-trash-can"></i> Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                                    No items added yet. Select an item above and click "Add Item".
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Grand Total panel */}
                        <div>
                            <div className="panel" style={{ backgroundColor: 'rgba(224, 169, 109, 0.04)', borderColor: 'rgba(224, 169, 109, 0.15)' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>Summary</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Recorded By</span>
                                        <span style={{ fontWeight: 600 }}>{currentUser}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Grand Total</span>
                                        <span style={{ fontSize: '1.55rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                                            {formatMoney(grandTotal)} RWF
                                        </span>
                                    </div>
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading || cart.length === 0}>
                                    {loading ? (
                                        <span><i className="fa-solid fa-spinner fa-spin"></i> Recording...</span>
                                    ) : (
                                        <span><i className="fa-solid fa-file-invoice-dollar"></i> Complete Sale</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
