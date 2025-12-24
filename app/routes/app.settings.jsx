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
    headerBgColor: "#1a1a1a",
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

export default function ArtisanStudio() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const [activeTab, setActiveTab] = useState('palette');
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

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f9f6f2', 
      color: '#2d2a29', fontFamily: '"Plus Jakarta Sans", sans-serif', overflow: 'hidden' 
    }}>
      
      {/* 1. MINIMALIST SIDEBAR */}
      <div style={{ 
        width: '100px', background: '#fff', borderRight: '1px solid #e8e3dd',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0'
      }}>
        <div style={{ width: '40px', height: '40px', background: '#8b5e3c', borderRadius: '12px', marginBottom: '50px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <SidebarIcon icon="🎨" active={activeTab === 'palette'} onClick={() => setActiveTab('palette')} />
          <SidebarIcon icon="💬" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
        </div>
        <div style={{ marginTop: 'auto' }}>
           <button onClick={handleSave} style={{ 
             width: '50px', height: '50px', borderRadius: '50%', border: 'none', 
             background: isSaving ? '#e8e3dd' : '#2d2a29', color: '#fff', cursor: 'pointer',
             boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: '0.3s'
           }}>
             {isSaving ? '...' : '✓'}
           </button>
        </div>
      </div>

      {/* 2. CONFIGURATION WORKSPACE */}
      <div style={{ flex: 1, padding: '80px 100px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <header style={{ marginBottom: '60px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#8b5e3c', letterSpacing: '2px' }}>STUDIO v2.0</span>
            <h1 style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-1.5px', margin: '10px 0' }}>Widget Architect</h1>
            <p style={{ color: '#8b847e', fontSize: '16px' }}>Craft a unique conversation experience for your brand.</p>
          </header>

          {activeTab === 'palette' ? (
            <section style={{ animation: 'fadeIn 0.5s ease' }}>
              <SectionTitle>Visual Identity</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <LuxuryInput label="Brand Accent" type="color" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <LuxuryInput label="Header Canvas" type="color" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
              </div>
            </section>
          ) : (
            <section style={{ animation: 'fadeIn 0.5s ease' }}>
              <SectionTitle>Messaging Strategy</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <LuxuryInput label="Concierge Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                <LuxuryInput label="Welcome Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                <LuxuryInput label="Support Avatar URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
                <LuxuryInput label="Subtext Description" area value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 3. FLOATING SIMULATOR PANEL */}
      <div style={{ width: '550px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff 0%, #f3efea 100%)' }}>
        <div style={{ 
          width: '320px', height: '640px', background: '#000', borderRadius: '50px', padding: '12px',
          boxShadow: '0 50px 100px rgba(139, 94, 60, 0.2)', border: '1px solid rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Simulator Header */}
            <div style={{ background: formState.headerBgColor, padding: '45px 25px 25px', color: '#fff', transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={formState.welcomeImg} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div className="status-pulse"></div>
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px' }}>{formState.headerTitle}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>Live Support</div>
                </div>
              </div>
            </div>

            {/* Simulator Content */}
            <div style={{ flex: 1, padding: '30px', background: '#fdfaf5' }}>
              <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#2d2a29', marginBottom: '15px', lineHeight: '1.2' }}>{formState.welcomeText}</h2>
              <p style={{ fontSize: '14px', color: '#8b847e', lineHeight: '1.6' }}>{formState.welcomeSubtext}</p>
              
              <div style={{ 
                marginTop: '40px', padding: '20px', background: '#fff', borderRadius: '24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #eee',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '800' }}>Start Chat</span>
                <div style={{ background: formState.primaryColor, width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>→</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animations & Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .status-pulse {
          position: absolute; bottom: 0; right: 0; width: 10px; height: 10px;
          background: #4ade80; border: 2px solid #fff; border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
      `}} />

      {/* Success Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#2d2a29', color: '#fff', padding: '16px 32px', borderRadius: '100px',
          fontWeight: '800', fontSize: '13px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000
        }}>
          Workspace Published Successfully
        </div>
      )}
    </div>
  );
}

// Sub-Components
function SidebarIcon({ icon, active, onClick }) {
  return (
    <div onClick={onClick} style={{ 
      width: '50px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '20px', cursor: 'pointer', transition: '0.3s',
      background: active ? '#fdfaf5' : 'transparent',
      boxShadow: active ? 'inset 0 0 0 1px #e8e3dd' : 'none',
      filter: active ? 'none' : 'grayscale(1)'
    }}>{icon}</div>
  );
}

function SectionTitle({ children }) {
  return <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#8b5e3c', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '30px' }}>{children}</h3>;
}

function LuxuryInput({ label, value, type = "text", area = false, onChange }) {
  const inputBase = {
    width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e8e3dd',
    background: '#fff', color: '#2d2a29', fontWeight: '700', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: '0.2s'
  };

  return (
    <div style={{ flex: 1, marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#a8a29e', marginBottom: '10px' }}>{label}</label>
      {type === 'color' ? (
        <div style={{ display: 'flex', gap: '15px' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '54px', height: '54px', border: 'none', borderRadius: '12px', background: 'none', cursor: 'pointer' }} />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputBase} />
        </div>
      ) : area ? (
        <textarea rows="4" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, resize: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={inputBase} />
      )}
    </div>
  );
}