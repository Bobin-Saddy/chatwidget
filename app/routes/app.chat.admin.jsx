import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { Page, Layout, Card, ResourceList, Text, TextField, Button, Box, Badge, Divider } from "@shopify/polaris";
import { useState, useEffect, useRef } from "react";
import { db } from "../db.server";

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { 
      messages: { orderBy: { createdAt: "desc" }, take: 1 } 
    },
    orderBy: { createdAt: "desc" }
  });
  return json({ sessions });
};

export default function ChatAdmin() {
  const { sessions } = useLoaderData();
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // POLLING LOGIC: Har 3 second mein naye messages check karega
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/app/chat/messages?sessionId=${activeSession}`);
        const data = await res.json();
        // Sirf tab update karein jab naya message ho
        if (data.length !== messages.length) {
          setMessages(data);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 3000); 

    return () => clearInterval(interval);
  }, [activeSession, messages.length]);

  const loadChat = async (id) => {
    const res = await fetch(`/app/chat/messages?sessionId=${id}`);
    const data = await res.json();
    setMessages(data);
    setActiveSession(id);
  };

  const handleReply = () => {
    if (!reply.trim()) return;

    const data = { 
      sessionId: activeSession, 
      message: reply, 
      sender: "admin" 
    };

    fetcher.submit(
      JSON.stringify(data),
      { 
        method: "post", 
        action: "/app/chat/message",
        encType: "application/json" 
      }
    );

    // Optimistic Update: Admin ko turant apna message dikhe
    const newMsg = { message: reply, sender: "admin", createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, newMsg]);
    setReply("");
  };

  return (
    <Page title="Support Inbox" subtitle="Manage customer conversations in real-time">
      <Layout>
        {/* Sidebar: Active Chats */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="400"><Text variant="headingMd">Conversations</Text></Box>
            <Divider />
            <ResourceList
              resourceName={{ singular: 'customer', plural: 'customers' }}
              items={sessions}
              renderItem={(item) => {
                const lastMsg = item.messages[0]?.message || "No messages yet";
                return (
                  <ResourceList.Item 
                    id={item.sessionId} 
                    onClick={() => loadChat(item.sessionId)}
                    verticalAlignment="center"
                  >
                    <Box padding="100">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest User"}</Text>
                        <Badge status={activeSession === item.sessionId ? "success" : ""}>
                          {activeSession === item.sessionId ? "Live" : "Idle"}
                        </Badge>
                      </div>
                      <Text variant="bodySm" color="subdued" truncate>{lastMsg}</Text>
                    </Box>
                  </ResourceList.Item>
                );
              }}
            />
          </Card>
        </Layout.Section>

        {/* Chat Window */}
        <Layout.Section>
          {activeSession ? (
            <Card padding="0">
              <Box padding="400" background="bg-surface-secondary">
                <Text variant="headingSm">Chatting with {activeSession}</Text>
              </Box>
              <Divider />
              
              {/* Message Area */}
              <div 
                ref={scrollRef}
                style={{ 
                  height: '450px', 
                  overflowY: 'auto', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  backgroundColor: '#f6f6f7'
                }}
              >
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                      maxWidth: '70%'
                    }}
                  >
                    <div style={{ 
                      background: msg.sender === 'admin' ? '#005bd3' : 'white',
                      color: msg.sender === 'admin' ? 'white' : '#303030',
                      padding: '10px 16px',
                      borderRadius: msg.sender === 'admin' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      fontSize: '14px'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '4px', textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>

              <Divider />
              
              {/* Input Area */}
              <Box padding="400">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <TextField 
                      value={reply} 
                      onChange={(v) => setReply(v)} 
                      placeholder="Write a reply..."
                      autoComplete="off"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                    />
                  </div>
                  <Button variant="primary" onClick={handleReply} disabled={!reply.trim()}>
                    Send Reply
                  </Button>
                </div>
              </Box>
            </Card>
          ) : (
            <Card>
              <Box padding="1000" textAlign="center">
                <div style={{ color: '#8c8c8c' }}>
                  <Text variant="headingLg">📩</Text>
                  <Text variant="bodyLg">Select a conversation to start messaging</Text>
                </div>
              </Box>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}