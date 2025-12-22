// app.chat.message.jsx
import { json } from "@remix-run/node";
import { db } from "../db.server";

const headers = { 
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const action = async ({ request }) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return json({ error: "Data missing" }, { status: 400, headers });
    }

    // First: Check if session actually exists to avoid Foreign Key error
    const sessionExists = await db.chatSession.findUnique({
      where: { sessionId: sessionId }
    });

    if (!sessionExists) {
      return json({ error: "Session not found. Please register again." }, { status: 404, headers });
    }

    // Second: Create message
    const newMessage = await db.chatMessage.create({
      data: { 
        chatSession: {
          connect: { sessionId: sessionId } // Use relation connection
        },
        sender: "user", 
        message: message 
      },
    });

    return json({ success: true, newMessage }, { headers });
  } catch (error) {
    console.error("Critical Save Error:", error);
    return json({ error: "Database error", details: error.message }, { status: 500, headers });
  }
};