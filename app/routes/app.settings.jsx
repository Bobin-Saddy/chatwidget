import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

// Icons and Constants (Stay Same)
const ICON_MAP = {
  bubble: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  support: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  sparkle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  send: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
};

// ... Loader & Action (Keep your existing logic) ...

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
    <div style={{ background: '#F9FAFB', minHeight: '100vh', display: 'flex', color: '#111827' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <aside style={{ width: '280px', background: '#FFF', borderRight: '1px solid #E5E7EB', padding: '32px 20px', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
             <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          </div>
          <span style={{ fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>Chatly<span style={{color: '#6366F1'}}>Studio</span></span>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavButton active={activeTab === 'style'} onClick={() => setActiveTab('style')} label="Appearance" icon="🎨" />
          <NavButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} label="Language & Text" icon="🌐" />
          <NavButton active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} label="Typography" icon="Aa" />
        </nav>

        <div style={{ padding: '20px', background: '#F3F4F6', borderRadius: '16px', fontSize: '13px' }}>
            <p style={{ margin: 0, color: '#6B7280', fontWeight: '500' }}>Need help? <a href="#" style={{ color: '#6366F1' }}>Contact Support</a></p>
        </div>
      </aside>

      {/* MAIN CONFIGURATION AREA */}
      <main style={{ flex: 1, padding: '48px 60px', overflowY: 'auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#6366F1', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Settings</div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>
              {activeTab === 'style' && 'Design your widget'}
              {activeTab === 'content' && 'Widget Content'}
              {activeTab === 'typography' && 'Font & Sizing'}
            </h1>
          </div>
          <button 
            onClick={handleSave} 
            disabled={navigation.state === "submitting"}
            style={{ 
                padding: '12px 32px', 
                background: '#6366F1', 
                color: '#FFF', 
                borderRadius: '12px', 
                fontWeight: '700', 
                cursor: 'pointer', 
                border: 'none', 
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s'
            }}>
            {navigation.state === "submitting" ? "Saving..." : "Publish Changes"}
          </button>
        </header>

        <div style={{ maxWidth: '700px' }}>
            {activeTab === 'style' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <Card title="Launcher Design">
                    <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>Select the icon that customers see on your site.</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        {Object.keys(ICON_MAP).map(key => (
                        <IconButton key={key} active={formState.launcherIcon === key} onClick={() => handleChange('launcherIcon', key)}>
                            {ICON_MAP[key]}
                        </IconButton>
                        ))}
                    </div>
                </Card>

                <Card title="Branding & Colors">
                    <Field label="Avatar Image URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '16px' }}>
                        <ColorBox label="Brand Primary" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                        <ColorBox label="Header Background" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                        <ColorBox label="Banner Hero" value={formState.heroBgColor} onChange={(v) => handleChange('heroBgColor', v)} />
                        <ColorBox label="Header Text" value={formState.headerTextColor} onChange={(v) => handleChange('headerTextColor', v)} />
                    </div>
                </Card>

                <Card title="Card Styles">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <ColorBox label="Hero Text" value={formState.heroTextColor} onChange={(v) => handleChange('heroTextColor', v)} />
                        <ColorBox label="Action Title" value={formState.cardTitleColor} onChange={(v) => handleChange('cardTitleColor', v)} />
                        <ColorBox label="Action Subtext" value={formState.cardSubtitleColor} onChange={(v) => handleChange('cardSubtitleColor', v)} />
                        <ColorBox label="Footer Text" value={formState.onboardingTextColor} onChange={(v) => handleChange('onboardingTextColor', v)} />
                    </div>
                </Card>
            </div>
            )}

            {activeTab === 'content' && (
            <Card title="Conversational Copy">
                <Field label="Header Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                <Field label="Availability Status" value={formState.headerSubtitle} onChange={(v) => handleChange('headerSubtitle', v)} />
                <Field label="Welcome Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                <AreaField label="Short Intro Message" value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Field label="Button Text" value={formState.startConversationText} onChange={(v) => handleChange('startConversationText', v)} />
                    <Field label="Reply Expectation" value={formState.replyTimeText} onChange={(v) => handleChange('replyTimeText', v)} />
                </div>
            </Card>
            )}

            {activeTab === 'typography' && (
            <Card title="Font Configuration">
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '700', marginBottom: '10px' }}>Font Family</label>
                    <select 
                        value={formState.fontFamily} 
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '15px', outline: 'none', cursor: 'pointer' }}
                    >
                        {FONT_OPTIONS.map(font => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                    </select>
                </div>

                <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '700', marginBottom: '10px' }}>Base Font Size: <span style={{color: '#6366F1'}}>{formState.baseFontSize}</span></label>
                <input 
                    type="range" min="12" max="20" step="1" 
                    value={parseInt(formState.baseFontSize)} 
                    onChange={(e) => handleChange('baseFontSize', `${e.target.value}px`)}
                    style={{ width: '100%', height: '6px', background: '#E5E7EB', borderRadius: '5px', outline: 'none', accentColor: '#6366F1' }}
                />
            </Card>
            )}
        </div>
      </main>

      {/* LIVE PREVIEW - MOBILE FRAME DESIGN */}
      <section style={{ width: '480px', background: '#F3F4F6', borderLeft: '1px solid #E5E7EB', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'sticky', top: 0, height: '100vh' }}>
          <div style={{ background: '#000', borderRadius: '40px', padding: '12px', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.25)', border: '6px solid #374151' }}>
            <div style={{ 
                width: '320px', height: '560px', background: '#FFF', borderRadius: '30px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative',
                fontFamily: formState.fontFamily 
            }}>
                {/* Header */}
                <div style={{ background: formState.headerBgColor, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', color: formState.headerTextColor }}>
                    <img src={formState.welcomeImg} style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover', background: '#FFF' }} alt="Avatar" />
                    <div>
                        <div style={{ fontWeight: '800', fontSize: `calc(${formState.baseFontSize} * 1.1)` }}>{formState.headerTitle}</div>
                        <div style={{ fontSize: `calc(${formState.baseFontSize} * 0.8)`, opacity: 0.8 }}>{formState.headerSubtitle}</div>
                    </div>
                </div>

                {/* Body */}
                <div style={{ flex: 1, background: '#F8FAFC', overflow: 'hidden' }}>
                    <div style={{ background: formState.heroBgColor, padding: '32px 24px 48px', color: formState.heroTextColor }}>
                        <h1 style={{ fontSize: `calc(${formState.baseFontSize} * 1.6)`, fontWeight: '800', margin: '0 0 8px 0', lineHeight: 1.2 }}>{formState.welcomeText}</h1>
                        <p style={{ fontSize: formState.baseFontSize, margin: 0, opacity: 0.9 }}>{formState.welcomeSubtext}</p>
                    </div>

                    {/* Action Card */}
                    <div style={{ 
                        background: '#FFF', margin: '-24px 16px 0', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: `1px solid #E5E7EB` 
                    }}>
                        <div>
                            <div style={{ fontWeight: '800', color: formState.cardTitleColor, fontSize: formState.baseFontSize }}>{formState.startConversationText}</div>
                            <div style={{ fontSize: `calc(${formState.baseFontSize} * 0.8)`, color: formState.cardSubtitleColor }}>{formState.replyTimeText}</div>
                        </div>
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: formState.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          {/* External Launcher Preview */}
          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#9CA3AF' }}>LAUNCHER PREVIEW</span>
              <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: formState.primaryColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${formState.primaryColor}44` }}>
                {ICON_MAP[formState.launcherIcon]}
              </div>
          </div>
      </section>

      {toast && <Toast message="Settings Saved Successfully!" />}
    </div>
  );
}

// STYLED SUB-COMPONENTS
const NavButton = ({ active, label, icon, onClick }) => (
    <button onClick={onClick} style={{ 
        padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', border: 'none', textAlign: 'left',
        background: active ? '#F3F4F6' : 'transparent', color: active ? '#6366F1' : '#6B7280', 
        fontWeight: active ? '700' : '600', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' 
    }}>
      <span style={{ fontSize: '18px', filter: active ? 'none' : 'grayscale(1)' }}>{icon}</span> {label}
    </button>
);

const Card = ({ title, children }) => (
    <section style={{ background: '#FFF', padding: '32px', borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', marginBottom: '24px' }}>{title}</h3>
      {children}
    </section>
);

const IconButton = ({ children, active, onClick }) => (
    <button onClick={onClick} style={{ 
        width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
        border: active ? '2px solid #6366F1' : '1px solid #E5E7EB', background: active ? '#EEF2FF' : '#FFF', color: active ? '#6366F1' : '#9CA3AF',
        transition: 'all 0.2s'
    }}>
      {children}
    </button>
);

const ColorBox = ({ label, value, onChange }) => (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '700', marginBottom: '10px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FFF', padding: '6px 12px', borderRadius: '12px', border: '1px solid #D1D5DB' }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ border: 'none', background: 'none', width: '32px', height: '32px', cursor: 'pointer', borderRadius: '6px' }} />
        <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace', color: '#374151' }}>{value?.toUpperCase()}</span>
      </div>
    </div>
);

const Field = ({ label, value, onChange }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '700', marginBottom: '10px' }}>{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} 
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }} 
      />
    </div>
);

const AreaField = ({ label, value, onChange }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: '#374151', fontWeight: '700', marginBottom: '10px' }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} 
        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #D1D5DB', fontSize: '15px', minHeight: '100px', outline: 'none', resize: 'vertical' }} 
      />
    </div>
);