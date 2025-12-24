import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const settings = await db.chatSettings.findUnique({ 
    where: { shop: session.shop } 
  });
  
  // Default values provide karein agar DB khali ho
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat Widget Settings</h1>
            <p className="text-gray-600">Customize how your chat widget looks on your storefront.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-all ${
              isSaving ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form Settings */}
          <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            
            <section>
              <h2 className="text-lg font-semibold mb-4 border-bottom pb-2">Appearance & Colors</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Action Color (Hex)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={formState.primaryColor} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={formState.primaryColor} 
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Background Color</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={formState.headerBgColor} 
                      onChange={(e) => handleChange("headerBgColor", e.target.value)}
                      className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={formState.headerBgColor} 
                      onChange={(e) => handleChange("headerBgColor", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md px-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-4">
              <h2 className="text-lg font-semibold mb-4">Content & Text</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Header Title</label>
                  <input 
                    type="text" 
                    value={formState.headerTitle} 
                    onChange={(e) => handleChange("headerTitle", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Text (H1)</label>
                  <input 
                    type="text" 
                    value={formState.welcomeText} 
                    onChange={(e) => handleChange("welcomeText", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Subtext</label>
                  <textarea 
                    value={formState.welcomeSubtext} 
                    onChange={(e) => handleChange("welcomeSubtext", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Title</label>
                  <input 
                    type="text" 
                    value={formState.startConversationText} 
                    onChange={(e) => handleChange("startConversationText", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Image URL</label>
                  <input 
                    type="text" 
                    value={formState.welcomeImg} 
                    onChange={(e) => handleChange("welcomeImg", e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500"
                  />
                </div>
              </div>
            </section>Section
          </div>

          {/* Real-time Preview */}
          <div className="sticky top-8 h-fit">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Live Preview</h2>
            <div className="bg-gray-200 p-8 rounded-xl flex justify-center border-4 border-dashed border-gray-300">
               {/* Mockup Widget */}
               <div className="w-[300px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                  <div style={{ background: formState.headerBgColor }} className="p-4 flex items-center gap-3 text-white">
                    <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 overflow-hidden">
                        <img src={formState.welcomeImg} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="text-sm font-bold">{formState.headerTitle}</div>
                        <div className="text-xs opacity-80">Online now</div>
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{formState.welcomeText}</h3>
                    <p className="text-xs text-gray-600 mb-4">{formState.welcomeSubtext}</p>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-gray-800 flex justify-between items-center">
                        <span className="text-sm font-bold">Send us a message</span>
                        <div style={{ background: formState.primaryColor }} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]">→</div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex gap-4 justify-center bg-white">
                    <div style={{ color: formState.primaryColor }} className="text-[10px] font-bold">Home</div>
                    <div className="text-[10px] font-bold text-gray-400">Messages</div>
                  </div>
               </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-4 italic">Note: This is a simplified preview. Save to see changes on storefront.</p>
          </div>
        </div>
      </div>
    </div>
  );
}