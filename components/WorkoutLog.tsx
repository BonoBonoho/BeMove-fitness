
import React, { useState } from 'react';
import { WorkoutEntry, Equipment } from '../types';
import { Dumbbell, Clock, CheckCircle2, ClipboardList, MessageSquare, PlusCircle, Smile, Flame, Loader2, Trash2, Plus, GripVertical, Copy, Tag } from 'lucide-react';
import { analyzeWorkoutCalories } from '../services/geminiService';

interface WorkoutLogProps {
  memberId: string;
  entries: WorkoutEntry[];
  onAddEntry: (entry: WorkoutEntry) => void;
  currentWeight?: number;
  equipmentList?: Equipment[]; 
  onReportNewEquipment?: (name: string) => void; // New prop
}

// Local interface for form management
interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
}

interface ExerciseBlock {
  id: string;
  name: string;
  machine: string;
  sets: WorkoutSet[];
}

const WorkoutLog: React.FC<WorkoutLogProps> = ({ memberId, entries, onAddEntry, currentWeight, equipmentList = [], onReportNewEquipment }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(50);
  const [exercises, setExercises] = useState<ExerciseBlock[]>([]); // Structured Data
  const [checkIn, setCheckIn] = useState({ conditionScore: 3, sleepHours: 6, painLevel: '' });
  const [feedback, setFeedback] = useState('');
  const [nextGoal, setNextGoal] = useState('');

  // --- Handlers for Structured Input ---
  const addExercise = () => {
    setExercises(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        machine: '',
        sets: [{ id: `s_${Date.now()}_1`, weight: '', reps: '' }]
      }
    ]);
  };

  const removeExercise = (exId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exId));
  };

  const updateExercise = (exId: string, field: 'name' | 'machine', value: string) => {
    setExercises(prev => prev.map(ex => {
        if (ex.id === exId) {
            const updated = { ...ex, [field]: value };
            // Auto-fill exercise name if machine changes and name is empty/matches old machine
            if (field === 'machine') {
                // Find matching equipment
                const matchedEq = equipmentList.find(e => e.name === value);
                if (matchedEq && (!ex.name || ex.name === ex.machine)) {
                    updated.name = matchedEq.name;
                }
            }
            return updated;
        }
        return ex;
    }));
  };

  const addSet = (exId: string, copyLast: boolean = false) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        let newWeight = '';
        let newReps = '';
        
        if (copyLast && ex.sets.length > 0) {
            const lastSet = ex.sets[ex.sets.length - 1];
            newWeight = lastSet.weight;
            newReps = lastSet.reps;
        }

        return {
          ...ex,
          sets: [...ex.sets, { id: `s_${Date.now()}_${Math.random()}`, weight: newWeight, reps: newReps }]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
  };

  const updateSet = (exId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  // Convert structured data to string for storage & AI
  const formatContent = () => {
    return exercises.map((ex, i) => {
      const setsStr = ex.sets.map((s, idx) => 
        `   ${idx + 1}set: ${s.weight}kg x ${s.reps}회`
      ).join('\n');
      return `${i + 1}. ${ex.name} ${ex.machine ? `(${ex.machine})` : ''}\n${setsStr}`;
    }).join('\n\n');
  };

  const handleNextStep = () => setStep(prev => (prev < 3 ? prev + 1 : prev) as 1 | 2 | 3);
  const handlePrevStep = () => setStep(prev => (prev > 1 ? prev - 1 : prev) as 1 | 2 | 3);

  const handleSubmit = async () => {
    setIsAnalyzing(true);
    
    // Check for pending equipment
    if (onReportNewEquipment) {
        exercises.forEach(ex => {
            if (ex.machine && !equipmentList.some(e => e.name === ex.machine)) {
                onReportNewEquipment(ex.machine);
            }
        });
    }

    const contentString = formatContent();

    // AI Analysis for Calories
    const estimatedCalories = await analyzeWorkoutCalories(
        contentString, 
        duration, 
        currentWeight
    );

    onAddEntry({
      id: Date.now().toString(),
      memberId,
      date: new Date().toISOString(),
      title: title || '오늘의 수업',
      durationMinutes: duration,
      content: contentString,
      checkIn,
      feedback,
      nextGoal,
      burnedCalories: estimatedCalories
    });

    setIsAnalyzing(false);
    
    // Reset Form
    setTitle('');
    setDuration(50);
    setExercises([]);
    setCheckIn({ conditionScore: 3, sleepHours: 6, painLevel: '' });
    setFeedback('');
    setNextGoal('');
    setStep(1);
    setIsFormOpen(false);
  };

  const getCategory = (machineName: string) => {
      const eq = equipmentList.find(e => e.name === machineName);
      return eq ? eq.category : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-xl font-bold text-gray-800">5-5-5 운동 일지</h3>
            <p className="text-xs text-gray-500">Check-in(5분) - Workout(50분) - Feedback(5분)</p>
        </div>
        <button 
          onClick={() => { setIsFormOpen(!isFormOpen); if(exercises.length === 0) addExercise(); }}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-indigo-500/20"
        >
          <PlusCircle size={18} />
          일지 시작
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-lg border border-indigo-100 overflow-hidden animate-fade-in-down relative">
          
          {/* Loading Overlay */}
          {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3"/>
                  <p className="font-bold text-gray-800">AI가 운동 강도를 분석하고 있습니다...</p>
                  <p className="text-xs text-gray-500">입력된 세트 정보를 바탕으로 칼로리 계산 중</p>
              </div>
          )}

          {/* Progress Bar */}
          <div className="flex bg-gray-50 border-b border-gray-100">
            {[
                { s: 1, l: '수업 전 (Check-in)' }, 
                { s: 2, l: '운동 기록 (Workout)' }, 
                { s: 3, l: '피드백 (Feedback)' }
            ].map((item) => (
                <div 
                    key={item.s}
                    className={`flex-1 py-3 text-center text-xs font-bold transition-colors ${step === item.s ? 'bg-indigo-600 text-white' : step > item.s ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
                >
                    {item.l}
                </div>
            ))}
          </div>

          <div className="p-6">
            {step === 1 && (
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2"><ClipboardList className="text-indigo-500" /> 오늘 컨디션 체크</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">컨디션 점수 (1-5)</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(score => (
                                    <button
                                        key={score}
                                        onClick={() => setCheckIn({...checkIn, conditionScore: score})}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${checkIn.conditionScore === score ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">수면 시간</label>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={checkIn.sleepHours} 
                                    onChange={e => setCheckIn({...checkIn, sleepHours: parseInt(e.target.value)})}
                                    className="w-20 p-2 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                                />
                                <span className="text-gray-500">시간</span>
                             </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">통증/특이사항</label>
                        <input 
                            type="text" 
                            placeholder="예: 어제 야근으로 목이 뻐근함"
                            value={checkIn.painLevel}
                            onChange={e => setCheckIn({...checkIn, painLevel: e.target.value})}
                            className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                        />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">루틴 제목</label>
                        <input 
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="예: 하체 비대면 루틴 B"
                            className="w-full p-2 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="space-y-4">
                       {exercises.map((ex, index) => {
                          const category = getCategory(ex.machine);
                          return (
                          <div key={ex.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                             <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-2 w-full pr-8 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">운동 이름</label>
                                        <input 
                                          type="text" 
                                          placeholder="예: 스쿼트"
                                          value={ex.name}
                                          onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                          className="w-full p-2 bg-gray-200 border border-gray-300 rounded-lg text-sm focus:bg-white"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">기구명 (선택)</label>
                                        <input 
                                          list={`equipment-list-${ex.id}`}
                                          type="text" 
                                          placeholder="기구 선택 또는 입력"
                                          value={ex.machine}
                                          onChange={(e) => updateExercise(ex.id, 'machine', e.target.value)}
                                          className="w-full p-2 bg-gray-200 border border-gray-300 rounded-lg text-sm focus:bg-white"
                                        />
                                        <datalist id={`equipment-list-${ex.id}`}>
                                            {equipmentList.map(item => (
                                                <option key={item.id} value={item.name} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {category && (
                                        <div className="mb-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg whitespace-nowrap flex items-center gap-1 shadow-sm">
                                            <Tag size={12} /> {category}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => removeExercise(ex.id)} className="text-gray-400 hover:text-red-500 p-1 mb-1">
                                    <Trash2 size={18} />
                                </button>
                             </div>

                             {/* Sets Table */}
                             <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-center">
                                   <thead className="bg-gray-100 text-gray-500 text-xs">
                                      <tr>
                                         <th className="py-2 w-12">SET</th>
                                         <th className="py-2">무게 (kg)</th>
                                         <th className="py-2">횟수 (reps)</th>
                                         <th className="py-2 w-10"></th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                      {ex.sets.map((set, sIdx) => (
                                         <tr key={set.id}>
                                            <td className="font-bold text-gray-500">{sIdx + 1}</td>
                                            <td className="p-1">
                                               <input 
                                                  type="text" 
                                                  placeholder="0"
                                                  value={set.weight}
                                                  onChange={(e) => updateSet(ex.id, set.id, 'weight', e.target.value)}
                                                  className="w-full text-center p-1 bg-gray-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                                               />
                                            </td>
                                            <td className="p-1">
                                                <input 
                                                  type="text" 
                                                  placeholder="0"
                                                  value={set.reps}
                                                  onChange={(e) => updateSet(ex.id, set.id, 'reps', e.target.value)}
                                                  className="w-full text-center p-1 bg-gray-200 rounded outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                                               />
                                            </td>
                                            <td>
                                               <button onClick={() => removeSet(ex.id, set.id)} className="text-gray-300 hover:text-red-400">
                                                  <Trash2 size={14} />
                                               </button>
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                                <div className="flex border-t border-gray-100">
                                    <button 
                                      onClick={() => addSet(ex.id, true)}
                                      className="flex-1 py-3 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition border-r border-gray-100 flex items-center justify-center gap-1 bg-white"
                                    >
                                       <Copy size={12} /> + 동일세트
                                    </button>
                                    <button 
                                      onClick={() => addSet(ex.id, false)}
                                      className="flex-1 py-3 text-xs font-bold text-gray-600 hover:bg-gray-50 transition flex items-center justify-center gap-1 bg-white"
                                    >
                                       <Plus size={12} /> + 세트변경
                                    </button>
                                </div>
                             </div>
                          </div>
                       )})}
                    </div>

                    <button 
                      onClick={addExercise}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-2"
                    >
                       <PlusCircle size={20} /> 운동 종목 추가하기
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                     <h4 className="font-bold text-gray-800 flex items-center gap-2"><MessageSquare className="text-indigo-500" /> 피드백 & 다음 목표</h4>
                     
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">오늘의 피드백 (회원 발송용)</label>
                        <textarea 
                            rows={3}
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="스쿼트 시 무릎이 안으로 말리는 현상 교정 필요. 전반적인 수행 능력은 좋았습니다."
                            className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                        />
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-indigo-900 mb-1">다음 수업 목표</label>
                        <input 
                            type="text"
                            value={nextGoal}
                            onChange={e => setNextGoal(e.target.value)}
                            placeholder="예: 스쿼트 70kg 도전"
                            className="w-full p-2 border border-indigo-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
            {step > 1 && (
                <button 
                    onClick={handlePrevStep}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg"
                >
                    이전
                </button>
            )}
            {step < 3 ? (
                <button 
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg"
                >
                    다음 단계
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white font-bold hover:bg-green-700 rounded-lg shadow-md"
                >
                    일지 저장 완료
                </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
          <div key={entry.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {/* AI Burned Calories Badge */}
            <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 px-3 py-1 rounded-bl-xl text-xs font-bold flex items-center gap-1 border-b border-l border-orange-200 shadow-sm">
                <Flame size={12} fill="currentColor" /> 
                {entry.burnedCalories ? `${entry.burnedCalories} kcal 소모 (AI)` : '분석 중...'}
            </div>

            <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
              <div>
                 <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-indigo-500" />
                    {entry.title}
                 </h4>
                 <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{new Date(entry.date).toLocaleDateString()}</span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 flex items-center gap-1"><Clock size={10} /> {entry.durationMinutes}분</span>
                 </div>
              </div>
              
              {entry.checkIn && (
                 <div className="flex flex-col items-end mr-24">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1">
                        컨디션 <span className={`w-2 h-2 rounded-full ${entry.checkIn.conditionScore >= 4 ? 'bg-green-500' : entry.checkIn.conditionScore <= 2 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                    </div>
                    {entry.checkIn.painLevel && (
                        <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{entry.checkIn.painLevel}</span>
                    )}
                 </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 font-bold mb-2 uppercase">Workout Routine</p>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm font-mono leading-relaxed">
                        {entry.content}
                    </div>
                </div>
                <div className="space-y-3">
                    {entry.feedback && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                             <p className="text-xs text-indigo-400 font-bold mb-1 uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Feedback</p>
                             <p className="text-indigo-900 text-sm">{entry.feedback}</p>
                        </div>
                    )}
                    {entry.nextGoal && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex items-start gap-2">
                             <div className="mt-0.5"><Smile size={16} className="text-green-600" /></div>
                             <div>
                                <p className="text-xs text-green-700 font-bold mb-0.5">다음 수업 목표</p>
                                <p className="text-green-900 text-sm font-medium">{entry.nextGoal}</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutLog;
