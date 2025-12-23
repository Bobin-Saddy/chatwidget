import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";
import { authenticate } from "../shopify.server";

// --- ICONS ---
const Icons = {
  Send: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  User: ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Store: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
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
  const [locationInfo, setLocationInfo] = useState({ city: "Detecting...", country: "", flag: "" });

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // 1. REQUEST NOTIFICATION PERMISSION
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // 2. REAL-TIME POLLING & NOTIFICATION LOGIC
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Fetch latest sessions to see if anyone sent a message
      const res = await fetch(`/app/chat/sessions?shop=${currentShop}`);
      if (!res.ok) return;
      const latestSessions = await res.json();

      latestSessions.forEach(session => {
        const lastMsg = session.messages[0];
        if (!lastMsg || lastMsg.sender !== "user") return;

        const storageKey = `notified_msg_${session.sessionId}`;
        const lastNotifiedId = localStorage.getItem(storageKey);

        // If this is a new message we haven't notified for
        if (lastNotifiedId !== String(lastMsg.id)) {
          // Play Sound
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
          audio.play().catch(() => {});

          // Show Browser Notification
          if (Notification.permission === "granted") {
            new Notification(`New Message from ${session.email}`, {
              body: lastMsg.message,
              icon: "/favicon.ico", // Path to your app icon
            });
          }

          // Mark as notified
          localStorage.setItem(storageKey, lastMsg.id);
        }
      });

      // Update active chat window if open
      if (activeSession) {
        const msgRes = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
        const newMsgs = await msgRes.json();
        if (newMsgs.length !== messages.length) setMessages(newMsgs);
      }
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(pollInterval);
  }, [activeSession, messages.length, currentShop]);

  // UI HELPERS
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchLocation = async () => {
    try {
      const res = await fetch(`https://ipapi.co/json/`);
      const data = await res.json();
      setLocationInfo({ 
        city: data.city || "Unknown", 
        country: data.country_name || "Region",
        flag: `https://flagcdn.com/w20/${data.country_code?.toLowerCase()}.png`
      });
    } catch (e) { setLocationInfo({ city: "Private", country: "Network", flag: "" }); }
  };

  const loadChat = async (session) => {
    setActiveSession(session);
    fetchLocation();
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
    // Clear notification badge for this session
    if (data.length > 0) {
      localStorage.setItem(`notified_msg_${session.sessionId}`, String(data[data.length - 1].id));
    }
  };

  const handleReply = (text = null) => {
    const finalMsg = text || reply;
    if (!finalMsg.trim() || !activeSession) return;
    const newMessage = { message: finalMsg, sender: "admin", createdAt: new Date().toISOString(), sessionId: activeSession.sessionId, shop: currentShop };
    setMessages(prev => [...prev, newMessage]);
    setReply("");
    fetcher.submit(JSON.stringify(newMessage), { method: "post", action: "/app/chat/message", encType: "application/json" });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: 'calc(100vw - 40px)', backgroundColor: '#fdfaf5', margin: '20px' , padding: '20px', boxSizing: 'border-box', gap: '20px', color: '#433d3c', fontFamily: '"Plus Jakarta Sans", sans-serif' , borderRadius: '13px' , border: '1px solid #ccc' }}>
      
      {/* 1. SIDEBAR */}
      <div style={{ width: '380px', borderRadius: '0', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '30px 24px', borderBottom: '1px solid #fdfaf5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5e3c', marginBottom: '12px' }}>
            <Icons.Store />
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>{currentShop}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Messages</h2>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <input placeholder="Search..." style={{ width: '100%', padding: '12px 12px 12px 15px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none' }} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 15px 20px' }}>
          {filteredSessions.map(session => (
            <div key={session.sessionId} onClick={() => loadChat(session)} style={{ padding: '20px', borderRadius: '22px', cursor: 'pointer', marginBottom: '10px', background: activeSession?.sessionId === session.sessionId ? '#fff1e6' : 'transparent', position: 'relative' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: activeSession?.sessionId === session.sessionId ? accentColor : '#f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeSession?.sessionId === session.sessionId ? 'white' : '#9d9489' }}><Icons.User /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{session.email.split('@')[0]}</div>
                    <div style={{ fontSize: '12px', color: '#a8a29e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.messages[0]?.message}</div>
                </div>
                {/* NEW MESSAGE DOT */}
                {session.messages[0]?.sender === 'user' && localStorage.getItem(`notified_msg_${session.sessionId}`) !== String(session.messages[0]?.id) && (
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4d4d' }}></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CHAT AREA */}
      <div style={{ flex: 1, borderRadius: '0', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '25px 40px', borderBottom: '1px solid #fdfaf5', fontWeight: '900' }}>{activeSession.email}</div>
            <div ref={scrollRef} style={{ flex: '1', padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  <div style={{ padding: '16px 24px', borderRadius: '25px', background: msg.sender === 'admin' ? accentColor : 'white', color: msg.sender === 'admin' ? 'white' : '#433d3c', border: msg.sender === 'admin' ? 'none' : '1px solid #f1ece4' }}>{msg.message}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '30px 40px', borderTop: '1px solid #fdfaf5' }}>
              <div style={{ display: 'flex', background: '#fdfaf5', borderRadius: '100px', padding: '10px 10px 10px 25px', border: '1px solid #f1ece4' }}>
                <input placeholder="Reply..." style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none' }} value={reply} onChange={(e) => setReply(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                <button onClick={() => handleReply()} style={{ width: '50px', height: '50px', borderRadius: '50%', background: accentColor, border: 'none', color: 'white', cursor: 'pointer' }}><Icons.Send /></button>
              </div>
            </div>
          </>
        ) : <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Select a chat</div>}
      </div>

      {/* 3. INFO PANEL */}
      <div style={{ width: '320px', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
         <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af' }}>SYSTEM LOGIC</h4>
         {activeSession && (
           <>
             <div style={{ padding: '20px', background: 'white', borderRadius: '22px', border: '1px solid #f1ece4' }}>
                <div style={{ fontSize: '10px', color: '#a8a29e' }}>LOCATION</div>
                <div style={{ fontWeight: '900' }}>{locationInfo.city}, {locationInfo.country}</div>
             </div>
             <div style={{ padding: '22px', background: '#fff1e6', borderRadius: '25px', color: '#8b5e3c' }}>
                Inquiry from <b>{currentShop}</b>
             </div>
           </>
         )}
      </div>
    </div>
  );
}