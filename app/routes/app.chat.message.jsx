import { json } from "@remix-run/node";
import { db } from "../db.server";

const headers = { 
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export const loader = () => json({}, { headers });

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return json({ error: "Missing data" }, { status: 400, headers });
    }

    const newMessage = await db.chatMessage.create({
      data: { 
        chatSessionId: sessionId, 
        sender: "user", 
        message 
      },
    });

    return json({ success: true, newMessage }, { headers });
  } catch (error) {
    console.error("Save Message Error:", error);
    return json({ error: error.message }, { status: 500, headers });
  }
};