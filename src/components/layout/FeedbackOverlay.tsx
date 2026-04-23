'use client';

import React, { useState } from 'react';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { submitFeedback } from '@/lib/repositories';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export default function FeedbackOverlay() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature' | 'other'>('feature');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Don't show feedback button if not logged in
  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setSubmitting(true);
      await submitFeedback(user.uid, user.email || undefined, type, message);
      toast.success('Thank you for your feedback!');
      setIsOpen(false);
      setMessage('');
      setType('feature');
    } catch {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-50 animate-pulse-glow"
        style={{ background: 'var(--color-primary)', color: 'white' }}
        title="Send Feedback"
      >
        <MessageSquarePlus size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
          <div 
            className="w-full max-w-md rounded-2xl p-6 shadow-xl relative animate-slide-down"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={20} style={{ color: 'var(--text-muted)' }} />
            </button>

            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Share Feedback</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Help us improve PawShield.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label text-sm font-medium block mb-1">Feedback Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['feature', 'bug', 'other'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className="py-2 px-3 rounded-lg text-sm font-medium capitalize transition-colors"
                      style={{
                        background: type === t ? 'rgba(245,158,11,0.15)' : 'var(--bg-input)',
                        color: type === t ? 'var(--color-primary)' : 'var(--text-muted)',
                        border: `1px solid ${type === t ? 'rgba(245,158,11,0.3)' : 'transparent'}`,
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label text-sm font-medium block mb-1">Message</label>
                <textarea
                  className="form-input w-full p-3 rounded-xl min-h-[120px] resize-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder={type === 'bug' ? "Describe the issue you encountered..." : "What features would you like to see?"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting || !message.trim()}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-xl mt-2 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Submit Feedback'}
                {!submitting && <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
