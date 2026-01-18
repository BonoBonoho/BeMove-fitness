
import React, { useState } from 'react';
import { Member, InBodyEntry } from '../types';
import { generateWorkoutPlanFromInBody } from '../services/geminiService';
import { Brain, RefreshCw, AlertCircle, Dumbbell, Activity, LineChart, Loader2 } from 'lucide-react';

interface WorkoutAssistProps {
  member: Member;
  latestInBody?: InBodyEntry;
}

const WorkoutAssist: React.FC<WorkoutAssistProps> = ({ member, latestInBody }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string>('');

  const handleGenerate = async () => {
    if (!latestInBody) return;

    setIsGenerating(true);
    setGeneratedPlan('');
    
    const result = await generateWorkoutPlanFromInBody(
        { 
            name: member.name, 
            age: member.age, 
            gender: member.gender, 
            goal: member.goal,
            height: member.height
        },
        { 
            weight: latestInBody.weight, 
            muscleMass: latestInBody.muscleMass, 
            bodyFat: latestInBody.bodyFat,
            score: latestInBody.score
        }
    );
    
    setGeneratedPlan(result);
    setIsGenerating(false);
  };

  if (!latestInBody) {
    return (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center">
            <AlertCircle size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-600 mb-1">인바디 데이터 없음</h3>
            <p className="text-gray-400">AI 운동 처방을 생성하려면 먼저 인바디 기록을 추가해주세요.</p>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
            <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
            <Brain className="text-indigo-200" />
            AI 인바디 기반 운동 처방
            </h3>
            <p className="text-indigo-100 max-w-xl">
            회원님의 최신 신체 구성을 분석하여 가장 효율적인 운동 계획과 중점 사항을 AI가 제안합니다.
            </p>
        </div>
        <Brain size={150} className="absolute -right-8 -bottom-10 text-white opacity-10" />
      </div>

      {/* Analysis Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center">
             <div className="bg-blue-50 p-3 rounded-full mb-2">
                 <Dumbbell className="text-blue-500" size={24} />
             </div>
             <p className="text-xs text-gray-500 font-bold uppercase">골격근량</p>
             <p className="text-2xl font-bold text-gray-800">{latestInBody.muscleMass}kg</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center">
             <div className="bg-orange-50 p-3 rounded-full mb-2">
                 <Activity className="text-orange-500" size={24} />
             </div>
             <p className="text-xs text-gray-500 font-bold uppercase">체지방률</p>
             <p className="text-2xl font-bold text-gray-800">{latestInBody.bodyFat}%</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center">
             <div className="bg-purple-50 p-3 rounded-full mb-2">
                 <LineChart className="text-purple-500" size={24} />
             </div>
             <p className="text-xs text-gray-500 font-bold uppercase">BMI / 점수</p>
             <p className="text-2xl font-bold text-gray-800">{latestInBody.score ? `${latestInBody.score}점` : '-'}</p>
         </div>
      </div>

      {/* Action Button */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h4 className="font-bold text-gray-800 text-lg">AI 코칭 리포트 생성</h4>
                <p className="text-sm text-gray-500">생성된 리포트는 회원 상담 및 프로그램 구성에 활용하세요.</p>
            </div>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'}`}
            >
                {isGenerating ? <Loader2 className="animate-spin"/> : <RefreshCw size={20} />}
                {isGenerating ? 'AI 분석 중...' : '운동 계획 생성하기'}
            </button>
         </div>

         {generatedPlan && (
             <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-fade-in-up">
                 <div className="prose prose-indigo max-w-none prose-sm md:prose-base">
                     <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                         {generatedPlan}
                     </pre>
                 </div>
             </div>
         )}
         
         {!generatedPlan && !isGenerating && (
             <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <Brain size={48} className="mx-auto text-indigo-200 mb-3" />
                 <p className="text-gray-400 font-medium">버튼을 눌러 AI 코칭 리포트를 생성해보세요.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default WorkoutAssist;
