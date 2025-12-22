import { json } from "@remix-run/node";
import { db } from "../db.server";

// Common CORS Headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

// 1. Mandatory Loader (OPTIONS request isi ke through handle hoti hai)
export const loader = () => {
  return json({}, { headers: corsHeaders });
};

// 2. Action for POST request
export const action = async ({ request }) => {
  // Handle OPTIONS preflight explicitly in action if needed
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { sessionId, message, shop, email } = await request.json();

    if (!sessionId || !message) {
      return json({ error: "Missing data" }, { status: 400, headers: corsHeaders });
    }

    // Upsert session to prevent P2025 errors
    const session = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {},
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
    console.error("Backend Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};