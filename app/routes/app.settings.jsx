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
  const [activeSection, setActiveSection] = useState('palette');
  const [showToast, setShowToast] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

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
    { id: 'palette', label: 'Visual Palette', icon: '🎨', desc: 'Colors & themes' },
    { id: 'content', label: 'Messaging', icon: '✍️', desc: 'Text & copy' },
    { id: 'behavior', label: 'Logic & Flow', icon: '⚙️', desc: 'Advanced settings' },
  ];

  return (
    <div style={{ 
      display: 'flex', height: '100vh', width: '100vw', 
      background: 'linear-gradient(135deg, #fdfaf5 0%, #f8f4ed 100%)',
      color: '#2d2a29', fontFamily: '"Inter", "Plus Jakarta Sans", sans-serif', overflow: 'hidden',
      position: 'relative'
    }}>
      
      {/* Ambient background decoration */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(139, 94, 60, 0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', filter: 'blur(60px)'
      }}></div>
      
      {/* PANEL 1: SIDEBAR */}
      <div style={{ 
        width: '300px', backdropFilter: 'blur(20px)', 
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
        borderRight: '1px solid rgba(139, 94, 60, 0.1)',
        padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '50px',
        boxShadow: '4px 0 24px rgba(0,0,0,0.03)', position: 'relative', zIndex: 10
      }}>
        <div style={{ padding: '0 12px' }}>
          <div style={{ 
            fontSize: '9px', fontWeight: '800', color: '#8b5e3c', 
            letterSpacing: '4px', marginBottom: '12px', opacity: 0.7
          }}>CORE ENGINE</div>
          <div style={{ 
            fontSize: '26px', fontWeight: '900', letterSpacing: '-1px',
            background: 'linear-gradient(135deg, #2d2a29 0%, #8b5e3c 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Artisan Chat</div>
          <div style={{ 
            height: '3px', width: '40px', background: 'linear-gradient(90deg, #8b5e3c, transparent)',
            marginTop: '12px', borderRadius: '2px'
          }}></div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map(item => (
            <div 
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ 
                padding: '18px 20px', borderRadius: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '16px', fontWeight: '700',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: '14px',
                background: activeSection === item.id 
                  ? 'linear-gradient(135deg, #8b5e3c 0%, #6d4a2e 100%)'
                  : hoveredItem === item.id 
                    ? 'rgba(139, 94, 60, 0.08)' 
                    : 'transparent',
                color: activeSection === item.id ? '#fff' : '#6b6562',
                boxShadow: activeSection === item.id 
                  ? '0 8px 20px rgba(139, 94, 60, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : 'none',
                transform: activeSection === item.id ? 'translateX(4px) scale(1.02)' : 'translateX(0) scale(1)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: '20px', transition: 'transform 0.3s', 
                transform: hoveredItem === item.id ? 'scale(1.15) rotate(5deg)' : 'scale(1)' 
              }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div>{item.label}</div>
                <div style={{ 
                  fontSize: '10px', opacity: activeSection === item.id ? 0.9 : 0.5,
                  marginTop: '2px', fontWeight: '500'
                }}>{item.desc}</div>
              </div>
              {activeSection === item.id && (
                <div style={{
                  position: 'absolute', right: '16px', width: '4px', height: '24px',
                  background: 'rgba(255,255,255,0.4)', borderRadius: '2px'
                }}></div>
              )}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '0 4px' }}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ 
              width: '100%', padding: '18px', borderRadius: '18px', border: 'none',
              background: isSaving 
                ? 'linear-gradient(135deg, #6b6562 0%, #4a403d 100%)'
                : 'linear-gradient(135deg, #2d2a29 0%, #1a1716 100%)',
              color: 'white', fontWeight: '800', cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 12px 28px rgba(45, 42, 41, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              transition: 'all 0.3s', fontSize: '14px', letterSpacing: '0.5px',
              opacity: isSaving ? 0.7 : 1,
              transform: 'translateY(0)', position: 'relative', overflow: 'hidden'
            }}
            onMouseEnter={(e) => !isSaving && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isSaving && (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span style={{ position: 'relative', zIndex: 1 }}>
              {isSaving ? "⏳ Syncing..." : "🚀 Push Updates"}
            </span>
          </button>
        </div>
      </div>

      {/* PANEL 2: WORKSPACE */}
      <div style={{ 
        flex: 1, padding: '60px 80px', overflowY: 'auto',
        background: 'transparent', position: 'relative', zIndex: 1
      }}>
        <header style={{ marginBottom: '60px', animation: 'fadeIn 0.6s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ 
              fontSize: '32px', width: '60px', height: '60px', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(139, 94, 60, 0.1) 0%, rgba(139, 94, 60, 0.05) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 2px 8px rgba(139, 94, 60, 0.1)'
            }}>
              {menuItems.find(m => m.id === activeSection).icon}
            </div>
            <div>
              <h2 style={{ 
                fontSize: '36px', fontWeight: '900', margin: '0', letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #2d2a29 0%, #6d4a2e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                {menuItems.find(m => m.id === activeSection).label}
              </h2>
              <p style={{ color: '#a8a29e', fontSize: '15px', fontWeight: '500', margin: '4px 0 0 0' }}>
                Customize the experience for your store visitors.
              </p>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeSection === 'palette' && (
            <ConfigCard title="Color Theory" icon="🎨">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                <InputGroup label="ACCENT COLOR" value={formState.primaryColor} type="color" onChange={(v) => handleChange('primaryColor', v)} />
                <InputGroup label="HEADER THEME" value={formState.headerBgColor} type="color" onChange={(v) => handleChange('headerBgColor', v)} />
              </div>
            </ConfigCard>
          )}

          {activeSection === 'content' && (
            <>
              <ConfigCard title="Onboarding Copy" icon="📝">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <InputGroup label="CONCIERGE NAME" value={formState.headerTitle} onChange={(v) => handleChange('headerTitle', v)} />
                  <InputGroup label="GREETING HEADLINE" value={formState.welcomeText} onChange={(v) => handleChange('welcomeText', v)} />
                  <InputGroup label="WELCOME SUBTEXT" value={formState.welcomeSubtext} area onChange={(v) => handleChange('welcomeSubtext', v)} />
                </div>
              </ConfigCard>
              <ConfigCard title="Identity Image" icon="🖼️">
                <InputGroup label="AVATAR URL" value={formState.welcomeImg} onChange={(v) => handleChange('welcomeImg', v)} />
                <div style={{ 
                  marginTop: '16px', padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(139, 94, 60, 0.05)', fontSize: '12px', color: '#8b5e3c',
                  display: 'flex', gap: '8px', alignItems: 'center', fontWeight: '600'
                }}>
                  <span>💡</span> Use a square image for best results (recommended: 200x200px)
                </div>
              </ConfigCard>
            </>
          )}
          
          {activeSection === 'behavior' && (
            <div style={{ 
              padding: '60px 40px', textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
              backdropFilter: 'blur(10px)', borderRadius: '32px',
              border: '2px dashed rgba(139, 94, 60, 0.2)',
              boxShadow: '0 8px 32px rgba(139, 94, 60, 0.08)'
            }}>
              <div style={{ 
                fontSize: '48px', marginBottom: '20px',
                animation: 'pulse 2s ease-in-out infinite'
              }}>⚡</div>
              <div style={{ 
                fontWeight: '800', color: '#8b5e3c', fontSize: '20px', marginBottom: '8px'
              }}>Advanced Logic Coming Soon</div>
              <div style={{ color: '#a8a29e', fontSize: '14px', fontWeight: '500' }}>
                Workflow automation, conditional logic, and AI-powered responses
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PANEL 3: SIMULATOR */}
      <div style={{ 
        width: '520px', 
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(139, 94, 60, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px', position: 'relative', zIndex: 10,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.03)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '11px', fontWeight: '800', color: '#8b5e3c', 
            letterSpacing: '3px', marginBottom: '24px', opacity: 0.7
          }}>LIVE PREVIEW</div>
          
          <div style={{ 
            width: '340px', height: '680px', background: '#1a1a1a', borderRadius: '58px', padding: '14px',
            boxShadow: '0 50px 100px rgba(0, 0, 0, 0.3), 0 20px 40px rgba(139, 94, 60, 0.15)',
            border: '3px solid #2d2a29', position: 'relative',
            transform: 'perspective(1200px) rotateY(-8deg) rotateX(2deg)',
            transition: 'transform 0.5s ease'
          }}>
            {/* Phone buttons */}
            <div style={{
              position: 'absolute', left: '-3px', top: '120px', width: '3px', height: '50px',
              background: '#2d2a29', borderRadius: '2px 0 0 2px'
            }}></div>
            <div style={{
              position: 'absolute', left: '-3px', top: '200px', width: '3px', height: '50px',
              background: '#2d2a29', borderRadius: '2px 0 0 2px'
            }}></div>
            
            <div style={{ 
              background: '#fff', width: '100%', height: '100%', borderRadius: '46px', 
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
            }}>
              {/* Notch */}
              <div style={{ 
                height: '28px', background: '#000', width: '130px', margin: '0 auto',
                borderBottomLeftRadius: '18px', borderBottomRightRadius: '18px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}></div>
              
              {/* Header */}
              <div style={{ 
                background: `linear-gradient(135deg, ${formState.headerBgColor} 0%, ${adjustColor(formState.headerBgColor, -20)} 100%)`,
                padding: '32px 28px 24px', color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={formState.welcomeImg} 
                      style={{ 
                        width: '52px', height: '52px', borderRadius: '50%', 
                        objectFit: 'cover', border: '3px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }} 
                    />
                    <div style={{
                      position: 'absolute', bottom: '2px', right: '2px',
                      width: '12px', height: '12px', background: '#10b981',
                      borderRadius: '50%', border: '2px solid white'
                    }}></div>
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.3px' }}>
                      {formState.headerTitle}
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: '600', marginTop: '2px' }}>
                      ● Online now
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Chat area */}
              <div style={{ 
                flex: 1, padding: '32px 24px', 
                background: 'linear-gradient(180deg, #fdfaf5 0%, #f8f4ed 100%)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}>
                <div style={{
                  background: 'white', borderRadius: '24px', padding: '28px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(139, 94, 60, 0.08)'
                }}>
                  <h3 style={{ 
                    fontSize: '22px', fontWeight: '900', color: '#2d2a29', 
                    margin: '0 0 12px 0', letterSpacing: '-0.5px',
                    lineHeight: '1.2'
                  }}>
                    {formState.welcomeText}
                  </h3>
                  <p style={{ 
                    fontSize: '14px', color: '#78716c', margin: 0, 
                    lineHeight: '1.6', fontWeight: '500'
                  }}>
                    {formState.welcomeSubtext}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div style={{ 
          position: 'fixed', bottom: '48px', right: '48px', 
          background: 'linear-gradient(135deg, #2d2a29 0%, #1a1716 100%)',
          color: '#fff', padding: '18px 32px', borderRadius: '24px', 
          fontWeight: '800', zIndex: 9999, fontSize: '15px',
          boxShadow: '0 20px 40px rgba(45, 42, 41, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '12px',
          animation: 'slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <span style={{ fontSize: '20px' }}>✓</span> Changes Saved Successfully
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function ConfigCard({ title, icon, children }) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
      backdropFilter: 'blur(20px)', borderRadius: '28px', padding: '36px',
      border: '1px solid rgba(139, 94, 60, 0.12)',
      boxShadow: '0 8px 32px rgba(139, 94, 60, 0.08), 0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px'
      }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <div style={{ 
          fontSize: '12px', fontWeight: '900', color: '#8b5e3c', 
          letterSpacing: '2.5px', textTransform: 'uppercase'
        }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function InputGroup({ label, value, type = "text", area = false, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  
  const commonStyle = {
    width: '100%', padding: '16px 18px', borderRadius: '16px',
    border: `2px solid ${isFocused ? '#8b5e3c' : 'rgba(139, 94, 60, 0.12)'}`,
    background: isFocused ? '#fff' : 'rgba(253, 250, 245, 0.8)',
    color: '#2d2a29', fontWeight: '600', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', transition: 'all 0.3s ease',
    boxShadow: isFocused ? '0 4px 16px rgba(139, 94, 60, 0.15)' : '0 2px 8px rgba(0,0,0,0.02)',
    fontFamily: 'inherit'
  };
  
  return (
    <div style={{ flex: 1 }}>
      <label style={{ 
        display: 'block', fontSize: '11px', fontWeight: '800', 
        color: '#a8a29e', marginBottom: '10px', letterSpacing: '1.5px'
      }}>{label}</label>
      {type === 'color' ? (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input 
              type="color" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              style={{ 
                width: '56px', height: '56px', border: '3px solid #fff', 
                cursor: 'pointer', borderRadius: '14px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.1)'
              }} 
            />
          </div>
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ ...commonStyle, flex: 1 }} 
          />
        </div>
      ) : area ? (
        <textarea 
          rows="4" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{ ...commonStyle, resize: 'none', lineHeight: '1.6' }} 
        />
      ) : (
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={commonStyle} 
        />
      )}
    </div>
  );
}

function adjustColor(hex, percent) {
  const num = parseInt(hex.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
    (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
    .toString(16).slice(1);
}