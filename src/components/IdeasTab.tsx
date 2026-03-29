import { useState } from 'react';
import { Lightbulb, Send, ThumbsUp, CheckCircle } from 'lucide-react';
import { useIdeas } from '../hooks/useFirestore';
import { useTranslation } from '../hooks/useTranslation';
import type { Idea } from '../types';

export function IdeasTab({ userName, userCityId }: { userName: string, userCityId: string }) {
  const { ideas, addIdea, toggleVote } = useIdeas();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', category: 'suggestion' as Idea['category'] });

  const handleSubmit = async () => {
    if (!newIdea.title.trim() || !newIdea.description.trim()) return;
    await addIdea({
      title: newIdea.title,
      description: newIdea.description,
      author: userName,
      cityId: userCityId,
      category: newIdea.category
    });
    setNewIdea({ title: '', description: '', category: 'suggestion' });
    setShowForm(false);
  };

  return (
    <div className="ideas-container">
      <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div className="panel-header">
          <Lightbulb size={22} className="panel-icon" />
          <div style={{ flex: 1 }}>
            <h2>{t('ideas')}</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Help our app grow! Vote for ideas or add your own.</p>
          </div>
          <button className="btn-auth" onClick={() => setShowForm(!showForm)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            {showForm ? 'Cancel' : '+ New Suggestion'}
          </button>
        </div>

        {showForm && (
          <div className="kudo-form" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input 
                className="kudo-input" 
                placeholder="Idea Title..." 
                value={newIdea.title} 
                onChange={e => setNewIdea({ ...newIdea, title: e.target.value })} 
              />
              <select 
                className="auth-input auth-select" 
                value={newIdea.category} 
                onChange={e => setNewIdea({ ...newIdea, category: e.target.value as Idea['category'] })}
                style={{ width: 'auto' }}
              >
                <option value="suggestion">💡 Suggestion</option>
                <option value="event">🎉 Event Idea</option>
                <option value="fact">📜 Local Fact</option>
              </select>
            </div>
            <textarea 
              className="kudo-input kudo-textarea" 
              placeholder="Tell us more about your idea..." 
              value={newIdea.description} 
              onChange={e => setNewIdea({ ...newIdea, description: e.target.value })} 
            />
            <button className="btn-kudos" onClick={handleSubmit}>
              <Send size={16} /> Submit Idea
            </button>
          </div>
        )}
      </div>

      <div className="ideas-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {ideas.map(idea => {
          const hasVoted = idea.votes.includes(userName);
          const isRealized = idea.status === 'realized';

          return (
            <div key={idea.id} className={`glass-panel idea-card ${idea.cityId} ${isRealized ? 'realized' : ''}`} style={{ 
              padding: '1.25rem',
              border: isRealized ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {isRealized && (
                <div style={{ position: 'absolute', top: 5, right: 5, color: 'var(--accent)', background: 'rgba(0,0,0,0.5)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.6rem', fontWeight: 'bold' }}>
                  <CheckCircle size={10} /> {t('realized').toUpperCase()}
                </div>
              )}
              <div className="idea-header" style={{ marginBottom: '0.5rem' }}>
                <span className="idea-category" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{idea.category}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}> from {idea.author}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{idea.title}</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem', lineHeight: '1.4' }}>{idea.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {idea.votes.length} votes
                </div>
                {!isRealized && (
                  <button 
                    className={`btn-icon-sm ${hasVoted ? 'voted' : ''}`} 
                    onClick={() => toggleVote(idea.id, userName, hasVoted, userCityId)}
                    style={{ background: hasVoted ? 'var(--accent)' : 'rgba(255,255,255,0.1)', padding: '0.4rem 0.8rem', width: 'auto', borderRadius: '8px' }}
                  >
                    <ThumbsUp size={14} fill={hasVoted ? 'white' : 'none'} />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>{hasVoted ? 'Voted' : 'Vote'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
