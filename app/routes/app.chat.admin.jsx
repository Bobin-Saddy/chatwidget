import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CUSTOM SVG ICONS ---
const Icons = {
  Send: ({ color = "currentColor" }) => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
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
  const [accentColor, setAccentColor] = useState("#6366f1"); // Indigo modern default

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const loadChat = async (session) => {
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
    setActiveSession(session);
  };

  const handleReply = (customMsg = null) => {
    const text = customMsg || reply;
    if (!text.trim()) return;
    const data = { sessionId: activeSession.sessionId, message: text, sender: "admin" };
    fetcher.submit(JSON.stringify(data), { method: "post", action: "/app/chat/message", encType: "application/json" });
    setMessages((prev) => [...prev, { ...data, createdAt: new Date().toISOString() }]);
    if (!customMsg) setReply("");
  };

  return (
    <div style={{ 
      fontFamily: "'Inter', sans-serif", 
      backgroundColor: "#f8fafc", 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column" 
    }}>
      {/* HEADER */}
      <header style={{ 
        height: "64px", 
        backgroundColor: "#fff", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        padding: "0 24px" 
      }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e293b" }}>Support Center</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Theme Color</span>
          <input 
            type="color" 
            value={accentColor} 
            onChange={(e) => setAccentColor(e.target.value)}
            style={{ border: "none", cursor: "pointer", width: "32px", height: "32px", borderRadius: "8px", background: "none" }}
          />
        </div>
      </header>

      <main style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <aside style={{ 
          width: "350px", 
          backgroundColor: "#fff", 
          borderRight: "1px solid #e2e8f0", 
          display: "flex", 
          flexDirection: "column" 
        }}>
          <div style={{ padding: "20px" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}><Icons.Search /></div>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%", padding: "12px 12px 12px 40px", borderRadius: "10px", 
                  border: "1px solid #e2e8f0", outline: "none", fontSize: "0.9rem" 
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredSessions.map((item) => {
              const isActive = activeSession?.sessionId === item.sessionId;
              return (
                <div 
                  key={item.sessionId}
                  onClick={() => loadChat(item)}
                  style={{
                    padding: "16px 20px", cursor: "pointer", borderLeft: `4px solid ${isActive ? accentColor : "transparent"}`,
                    backgroundColor: isActive ? `${accentColor}10` : "transparent", transition: "0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>{item.email || "Guest"}</span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{new Date().toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.messages[0]?.message || "No messages yet"}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CHAT AREA */}
        <section style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#fff" }}>
          {activeSession ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: `${accentColor}20`, color: accentColor, padding: "8px", borderRadius: "50%" }}><Icons.User /></div>
                <div>
                  <div style={{ fontWeight: "600" }}>{activeSession.email}</div>
                  <div style={{ fontSize: "0.75rem", color: "#22c55e" }}>● Active Now</div>
                </div>
              </div>

              {/* Message List */}
              <div ref={scrollRef} style={{ 
                flex: 1, overflowY: "auto", padding: "24px", display: "flex", 
                flexDirection: "column", gap: "16px", backgroundColor: "#f8fafc" 
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ 
                      background: msg.sender === 'admin' ? accentColor : '#fff',
                      color: msg.sender === 'admin' ? '#fff' : '#1e293b',
                      padding: '12px 16px', borderRadius: msg.sender === 'admin' ? '18px 18px 0 18px' : '0 18px 18px 18px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '0.9rem', lineHeight: '1.5'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "6px", textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Footer */}
              <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  {['👋 Hi!', 'Working on it', 'Solved!'].map(q => (
                    <button key={q} onClick={() => handleReply(q)} style={{ 
                      padding: "6px 14px", borderRadius: "20px", border: "1px solid #e2e8f0", 
                      backgroundColor: "#fff", fontSize: "0.75rem", cursor: "pointer", color: "#475569" 
                    }}>{q}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input 
                    value={reply} 
                    onChange={(v) => setReply(v.target.value)} 
                    placeholder="Type your reply..." 
                    onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", outline: "none" }}
                  />
                  <button 
                    onClick={() => handleReply()}
                    style={{ 
                      backgroundColor: accentColor, color: "#fff", border: "none", 
                      padding: "0 20px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center" 
                    }}
                  >
                    <Icons.Send color="white" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ background: "#f1f5f9", padding: "20px", borderRadius: "50%", marginBottom: "16px" }}>
                <Icons.User />
              </div>
              <p style={{ fontWeight: "500" }}>Select a conversation to start</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}