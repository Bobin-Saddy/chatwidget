import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- PROFESSIONAL GLYPHS (Custom SVG) ---
const Icons = {
  Send: ({ color = "white" }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  ),
  Activity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
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
  const [accentColor, setAccentColor] = useState("#ff4757"); // High-energy Coral Red
  const [activeTab, setActiveTab] = useState("chat"); // chat | info | notes

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

  const handleReply = (msgText = null) => {
    const finalMsg = msgText || reply;
    if (!finalMsg.trim() || !activeSession) return;

    const newMessage = {
      message: finalMsg,
      sender: "admin",
      createdAt: new Date().toISOString(),
      sessionId: activeSession.sessionId
    };

    setMessages(prev => [...prev, newMessage]);
    setReply("");

    fetcher.submit(JSON.stringify(newMessage), {
      method: "post",
      action: "/app/chat/message",
      encType: "application/json"
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#0f172a', padding: '12px', boxSizing: 'border-box', gap: '12px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* 1. COMPACT NAV BAR */}
      <div style={{ width: '64px', backgroundColor: '#1e293b', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.Shield />
        </div>
        <div style={{ height: '1px', width: '30px', background: '#334155' }}></div>
        <div style={{ color: '#94a3b8', cursor: 'pointer' }}><Icons.Activity /></div>
      </div>

      {/* 2. CHAT LIST SIDEBAR */}
      <div style={{ width: '350px', backgroundColor: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: '#1e293b' }}>Conversations</h2>
          <div style={{ position: 'relative' }}>
            <input 
              placeholder="Search..." 
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', outline: 'none', fontSize: '14px' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {filteredSessions.map((session) => {
            const isActive = activeSession?.sessionId === session.sessionId;
            return (
              <div 
                key={session.sessionId}
                onClick={() => loadChat(session)}
                style={{
                  padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px',
                  backgroundColor: isActive ? '#f8fafc' : 'transparent',
                  transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex', gap: '12px', alignItems: 'center',
                  boxShadow: isActive ? '0 4px 6px -1px rgb(0 0 0 / 0.05)' : 'none'
                }}
              >
                <div style={{ width: '45px', height: '45px', borderRadius: '14px', background: isActive ? accentColor : '#e2e8f0', color: isActive ? 'white' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.User size={22} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>{session.email.split('@')[0]}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Now</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.messages[0]?.message || "New customer"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CHAT WORKSPACE */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>{activeSession.email}</span>
                <span style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: 'bold' }}>LIVE</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '20px' }} />
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ 
                    padding: '14px 18px', borderRadius: '18px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : 'white',
                    color: msg.sender === 'admin' ? 'white' : '#1e293b',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)', fontSize: '14px', lineHeight: '1.5'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '24px', background: 'white' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                {['Pricing Query', 'Refund Status', 'Greeting'].map(t => (
                  <button key={t} onClick={() => handleReply(t)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f1f5f9', padding: '8px', borderRadius: '16px' }}>
                <input 
                  placeholder="Reply to customer..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', padding: '10px', outline: 'none' }}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button onClick={() => handleReply()} style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: accentColor, border: 'none', cursor: 'pointer' }}>
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <p>Select a message to view the thread</p>
          </div>
        )}
      </div>

      {/* 4. DETAILS PANEL (TABS) */}
      <div style={{ width: '300px', backgroundColor: 'white', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', marginBottom: '20px' }}>
            <button onClick={() => setActiveTab('chat')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: 'bold', borderBottom: activeTab === 'chat' ? `2px solid ${accentColor}` : 'none', cursor: 'pointer' }}>INFO</button>
            <button onClick={() => setActiveTab('notes')} style={{ flex: 1, padding: '10px', border: 'none', background: 'none', fontSize: '12px', fontWeight: 'bold', borderBottom: activeTab === 'notes' ? `2px solid ${accentColor}` : 'none', cursor: 'pointer' }}>NOTES</button>
        </div>
        
        {activeTab === 'chat' && activeSession ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: '#f1f5f9', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icons.User size={30} />
              </div>
              <h3 style={{ margin: 0 }}>{activeSession.email.split('@')[0]}</h3>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              <p><b>Location:</b> New York, US</p>
              <p><b>Browser:</b> Chrome (MacOS)</p>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#94a3b8' }}>No data available</div>
        )}
      </div>
    </div>
  );
}