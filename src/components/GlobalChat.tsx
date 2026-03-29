import { useState, useRef, useLayoutEffect } from 'react';
import { Send, Zap } from 'lucide-react';
import { useGlobalChat } from '../hooks/useFirestore';
import { useTranslation } from '../hooks/useTranslation';
import { getAssistantResponse } from '../services/aiService';
import { getCultureFallbackReply } from '../services/assistantFallback';
import { explainGeminiFailure } from '../services/geminiDiagnostics';
import { getHubConfig } from '../config/appConfig';
import { isGeminiConfigured } from '../config/geminiEnv';
import { pickChatDisplayLine } from '../utils/translate';

export function GlobalChat({ userName }: { userName: string }) {
  const assistantName = getHubConfig().assistantName;
  const { messages, sendMsg } = useGlobalChat();
  const { lang: currentLang, t } = useTranslation();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  /** Shown when Gemini fails but we still send a Wikipedia/weather fallback — explains the real cause. */
  const [geminiHint, setGeminiHint] = useState<string | null>(null);
  const isBotTyping = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollToEnd = () => {
      el.scrollTop = el.scrollHeight;
    };
    scrollToEnd();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToEnd);
    });
    return () => cancelAnimationFrame(id);
  }, [messages, isBotThinking]);

  const handleSend = async (customText?: string) => {
    const msgText = customText || text;
    if (!msgText.trim() || sending) return;
    setAiError(null);
    setGeminiHint(null);
    setSending(true);
    try {
      await sendMsg(userName, msgText, currentLang);
      
      // Real LLM Assistant Logic (Dupo-Atlas)
      if (msgText.toLowerCase().includes('atlas') || msgText.startsWith('/') || msgText.length > 5) {
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
    setAiError(null);
    setGeminiHint(null);

    try {
      const result = await getAssistantResponse(query);

      if (result.ok) {
        setGeminiHint(null);
        setTimeout(async () => {
          await sendMsg(assistantName, result.text, currentLang);
          setIsBotThinking(false);
          isBotTyping.current = false;
        }, 1000);
        return;
      }

      setGeminiHint(explainGeminiFailure(result.code, result.detail, currentLang));
      if (import.meta.env.DEV) {
        console.warn('[Dupo-Atlas] Gemini failed:', result.code, result.detail);
      }

      const fb = await getCultureFallbackReply(query, currentLang);
      setTimeout(async () => {
        await sendMsg(assistantName, fb, currentLang);
        setIsBotThinking(false);
        isBotTyping.current = false;
      }, 1000);
    } catch (e) {
      setGeminiHint(
        explainGeminiFailure(
          'unknown',
          e instanceof Error ? e.message : String(e),
          currentLang
        )
      );
      try {
        const fb = await getCultureFallbackReply(query, currentLang);
        setTimeout(async () => {
          await sendMsg(assistantName, fb, currentLang);
          setIsBotThinking(false);
          isBotTyping.current = false;
        }, 1000);
      } catch {
        setAiError(t('ai_err_unknown'));
        setIsBotThinking(false);
        isBotTyping.current = false;
      }
    }
  };

  const isApiConnected = isGeminiConfigured();

  return (
    <div className="glass-panel chat-container">
      <div className="panel-header">
        <Zap className="panel-icon" size={24} color="var(--accent)" />
        <div style={{ flex: 1 }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0, flexWrap: 'wrap' }}>
            {assistantName} <span className="live-badge">{t('chat_live_badge')}</span>
          </h2>
          <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '2px 0 0 0' }}>{t('real_time_connection')} • 🌐🚀✨</p>
        </div>
        <div className="api-badge" title={isApiConnected ? t('api_key_hint') : t('api_key_hint_off')}>
          <span className={`status-dot ${isApiConnected ? 'online' : 'offline'}`}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{isApiConnected ? t('api_status_connected') : t('api_status_offline')}</span>
        </div>
      </div>

      {geminiHint && (
        <div className="chat-ai-hint" role="status">
          <p className="chat-ai-hint-short">{t('gemini_user_short')}</p>
          <details className="chat-ai-hint-details">
            <summary>{t('gemini_diag_details_summary')}</summary>
            <div>
              <strong className="chat-ai-hint-tech-title">{t('gemini_diag_title')}</strong>
              <div className="chat-ai-hint-tech-body">{geminiHint}</div>
            </div>
          </details>
        </div>
      )}

      {aiError && (
        <div className="chat-ai-error" role="alert">
          {aiError}
        </div>
      )}

      <div ref={scrollRef} className="chat-messages-scroll">
        {messages.map((msg) => {
          const isMe = msg.author === userName;
          const isBot = msg.author === assistantName || msg.author === 'Dupo-Atlas';
          const translatedText = pickChatDisplayLine(msg.text, msg.trans, currentLang);

          return (
            <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px', textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                {isBot && <Zap size={10} color="var(--accent)" />}
                {isBot ? assistantName : msg.author} • {msg.lang}
              </div>
              <div className={`chat-bubble ${isMe ? 'me' : 'bot'}`}>
                {translatedText}
              </div>
            </div>
          );
        })}
        {isBotThinking && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%', animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>{t('chat_thinking', { name: assistantName })}</div>
            <div className="chat-bubble bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="typing-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-quick-actions">
        <button type="button" className="btn-icon-sm chat-quick-btn" onClick={() => handleSend('/news')}>📰 {t('chat_quick_news')}</button>
        <button type="button" className="btn-icon-sm chat-quick-btn" onClick={() => handleSend('/fact')}>📜 {t('chat_quick_fact')}</button>
        <button type="button" className="btn-icon-sm chat-quick-btn" onClick={() => handleSend('/weather')}>⛅ {t('chat_quick_weather')}</button>
      </div>

      <div className="chat-input-row" style={{ padding: '1.25rem', paddingTop: '0.5rem', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.03)' }}>
        <input 
          className="auth-input" 
          placeholder={t('type_message')} 
          value={text} 
          onChange={(e) => {
            setText(e.target.value);
            setAiError(null);
            setGeminiHint(null);
          }}
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
