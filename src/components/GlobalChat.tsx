import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Zap } from 'lucide-react';
import { useGlobalChat } from '../hooks/useFirestore';
import { useTranslation } from '../hooks/useTranslation';
import { getAssistantResponse } from '../services/aiService';

export function GlobalChat({ userName }: { userName: string }) {
  const { messages, sendMsg } = useGlobalChat();
  const { lang: currentLang, t } = useTranslation();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const isBotTyping = useRef(false);
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
      
      // Real LLM Assistant Logic (Dupo-Atlas)
      if (msgText.toLowerCase().includes('atlas') || msgText.startsWith('/') || text.length > 5) {
        await handleAssistantResponse(msgText);
      }

      if (!customText) setText('');
    } finally {
      setSending(false);
    }
  };

  const handleAssistantResponse = async (query: string) => {
    if (isBotTyping.current) return;
    isBotTyping.current = true;
    setIsBotThinking(true);

    try {
      const response = await getAssistantResponse(query);
      
      if (response) {
        // Natural delay for "human" feel
        setTimeout(async () => {
          await sendMsg('Dupo-Atlas', response, currentLang);
          setIsBotThinking(false);
          isBotTyping.current = false;
        }, 1000);
      } else {
        // Fallback for missing API Key or error
        const fallback = "🧠 I'm Dupo-Atlas! I'm currently in 'Offline Mode' (missing API Key), but I still know everything about Utrecht, Lisbon, and Chennai!";
        await sendMsg('Dupo-Atlas', fallback, currentLang);
        setIsBotThinking(false);
        isBotTyping.current = false;
      }
    } catch {
      setIsBotThinking(false);
      isBotTyping.current = false;
    }
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
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%', animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>
                {isBot ? '🤖 ' : ''}{msg.author} • {msg.lang}
              </div>
              <div style={{ 
                background: isBot ? 'rgba(var(--accent-rgb), 0.2)' : isMe ? 'var(--accent)' : 'rgba(255,255,255,0.1)', 
                border: isBot ? '1px solid var(--accent)' : 'none',
                padding: '0.6rem 0.9rem', 
                borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                fontSize: '0.9rem',
                color: 'white',
                boxShadow: isBot ? '0 0 15px rgba(var(--accent-rgb), 0.1)' : 'none'
              }}>
                {translatedText}
              </div>
            </div>
          );
        })}
        {isBotThinking && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%', animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '2px' }}>🤖 Dupo-Atlas is thinking...</div>
            <div className="chat-bubble bot-bubble" style={{ padding: '0.6rem 0.9rem', borderRadius: '16px 16px 16px 2px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid var(--accent)' }}>
              <div className="typing-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        )}
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
