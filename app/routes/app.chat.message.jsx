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

    // 1. Session ko confirm karein (Upsert)
    const chatSession = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {},
      create: {
        sessionId: sessionId,
        shop: shop || "unknown",
        email: email || "guest@example.com",
        firstName: "User"
      }
    });

    // 2. Message save karein (Sirf session relation use karein)
    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        session: {
          connect: { sessionId: chatSession.sessionId }
        }
        // chatSessionId yahan nahi likhna hai, Prisma 'connect' se khud handle karega
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Save Error:", error);
    return json({ error: "Database Validation Error", details: error.message }, { status: 500, headers: corsHeaders });
  }
};