
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Clock, AlertCircle, MessageSquare, ChevronLeft, Calendar, ArrowUpRight, ArrowDownRight, User, Bot, Sparkles, CheckCircle2, MoreHorizontal, ChevronDown, Filter, Info, Shield, Video, Bell, Eye, ThumbsUp, ThumbsDown, Star, Zap, Lock, Activity, Truck, Heart, Plus, Layers, DollarSign, XCircle, ArrowRight, Package, MapPin, TrendingDown } from 'lucide-react';

// Types for Analytics
type ViewState = 'dashboard' | 'intents' | 'session';

interface AgentMetric {
    label: string;
    value: string;
    trend: number;
    trendLabel: string;
    graphData: number[];
}

const Screen6Analytics: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedAgent, setSelectedAgent] = useState('Store Sentinel');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const agents = [
      "Store Sentinel",
      "Review Responder",
      "Sales Associate",
      "Content Crafter",
      "Staff Liaison",
      "Inventory Intel",
      "Delivery Coord",
      "Route Planner",
      "QuickBooks Bot"
  ];

  // --- Render Functions for Each Agent Type ---

  // 1. STORE SENTINEL (Security)
  const renderSentinelDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Security & Safety Report</h2>
                <p className="text-sm text-gray-500">Unspoken Metric: <span className="font-medium text-gray-700">Peace of Mind</span></p>
             </div>
             <div className="flex gap-2">
                 <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                     <Shield size={12} /> System Armed
                 </span>
             </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Quiet Hours</span>
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Lock size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
                  <div className="text-xs text-gray-500">No motion detected between 10 PM - 5 AM.</div>
              </div>
              
              {/* Clickable Suspicious Flags Card */}
              <div 
                  onClick={() => { setSelectedTopic("Suspicious Activity"); setView('intents'); }}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
              >
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase group-hover:text-orange-600 transition-colors">Suspicious Flags</span>
                      <span className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-100 transition-colors"><AlertCircle size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">2</div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-700">This Week: 1 Delivery Truck, 1 Unknown Person. <span className="underline ml-1">View Details</span></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Camera Health</span>
                      <span className="p-2 bg-green-50 text-green-600 rounded-lg"><Video size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">All Active</div>
                  <div className="text-xs text-gray-500">Front Door, Back Loading Dock, Register.</div>
              </div>
          </div>

          {/* Main Visual: Timeline */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">24-Hour Activity Timeline</h3>
              
              <div className="relative h-24 w-full flex items-center">
                  {/* Base Bar */}
                  <div className="absolute inset-x-0 h-4 bg-gray-100 rounded-full overflow-hidden"></div>
                  
                  {/* Markers */}
                  {/* 08:00 AM Staff Entry */}
                  <div className="absolute left-[33%] top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                      <div className="h-6 w-1 bg-blue-500 rounded-full mb-2 group-hover:h-8 transition-all"></div>
                      <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                          08:00 AM: Staff Entry (Sarah)
                      </div>
                  </div>

                   {/* 10:15 AM Delivery */}
                  <div className="absolute left-[42%] top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                      <div className="h-6 w-1 bg-blue-500 rounded-full mb-2 group-hover:h-8 transition-all"></div>
                      <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded whitespace-nowrap z-10">
                          10:15 AM: Supplier Delivery
                      </div>
                  </div>

                  {/* 02:30 AM Unknown (Red) */}
                  <div className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                      <div className="h-8 w-1 bg-red-500 rounded-full mb-2 ring-4 ring-red-100 animate-pulse"></div>
                      
                      {/* Hover Card */}
                      <div className="absolute bottom-10 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 bg-white border border-gray-200 shadow-xl p-3 rounded-lg w-48 z-20">
                          <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=300&auto=format&fit=crop" className="w-full h-24 object-cover rounded mb-2" alt="cat" />
                          <div className="text-xs font-bold text-red-600 mb-1">Suspicious Motion</div>
                          <div className="text-[10px] text-gray-500">02:30 AM • Back Alley Camera</div>
                      </div>
                  </div>

                  {/* Time Labels */}
                  <div className="absolute top-14 left-0 text-xs text-gray-400">12 AM</div>
                  <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs text-gray-400">12 PM</div>
                  <div className="absolute top-14 right-0 text-xs text-gray-400">11:59 PM</div>
              </div>
          </div>

          {/* Trust Metric: False Alarm Feedback */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                   <div className="w-20 h-20 rounded-lg overflow-hidden relative shrink-0">
                       <img src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=300&auto=format&fit=crop" className="w-full h-full object-cover" alt="cat" />
                       <div className="absolute inset-0 bg-black/10"></div>
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-gray-900">False Alarm Feedback</h3>
                       <p className="text-sm text-gray-600 mt-1">"I flagged this as suspicious on Tuesday (02:30 AM). Was I right?"</p>
                   </div>
              </div>
              
              <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors">
                      <ThumbsUp size={16} /> Yes, Good Catch
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                      <ThumbsDown size={16} /> No, Ignore Animals
                  </button>
              </div>
          </div>
      </div>
  );

  // 2. STAFF LIAISON (HR)
  const renderLiaisonDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Staff Communication & Shifts</h2>
                <p className="text-sm text-gray-500">Unspoken Metric: <span className="font-medium text-gray-700">Managerial Load Reduced</span></p>
             </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Texts Handled</span>
                      <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MessageSquare size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">42</div>
                  <div className="text-xs text-gray-500">38 answered automatically, 4 escalated to you.</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Shift Swaps</span>
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Calendar size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">3 Approved</div>
                  <div className="text-xs text-gray-500">Schedule updated automatically.</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Sick Log</span>
                      <span className="p-2 bg-red-50 text-red-600 rounded-lg"><Activity size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">Sarah (Tues)</div>
                  <div className="text-xs text-gray-500">Payroll adjusted for missed shift.</div>
              </div>
          </div>

          {/* Main Visual: Topic Breakdown */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Inquiry Topics (Staff)</h3>
              <div className="space-y-4">
                  {/* Topic 1 */}
                  <button 
                    onClick={() => { setSelectedTopic("Inventory Location"); setView('intents'); }}
                    className="w-full group text-left hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                      <div className="flex justify-between text-sm mb-2 group-hover:text-purple-600">
                          <span className="font-medium text-gray-700">"Where are the [item]s?"</span>
                          <span className="text-gray-500">15 queries</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 w-[65%] rounded-full group-hover:bg-purple-600 transition-colors"></div>
                      </div>
                  </button>
                  {/* Topic 2 */}
                   <button 
                    onClick={() => { setSelectedTopic("Shift Swaps"); setView('intents'); }}
                    className="w-full group text-left hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                      <div className="flex justify-between text-sm mb-2 group-hover:text-blue-600">
                          <span className="font-medium text-gray-700">"Can I swap shifts?"</span>
                          <span className="text-gray-500">8 queries</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 w-[35%] rounded-full group-hover:bg-blue-600 transition-colors"></div>
                      </div>
                  </button>
                  {/* Topic 3 (Blocked) */}
                   <button 
                    onClick={() => { setSelectedTopic("Security Codes"); setView('intents'); }}
                    className="w-full group text-left hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                      <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-red-600 flex items-center gap-2"><Lock size={12}/> "Store Alarm Codes"</span>
                          <span className="text-red-600 text-xs font-bold uppercase">BLOCKED - Escalated</span>
                      </div>
                      <div className="h-2 w-full bg-red-50 rounded-full overflow-hidden border border-red-100">
                          <div className="h-full bg-red-500 w-[5%] rounded-full stripe-pattern group-hover:opacity-80 transition-opacity"></div>
                      </div>
                  </button>
              </div>
          </div>

          {/* Trust Metric: Recent Escalation */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                   <AlertCircle size={16} className="text-orange-500"/>
                   Recent Escalations (Why I bothered you)
               </h3>
               <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start gap-4">
                   <div className="p-2 bg-white rounded-full border border-gray-200 shadow-sm">
                       <User size={20} className="text-gray-600"/>
                   </div>
                   <div className="flex-1">
                       <p className="text-sm text-gray-800 italic">"Sarah asked for a cash advance. I do not have permission to approve this."</p>
                       <p className="text-xs text-gray-500 mt-2 font-medium">Action: Sent to your WhatsApp at 09:42 AM</p>
                   </div>
               </div>
          </div>
      </div>
  );

  // 3. REVIEW RESPONDER (Growth)
  const renderGrowthDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Brand Reputation & Sales</h2>
                <p className="text-sm text-gray-500">Unspoken Metric: <span className="font-medium text-gray-700">Customer Lifetime Value Protection</span></p>
             </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Avg Response Time</span>
                      <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">2m 14s</div>
                  <div className="text-xs text-gray-500">vs 4h 30m (Human Avg)</div>
              </div>
              
              <div 
                  onClick={() => { setSelectedTopic("Refund Request"); setView('intents'); }}
                  className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase group-hover:text-blue-600 transition-colors">Refunds Auto-Issued</span>
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><DollarSign size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">$145.00</div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-700">3 refunds processed this week. <span className="underline ml-1">View Logs</span></div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Sentiment Saved</span>
                      <span className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Heart size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">4.8 / 5.0</div>
                  <div className="text-xs text-gray-500">Avg rating after bot intervention.</div>
              </div>
          </div>

          {/* Main Visual: Sentiment Shift */}
           <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Sentiment Recovery</h3>
              <div className="flex items-end justify-between h-48 gap-4">
                   {/* Bar 1 */}
                   <div className="flex flex-col items-center gap-2 flex-1">
                       <div className="w-full bg-red-100 rounded-t-lg relative group h-32">
                            <div className="absolute bottom-0 left-0 right-0 bg-red-400 rounded-t-lg transition-all" style={{ height: '40%' }}></div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                4 Negative Reviews
                            </div>
                       </div>
                       <span className="text-xs font-bold text-gray-500 uppercase">Incoming Negative</span>
                   </div>
                    {/* Arrow */}
                    <div className="pb-12 text-gray-300">
                        <ArrowRight size={24} />
                    </div>
                   {/* Bar 2 */}
                   <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full bg-green-100 rounded-t-lg relative group h-32">
                            <div className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg transition-all" style={{ height: '75%' }}></div>
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                3 Resolved / Updated
                            </div>
                       </div>
                       <span className="text-xs font-bold text-gray-500 uppercase">Resolved by Bot</span>
                   </div>
              </div>
          </div>

          {/* Trust Metric: Audit */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-6">
                   <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-gray-400">
                       <DollarSign size={32} />
                   </div>
                   <div>
                       <h3 className="text-lg font-bold text-gray-900">Refund Policy Audit</h3>
                       <p className="text-sm text-gray-600 mt-1">"I refunded Order #5544 ($45) because the photo showed dead roses. Was this correct?"</p>
                   </div>
              </div>
              
              <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-lg hover:bg-green-100 transition-colors">
                      <CheckCircle2 size={16} /> Yes, Correct
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                      <XCircle size={16} /> No, Too Generous
                  </button>
              </div>
          </div>
      </div>
  );

  // 4. LOGISTICS DASHBOARD (Inventory Intel, Delivery Coord, Route Planner)
  const renderLogisticsDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Operations & Logistics</h2>
                <p className="text-sm text-gray-500">Unspoken Metric: <span className="font-medium text-gray-700">Operational Efficiency</span></p>
             </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">On-Time Rate</span>
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Clock size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">98.5%</div>
                  <div className="text-xs text-gray-500">Last 7 Days (Target: 95%)</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Spoilage Saved</span>
                      <span className="p-2 bg-green-50 text-green-600 rounded-lg"><Package size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">$450.00</div>
                  <div className="text-xs text-gray-500">Equivalent to 45 Bouquets saved via early discount.</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Route Efficiency</span>
                      <span className="p-2 bg-orange-50 text-orange-600 rounded-lg"><MapPin size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">+15%</div>
                  <div className="text-xs text-gray-500">Miles saved vs Manual Planning.</div>
              </div>
          </div>

          {/* Main Visual: Efficiency Graph */}
           <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Delivery Performance</h3>
              <div className="h-64 w-full flex items-end justify-between gap-2 px-4">
                  {[40, 60, 45, 70, 85, 65, 95].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end group">
                          <div 
                            className="bg-blue-500 rounded-t-sm w-full transition-all duration-500 group-hover:bg-blue-600"
                            style={{ height: `${h}%` }}
                          ></div>
                          <span className="text-xs text-gray-400 text-center mt-2">Day {i+1}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  // 5. FINANCE DASHBOARD (QuickBooks Bot)
  const renderFinanceDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
           <div className="flex items-center justify-between">
             <div>
                <h2 className="text-xl font-bold text-gray-900">Financial Health & Automation</h2>
                <p className="text-sm text-gray-500">Unspoken Metric: <span className="font-medium text-gray-700">Audit Readiness</span></p>
             </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Transactions Tagged</span>
                      <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">142</div>
                  <div className="text-xs text-gray-500">100% Automated this month.</div>
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">OpEx Alert</span>
                      <span className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">1 Flag</div>
                  <div className="text-xs text-gray-500">Unusual Vendor: "FlowerPwr Inc" ($500).</div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-500 uppercase">Payroll Accuracy</span>
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><DollarSign size={18} /></span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
                  <div className="text-xs text-gray-500">No discrepancies detected in last run.</div>
              </div>
          </div>

          {/* Main Visual: Expense Breakdown */}
           <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
              <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="20" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="#10B981" strokeWidth="20" fill="none" strokeDasharray="180 251" /> {/* Inventory */}
                      <circle cx="50" cy="50" r="40" stroke="#3B82F6" strokeWidth="20" fill="none" strokeDasharray="50 251" strokeDashoffset="-180" /> {/* Rent */}
                      <circle cx="50" cy="50" r="40" stroke="#F59E0B" strokeWidth="20" fill="none" strokeDasharray="21 251" strokeDashoffset="-230" /> {/* Other */}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-gray-900">$12k</span>
                      <span className="text-xs text-gray-500">Total Spend</span>
                  </div>
              </div>
              <div className="ml-12 space-y-4">
                  <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Inventory (70%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Rent & Utilities (20%)</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Misc (10%)</span>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderDashboard = () => (
      <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
          {/* Filters Header */}
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                  {/* Removed Team Selector */}
                  <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Agent Type</label>
                      <select 
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2 min-w-[200px] font-medium shadow-sm h-[38px]"
                      >
                          {agents.map(agent => (
                              <option key={agent} value={agent}>{agent}</option>
                          ))}
                      </select>
                  </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-1 flex items-center shadow-sm">
                  <div className="px-3 py-1.5 flex items-center gap-2">
                       <span className="text-xs text-gray-500">Time:</span>
                       <select className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 p-0 cursor-pointer">
                           <option>Last 30 Days</option>
                           <option>Last 7 Days</option>
                       </select>
                  </div>
              </div>
          </div>

          {/* Conditional Render based on Agent Type */}
          {selectedAgent === 'Store Sentinel' && renderSentinelDashboard()}
          {selectedAgent === 'Staff Liaison' && renderLiaisonDashboard()}
          {(selectedAgent === 'Review Responder' || selectedAgent === 'Sales Associate' || selectedAgent === 'Content Crafter') && renderGrowthDashboard()}
          {(selectedAgent === 'Inventory Intel' || selectedAgent === 'Delivery Coord' || selectedAgent === 'Route Planner') && renderLogisticsDashboard()}
          {(selectedAgent === 'QuickBooks Bot') && renderFinanceDashboard()}
      </div>
  );

  // DYNAMIC INTENT DATA
  const getIntentList = () => {
    if (selectedAgent === 'Store Sentinel') {
        return [
            {
                id: '1',
                query: 'Motion Detected: Back Alley',
                response: 'System identified a person lingering near the loading dock for >45 seconds. Confidence: 88%. Alerted Owner.',
                timestamp: '10/11/2025, 02:30:00 AM',
                topic: 'Suspicious Activity'
            },
             {
                id: '2',
                query: 'Vehicle Detected: Loading Zone',
                response: 'System identified a delivery truck. License plate matched supplier database. No alert sent.',
                timestamp: '10/11/2025, 10:15:00 AM',
                topic: 'Delivery Verified'
            },
            {
                id: '3',
                query: 'Motion Detected: Front Door',
                response: 'System identified a stray cat. Transience filter applied. No alert sent.',
                timestamp: '10/11/2025, 01:15:00 AM',
                topic: 'False Alarm'
            }
        ];
    }
    if (selectedAgent === 'Staff Liaison') {
        return [
            {
                id: '1',
                query: 'Where do we keep the extra floral foam blocks?',
                response: 'The agent checked the inventory database and directed the staff member to Shelf B2 in the back storage room.',
                timestamp: '10/11/2025, 03:15:00 PM',
                topic: 'Inventory Location'
            },
            {
                id: '2',
                query: 'I can\'t find the delivery schedule for tomorrow.',
                response: 'The agent retrieved the "Tuesday_Route.pdf" from the shared drive and sent it to the user.',
                timestamp: '10/11/2025, 02:30:00 PM',
                topic: 'Information Retrieval'
            },
            {
                id: '3',
                query: 'Are we out of red satin ribbons?',
                response: 'The agent confirmed 5 rolls in stock and suggested checking the overflow bin under the main counter.',
                timestamp: '10/11/2025, 11:45:00 AM',
                topic: 'Inventory Check'
            },
            {
                id: '4',
                query: 'Is the back door alarm code still 1234?',
                response: 'The agent flagged this security query and escalated to Chitra (Owner) for approval before answering.',
                timestamp: '10/11/2025, 10:10:00 AM',
                topic: 'Security Codes'
            },
        ];
    }
    // Default / Review Responder
    return [
        {
          id: '1',
          query: 'My order #12345 arrived wilted. I need a refund.',
          response: 'The agent expressed empathy for the condition of the flowers and requested a photo for verification, per the freshness guarantee policy.',
          timestamp: '10/11/2025, 01:58:00 PM',
          topic: 'Product Quality'
      },
      {
          id: '2',
          query: 'Where is my delivery? It was supposed to be here by noon.',
          response: 'The agent checked the delivery driver route (Route Planner integration) and confirmed the driver is 10 minutes away.',
          timestamp: '10/11/2025, 12:15:00 PM',
          topic: 'Delivery Status'
      },
      {
          id: '3',
          query: 'Do you have peonies in stock right now?',
          response: 'The agent checked the inventory database and confirmed peonies are out of season, suggesting Garden Roses as an alternative.',
          timestamp: '10/11/2025, 10:30:00 AM',
          topic: 'Inventory Check'
      },
       {
          id: '4',
          query: 'Can I add a card message to my existing order?',
          response: 'The agent successfully updated the order notes with the new card message "Happy Anniversary, Love Tom".',
          timestamp: '10/11/2025, 09:45:00 AM',
          topic: 'Order Modification'
      },
    ];
  };

  const intentList = getIntentList();

  const renderIntents = () => (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-gray-500">
              <button onClick={() => setView('dashboard')} className="hover:text-gray-900 flex items-center gap-1">
                  <ChevronLeft size={16} /> Analytics
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">
                  {selectedAgent === 'Store Sentinel' ? 'Events' : 'Intents'}: #{selectedTopic || 'General'}
              </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-full ${selectedAgent === 'Store Sentinel' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {selectedAgent === 'Store Sentinel' ? <Shield size={24} /> : <MessageSquare size={24} />}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                  {selectedAgent === 'Store Sentinel' ? 'Security Events' : 'Intents'}
              </h1>
              <Info size={16} className="text-blue-500 ml-1" />
          </div>

          <div className="mb-6">
              <div className="text-sm text-gray-600 mb-1">Showing {intentList.length} recent events • Sorted by Timestamp</div>
              <div className="text-sm text-gray-500">Filtered by: Agent includes <span className="font-medium text-gray-900">{selectedAgent}</span></div>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100">
                      {selectedAgent === 'Store Sentinel' ? 'Alert Description' : 'Intent Summary'} <ChevronDown size={14} />
                  </div>
                  <div className="col-span-4 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 border-l border-gray-200">
                      {selectedAgent === 'Store Sentinel' ? 'System Action' : 'Response Summary'} <ChevronDown size={14} />
                  </div>
                  <div className="col-span-2 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 border-l border-gray-200">
                      Timestamp <ChevronDown size={14} />
                  </div>
                  <div className="col-span-2 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 border-l border-gray-200">
                      Topics <ChevronDown size={14} />
                  </div>
                   <div className="col-span-1 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 border-l border-gray-200">
                      Actions <ChevronDown size={14} />
                  </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto">
                  {intentList.map((intent, index) => (
                      <div key={intent.id} className="grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50 transition-colors group relative">
                          <div className="col-span-3 p-4">
                              <button 
                                onClick={() => setView('session')}
                                className="text-left text-sm font-bold text-blue-700 hover:underline leading-relaxed"
                              >
                                  {intent.query}
                              </button>
                          </div>
                          <div className="col-span-4 p-4 border-l border-gray-100 text-sm text-gray-600 leading-relaxed">
                              {intent.response}
                          </div>
                          <div className="col-span-2 p-4 border-l border-gray-100 text-sm text-gray-500">
                              {intent.timestamp}
                          </div>
                          <div className="col-span-2 p-4 border-l border-gray-100 flex items-start">
                              <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600">
                                  {intent.topic}
                              </span>
                          </div>
                          <div className="col-span-1 p-4 border-l border-gray-100"></div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  const renderSession = () => (
      <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-2 mb-6 text-gray-500">
              <button onClick={() => setView('dashboard')} className="hover:text-gray-900 flex items-center gap-1">
                  <ChevronLeft size={16} /> Analytics
              </button>
              <span>/</span>
              <button onClick={() => setView('intents')} className="hover:text-gray-900 flex items-center gap-1">
                  {selectedAgent === 'Store Sentinel' ? 'Events' : 'Intents'}
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">Session #5f51c07b</span>
          </div>

          {/* Session Header */}
          <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${selectedAgent === 'Store Sentinel' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedAgent === 'Store Sentinel' ? <Shield size={24} /> : <MessageSquare size={24} />}
              </div>
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                      {selectedAgent === 'Store Sentinel' ? 'Security Incident Report' : 'Session Page'} - 10/11/2025
                  </h1>
                  <p className="text-sm text-gray-500">ID: 5f51c07b-b1c8-44d8-b875-da87397ff0a8-0</p>
              </div>
          </div>

          <div className="flex flex-1 gap-8 min-h-0">
              {/* Left Column: Session Log */}
              <div className="w-1/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                   <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                       {selectedAgent === 'Store Sentinel' ? <Shield size={16} className="text-red-600"/> : <MessageSquare size={16} className="text-green-600" />}
                       <span className="font-bold text-gray-700">{selectedAgent === 'Store Sentinel' ? 'Event Timeline' : 'Session Log'}</span>
                   </div>
                   
                   {/* DYNAMIC CHAT LOG CONTENT based on Agent */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/30">
                       <div className="text-center text-xs text-gray-400 my-4">
                           {selectedAgent === 'Store Sentinel' 
                            ? 'Incident Detected • Automated Alert' 
                            : `Chat initiated • ${selectedAgent === 'Staff Liaison' ? 'Internal Staff' : 'Customer Web Chat'}`}
                       </div>
                       
                       {selectedAgent === 'Store Sentinel' ? (
                           <>
                                {/* System Alert */}
                                <div className="flex flex-col items-start gap-1 w-full">
                                    <div className="flex gap-2 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0 mt-auto mb-1">
                                            <Shield size={16} />
                                        </div>
                                        <div className="bg-white border border-red-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                                            <strong>SECURITY ALERT</strong><br/>
                                            Motion detected in <strong>Back Alley</strong>.<br/>
                                            Subject has been stationary for 48 seconds.<br/>
                                            <br/>
                                            <i>Snapshot attached.</i>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-12">Store Sentinel • 2:30:00 AM</span>
                                </div>

                                {/* User Feedback */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[90%] shadow-sm border border-gray-200">
                                        [Feedback Log] User marked as "False Alarm - Neighbor smoking".
                                    </div>
                                    <span className="text-[10px] text-gray-400 mr-1">Chitra (Owner) • 8:15 AM</span>
                                </div>
                           </>
                       ) : selectedAgent === 'Staff Liaison' ? (
                           <>
                                {/* User (Staff) */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[90%] shadow-sm">
                                        Where do we keep the extra floral foam blocks? I checked the front.
                                    </div>
                                    <span className="text-[10px] text-gray-400 mr-1">Sarah (Staff) • 3:15 PM</span>
                                </div>

                                {/* Agent */}
                                <div className="flex flex-col items-start gap-1 w-full">
                                    <div className="flex gap-2 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-auto mb-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                                            Checking inventory... <br/><br/>
                                            I show 12 cases of 'Oasis Floral Foam' delivered yesterday. They should be in the <strong>Loading Dock staging area</strong>, labeled 'Fragile', on Shelf B2.
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-12">Staff Liaison • 3:15 PM</span>
                                </div>

                                {/* User (Staff) */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[90%] shadow-sm">
                                        Found them. Thanks! Can you mark 1 case as opened?
                                    </div>
                                    <span className="text-[10px] text-gray-400 mr-1">Sarah (Staff) • 3:16 PM</span>
                                </div>

                                {/* Agent */}
                                <div className="flex flex-col items-start gap-1 w-full">
                                     <div className="flex gap-2 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 mt-auto mb-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                                            Done. Inventory updated. 11 cases remaining.
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-12">Staff Liaison • 3:16 PM</span>
                                </div>
                           </>
                       ) : (
                           /* Default / Review Responder Chat */
                           <>
                                {/* User (Customer) */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[90%] shadow-sm">
                                        My order #12345 arrived wilted. I need a refund.
                                    </div>
                                    <span className="text-[10px] text-gray-400 mr-1">Customer • 2:00 PM</span>
                                </div>

                                {/* Agent */}
                                <div className="flex flex-col items-start gap-1 w-full">
                                     <div className="flex gap-2 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-auto mb-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                                            I'm so sorry to hear that! We have a 5-day freshness guarantee. Could you please upload a photo of the arrangement?
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-12">Review Responder • 2:00 PM</span>
                                </div>

                                {/* User (Customer) */}
                                <div className="flex flex-col items-end gap-1">
                                    <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-[90%] shadow-sm">
                                        [Photo Uploaded] Here you go.
                                    </div>
                                    <span className="text-[10px] text-gray-400 mr-1">Customer • 2:01 PM</span>
                                </div>

                                {/* Agent */}
                                <div className="flex flex-col items-start gap-1 w-full">
                                     <div className="flex gap-2 max-w-[90%]">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-auto mb-1">
                                            <Bot size={16} />
                                        </div>
                                        <div className="bg-white border border-gray-200 text-gray-800 p-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                                            Thank you. I see the issue with the lilies. I've processed a full refund to your card ending in 4242. It should appear in 3-5 days.
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 ml-12">Review Responder • 2:01 PM</span>
                                </div>
                           </>
                       )}
                   </div>
              </div>

              {/* Right Column: Analysis */}
              <div className="flex-1 space-y-6 overflow-y-auto">
                   
                   {/* Intent Header Card */}
                   <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                       <div className="flex items-start gap-3 mb-2">
                           <div className={`p-1.5 rounded-full mt-1 ${selectedAgent === 'Store Sentinel' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                               {selectedAgent === 'Store Sentinel' ? <Shield size={16}/> : <MessageSquare size={16}/>}
                           </div>
                           <h2 className="text-xl font-bold text-gray-900 leading-tight">
                               {selectedAgent === 'Store Sentinel'
                                ? "Motion Detected: Back Alley (Lingering > 45s)"
                                : selectedAgent === 'Staff Liaison' 
                                ? "Where do we keep the extra floral foam blocks?" 
                                : "My order #12345 arrived wilted. I need a refund."}
                           </h2>
                       </div>
                       <p className="text-xs text-gray-500 ml-9 font-mono">ID: 77195ce6-ff1f-ffca-6f44-5890ecb62309-0</p>
                   </div>

                   {/* Grid of Metrics */}
                   <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                       <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Agent Type</label>
                               <p className="text-sm font-medium text-gray-900">{selectedAgent}</p>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{selectedAgent === 'Store Sentinel' ? 'Alert Time' : 'Intent Start Time'}</label>
                               <p className="text-sm font-medium text-gray-900">10/11/2025, {selectedAgent === 'Store Sentinel' ? '2:30 AM' : selectedAgent === 'Staff Liaison' ? '3:15 PM' : '2:00 PM'}</p>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{selectedAgent === 'Store Sentinel' ? 'Confidence' : 'Average Agent Latency'}</label>
                               <p className="text-sm font-medium text-gray-900">{selectedAgent === 'Store Sentinel' ? '88%' : '1200 ms'}</p>
                           </div>
                            <div>
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">{selectedAgent === 'Store Sentinel' ? 'Response Action' : 'Intent Elapsed Time'}</label>
                               <p className="text-sm font-medium text-gray-900">{selectedAgent === 'Store Sentinel' ? 'Alert Sent (SMS)' : '01:32'}</p>
                           </div>
                       </div>
                   </div>

                   {/* Tags & Quality */}
                   <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8 relative overflow-visible">
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{selectedAgent === 'Store Sentinel' ? 'Trigger' : 'Topics Triggered'}</label>
                                <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${selectedAgent === 'Store Sentinel' ? 'bg-red-500' : 'bg-blue-500'}`}>#</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {selectedAgent === 'Store Sentinel' 
                                            ? 'Motion (Person)' 
                                            : selectedAgent === 'Staff Liaison' ? 'Inventory Location' : 'Product Quality'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{selectedAgent === 'Store Sentinel' ? 'Classification' : 'Intent Tag'}</label>
                                <div className="flex items-center gap-2">
                                    <span className="p-1 rounded bg-green-100 text-green-600"><CheckCircle2 size={14}/></span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {selectedAgent === 'Store Sentinel' 
                                            ? 'Suspicious Activity' 
                                            : selectedAgent === 'Staff Liaison' ? 'Stock Lookup' : 'Refund Request'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">{selectedAgent === 'Store Sentinel' ? 'Outcome Accuracy' : 'Quality Score'}</label>
                             <span className={`px-3 py-1 text-sm font-bold rounded-full ${selectedAgent === 'Store Sentinel' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                 {selectedAgent === 'Store Sentinel' ? 'False Positive' : 'High'}
                             </span>
                        </div>

                        <div className="relative">
                            <div className="flex items-start gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedAgent === 'Store Sentinel' ? 'border-yellow-600' : 'border-green-600'}`}>
                                    {selectedAgent === 'Store Sentinel' ? <AlertCircle size={12} className="text-yellow-600"/> : <CheckCircle2 size={12} className="text-green-600" />}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block mb-1">{selectedAgent === 'Store Sentinel' ? 'Feedback Notes' : 'Quality Score Reasoning'}</label>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {selectedAgent === 'Store Sentinel'
                                            ? "User marked this alert as a 'False Alarm'. Reason: 'Neighbor smoking'. System will adjust 'Loitering' threshold for this sector."
                                            : selectedAgent === 'Staff Liaison' 
                                            ? "The agent successfully queried the internal inventory database and provided the precise shelf location (B2) to the staff member."
                                            : "The agent correctly identified the negative sentiment, asked for verification (photo), and processed the refund autonomously."}
                                    </p>
                                </div>
                            </div>
                        </div>
                   </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 font-sans p-8 overflow-y-auto">
       <div className="max-w-[1600px] mx-auto w-full h-full">
            <h1 className="text-3xl font-bold text-[#003359] tracking-tight mb-8">Agent Analytics</h1>
            {view === 'dashboard' && renderDashboard()}
            {view === 'intents' && renderIntents()}
            {view === 'session' && renderSession()}
       </div>
    </div>
  );
};

export default Screen6Analytics;
