import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#4F46E5",
    headerBgColor: "#111827",
    heroBgColor: "#EEF2FF",
    headerTextColor: "#FFFFFF",
    heroTextColor: "#111827",
    launcherIcon: "bubble",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=4F46E5&color=fff",
    headerTitle: "Customer Care",
    headerSubtitle: "Online & Ready",
    welcomeText: "How can we help?",
    welcomeSubtext: "Our team typically responds in under 5 minutes.",
    replyTimeText: "Replies instantly",
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
  const handleSave = () => submit(formState, { method: "POST" });

  return (
    <div style={{ background: '#F3F4F6', minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- COLUMN 1: NAVIGATION --- */}
      <div style={{ width: '260px', background: '#FFFFFF', borderRight: '1px solid #E5E7EB', padding: '30px 20px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', padding: '0 10px' }}>
          <div style={{ width: '35px', height: '35px', background: 'linear-gradient(135deg, #4F46E5, #9333EA)', borderRadius: '10px' }}></div>
          <span style={{ fontWeight: '800', fontSize: '18px', color: '#111827' }}>Chatly Studio</span>
        </div>
        
        <nav style={{ flex: 1 }}>
          <NavButton active={activeTab === 'style'} onClick={() => setActiveTab('style')} label="Widget Style" icon="🎨" />
          <NavButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} label="Translations" icon="🌐" />
        </nav>

        <div style={{ background: '#F9FAFB', padding: '15px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', margin: 0 }}>PLAN: PROFESSIONAL</p>
        </div>
      </div>

      {/* --- COLUMN 2: CONFIGURATION --- */}
      <div style={{ flex: 1, padding: '40px 50px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>{activeTab === 'style' ? 'Appearance' : 'Content'}</h1>
            <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>Customize your store's chat identity.</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={navigation.state === "submitting"}
            style={{ padding: '12px 28px', background: '#111827', color: '#FFF', borderRadius: '10px', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
          >
            {navigation.state === "submitting" ? "Syncing..." : "Save & Publish"}
          </button>
        </header>

        {activeTab === 'style' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Button Icon">
              <div style={{ display: 'flex', gap: '12px' }}>
                {Object.keys(ICON_MAP).map(key => (
                  <IconButton key={key} active={formState.launcherIcon === key} onClick={() => handleChange('launcherIcon', key)}>
                    {ICON_MAP[key]}
                  </IconButton>
                ))}
              </div>
            </Card>

            <Card title="Interface Colors">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                <ColorBox label="Brand Primary" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <ColorBox label="Header Background" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                <ColorBox label="Header Text Color" value={formState.headerTextColor} onChange={(v) => handleChange('headerTextColor', v)} />
                <ColorBox label="Banner Background" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
                <ColorBox label="Banner Text Color" value={formState.heroTextColor} onChange={(v) => handleChange('heroTextColor', v)} />
              </div>
            </Card>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card title="Header Content">
               <Field label="Widget Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
               <Field label="Online Status Text" value={formState.headerSubtitle} onChange={(v) => handleChange('headerSubtitle', v)} />
            </Card>
            <Card title="Message Templates">
               <Field label="Welcome Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
               <AreaField label="Hero Sub-description" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
               <Field label="Reply Time Label" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
            </Card>
          </div>
        )}
      </div>

      {/* --- COLUMN 3: LIVE PREVIEW --- */}
      <div style={{ width: '450px', padding: '40px', background: '#FFFFFF', borderLeft: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ marginBottom: '20px', fontSize: '12px', fontWeight: '800', color: '#9CA3AF', letterSpacing: '1px' }}>STOREFRONT PREVIEW</div>
          
          <div style={{ width: '340px', height: '600px', background: '#000', borderRadius: '45px', padding: '10px', boxShadow: '0 30px 60px rgba(0,0,0,0.12)', border: '6px solid #1F2937', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', background: '#FFF', borderRadius: '35px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Header Mockup */}
                <div style={{ background: formState.headerBgColor, padding: '25px 20px', color: formState.headerTextColor }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={formState.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} alt="Avatar" />
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '15px' }}>{formState.headerTitle}</div>
                            <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
                                <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></span> {formState.headerSubtitle}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Mockup */}
                <div style={{ flex: 1, background: '#F9FAFB' }}>
                    <div style={{ background: formState.heroBgColor, padding: '35px 20px', color: formState.heroTextColor }}>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: 'inherit' }}>{formState.welcomeText}</h2>
                        <p style={{ fontSize: '13px', marginTop: '8px', lineHeight: '1.5', color: 'inherit', opacity: 0.8 }}>{formState.welcomeSubtext}</p>
                    </div>
                    
                    <div style={{ margin: '20px', padding: '18px', background: '#FFF', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>Send a message</div>
                            <div style={{ fontSize: '12px', color: '#6B7280' }}>{formState.replyTimeText}</div>
                        </div>
                        <div style={{ color: formState.primaryColor }}>{ICON_MAP[formState.launcherIcon]}</div>
                    </div>
                </div>
                
                {/* Floating Launcher Icon Mockup */}
                <div style={{ position: 'absolute', bottom: '25px', right: '25px', width: '55px', height: '55px', borderRadius: '18px', background: formState.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
                    {ICON_MAP[formState.launcherIcon]}
                </div>
            </div>
          </div>
      </div>

      {toast && <Toast message="Settings Synced Successfully!" />}
    </div>
  );
}

// --- SUB-COMPONENTS ---

const NavButton = ({ active, label, icon, onClick }) => (
  <div onClick={onClick} style={{ padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', background: active ? '#EEF2FF' : 'transparent', color: active ? '#4F46E5' : '#4B5563', fontWeight: active ? '700' : '500', display: 'flex', gap: '12px', marginBottom: '5px', transition: '0.2s' }}>
    <span>{icon}</span> {label}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    {children}
  </div>
);

const IconButton = ({ children, active, onClick }) => (
  <div onClick={onClick} style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: active ? '2px solid #4F46E5' : '1px solid #E5E7EB', background: active ? '#EEF2FF' : '#FFF', color: active ? '#4F46E5' : '#6B7280', transition: '0.2s' }}>
    {children}
  </div>
);

const ColorBox = ({ label, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#F9FAFB', padding: '8px', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ border: 'none', background: 'none', width: '25px', height: '25px', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827' }}>{value.toUpperCase()}</span>
    </div>
  </div>
);

const Field = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px' }} />
  </div>
);

const AreaField = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', fontSize: '12px', color: '#6B7280', fontWeight: '600', marginBottom: '8px' }}>{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '14px', minHeight: '80px', resize: 'none' }} />
  </div>
);

const Toast = ({ message }) => (
  <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#111827', color: '#FFF', padding: '12px 24px', borderRadius: '50px', fontWeight: '600', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 1000 }}>
    ✅ {message}
  </div>
);