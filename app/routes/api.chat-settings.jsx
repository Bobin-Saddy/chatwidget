import { json } from "@remix-run/node";
import { prisma as db } from "../db.server";

/**
 * GET Request: /api/chat-settings?shop=your-store.myshopify.com
 * This endpoint is public so the storefront widget can access it.
 */
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  try {
    // Database se settings fetch karein
    const settings = await db.chatSettings.findUnique({
      where: { shop: shop },
    });

    // Agar settings nahi milti (new store), toh default values bhej dein
    const defaultSettings = {
      primaryColor: "#6366f1",
      headerBgColor: "#384959",
      welcomeImg: "https://ui-avatars.com/api/?name=Support&background=fff",
      headerTitle: "Live Support",
      headerSubtitle: "Online now",
      welcomeText: "Hi there 👋",
      welcomeSubtext: "We are here to help you! Ask us anything or browse our services.",
      startConversationText: "Start a conversation",
    };

    const responseData = settings || defaultSettings;

    // CORS headers add karna zaroori hai taaki Shopify storefront se request block na ho
    return json(responseData, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300", // 5 minutes cache for performance
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return json({ error: "Internal Server Error" }, { status: 500 });
  }
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export const action = async ({ request }) => {
  return json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};