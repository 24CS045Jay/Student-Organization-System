import React from 'react';

export const Button = ({
  children,
  variant = 'yellow', // 'yellow' | 'pink' | 'green' | 'purple' | 'blue' | 'black' | 'white'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const variantClass = `neo-btn-${variant}`;
  const sizeClass = size === 'sm' ? 'neo-btn-sm' : size === 'lg' ? 'neo-btn-lg' : size === 'icon' ? 'neo-btn-icon' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`neo-btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 17} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

export const Badge = ({
  children,
  variant = 'yellow', // 'yellow' | 'pink' | 'green' | 'purple' | 'blue' | 'black'
  className = '',
  icon: Icon
}) => {
  return (
    <span className={`neo-badge neo-badge-${variant} ${className}`}>
      {Icon && <Icon size={12} strokeWidth={3} />}
      {children}
    </span>
  );
};

export const Card = ({
  children,
  title,
  subtitle,
  headerBg = 'var(--accent-yellow)',
  headerAction,
  className = '',
  footer,
  interactive = false,
  onClick,
  style = {}
}) => {
  return (
    <div
      onClick={onClick}
      className={`neo-box ${interactive ? 'neo-box-interactive' : ''} ${className}`}
      style={{ overflow: 'hidden', ...style }}
    >
      {(title || headerAction) && (
        <div className="card-header-banner" style={{ backgroundColor: headerBg }}>
          <div>
            <h3 style={{ fontSize: '16px', margin: 0, color: 'var(--ink)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,0,0.65)', marginTop: '2px' }}>{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: '12px 20px', borderTop: 'var(--border-main)', backgroundColor: '#FAF5EE' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'var(--accent-yellow)',
  trend,
  className = ''
}) => {
  return (
    <div className={`neo-box ${className}`} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-subheading)', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-muted)' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            border: 'var(--border-main)',
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Icon size={20} strokeWidth={2.5} color="var(--ink)" />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 900, color: 'var(--ink)', marginBottom: '4px' }}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          {trend && (
            <span style={{ color: trend.startsWith('+') ? '#059669' : '#DC2626', backgroundColor: trend.startsWith('+') ? '#DCFCE7' : '#FEE2E2', padding: '1px 6px', borderRadius: '6px', border: '1.5px solid #000' }}>
              {trend}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '560px',
  headerColor = 'var(--accent-yellow)'
}) => {
  if (!isOpen) return null;

  return (
    <div className="neo-modal-backdrop" onClick={onClose}>
      <div
        className="neo-modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header-banner" style={{ backgroundColor: headerColor }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '2px solid #000',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #000'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  headerColor = 'var(--accent-pink)'
}) => {
  if (!isOpen) return null;

  return (
    <div className="neo-drawer-backdrop" onClick={onClose}>
      <div
        className="neo-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header-banner" style={{ backgroundColor: headerColor, position: 'sticky', top: 0, zIndex: 10 }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '2px solid #000',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px #000'
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export const Stepper = ({ steps, activeIndex }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '16px 0' }}>
      {steps.map((step, idx) => {
        const isDone = idx < activeIndex;
        const isCurrent = idx === activeIndex;
        return (
          <React.Fragment key={idx}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '2.5px solid #121212',
                  backgroundColor: isDone ? 'var(--accent-green)' : isCurrent ? 'var(--accent-yellow)' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '13px',
                  boxShadow: '2px 2px 0px #000'
                }}
              >
                {isDone ? '✓' : idx + 1}
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, textAlign: 'center', color: isCurrent ? '#000' : '#71717A' }}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                style={{
                  height: '3px',
                  flex: 1,
                  backgroundColor: isDone ? '#121212' : '#D4D4D8',
                  marginBottom: '18px'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Sticker = ({ children, color = 'yellow', className = '', rotate = -3 }) => {
  return (
    <span
      className={`neo-sticker neo-sticker-${color} ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
};

export const ProgressBar = ({ value, max = 100, color = 'var(--accent-green)', height = 14 }) => {
  const percent = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#FFFFFF',
        border: '2px solid #121212',
        borderRadius: '9999px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative'
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: color,
          borderRight: percent < 100 && percent > 0 ? '2px solid #121212' : 'none',
          transition: 'width 0.3s ease'
        }}
      />
    </div>
  );
};
