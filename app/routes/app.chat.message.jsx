import { json } from "@remix-run/node";
import { db } from "../db.server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = () => json({}, { headers: corsHeaders });

export const action = async ({ request }) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await request.json();
    const { sessionId, message, sender, shop, email } = body;

    // STEP 1: Pehle Session ko create ya update karein (Upsert)
    // Isse P2025 error kabhi nahi aayegi kyunki session hamesha exist karega
    const chatSession = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: {}, // Agar mil jaye toh kuch mat badlo
      create: {
        sessionId: sessionId,
        shop: shop || "myshopify.com",
        email: email || "customer@email.com",
        firstName: "Customer"
      }
    });

    // STEP 2: Ab Message save karein
    const newMessage = await db.chatMessage.create({
      data: {
        message: message,
        sender: sender || "user",
        // Direct session ke unique sessionId se connect karein
        session: {
          connect: { sessionId: chatSession.sessionId }
        }
      },
    });

    return json({ success: true, newMessage }, { headers: corsHeaders });
  } catch (error) {
    console.error("Reply Error:", error);
    return json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
};