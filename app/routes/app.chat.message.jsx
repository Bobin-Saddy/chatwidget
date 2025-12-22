import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = () => json({}, { headers: corsHeaders });

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { sessionId, message, shop, email } = body;

    // 1. Ensure Session exists (Upsert logic)
    // Yeh step zaroori hai agar DB reset ho gaya ho
    const chatSession = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {},
      create: {
        sessionId: sessionId,
        shop: shop || "unknown.myshopify.com",
        email: email || "guest@example.com",
        firstName: "Customer"
      }
    });

    // 2. Create Message
    const newMessage = await db.chatMessage.create({
      data: {
        message: message,
        sender: "user",
        // Ham explicitly ID provide kar rahe hain jo schema expect kar raha hai
        chatSessionId: chatSession.sessionId 
      }
    });

    return json({ success: true, data: newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Database Save Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};