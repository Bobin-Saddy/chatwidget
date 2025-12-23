import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { Page, Layout, Card, ResourceList, Text, TextField, Button, Box, Badge, Divider, InlineStack } from "@shopify/polaris";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CUSTOM SVG ICONS (Native SVG - No library needed) ---
const Icons = {
  Send: ({ color = "currentColor" }) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill={color}><path d="M17.707 9.293l-15-7a1 1 0 00-1.314 1.314l3 6a1 1 0 010 .786l-3 6a1 1 0 001.314 1.314l15-7a1 1 0 000-1.414z" /></svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="#637381"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" /></svg>
  ),
  User: () => (
    <svg viewBox="0 0 20 20" width="32" height="32" fill="#babfc3"><path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM3 15a7 7 0 0114 0H3z" /></svg>
  )
};

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { 
      messages: { orderBy: { createdAt: "desc" }, take: 1 } 
    },
    // CHANGED: Fixed the Prisma error by using createdAt instead of updatedAt
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
  const [accentColor, setAccentColor] = useState("#005bd3"); // Theme Color State

  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // Search filter for sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

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

  const handleReply = (customMsg = null) => {
    const text = customMsg || reply;
    if (!text.trim()) return;

    const data = { sessionId: activeSession.sessionId, message: text, sender: "admin" };
    fetcher.submit(JSON.stringify(data), { method: "post", action: "/app/chat/message", encType: "application/json" });

    setMessages((prev) => [...prev, { ...data, createdAt: new Date().toISOString() }]);
    if (!customMsg) setReply("");
  };

  return (
    <Page 
      title="Support Inbox" 
      subtitle="Manage customer conversations"
      primaryAction={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text variant="bodySm">UI Theme:</Text>
          <input 
            type="color" 
            value={accentColor} 
            onChange={(e) => setAccentColor(e.target.value)}
            style={{ border: 'none', width: '30px', height: '30px', cursor: 'pointer', borderRadius: '4px' }}
          />
        </div>
      }
    >
      <Layout>
        {/* Sidebar */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="300">
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f2f4', padding: '6px 12px', borderRadius: '8px' }}>
                <Icons.Search />
                <input 
                  placeholder="Filter by email..." 
                  style={{ border: 'none', background: 'transparent', outline: 'none', padding: '8px', width: '100%' }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Box>
            <Divider />
            <div style={{ height: '550px', overflowY: 'auto' }}>
              {filteredSessions.map((item) => {
                const isActive = activeSession?.sessionId === item.sessionId;
                return (
                  <div 
                    key={item.sessionId}
                    onClick={() => loadChat(item)}
                    style={{
                      padding: '16px',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${isActive ? accentColor : 'transparent'}`,
                      backgroundColor: isActive ? '#f0f7ff' : 'transparent',
                      borderBottom: '1px solid #f1f1f1'
                    }}
                  >
                    <InlineStack align="space-between">
                      <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest"}</Text>
                      <Badge tone={isActive ? "success" : ""}>{isActive ? "Live" : "Idle"}</Badge>
                    </InlineStack>
                    <Text variant="bodySm" tone="subdued" truncate>{item.messages[0]?.message || "No messages"}</Text>
                  </div>
                );
              })}
            </div>
          </Card>
        </Layout.Section>

        {/* Chat Window */}
        <Layout.Section>
          {activeSession ? (
            <Card padding="0">
              <Box padding="400" background="bg-surface-secondary">
                <InlineStack gap="300" blockAlign="center">
                  <div style={{ background: 'white', borderRadius: '50%', padding: '4px' }}><Icons.User /></div>
                  <Text variant="headingSm">{activeSession.email}</Text>
                </InlineStack>
              </Box>
              <Divider />
              
              <div ref={scrollRef} style={{ height: '400px', overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f4f6f8' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ 
                      background: msg.sender === 'admin' ? accentColor : 'white',
                      color: msg.sender === 'admin' ? 'white' : '#303030',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'admin' ? '14px 14px 0 14px' : '14px 14px 14px 0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              <Box padding="400">
                <Box paddingBlockEnd="300">
                   <InlineStack gap="200">
                     {['Hello!', 'Checking this...', 'Resolved!'].map(q => (
                       <button key={q} onClick={() => handleReply(q)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '12px', border: '1px solid #ccc', background: 'white', fontSize: '12px' }}>{q}</button>
                     ))}
                   </InlineStack>
                </Box>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <TextField value={reply} onChange={(v) => setReply(v)} placeholder="Type a message..." autoComplete="off" onKeyPress={(e) => e.key === 'Enter' && handleReply()} />
                  </div>
                  <button 
                    onClick={() => handleReply()} 
                    style={{ background: accentColor, color: 'white', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    <Icons.Send color="white" />
                  </button>
                </div>
              </Box>
            </Card>
          ) : (
            <Box padding="2000" textAlign="center">
              <div style={{ opacity: 0.3 }}><Icons.User /></div>
              <Text variant="headingLg" tone="subdued">Select a conversation to start</Text>
            </Box>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}