
import React, { useState } from 'react';
import { Member, SurveyResult, User } from '../types';
import { FileText, Send, PieChart, TrendingUp, DollarSign, Star, ClipboardList, CheckCircle2, MessageSquare, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface InsightPanelProps {
  members: Member[];
  user?: User; // Current User (Trainer)
  surveyResults?: SurveyResult[]; // Passed from App
  onAddSurveyResult?: (result: SurveyResult) => void;
}

const InsightPanel: React.FC<InsightPanelProps> = ({ members, user, surveyResults = [], onAddSurveyResult }) => {
  const [isSent, setIsSent] = useState(false);

  // 1. Calculate Monthly Revenue
  const calculateMonthlyRevenue = () => {
    const revenueByMonth: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        revenueByMonth[key] = 0;
    }

    members.forEach(member => {
        if (member.paymentAmount && member.joinDate) {
            const key = member.joinDate.slice(0, 7); // YYYY-MM
            if (revenueByMonth[key] !== undefined) {
                revenueByMonth[key] += member.paymentAmount;
            } else if (new Date(member.joinDate) > new Date(now.getFullYear(), now.getMonth() - 6, 1)) {
                 revenueByMonth[key] = (revenueByMonth[key] || 0) + member.paymentAmount;
            }
        }
    });

    return Object.entries(revenueByMonth)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        name: `${parseInt(date.split('-')[1])}월`,
        fullDate: date,
        amount: amount
      }));
  };

  const chartData = calculateMonthlyRevenue();
  
  // Current Month Total
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthRevenue = members
    .filter(m => m.joinDate.startsWith(currentMonthKey) && m.paymentAmount)
    .reduce((sum, m) => sum + (m.paymentAmount || 0), 0);

  // --- Survey Logic ---
  
  // Filter for current trainer
  const myResults = user ? surveyResults.filter(r => r.trainerId === user.id) : surveyResults;
  
  // Calc Averages
  const totalRating = myResults.reduce((acc, r) => acc + r.rating, 0);
  const avgRating = myResults.length > 0 ? (totalRating / myResults.length).toFixed(1) : "0.0";
  
  const calculateAvg = (key: keyof SurveyResult['metrics']) => {
      if (myResults.length === 0) return 0;
      return myResults.reduce((acc, r) => acc + (r.metrics[key] || 0), 0) / myResults.length;
  };

  const metricsChartData = [
    { name: '시간 약속', score: calculateAvg('punctuality') },
    { name: '목표 달성', score: calculateAvg('goalAchievement') },
    { name: '친절함', score: calculateAvg('kindness') },
    { name: '전문성', score: calculateAvg('professionalism') },
    { name: '용모 단정', score: calculateAvg('appearance') },
    { name: '시간 준수', score: calculateAvg('durationCompliance') },
    { name: '피드백', score: calculateAvg('feedbackReflection') },
    { name: '집중도', score: calculateAvg('focus') },
  ];

  const handleSendSurvey = () => {
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
    alert("대상 회원 3명에게 만족도 조사 링크가 발송되었습니다.");
  };

  const handleSimulateReply = () => {
     if (!onAddSurveyResult || !user) return;
     
     const randomScore = Math.floor(Math.random() * 2) + 4; // 4 or 5 mostly
     const newResult: SurveyResult = {
         id: `s_${Date.now()}`,
         trainerId: user.id,
         memberId: 'simulated',
         memberName: '익명 회원',
         date: new Date().toISOString().split('T')[0],
         rating: randomScore,
         metrics: {
             punctuality: 5,
             goalAchievement: Math.floor(Math.random() * 2) + 4,
             kindness: 5,
             professionalism: 5,
             appearance: 5,
             durationCompliance: 5,
             feedbackReflection: Math.floor(Math.random() * 2) + 4,
             focus: 5,
         },
         comment: '선생님 수업 덕분에 몸이 많이 좋아졌습니다. 감사합니다!',
         privateComment: '가끔 수업 시간이 1-2분 일찍 끝나는 것 같아요.'
     };
     onAddSurveyResult(newResult);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">인사이트 & 매출 리포트</h2>
        <p className="text-gray-500 mt-1">센터 운영 현황과 회원 피드백을 한눈에 확인하세요.</p>
      </header>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Total Revenue Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-indigo-100 relative overflow-hidden lg:col-span-1">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                 <DollarSign size={120} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                    <span className="font-bold text-gray-500">이 달의 매출 ({new Date().getMonth() + 1}월)</span>
                </div>
                <h3 className="text-4xl font-extrabold text-gray-800 mb-2">
                    {currentMonthRevenue.toLocaleString()} <span className="text-2xl text-gray-400 font-medium">원</span>
                </h3>
                <p className="text-sm text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-1 rounded">
                    신규 등록 {members.filter(m => m.joinDate.startsWith(currentMonthKey)).length}건
                </p>
             </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-6">최근 6개월 매출 추이</h3>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                            tickFormatter={(value) => `${value / 10000}만`}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`${value.toLocaleString()}원`, '매출']}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fullDate === currentMonthKey ? '#4f46e5' : '#e5e7eb'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Survey Sender */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-start gap-4 mb-4">
                 <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <Send size={24} />
                </div>
                <div>
                     <h3 className="text-xl font-bold text-gray-800">만족도 조사 발송</h3>
                     <p className="text-gray-500 text-sm">수업 50% 이상 진행 시 자동으로 추천됩니다.</p>
                </div>
            </div>
            
            <div className="bg-white p-3 rounded-lg mb-4 border border-indigo-100 flex justify-between items-center">
                <div>
                    <span className="text-xs font-bold text-indigo-900 block">이번 주 발송 대상</span>
                    <span className="text-xs text-gray-500">김민수, 이지은, 박준형 회원님</span>
                </div>
                 <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full font-bold">3명</span>
            </div>
            
            <button 
                onClick={handleSendSurvey}
                disabled={isSent}
                className={`w-full py-3 rounded-lg font-bold transition shadow-md flex items-center justify-center gap-2 ${isSent ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
                {isSent ? <><CheckCircle2 size={18}/> 발송 완료!</> : '설문 링크 일괄 전송'}
            </button>
        </div>

        {/* Survey Analysis (Trainer Self-Feedback) */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                     <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center text-yellow-600 shrink-0">
                        <Star size={24} fill="currentColor" />
                    </div>
                    <div>
                         <h3 className="text-xl font-bold text-gray-800">나의 수업 만족도</h3>
                         <div className="flex items-center gap-2">
                             <span className="text-3xl font-extrabold text-gray-900">{avgRating}</span>
                             <div className="flex text-yellow-400">
                                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" className={i > Math.round(parseFloat(avgRating)) ? 'text-gray-300' : ''}/>)}
                             </div>
                             <span className="text-xs text-gray-400">({myResults.length}건 응답)</span>
                         </div>
                    </div>
                </div>
                <button onClick={handleSimulateReply} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded flex items-center gap-1">
                    <RefreshCw size={12}/> 가상 응답 생성
                </button>
            </div>

            {/* Metrics Chart */}
            <div className="h-[250px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsChartData} layout="vertical" margin={{top:0, right:30, left:30, bottom:0}}>
                         <XAxis type="number" domain={[0, 5]} hide />
                         <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                         <Tooltip cursor={{fill: 'transparent'}} />
                         <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} background={{ fill: '#f3f4f6' }}>
                            <LabelList dataKey="score" position="right" formatter={(val: number) => val.toFixed(1)} style={{fill:'#4b5563', fontSize:10, fontWeight:'bold'}} />
                         </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recent Comments */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <h4 className="font-bold text-gray-700 mb-3 text-sm flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-500" /> 최근 피드백
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {myResults.length > 0 ? myResults.slice(0, 5).map(result => (
                        <div key={result.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-gray-700">{result.memberName}님</span>
                                <span className="text-[10px] text-gray-400">{result.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-snug">"{result.comment}"</p>
                            {/* Private comment is purposely omitted here for Trainer view */}
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-400 text-xs">
                            아직 도착한 피드백이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default InsightPanel;
