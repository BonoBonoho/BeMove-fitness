
import React, { useState } from 'react';
import { 
  TabType, 
  Member, 
  MemberTab, 
  DietEntry, 
  InBodyEntry, 
  WorkoutEntry,
  Schedule,
  Transaction,
  User,
  SurveyResult,
  Equipment
} from '../types';
import MemberCard from './MemberCard';
import DietBoard from './DietBoard';
import InBodyTracker from './InBodyTracker';
import WorkoutLog from './WorkoutLog';
import GoalSetting from './GoalSetting';
import DashboardHome from './DashboardHome';
import InsightPanel from './InsightPanel';
import HomeworkGenerator from './HomeworkGenerator';
import NewMemberForm from './NewMemberForm';
import WeeklyScheduler from './WeeklyScheduler';
import RevenueManager from './RevenueManager';
import WorkoutAssist from './WorkoutAssist';
import { Users, LogOut, ArrowLeft, Utensils, Activity, LineChart, Target, Home, BarChart2, Dumbbell, Calendar, DollarSign, Trophy, Brain, Edit2 } from 'lucide-react';

interface TrainerDashboardProps {
  user: User;
  onLogout: () => void;
  // State passed from App
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  dietEntries: DietEntry[];
  setDietEntries: React.Dispatch<React.SetStateAction<DietEntry[]>>;
  inBodyEntries: InBodyEntry[];
  setInBodyEntries: React.Dispatch<React.SetStateAction<InBodyEntry[]>>;
  workoutEntries: WorkoutEntry[];
  setWorkoutEntries: React.Dispatch<React.SetStateAction<WorkoutEntry[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  // New Stats Props
  monthlyRevenue: number;
  monthlyTarget: number;
  // Survey
  surveyResults: SurveyResult[];
  onAddSurveyResult: (result: SurveyResult) => void;
  // Equipment
  equipmentList: Equipment[];
  onReportNewEquipment: (name: string) => void;
}

// Helper Component for Progress Bar
const TargetProgressCard: React.FC<{ current: number; target: number }> = ({ current, target }) => {
  const percent = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);
  const isAchieved = current >= target;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 relative overflow-hidden mb-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Trophy className={isAchieved ? "text-yellow-500" : "text-gray-400"} size={20} />
            이 달의 목표 달성 현황
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            목표: {target.toLocaleString()}원
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-indigo-600">{percent.toFixed(1)}%</span>
          <p className="text-xs text-gray-500">
             {isAchieved ? "목표 달성 완료! 🎉" : `${remaining.toLocaleString()}원 남음`}
          </p>
        </div>
      </div>
      
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isAchieved ? 'bg-green-500' : 'bg-indigo-600'}`}
          style={{ width: `${percent}%` }}
        >
            {percent > 5 && (
                <div className="h-full w-full flex items-center justify-end pr-2">
                    <div className="w-1 h-1 bg-white/50 rounded-full animate-pulse"></div>
                </div>
            )}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
        <span>0원</span>
        <span>{current.toLocaleString()}원</span>
        <span>{target.toLocaleString()}원</span>
      </div>
    </div>
  );
};

const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ 
  user, onLogout,
  members, setMembers,
  schedules, setSchedules,
  dietEntries, setDietEntries,
  inBodyEntries, setInBodyEntries,
  workoutEntries, setWorkoutEntries,
  transactions, setTransactions,
  monthlyRevenue, monthlyTarget,
  surveyResults, onAddSurveyResult,
  equipmentList, onReportNewEquipment
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>(TabType.HOME);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberTab, setMemberTab] = useState<MemberTab>(MemberTab.DIET);
  const [isRegisteringMember, setIsRegisteringMember] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setCurrentTab(TabType.MEMBER_DETAIL);
    setMemberTab(MemberTab.WORKOUT); 
    setIsEditingMember(false);
  };

  const handleBackToMember = () => {
    setSelectedMember(null);
    setCurrentTab(TabType.MEMBER);
  };

  const updateGoal = (memberId: string, newGoal: string) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, goal: newGoal } : m));
    if (selectedMember && selectedMember.id === memberId) {
      setSelectedMember({ ...selectedMember, goal: newGoal });
    }
  };

  const addDietEntry = (entry: DietEntry) => setDietEntries(prev => [entry, ...prev]);
  const addDietFeedback = (entryId: string, feedback: string) => setDietEntries(prev => prev.map(e => e.id === entryId ? { ...e, teacherFeedback: feedback } : e));
  const addInBodyEntry = (entry: InBodyEntry) => setInBodyEntries(prev => [...prev, entry]);
  const addWorkoutEntry = (entry: WorkoutEntry) => setWorkoutEntries(prev => [entry, ...prev]);
  
  const handleRegisterMember = (newMember: Member) => {
    setMembers(prev => [newMember, ...prev]);
    if (newMember.paymentAmount) {
        const tr: Transaction = {
            id: `t_${newMember.id}_${Date.now()}`,
            memberId: newMember.id,
            memberName: newMember.name,
            date: newMember.joinDate,
            amount: newMember.paymentAmount,
            sessionCount: newMember.totalSessions,
            type: 'New',
            source: newMember.source
        };
        setTransactions(prev => [...prev, tr]);
    }
    // Automatically add initial weight as InBody entry if provided
    if (newMember.initialWeight) {
        const initialInBody: InBodyEntry = {
            id: `i_${newMember.id}_init`,
            memberId: newMember.id,
            date: newMember.joinDate,
            weight: newMember.initialWeight,
            muscleMass: 0, // Placeholder
            bodyFat: 0,    // Placeholder
            score: 0
        };
        setInBodyEntries(prev => [...prev, initialInBody]);
    }
    setIsRegisteringMember(false);
  };

  const handleUpdateMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setSelectedMember(updatedMember);
    setIsEditingMember(false);
  };

  const handleRenewal = (memberId: string, amount: number, sessions: number, date: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const newTr: Transaction = {
        id: `t_${Date.now()}`,
        memberId,
        memberName: member.name,
        date,
        amount,
        sessionCount: sessions,
        type: 'Renewal'
    };
    setTransactions(prev => [...prev, newTr]);

    const updatedMembers = members.map(m => {
        if (m.id === memberId) {
            return {
                ...m,
                totalSessions: m.totalSessions + sessions,
                paymentAmount: (m.paymentAmount || 0) + amount
            };
        }
        return m;
    });
    setMembers(updatedMembers);

    if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember(prev => prev ? ({
            ...prev,
            totalSessions: prev.totalSessions + sessions,
            paymentAmount: (prev.paymentAmount || 0) + amount
        }) : null);
    }
  };

  const handleAddSchedule = (schedule: Schedule) => {
    setSchedules(prev => [...prev, schedule]);
  };

  const handleOpenRegister = () => {
    setCurrentTab(TabType.MEMBER);
    setIsRegisteringMember(true);
  };
  
  const handleOpenReport = () => {
    setCurrentTab(TabType.REVENUE);
  };

  // Get Latest InBody for Assist
  const latestInBody = selectedMember 
    ? inBodyEntries
        .filter(e => e.memberId === selectedMember.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : undefined;

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-gray-900 bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col sticky top-0 md:h-screen z-20 shadow-sm">
        <div className="h-24 flex items-center justify-center border-b border-gray-100 p-4">
           <img 
             src="/logo.png" 
             alt="BE MOVE FITNESS" 
             className="h-full w-auto object-contain"
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               if(e.currentTarget.parentElement) {
                 e.currentTarget.parentElement.innerHTML = '<div class="text-xl font-black italic text-gray-800">BE <span class="text-indigo-600">MOVE</span></div>';
               }
             }}
           />
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => { setCurrentTab(TabType.HOME); setSelectedMember(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTab === TabType.HOME ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Home size={20} />
            대시보드
          </button>
          <button 
            onClick={() => { setCurrentTab(TabType.MEMBER); setSelectedMember(null); setIsRegisteringMember(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTab === TabType.MEMBER || currentTab === TabType.MEMBER_DETAIL ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Users size={20} />
            회원 관리
          </button>
           <button 
            onClick={() => { setCurrentTab(TabType.SCHEDULE); setSelectedMember(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTab === TabType.SCHEDULE ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <Calendar size={20} />
            일정 관리
          </button>
          <button 
            onClick={() => { setCurrentTab(TabType.REVENUE); setSelectedMember(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTab === TabType.REVENUE ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <DollarSign size={20} />
            매출 관리
          </button>
          <button 
            onClick={() => { setCurrentTab(TabType.INSIGHT); setSelectedMember(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${currentTab === TabType.INSIGHT ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
          >
            <BarChart2 size={20} />
            인사이트
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl mb-2">
            <img src="https://picsum.photos/100/100" alt="Trainer" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div>
              <p className="text-sm font-bold text-gray-800">{user.name} 코치</p>
              <p className="text-xs text-indigo-600 font-medium">{user.position || 'Trainer'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full mt-1 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 transition">
            <LogOut size={14} /> 로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-gray-50 h-full overflow-y-auto">
        
        {currentTab === TabType.HOME && (
          <div className="flex flex-col">
            <div className="px-8 pt-8">
                <TargetProgressCard current={monthlyRevenue} target={monthlyTarget} />
            </div>
            <DashboardHome 
                members={members} 
                onNavigateToMember={handleMemberClick} 
                onRegisterMember={handleOpenRegister}
                onViewReport={handleOpenReport}
            />
          </div>
        )}

        {currentTab === TabType.REVENUE && (
           <div className="flex flex-col">
             <div className="px-8 pt-8">
                <TargetProgressCard current={monthlyRevenue} target={monthlyTarget} />
             </div>
             <RevenueManager 
               members={members}
               transactions={transactions}
               onAddTransaction={handleRenewal}
             />
           </div>
        )}

        {currentTab === TabType.INSIGHT && (
          <InsightPanel 
            members={members} 
            user={user}
            surveyResults={surveyResults}
            onAddSurveyResult={onAddSurveyResult}
          />
        )}

        {currentTab === TabType.SCHEDULE && (
          <WeeklyScheduler 
            members={members}
            schedules={schedules}
            onAddSchedule={handleAddSchedule}
          />
        )}

        {currentTab === TabType.MEMBER && !isRegisteringMember && (
          <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">회원 리스트</h2>
                <p className="text-gray-500 mt-1">총 {members.length}명의 회원을 관리하고 있습니다.</p>
              </div>
              <div className="flex gap-2">
                 <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none">
                    <option>전체 보기</option>
                    <option>재등록 필요</option>
                    <option>이탈 위험</option>
                 </select>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                onClick={() => setIsRegisteringMember(true)}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer min-h-[220px] group"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors shadow-inner">
                    <Users size={28} className="group-hover:text-indigo-700 transition-colors"/>
                </div>
                <span className="text-lg font-bold">신규 회원 등록</span>
                <span className="text-xs text-gray-400 mt-1">새로운 PT 회원을 추가하세요</span>
              </div>
              
              {members.map(member => (
                <MemberCard key={member.id} member={member} onClick={handleMemberClick} />
              ))}
            </div>
          </div>
        )}

        {currentTab === TabType.MEMBER && isRegisteringMember && (
          <div className="p-8 max-w-7xl mx-auto">
             <NewMemberForm 
               onSave={handleRegisterMember}
               onCancel={() => setIsRegisteringMember(false)}
             />
          </div>
        )}

        {currentTab === TabType.MEMBER_DETAIL && selectedMember && (
          <div className="p-8 max-w-5xl mx-auto min-h-screen animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <button 
                onClick={handleBackToMember}
                className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-medium group"
                >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                회원 목록으로
                </button>
            </div>

            {/* Edit Mode Overlay or Inline */}
            {isEditingMember ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
                    <NewMemberForm 
                        initialData={selectedMember}
                        onSave={handleUpdateMember}
                        onCancel={() => setIsEditingMember(false)}
                    />
                </div>
            ) : (
                <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Activity size={100} />
                </div>
                
                {/* Edit Button */}
                <button 
                    onClick={() => setIsEditingMember(true)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="회원 정보 수정"
                >
                    <Edit2 size={20} />
                </button>

                <img src={selectedMember.profileImage} alt={selectedMember.name} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
                <div className="flex-1 text-center md:text-left z-10">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedMember.name} 회원님</h2>
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase">{selectedMember.behavioralStage}</span>
                    </div>
                    <p className="text-gray-500 mb-3">{selectedMember.gender === 'male' ? '남성' : '여성'} · {selectedMember.age}세 {selectedMember.height && `· ${selectedMember.height}cm`} · 가입일 {selectedMember.joinDate}</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                        <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <span className="text-gray-500">총 세션</span> <span className="font-bold text-gray-800">{selectedMember.totalSessions}회</span>
                        </div>
                        <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <span className="text-gray-500">잔여 세션</span> <span className="font-bold text-indigo-600">{selectedMember.totalSessions - selectedMember.usedSessions}회</span>
                        </div>
                        {selectedMember.paymentAmount && (
                            <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                <span className="text-indigo-600">누적 결제</span> <span className="font-bold text-indigo-800">{selectedMember.paymentAmount.toLocaleString()}원</span>
                            </div>
                        )}
                    </div>
                </div>
                </div>

                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 inline-flex mb-8 overflow-hidden overflow-x-auto w-full md:w-auto">
                {[
                    { id: MemberTab.WORKOUT, label: '5-5-5 운동일지', icon: Activity },
                    { id: MemberTab.INBODY, label: '인바디 관리', icon: LineChart },
                    { id: MemberTab.ASSIST, label: 'AI 운동 처방', icon: Brain },
                    { id: MemberTab.HOMEWORK, label: '숙제 전송', icon: Dumbbell },
                    { id: MemberTab.DIET, label: '식단 관리', icon: Utensils },
                    { id: MemberTab.GOALS, label: '목표 설정', icon: Target },
                ].map(tab => (
                    <button
                    key={tab.id}
                    onClick={() => setMemberTab(tab.id)}
                    className={`flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                        memberTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    >
                    <tab.icon size={16} />
                    {tab.label}
                    </button>
                ))}
                </div>

                <div className="animate-fade-in">
                {memberTab === MemberTab.DIET && (
                    <DietBoard 
                    memberId={selectedMember.id} 
                    memberName={selectedMember.name}
                    entries={dietEntries.filter(e => e.memberId === selectedMember.id)} 
                    onAddEntry={addDietEntry}
                    onAddFeedback={addDietFeedback}
                    />
                )}
                {memberTab === MemberTab.INBODY && (
                    <InBodyTracker 
                    memberId={selectedMember.id} 
                    entries={inBodyEntries.filter(e => e.memberId === selectedMember.id)}
                    onAddEntry={addInBodyEntry}
                    />
                )}
                {memberTab === MemberTab.ASSIST && (
                    <WorkoutAssist 
                    member={selectedMember}
                    latestInBody={latestInBody}
                    />
                )}
                {memberTab === MemberTab.WORKOUT && (
                    <WorkoutLog 
                    memberId={selectedMember.id} 
                    entries={workoutEntries.filter(e => e.memberId === selectedMember.id)}
                    onAddEntry={addWorkoutEntry}
                    currentWeight={latestInBody?.weight}
                    equipmentList={equipmentList}
                    onReportNewEquipment={onReportNewEquipment}
                    />
                )}
                {memberTab === MemberTab.HOMEWORK && (
                    <HomeworkGenerator 
                    memberId={selectedMember.id}
                    memberName={selectedMember.name}
                    history={workoutEntries.filter(e => e.memberId === selectedMember.id)}
                    />
                )}
                {memberTab === MemberTab.GOALS && (
                    <GoalSetting 
                    currentGoal={selectedMember.goal}
                    onUpdateGoal={(g) => updateGoal(selectedMember.id, g)}
                    />
                )}
                </div>
                </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainerDashboard;
