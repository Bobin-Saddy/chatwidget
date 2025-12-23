import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { Page, Layout, Card, ResourceList, Text, TextField, Button, Box, Badge, Divider, InlineStack } from "@shopify/polaris";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

// --- CUSTOM SVG ICONS (No library needed) ---
const Icons = {
  Send: () => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor"><path d="M17.707 9.293l-15-7a1 1 0 00-1.314 1.314l3 6a1 1 0 010 .786l-3 6a1 1 0 001.314 1.314l15-7a1 1 0 000-1.414z" /></svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" /></svg>
  ),
  User: () => (
    <svg viewBox="0 0 20 20" width="40" height="40" fill="#babfc3"><path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM3 15a7 7 0 0114 0H3z" /></svg>
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
  const [themeColor, setThemeColor] = useState("#005bd3");

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

  const handleReply = () => {
    if (!reply.trim()) return;
    const data = { sessionId: activeSession.sessionId, message: reply, sender: "admin" };
    fetcher.submit(JSON.stringify(data), { method: "post", action: "/app/chat/message", encType: "application/json" });
    setMessages(prev => [...prev, { ...data, createdAt: new Date().toISOString() }]);
    setReply("");
  };

  return (
    <Page title="Live Support" subtitle="Real-time customer interaction">
      <Layout>
        {/* Sidebar */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="300">
              <div style={{ display: 'flex', alignItems: 'center', background: '#f1f1f1', borderRadius: '8px', padding: '4px 12px' }}>
                <Icons.Search />
                <input 
                  type="text" 
                  placeholder="Filter chats..." 
                  style={{ border: 'none', background: 'transparent', padding: '8px', width: '100%', outline: 'none' }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </Box>
            <Divider />
            <div style={{ height: '550px', overflowY: 'auto' }}>
              {filteredSessions.map((item) => (
                <div 
                  key={item.sessionId}
                  onClick={() => loadChat(item)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: '0.2s',
                    backgroundColor: activeSession?.sessionId === item.sessionId ? '#f0f7ff' : 'transparent',
                    borderLeft: activeSession?.sessionId === item.sessionId ? `4px solid ${themeColor}` : '4px solid transparent',
                    borderBottom: '1px solid #f1f1f1'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest User"}</Text>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#43a047' }} />
                  </div>
                  <Text variant="bodySm" tone="subdued" truncate>{item.messages[0]?.message || "No messages..."}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Layout.Section>

        {/* Chat Window */}
        <Layout.Section>
          {activeSession ? (
            <Card padding="0">
              <Box padding="400" background="bg-surface-secondary">
                <InlineStack align="space-between">
                  <Text variant="headingMd">Chat with {activeSession.email}</Text>
                  <input 
                    type="color" 
                    value={themeColor} 
                    onChange={(e) => setThemeColor(e.target.value)}
                    style={{ border: 'none', width: '30px', height: '30px', cursor: 'pointer', borderRadius: '4px' }}
                  />
                </InlineStack>
              </Box>
              
              <div ref={scrollRef} style={{ height: '450px', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fdfdfd' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{ 
                      background: msg.sender === 'admin' ? themeColor : '#f1f1f1',
                      color: msg.sender === 'admin' ? 'white' : '#333',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'admin' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              <Box padding="400">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <TextField 
                      value={reply} 
                      onChange={(v) => setReply(v)} 
                      placeholder="Type a message..."
                      autoComplete="off"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    />
                  </div>
                  <button 
                    onClick={handleReply}
                    disabled={!reply.trim()}
                    style={{ 
                      background: themeColor, 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0 16px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Icons.Send />
                  </button>
                </div>
              </Box>
            </Card>
          ) : (
            <div style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <Icons.User />
              <Text variant="headingLg">Select a conversation to begin</Text>
            </div>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}