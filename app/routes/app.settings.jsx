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

export default function ArtisanStudioV3() {
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
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#fcfaf7', 
      color: '#2d2a29', fontFamily: '"Plus Jakarta Sans", sans-serif', overflow: 'hidden' 
    }}>
      
      {/* 1. GLASS NAVIGATION RAIL */}
      <div style={{ 
        width: '90px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', padding: '40px 0', zIndex: 10
      }}>
        <div style={{ 
            width: '44px', height: '44px', background: 'linear-gradient(135deg, #8b5e3c, #5d3f28)', 
            borderRadius: '14px', marginBottom: '50px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', color: '#fff', fontSize: '20px', fontWeight: '900',
            boxShadow: '0 10px 20px rgba(139, 94, 60, 0.3)'
        }}>A</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <SidebarIcon icon="🎨" active={activeTab === 'palette'} onClick={() => setActiveTab('palette')} />
          <SidebarIcon icon="✍️" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
        </div>

        <div style={{ marginTop: 'auto' }}>
           <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="save-btn"
            style={{ 
             width: '54px', height: '54px', borderRadius: '50%', border: 'none', 
             background: isSaving ? '#d1ccc5' : '#1a1a1a', color: '#fff', cursor: 'pointer',
             boxShadow: '0 15px 30px rgba(0,0,0,0.2)', transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
           }}>
             {isSaving ? '...' : 'Save'}
           </button>
        </div>
      </div>

      {/* 2. MAIN CONFIGURATION CANVAS */}
      <div style={{ flex: 1, padding: '80px 10%', overflowY: 'auto', position: 'relative' }}>
        <div style={{ maxWidth: '720px' }}>
          <header style={{ marginBottom: '60px', animation: 'fadeIn 0.8s ease-out' }}>
            <h1 style={{ fontSize: '56px', fontWeight: '900', letterSpacing: '-3px', margin: 0, color: '#1a1a1a' }}>
              Studio <span style={{ color: '#8b5e3c', opacity: 0.4 }}>/</span> {activeTab === 'palette' ? 'Visuals' : 'Voice'}
            </h1>
            <p style={{ color: '#8b847e', fontSize: '18px', marginTop: '12px', fontWeight: '500' }}>
              Precision tools for the modern digital artisan.
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {activeTab === 'palette' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <LuxuryCard label="ACCENT COLOR" description="The primary brand soul.">
                    <ColorInput value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
                </LuxuryCard>
                <LuxuryCard label="HEADER CANVAS" description="Background for the top bar.">
                    <ColorInput value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
                </LuxuryCard>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                 <LuxuryInput label="Identity URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
                 <LuxuryInput label="Concierge Name" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                 <LuxuryInput label="Greeting Title" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                 <LuxuryInput label="Introductory Subtext" area value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. SIMULATOR PREVIEW (Right Panel) */}
      <div style={{ width: '540px', background: '#fff', borderLeft: '1px solid #f1ece4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="simulator-frame">
          <div className="phone-body">
             <div className="notch"></div>
             
             <div style={{ background: formState.headerBgColor, padding: '45px 25px 30px', color: '#fff', transition: '0.6s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <div style={{ position: 'relative' }}>
                    <img src={formState.welcomeImg} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} />
                    <div className="status-dot"></div>
                   </div>
                   <div>
                    <div style={{ fontWeight: '900', fontSize: '18px' }}>{formState.headerTitle}</div>
                    <div style={{ fontSize: '11px', opacity: 0.7, fontWeight: '700' }}>Active Support</div>
                   </div>
                </div>
             </div>

             <div style={{ flex: 1, padding: '40px 30px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#1a1a1a', lineHeight: 1.1, margin: '0 0 16px 0', letterSpacing: '-1px' }}>{formState.welcomeText}</h2>
                <p style={{ fontSize: '16px', color: '#78716c', fontWeight: '500', lineHeight: 1.6 }}>{formState.welcomeSubtext}</p>
                
                <div style={{ 
                  marginTop: 'auto', background: '#fcfaf7', padding: '22px', borderRadius: '24px', 
                  border: '1px solid #f1ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '800', fontSize: '14px', color: '#d1ccc5' }}>Start typing...</span>
                  <div style={{ background: formState.primaryColor, width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 15px rgba(0,0,0,0.1)' }}>→</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .save-btn:hover { transform: translateY(-3px) scale(1.05); }
        .save-btn:active { transform: scale(0.95); }

        .simulator-frame {
          width: 320px; height: 660px; background: #000; border-radius: 54px; padding: 12px;
          box-shadow: 0 40px 100px rgba(139, 94, 60, 0.15);
          transform: perspective(1000px) rotateY(-10deg) rotateX(2deg);
        }
        
        .phone-body {
          background: #fff; width: 100%; height: 100%; border-radius: 42px; overflow: hidden; display: flex; flexDirection: column;
        }

        .notch {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%); 
          width: 140px; height: 30px; background: #000; border-bottom-left-radius: 18px; 
          border-bottom-right-radius: 18px; z-index: 5;
        }

        .status-dot {
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
        <div style={{ position: 'fixed', bottom: '40px', left: '130px', background: '#1a1a1a', color: '#fff', padding: '16px 32px', borderRadius: '14px', fontWeight: '800', zIndex: 100, animation: 'fadeIn 0.3s ease-out' }}>
          ✓ Published to Store
        </div>
      )}
    </div>
  );
}

// Artisan UI Atomic Components
function SidebarIcon({ icon, active, onClick }) {
  return (
    <div onClick={onClick} style={{ 
      width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '22px', cursor: 'pointer', transition: '0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      background: active ? '#fff' : 'transparent',
      boxShadow: active ? '0 10px 20px rgba(0,0,0,0.05)' : 'none',
      transform: active ? 'scale(1.1)' : 'scale(1)',
      opacity: active ? 1 : 0.4
    }}>{icon}</div>
  );
}

function LuxuryCard({ label, description, children }) {
  return (
    <div style={{ 
        background: '#fff', padding: '30px', borderRadius: '24px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)' 
    }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#8b5e3c', letterSpacing: '2px', marginBottom: '4px' }}>{label}</label>
      <p style={{ fontSize: '12px', color: '#a8a29e', margin: '0 0 20px 0', fontWeight: '500' }}>{description}</p>
      {children}
    </div>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '48px', height: '48px', border: 'none', borderRadius: '12px', cursor: 'pointer', padding: 0 }} />
      <span style={{ fontWeight: '800', fontSize: '14px', color: '#1a1a1a' }}>{value.toUpperCase()}</span>
    </div>
  );
}

function LuxuryInput({ label, value, area = false, onChange }) {
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.03)' }}>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#8b5e3c', letterSpacing: '2px', marginBottom: '12px' }}>{label}</label>
      {area ? (
        <textarea rows="4" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', border: 'none', background: '#fcfaf7', borderRadius: '14px', padding: '16px', fontWeight: '700', fontSize: '15px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', border: 'none', background: '#fcfaf7', borderRadius: '14px', padding: '16px', fontWeight: '700', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }} />
      )}
    </div>
  );
}