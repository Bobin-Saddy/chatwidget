import React, { useState } from 'react';

export default function ArtisanChatWidget({ settings }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Fallback settings if none provided
  const s = settings || {
    primaryColor: "#8b5e3c",
    headerBgColor: "#2d3748",
    headerTitle: "Live Support",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "We are here to help you! Ask us anything or browse our services.",
    welcomeImg: "https://ui-avatars.com/api/?name=SU&background=fff&color=2d3748"
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          background: s.primaryColor, color: '#fff', border: 'none',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', cursor: 'pointer',
          fontSize: '24px', zIndex: 9999
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '30px', right: '30px',
      width: '380px', height: '600px', borderRadius: '28px',
      background: '#e0f2ff', // Light blue background from your image
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 9999, animation: 'slideUp 0.4s ease-out'
    }}>
      
      {/* 1. COMPACT HEADER */}
      <div style={{ 
        background: s.headerBgColor, padding: '25px', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={s.welcomeImg} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff' }} alt="Avatar" />
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>{s.headerTitle}</div>
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.9 }}>
              <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></span> Online now
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer' }}>✕</button>
      </div>

      {/* 2. WELCOME CONTENT */}
      <div style={{ padding: '30px 25px', flex: 1 }}>
        {/* Team Avatars */}
        <div style={{ display: 'flex', marginBottom: '20px' }}>
          {['J', 'S', 'M'].map((letter, i) => (
            <div key={i} style={{ 
              width: '45px', height: '45px', borderRadius: '50%', border: '3px solid #e0f2ff',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold', color: '#2d3748', marginLeft: i === 0 ? 0 : '-15px',
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              {letter}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', color: '#2d3748' }}>
          {s.welcomeText}
        </h2>
        <p style={{ fontSize: '15px', color: '#4a5568', lineHeight: '1.5', margin: 0 }}>
          {s.welcomeSubtext}
        </p>

        {/* 3. SEND MESSAGE CARD (Floating Style) */}
        <div style={{ 
          background: '#fff', borderRadius: '20px', padding: '20px', marginTop: '25px',
          boxShadow: '0 10px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', color: '#2d3748', marginBottom: '8px' }}>Send us a message</div>
              <div style={{ fontSize: '13px', color: '#718096' }}>We typically reply in under 5 minutes</div>
            </div>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: '#edf2ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4c51bf'
            }}>
              →
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM NAVIGATION BAR */}
      <div style={{ 
        background: '#2d3748', padding: '15px 20px', display: 'flex', gap: '10px'
      }}>
        <NavButton 
          active={activeTab === 'home'} 
          icon="🏠" 
          label="Home" 
          onClick={() => setActiveTab('home')} 
        />
        <NavButton 
          active={activeTab === 'messages'} 
          icon="💬" 
          label="Messages" 
          onClick={() => setActiveTab('messages')} 
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

function NavButton({ active, icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        padding: '10px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        transition: '0.3s',
        background: active ? '#bfdbfe' : 'transparent',
        color: active ? '#1e40af' : '#a0aec0'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{ fontSize: '10px', fontWeight: '800' }}>{label}</span>
    </button>
  );
}x