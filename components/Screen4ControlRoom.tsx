
import React, { useState, useEffect } from 'react';
import { Video, AlertCircle, CheckCircle2, MessageSquare, DollarSign, Clock, Eye, MoreHorizontal, ChevronDown, Plus, Layers } from 'lucide-react';

// Types for our Kanban Board
interface AgentTask {
  id: string;
  agentName: string;
  type: 'security' | 'message' | 'finance' | 'payroll' | 'inventory' | 'logistics' | 'sales';
  status: 'running' | 'review' | 'completed';
  title: string;
  timestamp: string;
  // Specific properties for different card types
  logs?: string[];
  thumbnail?: string;
  messageDetail?: string;
  financeDetail?: string;
  inventoryDetail?: string;
  logisticsDetail?: string;
  salesDetail?: string;
}

const Screen4ControlRoom: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState('All Teams');

  // Mapping Agents to Org Chart Teams
  const getAgentTeam = (agentName: string): string => {
      const map: Record<string, string> = {
          'Store Sentinel': 'Security & Assets',
          'Review Responder': 'Growth & Sales',
          'Sales Associate': 'Growth & Sales',
          'Content Crafter': 'Growth & Sales',
          'Inventory Intel': 'Ops & Logistics',
          'Delivery Coord': 'Ops & Logistics',
          'Route Planner': 'Ops & Logistics',
          'QuickBooks Bot': 'Finance',
          'Payroll Admin': 'Finance',
          'Staff Liaison': 'People',
          'Labor Scheduler': 'People'
      };
      return map[agentName] || 'Unassigned';
  };

  const teams = [
      { name: "Security & Assets", color: "bg-red-500" },
      { name: "Growth & Sales", color: "bg-purple-600" },
      { name: "Ops & Logistics", color: "bg-blue-500" },
      { name: "Finance", color: "bg-emerald-500" },
      { name: "People", color: "bg-pink-500" }
  ];

  // Mock Data mimicking the Flower Shop State
  const [tasks, setTasks] = useState<AgentTask[]>([
    {
      id: '1',
      agentName: 'Store Sentinel',
      type: 'security',
      status: 'running',
      title: 'Premise Monitor',
      timestamp: 'Live',
      thumbnail: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?q=80&w=800&auto=format&fit=crop',
      logs: [
        "10:02 AM: Checked Back Door - LOCKED",
        "10:05 AM: Checked Delivery Van #2 - LOCKED",
        "10:15 AM: Motion @ Front Desk - Staff Identified",
        "10:20 AM: Checked Cooler Temp - 38°F (Optimal)"
      ]
    },
    {
      id: '5',
      agentName: 'Delivery Coord',
      type: 'logistics',
      status: 'running',
      title: 'Tracking Fleet',
      timestamp: 'Live',
      logisticsDetail: 'Driver 1 (Mike): En route to Downtown (ETA 5 mins). Driver 2 (Sarah): Loading at dock.',
    },
    {
      id: '2',
      agentName: 'Staff Liaison',
      type: 'message',
      status: 'review',
      title: 'Shift Swap Request',
      timestamp: '10:15 AM',
      messageDetail: 'Sarah: "Hi Chitra, I woke up with a fever. Can I swap shifts with Mike for tomorrow?"'
    },
    {
      id: '6',
      agentName: 'Inventory Intel',
      type: 'inventory',
      status: 'review',
      title: 'Spoilage Alert',
      timestamp: '10:10 AM',
      inventoryDetail: 'Detected 30% wilting in White Roses (Batch #44). Suggestion: Discount 50% or Compost.',
    },
    {
      id: '7',
      agentName: 'Sales Associate',
      type: 'sales',
      status: 'review',
      title: 'Wedding Quote Draft',
      timestamp: '09:55 AM',
      salesDetail: 'Drafted Proposal for "Miller Wedding" ($1,200). Includes Peonies and Hydrangeas. Ready for approval.',
    },
    {
      id: '3',
      agentName: 'QuickBooks Bot',
      type: 'finance',
      status: 'review',
      title: 'Unmatched Transaction',
      timestamp: '09:45 AM',
      financeDetail: '$45.00 - Shell Station (Auto-Categorize as Travel?)'
    },
    {
      id: '8',
      agentName: 'Review Responder',
      type: 'message',
      status: 'completed',
      title: 'Reply to 5-Star Review',
      timestamp: '09:30 AM',
      messageDetail: 'Replied to Jane Doe: "Thank you Jane! We are so glad you loved the arrangement!"'
    },
    {
      id: '4',
      agentName: 'Payroll Admin',
      type: 'payroll',
      status: 'completed',
      title: 'Bi-Weekly Payroll Run',
      timestamp: '08:30 AM',
      logs: ["Payroll sent to bank for processing."]
    },
    {
      id: '9',
      agentName: 'Route Planner',
      type: 'logistics',
      status: 'completed',
      title: 'Daily Route Optimization',
      timestamp: '08:00 AM',
      logisticsDetail: 'Optimized 14 stops. Saved approx 12 miles vs unoptimized.',
    },
     {
      id: '10',
      agentName: 'QuickBooks Bot',
      type: 'finance',
      status: 'completed',
      title: 'Rent Payment',
      timestamp: '01:00 AM',
      financeDetail: 'Categorized $2,500 payment to "Real Estate Corp" as Rent Expense.'
    }
  ]);

  // Simulate "Thinking" logs for the Security Agent
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.type === 'security' && task.logs) {
          const newLog = `10:${21 + Math.floor(Math.random() * 40)} AM: Verified Sensor ${Math.floor(Math.random() * 4) + 1} - OK`;
          const updatedLogs = [...task.logs.slice(1), newLog];
          return { ...task, logs: updatedLogs };
        }
        return task;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter Tasks
  const filteredTasks = selectedTeam === 'All Teams' 
    ? tasks 
    : tasks.filter(t => getAgentTeam(t.agentName) === selectedTeam);

  const getColumnTasks = (status: AgentTask['status']) => filteredTasks.filter(t => t.status === status);

  const renderCard = (task: AgentTask) => {
    return (
      <div key={task.id} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4 overflow-hidden hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* Card Header */}
        <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
                task.type === 'security' ? 'bg-red-500 animate-pulse' :
                task.type === 'message' ? 'bg-blue-500' :
                task.type === 'finance' ? 'bg-green-500' : 
                task.type === 'inventory' ? 'bg-pink-500' : 
                task.type === 'sales' ? 'bg-purple-500' : 
                task.type === 'logistics' ? 'bg-orange-500' : 'bg-gray-400'
            }`}></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide truncate max-w-[150px]">{task.agentName}</span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{task.timestamp}</span>
        </div>

        {/* Card Body based on Type */}
        <div className="p-0">
          {/* Security Card */}
          {task.type === 'security' && (
            <div className="relative group">
               {/* Faux Video Feed */}
               <div className="h-32 bg-gray-900 relative overflow-hidden">
                  <img src={task.thumbnail} alt="CCTV" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                  </div>
               </div>
               
               {/* Scrolling Log */}
               <div className="bg-gray-900 p-3 h-32 overflow-hidden border-t border-gray-800">
                  <div className="space-y-2 font-mono text-[10px] text-green-400/80">
                    {task.logs?.map((log, i) => (
                      <div key={i} className="truncate animate-in fade-in slide-in-from-bottom-1 duration-500">
                        {log.includes("FLAGGED") ? <span className="text-red-400 font-bold">{log}</span> : `> ${log}`}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* Message Review Card */}
          {task.type === 'message' && (
            <div className="p-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                   <MessageSquare size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                   <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-2 rounded-lg border border-gray-100">
                     {task.messageDetail}
                   </p>
                   {task.status === 'review' && (
                       <div className="flex gap-2 mt-3">
                         <button className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition-colors">Approve</button>
                         <button className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 transition-colors">Reply</button>
                       </div>
                   )}
                 </div>
               </div>
            </div>
          )}

          {/* Finance Review Card */}
          {task.type === 'finance' && (
            <div className="p-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                   <DollarSign size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                   <p className="text-xs text-gray-600 font-medium">{task.financeDetail}</p>
                   {task.status === 'review' && (
                       <div className="flex items-center gap-2 mt-3 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded w-fit">
                         <AlertCircle size={12} />
                         <span>Confirm Category</span>
                       </div>
                   )}
                 </div>
               </div>
            </div>
          )}

           {/* Inventory Card */}
          {task.type === 'inventory' && (
            <div className="p-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-pink-50 text-pink-600 rounded-lg shrink-0">
                   <AlertCircle size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                   <p className="text-xs text-gray-600 font-medium leading-relaxed">{task.inventoryDetail}</p>
                   {task.status === 'review' && (
                        <div className="flex gap-2 mt-3">
                         <button className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition-colors">Discount Item</button>
                         <button className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 transition-colors">Ignore</button>
                       </div>
                   )}
                 </div>
               </div>
            </div>
          )}

           {/* Sales Card */}
          {task.type === 'sales' && (
            <div className="p-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                   <DollarSign size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                   <p className="text-xs text-gray-600 font-medium leading-relaxed">{task.salesDetail}</p>
                   {task.status === 'review' && (
                        <div className="flex gap-2 mt-3">
                         <button className="flex-1 py-1.5 bg-gray-900 text-white text-xs font-medium rounded hover:bg-black transition-colors">Send PDF</button>
                         <button className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded hover:bg-gray-50 transition-colors">Edit</button>
                       </div>
                   )}
                 </div>
               </div>
            </div>
          )}

           {/* Logistics Card */}
          {task.type === 'logistics' && (
            <div className="p-4">
               <div className="flex items-start gap-3">
                 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                   <Clock size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 mb-1">{task.title}</h4>
                   <p className="text-xs text-gray-600 font-medium leading-relaxed">{task.logisticsDetail}</p>
                 </div>
               </div>
            </div>
          )}

          {/* Completed Card */}
          {task.type === 'payroll' && (
            <div className="p-4 flex items-center gap-3 opacity-75">
               <div className="p-2 bg-gray-100 text-gray-500 rounded-lg shrink-0">
                   <CheckCircle2 size={18} />
               </div>
               <div>
                 <h4 className="text-sm font-medium text-gray-900 line-through decoration-gray-400">{task.title}</h4>
                 <p className="text-xs text-gray-400">Successfully processed</p>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 font-sans overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 relative z-20">
         <h2 className="text-lg font-bold text-gray-900 tracking-tight">Operation Control Room</h2>
         
         {/* Team Selector - Centered */}
         <div className="absolute left-1/2 -translate-x-1/2">
             <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors">
                      {selectedTeam === 'All Teams' ? (
                          <Layers size={14} className="text-gray-500" />
                      ) : (
                          <span className={`w-2 h-2 rounded-full ${teams.find(t => t.name === selectedTeam)?.color || 'bg-gray-400'}`}></span>
                      )}
                      {selectedTeam}
                      <ChevronDown size={14} className="text-gray-400"/>
                  </button>
                  <div className="absolute top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase bg-gray-50 border-b border-gray-100">Filter by Team</div>
                      
                      <button onClick={() => setSelectedTeam("All Teams")} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                          <Layers size={14} className="text-gray-500" /> All Teams
                      </button>

                      {teams.map((team) => (
                          <button 
                            key={team.name}
                            onClick={() => setSelectedTeam(team.name)} 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                              <span className={`w-2 h-2 rounded-full ${team.color}`}></span> 
                              {team.name}
                          </button>
                      ))}
                  </div>
             </div>
         </div>

         <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Online
         </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 relative z-10">
        <div className="flex h-full gap-6 min-w-[1000px]">
          
          {/* Column 1: Watching / Running */}
          <div className="w-1/3 flex flex-col min-w-[320px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Eye size={16} /> Watching / Running
              </h3>
              <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{getColumnTasks('running').length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
              {getColumnTasks('running').map(renderCard)}
              {getColumnTasks('running').length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                      No running tasks for {selectedTeam}
                  </div>
              )}
            </div>
          </div>

          {/* Column 2: Needs Review */}
          <div className="w-1/3 flex flex-col min-w-[320px]">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <AlertCircle size={16} /> Needs Review
              </h3>
              <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{getColumnTasks('review').length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
              {getColumnTasks('review').map(renderCard)}
              {getColumnTasks('review').length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                      No review items for {selectedTeam}
                  </div>
              )}
            </div>
          </div>

          {/* Column 3: Completed Today */}
          <div className="w-1/3 flex flex-col min-w-[320px]">
             <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Clock size={16} /> Completed Today
              </h3>
              <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{getColumnTasks('completed').length}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 pb-10">
              {getColumnTasks('completed').map(renderCard)}
               {getColumnTasks('completed').length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                      No completed tasks for {selectedTeam}
                  </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Screen4ControlRoom;
