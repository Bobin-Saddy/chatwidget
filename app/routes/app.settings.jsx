import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#8b5e3c",
    headerBgColor: "#1a1615",
    welcomeImg: "https://ui-avatars.com/api/?name=Support",
    headerTitle: "Customer Concierge",
    headerSubtitle: "Online now",
    welcomeText: "Welcome to our store!",
    welcomeSubtext: "How can we assist you today?",
    startConversationText: "Start a conversation",
    replyTimeText: "Typically replies in 5 minutes",
    heroBgColor: "#bdddfc", // New
    onboardingInputBg: "#f1f5f9" // New
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
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const isSaving = navigation.state === "submitting";

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    submit(formData, { method: "POST" });
  };

  return (
    <div style={{ backgroundColor: '#fcfaf8', minHeight: '100vh', padding: '40px 0', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '900' }}>Widget Customization</h1>
            <p style={{ color: '#78716c' }}>Tailor the chat experience for your customers</p>
          </div>
          <button onClick={handleSave} style={{ padding: '14px 28px', borderRadius: '12px', background: '#1a1615', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '40px' }}>
          
          {/* EDITOR FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* BRANDING CARD */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '20px', color: '#8b5e3c' }}>COLORS & BRANDING</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Primary Accent</label>
                  <input type="color" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Hero Background</label>
                  <input type="color" value={formState.heroBgColor} onChange={(e) => handleChange('heroBgColor', e.target.value)} style={{ width: '100%', height: '40px', border: 'none', borderRadius: '8px' }} />
                </div>
              </div>
            </div>

            {/* TEXT CONTENT CARD */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '20px', color: '#8b5e3c' }}>MESSAGING</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input placeholder="Header Title" value={formState.headerTitle} onChange={(e) => handleChange('headerTitle', e.target.value)} style={inputStyle} />
                <input placeholder="Header Subtitle (e.g. Online now)" value={formState.headerSubtitle} onChange={(e) => handleChange('headerSubtitle', e.target.value)} style={inputStyle} />
                <input placeholder="Reply Time Text" value={formState.replyTimeText} onChange={(e) => handleChange('replyTimeText', e.target.value)} style={inputStyle} />
                <input placeholder="Welcome Headline" value={formState.welcomeText} onChange={(e) => handleChange('welcomeText', e.target.value)} style={inputStyle} />
                <textarea placeholder="Welcome Subtext" value={formState.welcomeSubtext} onChange={(e) => handleChange('welcomeSubtext', e.target.value)} style={{ ...inputStyle, minHeight: '80px' }} />
              </div>
            </div>

          </div>

          {/* PREVIEW */}
          <div style={{ position: 'sticky', top: '20px' }}>
             <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: '800', color: '#a8a29e', marginBottom: '10px' }}>LIVE PREVIEW</p>
             <div style={{ width: '100%', height: '600px', background: '#fff', borderRadius: '30px', border: '8px solid #1a1615', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                {/* Header Preview */}
                <div style={{ background: formState.headerBgColor, padding: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <img src={formState.welcomeImg} style={{ width: '35px', height: '35px', borderRadius: '10px' }} />
                   <div>
                     <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{formState.headerTitle}</div>
                     <div style={{ fontSize: '10px', opacity: 0.8 }}>{formState.headerSubtitle}</div>
                   </div>
                </div>
                {/* Body Preview */}
                <div style={{ flex: 1, background: '#fdfaf5' }}>
                   <div style={{ background: formState.heroBgColor, padding: '30px 20px', borderRadius: '0 0 30px 30px' }}>
                      <h4 style={{ margin: 0, color: '#384959' }}>{formState.welcomeText}</h4>
                   </div>
                   <div style={{ margin: '20px', padding: '15px', background: '#fff', borderRadius: '15px', border: `2px solid ${formState.headerBgColor}`, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Send us a message</span>
                      <div style={{ background: formState.primaryColor, width: '20px', height: '20px', borderRadius: '50%' }}></div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', background: '#f8f7f6', border: '1px solid #eee', borderRadius: '10px', outline: 'none' };