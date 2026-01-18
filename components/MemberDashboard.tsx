
import React, { useState } from 'react';
import { User, Member, DietEntry, WorkoutEntry, InBodyEntry, Schedule, SurveyResult, Equipment } from '../types';
import { LogOut, Activity, Utensils, Calendar, LineChart, ChevronRight, MessageSquare, Star, X, CheckCircle2, Watch, Footprints, Flame, RefreshCw, Lock, Unlock } from 'lucide-react';
import DietBoard from './DietBoard';
import WorkoutLog from './WorkoutLog';
import InBodyTracker from './InBodyTracker';

interface MemberDashboardProps {
  user: User;
  memberData: Member;
  onLogout: () => void;
  dietEntries: DietEntry[];
  workoutEntries: WorkoutEntry[];
  inBodyEntries: InBodyEntry[];
  schedules: Schedule[];
  onAddDiet: (entry: DietEntry) => void;
  onAddWorkout: (entry: WorkoutEntry) => void;
  onAddInBody: (entry: InBodyEntry) => void;
  onAddSurveyResult?: (result: SurveyResult) => void;
  equipmentList: Equipment[];
  onReportNewEquipment: (name: string) => void;
}

type Tab = 'HOME' | 'DIET' | 'WORKOUT' | 'STATS';

const SURVEY_METRICS = [
  { key: 'punctuality', label: '시간 약속' },
  { key: 'goalAchievement', label: '목표 달성정도' },
  { key: 'kindness', label: '친절함' },
  { key: 'professionalism', label: 'PT 수업 전문성' },
  { key: 'appearance', label: '용모 단정' },
  { key: 'durationCompliance', label: '수업시간 50분 준수' },
  { key: 'feedbackReflection', label: '회원 건의사항 반영' },
  { key: 'focus', label: '수업 집중도' },
];

const MemberDashboard: React.FC<MemberDashboardProps> = ({ 
  user, memberData, onLogout, 
  dietEntries, workoutEntries, inBodyEntries, schedules,
  onAddDiet, onAddWorkout, onAddInBody, onAddSurveyResult,
  equipmentList, onReportNewEquipment
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('HOME');
  
  // Survey State
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyForm, setSurveyForm] = useState({
      metrics: {
        punctuality: 5,
        goalAchievement: 5,
        kindness: 5,
        professionalism: 5,
        appearance: 5,
        durationCompliance: 5,
        feedbackReflection: 5,
        focus: 5,
      },
      comment: '',
      privateComment: ''
  });

  // Wearable Data Simulation
  const [isSyncing, setIsSyncing] = useState(false);
  const [dailyActivity, setDailyActivity] = useState({
      steps: 0,
      calories: 0,
      synced: false
  });

  const handleSyncWearable = () => {
      setIsSyncing(true);
      setTimeout(() => {
          // Simulate fetching data
          const steps = Math.floor(Math.random() * 5000) + 5000; // 5000 - 10000 steps
          const calories = Math.floor(steps * 0.04); // Rough estimate
          setDailyActivity({
              steps,
              calories,
              synced: true
          });
          setIsSyncing(false);
      }, 1500);
  };

  const upcomingSchedule = schedules
    .filter(s => new Date(s.startTime) > new Date())
    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const handleSurveySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onAddSurveyResult) {
          // Calculate average rating
          const values = Object.values(surveyForm.metrics) as number[];
          const averageRating = values.reduce((a, b) => a + b, 0) / values.length;

          const newSurvey: SurveyResult = {
              id: `s_${Date.now()}`,
              trainerId: 'u2', // Mock Trainer ID (Assume linked trainer)
              memberId: memberData.id,
              memberName: memberData.name,
              date: new Date().toISOString().split('T')[0],
              rating: parseFloat(averageRating.toFixed(1)),
              metrics: surveyForm.metrics,
              comment: surveyForm.comment,
              privateComment: surveyForm.privateComment
          };
          onAddSurveyResult(newSurvey);
          setSurveySubmitted(true);
          setShowSurveyModal(false);
      }
  };

  const renderStars = (value: number, onChange: (val: number) => void) => (
      <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                type="button"
                onClick={() => onChange(star)}
                className={`transition-transform hover:scale-110 ${star <= value ? 'text-yellow-400' : 'text-gray-200'}`}
              >
                  <Star size={20} fill="currentColor" />
              </button>
          ))}
      </div>
  );

  // Get Latest Weight for Workout Log Calorie Calculation
  const latestWeight = inBodyEntries.length > 0 
      ? inBodyEntries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
      : 70; // Default

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-20 relative">
      {/* Mobile Header */}
      <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
           <img src={memberData.profileImage} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
           <span className="font-bold text-gray-800">{memberData.name}님</span>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-full">
          로그아웃
        </button>
      </header>

      <main className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'HOME' && (
          <div className="space-y-6 animate-fade-in">
             
             {/* Wearable / Activity Card */}
             <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Watch size={18} className="text-indigo-500" /> 오늘의 활동량
                    </h3>
                    <button 
                        onClick={handleSyncWearable}
                        disabled={isSyncing}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${dailyActivity.synced ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "동기화 중..." : dailyActivity.synced ? "동기화 완료" : "데이터 동기화"}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                        <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-blue-500">
                            <Footprints size={20} />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">걸음 수</span>
                        <span className="text-xl font-extrabold text-gray-800">
                            {dailyActivity.steps.toLocaleString()} <span className="text-xs font-normal text-gray-500">걸음</span>
                        </span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                         <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-orange-500">
                            <Flame size={20} fill="currentColor" />
                        </div>
                        <span className="text-xs text-gray-400 font-medium">활동 칼로리</span>
                        <span className="text-xl font-extrabold text-gray-800">
                            {dailyActivity.calories.toLocaleString()} <span className="text-xs font-normal text-gray-500">kcal</span>
                        </span>
                    </div>
                </div>
                {!dailyActivity.synced && !isSyncing && (
                    <p className="text-center text-xs text-gray-400 mt-3">
                        * 스마트워치와 연동하여 정확한 활동량을 확인하세요.
                    </p>
                )}
             </div>

             {/* Status Card */}
             <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-gray-400 text-xs font-bold uppercase mb-1">Current Goal</p>
                   <h2 className="text-xl font-extrabold text-gray-800 mb-4 leading-tight">{memberData.goal}</h2>
                   <div className="flex gap-4 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                         <p className="text-gray-400 text-xs font-medium">잔여 PT</p>
                         <p className="font-bold text-lg text-indigo-600">{memberData.totalSessions - memberData.usedSessions}회</p>
                      </div>
                      <div className="w-px bg-gray-200"></div>
                      <div>
                         <p className="text-gray-400 text-xs font-medium">사용 PT</p>
                         <p className="font-bold text-lg text-gray-800">{memberData.usedSessions}회</p>
                      </div>
                   </div>
                </div>
                <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-50 opacity-10" />
             </div>

             {/* Next Schedule */}
             <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2">
                     <Calendar size={18} className="text-indigo-500"/> 다음 수업 일정
                   </h3>
                </div>
                {upcomingSchedule ? (
                   <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                      <p className="text-lg font-bold text-gray-800">
                        {new Date(upcomingSchedule.startTime).toLocaleDateString()}
                      </p>
                      <p className="text-indigo-600 font-bold text-xl my-1">
                        {new Date(upcomingSchedule.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      <p className="text-sm text-gray-500">담당: {upcomingSchedule.memberName === memberData.name ? '강철우 코치' : '코치님'}</p>
                   </div>
                ) : (
                   <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      예정된 수업이 없습니다.
                   </div>
                )}
             </div>

             {/* Survey Notification Card */}
             {!surveySubmitted && (
                 <div 
                   onClick={() => setShowSurveyModal(true)}
                   className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white shadow-lg flex items-center justify-between cursor-pointer hover:shadow-xl transition transform hover:-translate-y-0.5 active:scale-95"
                 >
                    <div className="flex items-center gap-3">
                       <div className="bg-white/20 p-2 rounded-full animate-pulse">
                          <MessageSquare size={24} /> 
                       </div>
                       <div>
                          <h3 className="font-bold text-lg">수업 만족도 설문이 도착했어요!</h3>
                          <p className="text-indigo-100 text-xs">더 나은 수업을 위해 회원님의 의견을 들려주세요.</p>
                       </div>
                    </div>
                    <ChevronRight size={24} className="opacity-70" />
                 </div>
             )}

             {/* Quick Menu */}
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('DIET')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
                   <div className="bg-green-100 p-3 rounded-full text-green-600"><Utensils size={24} /></div>
                   <span className="font-bold text-gray-700">식단 기록</span>
                </button>
                <button onClick={() => setActiveTab('WORKOUT')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
                   <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Activity size={24} /></div>
                   <span className="font-bold text-gray-700">운동 일지</span>
                </button>
             </div>
          </div>
        )}

        {activeTab === 'DIET' && (
           <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Utensils className="text-green-500"/> 식단 관리</h2>
              <DietBoard 
                memberId={memberData.id} 
                memberName={memberData.name}
                entries={dietEntries} 
                onAddEntry={onAddDiet}
                // onAddFeedback removed to hide input for members
              />
           </div>
        )}

        {activeTab === 'WORKOUT' && (
           <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-blue-500"/> 운동 일지</h2>
              <WorkoutLog 
                memberId={memberData.id} 
                entries={workoutEntries}
                onAddEntry={onAddWorkout}
                currentWeight={latestWeight}
                equipmentList={equipmentList}
                onReportNewEquipment={onReportNewEquipment}
              />
           </div>
        )}

        {activeTab === 'STATS' && (
           <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><LineChart className="text-orange-500"/> 신체 변화</h2>
              <InBodyTracker 
                memberId={memberData.id}
                entries={inBodyEntries}
                onAddEntry={onAddInBody}
              />
           </div>
        )}
      </main>

      {/* Survey Modal */}
      {showSurveyModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                  <div className="bg-indigo-600 p-5 flex justify-between items-center text-white shrink-0">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                          <MessageSquare size={20}/> 수업 만족도 평가
                      </h3>
                      <button onClick={() => setShowSurveyModal(false)} className="text-white/80 hover:text-white">
                          <X size={24} />
                      </button>
                  </div>
                  <div className="p-6 overflow-y-auto">
                      <p className="text-gray-500 text-sm mb-6 text-center">
                          더 나은 수업을 위해 회원님의 솔직한 평가를 부탁드립니다.
                      </p>

                      <div className="space-y-4 mb-6">
                          {SURVEY_METRICS.map((metric) => (
                              <div key={metric.key} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <span className="text-sm font-bold text-gray-700">{metric.label}</span>
                                  {renderStars(
                                      (surveyForm.metrics as any)[metric.key], 
                                      (val) => setSurveyForm({
                                          ...surveyForm, 
                                          metrics: { ...surveyForm.metrics, [metric.key]: val }
                                      })
                                  )}
                              </div>
                          ))}
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                  <MessageSquare size={16} /> 담당 트레이너에게 한마디
                              </label>
                              <textarea 
                                  value={surveyForm.comment}
                                  onChange={(e) => setSurveyForm({...surveyForm, comment: e.target.value})}
                                  placeholder="트레이너에게 전하고 싶은 말을 적어주세요. (공개)"
                                  className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[80px]"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                  <Lock size={16} className="text-gray-400" /> 관리자에게만 보내는 메시지
                              </label>
                              <textarea 
                                  value={surveyForm.privateComment}
                                  onChange={(e) => setSurveyForm({...surveyForm, privateComment: e.target.value})}
                                  placeholder="칭찬 또는 불평이 있다면 편하게 적어주세요 (담당 트레이너에게는 노출되지 않습니다.)"
                                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 outline-none text-sm min-h-[80px]"
                              />
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                      <button 
                          onClick={handleSurveySubmit}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition"
                      >
                          설문 제출하기
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Thank You Toast */}
      {surveySubmitted && (
         <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-fade-in-up z-50">
             <CheckCircle2 size={20} className="text-green-400" />
             <span className="text-sm font-medium">소중한 의견 감사합니다!</span>
         </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-30 pb-safe">
         <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center gap-1 ${activeTab === 'HOME' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Calendar size={24} />
            <span className="text-[10px] font-bold">홈</span>
         </button>
         <button onClick={() => setActiveTab('DIET')} className={`flex flex-col items-center gap-1 ${activeTab === 'DIET' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Utensils size={24} />
            <span className="text-[10px] font-bold">식단</span>
         </button>
         <button onClick={() => setActiveTab('WORKOUT')} className={`flex flex-col items-center gap-1 ${activeTab === 'WORKOUT' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <Activity size={24} />
            <span className="text-[10px] font-bold">운동</span>
         </button>
         <button onClick={() => setActiveTab('STATS')} className={`flex flex-col items-center gap-1 ${activeTab === 'STATS' ? 'text-indigo-600' : 'text-gray-400'}`}>
            <LineChart size={24} />
            <span className="text-[10px] font-bold">리포트</span>
         </button>
      </nav>
    </div>
  );
};

export default MemberDashboard;
