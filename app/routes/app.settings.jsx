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
      
      {/* 1. MINIMALIST NAVIGATION RAIL */}
      <div style={{ 
        width: '100px', background: '#fff', borderRight: '1px solid #e8e3dd',
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0'
      }}>
        <div style={{ width: '40px', height: '40px', background: '#8b5e3c', borderRadius: '12px', marginBottom: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>A</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <SidebarIcon icon="🎨" active={activeTab === 'palette'} onClick={() => setActiveTab('palette')} />
          <SidebarIcon icon="💬" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
        </div>
        <div style={{ marginTop: 'auto' }}>
           <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ 
             width: '56px', height: '56px', borderRadius: '50%', border: 'none', 
             background: isSaving ? '#e8e3dd' : '#2d2a29', color: '#fff', cursor: 'pointer',
             boxShadow: '0 10px 25px rgba(0,0,0,0.15)', transition: '0.3s transform',
             transform: isSaving ? 'scale(0.9)' : 'scale(1)'
           }}>
             {isSaving ? '...' : 'Save'}
           </button>
        </div>
      </div>

      {/* 2. CENTER WORKSPACE (Focus Mode) */}
      <div style={{ flex: 1, padding: '80px 120px', overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <header style={{ marginBottom: '64px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#8b5e3c', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Studio Configuration</div>
            <h1 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', margin: 0, lineHeight: 1 }}>{activeTab === 'palette' ? 'Visual DNA' : 'Messaging'}</h1>
            <p style={{ color: '#8b847e', fontSize: '18px', marginTop: '15px', fontWeight: '500' }}>Refine the aesthetic soul of your customer concierge.</p>
          </header>

          <div style={{ animation: 'slideUp 0.6s ease-out' }}>
            {activeTab === 'palette' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <LuxuryInput label="Brand Accent" type="color" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                <LuxuryInput label="Header Theme" type="color" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <LuxuryInput label="Concierge Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                <LuxuryInput label="Greeting Headline" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                <LuxuryInput label="Avatar Image URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
                <LuxuryInput label="Welcome Subtext" area value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. THE IMMERSIVE SIMULATOR */}
      <div style={{ width: '580px', background: 'linear-gradient(145deg, #ffffff 0%, #f3f0ec 100%)', borderLeft: '1px solid #e8e3dd', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '40px', textAlign: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#c2b9af', letterSpacing: '4px' }}>LIVE PREVIEW</span>
        </div>

        {/* 3D-Look Device */}
        <div style={{ 
          width: '330px', height: '670px', background: '#1a1a1a', borderRadius: '54px', padding: '14px',
          boxShadow: '0 50px 100px rgba(139, 94, 60, 0.25), 0 10px 20px rgba(0,0,0,0.1)', 
          border: '1px solid #2d2a29', transform: 'perspective(1200px) rotateY(-8deg) rotateX(2deg)',
          transition: '0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          <div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: '42px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
             
             {/* Dynamic Header */}
             <div style={{ background: formState.headerBgColor, padding: '50px 25px 30px', color: '#fff', transition: '0.5s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <div style={{ position: 'relative' }}>
                    <img src={formState.welcomeImg} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                    <div className="live-status-dot"></div>
                   </div>
                   <div>
                    <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '-0.5px' }}>{formState.headerTitle}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '700' }}>Active Now</div>
                   </div>
                </div>
             </div>

             {/* Message Body */}
             <div style={{ flex: 1, padding: '35px 30px', background: '#fdfaf5', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '30px', fontWeight: '900', color: '#2d2a29', margin: '0 0 15px 0', lineHeight: 1.1, letterSpacing: '-1px' }}>{formState.welcomeText}</h3>
                <p style={{ fontSize: '15px', color: '#78716c', fontWeight: '500', lineHeight: 1.6, margin: 0 }}>{formState.welcomeSubtext}</p>
                
                <div style={{ 
                  marginTop: 'auto', background: '#fff', padding: '22px', borderRadius: '24px', 
                  boxShadow: '0 15px 35px rgba(0,0,0,0.04)', border: '1px solid #f1ece4',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#2d2a29' }}>Message concierge...</span>
                  <div style={{ background: formState.primaryColor, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}>→</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .live-status-dot {
          position: absolute; bottom: 2px; right: 2px; width: 12px; height: 12px;
          background: #4ade80; border: 3px solid #fff; border-radius: 50%;
          animation: statusPulse 2s infinite;
        }
        @keyframes statusPulse { 
          0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
          100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
      `}} />

      {showToast && (
        <div style={{ position: 'fixed', bottom: '40px', left: '140px', background: '#2d2a29', color: '#fff', padding: '16px 32px', borderRadius: '16px', fontWeight: '800', fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.4s ease-out' }}>
          ✓ Changes Synchronized
        </div>
      )}
    </div>
  );
}

// Artisan UI Components
function SidebarIcon({ icon, active, onClick }) {
  return (
    <div onClick={onClick} style={{ 
      width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '22px', cursor: 'pointer', transition: '0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      background: active ? '#fdfaf5' : 'transparent',
      boxShadow: active ? '0 10px 20px rgba(139, 94, 60, 0.08), inset 0 0 0 1px #e8e3dd' : 'none',
      transform: active ? 'scale(1.1)' : 'scale(1)'
    }}>{icon}</div>
  );
}

function LuxuryInput({ label, value, type = "text", area = false, onChange }) {
  const commonStyle = {
    width: '100%', padding: '18px 24px', borderRadius: '20px', border: '1px solid #e8e3dd',
    background: '#fff', color: '#2d2a29', fontWeight: '700', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', transition: '0.3s'
  };
  
  return (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#a8a29e', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</label>
      {type === 'color' ? (
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '60px', height: '60px', border: '4px solid #fff', borderRadius: '18px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
        </div>
      ) : area ? (
        <textarea rows="5" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...commonStyle, resize: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={commonStyle} />
      )}
    </div>
  );
}