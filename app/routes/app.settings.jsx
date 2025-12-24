import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#8b5e3c",
    headerBgColor: "#2d2a29",
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=8b5e3c&color=fff",
    headerTitle: "Concierge",
    welcomeText: "At your service",
    welcomeSubtext: "How can we assist your journey today?",
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

export default function EliteArtisanSettings() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const [activeSection, setActiveSection] = useState('palette'); // palette, content, behavior
  const [showToast, setShowToast] = useState(false);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "loading" && navigation.formData) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [navigation.state]);

  const handleChange = (f, v) => setFormState(prev => ({ ...prev, [f]: v }));
  const handleSave = () => {
    const fd = new FormData();
    Object.keys(formState).forEach(k => fd.append(k, formState[k]));
    submit(fd, { method: "POST" });
  };

  const menuItems = [
    { id: 'palette', label: 'Visual Palette', icon: '🎨' },
    { id: 'content', label: 'Messaging', icon: '✍️' },
    { id: 'behavior', label: 'Logic & Flow', icon: '⚙️' },
  ];

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fdfaf5', 
      color: '#2d2a29', fontFamily: '"Plus Jakarta Sans", sans-serif', overflow: 'hidden' 
    }}>
      
      {/* PANEL 1: SIDEBAR NAVIGATION */}
      <div style={{ 
        width: '280px', borderRight: '1px solid #eeebe5', padding: '40px 20px',
        display: 'flex', flexDirection: 'column', gap: '40px', background: '#fff'
      }}>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#8b5e3c', letterSpacing: '3px', marginBottom: '8px' }}>CORE ENGINE</div>
          <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Artisan Chat</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{ 
                padding: '16px 20px', borderRadius: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '15px', fontWeight: '700',
                transition: '0.3s', fontSize: '14px',
                background: activeSection === item.id ? '#fdfaf5' : 'transparent',
                color: activeSection === item.id ? '#8b5e3c' : '#a8a29e',
                boxShadow: activeSection === item.id ? 'inset 0 0 0 1px #f1ece4' : 'none'
              }}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: '#2d2a29', color: 'white', fontWeight: '800', cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: '0.3s'
            }}
          >
            {isSaving ? "Syncing..." : "Push Updates"}
          </button>
        </div>
      </div>

      {/* PANEL 2: WORKSPACE */}
      <div style={{ flex: 1, padding: '60px', overflowY: 'auto', background: '#fdfaf5' }}>
        <header style={{ marginBottom: '50px', animation: 'fadeIn 0.6s ease' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '10px' }}>
            {menuItems.find(m => m.id === activeSection).label}
          </h2>
          <p style={{ color: '#a8a29e', fontSize: '15px', fontWeight: '500' }}>Define the character and visual soul of your concierge.</p>
        </header>

        <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {activeSection === 'palette' && (
            <>
              <ConfigCard title="Color Theory">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                  <InputGroup label="ACCENT COLOR" value={formState.primaryColor} type="color" onChange={(v) => handleChange('primaryColor', v)} />
                  <InputGroup label="HEADER THEME" value={formState.headerBgColor} type="color" onChange={(v) => handleChange('headerBgColor', v)} />
                </div>
              </ConfigCard>
            </>
          )}

          {activeSection === 'content' && (
            <>
              <ConfigCard title="Onboarding Copy">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <InputGroup label="CONCIERGE NAME" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                  <InputGroup label="GREETING HEADLINE" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                  <InputGroup label="WELCOME SUBTEXT" value={formState.welcomeSubtext} area onChange={(v) => handleChange('welcomeSubtext', v)} />
                </div>
              </ConfigCard>
              <ConfigCard title="Identity Image">
                 <InputGroup label="AVATAR URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
              </Card>
            </>
          )}
          
          {activeSection === 'behavior' && (
            <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #eeebe5', borderRadius: '30px' }}>
              <div style={{ fontSize: '30px', marginBottom: '15px' }}>⚡</div>
              <div style={{ fontWeight: '800', color: '#8b5e3c' }}>Advanced Logic Coming Soon</div>
              <div style={{ fontSize: '13px', color: '#a8a29e', marginTop: '5px' }}>AI-driven responses and triggers are in development.</div>
            </div>
          )}
        </div>
      </div>

      {/* PANEL 3: IMMERSIVE SIMULATOR */}
      <div style={{ width: '500px', background: '#fff', borderLeft: '1px solid #eeebe5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: '900', color: '#c2b9af', letterSpacing: '2px' }}>VIRTUAL ENVIRONMENT</div>
        </div>

        {/* 3D-ish Phone Preview */}
        <div style={{ 
          width: '320px', height: '640px', background: '#000', borderRadius: '55px', padding: '12px',
          boxShadow: '0 40px 80px rgba(139, 94, 60, 0.15)', border: '1px solid #2d2a29',
          transform: 'perspective(1000px) rotateY(-5deg)', transition: '0.5s ease'
        }}>
          <div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: '43px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
             {/* Notch */}
             <div style={{ height: '25px', background: '#000', width: '120px', margin: '0 auto', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px' }}></div>
             
             {/* Widget Header */}
             <div style={{ background: formState.headerBgColor, padding: '30px 25px 20px', color: '#fff', transition: '0.4s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                   <div style={{ position: 'relative' }}>
                    <img src={formState.welcomeImg} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                    <div className="pulse-dot"></div>
                   </div>
                   <div>
                    <div style={{ fontWeight: '800', fontSize: '16px' }}>{formState.headerTitle}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: '700' }}>Typically replies in minutes</div>
                   </div>
                </div>
             </div>

             {/* Widget Body */}
             <div style={{ flex: 1, padding: '30px', background: '#fdfaf5', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <h3 style={{ fontSize: '26px', fontWeight: '900', lineHeight: '1.1', color: '#2d2a29', margin: '0 0 10px 0' }}>{formState.welcomeText}</h3>
                  <p style={{ fontSize: '14px', color: '#78716c', fontWeight: '500', lineHeight: '1.5' }}>{formState.welcomeSubtext}</p>
                </div>
                
                <div style={{ 
                  marginTop: 'auto', background: '#fff', padding: '20px', borderRadius: '20px', 
                  border: '1px solid #f1ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '800', fontSize: '13px' }}>Ask a question...</span>
                  <div style={{ background: formState.primaryColor, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>→</div>
                </div>
             </div>

             {/* Footer Nav */}
             <div style={{ height: '70px', borderTop: '1px solid #f1ece4', display: 'flex', justifyContent: 'center', gap: '40px', alignItems: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: '900', color: formState.primaryColor }}>HOME</div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#c2b9af' }}>HELP</div>
             </div>
          </div>
        </div>
      </div>

      {/* Global Aesthetics */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-dot {
          position: absolute; bottom: 2px; right: 2px; width: 10px; height: 10px;
          background: #4ade80; border-radius: 50%; border: 2px solid #fff;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); } 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); } }
      `}} />

      {/* Instant Success Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', bottom: '40px', right: '40px', background: '#2d2a29', color: '#fff', 
          padding: '15px 30px', borderRadius: '20px', fontWeight: '800', fontSize: '13px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999
        }}>
          <span style={{ color: '#4ade80' }}>●</span> Configuration Synchronized
        </div>
      )}
    </div>
  );
}

// Artisan UI Components
function ConfigCard({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: '30px', padding: '35px', border: '1px solid #eeebe5', boxShadow: '0 4px 15px rgba(139, 94, 60, 0.02)' }}>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#8b5e3c', letterSpacing: '2px', marginBottom: '25px', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function InputGroup({ label, value, type = "text", area = false, onChange }) {
  const commonStyle = {
    width: '100%', padding: '15px', borderRadius: '14px', border: '1px solid #f1ece4',
    background: '#fdfaf5', color: '#2d2a29', fontWeight: '700', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box'
  };
  
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#a8a29e', marginBottom: '8px', letterSpacing: '1px' }}>{label}</label>
      {type === 'color' ? (
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '10px', background: 'none', cursor: 'pointer' }} />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
        </div>
      ) : area ? (
        <textarea rows="4" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...commonStyle, resize: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
      )}
    </div>
  );
}