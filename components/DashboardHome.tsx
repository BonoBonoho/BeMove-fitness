import React from 'react';
import { Member } from '../types';
import { AlertTriangle, TrendingUp, Calendar, ArrowRight, Activity, Users } from 'lucide-react';

interface DashboardHomeProps {
  members: Member[];
  onNavigateToMember: (member: Member) => void;
  onRegisterMember: () => void;
  onViewReport: () => void; // Added Prop
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ members, onNavigateToMember, onRegisterMember, onViewReport }) => {
  // Logic: Retention Alerts
  const lowFrequencyMembers = members.filter(m => m.monthlySessionCount < 6);
  const renewalNeededMembers = members.filter(m => (m.usedSessions / m.totalSessions) >= 0.7);

  const quickActions = [
    { 
      label: '신규 회원 등록', 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600', 
      onClick: onRegisterMember 
    },
    { 
      label: '매출 리포트', 
      icon: TrendingUp, 
      color: 'bg-green-50 text-green-600', 
      onClick: onViewReport // Now calls the handler
    },
    { 
      label: '식단 피드백', 
      icon: Activity, 
      color: 'bg-purple-50 text-purple-600', 
      onClick: () => alert('회원 상세 페이지에서 식단을 관리해주세요.') 
    },
    { 
      label: '일정 관리', 
      icon: Calendar, 
      color: 'bg-indigo-50 text-indigo-600', 
      onClick: () => document.getElementById('tab-schedule')?.click() 
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">오늘의 관리 현황</h2>
        <p className="text-gray-500 mt-1">회원님의 재등록 타이밍과 이탈 위험을 놓치지 마세요.</p>
      </header>

      {/* Top Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retention Alert Card */}
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
            <h3 className="font-bold text-orange-800 flex items-center gap-2">
              <AlertTriangle size={20} /> 재등록 상담 필요 (70% 소진)
            </h3>
            <span className="bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded-full border border-orange-200">
              {renewalNeededMembers.length}명
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {renewalNeededMembers.length > 0 ? renewalNeededMembers.map(member => (
              <div key={member.id} className="p-4 flex justify-between items-center hover:bg-orange-50/30 transition cursor-pointer" onClick={() => onNavigateToMember(member)}>
                <div className="flex items-center gap-3">
                  <img src={member.profileImage} className="w-10 h-10 rounded-full" alt="" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{member.name} 회원님</p>
                    <p className="text-xs text-gray-500">잔여: {member.totalSessions - member.usedSessions}회 / 총 {member.totalSessions}회</p>
                  </div>
                </div>
                <button className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md hover:bg-orange-200 font-medium">
                  상담하기
                </button>
              </div>
            )) : (
              <div className="p-6 text-center text-gray-400 text-sm">
                현재 재등록 대상 회원이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Risk Group Alert Card */}
        <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
            <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Activity size={20} /> 관리 필요 (월 6회 미만 출석)
            </h3>
            <span className="bg-white text-red-600 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
              {lowFrequencyMembers.length}명
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {lowFrequencyMembers.length > 0 ? lowFrequencyMembers.map(member => (
               <div key={member.id} className="p-4 flex justify-between items-center hover:bg-red-50/30 transition cursor-pointer" onClick={() => onNavigateToMember(member)}>
                <div className="flex items-center gap-3">
                  <img src={member.profileImage} className="w-10 h-10 rounded-full grayscale" alt="" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{member.name} 회원님</p>
                    <p className="text-xs text-gray-500">이번 달 출석: {member.monthlySessionCount}회</p>
                  </div>
                </div>
                <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 font-medium">
                  연락하기
                </button>
              </div>
            )) : (
              <div className="p-6 text-center text-gray-400 text-sm">
                모든 회원이 열심히 운동 중입니다!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Schedule Mock */}
      <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-16 blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-end">
            <div>
                <h3 className="text-xl font-bold mb-2">오늘의 수업 일정</h3>
                <p className="text-indigo-200 text-sm mb-6">오후 수업이 3개 예정되어 있습니다. 컨디션 체크를 잊지 마세요!</p>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {/* Mock Schedule Items */}
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 min-w-[200px]">
                        <p className="text-indigo-300 text-xs font-bold mb-1">14:00 - 14:50</p>
                        <p className="font-bold text-lg mb-1">{members[0]?.name} 회원님</p>
                        <p className="text-xs text-white/70">상체 근력 강화 루틴</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 min-w-[200px]">
                        <p className="text-indigo-300 text-xs font-bold mb-1">19:00 - 19:50</p>
                        <p className="font-bold text-lg mb-1">{members[1]?.name} 회원님</p>
                        <p className="text-xs text-white/70">다이어트 서킷 트레이닝</p>
                    </div>
                </div>
            </div>
            <div className="hidden md:block">
                <Calendar className="w-24 h-24 text-white/10" />
            </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
            <button 
              key={idx} 
              onClick={action.onClick}
              className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition flex flex-col items-center justify-center gap-2 h-32 active:scale-95 duration-100"
            >
                <div className={`p-3 rounded-full ${action.color} mb-1`}>
                    <action.icon size={24} />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardHome;