// src/components/Items.jsx
import React, { useState, useEffect } from 'react';

export default function Items() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form states
    const [itemId, setItemId] = useState(null);
    const [itemName, setItemName] = useState('');
    const [specification, setSpecification] = useState('');
    const [unitMeasure, setUnitMeasure] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [unitPrice, setUnitPrice] = useState('0.00');
    const [totalQuantity, setTotalQuantity] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const url = search ? `/api/items?search=${encodeURIComponent(search)}` : '/api/items';
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setItems(data);
            } else {
                setErrorMsg('Failed to retrieve items inventory.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error fetching items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [search]);

    const handleEditClick = (item) => {
        setItemId(item.item_id);
        setItemName(item.itemname);
        setSpecification(item.specification || '');
        setUnitMeasure(item.unitmeasure);
        setQuantity(item.quantity.toString());
        setUnitPrice(item.unitprice.toString());
        setTotalQuantity(item.totalquantity.toString());
        setErrorMsg('');
        setSuccessMsg('');
    };

    const handleDeleteClick = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete '${name}'? This action cannot be undone.`)) {
            return;
        }

        setErrorMsg('');
        setSuccessMsg('');

        try {
            const response = await fetch(`/api/items/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                setSuccessMsg(`Item '${name}' deleted successfully.`);
                fetchItems();
                // Clear form if we were editing this deleted item
                if (itemId === id) {
                    resetForm();
                }
            } else {
                setErrorMsg(data.error || 'Failed to delete item.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error trying to delete item.');
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!itemName || !unitMeasure || quantity === '' || unitPrice === '') {
            setErrorMsg('Please fill in all required fields.');
            return;
        }

        const qtyVal = parseInt(quantity);
        const priceVal = parseFloat(unitPrice);
        const totalQtyVal = totalQuantity !== '' ? parseInt(totalQuantity) : qtyVal;

        if (qtyVal < 0 || priceVal < 0 || totalQtyVal < 0) {
            setErrorMsg('Quantities and prices must be non-negative.');
            return;
        }

        setSaving(true);
        const payload = {
            itemname: itemName,
            specification,
            unitmeasure: unitMeasure,
            quantity: qtyVal,
            unitprice: priceVal,
            totalquantity: totalQtyVal
        };

        try {
            const url = itemId ? `/api/items/${itemId}` : '/api/items';
            const method = itemId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMsg(itemId ? 'Item updated successfully.' : 'New item registered successfully.');
                resetForm();
                fetchItems();
            } else {
                setErrorMsg(data.error || 'Failed to save item.');
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Network error saving item.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setItemId(null);
        setItemName('');
        setSpecification('');
        setUnitMeasure('');
        setQuantity('0');
        setUnitPrice('0.00');
        setTotalQuantity('');
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

            <div className="transaction-layout">
                {/* Left Side: Table & Search */}
                <div>
                    <div className="panel">
                        <div className="panel-header">
                            <h2 className="panel-title">Inventory Stock List</h2>
                        </div>

                        {/* Search and filter bar */}
                        <div className="filter-bar">
                            <div className="search-input-wrapper">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search by name or specification..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            {search && (
                                <button className="btn btn-secondary" onClick={() => setSearch('')} style={{ background: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.2)' }}>
                                    Clear
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i> Loading stock...
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table-custom">
                                    <thead>
                                        <tr>
                                            <th>Item Details</th>
                                            <th>Unit Measure</th>
                                            <th>Stock Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Total Added</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <tr key={item.item_id}>
                                                    <td>
                                                        <strong>{item.itemname}</strong>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '250px' }}>
                                                            {item.specification}
                                                        </div>
                                                    </td>
                                                    <td>{item.unitmeasure}</td>
                                                    <td>
                                                        {item.quantity < 10 ? (
                                                            <span className="badge badge-danger" title="Low Stock!">{item.quantity}</span>
                                                        ) : (
                                                            <span className="badge badge-success">{item.quantity}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{ fontWeight: '500' }}>
                                                            {parseFloat(item.unitprice).toLocaleString('en-US', { minimumFractionDigits: 2 })} RWF
                                                        </span>
                                                    </td>
                                                    <td>{item.totalquantity}</td>
                                                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                        <button onClick={() => handleEditClick(item)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.25rem' }}>
                                                            <i className="fa-solid fa-pen-to-square"></i> Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(item.item_id, item.itemname)} className="btn btn-danger btn-sm">
                                                            <i className="fa-solid fa-trash-can"></i> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                                    No items found in stock database.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div>
                    <div className="panel">
                        <h2 className="panel-title" style={{ marginBottom: '1.5rem' }}>
                            {itemId ? (
                                <span><i className="fa-solid fa-pen-to-square" style={{ color: 'var(--color-accent)' }}></i> Edit Item Details</span>
                            ) : (
                                <span><i className="fa-solid fa-circle-plus" style={{ color: 'var(--color-accent)' }}></i> Register New Item</span>
                            )}
                        </h2>

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="itemname" class="form-label">Item Name *</label>
                                <input
                                    type="text"
                                    id="itemname"
                                    className="form-control"
                                    placeholder="e.g. Cement, Roof Nails"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="specification" class="form-label">Specification / Details</label>
                                <textarea
                                    id="specification"
                                    className="form-control"
                                    placeholder="e.g. Size, brand, thick, color"
                                    rows="3"
                                    value={specification}
                                    onChange={(e) => setSpecification(e.target.value)}
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="unitmeasure" class="form-label">Unit of Measure *</label>
                                <input
                                    type="text"
                                    id="unitmeasure"
                                    className="form-control"
                                    placeholder="e.g. Bag, Piece, Kg, Ton"
                                    value={unitMeasure}
                                    onChange={(e) => setUnitMeasure(e.target.value)}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="quantity" class="form-label">Available Quantity *</label>
                                <input
                                    type="number"
                                    id="quantity"
                                    className="form-control"
                                    min="0"
                                    placeholder="Stock quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="unitprice" class="form-label">Unit Price (RWF) *</label>
                                <input
                                    type="number"
                                    id="unitprice"
                                    step="0.01"
                                    className="form-control"
                                    min="0"
                                    placeholder="Price per unit"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(e.target.value)}
                                    required
                                    disabled={saving}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="totalquantity" class="form-label">Total Cumulative Quantity</label>
                                <input
                                    type="number"
                                    id="totalquantity"
                                    className="form-control"
                                    min="0"
                                    placeholder="Leave blank to default to Available qty"
                                    value={totalQuantity}
                                    onChange={(e) => setTotalQuantity(e.target.value)}
                                    disabled={saving}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Useful to track lifetime inventory intake.</span>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }} disabled={saving}>
                                    <i className="fa-solid fa-floppy-disk"></i> {saving ? 'Saving...' : itemId ? 'Update Item' : 'Add Item'}
                                </button>
                                {itemId && (
                                    <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={saving}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
