import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// --- CUSTOM SVG ICON LIBRARY ---
const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3z"/></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
};

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  return json(settings || {
    primaryColor: "#7C3AED",
    headerBgColor: "#1E293B",
    heroBgColor: "#F1F5F9",
    launcherIcon: "bubble",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=7C3AED&color=fff",
    headerTitle: "Support Guru",
    headerSubtitle: "Always Active",
    welcomeText: "Welcome to our store!",
    welcomeSubtext: "How can we assist you today?",
    replyTimeText: "We reply in seconds",
    startConversationText: "Chat Now"
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

export default function PremiumSettings() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const [activeTab, setActiveTab] = useState('design');
  const [toast, setToast] = useState(false);

  useEffect(() => { if (actionData?.success) { setToast(true); setTimeout(() => setToast(false), 3000); } }, [actionData]);

  const handleChange = (f, v) => setFormState(p => ({ ...p, [f]: v }));
  const handleSave = () => submit(formState, { method: "POST" });

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* --- TOP NAVIGATION BAR --- */}
      <div style={{ borderBottom: '1px solid #1E293B', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(45deg, #7C3AED, #EC4899)', borderRadius: '8px' }}></div>
          <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>WIDGET PRO</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} style={{ background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: '0.3s' }}>
            {navigation.state === "submitting" ? "Saving..." : "Publish Settings"}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '40px' }}>
        
        {/* --- LEFT MENU --- */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <TabBtn id="design" active={activeTab} set={setActiveTab} label="Visual Design" icon="🎨" />
            <TabBtn id="content" active={activeTab} set={setActiveTab} label="Widget Content" icon="✍️" />
            <TabBtn id="behavior" active={activeTab} set={setActiveTab} label="Behavior" icon="⚙️" />
        </div>

        {/* --- CENTER CONFIGURATION --- */}
        <div style={{ flex: 1, padding: '0 60px' }}>
          {activeTab === 'design' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <Section title="Launcher Identity">
                 <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '16px' }}>Select the icon that represents your brand on the homepage.</p>
                 <div style={{ display: 'flex', gap: '12px' }}>
                    {Object.keys(ICON_MAP).map(key => (
                      <IconBox key={key} active={formState.launcherIcon === key} onClick={() => handleChange('launcherIcon', key)}>
                        {ICON_MAP[key]}
                      </IconBox>
                    ))}
                 </div>
              </Section>

              <Section title="Color Palette">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <ColorRow label="Brand Primary" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                  <ColorRow label="Header Bar" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                  <ColorRow label="Welcome Hero" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'content' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <Section title="Header Details">
                  <InputRow label="Support Name" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                  <InputRow label="Status Text" value={formState.headerSubtitle} onChange={(v) => handleChange('headerSubtitle', v)} />
               </Section>
               <Section title="Home Screen Messages">
                  <InputRow label="Main Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                  <TextAreaRow label="Sub-description" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
                  <InputRow label="Reply Time Label" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
               </Section>
             </div>
          )}
        </div>

        {/* --- RIGHT LIVE MOCKUP --- */}
        <div style={{ width: '380px' }}>
           <div style={{ border: '12px solid #1E293B', borderRadius: '40px', height: '640px', background: '#fff', overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              {/* Header */}
              <div style={{ background: formState.headerBgColor, padding: '24px 20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `url(${formState.welcomeImg}) center/cover` }}></div>
                 <div>
                   <div style={{ fontWeight: '800', fontSize: '16px' }}>{formState.headerTitle}</div>
                   <div style={{ fontSize: '12px', opacity: 0.8 }}>{formState.headerSubtitle}</div>
                 </div>
              </div>
              {/* Hero */}
              <div style={{ background: formState.heroBgColor, padding: '40px 20px' }}>
                 <h2 style={{ margin: 0, color: '#1E293B', fontSize: '24px', fontWeight: '900' }}>{formState.welcomeText}</h2>
                 <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>{formState.welcomeSubtext}</p>
              </div>
              {/* Action Card */}
              <div style={{ margin: '20px', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <div style={{ fontWeight: '800', fontSize: '14px', color: '#1E293B' }}>Start conversation</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{formState.replyTimeText}</div>
                 </div>
                 <div style={{ color: formState.primaryColor }}>{ICON_MAP[formState.launcherIcon]}</div>
              </div>
              {/* Floating Launcher */}
              <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '56px', height: '56px', borderRadius: '18px', background: formState.primaryColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>
                 {ICON_MAP[formState.launcherIcon]}
              </div>
           </div>
        </div>

      </div>

      {toast && <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#10B981', color: 'white', padding: '12px 32px', borderRadius: '12px', fontWeight: 'bold' }}>Success: Settings Live on Store!</div>}
    </div>
  );
}

// --- REUSABLE UI COMPONENTS ---

const Section = ({ title, children }) => (
  <div style={{ background: '#1E293B', padding: '32px', borderRadius: '24px', border: '1px solid #334155' }}>
    <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#F8FAFC' }}>{title}</h3>
    {children}
  </div>
);

const TabBtn = ({ id, active, set, label, icon }) => (
  <div onClick={() => set(id)} style={{ padding: '14px 20px', borderRadius: '12px', cursor: 'pointer', background: active === id ? '#334155' : 'transparent', color: active === id ? '#fff' : '#94A3B8', fontWeight: '600', display: 'flex', gap: '12px', transition: '0.2s' }}>
    <span>{icon}</span> {label}
  </div>
);

const IconBox = ({ children, active, onClick }) => (
  <div onClick={onClick} style={{ width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: active ? '3px solid #7C3AED' : '1px solid #334155', background: active ? '#7C3AED15' : '#0F172A', color: active ? '#7C3AED' : '#64748B', transition: '0.2s' }}>
    {children}
  </div>
);

const ColorRow = ({ label, value, onChange }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>{label}</label>
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#0F172A', padding: '8px', borderRadius: '12px', border: '1px solid #334155' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ background: 'none', border: 'none', width: '30px', height: '30px', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{value.toUpperCase()}</span>
    </div>
  </div>
);

const InputRow = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', padding: '12px', borderRadius: '12px', color: '#fff' }} />
  </div>
);

const TextAreaRow = ({ label, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '13px', color: '#94A3B8', marginBottom: '8px' }}>{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', padding: '12px', borderRadius: '12px', color: '#fff', minHeight: '80px', resize: 'none' }} />
  </div>
);