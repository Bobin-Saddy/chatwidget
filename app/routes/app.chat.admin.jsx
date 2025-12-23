import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";

// --- ARTISAN ICON SET ---
const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  User: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Store: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

// --- LOADER ---
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

// --- MAIN COMPONENT ---
export default function NeuralChatAdmin() {
  const { sessions, currentShop } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [accentColor] = useState("#8b5e3c");
  const [locationInfo, setLocationInfo] = useState({ city: "Detecting...", country: "", flag: "" });

  const fetcher = useFetcher();
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. REQUEST NOTIFICATION PERMISSION
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2. REAL-TIME POLLING & NOTIFICATIONS
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Check for ALL sessions to find new messages from customers
      const res = await fetch(`/app/chat/sessions?shop=${currentShop}`);
      const latestSessions = await res.json();

      latestSessions.forEach(session => {
        const lastMsg = session.messages[0];
        if (!lastMsg || lastMsg.sender !== "user") return;

        const storageKey = `notified_${session.sessionId}`;
        if (localStorage.getItem(storageKey) !== String(lastMsg.id)) {
          // Trigger Notification
          if (Notification.permission === "granted") {
            new Notification(`New Message: ${session.email}`, { body: lastMsg.message });
            new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3").play().catch(() => {});
          }
          localStorage.setItem(storageKey, lastMsg.id);
        }
      });

      // Update current chat messages if window is open
      if (activeSession) {
        const msgRes = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
        const data = await msgRes.json();
        if (data.length !== messages.length) setMessages(data);
      }
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [activeSession, messages.length, currentShop]);

  // 3. IMAGE UPLOAD HANDLING
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleReply = async (text = null) => {
    const finalMsg = text || reply;
    if (!finalMsg.trim() && !selectedImage) return;

    const newMessage = {
      message: finalMsg,
      imageUrl: selectedImage, // Sends base64 string to action
      sender: "admin",
      createdAt: new Date().toISOString(),
      sessionId: activeSession.sessionId,
      shop: currentShop
    };

    setMessages(prev => [...prev, newMessage]);
    setReply("");
    setSelectedImage(null);

    fetcher.submit(JSON.stringify(newMessage), {
      method: "post",
      action: "/app/chat/message",
      encType: "application/json"
    });
  };

  // 4. UI HELPERS
  const filteredSessions = useMemo(() => sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase())), [sessions, searchTerm]);
  
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const loadChat = async (s) => {
    setActiveSession(s);
    const res = await fetch(`/app/chat/messages?sessionId=${s.sessionId}`);
    setMessages(await res.json());
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: 'calc(100vw - 40px)', backgroundColor: '#fdfaf5', margin: '20px', padding: '20px', boxSizing: 'border-box', gap: '20px', color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif', borderRadius: '13px', border: '1px solid #ccc' }}>
      
      {/* 1. SIDEBAR */}
      <div style={{ width: '380px', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '30px 24px', borderBottom: '1px solid #fdfaf5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5e3c', marginBottom: '12px' }}>
            <Icons.Store />
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{currentShop}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Messages</h2>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#c2b9af' }}><Icons.Search /></span>
            <input placeholder="Search emails..." style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '15px', border: '1px solid #f1ece4', outline: 'none', background: 'white' }} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 20px' }}>
          {filteredSessions.map(session => (
            <div key={session.sessionId} onClick={() => loadChat(session)} style={{ padding: '20px', borderRadius: '22px', cursor: 'pointer', marginBottom: '10px', background: activeSession?.sessionId === session.sessionId ? '#fff1e6' : 'transparent', transition: '0.2s' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: activeSession?.sessionId === session.sessionId ? accentColor : '#f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Icons.User /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{session.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#a8a29e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message || "📷 Image attached"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div style={{ flex: 1, borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '25px 40px', borderBottom: '1px solid #fdfaf5', fontWeight: '900', fontSize: '18px' }}>{activeSession.email}</div>
            
            <div ref={scrollRef} style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ 
                    padding: msg.imageUrl ? '8px' : '16px 24px', 
                    borderRadius: msg.sender === 'admin' ? '25px 25px 4px 25px' : '25px 25px 25px 4px',
                    background: msg.sender === 'admin' ? accentColor : 'white',
                    color: msg.sender === 'admin' ? 'white' : '#433d3c',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                    border: msg.sender === 'admin' ? 'none' : '1px solid #f1ece4'
                  }}>
                    {msg.imageUrl && (
                        <img src={msg.imageUrl} alt="" style={{ maxWidth: '100%', borderRadius: '14px', marginBottom: msg.message ? '8px' : '0' }} />
                    )}
                    {msg.message && <div>{msg.message}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: '30px 40px', borderTop: '1px solid #fdfaf5', background: 'white' }}>
              {selectedImage && (
                <div style={{ position: 'relative', width: '70px', height: '70px', marginBottom: '15px' }}>
                    <img src={selectedImage} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover', border: '2px solid #8b5e3c' }} />
                    <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '22px', height: '22px', borderRadius: '50%', background: '#ff4d4d', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.X /></button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', background: '#fdfaf5', borderRadius: '100px', padding: '8px 8px 8px 25px', border: '1px solid #f1ece4' }}>
                <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9d9489', marginRight: '10px' }}><Icons.Image /></button>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                <input placeholder="Type your response..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px' }} value={reply} onChange={(e) => setReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                <button onClick={() => handleReply()} style={{ width: '48px', height: '48px', borderRadius: '50%', background: accentColor, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Send /></button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2b9af' }}>Select a chat to begin</div>
        )}
      </div>

      {/* 3. INFO PANEL */}
      <div style={{ width: '320px', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
         <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase', letterSpacing: '1px' }}>Context</h4>
         {activeSession && (
             <div style={{ padding: '22px', background: '#fff1e6', borderRadius: '25px', color: '#8b5e3c', fontSize: '14px', lineHeight: '1.5' }}>
                This user is inquiring via <b>{currentShop}</b>.
             </div>
         )}
      </div>
    </div>
  );
}