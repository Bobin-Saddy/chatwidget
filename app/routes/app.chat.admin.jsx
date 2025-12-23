import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- NEUMORPHIC & MINIMALIST ICONS ---
const Icons = {
  Bolt: ({ color = "currentColor" }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
  ),
  Send: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function WorldClassChat() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [searchTerm, setSearchTerm] = useState("");

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Polling for new messages
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
      display: 'flex', height: '100vh', width: '100vw', padding: '16px', boxSizing: 'border-box',
      background: 'radial-gradient(circle at top left, #f8fafc, #e2e8f0)', fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {/* --- GLASS SIDEBAR --- */}
      <div style={{ 
        width: '320px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)',
        borderRadius: '24px', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)', marginRight: '16px', overflow: 'hidden'
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: accentColor, padding: '6px', borderRadius: '8px' }}><Icons.Bolt color="white" /></div>
              <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>Nova</span>
            </div>
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ border: 'none', background: 'none', width: '20px', cursor: 'pointer' }} />
          </div>
          
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '10px' }}><Icons.Search /></span>
            <input 
              placeholder="Quick Search..." 
              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'rgba(255,255,255,0.5)', fontSize: '13px', outline: 'none' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
          {filteredSessions.map(session => {
            const isActive = activeSession?.sessionId === session.sessionId;
            return (
              <div 
                key={session.sessionId} onClick={() => loadChat(session)}
                style={{
                  padding: '14px', borderRadius: '16px', cursor: 'pointer', transition: '0.3s',
                  backgroundColor: isActive ? 'white' : 'transparent',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isActive ? '0 10px 20px rgba(0,0,0,0.04)' : 'none',
                  display: 'flex', gap: '12px', marginBottom: '8px', border: isActive ? '1px solid #f1f5f9' : '1px solid transparent'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: isActive ? accentColor : '#f1f5f9', color: isActive ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.User />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>{session.email.split('@')[0]}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message || "Incoming query..."}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- MAIN CHAT ENGINE --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {activeSession ? (
          <div style={{ 
            height: '100%', background: 'white', borderRadius: '32px', display: 'flex', flexDirection: 'column', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.03)', border: '1px solid white', overflow: 'hidden'
          }}>
            {/* Top Bar */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{activeSession.email}</h2>
                <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>● Customer is online</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: '#f1f5f9', fontSize: '12px', fontWeight: '700' }}>ID: {activeSession.sessionId.slice(0,8)}</div>
              </div>
            </div>

            {/* Content Area */}
            <div ref={scrollRef} style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fafbfc' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', 
                  maxWidth: '60%', 
                  animation: 'fadeInUp 0.4s ease forwards' 
                }}>
                  <div style={{ 
                    padding: '14px 20px', borderRadius: '20px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : 'white',
                    color: msg.sender === 'admin' ? 'white' : '#1e293b',
                    boxShadow: msg.sender === 'admin' ? `0 10px 20px -5px ${accentColor}60` : '0 4px 6px rgba(0,0,0,0.02)',
                    fontSize: '14px', lineHeight: '1.6', fontWeight: '500'
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '6px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Section */}
            <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['👋 Welcome!', 'Looking into this...', 'Resolved ✅'].map(txt => (
                  <button key={txt} onClick={() => handleReply(txt)} style={{ 
                    padding: '6px 14px', borderRadius: '20px', border: '1px solid #e2e8f0', 
                    background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' 
                  }} onMouseOver={(e) => e.target.style.borderColor = accentColor}>{txt}</button>
                ))}
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', background: '#f1f5f9', 
                borderRadius: '20px', padding: '6px 6px 6px 20px', transition: '0.3s'
              }}>
                <input 
                  placeholder="Type a response..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '500' }}
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button 
                  onClick={() => handleReply()}
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '16px', background: accentColor, 
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 8px 15px ${accentColor}40`
                  }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ width: '120px', height: '120px', borderRadius: '40px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                <Icons.User size={48} />
             </div>
             <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>Select a Conversation</h2>
             <p style={{ color: '#94a3b8', maxWidth: '300px', textAlign: 'center', fontSize: '14px' }}>Pick a session from the left to start providing world-class support.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}