import React from 'react';
import { Member } from '../types';
import { ChevronRight, AlertTriangle, Star, Activity, Phone } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  onClick: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onClick }) => {
  // Logic for Tags
  const isRisk = member.monthlySessionCount < 6;
  const renewalNeeded = (member.usedSessions / member.totalSessions) >= 0.7;
  const isVIP = member.totalSessions >= 50; // Example criteria for VIP

  return (
    <div 
      onClick={() => onClick(member)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col gap-4 group relative overflow-hidden"
    >
      {/* Background Status Indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${isRisk ? 'bg-red-500' : 'bg-green-500'}`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={member.profileImage} 
              alt={member.name} 
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-50"
            />
            {renewalNeeded && (
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white p-1 rounded-full border-2 border-white" title="재등록 상담 필요">
                <AlertTriangle size={10} fill="currentColor" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">{member.name}</h3>
              {isVIP && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
            </div>
            <p className="text-sm text-gray-500 mb-1">{member.gender === 'male' ? '남성' : '여성'} · {member.age}세</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
               <Phone size={10} />
               {member.phoneNumber}
            </div>
          </div>
        </div>
        <div className="text-gray-300 group-hover:text-indigo-500 transition-colors">
          <ChevronRight size={24} />
        </div>
      </div>

      {/* Progress & Badges */}
      <div className="space-y-3">
        <div>
           <div className="flex justify-between text-xs mb-1">
             <span className="text-gray-500">세션 소진율 ({member.usedSessions}/{member.totalSessions})</span>
             <span className={`font-bold ${renewalNeeded ? 'text-orange-600' : 'text-indigo-600'}`}>
               {Math.round((member.usedSessions / member.totalSessions) * 100)}%
             </span>
           </div>
           <div className="w-full bg-gray-100 rounded-full h-1.5">
             <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${renewalNeeded ? 'bg-orange-400' : 'bg-indigo-500'}`}
                style={{ width: `${(member.usedSessions / member.totalSessions) * 100}%` }}
             ></div>
           </div>
        </div>

        <div className="flex flex-wrap gap-2">
           <span className={`px-2 py-1 rounded-md text-xs font-medium border ${isRisk ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
             {isRisk ? '⚠️ 월 6회 미만 (위험)' : '✅ 월 6회 이상 (안정)'}
           </span>
           <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
             <Activity size={10} />
             {member.behavioralStage}
           </span>
        </div>
      </div>
    </div>
  );
};

export default MemberCard;