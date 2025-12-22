import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = () => json({}, { headers: corsHeaders });

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { sessionId, message, shop, email } = await request.json();

    // 1. Session create ya update karein
    const session = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {}, 
      create: {
        sessionId: sessionId,
        shop: shop || "unknown",
        email: email || "guest@example.com",
        firstName: "User"
      }
    });

    // 2. Message ko create karein aur SESSION ID ko link karein
    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        chatSessionId: session.sessionId, // Direct ID assignment
        session: {
          connect: { sessionId: session.sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Save Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};