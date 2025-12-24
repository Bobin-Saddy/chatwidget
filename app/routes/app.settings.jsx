import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  return json(settings || {
    primaryColor: "#8b5e3c",
    headerBgColor: "#433d3c",
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

export default function PremiumArtisanSettings() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  const [formState, setFormState] = useState(settings);
  const [activeTab, setActiveTab] = useState('design');
  const [showToast, setShowToast] = useState(false);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (navigation.state === "loading" && navigation.formData) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [navigation.state]);

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const formData = new FormData();
    Object.keys(formState).forEach(key => formData.append(key, formState[key]));
    submit(formData, { method: "POST" });
  };

  // Helper for Input Styling
  const inputStyle = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '16px',
    border: '1px solid #eeebe5',
    background: '#faf9f6',
    fontSize: '14px',
    fontWeight: '600',
    color: '#433d3c',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', backgroundColor: '#fdfaf5', 
      padding: '40px', boxSizing: 'border-box', gap: '50px', 
      fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif' 
    }}>
      
      {/* 1. LEFT CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ color: '#8b5e3c', fontSize: '12px', fontWeight: '800', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>Customization Suite</div>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#2d2a29', margin: 0, letterSpacing: '-1px' }}>Widget Architect</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              padding: '16px 40px', borderRadius: '100px', background: isSaving ? '#c2b9af' : '#2d2a29', color: 'white',
              border: 'none', fontWeight: '800', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSaving ? 'none' : '0 15px 30px rgba(45, 42, 41, 0.2)',
              transform: isSaving ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {isSaving ? "Synchronizing..." : "Publish Changes"}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '25px', borderBottom: '1px solid #eeebe5' }}>
          {['design', 'content'].map(tab => (
            <div 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                padding: '15px 5px', fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                color: activeTab === tab ? '#8b5e3c' : '#a8a29e',
                borderBottom: activeTab === tab ? '3px solid #8b5e3c' : '3px solid transparent',
                textTransform: 'uppercase', letterSpacing: '1px', transition: '0.2s'
              }}
            >
              {tab === 'design' ? 'Visual DNA' : 'Interface Copy'}
            </div>
          ))}
        </div>

        {/* Content Cards */}
        <div style={{ animation: 'fadeIn 0.5s ease' }}>
          {activeTab === 'design' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <Card title="Primary Identity">
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#a8a29e', marginBottom: '10px', display: 'block' }}>BRAND ACCENT COLOR</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="color" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '55px', height: '55px', border: '4px solid white', borderRadius: '18px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
                  <input type="text" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={inputStyle} />
                </div>
              </Card>
              <Card title="Header Canvas">
                <label style={{ fontSize: '11px', fontWeight: '800', color: '#a8a29e', marginBottom: '10px', display: 'block' }}>BACKGROUND OVERLAY</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="color" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ width: '55px', height: '55px', border: '4px solid white', borderRadius: '18px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }} />
                  <input type="text" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={inputStyle} />
                </div>
              </Card>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Card title="Header Details">
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                      <FieldLabel>WIDGET NAME</FieldLabel>
                      <input type="text" value={formState.headerTitle} onChange={(e) => handleChange('headerTitle', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <FieldLabel>AVATAR SOURCE URL</FieldLabel>
                      <input type="text" value={formState.welcomeImg} onChange={(e) => handleChange('welcomeImg', e.target.value)} style={inputStyle} />
                    </div>
                 </div>
              </Card>
              <Card title="Welcome Experience">
                 <div style={{ marginBottom: '20px' }}>
                    <FieldLabel>GREETING HEADLINE</FieldLabel>
                    <input type="text" value={formState.welcomeText} onChange={(e) => handleChange('welcomeText', e.target.value)} style={inputStyle} />
                 </div>
                 <div>
                    <FieldLabel>DESCRIPTION TEXT</FieldLabel>
                    <textarea rows="4" value={formState.welcomeSubtext} onChange={(e) => handleChange('welcomeSubtext', e.target.value)} style={{ ...inputStyle, resize: 'none' }} />
                 </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT PREVIEW AREA (The Simulator) */}
      <div style={{ width: '420px', position: 'relative' }}>
        <div style={{ position: 'sticky', top: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ background: '#f1ece4', padding: '6px 15px', borderRadius: '50px', fontSize: '10px', fontWeight: '900', color: '#8b5e3c', letterSpacing: '1px' }}>REAL-TIME SIMULATION</span>
          </div>

          {/* iPhone Frame */}
          <div style={{ 
              background: '#000', padding: '15px', borderRadius: '60px', 
              boxShadow: '0 50px 100px rgba(0,0,0,0.2)', border: '1px solid #433d3c'
          }}>
            <div style={{ background: 'white', borderRadius: '45px', height: '620px', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '25px', background: '#000', borderBottomLeftRadius: '15px', borderBottomRightRadius: '15px', zIndex: 10 }}></div>

              {/* Chat Header */}
              <div style={{ 
                background: formState.headerBgColor, 
                padding: '45px 25px 25px 25px', 
                color: 'white',
                transition: 'background 0.5s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={formState.welcomeImg} style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', objectFit: 'cover' }} alt="Avatar" />
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '18px' }}>{formState.headerTitle}</div>
                    <div style={{ fontSize: '11px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '7px', height: '7px', background: '#4ade80', borderRadius: '50%' }}></div> Expert is online
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Body */}
              <div style={{ flex: 1, padding: '30px', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 'auto' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#2d2a29', margin: '0 0 12px 0', lineHeight: '1.1', letterSpacing: '-0.5px' }}>{formState.welcomeText}</h2>
                  <p style={{ fontSize: '15px', color: '#78716c', lineHeight: '1.6', margin: 0 }}>{formState.welcomeSubtext}</p>
                </div>

                {/* Message Box Mock */}
                <div style={{ 
                  background: 'white', padding: '20px', borderRadius: '24px', 
                  boxShadow: '0 15px 40px rgba(0,0,0,0.06)', border: '1px solid #f8f7f5',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#2d2a29' }}>Direct Message</div>
                    <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: '600' }}>Active response in 2 mins</div>
                  </div>
                  <div style={{ 
                    background: formState.primaryColor, width: '40px', height: '40px', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', color: 'white', transition: 'background 0.3s ease'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              </div>

              {/* Tab Bar Mock */}
              <div style={{ height: '80px', borderTop: '1px solid #f1f0ee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: formState.primaryColor }}></div>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: formState.primaryColor, letterSpacing: '1px' }}>HOME</div>
                </div>
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#c2b9af', letterSpacing: '1px' }}>MESSAGES</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Feedback Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', bottom: '30px', left: '40px',
          background: '#2d2a29', color: 'white', padding: '16px 32px', borderRadius: '20px',
          fontWeight: '700', fontSize: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', 
          zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideUp 0.4s ease'
        }}>
          <span style={{ color: '#4ade80' }}>●</span> Cloud Sync Complete
        </div>
      )}

      {/* Custom Keyframe Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

// Sub-components for cleaner structure
function Card({ title, children }) {
  return (
    <div style={{ 
      background: 'white', padding: '32px', borderRadius: '32px', 
      border: '1px solid #eeebe5', boxShadow: '0 4px 20px rgba(139, 94, 60, 0.02)' 
    }}>
      <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#8b5e3c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '25px', borderLeft: '3px solid #8b5e3c', paddingLeft: '12px' }}>{title}</h3>
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#a8a29e', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{children}</label>;
}