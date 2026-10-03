import React, { useState } from 'react';
import { Card, Button, Badge, Sticker, StatCard, ProgressBar, Stepper, Modal } from '../../components/ui/index';
import { NeoQRCode } from '../../components/ui/QRCodeCard';
import { Palette, Sparkles, Check, Heart, Trophy, Zap } from 'lucide-react';

export const DesignSystemShowcaseView = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const colors = [
    { name: 'Canvas Cream', hex: '#FDF8F0', bg: '#FDF8F0', dark: true },
    { name: 'Sunflower Yellow', hex: '#FFD24C', bg: '#FFD24C', dark: true },
    { name: 'Bubblegum Pink', hex: '#FF70A6', bg: '#FF70A6', dark: false },
    { name: 'Mint Seafoam', hex: '#70E4A8', bg: '#70E4A8', dark: true },
    { name: 'Lavender Lilac', hex: '#C8B6FF', bg: '#C8B6FF', dark: true },
    { name: 'Sky Azure', hex: '#74B9FF', bg: '#74B9FF', dark: true },
    { name: 'Solid Black Ink', hex: '#121212', bg: '#121212', dark: false }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ textAlign: 'center' }}>
        <Sticker color="pink" rotate={-2}>Official Design System</Sticker>
        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '10px 0 4px' }}>
          Neo-Brutalism Component Library & Color Tokens
        </h1>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Tactile 3px black borders, unblurred hard drop shadows, playful stickers, and pastel candy color accents.
        </p>
      </div>

      {/* Color Palette */}
      <Card title="🎨 Curated Neo-Brutalist Color Palette" headerBg="var(--accent-yellow)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {colors.map((c) => (
            <div
              key={c.name}
              style={{
                backgroundColor: c.bg,
                color: c.dark ? '#121212' : '#FFFFFF',
                border: '2.5px solid #121212',
                borderRadius: '16px',
                padding: '16px 12px',
                boxShadow: '3px 3px 0px #121212',
                textAlign: 'center'
              }}
            >
              <div style={{ fontWeight: 900, fontSize: '13px' }}>{c.name}</div>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, marginTop: '4px' }}>{c.hex}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Buttons */}
      <Card title="🔘 Tactile Button Variants & Sizes" headerBg="var(--accent-pink)">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
          <Button variant="yellow">Yellow Primary</Button>
          <Button variant="pink">Pink Accent</Button>
          <Button variant="green">Green Mint</Button>
          <Button variant="purple">Purple Lilac</Button>
          <Button variant="blue">Sky Blue</Button>
          <Button variant="black">Solid Black</Button>
          <Button variant="white">Card White</Button>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="yellow" size="sm">Small Button</Button>
          <Button variant="yellow" size="md">Medium Button</Button>
          <Button variant="yellow" size="lg">Large Hero Button</Button>
          <Button variant="yellow" size="sm" onClick={() => setIsDemoModalOpen(true)}>
            Open Test Modal
          </Button>
        </div>
      </Card>

      {/* Badges & Stickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card title="🏷️ Pill Badges" headerBg="var(--accent-green)">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge variant="yellow">Yellow Badge</Badge>
            <Badge variant="pink">Pink Badge</Badge>
            <Badge variant="green">Green Badge</Badge>
            <Badge variant="purple">Purple Badge</Badge>
            <Badge variant="blue">Blue Badge</Badge>
            <Badge variant="black">Black Badge</Badge>
          </div>
        </Card>

        <Card title="✨ Decorative Rotated Stickers" headerBg="var(--accent-purple)">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 0' }}>
            <Sticker color="yellow" rotate={-3}>⚡ Neo-Brutalism</Sticker>
            <Sticker color="pink" rotate={4}>🎉 VIP Member</Sticker>
            <Sticker color="green" rotate={-2}>✓ 100% Tested</Sticker>
          </div>
        </Card>
      </div>

      {/* Stepper & Progress Bar */}
      <Card title="📊 Interactive Steppers & Progress" headerBg="var(--accent-yellow)">
        <Stepper steps={['Step 1: Discover', 'Step 2: Reserve Pass', 'Step 3: QR Entry', 'Step 4: Certified']} activeIndex={2} />
        <div style={{ marginTop: '16px' }}>
          <ProgressBar value={72} max={100} color="var(--accent-green)" height={16} />
        </div>
      </Card>

      {/* Demo Modal */}
      <Modal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        title="✨ Interactive Neo-Brutalism Modal"
        headerColor="var(--accent-yellow)"
      >
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
          This modal demonstrates the rounded brutalism aesthetics with smooth backdrop blur, chunky 3.5px ink borders, and responsive controls.
        </p>
        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <Button variant="black" onClick={() => setIsDemoModalOpen(false)}>
            Close Preview
          </Button>
        </div>
      </Modal>
    </div>
  );
};
