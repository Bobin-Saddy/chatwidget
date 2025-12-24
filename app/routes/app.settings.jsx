import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ where: { shop: session.shop } });
  
  return json(settings || {
    primaryColor: "#d4af37", // Artisan Gold
    headerBgColor: "#121212", // Deep Charcoal
    welcomeImg: "https://ui-avatars.com/api/?name=Support&background=d4af37&color=fff",
    headerTitle: "Maison Concierge",
    welcomeText: "Experience Excellence",
    welcomeSubtext: "How may we curate your experience today?",
    startConversationText: "Begin Conversation"
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

export default function ArtisanStudioFinal() {
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
      display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#faf9f6', 
      color: '#1a1a1a', fontFamily: '"Cormorant Garamond", serif', overflow: 'hidden' 
    }}>
      
      {/* 1. FLOATING SIDEBAR (GLASSMORPHISM) */}
      <div style={{ 
        width: '110px', display: 'flex', flexDirection: 'column', alignItems: 'center', 
        padding: '40px 0', borderRight: '1px solid rgba(212, 175, 55, 0.15)',
        background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(15px)', zIndex: 10
      }}>
        <div style={{ 
            width: '50px', height: '50px', background: '#1a1a1a', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37',
            fontSize: '24px', fontWeight: '300', marginBottom: '60px', border: '1px solid #d4af37'
        }}>A</div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <NavIcon icon="✧" active={activeTab === 'palette'} onClick={() => setActiveTab('palette')} />
          <NavIcon icon="✎" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
        </nav>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          style={{ 
            marginTop: 'auto', width: '60px', height: '60px', borderRadius: '50%',
            background: isSaving ? '#e0e0e0' : '#1a1a1a', color: '#d4af37', border: 'none',
            cursor: 'pointer', transition: '0.5s cubic-bezier(0.19, 1, 0.22, 1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}
        >
          {isSaving ? "..." : "Save"}
        </button>
      </div>

      {/* 2. THE CURATED WORKSPACE */}
      <div style={{ flex: 1, padding: '100px 10%', overflowY: 'auto' }}>
        <header style={{ marginBottom: '80px', animation: 'fadeIn 1s ease' }}>
          <span style={{ fontSize: '10px', letterSpacing: '5px', color: '#d4af37', fontWeight: '800', textTransform: 'uppercase' }}>Precision Interface</span>
          <h1 style={{ fontSize: '64px', fontWeight: '300', margin: '15px 0', letterSpacing: '-2px', fontFamily: '"Playfair Display", serif' }}>
            {activeTab === 'palette' ? 'Visual Soul' : 'Brand Voice'}
          </h1>
          <div style={{ width: '40px', height: '2px', background: '#d4af37' }}></div>
        </header>

        <div style={{ maxWidth: '800px', display: 'grid', gridTemplateColumns: '1fr', gap: '50px' }}>
          {activeTab === 'palette' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <ArtisanInput label="Accent Hue" type="color" value={formState.primaryColor} onChange={(v) => handleChange('primaryColor', v)} />
              <ArtisanInput label="Header Depth" type="color" value={formState.headerBgColor} onChange={(v) => handleChange('headerBgColor', v)} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <ArtisanInput label="Concierge Title" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
              <ArtisanInput label="Lead Greeting" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
              <ArtisanInput label="Manifesto/Bio" area value={formState.welcomeSubtext} onChange={(v) => handleChange('welcomeSubtext', v)} />
              <ArtisanInput label="Avatar Link" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
            </div>
          )}
        </div>
      </div>

      {/* 3. THE VIRTUAL SHOWROOM (Simulator) */}
      <div style={{ width: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ 
          width: '340px', height: '680px', background: '#121212', borderRadius: '60px', padding: '15px',
          boxShadow: '40px 60px 100px rgba(212, 175, 55, 0.1)', border: '1px solid #e0e0e0',
          position: 'relative'
        }}>
          {/* Inner Phone Screen */}
          <div style={{ background: '#fff', width: '100%', height: '100%', borderRadius: '45px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '30px', background: '#000', width: '150px', margin: '0 auto', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}></div>
            
            <div style={{ background: formState.headerBgColor, padding: '50px 30px 30px', color: '#fff', transition: '0.8s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <img src={formState.welcomeImg} style={{ width: '55px', height: '55px', borderRadius: '50%', border: '1px solid #d4af37' }} />
                  <div>
                    <div style={{ fontWeight: '300', fontSize: '20px', letterSpacing: '1px' }}>{formState.headerTitle}</div>
                    <div className="status-indicator">Atelier Online</div>
                  </div>
                </div>
            </div>

            <div style={{ flex: 1, padding: '40px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
               <h3 style={{ fontSize: '36px', fontWeight: '300', marginBottom: '20px', lineHeight: 1.1, fontFamily: '"Playfair Display", serif' }}>{formState.welcomeText}</h3>
               <p style={{ fontSize: '16px', color: '#666', lineHeight: 1.8, fontStyle: 'italic' }}>{formState.welcomeSubtext}</p>
               
               <div style={{ 
                 marginTop: 'auto', background: '#faf9f6', padding: '25px', borderRadius: '0', 
                 borderBottom: `2px solid ${formState.primaryColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
               }}>
                 <span style={{ fontSize: '11px', letterSpacing: '3px', fontWeight: '800', textTransform: 'uppercase' }}>Inquire</span>
                 <div style={{ color: formState.primaryColor }}>→</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,900;1,400&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .status-indicator { font-size: 10px; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 8px; margin-top: 5px; }
        .status-indicator::before { content: ""; width: 6px; height: 6px; background: #d4af37; border-radius: 50%; display: inline-block; box-shadow: 0 0 10px #d4af37; }
      `}} />

      {showToast && (
        <div style={{ position: 'fixed', bottom: '50px', left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#d4af37', padding: '20px 40px', letterSpacing: '3px', fontSize: '12px', fontWeight: '800', border: '1px solid #d4af37', zIndex: 100 }}>
          WORK DEPLOYED
        </div>
      )}
    </div>
  );
}

// Atomic Artisan Components
function NavIcon({ icon, active, onClick }) {
  return (
    <div onClick={onClick} style={{ 
      fontSize: '28px', cursor: 'pointer', transition: '0.3s',
      color: active ? '#d4af37' : '#e0e0e0',
      transform: active ? 'scale(1.2)' : 'scale(1)'
    }}>{icon}</div>
  );
}

function ArtisanInput({ label, value, type="text", area=false, onChange }) {
  const baseStyle = {
    width: '100%', padding: '20px 0', border: 'none', borderBottom: '1px solid #e0e0e0',
    background: 'transparent', fontSize: '18px', outline: 'none', fontWeight: '300',
    transition: '0.3s', color: '#1a1a1a'
  };

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: '10px', color: '#d4af37', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</label>
      {type === 'color' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid #d4af37', padding: '2px', background: '#fff', cursor: 'pointer' }} />
          <span style={{ fontSize: '14px', letterSpacing: '2px' }}>{value.toUpperCase()}</span>
        </div>
      ) : area ? (
        <textarea rows="3" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...baseStyle, resize: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={baseStyle} />
      )}
    </div>
  );
}