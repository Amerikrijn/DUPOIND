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

  const isApiConnected = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="glass-panel chat-container" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: 0, overflow: 'hidden' }}>
      <div className="panel-header" style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 0 }}>
        <MessageSquare className="panel-icon" size={24} />
        <div style={{ flex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            {t('global_chat')} 
            <span style={{ fontSize: '0.7rem', background: 'rgba(var(--accent-rgb), 0.1)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Atlas v1.5</span>
          </h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '2px 0 0 0' }}>Real-time squad connection • 🌐🚀✨</p>
        </div>
        <div className="api-badge">
          <span className={`status-dot ${isApiConnected ? 'online' : 'offline'}`}></span>
          {isApiConnected ? 'Connected' : 'Offline Mode'}
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.1)' }}>
        {messages.map((msg) => {
          const isMe = msg.author === userName;
          const isBot = msg.author === 'Dupo-Atlas';
          const displayLang = currentLang.toLowerCase() as 'nl' | 'pt' | 'ta';
          const translatedText = msg.trans?.[displayLang] || msg.text;

          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                {isBot && <Zap size={10} color="var(--accent)" />}
                {isBot ? 'Atlas AI' : msg.author} • {msg.lang}
              </div>
              <div className={`chat-bubble ${isMe ? 'me' : 'bot'}`}>
                {translatedText}
              </div>
            </div>
          );
        })}
        {isBotThinking && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%', animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>Atlas AI is thinking...</div>
            <div className="chat-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.6rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <button className="btn-icon-sm" onClick={() => handleSend('/news')} style={{ fontSize: '0.7rem', padding: '5px 10px', width: 'auto', background: 'rgba(255,255,255,0.05)' }}>📰 News</button>
        <button className="btn-icon-sm" onClick={() => handleSend('/fact')} style={{ fontSize: '0.7rem', padding: '5px 10px', width: 'auto', background: 'rgba(255,255,255,0.05)' }}>📜 Fact</button>
        <button className="btn-icon-sm" onClick={() => handleSend('/weather')} style={{ fontSize: '0.7rem', padding: '5px 10px', width: 'auto', background: 'rgba(255,255,255,0.05)' }}>⛅ Weather</button>
      </div>

      <div style={{ padding: '1.25rem', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)' }}>
        <input 
          className="auth-input" 
          placeholder={t('type_message')} 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          style={{ marginBottom: 0, height: '48px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
        />
        <button className="btn-auth" onClick={() => handleSend()} disabled={sending || !text.trim()} style={{ width: '56px', height: '48px', padding: 0, borderRadius: '12px' }}>
          {sending ? <div className="spinner-sm" style={{ width: '20px', height: '20px' }} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
