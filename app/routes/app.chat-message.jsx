import { json } from "@remix-run/node";
import { db } from "../db.server";

export const action = async ({ request }) => {
  const { shop, sessionId, message } = await request.json();

  await db.chatMessage.create({
    data: {
      shop,
      sessionId,
      sender: "user",
      message,
    },
  });

  return json({ success: true });
};
