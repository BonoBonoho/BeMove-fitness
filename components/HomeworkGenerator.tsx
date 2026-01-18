import React, { useState } from 'react';
import { WorkoutEntry } from '../types';
import { generateHomework } from '../services/geminiService';
import { Dumbbell, Send, Copy, RefreshCw, Check, Loader2, Plus } from 'lucide-react';

interface HomeworkGeneratorProps {
  memberId: string;
  memberName: string;
  history: WorkoutEntry[];
}

const BODY_PARTS = [
  { id: '하체', label: '하체 (Legs)' },
  { id: '가슴', label: '가슴 (Chest)' },
  { id: '등', label: '등 (Back)' },
  { id: '어깨', label: '어깨 (Shoulder)' },
  { id: '팔', label: '팔 (Arms)' },
  { id: '코어/복근', label: '코어 (Core)' },
  { id: '유산소', label: '유산소 (Cardio)' },
  { id: '전신', label: '전신 (Full Body)' },
];

const HomeworkGenerator: React.FC<HomeworkGeneratorProps> = ({ memberName, history }) => {
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoutine, setGeneratedRoutine] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const togglePart = (partId: string) => {
    setSelectedParts(prev => 
      prev.includes(partId)
        ? prev.filter(p => p !== partId)
        : [...prev, partId]
    );
  };

  const handleGenerate = async () => {
    if (selectedParts.length === 0) return;

    setIsGenerating(true);
    setGeneratedRoutine('');
    
    // Prepare history context string
    const historyContext = history
      .map(h => `- ${h.title}: ${h.content}`)
      .join('\n')
      .slice(0, 1000); // Limit context length

    const routine = await generateHomework(memberName, historyContext, selectedParts);
    setGeneratedRoutine(routine);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRoutine);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    
    if (navigator.share) {
        navigator.share({
            title: `${memberName}님 숙제`,
            text: generatedRoutine,
        }).catch(console.error);
    } else {
        alert("클립보드에 복사되었습니다. 카카오톡을 열어 붙여넣기 해주세요!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
          <Dumbbell className="text-indigo-200" />
          AI 맞춤 숙제 생성기
        </h3>
        <p className="text-indigo-100 text-sm opacity-90">
          선생님이 없을 때도 회원이 운동 흐름을 놓치지 않도록,<br/>
          지난 수업 내역을 바탕으로 안전한 개인 운동 루틴을 만들어주세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-gray-800">1. 추천받을 부위 선택 (복수 선택 가능)</h4>
               <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">
                 {selectedParts.length}개 선택됨
               </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {BODY_PARTS.map((part) => {
                const isSelected = selectedParts.includes(part.id);
                return (
                  <button
                    key={part.id}
                    onClick={() => togglePart(part.id)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1 shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {part.label}
                    {isSelected ? <Check size={16} /> : <Plus size={16} className="text-gray-300"/>}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={selectedParts.length === 0 || isGenerating}
              className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                selectedParts.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isGenerating
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" />
                  과거 티칭 내역 분석 중...
                </>
              ) : (
                <>
                  <RefreshCw />
                  AI 루틴 생성하기
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output & Send */}
        <div className="space-y-4">
           <h4 className="font-bold text-gray-800 ml-1">2. 전송 메시지 미리보기</h4>
           <div className={`relative bg-yellow-50 rounded-xl border-2 border-yellow-200 p-1 min-h-[300px] flex flex-col ${isGenerating ? 'opacity-50' : 'opacity-100'}`}>
              
              {!generatedRoutine && !isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
                   <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
                     <Send size={24} className="text-indigo-200" />
                   </div>
                   왼쪽에서 부위를 선택하고<br/>생성 버튼을 눌러주세요.
                </div>
              )}

              {generatedRoutine && (
                <>
                  <textarea 
                    value={generatedRoutine}
                    onChange={(e) => setGeneratedRoutine(e.target.value)}
                    className="flex-1 w-full bg-transparent p-4 outline-none resize-none text-gray-800 text-sm leading-relaxed"
                  />
                  <div className="bg-white p-4 rounded-b-lg border-t border-yellow-100 flex gap-2">
                    <button 
                       onClick={handleGenerate}
                       className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center gap-1"
                    >
                      <RefreshCw size={16} /> 다시 생성
                    </button>
                    <button 
                       onClick={handleCopy}
                       className={`flex-[2] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all text-white shadow-sm ${isCopied ? 'bg-green-500' : 'bg-[#FEE500] text-[#3c1e1e] hover:bg-[#FDD835]'}`}
                    >
                      {isCopied ? (
                        <>
                          <Check size={18} /> 복사 완료!
                        </>
                      ) : (
                        <>
                          <Copy size={18} /> 카카오톡 전송 (복사)
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
           </div>
           <p className="text-xs text-gray-500 text-center">
             * '전송' 버튼을 누르면 내용이 복사됩니다. 카카오톡 채팅방에 붙여넣기 하세요.
           </p>
        </div>
      </div>
    </div>
  );
};

export default HomeworkGenerator;