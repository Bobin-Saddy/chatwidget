import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const headers = { 
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json" 
  };
  
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return json([], { headers }); // Return empty array instead of error
  }

  try {
    const messages = await db.chatMessage.findMany({
      where: { 
        // Ensure this matches the sessionId sent in POST
        session: {
          sessionId: sessionId
        }
      },
      orderBy: { createdAt: "asc" },
    });

    return json(messages, { headers });
  } catch (error) {
    console.error("Fetch Messages Error:", error);
    return json([], { status: 500, headers });
  }
};