import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// --- SVG ICON LIBRARY (Expanded) ---
const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  // Yahan sabhi fields ensure karein taaki UI khali na dikhe
  return json(settings || {
    primaryColor: "#6366f1",
    headerBgColor: "#384959",
    heroBgColor: "#bdddfc",
    launcherIcon: "bubble",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=fff",
    headerTitle: "Live Support",
    headerSubtitle: "Online now",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "How can we help you today?",
    replyTimeText: "Replies in 5 mins",
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

  const handleChange = (field, value) => setFormState(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    submit(formData, { method: "POST" });
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', display: 'flex' }}>
      {/* --- SIDEBAR NAV --- */}
      <div style={{ width: '280px', background: '#1E293B', padding: '40px 20px', color: '#fff' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#6366F1', padding: '5px 10px', borderRadius: '8px' }}>C</span> Chatly AI
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SidebarItem active label="Appearance" icon="🎨" />
          <SidebarItem label="Automations" icon="🤖" />
          <SidebarItem label="Team" icon="👥" />
          <SidebarItem label="Analytics" icon="📈" />
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0F172A' }}>Widget Appearance</h1>
              <p style={{ color: '#64748B', marginTop: '5px' }}>Configure how the chat widget looks to your customers.</p>
            </div>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              style={{ 
                padding: '12px 30px', borderRadius: '10px', background: '#6366F1', color: '#fff', 
                border: 'none', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)'
              }}
            >
              {isSaving ? "Publishing..." : "Save Changes"}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <Section title="Launcher Style" subtitle="Choose the button your customers see">
                <div style={{ display: 'flex', gap: '15px' }}>
                  {Object.keys(ICON_MAP).map((key) => (
                    <button 
                      key={key}
                      onClick={() => handleChange('launcherIcon', key)}
                      style={{
                        width: '64px', height: '64px', borderRadius: '14px', border: '2px solid',
                        borderColor: formState.launcherIcon === key ? '#6366F1' : '#E2E8F0',
                        background: formState.launcherIcon === key ? '#F5F3FF' : '#FFF',
                        color: formState.launcherIcon === key ? '#6366F1' : '#64748B',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s'
                      }}
                    >
                      {ICON_MAP[key]}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Theme Colors" subtitle="Set your brand's primary and secondary colors">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <ColorInput label="Main Theme" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                  <ColorInput label="Header Bg" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                  <ColorInput label="Hero Banner" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
                </div>
              </Section>

              <Section title="Widget Content" subtitle="Update the text displayed inside the chat">
                <div style={{ display: 'grid', gap: '20px' }}>
                  <TextInput label="Header Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <TextInput label="Status Text" value={formState.headerSubtitle} onChange={(v) => handleChange('headerSubtitle', v)} />
                    <TextInput label="Reply Label" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
                  </div>
                  <TextInput label="Hero Welcome" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                  <TextArea label="Intro Description" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
                </div>
              </Section>
            </div>

            {/* --- LIVE PREVIEW --- */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: '700', color: '#94A3B8', fontSize: '12px', letterSpacing: '1px' }}>LIVE PREVIEW</div>
              <div style={{ 
                width: '100%', height: '620px', background: '#0F172A', borderRadius: '48px', padding: '12px', 
                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.25)', border: '4px solid #334155'
              }}>
                <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '36px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  
                  {/* Mockup Header */}
                  <div style={{ background: formState.headerBgColor, padding: '24px 20px', color: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={formState.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff' }} />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{formState.headerTitle}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></span> {formState.headerSubtitle}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mockup Body */}
                  <div style={{ flex: 1, background: '#F8FAFC', padding: '20px' }}>
                    <div style={{ background: formState.heroBgColor, padding: '30px 20px', borderRadius: '24px', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, color: '#1E293B', fontSize: '20px', fontWeight: '800' }}>{formState.welcomeText}</h3>
                      <p style={{ margin: '8px 0 0', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>{formState.welcomeSubtext}</p>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: `1px solid #E2E8F0`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#1E293B' }}>Start Chatting</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{formState.replyTimeText}</div>
                      </div>
                      <div style={{ color: formState.primaryColor }}>{ICON_MAP[formState.launcherIcon]}</div>
                    </div>
                  </div>

                  {/* Mockup Floating Launcher */}
                  <div style={{ 
                    position: 'absolute', bottom: '20px', right: '20px', width: '56px', height: '56px', 
                    background: formState.primaryColor, borderRadius: '16px', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }}>
                    {ICON_MAP[formState.launcherIcon]}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showSavedToast && <Toast message="Settings published successfully!" />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 5px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '25px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function SidebarItem({ label, icon, active }) {
  return (
    <div style={{ 
      padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
      background: active ? '#334155' : 'transparent', color: active ? '#fff' : '#94A3B8', fontWeight: active ? '600' : '400'
    }}>
      <span>{icon}</span> {label}
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F1F5F9', padding: '8px', borderRadius: '10px' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ border: 'none', background: 'none', width: '30px', height: '30px', cursor: 'pointer' }} />
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{value.toUpperCase()}</span>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px' }} />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', minHeight: '80px', resize: 'none' }} />
    </div>
  );
}

function Toast({ message }) {
  return (
    <div style={{ 
      position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', 
      background: '#0F172A', color: '#fff', padding: '12px 24px', borderRadius: '12px', 
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', zIndex: 1000, fontWeight: '600'
    }}>
      {message}
    </div>
  );
}