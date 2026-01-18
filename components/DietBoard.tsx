
import React, { useState, useRef } from 'react';
import { DietEntry } from '../types';
import { analyzeFoodImage, generateEncouragement } from '../services/geminiService';
import { Camera, Send, Loader2, MessageCircle, Sparkles } from 'lucide-react';

interface DietBoardProps {
  memberId: string;
  memberName: string;
  entries: DietEntry[];
  onAddEntry: (entry: DietEntry) => void;
  onAddFeedback?: (entryId: string, feedback: string) => void;
}

const DietBoard: React.FC<DietBoardProps> = ({ memberId, memberName, entries, onAddEntry, onAddFeedback }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      setIsAnalyzing(true);

      // AI Analysis
      const analysis = await analyzeFoodImage(base64);
      // const autoFeedback = await generateEncouragement(memberName, analysis.description); // Optional auto feedback

      const newEntry: DietEntry = {
        id: Date.now().toString(),
        memberId,
        date: new Date().toISOString(),
        imageUrl: base64,
        description: analysis.description,
        calories: analysis.calories,
        macros: analysis.macros,
        teacherFeedback: "" 
      };
      
      onAddEntry(newEntry);
      setIsAnalyzing(false);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleFeedbackSubmit = (entryId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const feedback = formData.get('feedback') as string;
    if (feedback.trim() && onAddFeedback) {
      onAddFeedback(entryId, feedback);
      e.currentTarget.reset();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-500" />
          식단 업로드
        </h3>
        
        <div 
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">AI가 칼로리와 영양소를 분석중입니다...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-500 mb-2">오늘 먹은 식단을 촬영하여 올려주세요</p>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                사진 선택하기
              </button>
            </>
          )}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              <img src={entry.imageUrl} alt={entry.description} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-gray-800">{entry.description}</h4>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">
                  {entry.calories} kcal
                </span>
              </div>
              
              <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                      <Sparkles size={14} className="text-indigo-500"/>
                      <span className="text-xs font-bold text-indigo-600">AI 영양 분석</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded p-2 border border-gray-100">
                      <p className="text-xs text-gray-500">탄수화물</p>
                      <p className="font-semibold text-gray-800">{entry.macros.carbs}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100">
                      <p className="text-xs text-gray-500">단백질</p>
                      <p className="font-semibold text-gray-800">{entry.macros.protein}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 border border-gray-100">
                      <p className="text-xs text-gray-500">지방</p>
                      <p className="font-semibold text-gray-800">{entry.macros.fat}</p>
                    </div>
                  </div>
              </div>

              {entry.teacherFeedback ? (
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 animate-fade-in">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-800">선생님 피드백</span>
                  </div>
                  <p className="text-sm text-indigo-900">{entry.teacherFeedback}</p>
                </div>
              ) : (
                onAddFeedback && (
                    <form onSubmit={(e) => handleFeedbackSubmit(entry.id, e)} className="relative mt-2">
                      <input
                        name="feedback"
                        type="text"
                        placeholder="회원님에게 피드백을 남겨주세요..."
                        className="w-full pl-3 pr-10 py-2 bg-gray-200 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                )
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-400">
            아직 등록된 식단이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default DietBoard;
