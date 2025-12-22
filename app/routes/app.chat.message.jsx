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
    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return json({ error: "Missing sessionId or message" }, { status: 400, headers: corsHeaders });
    }

    // Message create karein
    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        // Aapke schema mein relation name 'session' hai
        session: {
          connect: { sessionId: sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Prisma Save Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};