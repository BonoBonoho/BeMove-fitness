
import React, { useState } from 'react';
import { User, UserRole, Member, Transaction, BranchTargetMap, SurveyResult } from '../types';
import { LogOut, Users, MapPin, TrendingUp, Shield, Edit2, Check, X, Building2, Plus, Trash2, Settings, DollarSign, Star, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import ManagerDashboard from './ManagerDashboard';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  staffList: User[];
  onUpdateStaff: (updatedUser: User) => void;
  allMembers: Member[];
  allTransactions: Transaction[];
  // Branch Management Props
  branches: string[];
  onAddBranch: (name: string) => void;
  onUpdateBranch: (oldName: string, newName: string) => void;
  onDeleteBranch: (name: string) => void;
  // Stats & Target Logic
  getStaffTarget: (user: User) => number;
  branchTargets: BranchTargetMap;
  onUpdateTargets: (branch: string, position: string, amount: number) => void;
  // Survey
  surveyResults?: SurveyResult[];
}

const POSITIONS = [
  "지점장",
  "팀장",
  "부팀장",
  "LV3 트레이너",
  "트레이너",
  "수습1",
  "수습2",
  "수습3"
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, onLogout, staffList, onUpdateStaff, allMembers, allTransactions,
  branches, onAddBranch, onUpdateBranch, onDeleteBranch,
  getStaffTarget, branchTargets, onUpdateTargets,
  surveyResults = []
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ position: string; branchName: string }>({ position: '트레이너', branchName: '' });

  // Branch Management State
  const [newBranchName, setNewBranchName] = useState('');
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState('');
  
  // Target Settings State
  const [targetConfigBranch, setTargetConfigBranch] = useState<string>(branches[0] || '');

  // Branch View State
  const [viewingBranch, setViewingBranch] = useState<string | null>(null);

  // --- Statistics ---
  const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalBranches = branches.length;
  const totalManagers = staffList.filter(u => u.role === 'MANAGER').length;
  const totalTrainers = staffList.filter(u => u.role === 'TRAINER').length;

  // Global Target Calculation
  const globalTarget = staffList.reduce((acc, staff) => acc + getStaffTarget(staff), 0);
  const globalAchievementRate = globalTarget > 0 ? (totalRevenue / globalTarget) * 100 : 0;

  // Calculate Avg Satisfaction
  const totalSurveyScore = surveyResults.reduce((sum, r) => sum + r.rating, 0);
  const globalAvgScore = surveyResults.length > 0 ? (totalSurveyScore / surveyResults.length).toFixed(1) : "0.0";

  // Chart Data: Revenue by Branch (Target vs Actual)
  const branchRevenueData = branches.map(branch => {
     // Staff in this branch
     const branchStaff = staffList.filter(s => s.branchName === branch);
     
     // 1. Calculate Target
     const branchTarget = branchStaff.reduce((sum, s) => sum + getStaffTarget(s), 0);

     // 2. Mock Revenue (Normally aggregate transactions by branch)
     // Distribute total revenue roughly based on staff count for demo
     const branchWeight = branchStaff.length > 0 ? branchStaff.length : 0.5;
     const totalWeight = staffList.length || 1;
     const mockRevenue = (totalRevenue * (branchWeight / totalWeight)) || 0;

     const percent = branchTarget > 0 ? (mockRevenue / branchTarget) * 100 : 0;
     
     // 3. Calculate Branch Avg Satisfaction
     const branchStaffIds = branchStaff.map(s => s.id);
     const branchSurveys = surveyResults.filter(r => branchStaffIds.includes(r.trainerId));
     const branchScoreSum = branchSurveys.reduce((sum, r) => sum + r.rating, 0);
     const branchAvgScore = branchSurveys.length > 0 ? (branchScoreSum / branchSurveys.length).toFixed(1) : "0.0";

     return {
       name: branch,
       revenue: mockRevenue,
       target: branchTarget,
       score: branchAvgScore,
       label: `${Math.round(mockRevenue / 10000).toLocaleString()}만 (${percent.toFixed(1)}%)`
     };
  });

  const handleEditClick = (targetUser: User) => {
    setEditingUserId(targetUser.id);
    setEditForm({ 
      position: targetUser.position || '트레이너', 
      branchName: targetUser.branchName || branches[0] || '' 
    });
  };

  const handleSaveClick = (userId: string) => {
    const originalUser = staffList.find(u => u.id === userId);
    if (originalUser) {
      // Determine Role based on Position
      let newRole: UserRole = 'TRAINER';
      if (editForm.position === '지점장') {
        newRole = 'MANAGER';
      }

      onUpdateStaff({
        ...originalUser,
        role: newRole,
        position: editForm.position,
        branchName: editForm.branchName
      });
    }
    setEditingUserId(null);
  };

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      onAddBranch(newBranchName.trim());
      setNewBranchName('');
    }
  };

  const handleUpdateBranchSubmit = (oldName: string) => {
    if (editBranchName.trim() && editBranchName !== oldName) {
      onUpdateBranch(oldName, editBranchName.trim());
    }
    setEditingBranch(null);
  };

  // --- Branch View Logic ---
  if (viewingBranch) {
    // Construct a temporary User object that mimics a Manager for the selected branch
    const mockManagerUser: User = {
        ...user,
        role: 'MANAGER',
        branchName: viewingBranch,
        position: '총괄(지점 조회)'
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-gray-900 text-white px-6 py-3 flex items-center gap-4 sticky top-0 z-50 shadow-md">
                 <button 
                    onClick={() => setViewingBranch(null)}
                    className="flex items-center gap-2 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition text-sm font-bold"
                 >
                    <ArrowLeft size={18}/>
                    총괄 페이지로 돌아가기
                 </button>
                 <div className="h-6 w-px bg-gray-700"></div>
                 <div className="flex items-center gap-2">
                     <Building2 size={18} className="text-indigo-400"/>
                     <span className="font-bold text-lg">{viewingBranch} 상세 대시보드</span>
                 </div>
            </div>
            <ManagerDashboard 
                user={mockManagerUser}
                onLogout={onLogout}
                transactions={allTransactions} // Note: In a real app, you might filter this by branch
                members={allMembers} // Note: In a real app, you might filter this by branch
                staffList={staffList}
                getStaffTarget={getStaffTarget}
                surveyResults={surveyResults}
            />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">BE MOVE <span className="text-indigo-400">ADMIN</span></h1>
                <p className="text-xs text-gray-400">총괄 관리자 시스템</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                 <p className="text-sm font-bold text-gray-200">{user.name} 님</p>
                 <p className="text-xs text-gray-500">Master Admin</p>
              </div>
              <button onClick={onLogout} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-gray-300 transition">
                 <LogOut size={20} />
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        
        {/* Global Stats with Targets */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-800 p-8 rounded-2xl border border-gray-700 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-40 bg-indigo-900/20 transform skew-x-12 translate-x-10" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                       <TrendingUp className="text-green-400" /> 전사 목표 달성 현황
                   </h2>
                   <div className="flex items-end gap-3">
                       <span className="text-5xl font-extrabold text-white">{totalRevenue.toLocaleString()}원</span>
                       <span className="text-gray-400 mb-2 font-medium">/ {globalTarget.toLocaleString()}원 (목표)</span>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                        <span className={`text-4xl font-bold ${globalAchievementRate >= 100 ? 'text-green-400' : 'text-indigo-400'}`}>
                            {globalAchievementRate.toFixed(1)}%
                        </span>
                        <p className="text-sm text-gray-500 mt-1">Total Achievement Rate</p>
                    </div>
                </div>
            </div>
            {/* Progress Bar */}
             <div className="w-full bg-gray-700 rounded-full h-4 mt-6 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${globalAchievementRate >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${Math.min(globalAchievementRate, 100)}%` }}
                ></div>
            </div>
        </div>

        {/* Small Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Building2 size={20} />
               <span className="text-sm font-bold">운영 지점 수</span>
            </div>
            <p className="text-3xl font-extrabold text-white">{totalBranches}개</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Shield size={20} />
               <span className="text-sm font-bold">지점장(Manager)</span>
            </div>
            <p className="text-3xl font-extrabold text-white">{totalManagers}명</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Users size={20} />
               <span className="text-sm font-bold">트레이너(Trainer)</span>
            </div>
            <p className="text-3xl font-extrabold text-white">{totalTrainers}명</p>
          </div>
           <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
             <div className="flex items-center gap-3 mb-2 text-gray-400">
               <Star size={20} />
               <span className="text-sm font-bold">전사 평균 만족도</span>
            </div>
            <p className="text-3xl font-extrabold text-yellow-400 flex items-center gap-2">
                {globalAvgScore} <span className="text-base text-gray-500 font-normal">/ 5.0</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Staff Management Table */}
           <div className="lg:col-span-2 space-y-8">
             
             {/* Staff Table */}
             <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                      <Users className="text-indigo-400"/> 직원 권한 및 지점 관리
                   </h3>
                   <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                      총 {staffList.length}명 등록됨
                   </span>
                </div>
                <div className="overflow-x-auto h-[400px]">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase sticky top-0 backdrop-blur-sm z-10">
                         <tr>
                            <th className="px-6 py-4 font-bold">이름 / ID</th>
                            <th className="px-6 py-4 font-bold">직책 (Position)</th>
                            <th className="px-6 py-4 font-bold">소속 지점</th>
                            <th className="px-6 py-4 font-bold text-right">관리</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700 text-sm">
                         {staffList.map((staff) => (
                            <tr key={staff.id} className="hover:bg-gray-700/50 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${staff.role === 'MANAGER' ? 'bg-indigo-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                        {staff.name[0]}
                                     </div>
                                     <div>
                                        <p className="font-bold text-white">{staff.name}</p>
                                        <p className="text-xs text-gray-500">{staff.username}</p>
                                        <p className="text-[10px] text-gray-600">{staff.role}</p>
                                     </div>
                                  </div>
                               </td>
                               
                               {/* Position Column */}
                               <td className="px-6 py-4">
                                  {editingUserId === staff.id ? (
                                     <select 
                                        value={editForm.position}
                                        onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                                        className="bg-gray-900 border border-gray-600 text-white rounded px-2 py-1 outline-none focus:border-indigo-500 w-32"
                                     >
                                        {POSITIONS.map(pos => (
                                          <option key={pos} value={pos}>{pos}</option>
                                        ))}
                                     </select>
                                  ) : (
                                     <span className={`px-2 py-1 rounded-md text-xs font-bold ${staff.role === 'MANAGER' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700' : 'bg-gray-700 text-gray-300'}`}>
                                        {staff.position || '미지정'}
                                     </span>
                                  )}
                               </td>

                               {/* Branch Column */}
                               <td className="px-6 py-4 text-gray-300">
                                  {editingUserId === staff.id ? (
                                      <select 
                                         value={editForm.branchName}
                                         onChange={(e) => setEditForm({...editForm, branchName: e.target.value})}
                                         className="bg-gray-900 border border-gray-600 text-white rounded px-2 py-1 outline-none focus:border-indigo-500 w-32"
                                      >
                                         <option value="">미배정</option>
                                         {branches.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                         ))}
                                      </select>
                                  ) : (
                                     <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-500" />
                                        {staff.branchName || '미배정'}
                                     </div>
                                  )}
                               </td>

                               {/* Actions Column */}
                               <td className="px-6 py-4 text-right">
                                  {editingUserId === staff.id ? (
                                     <div className="flex justify-end gap-2">
                                        <button onClick={() => handleSaveClick(staff.id)} className="p-1.5 bg-green-600 rounded hover:bg-green-500 text-white"><Check size={16}/></button>
                                        <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-gray-600 rounded hover:bg-gray-500 text-white"><X size={16}/></button>
                                     </div>
                                  ) : (
                                     <button 
                                        onClick={() => handleEditClick(staff)}
                                        className="text-gray-400 hover:text-white flex items-center gap-1 ml-auto transition-colors px-3 py-1.5 rounded hover:bg-gray-700"
                                     >
                                        <Edit2 size={14} /> 수정
                                     </button>
                                  )}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Branch Management Section */}
             <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden shadow-lg p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Building2 className="text-indigo-400"/> 지점 관리
                </h3>
                
                {/* Add Branch Form */}
                <form onSubmit={handleAddBranchSubmit} className="flex gap-2 mb-6">
                   <input 
                     type="text" 
                     value={newBranchName} 
                     onChange={(e) => setNewBranchName(e.target.value)}
                     placeholder="새로운 지점 이름 입력"
                     className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                   />
                   <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                      <Plus size={18} /> 추가
                   </button>
                </form>

                {/* Branch List */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                   {branches.map(branch => (
                      <div key={branch} className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex justify-between items-center group">
                         {editingBranch === branch ? (
                            <div className="flex items-center gap-2 w-full">
                               <input 
                                  autoFocus
                                  type="text" 
                                  value={editBranchName} 
                                  onChange={(e) => setEditBranchName(e.target.value)}
                                  className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-2 py-1 w-full outline-none"
                               />
                               <button onClick={() => handleUpdateBranchSubmit(branch)} className="text-green-500 hover:text-green-400"><Check size={16}/></button>
                               <button onClick={() => setEditingBranch(null)} className="text-gray-500 hover:text-gray-400"><X size={16}/></button>
                            </div>
                         ) : (
                            <div className="flex justify-between items-center w-full">
                               <span className="text-gray-300 font-medium truncate">{branch}</span>
                               <div className="flex items-center gap-2">
                                  {/* View Dashboard Button */}
                                  <button 
                                     onClick={() => setViewingBranch(branch)}
                                     title="지점 대시보드 보기"
                                     className="text-gray-400 hover:text-indigo-400 p-1 hover:bg-gray-800 rounded transition-colors"
                                  >
                                     <LayoutDashboard size={14} />
                                  </button>
                                  {/* Edit/Delete Group */}
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => { setEditingBranch(branch); setEditBranchName(branch); }} 
                                      className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded"
                                    >
                                      <Edit2 size={14}/>
                                    </button>
                                    <button 
                                      onClick={() => { if(window.confirm(`${branch}을 삭제하시겠습니까?`)) onDeleteBranch(branch); }}
                                      className="text-gray-400 hover:text-red-400 p-1 hover:bg-gray-800 rounded"
                                    >
                                      <Trash2 size={14}/>
                                    </button>
                                  </div>
                               </div>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
           </div>

           {/* Right Column: Charts and Target Settings */}
           <div className="space-y-8">
               {/* Branch Performance Chart */}
               <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                     <TrendingUp className="text-green-400"/> 지점별 목표 달성률 & 만족도
                  </h3>
                  <div className="h-[400px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={branchRevenueData} 
                          layout="vertical" 
                          margin={{ top: 0, right: 110, left: 0, bottom: 0 }}
                        >
                           <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
                           <XAxis 
                              type="number" 
                              stroke="#9CA3AF"
                              fontSize={11}
                              tickFormatter={(val) => `${val/10000}만`} 
                            />
                           <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={80} 
                              tick={{fill: '#9CA3AF', fontSize: 11}} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                              formatter={(val: number, name: string, props: any) => [
                                `${(val).toLocaleString()}원`, 
                                '매출'
                              ]}
                              labelFormatter={(label, payload) => {
                                  if(payload && payload[0]) {
                                      return `${label} (⭐ ${payload[0].payload.score})`;
                                  }
                                  return label;
                              }}
                           />
                           <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                              <LabelList 
                                dataKey="label" 
                                position="right" 
                                style={{ fill: '#9CA3AF', fontSize: '11px', fontWeight: 'bold' }} 
                              />
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Target Settings */}
               <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                     <Settings className="text-indigo-400"/> 지점/직급별 목표 설정
                  </h3>
                  
                  <div className="mb-4">
                     <label className="block text-xs text-gray-500 font-bold uppercase mb-1">설정할 지점 선택</label>
                     <select 
                       value={targetConfigBranch} 
                       onChange={(e) => setTargetConfigBranch(e.target.value)}
                       className="w-full bg-gray-900 border border-gray-600 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                     >
                       <option value="">지점을 선택하세요</option>
                       {branches.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>

                  {targetConfigBranch && (
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {POSITIONS.filter(p => p !== '지점장').map(position => {
                           // Get current override or default
                           const currentTarget = (branchTargets[targetConfigBranch] && branchTargets[targetConfigBranch][position]) 
                                                 || 0; // Show 0 if no override, or show default logic placeholder
                           
                           return (
                             <div key={position} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                <span className="text-sm font-medium text-gray-300">{position}</span>
                                <div className="flex items-center gap-2">
                                   <input 
                                     type="number"
                                     placeholder="기본값 사용"
                                     value={currentTarget || ''}
                                     onChange={(e) => onUpdateTargets(targetConfigBranch, position, parseInt(e.target.value) || 0)}
                                     className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-right text-white text-sm focus:border-indigo-500 outline-none"
                                   />
                                   <span className="text-xs text-gray-500">원</span>
                                </div>
                             </div>
                           );
                        })}
                     </div>
                  )}
                  
                  <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-900/50">
                     <p className="text-xs text-indigo-300">
                        * 값을 입력하면 기본 목표 매출을 덮어씁니다.<br/>
                        * 빈 칸으로 두면 기본값을 사용합니다.
                     </p>
                  </div>
               </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
