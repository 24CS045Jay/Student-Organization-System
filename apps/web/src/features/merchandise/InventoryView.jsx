import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import {
  ShoppingBag,
  Plus,
  Package,
  Layers,
  Truck,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Sparkles,
  AlertTriangle,
  Check
} from 'lucide-react';

const EMOJI_PRESETS = ['👕', '🧥', '🧢', '🎒', '☕', '🏷️', '🧴', '💻', '🎁', '🧣'];
const CATEGORY_OPTIONS = ['Apparel', 'Accessories', 'Stationery', 'Drinkware', 'Collectibles', 'Electronics', 'Other'];

export const InventoryView = ({ session, activeClub, onDataChange, onToast }) => {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'procurement'

  // Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Add stock state
  const [targetSize, setTargetSize] = useState('M');
  const [qtyToAdd, setQtyToAdd] = useState(10);

  // New product form state
  const initialNewProduct = {
    name: '',
    category: 'Apparel',
    image: '👕',
    description: '',
    memberPrice: 450,
    nonMemberPrice: 650,
    cost: 300,
    variantPreset: 'apparel', // 'apparel' | 'single' | 'custom'
    stock: { S: 10, M: 25, L: 25, XL: 15, XXL: 5 },
    customSizeName: '',
    customSizeQty: 10
  };
  const [newProductForm, setNewProductForm] = useState(initialNewProduct);

  // Edit product form state
  const [editProductForm, setEditProductForm] = useState(null);

  // Purchase Orders state
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [poForm, setPoForm] = useState({
    code: '',
    vendor: '',
    itemTitle: '',
    productId: '',
    size: 'M',
    quantity: 50,
    unitCost: 350,
    destination: 'Campus Activity Office',
    status: 'Pending Delivery',
    notes: ''
  });

  const merchandise = clubService.getMerchandise(activeClub.id) || [];
  const purchaseOrders = clubService.getPurchaseOrders(activeClub.id) || [];

  const handleOpenAddPO = () => {
    const defaultProduct = merchandise[0];
    setPoForm({
      code: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      vendor: '',
      itemTitle: defaultProduct?.name || '',
      productId: defaultProduct?.id || '',
      size: 'M',
      quantity: 50,
      unitCost: defaultProduct?.cost || 350,
      destination: 'Campus Activity Office',
      status: 'Pending Delivery',
      notes: ''
    });
    setIsAddPOOpen(true);
  };

  const handleCreatePO = (e) => {
    e.preventDefault();
    if (!poForm.itemTitle.trim() || !poForm.vendor.trim()) {
      alert('Please specify the product item and vendor name.');
      return;
    }
    try {
      const created = clubService.createPurchaseOrder(activeClub.id, poForm, session);
      setIsAddPOOpen(false);
      if (onToast) onToast(`🚚 Raised Purchase Order ${created.id} with ${poForm.vendor}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReceivePO = (po) => {
    try {
      clubService.updatePurchaseOrderStatus(activeClub.id, po.id, 'Received & Added to Stock', session);
      if (onToast) onToast(`📦 Stock from PO ${po.id} received and added to catalog stock!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePO = (po) => {
    if (!window.confirm(`Delete Purchase Order ${po.id}?`)) return;
    try {
      clubService.deletePurchaseOrder(activeClub.id, po.id, session);
      if (onToast) onToast(`🗑️ Deleted Purchase Order ${po.id}`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Handlers for Stock Adjustment ---
  const handleOpenAddStock = (prod) => {
    setSelectedProduct(prod);
    const availableSizes = Object.keys(prod.stock || {});
    setTargetSize(availableSizes[0] || 'Standard');
    setQtyToAdd(10);
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

  // --- Handlers for Adding New Merchandise ---
  const handlePresetChange = (preset) => {
    let stockObj = {};
    if (preset === 'apparel') {
      stockObj = { S: 10, M: 25, L: 25, XL: 15, XXL: 5 };
    } else if (preset === 'single') {
      stockObj = { Standard: 50 };
    } else {
      stockObj = { 'One-Size': 20 };
    }
    setNewProductForm((prev) => ({
      ...prev,
      variantPreset: preset,
      stock: stockObj
    }));
  };

  const handleStockQtyChange = (sz, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setNewProductForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [sz]: num }
    }));
  };

  const handleAddCustomVariant = () => {
    const name = newProductForm.customSizeName.trim().toUpperCase();
    if (!name) return;
    setNewProductForm((prev) => ({
      ...prev,
      stock: { ...prev.stock, [name]: prev.customSizeQty || 10 },
      customSizeName: '',
      customSizeQty: 10
    }));
  };

  const handleRemoveVariant = (sz) => {
    const updated = { ...newProductForm.stock };
    delete updated[sz];
    setNewProductForm((prev) => ({
      ...prev,
      stock: updated
    }));
  };

  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    if (Object.keys(newProductForm.stock).length === 0) {
      alert('Please configure at least one size variant or stock quantity');
      return;
    }

    try {
      const created = clubService.addMerchandise(
        activeClub.id,
        {
          name: newProductForm.name.trim(),
          category: newProductForm.category,
          image: newProductForm.image || '👕',
          description: newProductForm.description.trim(),
          memberPrice: Number(newProductForm.memberPrice) || 0,
          nonMemberPrice: Number(newProductForm.nonMemberPrice) || 0,
          cost: Number(newProductForm.cost) || 0,
          stock: newProductForm.stock
        },
        session
      );

      const totalCreatedUnits = Object.values(created.stock || {}).reduce((a, b) => a + b, 0);
      setIsAddProductOpen(false);
      setNewProductForm(initialNewProduct);
      if (onToast) onToast(`🎉 Added "${created.name}" with ${totalCreatedUnits} units in stock!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Handlers for Editing Merchandise ---
  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setEditProductForm({
      name: prod.name,
      category: prod.category || 'Apparel',
      image: prod.image || '👕',
      description: prod.description || '',
      memberPrice: prod.memberPrice || 0,
      nonMemberPrice: prod.nonMemberPrice || 0,
      cost: prod.cost || 0,
      stock: { ...prod.stock }
    });
    setIsEditProductOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editProductForm.name.trim()) {
      alert('Product name is required');
      return;
    }

    try {
      clubService.updateMerchandise(activeClub.id, selectedProduct.id, editProductForm, session);
      setIsEditProductOpen(false);
      if (onToast) onToast(`💾 Saved changes for "${editProductForm.name}"!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Handler for Deleting Merchandise ---
  const handleDeleteProduct = (prod) => {
    if (window.confirm(`Are you sure you want to remove "${prod.name}" from your club's merchandise catalog?`)) {
      try {
        clubService.deleteMerchandise(activeClub.id, prod.id, session);
        if (onToast) onToast(`🗑️ Removed "${prod.name}" from catalog.`);
        if (onDataChange) onDataChange();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Calculated Stats
  const totalSKUs = merchandise.length;
  const totalUnits = merchandise.reduce((acc, p) => acc + Object.values(p.stock || {}).reduce((a, b) => a + b, 0), 0);
  const totalSoldAll = merchandise.reduce((acc, p) => acc + (p.totalSold || 0), 0);
  const totalValuation = merchandise.reduce((acc, p) => {
    const units = Object.values(p.stock || {}).reduce((a, b) => a + b, 0);
    return acc + units * (p.cost || p.memberPrice || 0);
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            Merchandise POS & Inventory Control
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Publish club apparel, manage size-variant stocks, and track student orders for <strong>{activeClub.name}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="yellow"
            onClick={() => setIsAddProductOpen(true)}
            icon={Plus}
            style={{ boxShadow: '4px 4px 0px #000' }}
          >
            Add Merchandise
          </Button>

          <div style={{ display: 'flex', gap: '6px', borderLeft: '2px solid #E5E7EB', paddingLeft: '8px' }}>
            <Button
              variant={activeTab === 'inventory' ? 'black' : 'white'}
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
              Procurement POs
            </Button>
          </div>
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
          subtitle="Units Ready to Deliver"
          icon={Package}
          color="var(--accent-green)"
        />
        <StatCard
          title="Total Sold & Delivered"
          value={totalSoldAll}
          subtitle="Fulfilled Orders"
          icon={ShoppingBag}
          color="var(--accent-pink)"
        />
        <StatCard
          title="Stock Valuation"
          value={`₹${totalValuation.toLocaleString()}`}
          subtitle="Cost of Inventory"
          icon={DollarSign}
          color="#A78BFA"
        />
      </div>

      {/* Main Tab: Inventory Grid */}
      {activeTab === 'inventory' && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>📦 Variant-Aware Stock Ledger (FR-10 & FR-11)</span>
              <span style={{ fontSize: '12px', fontWeight: 800, opacity: 0.85 }}>
                {totalSKUs} {totalSKUs === 1 ? 'Product' : 'Products'} Active
              </span>
            </div>
          }
          headerBg="var(--accent-yellow)"
        >
          {merchandise.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div
                style={{
                  fontSize: '54px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '24px',
                  backgroundColor: '#FEF9C3',
                  border: '3px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 0px #000'
                }}
              >
                👕
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0' }}>
                  No Merchandise in {activeClub.short || activeClub.name} Store
                </h3>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '440px' }}>
                  You haven't added any official club apparel or accessories yet. Create your first merchandise item with variant sizes and exclusive member pricing!
                </p>
              </div>
              <Button
                variant="yellow"
                onClick={() => setIsAddProductOpen(true)}
                icon={Plus}
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                Add Your First Merchandise
              </Button>
            </div>
          ) : (
            <div className="neo-table-container">
              <table className="neo-table">
                <thead>
                  <tr>
                    <th>Product SKU & Visual</th>
                    <th>Category</th>
                    <th>Member / Retail Price</th>
                    <th>Variant Stock Breakdown</th>
                    <th>Total Sold</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchandise.map((prod) => {
                    const stockSum = Object.values(prod.stock || {}).reduce((a, b) => a + b, 0);
                    const isLow = stockSum > 0 && stockSum < 15;
                    const isOut = stockSum === 0;

                    return (
                      <tr key={prod.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                border: '2px solid #000',
                                borderRadius: '10px',
                                backgroundColor: '#FFFBEB',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px',
                                flexShrink: 0
                              }}
                            >
                              {prod.image?.startsWith('http') ? (
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                />
                              ) : (
                                prod.image || '👕'
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '14px' }}>{prod.name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'monospace' }}>
                                ID: {prod.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="blue">{prod.category || 'Apparel'}</Badge>
                        </td>
                        <td>
                          <div>
                            <span style={{ fontWeight: 900, color: '#059669', fontSize: '14px' }}>
                              ₹{prod.memberPrice}
                            </span>
                            <span style={{ color: 'var(--ink-muted)', fontSize: '12px' }}> / ₹{prod.nonMemberPrice}</span>
                          </div>
                          {prod.cost > 0 && (
                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                              Cost: ₹{prod.cost} (Margin: +₹{prod.memberPrice - prod.cost})
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '240px' }}>
                            {Object.entries(prod.stock || {}).map(([sz, qty]) => (
                              <span
                                key={sz}
                                style={{
                                  padding: '2px 8px',
                                  border: '1.5px solid #000',
                                  borderRadius: '6px',
                                  backgroundColor: qty === 0 ? '#FEE2E2' : qty < 5 ? '#FEF3C7' : '#FFFFFF',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  color: qty === 0 ? '#B91C1C' : '#000000'
                                }}
                              >
                                {sz}: <strong>{qty}</strong>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontWeight: 900, fontSize: '14px' }}>{prod.totalSold || 0}</td>
                        <td>
                          <Badge variant={isOut ? 'black' : isLow ? 'pink' : 'green'}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <Button
                              variant="yellow"
                              size="sm"
                              onClick={() => handleOpenAddStock(prod)}
                              icon={Plus}
                              title="Restock Variant"
                            >
                              Add Stock
                            </Button>
                            <Button
                              variant="white"
                              size="sm"
                              onClick={() => handleOpenEdit(prod)}
                              icon={Edit2}
                              title="Edit Details"
                            />
                            <Button
                              variant="pink"
                              size="sm"
                              onClick={() => handleDeleteProduct(prod)}
                              icon={Trash2}
                              title="Delete Item"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Procurement Tab */}
      {activeTab === 'procurement' && (
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span>🚚 Procurement & Purchase Orders Pipeline (Item O)</span>
              <Button variant="yellow" size="sm" onClick={handleOpenAddPO} icon={Plus}>
                Raise Purchase Order
              </Button>
            </div>
          }
          headerBg="var(--accent-purple)"
        >
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '16px' }}>
            Lifecycle Flow: <strong>Purchase Order → Warehouse Stock → Student Order → Pickup Delivery → Remaining</strong>
          </p>

          {purchaseOrders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div
                style={{
                  fontSize: '44px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  backgroundColor: '#EDE9FE',
                  border: '3px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '4px 4px 0px #000'
                }}
              >
                🚚
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, margin: '4px 0' }}>
                No Purchase Orders Active
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)', maxWidth: '420px' }}>
                Raise purchase orders to coordinate batch manufacturing with apparel suppliers, track shipment arrivals, and restock warehouse variants dynamically.
              </p>
              <Button variant="yellow" onClick={handleOpenAddPO} icon={Plus}>
                Raise First Purchase Order
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {purchaseOrders.map((po) => {
                const isReceived = po.status === 'Received & Added to Stock';
                const isInTransit = po.status === 'In Transit';

                return (
                  <div
                    key={po.id}
                    style={{
                      padding: '16px',
                      backgroundColor: isReceived ? '#F0FDF4' : '#FAF5EE',
                      border: '2.5px solid #000',
                      borderRadius: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '2px 2px 0px #000'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '14px', backgroundColor: '#FFFFFF', padding: '2px 8px', border: '1.5px solid #000', borderRadius: '6px' }}>
                          {po.id}
                        </span>
                        <span style={{ fontWeight: 900, fontSize: '15px' }}>
                          {po.quantity}x {po.itemTitle} {po.size ? `(${po.size})` : ''}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 800 }}>
                          • Vendor: <strong>{po.vendor}</strong>
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontWeight: 700, marginTop: '6px' }}>
                        Destination: {po.destination} • Unit Cost: ₹{po.unitCost} • Total Outflow: <strong style={{ color: '#DC2626' }}>₹{Number(po.totalCost || (po.quantity * po.unitCost)).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Badge variant={isReceived ? 'green' : isInTransit ? 'yellow' : 'purple'}>
                        {po.status}
                      </Badge>
                      {!isReceived && (
                        <Button
                          variant="green"
                          size="sm"
                          onClick={() => handleReceivePO(po)}
                          icon={Check}
                          title="Mark delivered and add units directly to warehouse stock"
                        >
                          Receive Stock
                        </Button>
                      )}
                      <Button
                        variant="white"
                        size="sm"
                        onClick={() => handleDeletePO(po)}
                        icon={Trash2}
                        title="Delete PO"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW MERCHANDISE PRODUCT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="✨ Add New Merchandise to Club Store"
        headerColor="var(--accent-yellow)"
        maxWidth="620px"
      >
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Product Name */}
          <div>
            <label className="neo-label">Product Name / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Official 2026 Club Fleece Hoodie, Enamel Badge, Oversized Tee..."
              className="neo-input"
              value={newProductForm.name}
              onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
            />
          </div>

          {/* Category & Icon Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Category</label>
              <select
                className="neo-input neo-select"
                value={newProductForm.category}
                onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="neo-label">Visual Icon / Emoji</label>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewProductForm({ ...newProductForm, image: emoji })}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      border: newProductForm.image === emoji ? '2.5px solid #000' : '1.5px solid #D1D5DB',
                      backgroundColor: newProductForm.image === emoji ? '#FEF08A' : '#FFFFFF',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: newProductForm.image === emoji ? '2px 2px 0px #000' : 'none'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Grid (Member / Non-Member / Cost) */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#FAF5EE',
              border: '2px solid #000',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: '13px', textTransform: 'uppercase' }}>
                Pricing & Profit Margin
              </span>
              <Badge variant="green">
                Profit Margin: ₹{(newProductForm.memberPrice || 0) - (newProductForm.cost || 0)} / member
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Member Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="neo-input"
                  value={newProductForm.memberPrice}
                  onChange={(e) => setNewProductForm({ ...newProductForm, memberPrice: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Retail / Non-Member (₹) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="neo-input"
                  value={newProductForm.nonMemberPrice}
                  onChange={(e) => setNewProductForm({ ...newProductForm, nonMemberPrice: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Procurement Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="neo-input"
                  value={newProductForm.cost}
                  onChange={(e) => setNewProductForm({ ...newProductForm, cost: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="neo-label">Description / Material Details</label>
            <textarea
              rows="2"
              className="neo-input"
              placeholder="e.g. Heavyweight 320 GSM organic fleece hoodie with high-density embroidered crest."
              value={newProductForm.description}
              onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
            />
          </div>

          {/* Variant Stock Configuration */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#F8FAFC',
              border: '2px solid #000',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="neo-label" style={{ margin: 0 }}>Size Variants & Initial Stock:</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handlePresetChange('apparel')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1.5px solid #000',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: newProductForm.variantPreset === 'apparel' ? '#FEF08A' : '#FFF',
                    cursor: 'pointer'
                  }}
                >
                  👕 Apparel (S-XXL)
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetChange('single')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1.5px solid #000',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: newProductForm.variantPreset === 'single' ? '#FEF08A' : '#FFF',
                    cursor: 'pointer'
                  }}
                >
                  🏷️ Single / One-Size
                </button>
              </div>
            </div>

            {/* Inputs for variants in stock */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
              {Object.entries(newProductForm.stock).map(([sz, qty]) => (
                <div
                  key={sz}
                  style={{
                    padding: '6px 8px',
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #000',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 900, fontSize: '12px' }}>{sz}</span>
                    {Object.keys(newProductForm.stock).length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(sz)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#EF4444', fontWeight: 900 }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="neo-input"
                    style={{ textAlign: 'center', padding: '4px', fontWeight: 900, fontSize: '13px' }}
                    value={qty}
                    onChange={(e) => handleStockQtyChange(sz, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Add custom size variant tag */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                placeholder="Add custom size (e.g. 3XL, White, Cap)..."
                className="neo-input"
                style={{ flex: 1, fontSize: '12px' }}
                value={newProductForm.customSizeName}
                onChange={(e) => setNewProductForm({ ...newProductForm, customSizeName: e.target.value })}
              />
              <input
                type="number"
                min="1"
                placeholder="Qty"
                className="neo-input"
                style={{ width: '70px', fontSize: '12px' }}
                value={newProductForm.customSizeQty}
                onChange={(e) => setNewProductForm({ ...newProductForm, customSizeQty: Number(e.target.value) })}
              />
              <Button type="button" variant="white" size="sm" onClick={handleAddCustomVariant} icon={Plus}>
                Add
              </Button>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)', textAlign: 'right' }}>
              Total initial inventory: <strong>{Object.values(newProductForm.stock).reduce((a, b) => a + b, 0)} units</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="white" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="yellow" icon={Check}>
              Publish Merchandise to Club Store
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT MERCHANDISE PRODUCT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditProductOpen}
        onClose={() => setIsEditProductOpen(false)}
        title={`✏️ Edit Product: ${selectedProduct?.name}`}
        headerColor="var(--accent-blue)"
        maxWidth="540px"
      >
        {editProductForm && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="neo-label">Product Name</label>
              <input
                type="text"
                required
                className="neo-input"
                value={editProductForm.name}
                onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="neo-label">Category</label>
                <select
                  className="neo-input neo-select"
                  value={editProductForm.category}
                  onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="neo-label">Icon / Emoji</label>
                <input
                  type="text"
                  className="neo-input"
                  value={editProductForm.image}
                  onChange={(e) => setEditProductForm({ ...editProductForm, image: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Member Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="neo-input"
                  value={editProductForm.memberPrice}
                  onChange={(e) => setEditProductForm({ ...editProductForm, memberPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Non-Member (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="neo-input"
                  value={editProductForm.nonMemberPrice}
                  onChange={(e) => setEditProductForm({ ...editProductForm, nonMemberPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="neo-label" style={{ fontSize: '11px' }}>Cost (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="neo-input"
                  value={editProductForm.cost}
                  onChange={(e) => setEditProductForm({ ...editProductForm, cost: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="neo-label">Description</label>
              <textarea
                rows="2"
                className="neo-input"
                value={editProductForm.description}
                onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <Button type="button" variant="white" onClick={() => setIsEditProductOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="blue" icon={Check}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: ADD STOCK TO VARIANT */}
      {/* ========================================================================= */}
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
                {Object.keys(selectedProduct.stock || {}).map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} (Current: {selectedProduct.stock[sz]} units)
                  </option>
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

      {/* ========================================================================= */}
      {/* MODAL 4: RAISE PURCHASE ORDER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddPOOpen}
        onClose={() => setIsAddPOOpen(false)}
        title="🚚 Raise New Purchase Order"
        headerColor="var(--accent-purple)"
      >
        <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">PO Code *</label>
              <input
                type="text"
                required
                value={poForm.code}
                onChange={(e) => setPoForm({ ...poForm, code: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Vendor / Supplier *</label>
              <input
                type="text"
                required
                placeholder="e.g. TexFab Gujarat"
                value={poForm.vendor}
                onChange={(e) => setPoForm({ ...poForm, vendor: e.target.value })}
                className="neo-input"
              />
            </div>
          </div>

          <div>
            <label className="neo-label">Merchandise Item *</label>
            {merchandise.length > 0 ? (
              <select
                value={poForm.productId}
                onChange={(e) => {
                  const sel = merchandise.find(m => m.id === e.target.value);
                  setPoForm({
                    ...poForm,
                    productId: e.target.value,
                    itemTitle: sel ? sel.name : poForm.itemTitle,
                    unitCost: sel ? sel.cost : poForm.unitCost
                  });
                }}
                className="neo-input neo-select"
              >
                <option value="">Custom Item / Type Below</option>
                {merchandise.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (₹{m.cost} unit cost)
                  </option>
                ))}
              </select>
            ) : null}
            <input
              type="text"
              required
              placeholder="e.g. Official Club Fleece Hoodie"
              value={poForm.itemTitle}
              onChange={(e) => setPoForm({ ...poForm, itemTitle: e.target.value })}
              className="neo-input"
              style={{ marginTop: merchandise.length > 0 ? '6px' : '0' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Size / Variant</label>
              <select
                value={poForm.size}
                onChange={(e) => setPoForm({ ...poForm, size: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="Standard">Standard</option>
              </select>
            </div>
            <div>
              <label className="neo-label">Batch Qty *</label>
              <input
                type="number"
                required
                min="1"
                value={poForm.quantity}
                onChange={(e) => setPoForm({ ...poForm, quantity: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Unit Cost (₹) *</label>
              <input
                type="number"
                required
                min="0"
                value={poForm.unitCost}
                onChange={(e) => setPoForm({ ...poForm, unitCost: Number(e.target.value) })}
                className="neo-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="neo-label">Delivery Destination</label>
              <input
                type="text"
                value={poForm.destination}
                onChange={(e) => setPoForm({ ...poForm, destination: e.target.value })}
                className="neo-input"
              />
            </div>
            <div>
              <label className="neo-label">Initial Status</label>
              <select
                value={poForm.status}
                onChange={(e) => setPoForm({ ...poForm, status: e.target.value })}
                className="neo-input neo-select"
              >
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="In Transit">In Transit</option>
                <option value="Received & Added to Stock">Received & Added to Stock</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: '#EDE9FE', border: '1.5px solid #000', borderRadius: '8px', fontSize: '13px', fontWeight: 800 }}>
            Estimated Procurement Outflow: ₹{(poForm.quantity * poForm.unitCost).toLocaleString()}
          </div>

          <Button variant="yellow" type="submit" style={{ width: '100%' }}>
            Raise Purchase Order to Supplier
          </Button>
        </form>
      </Modal>
    </div>
  );
};
