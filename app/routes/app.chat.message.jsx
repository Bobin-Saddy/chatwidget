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
      return json({ error: "Missing data" }, { status: 400, headers: corsHeaders });
    }

    // Prisma creation according to your schema
    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        // RELATION NAME: Aapke schema mein 'session' likha hai
        session: {
          connect: { sessionId: sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Final Prisma Error:", error);
    return json({ error: "Database error", details: error.message }, { status: 500, headers: corsHeaders });
  }
};