import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  return json(settings || {
    primaryColor: "#6366f1",
    headerBgColor: "#384959",
    welcomeImg: "https://ui-avatars.com/api/?name=Support",
    headerTitle: "Live Support",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "We are here to help you!",
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

export default function SettingsPage() {
  const settings = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [formState, setFormState] = useState(settings);
  const isSaving = navigation.state === "submitting";

  const handleChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(formState).forEach(key => {
        formData.append(key, formState[key]);
    });
    submit(formData, { method: "POST" });
  };

  return (
    <div style={{ 
      backgroundColor: '#fdfaf5', 
      minHeight: '100vh', 
      padding: '40px 20px',
      fontFamily: 'system-ui, sans-serif' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '40px',
          borderBottom: '1px solid #f1ece4',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#433d3c', margin: 0 }}>Widget Customization</h1>
            <p style={{ color: '#a8a29e', fontWeight: '500', marginTop: '4px' }}>Configure your storefront chat identity</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '14px 32px',
              borderRadius: '100px',
              fontWeight: 'bold',
              border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              backgroundColor: isSaving ? '#c2b9af' : '#8b5e3c',
              color: 'white',
              boxShadow: '0 4px 12px rgba(139, 94, 60, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSaving ? "Syncing..." : "Save Settings"}
          </button>
        </div>

        {/* Main 2-Column Layout */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '40px', 
          flexWrap: 'wrap' 
        }}>
          
          {/* Column 1: Configuration Form */}
          <div style={{ flex: '1', minWidth: '350px' }}>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Visuals Card */}
              <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #f1ece4' }}>
                <h3 style={{ color: '#8b5e3c', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Visual Identity</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Accent Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }} />
                      <input type="text" value={formState.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #f1ece4', borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Header Color</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="color" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ width: '40px', height: '40px', border: 'none', cursor: 'pointer' }} />
                      <input type="text" value={formState.headerBgColor} onChange={(e) => handleChange('headerBgColor', e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #f1ece4', borderRadius: '8px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Content Card */}
              <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #f1ece4' }}>
                <h3 style={{ color: '#8b5e3c', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Messaging Content</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Header Title</label>
                    <input type="text" value={formState.headerTitle} onChange={(e) => handleChange('headerTitle', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #f1ece4', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Welcome Message</label>
                    <input type="text" value={formState.welcomeText} onChange={(e) => handleChange('welcomeText', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #f1ece4', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Subtext Description</label>
                    <textarea value={formState.welcomeSubtext} onChange={(e) => handleChange('welcomeSubtext', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #f1ece4', borderRadius: '8px', minHeight: '80px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Avatar Image URL</label>
                    <input type="text" value={formState.welcomeImg} onChange={(e) => handleChange('welcomeImg', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #f1ece4', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Column 2: The Device Preview */}
          <div style={{ width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'sticky', top: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#c2b9af', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                Live Widget Preview
              </span>
              
              {/* iPhone-style Frame */}
              <div style={{ 
                width: '320px', 
                height: '580px', 
                backgroundColor: '#433d3c', 
                borderRadius: '40px', 
                padding: '12px', 
                border: '8px solid #1a1a1a',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)' 
              }}>
                <div style={{ 
                  backgroundColor: 'white', 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '28px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  
                  {/* Widget Header */}
                  <div style={{ backgroundColor: formState.headerBgColor, padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
                    <img src={formState.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }} alt="preview-avatar" />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{formState.headerTitle}</div>
                      <div style={{ fontSize: '10px', opacity: 0.8 }}>Online Now</div>
                    </div>
                  </div>

                  {/* Widget Body */}
                  <div style={{ flex: 1, padding: '24px', backgroundColor: '#fdfaf5' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#433d3c', margin: '0 0 8px 0', lineHeight: '1.2' }}>{formState.welcomeText}</h2>
                    <p style={{ fontSize: '13px', color: '#78716c', margin: '0 0 24px 0', lineHeight: '1.5' }}>{formState.welcomeSubtext}</p>
                    
                    <div style={{ 
                      backgroundColor: 'white', 
                      padding: '16px', 
                      borderRadius: '16px', 
                      border: '1px solid #f1ece4', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#433d3c' }}>Start a conversation</span>
                      <div style={{ backgroundColor: formState.primaryColor, width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        →
                      </div>
                    </div>
                  </div>

                  {/* Widget Navigation Mock */}
                  <div style={{ height: '60px', borderTop: '1px solid #f1ece4', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: formState.primaryColor }}>HOME</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#c2b9af' }}>MESSAGES</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End Column 2 */}

        </div>
      </div>
    </div>
  );
}