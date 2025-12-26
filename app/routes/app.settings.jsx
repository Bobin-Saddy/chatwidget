import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// 1. Icon Map for both Admin Panel and Preview
const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
};

const FONT_OPTIONS = [
  { label: "System Default", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: "Inter", value: "'Inter', sans-serif" },
  { label: "Poppins", value: "'Poppins', sans-serif" },
  { label: "Montserrat", value: "'Montserrat', sans-serif" },
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  const defaults = {
    primaryColor: "#4F46E5",
    headerBgColor: "#384959",
    heroBgColor: "#bdddfc",
    headerTextColor: "#ffffff",
    heroTextColor: "#384959",
    cardTitleColor: "#384959",
    cardSubtitleColor: "#64748b",
    onboardingTextColor: "#384959",
    launcherIcon: "bubble",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=fff&color=4F46E5",
    headerTitle: "Live Support",
    headerSubtitle: "Online now",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "We are here to help you! Ask us anything.",
    replyTimeText: "Typically replies in 5 minutes",
    startConversationText: "Send us a message",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    baseFontSize: "15px"
  };

  return json(settings ? { ...defaults, ...settings } : defaults);
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

export default function UltimateSettings() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const [activeTab, setActiveTab] = useState('style');
  const [toast, setToast] = useState(false);

  useEffect(() => { if (actionData?.success) { setToast(true); setTimeout(() => setToast(false), 3000); } }, [actionData]);

  const handleChange = (f, v) => setFormState(p => ({ ...p, [f]: v }));
  
  const handleSave = () => {
    const formData = new FormData();
    Object.entries(formState).forEach(([key, value]) => formData.append(key, value));
    submit(formData, { method: "POST" });
  };

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      
      {/* SIDE NAVIGATION */}
      <div style={{ width: '260px', background: '#FFF', borderRight: '1px solid #E5E7EB', padding: '30px 20px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ width: '35px', height: '35px', background: 'linear-gradient(135deg, #4F46E5, #9333EA)', borderRadius: '10px' }}></div>
          <span style={{ fontWeight: '800', fontSize: '18px' }}>Chatly Studio</span>
        </div>
        
        <nav style={{ flex: 1 }}>
          <NavButton active={activeTab === 'style'} onClick={() => setActiveTab('style')} label="Appearance" icon="🎨" />
          <NavButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} label="Translations" icon="🌐" />
          <NavButton active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} label="Typography" icon="Aa" />
        </nav>
      </div>

      {/* MAIN CONFIG */}
      <div style={{ flex: 1, padding: '40px 50px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h1>
          <button onClick={handleSave} style={{ padding: '12px 28px', background: '#111827', color: '#FFF', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', border: 'none' }}>
            {navigation.state === "submitting" ? "Saving..." : "Save & Publish"}
          </button>
        </header>

        {activeTab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Launcher Icon">
              <div style={{ display: 'flex', gap: '12px' }}>
                {Object.keys(ICON_MAP).map(key => (
                  <IconButton key={key} active={formState.launcherIcon === key} onClick={() => handleChange('launcherIcon', key)}>
                    {ICON_MAP[key]}
                  </IconButton>
                ))}
              </div>
            </Card>

            <Card title="Colors & Branding">
               <Field label="Avatar URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
                <ColorBox label="Primary Color" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <ColorBox label="Header BG" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                <ColorBox label="Hero BG" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
                <ColorBox label="Header Text" value={formState.headerTextColor} onChange={(v) => handleChange('headerTextColor', v)} />
                <ColorBox label="Hero Text Color" value={formState.heroTextColor} onChange={(v) => handleChange('heroTextColor', v)} />
                <ColorBox label="Card Title" value={formState.cardTitleColor} onChange={(v) => handleChange('cardTitleColor', v)} />
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <Card title="Widget Text">
            <Field label="Header Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
            <Field label="Welcome Text" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
            <AreaField label="Welcome Subtext" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
            <Field label="Button Text" value={formState.startConversationText} onChange={(v) => handleChange('startConversationText', v)} />
          </Card>
        )}

        {activeTab === 'typography' && (
          <Card title="Fonts">
            <select value={formState.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <div style={{ marginTop: '20px' }}>
              <label>Size: {formState.baseFontSize}</label>
              <input type="range" min="12" max="20" value={parseInt(formState.baseFontSize)} onChange={(e) => handleChange('baseFontSize', `${e.target.value}px`)} style={{ width: '100%' }} />
            </div>
          </Card>
        )}
      </div>

      {/* LIVE PREVIEW SECTION */}
      <div style={{ width: '450px', padding: '40px', background: '#F9FAFB', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '10px', fontSize: '12px', fontWeight: 'bold', color: '#9CA3AF' }}>LIVE PREVIEW</div>
          
          <div style={{ 
            width: '350px', height: '580px', background: '#FFF', borderRadius: '30px', overflow: 'hidden', display: 'flex', flexDirection: 'column', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: formState.fontFamily 
          }}>
            <div style={{ background: formState.headerBgColor, padding: '20px', color: formState.headerTextColor }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={formState.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '10px' }} alt="Avatar" />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{formState.headerTitle}</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>{formState.headerSubtitle}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, background: '#F4F7F9' }}>
              <div style={{ background: formState.heroBgColor, padding: '30px 20px', color: formState.heroTextColor }}>
                <h2 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>{formState.welcomeText}</h2>
                <p style={{ fontSize: formState.baseFontSize, margin: 0 }}>{formState.welcomeSubtext}</p>
              </div>

              <div style={{ background: '#FFF', margin: '-20px 15px 0', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: formState.cardTitleColor }}>{formState.startConversationText}</div>
                  <div style={{ fontSize: '12px', color: formState.cardSubtitleColor }}>{formState.replyTimeText}</div>
                </div>
                <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: formState.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', width: '60px', height: '60px', borderRadius: '50%', background: formState.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            {ICON_MAP[formState.launcherIcon]}
          </div>
      </div>

      {toast && <Toast message="Settings Saved!" />}
    </div>
  );
}

// Reusable UI Components
const NavButton = ({ active, label, icon, onClick }) => (
  <div onClick={onClick} style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', background: active ? '#EEF2FF' : 'transparent', color: active ? '#4F46E5' : '#4B5563', fontWeight: active ? 'bold' : '500', display: 'flex', gap: '10px', marginBottom: '5px' }}>
    <span>{icon}</span> {label}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: '#FFF', padding: '25px', borderRadius: '15px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
    <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>{title}</h3>
    {children}
  </div>
);

const IconButton = ({ children, active, onClick }) => (
  <div onClick={onClick} style={{ width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: active ? '2px solid #4F46E5' : '1px solid #E5E7EB', background: active ? '#F5F7FF' : '#FFF', color: active ? '#4F46E5' : '#6B7280' }}>
    {children}
  </div>
);

const ColorBox = ({ label, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', border: '1px solid #E5E7EB', padding: '5px', borderRadius: '8px' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '25px', height: '25px', border: 'none', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{value}</span>
    </div>
  </div>
);

const Field = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
  </div>
);

const AreaField = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', marginBottom: '5px' }}>{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', minHeight: '60px' }} />
  </div>
);

const Toast = ({ message }) => (
  <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#FFF', padding: '10px 20px', borderRadius: '30px', zIndex: 1000 }}>
    ✅ {message}
  </div>
);