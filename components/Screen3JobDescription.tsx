import React, { useState } from 'react';
import { Mail, Slack, Globe, ToggleRight, ToggleLeft, Bot, GripVertical, Camera, MessageSquare } from 'lucide-react';

const Screen3JobDescription: React.FC = () => {
  const [tools, setTools] = useState({
    videoFeed: true,
    slack: true,
    browser: false,
  });

  return (
    <div className="flex items-center justify-center min-h-full bg-gray-50 p-8 font-sans">
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Configure Agent: Store Sentinel</h1>
            <p className="text-sm text-gray-500 mt-1">Define security protocols and alerts.</p>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Bot size={20} />
          </div>
        </div>

        <div className="p-8 space-y-10">
          {/* Section 1: Identity */}
          <section className="space-y-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Identity</label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Agent Name</label>
                <input 
                  type="text" 
                  defaultValue="Store Sentinel" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role Description</label>
                <input 
                  type="text" 
                  defaultValue="Monitor video footage for suspicious activities" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Instructions (SOP) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SOP / Instructions</label>
              <button className="text-xs font-medium text-purple-600 hover:text-purple-700">+ Add Step</button>
            </div>
            <div className="space-y-3">
              {[
                "Connect to Main Store CCTV Feed",
                "Detect motion during restricted hours (9 PM - 7 AM)",
                "Identify loitering near cash register",
                "Send immediate SMS alert to Chitra with clip"
              ].map((instruction, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:border-gray-300 transition-colors">
                  <div className="text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={16} />
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-500 shadow-sm">
                    {index + 1}
                  </div>
                  <input 
                    type="text" 
                    defaultValue={instruction}
                    className="flex-1 bg-transparent border-none text-sm text-gray-800 focus:ring-0 p-0"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Toolbox */}
          <section className="space-y-4">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Toolbox</label>
            <div className="grid grid-cols-3 gap-4">
              {/* Tool Card: CCTV */}
              <div className={`p-4 border rounded-xl flex items-center justify-between transition-all ${tools.videoFeed ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tools.videoFeed ? 'bg-red-50 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Camera size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Video Feed</span>
                </div>
                <button onClick={() => setTools(prev => ({...prev, videoFeed: !prev.videoFeed}))} className="text-purple-600">
                  {tools.videoFeed ? <ToggleRight size={28} fill="currentColor" className="opacity-100" /> : <ToggleLeft size={28} className="text-gray-300" />}
                </button>
              </div>

              {/* Tool Card: Slack */}
              <div className={`p-4 border rounded-xl flex items-center justify-between transition-all ${tools.slack ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tools.slack ? 'bg-orange-50 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Slack size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Alerts</span>
                </div>
                <button onClick={() => setTools(prev => ({...prev, slack: !prev.slack}))} className="text-purple-600">
                  {tools.slack ? <ToggleRight size={28} fill="currentColor" className="opacity-100" /> : <ToggleLeft size={28} className="text-gray-300" />}
                </button>
              </div>

              {/* Tool Card: Browser */}
              <div className={`p-4 border rounded-xl flex items-center justify-between transition-all ${tools.browser ? 'bg-white border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-70'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tools.browser ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Globe size={18} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Browser</span>
                </div>
                <button onClick={() => setTools(prev => ({...prev, browser: !prev.browser}))} className="text-purple-600">
                  {tools.browser ? <ToggleRight size={28} fill="currentColor" className="opacity-100" /> : <ToggleLeft size={28} className="text-gray-300" />}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button className="px-8 py-3 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
            Hire Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default Screen3JobDescription;