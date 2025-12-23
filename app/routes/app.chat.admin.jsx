import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- MODERN LINEAR ICONS ---
const Icons = {
  Send: ({ color = "white" }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Mail: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function ChatAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [accentColor, setAccentColor] = useState("#2563eb"); 

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling for incoming messages
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

  const handleReply = (msgText = null) => {
    const finalMsg = msgText || reply;
    if (!finalMsg.trim() || !activeSession) return;

    const newMessage = {
      message: finalMsg,
      sender: "admin",
      createdAt: new Date().toISOString(),
      sessionId: activeSession.sessionId
    };

    // OPTIMISTIC UPDATE: Immediate display
    setMessages(prev => [...prev, newMessage]);
    setReply("");

    fetcher.submit(JSON.stringify(newMessage), {
      method: "post",
      action: "/app/chat/message",
      encType: "application/json"
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 1. SIDEBAR: NAVIGATION */}
      <div style={{ width: '380px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '30px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Inbox</h1>
            <input 
              type="color" 
              value={accentColor} 
              onChange={(e) => setAccentColor(e.target.value)}
              style={{ border: 'none', background: 'none', width: '24px', height: '24px', cursor: 'pointer' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '12px' }}><Icons.Search /></span>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '14px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '14px', outline: 'none', transition: '0.3s' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredSessions.map((session) => {
            const isActive = activeSession?.sessionId === session.sessionId;
            return (
              <div 
                key={session.sessionId}
                onClick={() => loadChat(session)}
                style={{
                  padding: '18px 24px', cursor: 'pointer', transition: 'all 0.2s ease',
                  backgroundColor: isActive ? `${accentColor}08` : 'transparent',
                  borderRight: `3px solid ${isActive ? accentColor : 'transparent'}`,
                  display: 'flex', gap: '14px', alignItems: 'flex-start'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: isActive ? accentColor : '#f1f5f9', color: isActive ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.User size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: isActive ? accentColor : '#1e293b' }}>{session.email || "Guest"}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>2m</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.messages[0]?.message || "New session started"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN CONVERSATION AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
        {activeSession ? (
          <>
            {/* Header */}
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.User size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{activeSession.email}</div>
                  <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span> Online
                  </div>
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#ffffff' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '60%' }}>
                  <div style={{ 
                    padding: '14px 20px', 
                    borderRadius: msg.sender === 'admin' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : '#f1f5f9',
                    color: msg.sender === 'admin' ? 'white' : '#334155',
                    fontSize: '14px', lineHeight: '1.6', fontWeight: '400',
                    boxShadow: msg.sender === 'admin' ? `0 10px 15px -3px ${accentColor}30` : 'none'
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', textAlign: msg.sender === 'admin' ? 'right' : 'left', fontWeight: '500' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'admin' && ' • Sent'}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div style={{ padding: '24px 30px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {['Need help?', 'One moment...', 'Solved! ✅'].map(tag => (
                  <button key={tag} onClick={() => handleReply(tag)} style={{ padding: '6px 16px', borderRadius: '10px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '12px', color: '#64748b', cursor: 'pointer', transition: '0.2s' }}>{tag}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '18px', border: '1px solid #f1f5f9' }}>
                <input 
                  placeholder="Type a message..." 
                  style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '12px 18px', outline: 'none', fontSize: '15px', color: '#1e293b' }}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button 
                  onClick={() => handleReply()}
                  style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: accentColor, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 12px ${accentColor}40`, transition: '0.3s' }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Icons.User size={40} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>No Conversation Selected</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Choose a message from the sidebar to start helping.</p>
          </div>
        )}
      </div>

      {/* 3. INFO PANEL: USER DETAILS */}
      {activeSession && (
        <div style={{ width: '300px', backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Icons.User size={36} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{activeSession.email.split('@')[0]}</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', textAlign: 'center' }}>Customer since Dec 2025</p>
          
          <div style={{ width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Contact Info</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
              <Icons.Mail /> {activeSession.email}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}