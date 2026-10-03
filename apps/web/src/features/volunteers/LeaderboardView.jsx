import React from 'react';
import { Card, Button, Badge, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { Trophy, Award, Medal, Flame, Star, Sparkles } from 'lucide-react';

export const LeaderboardView = ({ session, activeClub }) => {
  const club = clubService.getClub(activeClub.id);
  const volunteers = club.volunteers || [];
  const sorted = [...volunteers].sort((a, b) => b.hours - a.hours);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ textAlign: 'center' }}>
        <Badge variant="yellow">Item N Gamification & Leaderboard</Badge>
        <h1 style={{ fontSize: '30px', fontWeight: 900, margin: '8px 0 4px' }}>
          Volunteer Badges & Hall of Fame 🏆
        </h1>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink-muted)' }}>
          Recognizing dedication with tiered milestone achievements for {activeClub.name}.
        </p>
      </div>

      {/* Badges Milestone Explanation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <Card title="🥉 Bronze Contributor" headerBg="#FFE8D6">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>🥉</div>
            <div style={{ fontWeight: 900, fontSize: '16px' }}>25+ Hours Logged</div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '4px' }}>
              Certificate of Service + Exclusive Club Pin
            </p>
          </div>
        </Card>

        <Card title="🥈 Silver Contributor" headerBg="#E0E7FF">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>🥈</div>
            <div style={{ fontWeight: 900, fontSize: '16px' }}>50+ Hours Logged</div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '4px' }}>
              Free Club Hoodie + Letter of Recommendation
            </p>
          </div>
        </Card>

        <Card title="🥇 Gold Legend" headerBg="var(--accent-yellow)">
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>👑</div>
            <div style={{ fontWeight: 900, fontSize: '16px' }}>100+ Hours Logged</div>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', marginTop: '4px' }}>
              Executive Board Fast-track + Annual Banquet Award
            </p>
          </div>
        </Card>
      </div>

      {/* Leaderboard Ranking Table */}
      <Card title="🔥 Volunteer Service Rankings" headerBg="var(--accent-pink)">
        <div className="neo-table-container">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Volunteer Name</th>
                <th>Service Hours</th>
                <th>Badge Tier</th>
                <th>Peer Rating</th>
                <th>Tasks Completed</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v, idx) => (
                <tr key={v.id} style={{ backgroundColor: idx === 0 ? '#FFFBEB' : '#FFFFFF' }}>
                  <td>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '2px solid #000',
                        backgroundColor: idx === 0 ? 'var(--accent-yellow)' : idx === 1 ? '#E0E7FF' : idx === 2 ? '#FFE8D6' : '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '13px'
                      }}
                    >
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 900, fontSize: '14px' }}>{v.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>{v.email}</div>
                  </td>
                  <td style={{ fontWeight: 900, fontSize: '16px', color: '#059669' }}>
                    {v.hours} Hours
                  </td>
                  <td>
                    <Badge variant={v.hours >= 100 ? 'yellow' : v.hours >= 50 ? 'purple' : 'blue'}>
                      {v.badge}
                    </Badge>
                  </td>
                  <td style={{ fontWeight: 800 }}>
                    ⭐ {v.rating} / 5.0
                  </td>
                  <td style={{ fontWeight: 800 }}>
                    {v.tasksCompleted || 10} Tasks
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
