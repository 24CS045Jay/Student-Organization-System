import React, { useState } from 'react';
import { Card, Button, Badge, Modal, StatCard } from '../../components/ui/index';
import { clubService } from '../../services/clubService';
import { MessageSquare, Star, Plus, ThumbsUp, Send } from 'lucide-react';

export const FeedbackView = ({ session, activeClub, onDataChange, onToast }) => {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [ratingOverall, setRatingOverall] = useState(5);
  const club = clubService.getClub(activeClub.id);
  const feedbackList = club.feedback || [];
  const [eventChoice, setEventChoice] = useState(() => club.events?.[0]?.title || 'Club Workshop & Event');

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      clubService.submitFeedback(
        activeClub.id,
        {
          eventTitle: eventChoice,
          ratings: { overall: ratingOverall, speaker: 5, content: 5, venue: 4, organization: 5 },
          comment: commentText || 'Fantastic experience and seamless check-in!'
        },
        session
      );
      setIsSubmitOpen(false);
      setCommentText('');
      if (onToast) onToast('⭐ Thank you for your feedback rating!');
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
            Event Feedback & 5-Star Ratings (Item M)
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink-muted)' }}>
            Attendee satisfaction scores, venue ratings, and qualitative reviews for {activeClub.name}.
          </p>
        </div>
        <Button variant="yellow" size="sm" onClick={() => setIsSubmitOpen(true)} icon={Plus}>
          Submit Event Review
        </Button>
      </div>

      {/* Ratings Matrix Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Overall Satisfaction"
          value="4.9 / 5.0"
          subtitle="98% Positive Feedback"
          icon={Star}
          color="var(--accent-yellow)"
        />
        <StatCard
          title="Speaker & Content"
          value="4.8 / 5.0"
          subtitle="Workshops & Hackathons"
          icon={ThumbsUp}
          color="var(--accent-green)"
        />
        <StatCard
          title="Venue & Logistics"
          value="4.7 / 5.0"
          subtitle="Check-in Speed & Wi-Fi"
          icon={MessageSquare}
          color="var(--accent-purple)"
        />
      </div>

      {/* Reviews Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {feedbackList.map((fb) => (
          <Card
            key={fb.id}
            title={fb.eventTitle}
            headerBg="var(--accent-yellow)"
            headerAction={<Badge variant="green">⭐ {fb.ratings?.overall || 5} Stars</Badge>}
          >
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>
              "{fb.comment}"
            </p>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ink-muted)' }}>
              — Reviewed by {fb.author}
            </div>
          </Card>
        ))}
      </div>

      {/* Feedback Modal */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title="⭐ Submit Event Feedback Rating"
        headerColor="var(--accent-yellow)"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="neo-label">Select Event</label>
            <select
              value={eventChoice}
              onChange={(e) => setEventChoice(e.target.value)}
              className="neo-input neo-select"
            >
              {(club.events || []).map(ev => (
                <option key={ev.id} value={ev.title}>{ev.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="neo-label">Your Rating (1 to 5 Stars)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingOverall(star)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: ratingOverall === star ? '2.5px solid #000' : '1.5px solid #E4E4E7',
                    backgroundColor: ratingOverall >= star ? 'var(--accent-yellow)' : '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  ⭐ {star}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="neo-label">Feedback Comments *</label>
            <textarea
              rows={3}
              required
              placeholder="What did you enjoy the most? How can the mentors or venue improve?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="neo-input"
            />
          </div>

          <Button variant="yellow" type="submit" style={{ marginTop: '8px' }} icon={Send}>
            Submit Review
          </Button>
        </form>
      </Modal>
    </div>
  );
};
