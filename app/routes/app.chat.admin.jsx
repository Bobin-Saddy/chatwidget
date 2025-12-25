import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";

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
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
  ),
  Store: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
  ),
  Paperclip: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
  ),
  Smile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
  ),
  X: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  )
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
  const [locationInfo, setLocationInfo] = useState({ city: "Detecting...", country: "", flag: "" });

  const fetcher = useFetcher();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ["😊", "👍", "❤️", "🙌", "✨", "🔥", "✅", "🤔", "💡", "🚀", "👋", "🙏"];

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
    reader.onloadend = () => handleReply(`Sent: ${file.name}`, reader.result);
    reader.readAsDataURL(file);
  };

  const addEmoji = (emoji) => {
    setReply(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = (text = null, fileUrl = null) => {
    const finalMsg = text || reply;
    if ((!finalMsg.trim() && !fileUrl) || !activeSession) return;
    
    const newMessage = { 
      message: finalMsg, 
      sender: "admin", 
      createdAt: new Date().toISOString(), 
      sessionId: activeSession.sessionId,
      shop: currentShop,
      fileUrl: fileUrl || null 
    };

    setMessages(prev => [...prev, newMessage]);
    setReply("");
    fetcher.submit(JSON.stringify(newMessage), { method: "post", action: "/app/chat/message", encType: "application/json" });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fdfaf5', padding: '20px', boxSizing: 'border-box', gap: '20px', color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* --- IMAGE POPUP --- */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <button style={{ position: 'absolute', top: '30px', right: '30px', background: 'none', border: 'none' }}><Icons.X /></button>
          <img src={selectedImage} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} alt="Full view" />
        </div>
      )}

      {/* 1. SIDEBAR */}
      <div style={{ width: '380px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '30px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: accentColor, marginBottom: '12px' }}>
            <Icons.Store /><span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{currentShop}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Messages</h2>
        </div>
        <div style={{ padding: '0 24px 20px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '13px', color: '#c2b9af' }}><Icons.Search /></span>
            <input placeholder="Search..." style={{ width: '100%', padding: '12px 42px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none' }} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px' }}>
          {filteredSessions.map(session => (
            <div key={session.sessionId} onClick={() => loadChat(session)} style={{ padding: '20px', borderRadius: '22px', cursor: 'pointer', marginBottom: '10px', background: activeSession?.sessionId === session.sessionId ? '#fff1e6' : 'transparent' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: activeSession?.sessionId === session.sessionId ? accentColor : '#f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeSession?.sessionId === session.sessionId ? 'white' : '#9d9489' }}><Icons.User /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{session.email?.split('@')[0]}</div>
                  <div style={{ fontSize: '12px', color: '#a8a29e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ccc' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '25px 40px', borderBottom: '1px solid #f1ece4' }}>
                <h3 style={{ margin: 0, fontWeight: '900' }}>{activeSession.email}</h3>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, i) => {
                const isImg = msg.fileUrl && (msg.fileUrl.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) != null || msg.fileUrl.startsWith('data:image'));
                return (
                  <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ 
                      padding: isImg ? '10px' : '16px 24px', 
                      borderRadius: '20px',
                      background: msg.sender === 'admin' ? accentColor : 'white',
                      color: msg.sender === 'admin' ? 'white' : '#433d3c',
                      border: msg.sender === 'admin' ? 'none' : '1px solid #f1ece4',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                    }}>
                      {isImg ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={msg.fileUrl} 
                            onClick={() => setSelectedImage(msg.fileUrl)}
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '12px', cursor: 'zoom-in', display: 'block' }} 
                            alt="Sent content" 
                          />
                          <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.8 }}>{msg.message}</div>
                        </div>
                      ) : (
                        <div>
                           {msg.message}
                           {msg.fileUrl && <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '10px', fontSize: '12px', color: 'inherit', fontWeight: 'bold' }}>📎 View Attachment</a>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '30px 40px', borderTop: '1px solid #f1ece4', position: 'relative' }}>
              
              {/* EMOJI PICKER POPUP */}
              {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '100px', left: '40px', background: 'white', padding: '15px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', zIndex: 100 }}>
                  {emojis.map(e => (
                    <button key={e} onClick={() => addEmoji(e)} style={{ fontSize: '20px', border: 'none', background: 'none', cursor: 'pointer' }}>{e}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', background: '#fdfaf5', borderRadius: '100px', padding: '8px 10px 8px 20px', border: '1px solid #f1ece4' }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', color: '#c2b9af' }}><Icons.Smile /></button>
                <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px', color: '#c2b9af' }}><Icons.Paperclip /></button>
                
                <input placeholder="Reply..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px', color: '#433d3c' }} value={reply} onChange={(e) => setReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                <button onClick={() => handleReply()} style={{ width: '45px', height: '45px', borderRadius: '50%', background: accentColor, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Send /></button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#c2b9af' }}>
            <Icons.User size={80} /><p style={{ fontWeight: '800' }}>Select a chat to start</p>
          </div>
        )}
      </div>

      {/* 3. INTELLIGENCE PANEL */}
      <div style={{ width: '300px', padding: '30px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
         <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase' }}>Visitor Details</h4>
         {activeSession && (
           <div style={{ padding: '20px', background: '#fff', borderRadius: '20px', border: '1px solid #f1ece4' }}>
              <div style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '800', marginBottom: '10px' }}>LOCAL TIME</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900' }}>
                <Icons.Clock /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
         )}
      </div>
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2d9d0; border-radius: 10px; }
      `}</style>
    </div>
  );
}