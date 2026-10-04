import React, { useState } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { openRazorpayCheckout } from '../../services/paymentService';
import {
  ShoppingBag,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Package,
  CreditCard,
  Sparkles,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';

export const MerchShopView = ({ session, activeClub, onToast, onNavigate }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [orderQty, setOrderQty] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const merchandise = clubService.getMerchandise(activeClub.id) || [];
  const isMember = session.role === 'student' || session.role === 'admin' || session.role === 'member';

  const handleOpenBuy = (prod) => {
    setSelectedProduct(prod);
    const availableSizes = Object.keys(prod.stock || {}).filter((s) => (prod.stock[s] || 0) > 0);
    setSelectedSize(availableSizes[0] || Object.keys(prod.stock || {})[0] || 'Standard');
    setOrderQty(1);
    setIsCheckoutOpen(true);
  };

  const handleRazorpayOrder = async () => {
    if (!selectedProduct) return;
    const unitPrice = isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice;
    const totalAmt = unitPrice * orderQty;

    const availableStock = selectedProduct.stock?.[selectedSize] || 0;
    if (availableStock < orderQty) {
      alert(`Sorry! Only ${availableStock} units available for size ${selectedSize}.`);
      return;
    }

    setIsProcessing(true);

    try {
      await openRazorpayCheckout({
        amount: totalAmt,
        title: `${activeClub.short || activeClub.name} Merch: ${selectedProduct.name}`,
        description: `Size: ${selectedSize} (Qty: ${orderQty}) • Campus Pickup`,
        prefillName: session.name || 'Student Member',
        prefillEmail: session.email || 'student@campus.edu',
        onSuccess: (paymentResult) => {
          try {
            const membersList = clubService.getMembers(activeClub.id) || [];
            const currentMember = membersList.find(
              (m) => m.email?.toLowerCase() === session?.email?.toLowerCase()
            );
            const resolvedMemberId =
              currentMember?.id ||
              session?.memberId ||
              session?.studentId ||
              (isMember ? `${activeClub.prefix}-001` : null);

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
                memberId: resolvedMemberId,
                paymentMethod: 'Razorpay'
              },
              session,
              paymentResult
            );

            setIsProcessing(false);
            setIsCheckoutOpen(false);
            setConfirmedOrder(order);
            if (onToast) onToast(`🎉 Payment verified! Order ${order.id} confirmed via Razorpay.`);
          } catch (innerErr) {
            setIsProcessing(false);
            alert(`Order processing error: ${innerErr.message}`);
          }
        },
        onDismiss: (reason) => {
          setIsProcessing(false);
          if (onToast) onToast('Razorpay checkout closed.');
        }
      });
    } catch (err) {
      setIsProcessing(false);
      alert(`Razorpay checkout initialization failed: ${err.message}`);
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <Badge variant="black">FR-11 Official Club Merch Store</Badge>
            <Badge variant="green">⚡ Razorpay Instant Verification</Badge>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '4px 0 4px', color: '#121212' }}>
            Exclusive {activeClub.short || activeClub.name} Swag & Gear
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(0,0,0,0.85)', margin: 0 }}>
            Official heavyweight hoodies, oversized tees, and accessories. Orders are confirmed instantly via Razorpay.
          </p>
        </div>
        <Button variant="black" onClick={() => onNavigate && onNavigate('my-orders')} icon={Package}>
          Track My Orders
        </Button>
      </div>

      {/* Empty State vs Products Grid */}
      {merchandise.length === 0 ? (
        <Card title="No Merchandise Available" headerBg="var(--accent-yellow)">
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
                fontSize: '52px',
                width: '88px',
                height: '88px',
                borderRadius: '24px',
                backgroundColor: '#FAF5EE',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              👕
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, margin: 0 }}>
              No merchandise products listed yet
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--ink-muted)', fontWeight: 700, maxWidth: '440px' }}>
              The executive team for {activeClub.name} hasn't released any official merchandise or apparel drop yet. Stay tuned for upcoming drops!
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {merchandise.map((prod) => {
            const totalStock = Object.values(prod.stock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
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
                      {prod.description || 'Official club licensed merchandise with high quality fabric.'}
                    </p>

                    {/* Size Stock Chips */}
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: '6px' }}>
                        Available Variants:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {Object.entries(prod.stock || {}).map(([sz, count]) => (
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
                    style={{ width: '100%', boxShadow: '3px 3px 0px #000' }}
                    disabled={isOutOfStock}
                    onClick={() => handleOpenBuy(prod)}
                    icon={ShoppingBag}
                  >
                    {isOutOfStock ? 'Sold Out' : 'Buy Now with Razorpay'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal with Razorpay Gateway */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => !isProcessing && setIsCheckoutOpen(false)}
        title={`🛍️ Buy ${selectedProduct?.name}`}
        headerColor="var(--accent-yellow)"
        maxWidth="520px"
      >
        {selectedProduct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Product Snapshot */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px',
                backgroundColor: '#FAF5EE',
                border: '2px solid #000',
                borderRadius: '12px'
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  width: '54px',
                  height: '54px',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #000',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {selectedProduct.image || '👕'}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{selectedProduct.name}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <Badge variant="purple">{selectedProduct.category}</Badge>
                  {isMember && <Badge variant="green">Student Discount Applied</Badge>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontWeight: 800 }}>Unit Price</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#059669' }}>
                  ₹{isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice}
                </div>
              </div>
            </div>

            {/* Size Variant Selector */}
            <div>
              <label className="neo-label" style={{ marginBottom: '6px', display: 'block' }}>
                Select Variant / Size:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Object.keys(selectedProduct.stock || {}).length, 4)}, 1fr)`, gap: '8px' }}>
                {Object.entries(selectedProduct.stock || {}).map(([sz, count]) => {
                  const available = (count || 0) > 0;
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setSelectedSize(sz);
                        if (orderQty > count) setOrderQty(Math.max(1, count));
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected ? '3px solid #000' : '2px solid #E4E4E7',
                        backgroundColor: isSelected ? 'var(--accent-yellow)' : '#FFFFFF',
                        boxShadow: isSelected ? '2px 2px 0px #000' : 'none',
                        opacity: available ? 1 : 0.4,
                        cursor: available ? 'pointer' : 'not-allowed',
                        fontWeight: 900,
                        fontSize: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>{sz}</span>
                      <span style={{ fontSize: '10px', color: available ? 'var(--ink-muted)' : '#DC2626' }}>
                        {available ? `${count} left` : 'Sold Out'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="neo-label" style={{ margin: 0 }}>Quantity:</label>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
                  Max available: {selectedProduct.stock?.[selectedSize] || 0}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                  className="neo-btn neo-btn-sm"
                  style={{ width: '42px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 900 }}
                  disabled={orderQty <= 1}
                >
                  -
                </button>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '8px',
                    backgroundColor: '#FAF5EE',
                    border: '2px solid #000',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: 900
                  }}
                >
                  {orderQty} {orderQty === 1 ? 'Unit' : 'Units'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const maxStock = selectedProduct.stock?.[selectedSize] || 1;
                    if (orderQty < maxStock) setOrderQty(orderQty + 1);
                  }}
                  className="neo-btn neo-btn-sm"
                  style={{ width: '42px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 900 }}
                  disabled={orderQty >= (selectedProduct.stock?.[selectedSize] || 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Razorpay Gateway Badge & Notice */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '2px solid #3B82F6',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} color="#2563EB" />
                  <span style={{ fontWeight: 900, fontSize: '13px', color: '#1E40AF' }}>
                    Secured by Razorpay Checkout
                  </span>
                </div>
                <Badge variant="blue">Instant Confirmation</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#1E3A8A', fontWeight: 700 }}>
                Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & NetBanking. Once paid, your order is immediately reserved and confirmed in your student portal.
              </p>
            </div>

            {/* Price Breakdown */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: '#FAF5EE',
                border: '2px solid #000',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({orderQty} x ₹{isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice}):</span>
                <span>₹{((isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice) * orderQty).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Campus Pickup Handling:</span>
                <span>FREE (₹0)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px dashed #000',
                  paddingTop: '8px',
                  marginTop: '4px',
                  fontSize: '17px',
                  fontWeight: 900
                }}
              >
                <span>Total Payable:</span>
                <span style={{ color: '#059669' }}>
                  ₹{((isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice) * orderQty).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Direct Razorpay Launch Button */}
            <Button
              variant="yellow"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                boxShadow: '4px 4px 0px #000',
                backgroundColor: '#FFD24C'
              }}
              disabled={isProcessing}
              onClick={handleRazorpayOrder}
              icon={CreditCard}
            >
              {isProcessing
                ? 'Opening Razorpay Gateway...'
                : `Pay ₹${((isMember ? selectedProduct.memberPrice : selectedProduct.nonMemberPrice) * orderQty).toLocaleString()} via Razorpay`}
            </Button>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmedOrder)}
        onClose={() => setConfirmedOrder(null)}
        title="🎉 Merchandise Order Confirmed!"
        headerColor="var(--accent-green)"
        maxWidth="480px"
      >
        {confirmedOrder && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                backgroundColor: '#D1FAE5',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                boxShadow: '3px 3px 0px #000'
              }}
            >
              ✓
            </div>

            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, margin: '0 0 6px' }}>
                Order Placed & Confirmed!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700, margin: 0 }}>
                Payment verified through Razorpay. Stock has been reserved for you.
              </p>
            </div>

            {/* Order Details Card */}
            <div
              style={{
                width: '100%',
                textAlign: 'left',
                backgroundColor: '#FAF5EE',
                border: '2px solid #000',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Order ID:</span>
                <span style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '14px' }}>
                  {confirmedOrder.id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Razorpay Payment Ref:</span>
                <Badge variant="blue" style={{ fontFamily: 'monospace' }}>
                  {confirmedOrder.paymentId}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Item Reserved:</span>
                <span style={{ fontWeight: 900 }}>
                  {confirmedOrder.items?.[0]?.name} (Size: {confirmedOrder.items?.[0]?.size} x {confirmedOrder.items?.[0]?.qty})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Amount Paid:</span>
                <span style={{ fontWeight: 900, color: '#059669', fontSize: '15px' }}>
                  ₹{confirmedOrder.totalAmt}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--ink-muted)' }}>Pickup Location:</span>
                <span style={{ fontWeight: 800 }}>
                  {activeClub.short || activeClub.name} Executive Hub
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <Button
                variant="yellow"
                style={{ flex: 1, boxShadow: '3px 3px 0px #000' }}
                onClick={() => {
                  setConfirmedOrder(null);
                  if (onNavigate) onNavigate('my-orders');
                }}
                icon={Package}
              >
                Track My Orders
              </Button>
              <Button
                variant="white"
                style={{ flex: 1 }}
                onClick={() => setConfirmedOrder(null)}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
