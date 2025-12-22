import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = () => json({}, { headers: corsHeaders });

export const action = async ({ request }) => {
  // CORS Headers for safety
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Check if the request is actually JSON
    const body = await request.json();
    const { sessionId, message, sender, shop } = body;

    if (!sessionId || !message) {
      return json({ error: "Missing data" }, { status: 400, headers: corsHeaders });
    }

    const newMessage = await db.chatMessage.create({
      data: {
        message: message,
        sender: sender || "user",
        session: {
          connect: { sessionId: sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Reply Error:", error);
    return json({ error: "Invalid JSON format" }, { status: 500, headers: corsHeaders });
  }
};