import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { ShoppingBag, Tag, CheckCircle2, AlertTriangle, Package, CreditCard, Sparkles } from 'lucide-react';

export const MerchShopView = ({ session, activeClub, onToast, onNavigate }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [orderQty, setOrderQty] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const merchandise = clubService.getMerchandise(activeClub.id);
  const isMember = session.role === 'student' || session.role === 'admin';

  const handleOpenBuy = (prod) => {
    setSelectedProduct(prod);
    const availableSizes = Object.keys(prod.stock).filter(s => prod.stock[s] > 0);
    setSelectedSize(availableSizes[0] || 'M');
    setOrderQty(1);
    setIsCheckoutOpen(true);
  };

  const handleCheckout = () => {
    if (!selectedProduct) return;
    const unitPrice = isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice;
    const totalAmt = unitPrice * orderQty;

    try {
      const order = clubService.orderMerchandise(
        activeClub.id,
        {
          productId: selectedProduct.id,
          size: selectedSize,
          qty: orderQty,
          unitPrice,
          totalAmt,
          customerName: session.name || 'Student Member',
          email: session.email || 'student@campus.edu',
          memberId: `${activeClub.prefix}-001`,
          paymentMethod
        },
        session
      );

      setIsCheckoutOpen(false);
      setConfirmedOrder(order);
      if (onToast) onToast(`🛍️ Order confirmed! ID: ${order.id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner */}
      <div
        className="neo-box"
        style={{
          background: 'linear-gradient(135deg, #FF70A6 0%, #FFD24C 100%)',
          padding: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <Badge variant="black">FR-11 Official Club Merch Store</Badge>
          <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '8px 0 4px', color: '#121212' }}>
            Exclusive {activeClub.short} Swag & Gear
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(0,0,0,0.85)' }}>
            High quality heavyweight hoodies, oversized tees, and accessories with member discounts.
          </p>
        </div>
        <Button variant="black" onClick={() => onNavigate && onNavigate('my-orders')} icon={Package}>
          Track My Orders
        </Button>
      </div>

      {/* Merch Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {merchandise.map((prod) => {
          const totalStock = Object.values(prod.stock).reduce((a, b) => a + b, 0);
          const isOutOfStock = totalStock === 0;

          return (
            <div
              key={prod.id}
              className="neo-box"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '24px',
                overflow: 'hidden'
              }}
            >
              <div>
                {/* Image Placeholder Box */}
                <div
                  style={{
                    height: '180px',
                    backgroundColor: '#FAF5EE',
                    borderBottom: '3px solid #121212',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '72px',
                    position: 'relative'
                  }}
                >
                  {prod.image || '👕'}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <Badge variant={isOutOfStock ? 'black' : totalStock < 10 ? 'pink' : 'green'}>
                      {isOutOfStock ? 'Out of Stock' : `${totalStock} Units Left`}
                    </Badge>
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>{prod.name}</h3>
                    <Badge variant="purple">{prod.category}</Badge>
                  </div>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginBottom: '14px', minHeight: '36px' }}>
                    {prod.description}
                  </p>

                  {/* Size Stock Chips */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
                      Size Inventory:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {Object.entries(prod.stock).map(([sz, count]) => (
                        <span
                          key={sz}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            border: '1.5px solid #000',
                            backgroundColor: count > 0 ? '#FFFFFF' : '#F4F4F5',
                            opacity: count > 0 ? 1 : 0.5,
                            fontSize: '11px',
                            fontWeight: 800
                          }}
                        >
                          {sz}: {count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '12px' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-muted)' }}>Member Price</span>
                      <div style={{ fontWeight: 900, fontSize: '17px', color: '#059669' }}>
                        ₹{prod.memberPrice}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, color: 'var(--ink-muted)' }}>Non-Member</span>
                      <div style={{ fontWeight: 900, fontSize: '15px', color: 'var(--ink)' }}>
                        ₹{prod.nonMemberPrice}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 20px 20px' }}>
                <Button
                  variant={isOutOfStock ? 'black' : 'yellow'}
                  style={{ width: '100%' }}
                  disabled={isOutOfStock}
                  onClick={() => handleOpenBuy(prod)}
                  icon={ShoppingBag}
                >
                  {isOutOfStock ? 'Sold Out' : 'Buy Now / Order'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title={`🛍️ Checkout: ${selectedProduct?.name}`}
        headerColor="var(--accent-pink)"
      >
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label className="neo-label">Select Size Variant:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {Object.entries(selectedProduct.stock).map(([sz, count]) => {
                  const available = count > 0;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedSize(sz)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        border: selectedSize === sz ? '2.5px solid #000' : '2px solid #E4E4E7',
                        backgroundColor: selectedSize === sz ? 'var(--accent-yellow)' : '#FFFFFF',
                        opacity: available ? 1 : 0.4,
                        cursor: available ? 'pointer' : 'not-allowed',
                        fontWeight: 900,
                        fontSize: '13px'
                      }}
                    >
                      {sz} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="neo-label">Quantity (Capped at Stock):</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                  className="neo-btn neo-btn-sm"
                  style={{ width: '38px', height: '38px', padding: 0 }}
                >
                  -
                </button>
                <span style={{ fontSize: '18px', fontWeight: 900, minWidth: '30px', textAlign: 'center' }}>
                  {orderQty}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const maxStock = selectedProduct.stock[selectedSize] || 1;
                    if (orderQty < maxStock) setOrderQty(orderQty + 1);
                  }}
                  className="neo-btn neo-btn-sm"
                  style={{ width: '38px', height: '38px', padding: 0 }}
                >
                  +
                </button>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                  (Max {selectedProduct.stock[selectedSize]} in stock)
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '20px' }}>
              <label className="neo-label">Payment Method:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {['UPI', 'Card', 'Student Wallet'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      border: paymentMethod === m ? '2.5px solid #000' : '2px solid #E4E4E7',
                      backgroundColor: paymentMethod === m ? 'var(--accent-yellow)' : '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="yellow" style={{ width: '100%' }} onClick={handleCheckout}>
              Pay ₹{((isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice) * orderQty).toLocaleString()} & Confirm Pickup
            </Button>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmedOrder)}
        onClose={() => setConfirmedOrder(null)}
        title="🎉 Order Placed Successfully!"
        headerColor="var(--accent-green)"
      >
        {confirmedOrder && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📦</div>
            <Badge variant="green" style={{ fontSize: '14px', marginBottom: '12px' }}>
              Order ID: {confirmedOrder.id}
            </Badge>
            <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Your merchandise is reserved!</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700, margin: '8px 0 20px' }}>
              Pickup location: {activeClub.short} Executive Room • Show your Student QR pass upon arrival.
            </p>
            <Button variant="black" onClick={() => { setConfirmedOrder(null); onNavigate && onNavigate('my-orders'); }}>
              Go to Orders Tracker
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
