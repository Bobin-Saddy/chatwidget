import { json } from "@remix-run/node";
import { db } from "../db.server";

// Common Header helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

export const loader = () => json({}, { headers: corsHeaders });

export const action = async ({ request }) => {
  // 1. Mandatory OPTIONS Handling
  if (request.method === "OPTIONS" || request.method === "options") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const body = await request.json();
    const { sessionId, message } = body;

    const newMessage = await db.chatMessage.create({
      data: { 
        chatSessionId: sessionId,
        sender: "user", 
        message: message 
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error:", error);
    return json({ error: "Server Error" }, { status: 500, headers: corsHeaders });
  }
};