import React from 'react';
import { Card, Button, Badge, Stepper } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Package, Truck, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export const OrdersView = ({ session, activeClub, onDataChange, onToast }) => {
  const club = clubService.getClub(activeClub.id);
  const orders = club.orders || [];

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
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, margin: 0 }}>
          Merchandise Orders & Fulfillment Tracker
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Track customer order fulfillment, size distribution, and pickup dispatch for {activeClub.name}.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card title="No Orders Found" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ fontSize: '42px', marginBottom: '8px' }}>📦</div>
            <h3 style={{ fontSize: '18px', fontWeight: 900 }}>No merchandise orders placed yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--ink-muted)', fontWeight: 700 }}>
              Orders submitted in the Merch Shop will appear here with live tracking steppers.
            </p>
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
                  <Badge variant={order.status === 'Delivered' ? 'green' : 'yellow'}>
                    {order.status}
                  </Badge>
                }
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'center' }}>
                  {/* Left: Stepper & Items */}
                  <div>
                    <Stepper steps={orderSteps} activeIndex={stepIdx} />
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                          <span>• {item.name} (Size: {item.size}) x {item.qty}</span>
                          <span>₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Summary & Action */}
                  <div style={{ backgroundColor: '#FAF5EE', border: '2px solid #000', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Total Paid</span>
                      <span style={{ fontWeight: 900, fontSize: '16px' }}>₹{order.totalAmt} ({order.paymentMethod})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--ink-muted)', fontWeight: 700 }}>Ordered Date</span>
                      <span style={{ fontWeight: 800 }}>{order.date}</span>
                    </div>

                    {isManager && order.status !== 'Delivered' && (
                      <Button
                        variant="yellow"
                        size="sm"
                        style={{ marginTop: '6px' }}
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
