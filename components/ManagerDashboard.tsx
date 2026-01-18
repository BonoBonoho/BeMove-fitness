
import React, { useState } from 'react';
import { Member, Transaction, User, SurveyResult, TabType, Equipment } from '../types';
import { DollarSign, Users, LogOut, TrendingUp, Award, Calendar, ChevronRight, ArrowLeft, Activity, UserCheck, Trophy, Star, Dumbbell, Trash2, Plus, Edit2, Check, X, AlertCircle, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface ManagerDashboardProps {
  user: User;
  onLogout: () => void;
  transactions: Transaction[];
  members: Member[];
  staffList: User[]; // Full staff list needed to calculate branch stats
  getStaffTarget: (user: User) => number; // Function to get individual targets
  surveyResults?: SurveyResult[]; // Added survey results
  equipmentList: Equipment[];
  setEquipmentList: React.Dispatch<React.SetStateAction<Equipment[]>>;
  pendingEquipment?: string[]; // New
  onApproveEquipment?: (name: string, category: Equipment['category']) => void; // New
  onRejectEquipment?: (name: string) => void; // New
}

interface MockTrainer {
  id: string;
  name: string;
  position: string;
  revenue: number;
  target: number; 
  score: number; // Satisfaction Score
  assignedMemberIds: string[];
}

const EQUIPMENT_CATEGORIES = ['유산소', '가슴', '등', '하체', '어깨', '팔', '복근/코어', '기타'] as const;

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  user, onLogout, transactions, members, staffList, getStaffTarget, surveyResults = [], equipmentList, setEquipmentList,
  pendingEquipment = [], onApproveEquipment, onRejectEquipment
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>(TabType.HOME);
  const [selectedTrainer, setSelectedTrainer] = useState<MockTrainer | null>(null);

  // Equipment Form State
  const [newEqName, setNewEqName] = useState('');
  const [newEqCategory, setNewEqCategory] = useState<string>('유산소');
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [editEqName, setEditEqName] = useState('');
  
  // Pending Approval State
  const [selectedPendingCategory, setSelectedPendingCategory] = useState<Record<string, Equipment['category']>>({});

  // 1. Calculate Global Stats
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = transactions
    .filter(t => t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Remaining PT Sessions (Branch Wide)
  const totalRemainingSessions = members.reduce((sum, m) => sum + (m.totalSessions - m.usedSessions), 0);
  
  // This Month's Burned Sessions (Branch Wide)
  const totalMonthlyBurn = members.reduce((sum, m) => sum + m.monthlySessionCount, 0);

  // Burn Rate Percentage Calculation
  const totalStartSessions = totalRemainingSessions + totalMonthlyBurn;
  const burnRatePercent = totalStartSessions > 0 
    ? ((totalMonthlyBurn / totalStartSessions) * 100).toFixed(1) 
    : "0";

  // 2. Identify My Branch Staff and Calculate Branch Target
  const myBranch = user.branchName || '';
  const myStaff = staffList.filter(s => s.branchName === myBranch);
  const branchTarget = myStaff.reduce((sum, staff) => sum + getStaffTarget(staff), 0);
  const branchAchievementRate = branchTarget > 0 ? (monthlyRevenue / branchTarget) * 100 : 0;

  // 3. Mock Trainer Data with Member Assignments & Real Target Calculation
  const mockTrainers: MockTrainer[] = myStaff
    .filter(s => s.role === 'TRAINER') 
    .map((s, index) => {
       const mockRev = monthlyRevenue * (0.15 + (index * 0.05)); 
       
       // Calculate Avg Score from surveyResults
       const trainerSurveys = surveyResults.filter(r => r.trainerId === s.id);
       const totalScore = trainerSurveys.reduce((sum, r) => sum + r.rating, 0);
       const avgScore = trainerSurveys.length > 0 ? parseFloat((totalScore / trainerSurveys.length).toFixed(1)) : 0;

       return {
         id: s.id,
         name: s.name,
         position: s.position || '트레이너',
         revenue: mockRev, 
         target: getStaffTarget(s),
         score: avgScore || (5.0 - (index * 0.1)), // Use real score or fallback mock
         assignedMemberIds: members.slice(index * 2, (index * 2) + 2).map(m => m.id) 
       };
    });

  // Calculate Total Trainer Revenue for Percentage
  const totalTrainerRevenue = mockTrainers.reduce((acc, t) => acc + t.revenue, 0);

  const chartData = mockTrainers.map(t => ({
    name: t.name,
    revenue: t.revenue / 10000, 
    fullRevenue: t.revenue,     
    target: t.target,
    percent: t.target > 0 ? ((t.revenue / t.target) * 100).toFixed(1) : "0", 
    share: totalTrainerRevenue > 0 ? ((t.revenue / totalTrainerRevenue) * 100).toFixed(1) : "0" 
  }));

  // Helper to get members for the selected trainer
  const selectedTrainerMembers = selectedTrainer 
    ? members.filter(m => selectedTrainer.assignedMemberIds.includes(m.id))
    : [];
    
  // Get recent feedback for selected trainer
  const selectedTrainerFeedback = selectedTrainer 
    ? surveyResults.filter(r => r.trainerId === selectedTrainer.id)
    : [];

  // --- Equipment Handlers ---
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim()) return;
    
    setEquipmentList(prev => [
      ...prev,
      { id: `e_${Date.now()}`, name: newEqName.trim(), category: newEqCategory as any }
    ]);
    setNewEqName('');
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipmentList(prev => prev.filter(e => e.id !== id));
  };

  const handleEditEquipment = (id: string) => {
    if (editingEqId === id) {
        // Save
        setEquipmentList(prev => prev.map(e => e.id === id ? { ...e, name: editEqName } : e));
        setEditingEqId(null);
    } else {
        // Start Editing
        const eq = equipmentList.find(e => e.id === id);
        if (eq) {
            setEditingEqId(id);
            setEditEqName(eq.name);
        }
    }
  };

  const updatePendingCategory = (name: string, category: string) => {
      setSelectedPendingCategory(prev => ({ ...prev, [name]: category as any }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" onError={(e) => { e.currentTarget.style.display='none'}} />
              <h1 className="text-xl font-bold text-gray-800 hidden md:block">BE MOVE <span className="text-indigo-600">MANAGER</span></h1>
           </div>
           
           <nav className="hidden md:flex gap-1">
              <button 
                onClick={() => setCurrentTab(TabType.HOME)} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${currentTab === TabType.HOME ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                대시보드
              </button>
              <button 
                onClick={() => setCurrentTab(TabType.EQUIPMENT)} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${currentTab === TabType.EQUIPMENT ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                기구 관리
                {pendingEquipment.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingEquipment.length}</span>}
              </button>
           </nav>

           <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                 <p className="text-sm font-bold text-gray-800">{user.name} 지점장</p>
                 <p className="text-xs text-gray-500">{user.branchName || '서울 강남점'}</p>
              </div>
              <button onClick={onLogout} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600">
                 <LogOut size={18} />
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Equipment Tab Content */}
        {currentTab === TabType.EQUIPMENT && (
            <div className="animate-fade-in space-y-6">
                
                {/* Pending Equipment Approval Section */}
                {pendingEquipment.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-md border border-orange-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertCircle className="text-orange-500" /> 
                            미등록 기구 발견 ({pendingEquipment.length}건)
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            트레이너가 운동 일지에 입력한 새로운 기구들입니다. 센터 보유 기구가 맞다면 등록해주세요.
                        </p>
                        <div className="space-y-3">
                            {pendingEquipment.map((name, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row items-center gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                    <span className="font-bold text-gray-800 flex-1">{name}</span>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <select 
                                            value={selectedPendingCategory[name] || '유산소'}
                                            onChange={(e) => updatePendingCategory(name, e.target.value)}
                                            className="p-2 border border-gray-300 rounded text-sm bg-white"
                                        >
                                            {EQUIPMENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <button 
                                            onClick={() => onApproveEquipment && onApproveEquipment(name, selectedPendingCategory[name] || '유산소')}
                                            className="px-3 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 flex items-center gap-1"
                                        >
                                            <Check size={14} /> 등록
                                        </button>
                                        <button 
                                            onClick={() => onRejectEquipment && onRejectEquipment(name)}
                                            className="px-3 py-2 bg-gray-200 text-gray-600 rounded text-sm font-bold hover:bg-gray-300 flex items-center gap-1"
                                        >
                                            <Trash2 size={14} /> 삭제
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Dumbbell className="text-indigo-600" /> 센터 보유 기구 관리
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                        회원들과 트레이너들이 운동 일지를 작성할 때 선택할 수 있는 기구 목록을 관리합니다.<br/>
                        카테고리를 선택하고 기구 이름을 등록하면 자동으로 분류됩니다.
                    </p>

                    <form onSubmit={handleAddEquipment} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-end mb-8">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
                            <select 
                                value={newEqCategory}
                                onChange={(e) => setNewEqCategory(e.target.value)}
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {EQUIPMENT_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="block text-xs font-bold text-gray-500 mb-1">기구 이름</label>
                            <input 
                                type="text"
                                value={newEqName}
                                onChange={(e) => setNewEqName(e.target.value)}
                                placeholder="예: 펙 덱 플라이 머신"
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button type="submit" className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                            <Plus size={20} /> 추가하기
                        </button>
                    </form>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {EQUIPMENT_CATEGORIES.map(category => {
                            const items = equipmentList.filter(e => e.category === category);
                            if (items.length === 0) return null;

                            return (
                                <div key={category} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                                        {category}
                                        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500">{items.length}</span>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {items.map(item => (
                                            <div key={item.id} className="p-3 flex justify-between items-center group hover:bg-indigo-50/50 transition">
                                                {editingEqId === item.id ? (
                                                    <div className="flex gap-2 w-full">
                                                        <input 
                                                            autoFocus
                                                            type="text" 
                                                            value={editEqName} 
                                                            onChange={(e) => setEditEqName(e.target.value)}
                                                            className="flex-1 p-1 text-sm border border-indigo-300 rounded bg-white outline-none"
                                                        />
                                                        <button onClick={() => handleEditEquipment(item.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                                                        <button onClick={() => setEditingEqId(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                            <button 
                                                                onClick={() => handleEditEquipment(item.id)}
                                                                className="text-gray-400 hover:text-indigo-600 p-1.5 rounded hover:bg-white"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteEquipment(item.id)}
                                                                className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-white"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* Main Dashboard View */}
        {currentTab === TabType.HOME && !selectedTrainer && (
          <div className="space-y-8 animate-fade-in">
             
             {/* Branch Target Progress */}
             <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-400" /> {user.branchName} 목표 달성 현황
                    </h2>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {branchAchievementRate.toFixed(1)}% 달성
                    </span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-extrabold">{monthlyRevenue.toLocaleString()}원</span>
                    <span className="text-indigo-200 mb-2">/ {branchTarget.toLocaleString()}원 (목표)</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-green-400 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(branchAchievementRate, 100)}%` }}
                    ></div>
                </div>
             </div>

             {/* Global Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <Calendar size={20} />
                      <span className="text-sm font-bold">전체 남은 PT</span>
                   </div>
                   <p className="text-3xl font-extrabold text-gray-800">{totalRemainingSessions}회</p>
                   <p className="text-xs text-gray-400 mt-2">지점 총 잔여 세션</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <Activity size={20} />
                      <span className="text-sm font-bold">이번 달 소진율</span>
                   </div>
                   <div className="flex items-end gap-2">
                      <p className="text-3xl font-extrabold text-indigo-600">{totalMonthlyBurn}회</p>
                      <span className="text-lg font-bold text-indigo-400 mb-1">({burnRatePercent}%)</span>
                   </div>
                   <p className="text-xs text-gray-400 mt-2">수업 진행 / 전체 보유 대비</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <Users size={20} />
                      <span className="text-sm font-bold">전체 활성 회원</span>
                   </div>
                   <p className="text-3xl font-extrabold text-gray-800">{members.length}명</p>
                </div>

                 <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                   <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <UserCheck size={20} />
                      <span className="text-sm font-bold">트레이너 수</span>
                   </div>
                   <p className="text-3xl font-extrabold text-gray-800">{mockTrainers.length}명</p>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trainer List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                   <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                     <UserCheck className="text-indigo-600" />
                     트레이너별 성과 및 만족도
                   </h3>
                   <div className="space-y-3">
                      {mockTrainers.map((t) => {
                         const achievement = t.target > 0 ? (t.revenue / t.target) * 100 : 0;
                         const trainerMembers = members.filter(m => t.assignedMemberIds.includes(m.id));

                         return (
                           <div 
                              key={t.id} 
                              onClick={() => setSelectedTrainer(t)}
                              className="flex flex-col p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 hover:shadow-md transition-all cursor-pointer group border border-transparent hover:border-indigo-200"
                           >
                              <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold shadow-sm">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800 group-hover:text-indigo-700">{t.name} <span className="text-xs text-gray-500 font-normal ml-1">{t.position}</span></p>
                                            <div className="flex items-center text-yellow-500 bg-white px-1.5 rounded-full shadow-sm text-xs font-bold border border-gray-100">
                                                <Star size={10} fill="currentColor" /> {t.score.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span>회원: {trainerMembers.length}명</span>
                                        </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                     <span className={`text-lg font-bold ${achievement >= 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                                         {achievement.toFixed(1)}%
                                     </span>
                                  </div>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                                  <div className={`h-1.5 rounded-full ${achievement >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(achievement, 100)}%` }}></div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-400">
                                  <span>{t.revenue.toLocaleString()}원</span>
                                  <span>목표: {t.target.toLocaleString()}원</span>
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                   <h3 className="font-bold text-gray-800 mb-6">트레이너별 매출 현황 및 점유율</h3>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 60, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis 
                              type="number" 
                              tickFormatter={(value) => `${value.toLocaleString()}만`} 
                              stroke="#9ca3af"
                              fontSize={12}
                            />
                            <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 12}} stroke="#4b5563" />
                            <Tooltip 
                               formatter={(value: number, name: string, props: any) => [
                                  `${(value * 10000).toLocaleString()}원`, 
                                  '매출'
                               ]} 
                               labelFormatter={(label) => `${label} 트레이너`}
                               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={30}>
                               <LabelList 
                                  dataKey="share" 
                                  position="right" 
                                  formatter={(val: string) => `점유율 ${val}%`} 
                                  style={{ fill: '#4b5563', fontSize: '11px', fontWeight: 'bold' }} 
                               />
                            </Bar>
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Trainer Detail View */}
        {currentTab === TabType.HOME && selectedTrainer && (
           <div className="animate-fade-in">
              <button 
                 onClick={() => setSelectedTrainer(null)}
                 className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 font-medium transition-colors"
              >
                 <ArrowLeft size={20} /> 지점 대시보드로 돌아가기
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm lg:col-span-2">
                     <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                           {selectedTrainer.name[0]}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                           <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedTrainer.name} {selectedTrainer.position}</h2>
                           <p className="text-gray-500 mb-4">직원 ID: {selectedTrainer.id}</p>
                           <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                 <span className="text-xs text-gray-500 block">총 매출</span>
                                 <span className="font-bold text-indigo-700">{selectedTrainer.revenue.toLocaleString()}원</span>
                              </div>
                               <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                 <span className="text-xs text-gray-500 block">목표 금액</span>
                                 <span className="font-bold text-gray-800">{selectedTrainer.target.toLocaleString()}원</span>
                              </div>
                              <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                 <span className="text-xs text-gray-500 block">관리 회원</span>
                                 <span className="font-bold text-gray-800">{selectedTrainer.assignedMemberIds.length}명</span>
                              </div>
                              <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
                                 <span className="text-xs text-yellow-600 block">평균 만족도</span>
                                 <span className="font-bold text-yellow-700 flex items-center gap-1">
                                    <Star size={14} fill="currentColor"/> {selectedTrainer.score}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col">
                      <h4 className="font-bold text-gray-800 mb-3 text-sm">최근 만족도 피드백</h4>
                      <div className="flex-1 overflow-y-auto space-y-3">
                         {selectedTrainerFeedback.length > 0 ? selectedTrainerFeedback.map(fb => (
                             <div key={fb.id} className="bg-gray-50 p-3 rounded-lg text-xs space-y-2 border border-gray-100">
                                 <div className="flex justify-between">
                                     <span className="font-bold text-gray-600">{fb.memberName}</span>
                                     <span className="text-gray-400">{fb.date}</span>
                                 </div>
                                 <p className="text-gray-700">"{fb.comment}"</p>
                                 {fb.privateComment && (
                                     <div className="bg-red-50 p-2 rounded border border-red-100 text-red-800 flex items-start gap-1">
                                         <Lock size={10} className="mt-0.5 shrink-0"/>
                                         <span>{fb.privateComment}</span>
                                     </div>
                                 )}
                             </div>
                         )) : (
                             <div className="text-center text-gray-400 text-xs py-4">피드백이 없습니다.</div>
                         )}
                      </div>
                  </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <Users className="text-indigo-600"/> 담당 회원 리스트
              </h3>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                       <tr>
                          <th className="px-6 py-4 font-bold border-b border-gray-100">회원명</th>
                          <th className="px-6 py-4 font-bold border-b border-gray-100">전체 세션</th>
                          <th className="px-6 py-4 font-bold border-b border-gray-100">잔여 세션</th>
                          <th className="px-6 py-4 font-bold border-b border-gray-100">이번 달 출석</th>
                          <th className="px-6 py-4 font-bold border-b border-gray-100">상태</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {selectedTrainerMembers.length > 0 ? selectedTrainerMembers.map(member => (
                          <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <img src={member.profileImage} alt="" className="w-8 h-8 rounded-full bg-gray-200" />
                                   <div>
                                      <p className="font-bold text-gray-800 text-sm">{member.name}</p>
                                      <p className="text-xs text-gray-400">{member.phoneNumber}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-sm text-gray-600">{member.totalSessions}회</td>
                             <td className="px-6 py-4">
                                <span className="font-bold text-indigo-600">{member.totalSessions - member.usedSessions}회</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${member.monthlySessionCount >= 8 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                   {member.monthlySessionCount}회
                                </span>
                             </td>
                             <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded-full border ${member.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                   {member.status === 'active' ? '활동중' : '비활성'}
                                </span>
                             </td>
                          </tr>
                       )) : (
                          <tr>
                             <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                                담당하고 있는 회원이 없습니다.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;
