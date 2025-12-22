import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = () => json({}, { headers: { "Access-Control-Allow-Origin": "*" } });

export const action = async ({ request }) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    const { shop, fname, email, sessionId } = await request.json();
    
    // Updated to match your model name: ChatSession
    const session = await db.chatSession.upsert({
      where: { sessionId: sessionId },
      update: { email, firstName: fname },
      create: { 
        shop, 
        firstName: fname, 
        email, 
        sessionId 
      },
    });
    
    return json({ success: true, session }, { headers });
  } catch (e) { 
    console.error("Register Error:", e);
    return json({ error: e.message }, { status: 500, headers }); 
  }
};