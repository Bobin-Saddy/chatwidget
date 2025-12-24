import { json, authenticate } from "../shopify.server";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, TextField, Button, FormLayout, ColorPicker, hsbToHex, hexToHsb } from "@shopify/polaris";
import { useState } from "react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  return json(settings || {});
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  await db.chatSettings.upsert({
    where: { shop: session.shop },
    update: { ...data, shop: session.shop },
    create: { ...data, shop: session.shop },
  });

  return json({ success: true });
};

export default function Settings() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const [formState, setFormState] = useState(settings);

  const handleSave = () => {
    submit(formState, { method: "POST" });
  };

  return (
    <Page title="Chat Widget Settings">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <FormLayout>
              <TextField 
                label="Header Title" 
                value={formState.headerTitle} 
                onChange={(val) => setFormState({...formState, headerTitle: val})} 
              />
              <TextField 
                label="Primary Brand Color (Hex)" 
                value={formState.primaryColor} 
                onChange={(val) => setFormState({...formState, primaryColor: val})} 
              />
              <TextField 
                label="Welcome Text" 
                value={formState.welcomeText} 
                onChange={(val) => setFormState({...formState, welcomeText: val})} 
              />
              <TextField 
                label="Welcome Subtext" 
                value={formState.welcomeSubtext} 
                onChange={(val) => setFormState({...formState, welcomeSubtext: val})} 
              />
              <TextField 
                label="Welcome Image URL" 
                value={formState.welcomeImg} 
                onChange={(val) => setFormState({...formState, welcomeImg: val})} 
              />
              <Button primary onClick={handleSave}>Save Settings</Button>
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}