import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = () => json({}, { headers: corsHeaders });

// app.chat.message.jsx
export const action = async ({ request }) => {
  const { sessionId, message, sender, shop, email } = await request.json();

  try {
    // 1. Confirm session
    const session = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {},
      create: { 
        sessionId, 
        shop: shop || "myshopify.com", 
        email: email || "customer@email.com" 
      }
    });

    // 2. Save message (User or Admin)
    const newMessage = await db.chatMessage.create({
      data: {
        message: message,
        sender: sender || "user", // "admin" pass hoga dashboard se
        chatSessionId: session.sessionId
      }
    });

    return json({ success: true, newMessage });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
};