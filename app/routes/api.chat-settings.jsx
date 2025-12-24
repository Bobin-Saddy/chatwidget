// This allows the frontend widget to get the latest colors/text
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  const settings = await db.chatSettings.findUnique({ where: { shop } });
  
  return json(settings, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
};