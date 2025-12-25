import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// --- HELPERS ---
const Icons = {
  Save: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  Palette: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.5-.8-.5-1.3 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8Z"/></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  // Default values matching your Liquid structure
  return json(settings || {
    primaryColor: "#6366f1",
    headerBgColor: "#384959",
    heroBgColor: "#bdddfc",
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
    <div style={{ backgroundColor: '#fcfaf8', minHeight: '100vh', padding: '40px 0', fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1a1615' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* --- TOP BAR --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Widget Design Studio</h1>
            <p style={{ color: '#78716c', fontWeight: '500' }}>Customize how customers interact with your brand</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ 
              padding: '16px 32px', borderRadius: '16px', background: '#1a1615', color: '#fff', 
              border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: '0.2s'
            }}
          >
            {isSaving ? "Saving..." : <><Icons.Save /> Save Settings</>}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '48px', alignItems: 'start' }}>
          
          {/* --- LEFT: CONFIGURATION --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Visual Branding */}
            <Section title="Colors & Branding" icon={<Icons.Palette />}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <ColorInput label="Primary Action" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <ColorInput label="Header Theme" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                <ColorInput label="Hero Banner" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
              </div>
            </Section>

            {/* Header Content */}
            <Section title="Header Configuration">
              <div style={{ display: 'grid', gap: '20px' }}>
                <TextInput label="Support Name (Title)" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                <TextInput label="Availability Subtitle" value={formState.headerSubtitle} onChange={(v) => handleChange('headerSubtitle', v)} />
                <TextInput label="Avatar Image URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
              </div>
            </Section>

            {/* Home Screen Content */}
            <Section title="Home Tab Content">
              <div style={{ display: 'grid', gap: '20px' }}>
                <TextInput label="Welcome Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                <TextArea label="Intro Subtext" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
                <TextInput label="Reply Time Label" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
              </div>
            </Section>

          </div>

          {/* --- RIGHT: LIVE PREVIEW --- */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#a8a29e', marginBottom: '16px', letterSpacing: '1px' }}>REAL-TIME PREVIEW</div>
            
            {/* Mockup Phone Frame */}
            <div style={{ 
              width: '100%', height: '650px', background: '#1a1615', borderRadius: '50px', padding: '12px', 
              boxShadow: '0 40px 100px rgba(0,0,0,0.2)', border: '6px solid #2a2625'
            }}>
              <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '38px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header Mock */}
                <div style={{ background: formState.headerBgColor, padding: '24px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={formState.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)' }} alt="avatar" />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px' }}>{formState.headerTitle}</div>
                      <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span> {formState.headerSubtitle}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Content Mock */}
                <div style={{ flex: 1, overflowY: 'auto', background: '#fdfaf5' }}>
                  <div style={{ background: formState.heroBgColor, padding: '40px 20px', borderRadius: '0 0 32px 32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#384959', margin: '0 0 8px 0', lineHeight: '1.2' }}>{formState.welcomeText}</h2>
                    <p style={{ fontSize: '14px', color: '#384959', opacity: 0.8, margin: 0, fontWeight: '500' }}>{formState.welcomeSubtext}</p>
                  </div>

                  <div style={{ 
                    margin: '-30px 20px 0', padding: '20px', background: '#fff', borderRadius: '20px', border: `2.5px solid ${formState.headerBgColor}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: '#384959' }}>Send us a message</div>
                      <div style={{ fontSize: '12px', color: '#384959', opacity: 0.7 }}>{formState.replyTimeText}</div>
                    </div>
                    <div style={{ background: `${formState.primaryColor}22`, color: formState.primaryColor, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      →
                    </div>
                  </div>
                </div>

                {/* Footer Nav Mock */}
                <div style={{ padding: '15px', background: formState.headerBgColor, display: 'flex', justifyContent: 'space-around', color: '#fff' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', opacity: 1 }}>HOME</div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textAlign: 'center', opacity: 0.5 }}>MESSAGES</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {showSavedToast && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '100px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 40px rgba(16,185,129,0.3)', animation: 'slideUp 0.3s ease' }}>
          <Icons.Check /> Settings Synchronized Successfully
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function Section({ title, children, icon }) {
  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', border: '1px solid #f0f0f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
      <h3 style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', color: '#8b5e3c', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f7f6', padding: '6px', borderRadius: '12px', border: '1px solid #eee' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '30px', height: '30px', border: 'none', background: 'none', cursor: 'pointer' }} />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '70px', background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', outline: 'none' }} />
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f8f7f6', fontSize: '14px', outline: 'none' }} />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#78716c' }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', background: '#f8f7f6', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'none' }} />
    </div>
  );
}