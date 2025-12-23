import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CUSTOM GLYPHS ---
const Icons = {
  Send: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
  ),
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
  ),
  Note: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
  ),
  Globe: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
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
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [searchTerm, setSearchTerm] = useState("");
  const [rightPanelTab, setRightPanelTab] = useState("info");

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
      backgroundColor: '#0f172a', // Deep midnight background
      padding: '12px', boxSizing: 'border-box', gap: '12px',
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' 
    }}>
      
      {/* 1. GLASS-LIST SIDEBAR */}
      <div style={{ 
        width: '360px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)',
        borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '800', margin: 0 }}>Inbox</h1>
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ border: 'none', background: 'none', width: '24px', height: '24px', cursor: 'pointer' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '12px', color: '#94a3b8' }}><Icons.Search /></span>
            <input 
              placeholder="Jump to conversation..." 
              style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '14px', border: 'none', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none' }}
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
                  padding: '16px', borderRadius: '18px', cursor: 'pointer', marginBottom: '8px', transition: '0.2s',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: isActive ? `1px solid ${accentColor}` : '1px solid transparent'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: isActive ? accentColor : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <Icons.User />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{session.email.split('@')[0]}</span>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>2m ago</span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.messages[0]?.message || "No messages"}
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
        flex: 1, background: 'white', borderRadius: '32px', 
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {activeSession ? (
          <>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.User size={24} /></div>
                   <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', border: '3px solid white' }}></div>
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{activeSession.email}</h2>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Active on Chrome • New York</span>
                </div>
              </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ 
                  alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', 
                  maxWidth: '70%',
                  animation: 'slideUp 0.3s ease-out' 
                }}>
                  <div style={{ 
                    padding: '14px 20px', borderRadius: msg.sender === 'admin' ? '22px 22px 4px 22px' : '4px 22px 22px 22px',
                    backgroundColor: msg.sender === 'admin' ? accentColor : 'white',
                    color: msg.sender === 'admin' ? 'white' : '#1e293b',
                    boxShadow: msg.sender === 'admin' ? `0 10px 15px -3px ${accentColor}40` : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    fontSize: '14px', lineHeight: '1.6'
                  }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            {/* FLOATING ACTION INPUT */}
            <div style={{ padding: '24px 32px', background: 'white' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                {['👋 Hey there!', 'Let me check...', 'All set! ✅'].map(chip => (
                  <button key={chip} onClick={() => handleReply(chip)} style={{ padding: '8px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>{chip}</button>
                ))}
              </div>
              <div style={{ 
                display: 'flex', alignItems: 'center', background: '#f8fafc', 
                borderRadius: '20px', padding: '8px 8px 8px 20px', border: '1px solid #e2e8f0' 
              }}>
                <input 
                  placeholder="Reply to customer..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px' }}
                  value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                />
                <button 
                  onClick={() => handleReply()}
                  style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: accentColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', marginBottom: '16px' }}><Icons.User size={40} /></div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Select a conversation</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Pick a user from the sidebar to start.</p>
          </div>
        )}
      </div>

      {/* 3. DETAILS INFOGRAPHIC PANEL */}
      <div style={{ 
        width: '320px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(12px)',
        borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '24px',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setRightPanelTab('info')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: rightPanelTab === 'info' ? 'white' : 'transparent', color: rightPanelTab === 'info' ? '#0f172a' : 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>INFO</button>
          <button onClick={() => setRightPanelTab('notes')} style={{ flex: 1, padding: '8px', borderRadius: '10px', border: 'none', background: rightPanelTab === 'notes' ? 'white' : 'transparent', color: rightPanelTab === 'notes' ? '#0f172a' : 'white', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>NOTES</button>
        </div>

        {activeSession ? (
          <div style={{ color: 'white' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: accentColor, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {activeSession.email[0].toUpperCase()}
              </div>
              <h3 style={{ margin: 0 }}>{activeSession.email}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ color: accentColor }}><Icons.Globe /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Location</div>
                  <div style={{ fontSize: '13px' }}>New York, United States</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ color: accentColor }}><Icons.Note /></div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Last Seen</div>
                  <div style={{ fontSize: '13px' }}>Today, 12:45 PM</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>No session selected</div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}