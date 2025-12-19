import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = () => {
  return json({ message: "Method not allowed" }, { status: 405 });
};

export const action = async ({ request }) => {
  // Handle Preflight OPTIONS request (CORS)
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { shop, fname, lname, email, sessionId } = await request.json();

    // Upsert user in your database
    const user = await db.chatUser.upsert({
      where: { email: email },
      update: { 
        sessionId: sessionId,
        lastActive: new Date() 
      },
      create: {
        shop: shop,
        firstName: fname,
        lastName: lname,
        email: email,
        sessionId: sessionId,
      },
    });

    return json({ success: true, user }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return json({ error: "Internal Server Error" }, { 
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  }
};