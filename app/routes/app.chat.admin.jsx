import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";
// Assuming you have a way to get the current shop/storeId (e.g., from request params or session)
// import { authenticate } from "../shopify.server"; 

export const loader = async ({ request }) => {
  // 1. Get the current store identifier (e.g., from URL or Auth session)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop"); // Example: my-store.myshopify.com

  // 2. Query ONLY sessions that belong to this specific shop
  const sessions = await db.chatSession.findMany({
    where: { 
      // This is the key change: Filtering by store
      shop: shop 
    },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" }
  });

  return json({ sessions, currentShop: shop });
};

// --- ICONS SET ---
const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  User: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Store: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
};

export default function NeuralChatAdmin() {
  const { sessions, currentShop } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [accentColor] = useState("#8b5e3c"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [locationInfo, setLocationInfo] = useState({ city: "Detecting...", country: "", flag: "" });

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchLocation = async () => {
    setLocationInfo({ city: "Locating...", country: "", flag: "" });
    try {
      const res = await fetch(`https://ipapi.co/json/`);
      const data = await res.json();
      setLocationInfo({ 
        city: data.city || "Unknown", 
        country: data.country_name || "Region",
        flag: `https://flagcdn.com/w20/${data.country_code?.toLowerCase()}.png`
      });
    } catch (e) {
      setLocationInfo({ city: "Private", country: "IP", flag: "" });
    }
  };

  const loadChat = async (session) => {
    setActiveSession(session);
    fetchLocation();
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleReply = (text = null) => {
    const finalMsg = text || reply;
    if (!finalMsg.trim() || !activeSession) return;
    const newMessage = { 
        message: finalMsg, 
        sender: "admin", 
        createdAt: new Date().toISOString(), 
        sessionId: activeSession.sessionId,
        shop: currentShop // Ensure reply is tied to the shop
    };
    setMessages(prev => [...prev, newMessage]);
    setReply("");
    fetcher.submit(JSON.stringify(newMessage), { method: "post", action: "/app/chat/message", encType: "application/json" });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fdfaf5', padding: '20px', boxSizing: 'border-box', gap: '20px', color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* 1. SIDEBAR WITH STORE INFO */}
      <div style={{ width: '380px', background: '#fffcf9', borderRadius: '30px', border: '1px solid #f1ece4', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(139, 94, 60, 0.05)' }}>
        <div style={{ padding: '30px 24px', borderBottom: '1px solid #fdfaf5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5e3c', marginBottom: '12px' }}>
            <Icons.Store />
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>{currentShop?.split('.')[0] || "Main Store"}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Inquiries</h2>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '13px', color: '#c2b9af' }}><Icons.Search /></span>
            <input placeholder="Search customer..." style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none' }} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 20px' }}>
          {filteredSessions.length > 0 ? filteredSessions.map(session => (
            <div key={session.sessionId} onClick={() => loadChat(session)} style={{ padding: '20px', borderRadius: '22px', cursor: 'pointer', marginBottom: '10px', transition: '0.3s', background: activeSession?.sessionId === session.sessionId ? '#fff1e6' : 'transparent' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: activeSession?.sessionId === session.sessionId ? accentColor : '#f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeSession?.sessionId === session.sessionId ? 'white' : '#9d9489' }}><Icons.User /></div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{session.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#a8a29e' }}>{session.messages[0]?.message.slice(0, 30)}...</div>
                </div>
              </div>
            </div>
          )) : <div style={{ textAlign: 'center', padding: '40px', color: '#c2b9af', fontSize: '14px' }}>No chats found for this store.</div>}
        </div>
      </div>

      {/* 2. CHAT WORKSPACE */}
      <div style={{ flex: 1, background: '#ffffff', borderRadius: '35px', border: '1px solid #f1ece4', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.03)' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '25px 40px', borderBottom: '1px solid #fdfaf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#d4a373', boxShadow: '0 0 10px #d4a373' }}></div>
                    <h3 style={{ margin: 0, fontWeight: '900' }}>{activeSession.email}</h3>
                </div>
                <div style={{ fontSize: '11px', fontWeight: '800', color: '#8b5e3c', background: '#fff1e6', padding: '6px 12px', borderRadius: '10px' }}>
                    STORE: {currentShop?.toUpperCase()}
                </div>
            </div>

            <div ref={scrollRef} style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#fffcf9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  <div style={{ padding: '16px 24px', borderRadius: '25px', fontSize: '15px', lineHeight: '1.6', background: msg.sender === 'admin' ? accentColor : 'white', color: msg.sender === 'admin' ? 'white' : '#433d3c', boxShadow: msg.sender === 'admin' ? `0 10px 20px ${accentColor}30` : '0 4px 15px rgba(0,0,0,0.03)', border: msg.sender === 'admin' ? 'none' : '1px solid #f1ece4' }}>
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '30px 40px', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: '#fdfaf5', borderRadius: '100px', padding: '10px 10px 10px 25px', border: '1px solid #f1ece4' }}>
                <input placeholder="Type a response..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '15px' }} value={reply} onChange={(e) => setReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                <button onClick={() => handleReply()} style={{ width: '50px', height: '50px', borderRadius: '50%', background: accentColor, border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Send />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#c2b9af', gap: '10px' }}>
            <Icons.User size={80} />
            <p style={{ fontWeight: '700' }}>Select a customer from {currentShop?.split('.')[0]}</p>
          </div>
        )}
      </div>

      {/* 3. INTELLIGENCE PANEL */}
      <div style={{ width: '320px', background: '#fffcf9', borderRadius: '30px', border: '1px solid #f1ece4', padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
         <h4 style={{ fontSize: '12px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase', letterSpacing: '1px' }}>Store Intelligence</h4>
         {activeSession ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px', border: '1px solid #f1ece4' }}>
                    <div style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '8px' }}>VISITOR LOCATION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                        {locationInfo.flag && <img src={locationInfo.flag} alt="flag" style={{ width: '18px' }} />}
                        {locationInfo.city}, {locationInfo.country}
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#ffffff', borderRadius: '20px', border: '1px solid #f1ece4' }}>
                    <div style={{ fontSize: '11px', color: '#a8a29e', marginBottom: '8px' }}>LOCAL TIME</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                        <Icons.Clock /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#fff1e6', borderRadius: '20px', border: `1px solid ${accentColor}20` }}>
                    <div style={{ fontSize: '11px', color: accentColor, fontWeight: '900', marginBottom: '5px' }}>SESSION ORIGIN</div>
                    <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#8b5e3c' }}>This customer is messaging via <b>{currentShop}</b>. Only store-specific data is visible here.</div>
                </div>
             </div>
         ) : <div style={{ color: '#c2b9af', fontSize: '13px' }}>Waiting for connection...</div>}
      </div>
    </div>
  );
}