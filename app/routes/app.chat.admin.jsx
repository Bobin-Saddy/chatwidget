import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- PLATINUM GLYPH SET ---
const Icons = {
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Pulse: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function PlatinumChatAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor, setAccentColor] = useState("#8b5cf6"); // Royal Violet
  const [searchTerm, setSearchTerm] = useState("");

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Real-time Sync
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
      const data = await res.json();
      if (data.length !== messages.length) setMessages(data);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeSession, messages.length]);

  const loadChat = async (session) => {
    setActiveSession(session);
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleReply = (text = null) => {
    const finalMsg = text || reply;
    if (!finalMsg.trim() || !activeSession) return;

    const newMessage = { message: finalMsg, sender: "admin", createdAt: new Date().toISOString(), sessionId: activeSession.sessionId };
    setMessages(prev => [...prev, newMessage]);
    setReply("");

    fetcher.submit(JSON.stringify(newMessage), { method: "post", action: "/app/chat/message", encType: "application/json" });
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', padding: '12px', boxSizing: 'border-box', gap: '12px',
      background: '#020617', color: '#f8fafc', fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {/* 1. SLIM GLOBAL NAV */}
      <div style={{ width: '68px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '24px' }}>
        <div style={{ width: '40px', height: '40px', background: accentColor, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${accentColor}60` }}>
          <Icons.Pulse />
        </div>
        <div style={{ color: '#475569', cursor: 'pointer' }}><Icons.User size={24} /></div>
        <div style={{ marginTop: 'auto' }}>
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ border: 'none', background: 'none', width: '24px', cursor: 'pointer' }} />
        </div>
      </div>

      {/* 2. FROSTED SIDEBAR */}
      <div style={{ width: '340px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Messages</h2>
          <input 
            placeholder="Search conversations..." 
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '14px' }}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {filteredSessions.map(session => (
            <div 
              key={session.sessionId} onClick={() => loadChat(session)}
              style={{
                padding: '16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '8px', transition: '0.3s',
                background: activeSession?.sessionId === session.sessionId ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: activeSession?.sessionId === session.sessionId ? `1px solid ${accentColor}40` : '1px solid transparent'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.User /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{session.email.split('@')[0]}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message || "New query"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CENTER CHAT STAGE */}
      <div style={{ flex: 1, background: '#ffffff', borderRadius: '32px', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#0f172a' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
                    <h3 style={{ margin: 0, fontWeight: '800' }}>{activeSession.email}</h3>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>SESSION: {activeSession.sessionId.slice(0,8)}</div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ 
                    padding: '14px 20px', borderRadius: '20px', fontSize: '14px', lineHeight: '1.6',
                    background: msg.sender === 'admin' ? accentColor : '#ffffff',
                    color: msg.sender === 'admin' ? 'white' : '#1e293b',
                    boxShadow: msg.sender === 'admin' ? `0 10px 20px ${accentColor}30` : '0 4px 6px rgba(0,0,0,0.02)',
                    animation: 'msgScale 0.2s ease-out'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '24px 32px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['Pricing Info', 'Technical Fix', 'Greeting'].map(t => (
                  <button key={t} onClick={() => handleReply(t)} style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '20px', padding: '6px 6px 6px 20px' }}>
                <input 
                  placeholder="Type a message..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '500' }}
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button onClick={() => handleReply()} style={{ width: '48px', height: '48px', borderRadius: '16px', background: accentColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: `0 8px 15px ${accentColor}40` }}>
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Icons.User size={64} />
            <p style={{ marginTop: '16px', fontWeight: '600' }}>Select a conversation to begin</p>
          </div>
        )}
      </div>

      {/* 4. INTELLIGENCE PANEL */}
      <div style={{ width: '300px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
         <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Customer Intelligence</h4>
         {activeSession ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: accentColor }}><Icons.Globe /></div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>LOCATION</div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>New York, USA</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: accentColor }}><Icons.Pulse /></div>
                    <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>BROWSER</div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>Chrome v120</div>
                    </div>
                </div>
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', fontSize: '12px' }}>
                    <div style={{ fontWeight: '800', marginBottom: '8px' }}>Internal Notes</div>
                    <div style={{ color: '#94a3b8' }}>Customer is looking for a discount on the annual plan. Priority: High.</div>
                </div>
             </div>
         ) : <div style={{ fontSize: '13px', color: '#475569' }}>No data available</div>}
      </div>

      <style>{`
        @keyframes msgScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}