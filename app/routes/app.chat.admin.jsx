import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- ARTISAN ICON SET ---
const Icons = {
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
  ),
  Folder: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function CreamStudioAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor, setAccentColor] = useState("#a67c52"); // Muted Bronze
  const [searchTerm, setSearchTerm] = useState("");

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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
      backgroundColor: '#f8f5f0', // Aesthetic Cream
      padding: '16px', boxSizing: 'border-box', gap: '16px',
      color: '#4a443f', fontFamily: '"Plus Jakarta Sans", sans-serif'
    }}>
      
      {/* 1. NAVIGATION BAR (SLIM LEFT) */}
      <div style={{ 
        width: '72px', background: '#fffcf9', borderRadius: '24px', border: '1px solid #ede7de',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{ color: accentColor }}><Icons.Bolt /></div>
        <div style={{ color: '#c2b9af' }}><Icons.Folder /></div>
        <div style={{ marginTop: 'auto', width: '24px', height: '24px', borderRadius: '50%', background: accentColor, border: '4px solid white', cursor: 'pointer' }}></div>
      </div>

      {/* 2. CONVERSATION PANEL */}
      <div style={{ 
        width: '350px', background: '#fffcf9', borderRadius: '24px', border: '1px solid #ede7de',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#2d2a27' }}>Conversations</h2>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '11px', color: '#c2b9af' }}><Icons.Search /></span>
            <input 
              placeholder="Search..." 
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '12px', border: '1px solid #ede7de', backgroundColor: '#fdfcfb', outline: 'none', fontSize: '13px' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {filteredSessions.map(session => (
            <div 
              key={session.sessionId} onClick={() => loadChat(session)}
              style={{
                padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '6px',
                backgroundColor: activeSession?.sessionId === session.sessionId ? '#f5f0e8' : 'transparent',
                transition: '0.2s'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ede7de', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d9489' }}>
                  <Icons.User />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{session.email.split('@')[0]}</div>
                  <div style={{ fontSize: '12px', color: '#9d9489', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.messages[0]?.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MAIN CHAT ARENA */}
      <div style={{ 
        flex: 1, background: '#ffffff', borderRadius: '28px', border: '1px solid #ede7de',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
      }}>
        {activeSession ? (
          <>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #f8f5f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontWeight: '800', fontSize: '16px' }}>{activeSession.email}</div>
                <span style={{ padding: '4px 10px', background: '#f5f0e8', color: accentColor, borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>PRIORITY</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ border: 'none', background: '#f8f5f0', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Close Ticket</button>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#fdfcfb', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ 
                    padding: '12px 18px', borderRadius: '18px', fontSize: '14px', lineHeight: '1.5',
                    backgroundColor: msg.sender === 'admin' ? accentColor : '#ffffff',
                    color: msg.sender === 'admin' ? '#ffffff' : '#4a443f',
                    border: msg.sender === 'admin' ? 'none' : '1px solid #ede7de',
                    boxShadow: msg.sender === 'admin' ? `0 8px 16px ${accentColor}30` : '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT SECTION */}
            <div style={{ padding: '24px 30px', background: '#ffffff' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {['Resolution Update', 'Request Docs', 'Closing Session'].map(btn => (
                  <button key={btn} onClick={() => handleReply(btn)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #ede7de', background: '#fdfcfb', fontSize: '11px', fontWeight: '700', color: '#9d9489', cursor: 'pointer' }}>{btn}</button>
                ))}
              </div>
              <div style={{ display: 'flex', background: '#f8f5f0', borderRadius: '16px', padding: '8px 8px 8px 16px', border: '1px solid #ede7de', alignItems: 'center' }}>
                <input 
                  placeholder="Compose a response..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#4a443f' }}
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button onClick={() => handleReply()} style={{ width: '40px', height: '40px', borderRadius: '12px', background: accentColor, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2b9af' }}>
            <Icons.User size={48} />
          </div>
        )}
      </div>

      {/* 4. UTILITY PANEL (RIGHT) */}
      <div style={{ 
        width: '280px', background: '#fffcf9', borderRadius: '24px', border: '1px solid #ede7de',
        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#c2b9af', textTransform: 'uppercase' }}>User Insights</h4>
        {activeSession ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f8f5f0', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', color: '#9d9489' }}>Account Type</div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>Enterprise Member</div>
            </div>
            <div style={{ padding: '16px', background: '#f8f5f0', borderRadius: '16px' }}>
              <div style={{ fontSize: '11px', color: '#9d9489' }}>Last Active</div>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>4 mins ago</div>
            </div>
            <div style={{ marginTop: 'auto', textAlign: 'center' }}>
              <button style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#2d2a27', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>Mark as Resolved</button>
            </div>
          </div>
        ) : null}
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #ede7de; border-radius: 10px; }
      `}</style>
    </div>
  );
}