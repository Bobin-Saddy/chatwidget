import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sessionId, message, shop, email } = await request.json();

    // Safety check: Agar session missing hai toh auto-create karein
    // Isse P2025 error kabhi nahi aayegi
    const session = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {}, // Agar mil jaye toh kuch mat karo
      create: {
        sessionId: sessionId,
        shop: shop || "unknown",
        email: email || "guest@example.com",
        firstName: "Guest"
      }
    });

    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        session: {
          connect: { sessionId: session.sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Critical Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};