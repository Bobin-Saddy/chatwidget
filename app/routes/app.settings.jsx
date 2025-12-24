import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server"; // Match with your example: use { db }

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  // Database se settings fetch karein
  const settings = await db.chatSettings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  // Default values agar DB mein data na ho
  return json(settings || {
    primaryColor: "#6366f1",
    headerBgColor: "#384959",
    welcomeImg: "https://ui-avatars.com/api/?name=Support",
    headerTitle: "Live Support",
    headerSubtitle: "Online now",
    welcomeText: "Hi there 👋",
    welcomeSubtext: "We are here to help you!",
    startConversationText: "Start a conversation"
  });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  // Database mein save ya update (Upsert)
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

  const handleSave = () => {
    const formData = new FormData();
    Object.keys(formState).forEach(key => {
        formData.append(key, formState[key]);
    });
    submit(formData, { method: "POST" });
  };

  return (
    <div className="min-h-screen bg-[#fdfaf5] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-center border-b border-[#f1ece4] pb-6">
          <div>
            <h1 className="text-3xl font-black text-[#433d3c]">Widget Customization</h1>
            <p className="text-[#a8a29e] font-medium mt-1">Personalize your chat experience for {settings.shop}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all transform active:scale-95 ${
              isSaving ? "bg-[#c2b9af] cursor-not-allowed" : "bg-[#8b5e3c] hover:bg-[#704a2f]"
            }`}
          >
            {isSaving ? "Syncing..." : "Save Settings"}
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Settings Panels */}
          <div className="flex-1 space-y-8">
            <div className="bg-white p-8 rounded-[30px] shadow-sm border border-[#f1ece4]">
              <h2 className="text-sm font-black text-[#8b5e3c] uppercase tracking-widest mb-6">Visual Identity</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Brand Accent Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={formState.primaryColor} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="h-12 w-12 rounded-xl border-none cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={formState.primaryColor} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="flex-1 bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#8b5e3c] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Header Theme</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={formState.headerBgColor} 
                      onChange={(e) => handleChange("headerBgColor", e.target.value)}
                      className="h-12 w-12 rounded-xl border-none cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={formState.headerBgColor} 
                      onChange={(e) => handleChange("headerBgColor", e.target.value)}
                      className="flex-1 bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-[#8b5e3c] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[30px] shadow-sm border border-[#f1ece4]">
              <h2 className="text-sm font-black text-[#8b5e3c] uppercase tracking-widest mb-6">Messaging Content</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Widget Title</label>
                  <input 
                    type="text" 
                    value={formState.headerTitle} 
                    onChange={(e) => handleChange("headerTitle", e.target.value)}
                    className="w-full bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#8b5e3c] outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Welcome Headline</label>
                        <input 
                        type="text" 
                        value={formState.welcomeText} 
                        onChange={(e) => handleChange("welcomeText", e.target.value)}
                        className="w-full bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Welcome Image URL</label>
                        <input 
                        type="text" 
                        value={formState.welcomeImg} 
                        onChange={(e) => handleChange("welcomeImg", e.target.value)}
                        className="w-full bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 py-3 text-sm font-bold outline-none"
                        />
                    </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#433d3c] mb-2 uppercase">Welcome Subtext</label>
                  <textarea 
                    value={formState.welcomeSubtext} 
                    onChange={(e) => handleChange("welcomeSubtext", e.target.value)}
                    className="w-full bg-[#fdfaf5] border border-[#f1ece4] rounded-xl px-4 py-3 text-sm font-bold outline-none h-24 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Device Preview */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-8">
                <div className="text-center mb-4">
                    <span className="text-[10px] font-black text-[#c2b9af] uppercase tracking-[3px]">Live Mobile Preview</span>
                </div>
                <div className="bg-[#433d3c] p-4 rounded-[50px] shadow-2xl border-[8px] border-[#1a1a1a]">
                    <div className="bg-white rounded-[35px] h-[550px] overflow-hidden flex flex-col relative">
                        {/* Mock Widget Header */}
                        <div style={{ background: formState.headerBgColor }} className="p-5 flex items-center gap-3">
                            <img src={formState.welcomeImg} className="w-10 h-10 rounded-full border-2 border-white/20" alt="avatar" />
                            <div>
                                <div className="text-white text-sm font-black leading-tight">{formState.headerTitle}</div>
                                <div className="text-white/70 text-[10px] font-bold">Online Now</div>
                            </div>
                        </div>
                        {/* Mock Widget Body */}
                        <div className="flex-1 bg-[#fdfaf5] p-6">
                            <div className="mb-6">
                                <h3 className="text-2xl font-black text-[#433d3c] leading-tight">{formState.welcomeText}</h3>
                                <p className="text-[#78716c] text-xs font-bold mt-2 leading-relaxed">{formState.welcomeSubtext}</p>
                            </div>
                            <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#f1ece4] flex justify-between items-center mb-4">
                                <div>
                                    <div className="text-[#433d3c] text-sm font-black">Send a message</div>
                                    <div className="text-[#a8a29e] text-[10px] font-bold">Replies in 5 mins</div>
                                </div>
                                <div style={{ background: formState.primaryColor }} className="w-8 h-8 rounded-full flex items-center justify-center text-white">→</div>
                            </div>
                        </div>
                        {/* Mock Widget Nav */}
                        <div className="p-4 bg-white border-t border-[#f1ece4] flex justify-around">
                            <div style={{ color: formState.primaryColor }} className="text-[10px] font-black uppercase">Home</div>
                            <div className="text-[10px] font-black uppercase text-[#c2b9af]">Inbox</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}