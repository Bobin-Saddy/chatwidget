import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";

// --- REFINED ICON SET ---
const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  User: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Store: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Paperclip: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>,
  Smile: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  if (!shop) throw new Response("Unauthorized", { status: 401 });

  const sessions = await db.chatSession.findMany({
    where: { shop: shop },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions, currentShop: shop });
};

export default function NeuralChatAdmin() {
  const { sessions, currentShop } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor] = useState("#8b5e3c"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fetcher = useFetcher();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ["😊", "👍", "❤️", "🙌", "✨", "🔥", "✅", "🤔", "💡", "🚀", "👋", "🙏", "🎉", "💯", "🎈", "✉️"];

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
      const data = await res.json();
      if (data.length !== messages.length) setMessages(data);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeSession, messages.length]);

  const loadChat = async (session) => {
    setActiveSession(session);
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => handleReply(`Sent image: ${file.name}`, reader.result);
    reader.readAsDataURL(file);
  };

  const handleReply = (text = null, fileUrl = null) => {
    const finalMsg = text || reply;
    if ((!finalMsg.trim() && !fileUrl) || !activeSession) return;
    
    const newMessage = { 
      message: finalMsg, sender: "admin", createdAt: new Date().toISOString(), 
      sessionId: activeSession.sessionId, shop: currentShop, fileUrl: fileUrl || null 
    };

    setMessages(prev => [...prev, newMessage]);
    setReply("");
    setShowEmojiPicker(false);
    fetcher.submit(JSON.stringify(newMessage), { method: "post", action: "/app/chat/message", encType: "application/json" });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 40px)', width: 'calc(100vw - 40px)', backgroundColor: '#fff', margin: '20px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)', border: '1px solid #eee', color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* --- IMAGE LIGHTBOX --- */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 22, 21, 0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }}>
          <button style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer' }}><Icons.X /></button>
          <img src={selectedImage} style={{ maxWidth: '85%', maxHeight: '85%', borderRadius: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} alt="Preview" />
        </div>
      )}

      {/* 1. SIDEBAR: Inbox */}
      <div style={{ width: '360px', borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', background: '#fcfaf8' }}>
        <div style={{ padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor, marginBottom: '16px', opacity: 0.8 }}>
            <Icons.Store /><span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>{currentShop.toUpperCase()}</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#1a1615', letterSpacing: '-0.5px' }}>Inquiries</h2>
        </div>
        
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '16px', color: '#a8a29e' }}><Icons.Search /></span>
            <input 
              placeholder="Search by email..." 
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#fff', outline: 'none', fontSize: '14px', transition: 'border 0.2s' }} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {filteredSessions.map(session => (
            <div key={session.sessionId} onClick={() => loadChat(session)} style={{ padding: '16px', borderRadius: '20px', cursor: 'pointer', marginBottom: '8px', transition: 'all 0.2s ease', background: activeSession?.sessionId === session.sessionId ? '#fff' : 'transparent', boxShadow: activeSession?.sessionId === session.sessionId ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none', border: activeSession?.sessionId === session.sessionId ? '1px solid #f0f0f0' : '1px solid transparent' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: activeSession?.sessionId === session.sessionId ? accentColor : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeSession?.sessionId === session.sessionId ? 'white' : '#9d9489', transition: '0.3s' }}>
                  <Icons.User size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1615' }}>{session.email?.split('@')[0]}</div>
                  <div style={{ fontSize: '13px', color: '#78716c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message || "New Conversation"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '24px 40px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: '800', fontSize: '20px' }}>{activeSession.email}</h3>
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>● Active Now</span>
                </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: '#faf9f8' }}>
              {messages.map((msg, i) => {
                const isImg = msg.fileUrl && (msg.fileUrl.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) != null || msg.fileUrl.startsWith('data:image'));
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '75%', animation: 'slideUp 0.3s ease' }}>
                    <div style={{ 
                      padding: isImg ? '12px' : '16px 20px', borderRadius: isAdmin ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                      background: isAdmin ? accentColor : '#fff', color: isAdmin ? '#fff' : '#433d3c',
                      boxShadow: isAdmin ? `0 10px 25px -5px ${accentColor}40` : '0 4px 10px rgba(0,0,0,0.03)',
                      border: isAdmin ? 'none' : '1px solid #f0f0f0'
                    }}>
                      {isImg ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={msg.fileUrl} onClick={() => setSelectedImage(msg.fileUrl)}
                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '14px', cursor: 'zoom-in', display: 'block', transition: 'transform 0.2s' }} 
                            alt="attachment" 
                          />
                          <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.9, fontWeight: '500' }}>{msg.message}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '15px', lineHeight: '1.6' }}>
                           {msg.message}
                           {msg.fileUrl && <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '12px', fontSize: '13px', color: isAdmin ? '#fff' : accentColor, fontWeight: '800', textDecoration: 'underline' }}>📎 Download Attachment</a>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: '30px 40px', background: '#fff', borderTop: '1px solid #f0f0f0', position: 'relative' }}>
              
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100px', left: '40px', background: '#fff', padding: '16px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid #eee', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', zIndex: 100, animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                  {emojis.map(e => (
                    <button key={e} onClick={() => setReply(r => r + e)} style={{ fontSize: '22px', border: 'none', background: 'none', cursor: 'pointer', padding: '5px', transition: 'transform 0.1s' }} onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'} onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>{e}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', background: '#f8f7f6', borderRadius: '20px', padding: '10px 10px 10px 20px', border: '1px solid #eee' }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '8px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = accentColor}><Icons.Smile /></button>
                  <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '8px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = accentColor}><Icons.Paperclip /></button>
                </div>
                
                <input 
                  placeholder="Type a message..." 
                  style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#1a1615', padding: '0 15px' }} 
                  value={reply} onChange={(e) => setReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleReply()} 
                />
                
                <button 
                  onClick={() => handleReply()} 
                  style={{ width: '48px', height: '48px', borderRadius: '16px', background: accentColor, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${accentColor}40`, transition: 'transform 0.2s' }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#d1cfcd', background: '#fcfaf8' }}>
            <div style={{ padding: '40px', borderRadius: '50%', background: '#fff', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}><Icons.User size={80} /></div>
            <p style={{ fontWeight: '700', fontSize: '18px', color: '#a8a29e' }}>Select a conversation to begin</p>
          </div>
        )}
      </div>

      {/* 3. INTELLIGENCE PANEL */}
      <div style={{ width: '320px', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#fff' }}>
         <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Visitor Insights</h4>
         
         {activeSession ? (
           <>
            <div style={{ padding: '20px', background: '#f8f7f6', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '800', marginBottom: '12px' }}>SESSION STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: '#1a1615' }}>
                <Icons.Clock /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '12px', color: '#78716c', marginTop: '4px' }}>Local visitor time</div>
            </div>

            <div style={{ padding: '20px', background: '#f8f7f6', borderRadius: '24px', border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '800', marginBottom: '12px' }}>ORIGIN</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: '#1a1615' }}>
                <Icons.MapPin /> Detect Mode Active
              </div>
            </div>

            <div style={{ padding: '24px', background: '#fff1e6', borderRadius: '24px', color: '#8b5e3c' }}>
              <div style={{ fontSize: '10px', fontWeight: '900', marginBottom: '8px' }}>STORE SCOPE</div>
              <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>Customer is browsing <b>{currentShop}</b>. Loyalty context is being retrieved...</p>
            </div>
           </>
         ) : (
           <div style={{ textAlign: 'center', padding: '40px 0', color: '#d1cfcd', fontSize: '13px' }}>No active session selected for intelligence analysis.</div>
         )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}