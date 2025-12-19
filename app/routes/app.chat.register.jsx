import { json } from "@remix-run/node";
import { db } from "../db.server";

export const action = async ({ request }) => {
  const headers = { "Access-Control-Allow-Origin": "*" };
  if (request.method === "OPTIONS") return new Response(null, { headers });

  try {
    const { shop, fname, email, sessionId } = await request.json();
    const user = await db.chatUser.upsert({
      where: { email },
      update: { sessionId },
      create: { shop, firstName: fname, email, sessionId },
    });
    return json({ success: true, user }, { headers });
  } catch (e) { return json({ error: e.message }, { status: 500, headers }); }
};