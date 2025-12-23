import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "react-router";
import { 
  Page, Layout, Card, ResourceList, Text, TextField, Button, Box, 
  Badge, Divider, InlineStack, Bleed, Icon, Tooltip, Select 
} from "@shopify/polaris";
import { 
  SendIcon, SearchIcon, personIcon, QuickRepliesIcon, 
  PaintBrushIcon, ClockIcon 
} from "@shopify/polaris-icons";
import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../db.server";

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { 
      messages: { orderBy: { createdAt: "desc" }, take: 1 } 
    },
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
  const [accentColor, setAccentColor] = useState("#005bd3"); // Default Shopify Blue
  
  const fetcher = useFetcher();
  const scrollRef = useRef(null);

  // Filter sessions based on search
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/app/chat/messages?sessionId=${activeSession}`);
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

  const handleReply = (customMsg) => {
    const msgToSend = typeof customMsg === 'string' ? customMsg : reply;
    if (!msgToSend.trim()) return;

    const data = { sessionId: activeSession.sessionId, message: msgToSend, sender: "admin" };
    fetcher.submit(JSON.stringify(data), { 
      method: "post", 
      action: "/app/chat/message", 
      encType: "application/json" 
    });

    setMessages((prev) => [...prev, { ...data, createdAt: new Date().toISOString() }]);
    setReply("");
  };

  return (
    <Page 
      title="Support Inbox" 
      subtitle="Manage customer conversations in real-time"
      compactTitle
      primaryAction={
        <Select
          label="Theme Color"
          labelHidden
          options={[
            {label: 'Shopify Blue', value: '#005bd3'},
            {label: 'Emerald Green', value: '#008060'},
            {label: 'Deep Purple', value: '#5c6ac4'},
            {label: 'Midnight', value: '#202123'},
          ]}
          onChange={(v) => setAccentColor(v)}
          value={accentColor}
        />
      }
    >
      <Layout>
        {/* Sidebar: Chat List */}
        <Layout.Section variant="oneThird">
          <Card padding="0">
            <Box padding="300">
              <TextField
                prefix={<Icon source={SearchIcon} />}
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(v) => setSearchTerm(v)}
                autoComplete="off"
              />
            </Box>
            <Divider />
            <div style={{ height: '600px', overflowY: 'auto' }}>
              <ResourceList
                resourceName={{ singular: 'chat', plural: 'chats' }}
                items={filteredSessions}
                renderItem={(item) => {
                  const lastMsg = item.messages[0]?.message || "No messages yet";
                  const isActive = activeSession?.sessionId === item.sessionId;
                  return (
                    <ResourceList.Item 
                      id={item.sessionId} 
                      onClick={() => loadChat(item)}
                      verticalAlignment="center"
                    >
                      <Box padding="200">
                        <InlineStack align="space-between">
                          <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest User"}</Text>
                          <Badge tone={isActive ? "success" : "attention"} size="small">
                            {isActive ? "Live" : "Pending"}
                          </Badge>
                        </InlineStack>
                        <Box paddingBlockStart="100">
                          <Text variant="bodySm" tone="subdued" truncate>{lastMsg}</Text>
                        </Box>
                      </Box>
                    </ResourceList.Item>
                  );
                }}
              />
            </div>
          </Card>
        </Layout.Section>

        {/* Main Chat Area */}
        <Layout.Section>
          {activeSession ? (
            <Card padding="0">
              {/* Header */}
              <Box padding="400" background="bg-surface-secondary-active">
                <InlineStack align="space-between" verticalAlign="center">
                  <InlineStack gap="300">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#43a047', marginTop: 6 }} />
                    <Text variant="headingMd">{activeSession.email || "Guest"}</Text>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued">ID: {activeSession.sessionId.slice(0,8)}</Text>
                </InlineStack>
              </Box>
              <Divider />
              
              {/* Messages Display */}
              <div 
                ref={scrollRef}
                style={{ 
                  height: '450px', 
                  overflowY: 'auto', 
                  padding: '24px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  backgroundColor: '#f1f2f4'
                }}
              >
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      alignSelf: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: msg.sender === 'admin' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{ 
                      background: msg.sender === 'admin' ? accentColor : 'white',
                      color: msg.sender === 'admin' ? 'white' : '#1a1a1a',
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'admin' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {msg.message}
                    </div>
                    <Text variant="bodyXs" tone="subdued">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </div>
                ))}
              </div>

              <Divider />
              
              {/* Footer / Input */}
              <Box padding="400">
                <InlineStack gap="200" blockAlign="center">
                  <Tooltip content="Quick Replies">
                    <Button 
                      icon={QuickRepliesIcon} 
                      onClick={() => setReply("Hi! How can I help you today?")} 
                    />
                  </Tooltip>
                  <div style={{ flex: 1 }}>
                    <TextField 
                      value={reply} 
                      onChange={(v) => setReply(v)} 
                      placeholder="Type your message..."
                      autoComplete="off"
                      onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                      multiline={1}
                    />
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={handleReply} 
                    disabled={!reply.trim()}
                    icon={SendIcon}
                    style={{ backgroundColor: accentColor }}
                  >
                    Send
                  </Button>
                </InlineStack>
              </Box>
            </Card>
          ) : (
            <Card>
              <Box padding="2000" textAlign="center">
                <div style={{ opacity: 0.5 }}>
                  <Icon source={personIcon} tone="subdued" />
                  <Box paddingBlockStart="400">
                    <Text variant="headingLg" tone="subdued">Select a conversation</Text>
                    <Text variant="bodyMd" tone="subdued">Pick a customer from the left to start helping.</Text>
                  </Box>
                </div>
              </Box>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}