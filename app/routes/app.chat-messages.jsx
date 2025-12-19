import { json } from "@remix-run/node";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const sessionId = url.searchParams.get("sessionId");

  const messages = await db.chatMessage.findMany({
    where: { shop, sessionId },
    orderBy: { createdAt: "asc" },
  });

  return json(messages);
};
