import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Layout, Card, ResourceList, Text, TextField, Button, Box } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { db } from "../db.server";

export const loader = async () => {
  const sessions = await db.chatSession.findMany({
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
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

  // Load messages for selected user
  const loadChat = async (id) => {
    const res = await fetch(`/app/chat/messages?sessionId=${id}`);
    const data = await res.json();
    setMessages(data);
    setActiveSession(id);
  };

  const handleReply = () => {
    if (!reply) return;
    fetcher.submit(
      { sessionId: activeSession, message: reply, sender: "admin" },
      { method: "post", action: "/app/chat/message" }
    );
    setReply("");
    // Optimistic UI update
    setMessages([...messages, { message: reply, sender: "admin", createdAt: new Date() }]);
  };

  return (
    <Page title="Customer Support Chat">
      <Layout>
        {/* Left Side: User List */}
        <Layout.Section variant="oneThird">
          <Card>
            <ResourceList
              resourceName={{ singular: 'customer', plural: 'customers' }}
              items={sessions}
              renderItem={(item) => (
                <ResourceList.Item id={item.sessionId} onClick={() => loadChat(item.sessionId)}>
                  <Text variant="bodyMd" fontWeight="bold">{item.email || "Guest User"}</Text>
                  <div style={{ fontSize: '12px', color: 'gray' }}>ID: {item.sessionId}</div>
                </ResourceList.Item>
              )}
            />
          </Card>
        </Layout.Section>

        {/* Right Side: Chat Box */}
        <Layout.Section>
          {activeSession ? (
            <Card>
              <Box padding="400">
                <div style={{ height: '400px', overflowY: 'scroll', marginBottom: '20px' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ 
                      textAlign: msg.sender === 'admin' ? 'right' : 'left',
                      margin: '10px 0' 
                    }}>
                      <span style={{ 
                        background: msg.sender === 'admin' ? '#008060' : '#f1f1f1',
                        color: msg.sender === 'admin' ? 'white' : 'black',
                        padding: '8px 12px',
                        borderRadius: '10px'
                      }}>
                        {msg.message}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <TextField value={reply} onChange={(v) => setReply(v)} autoComplete="off" placeholder="Type your reply..." />
                  </div>
                  <Button variant="primary" onClick={handleReply}>Send</Button>
                </div>
              </Box>
            </Card>
          ) : (
            <Card><Box padding="400"><Text>Select a customer to start chatting</Text></Box></Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}