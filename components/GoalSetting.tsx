import React, { useState } from 'react';
import { Target, Save } from 'lucide-react';

interface GoalSettingProps {
  currentGoal: string;
  onUpdateGoal: (newGoal: string) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ currentGoal, onUpdateGoal }) => {
  const [goal, setGoal] = useState(currentGoal);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onUpdateGoal(goal);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
          <Target className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">나의 운동 목표</h3>
          <p className="text-indigo-100 text-sm mb-6">
            명확한 목표 설정은 운동 효과를 극대화하는 첫 걸음입니다.
            회원님의 목표를 구체적으로 설정해주세요.
          </p>
          
          <div className="relative">
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[120px]"
              placeholder="예: 3개월 안에 체지방 5kg 감량하고 바디프로필 촬영하기"
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all duration-200 ${
                  isSaved 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                {isSaved ? '저장 완료!' : (
                  <>
                    <Save size={18} />
                    목표 저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalSetting;