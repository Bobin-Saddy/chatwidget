import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = () => json({}, { 
  headers: { "Access-Control-Allow-Origin": "*" } 
});

export const action = async ({ request }) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  const { sessionId, message } = await request.json();

  try {
    const newMessage = await db.chatMessage.create({
      data: { 
        chatSessionId: sessionId, // Corrected field name
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