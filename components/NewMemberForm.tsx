
import React, { useState, useEffect } from 'react';
import { Member, BehavioralStage, SalesSource } from '../types';
import { UserPlus, X, Upload, Calendar, CreditCard, MapPin, Ruler, Save } from 'lucide-react';

interface NewMemberFormProps {
  initialData?: Member;
  onSave: (member: Member) => void;
  onCancel: () => void;
}

const NewMemberForm: React.FC<NewMemberFormProps> = ({ initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    height: '',
    weight: '',
    goal: '',
    totalSessions: '30',
    joinDate: new Date().toISOString().split('T')[0],
    paymentAmount: '',
    source: 'WalkIn' as SalesSource,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        phoneNumber: initialData.phoneNumber,
        age: initialData.age.toString(),
        gender: initialData.gender,
        height: initialData.height?.toString() || '',
        weight: initialData.initialWeight?.toString() || '',
        goal: initialData.goal,
        totalSessions: initialData.totalSessions.toString(),
        joinDate: initialData.joinDate,
        paymentAmount: initialData.paymentAmount?.toLocaleString() || '',
        source: initialData.source || 'WalkIn',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberId = initialData?.id || Date.now().toString();
    const profileImg = initialData?.profileImage || `https://picsum.photos/200/200?random=${Date.now()}`;
    const usedSessions = initialData?.usedSessions || 0;
    const monthlySessionCount = initialData?.monthlySessionCount || 0;
    const stage = initialData?.behavioralStage || 'Preparation';

    const newMember: Member = {
      id: memberId,
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      age: parseInt(formData.age) || 0,
      gender: formData.gender,
      height: formData.height ? parseFloat(formData.height) : undefined,
      initialWeight: formData.weight ? parseFloat(formData.weight) : undefined,
      joinDate: formData.joinDate,
      profileImage: profileImg,
      goal: formData.goal || '목표를 설정해주세요.',
      status: 'active',
      totalSessions: parseInt(formData.totalSessions) || 10,
      usedSessions: usedSessions,
      monthlySessionCount: monthlySessionCount,
      behavioralStage: stage,
      paymentAmount: parseInt(formData.paymentAmount.replace(/,/g, '')) || 0,
      source: formData.source
    };
    onSave(newMember);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setFormData({ ...formData, paymentAmount: formatted });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {initialData ? <Save className="text-indigo-600" /> : <UserPlus className="text-indigo-600" />}
          {initialData ? '회원 정보 수정' : '신규 회원 등록'}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-6">
          {/* Profile Image Placeholder */}
          <div className="w-32 h-32 bg-gray-100 rounded-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 shrink-0 relative overflow-hidden">
             {initialData ? (
                 <img src={initialData.profileImage} alt="" className="w-full h-full object-cover" />
             ) : (
                <>
                    <Upload size={24} className="mb-1" />
                    <span className="text-xs">사진 등록</span>
                </>
             )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">등록일</label>
                   <div className="relative">
                     <input 
                       required
                       type="date"
                       value={formData.joinDate}
                       onChange={e => setFormData({...formData, joinDate: e.target.value})}
                       className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors pl-10"
                     />
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   </div>
                </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">연락처</label>
              <input 
                required
                type="tel" 
                value={formData.phoneNumber}
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                placeholder="010-0000-0000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">나이</label>
                <input 
                  required
                  type="number" 
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: e.target.value})}
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">성별</label>
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value as 'male' | 'female'})}
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>
            </div>

            {/* Height & Weight Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Ruler size={14} className="text-gray-400" /> 신장 (cm)
                </label>
                <input 
                  type="number" step="0.1"
                  value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})}
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                    {initialData ? '초기 체중 (kg)' : '초기 체중 (kg)'}
                </label>
                <input 
                  type="number" step="0.1"
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                  className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
                  placeholder="70.5"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Sales Source Section */}
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
             <MapPin size={16} /> 가입 경로 (Sales Source)
           </label>
           <select 
             value={formData.source}
             onChange={e => setFormData({...formData, source: e.target.value as SalesSource})}
             className="w-full p-3 bg-gray-200 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700 focus:bg-white"
           >
             <option value="OT">OT (오리엔테이션)</option>
             <option value="Referral">지인 소개</option>
             <option value="FreeTrial">PT 무료 체험</option>
             <option value="WalkIn">워크인 (방문 상담)</option>
             <option value="Other">기타</option>
           </select>
        </div>

        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-4">
             <div className="flex items-center gap-2 mb-2 text-indigo-900 font-bold border-b border-indigo-200 pb-2">
                 <CreditCard size={18}/> 결제 정보 {initialData && '(수정 시 주의)'}
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-indigo-900 mb-1">등록 세션 (횟수)</label>
                   <input 
                     type="number" 
                     value={formData.totalSessions}
                     onChange={e => setFormData({...formData, totalSessions: e.target.value})}
                     className="w-full p-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-indigo-900 mb-1">누적 결제 금액 (원)</label>
                   <div className="relative">
                        <input 
                          type="text" 
                          value={formData.paymentAmount}
                          onChange={handleAmountChange}
                          placeholder="0"
                          className="w-full p-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right pr-8 font-bold text-lg"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">원</span>
                   </div>
                </div>
             </div>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-700 mb-1">운동 목표</label>
           <textarea 
             rows={3}
             value={formData.goal}
             onChange={e => setFormData({...formData, goal: e.target.value})}
             className="w-full p-3 bg-gray-200 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none focus:bg-white transition-colors"
             placeholder="예: 3개월 내 체지방 5kg 감량"
           />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button 
            type="submit" 
            className="px-6 py-3 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition"
          >
            {initialData ? '수정 완료' : '회원 등록 완료'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewMemberForm;
