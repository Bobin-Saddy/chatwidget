import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// --- SVG ICON LIBRARY ---
const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#6366f1",
    headerBgColor: "#384959",
    heroBgColor: "#bdddfc",
    launcherIcon: "bubble",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=fff",
    headerTitle: "Live Support",
    headerSubtitle: "Online now",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "We are here to help you! Ask us anything.",
    replyTimeText: "Typically replies in 5 minutes",
    startConversationText: "Start a conversation"
  });
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

export default function SettingsPage() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [formState, setFormState] = useState(settings);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }
  }, [actionData]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    submit(formData, { method: "POST" });
  };

  return (
    <div style={{ backgroundColor: '#fcfaf8', minHeight: '100vh', padding: '40px 0', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Widget Customization</h1>
            <p style={{ color: '#78716c' }}>Brand your chat experience</p>
          </div>
          <button onClick={handleSave} style={{ padding: '14px 28px', borderRadius: '12px', background: '#1a1615', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '40px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            {/* ICON SELECTION */}
            <Section title="Launcher Icon">
              <div style={{ display: 'flex', gap: '15px' }}>
                {Object.keys(ICON_MAP).map((key) => (
                  <div 
                    key={key}
                    onClick={() => handleChange('launcherIcon', key)}
                    style={{
                      padding: '15px', borderRadius: '12px', cursor: 'pointer',
                      border: `3px solid ${formState.launcherIcon === key ? formState.primaryColor : '#eee'}`,
                      color: formState.launcherIcon === key ? formState.primaryColor : '#aaa',
                      transition: '0.2s'
                    }}
                  >
                    {ICON_MAP[key]}
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Visual Branding">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <ColorInput label="Launcher & Buttons" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <ColorInput label="Header Bg" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                <ColorInput label="Hero Banner" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
              </div>
            </Section>

            <Section title="Content Settings">
              <div style={{ display: 'grid', gap: '15px' }}>
                <TextInput label="Header Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                <TextInput label="Reply Time" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
                <TextArea label="Welcome Text" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
              </div>
            </Section>
          </div>

          {/* PREVIEW */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div style={{ 
              width: '100%', height: '600px', background: '#fff', borderRadius: '40px', 
              border: '8px solid #1a1615', overflow: 'hidden', position: 'relative' 
            }}>
                <div style={{ background: formState.headerBgColor, padding: '20px', color: '#fff', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '35px', height: '35px', background: '#fff', borderRadius: '8px' }}></div>
                    <span style={{ fontWeight: 'bold' }}>{formState.headerTitle}</span>
                </div>
                <div style={{ flex: 1, background: '#f9f9f9', height: '100%' }}>
                    <div style={{ background: formState.heroBgColor, height: '150px', padding: '20px' }}>
                        <h3 style={{ margin: 0 }}>{formState.welcomeText}</h3>
                    </div>
                </div>
                
                {/* Floating Launcher Preview */}
                <div style={{ 
                  position: 'absolute', bottom: '20px', right: '20px', 
                  width: '55px', height: '55px', borderRadius: '50%', 
                  background: formState.primaryColor, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                }}>
                  {ICON_MAP[formState.launcherIcon]}
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {showSavedToast && <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', padding: '12px 25px', borderRadius: '30px' }}>Settings Saved!</div>}
    </div>
  );
}

// Helper Components
function Section({ title, children }) {
  return (
    <div style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #eee' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', color: '#8b5e3c' }}>{title}</h3>
      {children}
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{label}</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', height: '35px', border: 'none', borderRadius: '5px' }} />
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #eee', minHeight: '60px' }} />
    </div>
  );
}