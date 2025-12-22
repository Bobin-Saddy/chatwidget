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

    // Pehle check karein ki kya ye session exist karta hai?
    const session = await db.chatSession.findUnique({
      where: { sessionId: sessionId }
    });

    if (!session) {
      console.error("Session not found in DB for ID:", sessionId);
      return json({ error: "Session not found. Please register again." }, { status: 400, headers: corsHeaders });
    }

    const newMessage = await db.chatMessage.create({
      data: { 
        message: message,
        sender: "user",
        // Relation connect karne ka sahi tarika
        chatSession: {
          connect: { sessionId: sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Save Message Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};