import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// --- REFINED ICON SET ---
const Icons = {
  Sparkles: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#8b5e3c",
    headerBgColor: "#1a1615",
    welcomeImg: "https://cdn.shopify.com/s/files/1/0070/7032/files/trending-products_91636224-b52e-461b-9372-96538c3e86c1.png?v=1678453488",
    headerTitle: "Customer Concierge",
    welcomeText: "Welcome to our store!",
    welcomeSubtext: "How can we assist your shopping experience today?",
    startConversationText: "Start Chatting"
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
    <div style={{ backgroundColor: '#fcfaf8', minHeight: '100vh', padding: '40px 0', color: '#1a1615', fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* --- NAVBAR --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5e3c', marginBottom: '8px' }}>
               <Icons.Sparkles />
               <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Design System</span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Widget Customization</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '16px 36px', borderRadius: '18px', fontWeight: '800', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer',
              backgroundColor: isSaving ? '#e5e7eb' : '#1a1615', color: 'white', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 20px 40px -12px rgba(0,0,0,0.2)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {isSaving ? "Publishing Changes..." : <><Icons.Check /> Publish to Store</>}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px', alignItems: 'start' }}>
          
          {/* --- LEFT COLUMN: EDITOR --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Visuals Section */}
            <div style={{ background: '#fff', padding: '32px', borderRadius: '28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5e3c' }}></span>
                Visual Branding
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: '#78716c' }}>Accent Branding</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8f7f6', padding: '8px', borderRadius: '14px', border: '1px solid #eee' }}>
                    <input type="color" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '34px', height: '34px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer' }} />
                    <input type="text" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ background: 'none', border: 'none', padding: '0 12px', fontSize: '14px', fontWeight: '600', width: '100px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '10px', color: '#78716c' }}>Header Theme</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8f7f6', padding: '8px', borderRadius: '14px', border: '1px solid #eee' }}>
                    <input type="color" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ width: '34px', height: '34px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer' }} />
                    <input type="text" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ background: 'none', border: 'none', padding: '0 12px', fontSize: '14px', fontWeight: '600', width: '100px', outline: 'none' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Messaging Section */}
            <div style={{ background: '#fff', padding: '32px', borderRadius: '28px', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
               <h3 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5e3c' }}></span>
                Content & Copy
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>Concierge Name</label>
                  <input type="text" value={formState.headerTitle} onChange={(e) => handleChange('headerTitle', e.target.value)} style={{ width: '100%', padding: '14px', background: '#f8f7f6', border: '1px solid #eee', borderRadius: '14px', outline: 'none', fontSize: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>Headline</label>
                  <input type="text" value={formState.welcomeText} onChange={(e) => handleChange('welcomeText', e.target.value)} style={{ width: '100%', padding: '14px', background: '#f8f7f6', border: '1px solid #eee', borderRadius: '14px', outline: 'none', fontSize: '15px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>Description</label>
                  <textarea value={formState.welcomeSubtext} onChange={(e) => handleChange('welcomeSubtext', e.target.value)} style={{ width: '100%', padding: '14px', background: '#f8f7f6', border: '1px solid #eee', borderRadius: '14px', outline: 'none', fontSize: '15px', minHeight: '100px', resize: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>Brand Avatar (URL)</label>
                  <input type="text" value={formState.welcomeImg} onChange={(e) => handleChange('welcomeImg', e.target.value)} style={{ width: '100%', padding: '14px', background: '#f8f7f6', border: '1px solid #eee', borderRadius: '14px', outline: 'none', fontSize: '14px', fontFamily: 'monospace' }} />
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: PREVIEW --- */}
          <div style={{ position: 'sticky', top: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', color: '#a8a29e' }}>
                <Icons.Eye />
                <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Storefront Preview</span>
            </div>

            <div style={{ 
              width: '350px', height: '620px', background: '#1a1615', borderRadius: '50px', padding: '12px', border: '6px solid #2a2625', 
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)', margin: '0 auto', overflow: 'hidden' 
            }}>
              <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* PREVIEW HEADER */}
                <div style={{ background: formState.headerBgColor, padding: '30px 24px', color: '#fff', position: 'relative' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                     <div style={{ position: 'relative' }}>
                        <img src={formState.welcomeImg} style={{ width: '48px', height: '48px', borderRadius: '18px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} alt="avatar" />
                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#10b981', border: '2px solid #fff', borderRadius: '50%' }}></div>
                     </div>
                     <div>
                       <div style={{ fontWeight: '800', fontSize: '16px', letterSpacing: '-0.5px' }}>{formState.headerTitle}</div>
                       <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: '600' }}>Active Support Agent</div>
                     </div>
                   </div>
                </div>

                {/* PREVIEW BODY */}
                <div style={{ flex: 1, padding: '32px 24px', background: 'linear-gradient(180deg, #fdfaf8 0%, #ffffff 100%)' }}>
                   <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1a1615', margin: '0 0 12px 0', lineHeight: '1.1', letterSpacing: '-1px' }}>{formState.welcomeText}</h2>
                   <p style={{ fontSize: '15px', color: '#78716c', lineHeight: '1.6', margin: '0 0 32px 0' }}>{formState.welcomeSubtext}</p>
                   
                   <div style={{ 
                     background: '#fff', padding: '18px 20px', borderRadius: '22px', border: '1px solid #f0f0f0', display: 'flex', 
                     justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' 
                   }}>
                     <span style={{ fontSize: '14px', fontWeight: '800', color: '#1a1615' }}>Send a message</span>
                     <div style={{ background: formState.primaryColor, width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: `0 8px 15px ${formState.primaryColor}40` }}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                     </div>
                   </div>
                </div>

                {/* PREVIEW FOOTER */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center' }}>
                   <div style={{ width: '100px', height: '4px', background: '#f0f0f0', borderRadius: '10px' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Global CSS for attractive fonts and hover effects */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
        input:focus, textarea:focus {
          border-color: #8b5e3c !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(139, 94, 60, 0.1);
          transition: 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}