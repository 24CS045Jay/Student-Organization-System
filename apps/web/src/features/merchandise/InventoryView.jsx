import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { ShoppingBag, Plus, ArrowUpRight, Package, AlertTriangle, Layers, Truck } from 'lucide-react';

export const InventoryView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [targetSize, setTargetSize] = useState('M');
  const [qtyToAdd, setQtyToAdd] = useState(10);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'procurement'

  const merchandise = clubService.getMerchandise(activeClub.id);

  const handleOpenAddStock = (prod) => {
    setSelectedProduct(prod);
    setTargetSize(Object.keys(prod.stock)[0] || 'M');
    setIsAddStockOpen(true);
  };

  const handleConfirmAddStock = () => {
    if (!selectedProduct) return;
    try {
      clubService.addMerchStock(activeClub.id, selectedProduct.id, targetSize, qtyToAdd, session);
      setIsAddStockOpen(false);
      if (onToast) onToast(`✅ Added +${qtyToAdd} units to ${selectedProduct.name} (${targetSize})`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalSKUs = merchandise.length;
  const totalUnits = merchandise.reduce((acc, p) => acc + Object.values(p.stock).reduce((a, b) => a + b, 0), 0);
  const totalSoldAll = merchandise.reduce((acc, p) => acc + (p.totalSold || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Merchandise POS & Inventory Control
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Variant-aware stock tracking, movement history, and procurement purchase orders for {activeClub.name}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={activeTab === 'inventory' ? 'yellow' : 'white'}
            size="sm"
            onClick={() => setActiveTab('inventory')}
          >
            Inventory Grid
          </Button>
          <Button
            variant={activeTab === 'procurement' ? 'purple' : 'white'}
            size="sm"
            onClick={() => setActiveTab('procurement')}
          >
            Purchase Orders & Flow
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Active SKUs"
          value={totalSKUs}
          subtitle="Catalog Products"
          icon={Layers}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="Total Stock On Hand"
          value={totalUnits}
          subtitle="Available Units"
          icon={Package}
          color="var(--accent-green)"
        />
        <StatCard
          title="Total Sold & Delivered"
          value={totalSoldAll}
          subtitle="Units Fulfilled"
          icon={ShoppingBag}
          color="var(--accent-pink)"
        />
      </div>

      {activeTab === 'inventory' && (
        <Card title="📦 Variant-Aware Stock Ledger (FR-10)" headerBg="var(--accent-yellow)">
          <div className="neo-table-container">
            <table className="neo-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Category</th>
                  <th>Member / Retail Price</th>
                  <th>Stock by Variant</th>
                  <th>Total Sold</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {merchandise.map((prod) => {
                  const stockSum = Object.values(prod.stock).reduce((a, b) => a + b, 0);
                  const isLow = stockSum < 15;

                  return (
                    <tr key={prod.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '24px' }}>{prod.image || '👕'}</span>
                          <div>
                            <div style={{ fontWeight: 900 }}>{prod.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>ID: {prod.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="blue">{prod.category}</Badge>
                      </td>
                      <td>
                        <span style={{ fontWeight: 900, color: '#059669' }}>₹{prod.memberPrice}</span> / <span>₹{prod.nonMemberPrice}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {Object.entries(prod.stock).map(([sz, qty]) => (
                            <span
                              key={sz}
                              style={{
                                padding: '2px 6px',
                                border: '1.5px solid #000',
                                borderRadius: '6px',
                                backgroundColor: qty < 5 ? '#FEE2E2' : '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '11px'
                              }}
                            >
                              {sz}: {qty}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontWeight: 900 }}>{prod.totalSold || 0}</td>
                      <td>
                        <Badge variant={stockSum === 0 ? 'black' : isLow ? 'pink' : 'green'}>
                          {stockSum === 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="yellow" size="sm" onClick={() => handleOpenAddStock(prod)} icon={Plus}>
                          Add Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Purchase Orders / Procurement Tab (Item O) */}
      {activeTab === 'procurement' && (
        <Card title="🚚 Procurement & Purchase Orders Pipeline (Item O)" headerBg="var(--accent-purple)">
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
            Lifecycle Flow: <strong>Purchase Order → Warehouse Stock → Student Order → Pickup Delivery → Remaining</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>PO-2026-881: 50x Official Cybernetic Club Hoodies (PrintZone Surat)</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>Delivered to Campus Office • ₹32,500 total cost</div>
              </div>
              <Badge variant="green">Stock Received & Added</Badge>
            </div>

            <div style={{ padding: '14px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '14px' }}>PO-2026-882: 100x Terminal Syntax Oversized T-Shirts (TexFab Ahmedabad)</div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700 }}>Quality Check in Progress • ₹22,000 total cost</div>
              </div>
              <Badge variant="yellow">In Transit</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Add Stock Modal */}
      <Modal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        title={`📦 Add Inventory Stock: ${selectedProduct?.name}`}
        headerColor="var(--accent-yellow)"
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label className="neo-label">Select Size Variant:</label>
              <select
                value={targetSize}
                onChange={(e) => setTargetSize(e.target.value)}
                className="neo-input neo-select"
              >
                {Object.keys(selectedProduct.stock).map((sz) => (
                  <option key={sz} value={sz}>{sz} (Current: {selectedProduct.stock[sz]} units)</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="neo-label">Units to Add:</label>
              <input
                type="number"
                min="1"
                value={qtyToAdd}
                onChange={(e) => setQtyToAdd(Number(e.target.value))}
                className="neo-input"
              />
            </div>

            <Button variant="yellow" style={{ width: '100%' }} onClick={handleConfirmAddStock}>
              Update Stock Ledger (+{qtyToAdd} units)
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
