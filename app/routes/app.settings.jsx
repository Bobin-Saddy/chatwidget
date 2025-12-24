import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
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
    headerTitle: "Support Concierge",
    welcomeText: "Welcome back",
    welcomeSubtext: "How can we assist you today?",
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

export default function ArtisanSettings() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  
  // Local state for instant UI feedback
  const [formState, setFormState] = useState(settings);
  const [showToast, setShowToast] = useState(false);

  const isSaving = navigation.state === "submitting";

  // Instant Save Effect (Toast notification)
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

  return (
    <div style={{ 
      display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#fdfaf5', 
      padding: '40px', boxSizing: 'border-box', gap: '40px', color: '#433d3c', 
      fontFamily: '"Plus Jakarta Sans", sans-serif' 
    }}>
      
      {/* 1. CONFIGURATION COLUMN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#8b5e3c', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px' }}>Workspace / Settings</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Widget Architect</h1>
        </div>

        {/* Action Bar */}
        <div style={{ 
          background: 'white', padding: '20px 30px', borderRadius: '24px', 
          border: '1px solid #f1ece4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#a8a29e' }}>
            {isSaving ? "Syncing changes to cloud..." : "All changes are staged locally"}
          </span>
          <button 
            onClick={handleSave}
            style={{ 
              padding: '12px 30px', borderRadius: '100px', background: '#8b5e3c', color: 'white',
              border: 'none', fontWeight: '800', cursor: 'pointer', transition: '0.3s',
              boxShadow: '0 10px 20px rgba(139, 94, 60, 0.2)'
            }}
          >
            {isSaving ? "Saving..." : "Push Updates"}
          </button>
        </div>

        {/* Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Design Card */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', border: '1px solid #f1ece4' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '25px' }}>Visual DNA</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>BRAND ACCENT</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="color" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '12px', cursor: 'pointer' }} />
                            <input type="text" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', fontWeight: '700' }} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>HEADER BACKGROUND</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input type="color" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '12px', cursor: 'pointer' }} />
                            <input type="text" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', fontWeight: '700' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', border: '1px solid #f1ece4' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '25px' }}>Interface Copy</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>HEADER TITLE</label>
                            <input type="text" value={formState.headerTitle} onChange={(e) => handleChange('headerTitle', e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>AVATAR URL</label>
                            <input type="text" value={formState.welcomeImg} onChange={(e) => handleChange('welcomeImg', e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>WELCOME HEADLINE</label>
                        <input type="text" value={formState.welcomeText} onChange={(e) => handleChange('welcomeText', e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', marginBottom: '10px' }}>SUBTEXT</label>
                        <textarea rows="3" value={formState.welcomeSubtext} onChange={(e) => handleChange('welcomeSubtext', e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #f1ece4', background: '#fdfaf5', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. LIVE SIMULATOR COLUMN */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        <h4 style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Live Simulator</h4>
        
        {/* Device Wrapper */}
        <div style={{ 
            background: '#1a1a1a', padding: '12px', borderRadius: '55px', 
            border: '8px solid #433d3c', boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
            height: '600px', position: 'relative'
        }}>
            <div style={{ background: 'white', borderRadius: '40px', height: '100%', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Simulated Header */}
                <div style={{ background: formState.headerBgColor, padding: '25px 20px', display: 'flex', alignItems: 'center', gap: '15px', color: 'white' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'white', padding: '2px', boxSizing: 'border-box' }}>
                        <img src={formState.welcomeImg} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                    </div>
                    <div>
                        <div style={{ fontWeight: '900', fontSize: '16px' }}>{formState.headerTitle}</div>
                        <div style={{ fontSize: '11px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%' }}></div> Online now
                        </div>
                    </div>
                </div>

                {/* Simulated Content */}
                <div style={{ flex: 1, padding: '30px', background: '#fdfaf5' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#433d3c', margin: '0 0 10px 0', lineHeight: '1.1' }}>{formState.welcomeText}</h2>
                    <p style={{ fontSize: '14px', color: '#78716c', margin: '0 0 30px 0', lineHeight: '1.5' }}>{formState.welcomeSubtext}</p>
                    
                    <div style={{ 
                        background: 'white', padding: '20px', borderRadius: '22px', border: '1px solid #f1ece4',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
                    }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: '900' }}>Message us</div>
                            <div style={{ fontSize: '11px', color: '#a8a29e', fontWeight: '700' }}>Back in 5 mins</div>
                        </div>
                        <div style={{ background: formState.primaryColor, width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>→</div>
                    </div>
                </div>

                {/* Simulated Footer */}
                <div style={{ height: '70px', borderTop: '1px solid #f1ece4', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: formState.primaryColor }}>HOME</div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#c2b9af' }}>MESSAGES</div>
                </div>
            </div>
        </div>

        {/* System Info Panel */}
        <div style={{ padding: '25px', background: '#fff1e6', borderRadius: '25px', border: `1px solid ${formState.primaryColor}20` }}>
            <div style={{ fontSize: '10px', color: '#8b5e3c', fontWeight: '900', marginBottom: '8px', textTransform: 'uppercase' }}>Sync Status</div>
            <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#433d3c', fontWeight: '600' }}>
                {isSaving ? "Uploading manifest to Shopify server..." : "Widget is live and synchronized."}
            </div>
        </div>
      </div>

      {/* Instant Feedback Toast */}
      {showToast && (
        <div style={{ 
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: '#433d3c', color: 'white', padding: '12px 25px', borderRadius: '100px',
          fontWeight: '800', fontSize: '13px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 1000
        }}>
          ✓ Settings Synchronized Successfully
        </div>
      )}
    </div>
  );
}