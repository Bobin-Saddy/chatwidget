import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- MINIMALIST OUTLINE ICONS ---
const Icons = {
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  More: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function CreamChatAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor, setAccentColor] = useState("#8b5e3c"); // Warm Terracotta/Brown
  const [searchTerm, setSearchTerm] = useState("");

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
      display: 'flex', height: '100vh', width: '100vw', 
      backgroundColor: '#fdfaf5', // The Cream Background
      padding: '20px', boxSizing: 'border-box', gap: '20px',
      color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {/* 1. SIDEBAR: THE CONVERSATION LIST */}
      <div style={{ 
        width: '380px', background: '#fffcf9', borderRadius: '28px', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(139, 94, 60, 0.05)', border: '1px solid #f1ece4'
      }}>
        <div style={{ padding: '32px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>Inquiries</h1>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: accentColor, opacity: 0.1 }}></div>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '13px', color: '#a8a29e' }}><Icons.Search /></span>
            <input 
              placeholder="Search by email..." 
              style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '14px', border: '1px solid #f1ece4', backgroundColor: '#fdfaf5', outline: 'none', fontSize: '14px', color: '#433d3c' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
          {filteredSessions.map(session => {
            const isActive = activeSession?.sessionId === session.sessionId;
            return (
              <div 
                key={session.sessionId} onClick={() => loadChat(session)}
                style={{
                  padding: '20px', borderRadius: '20px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.3s ease',
                  backgroundColor: isActive ? '#fff1e6' : 'transparent',
                  transform: isActive ? 'translateX(5px)' : 'translateX(0)'
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isActive ? accentColor : '#f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? 'white' : '#a8a29e' }}>
                    <Icons.User />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>{session.email.split('@')[0]}</span>
                      <span style={{ fontSize: '11px', color: '#a8a29e' }}>Just now</span>
                    </div>
                    <p style={{ color: '#78716c', fontSize: '13px', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.messages[0]?.message || "Waiting for response..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CHAT WORKSPACE */}
      <div style={{ 
        flex: 1, background: '#ffffff', borderRadius: '32px', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(139, 94, 60, 0.08)', border: '1px solid #f1ece4'
      }}>
        {activeSession ? (
          <>
            <div style={{ padding: '24px 40px', borderBottom: '1px solid #fdfaf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#fdfaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1ece4' }}><Icons.User size={22} /></div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{activeSession.email}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4a373' }}></div>
                    <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: '600' }}>Customer Portal Active</span>
                  </div>
                </div>
              </div>
              <div style={{ color: '#a8a29e', cursor: 'pointer' }}><Icons.More /></div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '40px', background: '#fffcf9', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', 
                  maxWidth: '65%',
                  animation: 'fadeIn 0.4s ease' 
                }}>
                  <div style={{ 
                    padding: '16px 24px', 
                    borderRadius: msg.sender === 'admin' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : '#ffffff',
                    color: msg.sender === 'admin' ? 'white' : '#433d3c',
                    boxShadow: msg.sender === 'admin' ? `0 10px 20px ${accentColor}20` : '0 4px 15px rgba(0,0,0,0.03)',
                    fontSize: '15px', lineHeight: '1.6', border: msg.sender === 'admin' ? 'none' : '1px solid #f1ece4'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* ACTION INPUT */}
            <div style={{ padding: '32px 40px', background: '#ffffff', borderTop: '1px solid #fdfaf5' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['👋 Welcome!', 'Looking into this', 'Check email'].map(chip => (
                  <button key={chip} onClick={() => handleReply(chip)} style={{ padding: '8px 18px', borderRadius: '100px', border: '1px solid #f1ece4', background: '#fffcf9', fontSize: '12px', fontWeight: '600', color: '#78716c', cursor: 'pointer', transition: '0.2s' }}>{chip}</button>
                ))}
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', background: '#fdfaf5', 
                borderRadius: '100px', padding: '10px 10px 10px 24px', border: '1px solid #f1ece4' 
              }}>
                <input 
                  placeholder="Share a helpful response..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#433d3c' }}
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button 
                  onClick={() => handleReply()}
                  style={{ 
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: accentColor, 
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    boxShadow: `0 8px 20px ${accentColor}40`, transition: '0.3s'
                  }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#fdfaf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1ece4', marginBottom: '24px' }}>
               <Icons.User size={40} />
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Peaceful Workspace</h3>
            <p style={{ color: '#a8a29e', fontSize: '15px', maxWidth: '300px' }}>Select an inquiry from the sidebar to start a warm conversation.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #f1ece4; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #e5dfd5; }
        input::placeholder { color: #d6d3d1; }
      `}</style>
    </div>
  );
}