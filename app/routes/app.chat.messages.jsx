import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return json({ error: "Missing sessionId" }, { status: 400, headers });
  }

  try {
    const messages = await db.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: "asc" },
    });

    return json(messages, { headers });
  } catch (error) {
    return json({ error: "Internal Server Error" }, { status: 500, headers });
  }
};