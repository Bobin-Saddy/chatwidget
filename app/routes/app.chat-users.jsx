import { useEffect, useState } from "react";
import { Page, Card, TextField, Button } from "@shopify/polaris";

export default function ChatUsers() {
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");

  // Load messages
  useEffect(() => {
    fetch("/api/chat/admin/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));
  }, []);

  // Send reply
  const sendMessage = async () => {
    if (!reply || !messages[0]) return;

    await fetch("/api/chat/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: messages[0].sessionId,
        message: reply,
      }),
    });

    setReply("");
  };

  return (
    <Page title="Chat Messages">
      <Card>
        {messages.map((m) => (
          <p key={m.id}>
            <b>{m.sender}:</b> {m.message}
          </p>
        ))}

        <TextField
          label="Reply"
          value={reply}
          onChange={setReply}
          autoComplete="off"
        />

        <Button primary onClick={sendMessage}>
          Send
        </Button>
      </Card>
    </Page>
  );
}
