import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { Page, Layout, Card, ResourceList, Text, TextField, Button, Box, Badge, Divider, InlineStack } from "@shopify/polaris";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CUSTOM SVG ICONS (Native SVG to avoid library dependency) ---
const Icons = {
  Send: ({ color = "currentColor" }) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill={color}><path d="M17.707 9.293l-15-7a1 1 0 00-1.314 1.314l3 6a1 1 0 010 .786l-3 6a1 1 0 001.314 1.314l15-7a1 1 0 000-1.414z" /></svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="#637381"><path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm9.707 4.293l-4.82-4.82A5.968 5.968 0 0 0 14 8 6 6 0 1 0 8 14c1.507 0 2.89-.555 3.96-1.47l4.82 4.82a1 1 0 0 0 1.414-1.414z" /></svg>
  ),
  History: () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-7V6a1 1 0 10-2 0v4a1 1 0 00.293.707l2 2a1 1 0 001.414-1.414L11 9z" /></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" }
  });
  return json({ sessions });
};

export default function ChatAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [themeColor, setThemeColor] = useState("#005bd3"); // Primary Accent
  
  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // Search Logic
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Polling
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/app/chat/messages?sessionId=${activeSession.sessionId}`);
        const data = await res.json();
        if (data.length !== messages.length) setMessages(data);
      } catch (e) { console.error("Polling error", e); }
    }, 3000); 
    return () => clearInterval(interval);
  }, [activeSession, messages.length]);

  const loadChat = async (session) => {
    const res = await fetch(`/app/chat/messages?sessionId=${session.sessionId}`);
    const data = await res.json();
    setMessages(data);
    setActiveSession(session);
  };

  const handleReply = (text = null) => {
    const messageContent = text || reply;
    if (!messageContent.trim()) return;

    const data = { sessionId: activeSession.sessionId, message: messageContent, sender: "admin" };
    fetcher.submit(JSON.stringify(data), { method: "post", action: "/app/chat/message", encType: "application/json" });

    setMessages((prev) => [...prev, { ...data, createdAt: new Date().toISOString() }]);
    if (!text) setReply("");
  };

  return (
    <Page title="Support Dashboard" subtitle="Real-time customer engagement">
      <Layout>
        {/* Sidebar */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="300">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f4f6f8', padding: '8px 12px', borderRadius: '8px' }}>
                <Icons.Search />
                <input 
                  placeholder="Search by email..." 
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Box>
            <Divider />
            <div style={{ height: '600px', overflowY: 'auto' }}>
              <ResourceList
                resourceName={{ singular: 'chat', plural: 'chats' }}
                items={filteredSessions}
                renderItem={(item) => {
                  const isActive = activeSession?.sessionId === item.sessionId;
                  return (
                    <div 
                      onClick={() => loadChat(item)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        backgroundColor: isActive ? '#f0f4ff' : 'white',
                        borderLeft: isActive ? `4px solid ${themeColor}` : '4px solid transparent',
                        borderBottom: '1px solid #f1f1f1'
                      }}
                    >
                      <InlineStack align="space-between">
                        <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest"}</Text>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? '#43a047' : '#c1c4c8' }} />
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued" truncate>{item.messages[0]?.message || "Started a chat"}</Text>
                    </div>
                  );
                }}
              />
            </div>
          </Card>
        </Layout.Section>

        {/* Chat Main Window */}
        <Layout.Section>
          {activeSession ? (
            <Card padding="0">
              {/* Header with Color Picker */}
              <Box padding="400" background="bg-surface-secondary">
                <InlineStack align="space-between">
                  <InlineStack gap="200">
                    <div style={{ padding: '8px', background: 'white', borderRadius: '50%' }}><Icons.History /></div>
                    <div>
                      <Text variant="headingSm">{activeSession.email}</Text>
                      <Text variant="bodyXs" tone="subdued">Session: {activeSession.sessionId.slice(0,8)}</Text>
                    </div>
                  </InlineStack>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Text variant="bodyXs">Theme</Text>
                    <input 
                      type="color" 
                      value={themeColor} 
                      onChange={(e) => setThemeColor(e.target.value)}
                      style={{ border: 'none', width: '24px', height: '24px', cursor: 'pointer', background: 'transparent' }}
                    />
                  </div>
                </InlineStack>
              </Box>

              {/* Chat Content */}
              <div 
                ref={scrollRef}
                style={{ 
                  height: '450px', 
                  overflowY: 'auto', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  backgroundColor: '#f9fafb',
                  backgroundImage: 'radial-gradient(#e5e7eb 0.5px, transparent 0.5px)',
                  backgroundSize: '20px 20px'
                }}
              >
                {messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ 
                      background: msg.sender === 'admin' ? themeColor : 'white',
                      color: msg.sender === 'admin' ? 'white' : '#1f2937',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'admin' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      fontSize: '14px'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Replies & Input */}
              <Box padding="400">
                <Box paddingBlockEnd="300">
                  <InlineStack gap="200">
                    {['Hello! 👋', 'How can I help?', 'Technical Issue', 'All Set!'].map((temp) => (
                      <button 
                        key={temp}
                        onClick={() => handleReply(temp)}
                        style={{ padding: '4px 12px', borderRadius: '16px', border: '1px solid #dfe3e8', background: 'white', fontSize: '12px', cursor: 'pointer' }}
                      >
                        {temp}
                      </button>
                    ))}
                  </InlineStack>
                </Box>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <TextField 
                      value={reply} 
                      onChange={(v) => setReply(v)} 
                      placeholder="Type your message..."
                      autoComplete="off"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    />
                  </div>
                  <button 
                    onClick={() => handleReply()}
                    disabled={!reply.trim()}
                    style={{ 
                      background: themeColor, 
                      border: 'none', 
                      borderRadius: '8px', 
                      width: '45px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer',
                      opacity: !reply.trim() ? 0.5 : 1
                    }}
                  >
                    <Icons.Send color="white" />
                  </button>
                </div>
              </Box>
            </Card>
          ) : (
            <Box padding="2000" textAlign="center">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', opacity: 0.5 }}>
                 <div style={{ width: '80px', height: '80px', background: '#f4f6f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.History />
                 </div>
                 <Text variant="headingLg" tone="subdued">Select a customer to start chatting</Text>
              </div>
            </Box>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}