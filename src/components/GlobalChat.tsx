import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Zap } from 'lucide-react';
import { useGlobalChat } from '../hooks/useFirestore';
import { useTranslation } from '../hooks/useTranslation';

export function GlobalChat({ userName }: { userName: string }) {
  const { messages, sendMsg } = useGlobalChat();
  const { lang: currentLang, t } = useTranslation();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (customText?: string) => {
    const msgText = customText || text;
    if (!msgText.trim() || sending) return;
    setSending(true);
    try {
      await sendMsg(userName, msgText, currentLang);
      
      // Smart Assistant Logic (Dupo-Atlas)
      if (msgText.startsWith('/') || msgText.toLowerCase().includes('dupo') || msgText.toLowerCase().includes('atlas')) {
        await handleAssistantResponse(msgText);
      }

      if (!customText) setText('');
    } finally {
      setSending(false);
    }
  };

  const handleAssistantResponse = async (query: string) => {
    let response = "";
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.startsWith('/news')) {
      response = "🔍 Dupo-Atlas here! I'm checking the latest headlines for Utrecht, Lisbon, and Chennai... 📰 Check the Culture Wall for a fresh Spotlight post!";
    } else if (lowerQuery.startsWith('/fact')) {
      response = "📜 Did you know? Utrecht's cathedral tower (Domtoren) is the tallest in the Netherlands! ⛪";
    } else if (lowerQuery.startsWith('/weather')) {
      response = "⛅ The weather? In Lisbon it's perfect for a stroll in Alfama, while in Chennai it's warm and vibrant! Check the Hubs tab for live temps!";
    } else if (lowerQuery.includes('hello') || lowerQuery.includes('hallo') || lowerQuery.includes('hi')) {
      response = `👋 Hello ${userName}! I'm Dupo-Atlas, your Cultural Guide. How can I help you connect today?`;
    } else {
      response = "🧠 I'm Dupo-Atlas! Try typing /news, /fact, or /weather to see what's happening globally!";
    }

    // Delay response slightly for natural feel
    setTimeout(async () => {
      await sendMsg('Dupo-Atlas', response, 'EN');
    }, 1500);
  };

  return (
    <div className="glass-panel chat-container" style={{ display: 'flex', flexDirection: 'column', height: '550px' }}>
      <div className="panel-header">
        <MessageSquare className="panel-icon" size={22} />
        <div style={{ flex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {t('global_chat')} <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>Atlas AI</span>
          </h2>
          <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Real-time squad connection</p>
        </div>
        <div className="api-badge"><Zap size={10} /> {t('smart_trans')}</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((msg) => {
          const isMe = msg.author === userName;
          const isBot = msg.author === 'Dupo-Atlas';
          const displayLang = currentLang.toLowerCase() as 'nl' | 'pt' | 'ta';
          const translatedText = msg.trans?.[displayLang] || msg.text;

          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>
                {isBot ? '🤖 ' : ''}{msg.author} • {msg.lang}
              </div>
              <div style={{ 
                background: isBot ? 'rgba(var(--accent-rgb), 0.2)' : isMe ? 'var(--accent)' : 'rgba(255,255,255,0.1)', 
                border: isBot ? '1px solid var(--accent)' : 'none',
                padding: '0.6rem 0.9rem', 
                borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                fontSize: '0.9rem',
                color: 'white'
              }}>
                {translatedText}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button className="btn-icon-sm" onClick={() => handleSend('/news')} style={{ fontSize: '0.65rem', padding: '4px 8px', width: 'auto' }}>📰 /news</button>
        <button className="btn-icon-sm" onClick={() => handleSend('/fact')} style={{ fontSize: '0.65rem', padding: '4px 8px', width: 'auto' }}>📜 /fact</button>
        <button className="btn-icon-sm" onClick={() => handleSend('/weather')} style={{ fontSize: '0.65rem', padding: '4px 8px', width: 'auto' }}>⛅ /weather</button>
      </div>

      <div style={{ padding: '1rem', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <input 
          className="auth-input" 
          placeholder={t('type_message')} 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ marginBottom: 0 }}
        />
        <button className="btn-auth" onClick={() => handleSend()} disabled={sending} style={{ width: '50px', padding: 0 }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
