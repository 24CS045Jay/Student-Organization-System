import React from 'react';
import { Card, Button, Badge, Stepper } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Package, Truck, CheckCircle2, Clock, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';

export const OrdersView = ({ session, activeClub, onDataChange, onToast, onNavigate }) => {
  const club = clubService.getClub(activeClub.id);
  const allOrders = club.orders || [];

  const isStudent = session.role === 'student' || session.role === 'member';
  const orders = isStudent
    ? allOrders.filter(
        (o) =>
          o.email?.toLowerCase() === session.email?.toLowerCase() ||
          o.customerName?.toLowerCase() === session.name?.toLowerCase() ||
          (session.memberId && o.memberId === session.memberId)
      )
    : allOrders;

  const orderSteps = ['Placed', 'Paid', 'Ready', 'Delivered'];

  const getStepIndex = (status) => {
    if (status === 'Placed') return 0;
    if (status === 'Paid') return 1;
    if (status === 'Ready') return 2;
    if (status === 'Delivered' || status === 'Collected') return 3;
    return 1;
  };

  const handleAdvanceStatus = (orderId, currentStatus) => {
    const nextMap = {
      Placed: 'Paid',
      Paid: 'Ready',
      Ready: 'Delivered',
      Delivered: 'Delivered'
    };
    const nextStatus = nextMap[currentStatus];
    if (!nextStatus || nextStatus === currentStatus) return;

    try {
      clubService.advanceOrderStatus(activeClub.id, orderId, nextStatus, session);
      if (onToast) onToast(`📦 Order ${orderId} updated to ${nextStatus}!`);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
            {isStudent ? 'My Merchandise Orders' : 'Merchandise Orders & Fulfillment Tracker'}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            {isStudent
              ? `Track your gear reservations, Razorpay payment confirmations, and pickup readiness for ${activeClub.name}.`
              : `Track customer order fulfillment, size distribution, and pickup dispatch for ${activeClub.name}.`}
          </p>
        </div>
        {isStudent && (
          <Button
            variant="yellow"
            size="sm"
            onClick={() => onNavigate && onNavigate('merch-shop')}
            icon={ShoppingBag}
          >
            Visit Merch Shop
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <Card title={isStudent ? 'No Orders Yet' : 'No Orders Found'} headerBg="var(--accent-yellow)">
          <div
            style={{
              textAlign: 'center',
              padding: '44px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <div
              style={{
                fontSize: '52px',
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                backgroundColor: '#FAF5EE',
                border: '3px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000'
              }}
            >
              📦
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 900, margin: '4px 0' }}>
                {isStudent ? 'You haven\'t placed any orders yet' : 'No merchandise orders placed yet'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700, maxWidth: '420px' }}>
                {isStudent
                  ? 'Explore the club store for official hoodies, oversized tees, and gear with instant Razorpay checkout.'
                  : 'Orders submitted in the Merch Shop will appear here with live tracking steppers and payment verification.'}
              </p>
            </div>
            {isStudent && (
              <Button
                variant="yellow"
                onClick={() => onNavigate && onNavigate('merch-shop')}
                icon={ShoppingBag}
              >
                Browse Merch Shop
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            const isManager = session.role === 'admin' || session.role === 'event_manager';

            return (
              <Card
                key={order.id}
                title={`Order Ref: ${order.id} • ${order.customerName}`}
                headerBg={order.status === 'Delivered' ? 'var(--accent-green)' : 'var(--accent-yellow)'}
                headerAction={
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {order.paymentId && (
                      <Badge variant="blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        ⚡ Razorpay
                      </Badge>
                    )}
                    <Badge variant={order.status === 'Delivered' ? 'green' : 'yellow'}>
                      {order.status}
                    </Badge>
                  </div>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
                  {/* Left: Stepper & Items */}
                  <div>
                    <Stepper steps={orderSteps} activeIndex={stepIdx} />
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '13px',
                            fontWeight: 800,
                            padding: '8px 12px',
                            backgroundColor: '#FAF5EE',
                            border: '1.5px solid #000',
                            borderRadius: '8px'
                          }}
                        >
                          <span>
                            👕 {item.name} <span style={{ color: 'var(--ink-muted)' }}>(Size: {item.size} x {item.qty})</span>
                          </span>
                          <span style={{ fontWeight: 900, color: '#059669' }}>
                            ₹{item.price * item.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Summary & Action */}
                  <div
                    style={{
                      backgroundColor: '#FAF5EE',
                      border: '2px solid #000',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Total Paid:</span>
                      <span style={{ fontWeight: 900, fontSize: '16px', color: '#059669' }}>
                        ₹{order.totalAmt}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Payment Method:</span>
                      <span style={{ fontWeight: 900, color: '#1E40AF' }}>
                        {order.paymentMethod || 'Razorpay Gateway'}
                      </span>
                    </div>

                    {order.paymentId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Payment Ref:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>
                          {order.paymentId}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Order Date:</span>
                      <span style={{ fontWeight: 800 }}>{order.date}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Pickup Hub:</span>
                      <span style={{ fontWeight: 800 }}>{activeClub.short || activeClub.name} Executive Hub</span>
                    </div>

                    {isManager && order.status !== 'Delivered' && (
                      <Button
                        variant="yellow"
                        size="sm"
                        style={{ marginTop: '6px', boxShadow: '2px 2px 0px #000' }}
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                      >
                        Advance to {order.status === 'Paid' ? 'Ready for Pickup' : 'Delivered / Collected'} →
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
