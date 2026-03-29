import { useState } from 'react';
import { BarChart2, X } from 'lucide-react';
import { usePolls } from '../hooks/useFirestore';

export function PollsTab({ userName, userCityId }: { userName: string; userCityId: string }) {
  const { polls, createPoll, vote } = usePolls();
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '']);

  const handleCreate = async () => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;
    await createPoll({
      question,
      options: options.filter(o => o.trim()).map(label => ({ label, votes: [] })),
      author: userName,
      cityId: userCityId,
      createdAt: new Date().toISOString()
    });
    setQuestion(''); setOptions(['', '', '']); setShowCreate(false);
  };

  return (
    <div className="polls-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>🗳️ Squad Polls</h2>
        <button className="btn-kudos" style={{ width: 'auto', padding: '.7rem 1.5rem', marginTop: 0 }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <X size={16} /> : <BarChart2 size={16} />} {showCreate ? 'Annuleer' : 'Nieuwe Poll'}
        </button>
      </div>
      {showCreate && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
          <div className="panel-header"><BarChart2 className="panel-icon" size={22} /><h2>Maak een Poll</h2></div>
          <div className="auth-form" style={{ gap: '.75rem' }}>
            <input className="kudo-input" placeholder="Je vraag..." value={question} onChange={e => setQuestion(e.target.value)} />
            {options.map((o, i) => (
              <input key={i} className="kudo-input" placeholder={`Optie ${i + 1}`} value={o} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }} />
            ))}
            <button className="btn-kudos" onClick={handleCreate}><BarChart2 size={16} /> Publiceer Poll</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {polls.length === 0 && <div className="empty-state">Geen actieve polls. Start er zelf een! 🗳️</div>}
        {polls.map(poll => {
          const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
          const userVote = poll.options.findIndex(o => o.votes?.includes(userName));
          return (
            <div key={poll.id} className={`glass-panel poll-card ${poll.cityId}`}>
              <div className="poll-question">{poll.question}</div>
              <div className="poll-options">
                {poll.options.map((opt, i) => {
                  const pct = totalVotes > 0 ? Math.round(((opt.votes?.length || 0) / totalVotes) * 100) : 0;
                  const voted = userVote === i;
                  return (
                    <button key={i} className={`poll-option ${voted ? 'voted' : ''}`} onClick={() => vote(poll.id, i, userName, userCityId)}>
                      <div className="poll-option-bar" style={{ width: `${pct}%` }} />
                      <span className="poll-option-label">{opt.label}</span>
                      <span className="poll-option-pct">{pct}%</span>
                    </button>
                  );
                })}
              </div>
              <div className="poll-meta">{totalVotes} stem{totalVotes !== 1 ? 'men' : ''} · door {poll.author}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
