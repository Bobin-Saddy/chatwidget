import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json" 
  };
  
  const url = new URL(request.url);
  // Get the sessionId from the URL
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return json({ error: "Missing sessionId" }, { status: 400, headers });
  }

  try {
    const messages = await db.chatMessage.findMany({
      where: { 
        // Changed from 'sessionId' to 'chatSessionId' based on your Prisma error
        chatSessionId: sessionId 
        // Removed 'shop' because it doesn't exist on the ChatMessage model
      },
      orderBy: { createdAt: "asc" },
    });

    return json(messages, { headers });
  } catch (error) {
    console.error("Prisma Error:", error);
    return json({ error: "Internal Server Error" }, { status: 500, headers });
  }
};