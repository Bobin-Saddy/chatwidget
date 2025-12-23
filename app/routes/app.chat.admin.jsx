import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CHATRA STYLE SVG ICONS ---
const Icons = {
  Send: ({ color = "white" }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
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
  const [accentColor, setAccentColor] = useState("#2353ff"); 

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Polling to get new customer messages
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
      const data = await res.json();
      if (data.length !== messages.length) {
        setMessages(data);
      }
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

    // INSTANT UPDATE (No Refresh Needed)
    setMessages(prev => [...prev, newMessage]);
    setReply("");

    fetcher.submit(JSON.stringify(newMessage), {
      method: "post",
      action: "/app/chat/message",
      encType: "application/json"
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* SIDEBAR: CHAT LIST */}
      <div style={{ width: '360px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>Messages</h2>
            <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}><Icons.Settings /></button>
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '10px' }}><Icons.Search /></span>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', outline: 'none' }}
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
                  padding: '16px 20px', cursor: 'pointer', transition: '0.2s',
                  backgroundColor: isActive ? `${accentColor}10` : 'transparent',
                  borderLeft: `4px solid ${isActive ? accentColor : 'transparent'}`,
                  display: 'flex', gap: '12px'
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icons.User />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{session.email || "Guest User"}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>12:45 PM</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.messages[0]?.message || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CHAT WINDOW */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>{activeSession.email}</span>
              </div>
              <input 
                type="color" 
                value={accentColor} 
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ border: 'none', background: 'none', width: '30px', height: '30px', cursor: 'pointer' }}
              />
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fcfdfe' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '65%' }}>
                  <div style={{ 
                    padding: '12px 18px', borderRadius: msg.sender === 'admin' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : '#f3f4f6',
                    color: msg.sender === 'admin' ? 'white' : '#1f2937',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)', fontSize: '14.5px', lineHeight: '1.5'
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '20px 24px', backgroundColor: 'white' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                {['How can I help?', 'Just a moment...', 'All resolved!'].map(tag => (
                  <button key={tag} onClick={() => handleReply(tag)} style={{ padding: '6px 14px', borderRadius: '18px', border: '1px solid #e5e7eb', backgroundColor: 'white', fontSize: '12px', color: '#4b5563', cursor: 'pointer' }}>{tag}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#f9fafb', padding: '6px', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
                <input 
                  placeholder="Write a message..." 
                  style={{ flex: 1, border: 'none', backgroundColor: 'transparent', padding: '10px 15px', outline: 'none', fontSize: '15px' }}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button 
                  onClick={() => handleReply()}
                  style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: accentColor, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ marginBottom: '20px', padding: '20px', borderRadius: '50%', backgroundColor: '#f3f4f6' }}><Icons.User /></div>
            <p style={{ fontSize: '16px', fontWeight: '500' }}>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}