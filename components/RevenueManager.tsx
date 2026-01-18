
import React, { useState } from 'react';
import { Member, Transaction, SalesSource } from '../types';
import { DollarSign, TrendingUp, Plus, CreditCard, X, Check, PieChart, Users, Repeat } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface RevenueManagerProps {
  members: Member[];
  transactions: Transaction[];
  onAddTransaction: (memberId: string, amount: number, sessions: number, date: string) => void;
}

const RevenueManager: React.FC<RevenueManagerProps> = ({ members, transactions, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [sessions, setSessions] = useState('10');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Statistics Calculation ---
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  
  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthKey));

  // 1. Total Revenue
  const currentMonthRevenue = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 2. New vs Renewal Breakdown
  const newTransactions = currentMonthTransactions.filter(t => t.type === 'New');
  const renewalTransactions = currentMonthTransactions.filter(t => t.type === 'Renewal');

  const newRevenue = newTransactions.reduce((sum, t) => sum + t.amount, 0);
  const renewalRevenue = renewalTransactions.reduce((sum, t) => sum + t.amount, 0);

  // 3. Sales Source Analysis (Only for New)
  const sourceStats: Record<SalesSource, { count: number; amount: number }> = {
    OT: { count: 0, amount: 0 },
    Referral: { count: 0, amount: 0 },
    FreeTrial: { count: 0, amount: 0 },
    WalkIn: { count: 0, amount: 0 },
    Other: { count: 0, amount: 0 },
  };

  newTransactions.forEach(t => {
    if (t.source && sourceStats[t.source]) {
      sourceStats[t.source].count += 1;
      sourceStats[t.source].amount += t.amount;
    }
  });

  const sourceLabels: Record<SalesSource, string> = {
    OT: 'OT (오리엔테이션)',
    Referral: '지인 소개',
    FreeTrial: 'PT 무료 체험',
    WalkIn: '워크인',
    Other: '기타'
  };

  const maxSourceAmount = Math.max(...Object.values(sourceStats).map(s => s.amount), 1); // Avoid div by 0

  // 4. Monthly Chart Data
  const calculateMonthlyRevenue = () => {
    const revenueByMonth: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        revenueByMonth[key] = 0;
    }

    transactions.forEach(t => {
       const key = t.date.slice(0, 7);
       if (revenueByMonth[key] !== undefined) {
         revenueByMonth[key] += t.amount;
       } else if (new Date(t.date) > new Date(now.getFullYear(), now.getMonth() - 6, 1)) {
         revenueByMonth[key] = (revenueByMonth[key] || 0) + t.amount;
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


  // --- Handlers ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !amountStr) return;

    const numericAmount = parseInt(amountStr.replace(/,/g, ''));
    const numericSessions = parseInt(sessions);

    onAddTransaction(selectedMemberId, numericAmount, numericSessions, date);
    
    setIsModalOpen(false);
    setAmountStr('');
    setSessions('10');
    setDate(new Date().toISOString().split('T')[0]);
    setSelectedMemberId('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setAmountStr(formatted);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">매출 관리</h2>
           <p className="text-gray-500 mt-1">신규 유입 경로 분석 및 재등록 현황을 관리합니다.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 transition"
        >
          <CreditCard size={20} />
          매출 등록 (재등록)
        </button>
      </header>

      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-4 relative overflow-hidden">
             <div className="absolute right-0 top-0 h-full w-20 bg-indigo-50 transform skew-x-12 translate-x-10" />
             <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 z-10">
                 <DollarSign size={28} />
             </div>
             <div className="z-10">
                 <p className="text-sm text-gray-500 font-medium">이번 달 총 매출</p>
                 <h3 className="text-2xl font-extrabold text-gray-800">{currentMonthRevenue.toLocaleString()}원</h3>
             </div>
        </div>

        {/* New Sales Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center gap-4 relative overflow-hidden">
             <div className="absolute right-0 top-0 h-full w-20 bg-green-50 transform skew-x-12 translate-x-10" />
             <div className="bg-green-100 p-4 rounded-full text-green-600 z-10">
                 <Users size={28} />
             </div>
             <div className="z-10">
                 <p className="text-sm text-gray-500 font-medium">신규 매출 (건수)</p>
                 <h3 className="text-xl font-extrabold text-gray-800">
                    {newRevenue.toLocaleString()}원
                    <span className="text-sm font-medium text-green-600 ml-2">({newTransactions.length}건)</span>
                 </h3>
             </div>
        </div>

        {/* Renewal Sales Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center gap-4 relative overflow-hidden">
             <div className="absolute right-0 top-0 h-full w-20 bg-purple-50 transform skew-x-12 translate-x-10" />
             <div className="bg-purple-100 p-4 rounded-full text-purple-600 z-10">
                 <Repeat size={28} />
             </div>
             <div className="z-10">
                 <p className="text-sm text-gray-500 font-medium">재등록 매출 (건수)</p>
                 <h3 className="text-xl font-extrabold text-gray-800">
                    {renewalRevenue.toLocaleString()}원
                    <span className="text-sm font-medium text-purple-600 ml-2">({renewalTransactions.length}건)</span>
                 </h3>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. Monthly Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-gray-400"/>
                최근 6개월 매출 추이
            </h3>
            <div className="h-[300px]">
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
                                <Cell key={`cell-${index}`} fill={entry.fullDate === currentMonthKey ? '#4f46e5' : '#cbd5e1'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. Sales Source Breakdown (List View) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-gray-400"/>
                신규 유입 경로 분석 (이번 달)
             </h3>
             <div className="flex-1 space-y-5 overflow-y-auto pr-2">
                 {(Object.keys(sourceStats) as SalesSource[]).map((source) => {
                    const stat = sourceStats[source];
                    const percent = (stat.amount / maxSourceAmount) * 100;
                    
                    return (
                        <div key={source}>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-gray-700">{sourceLabels[source]}</span>
                                <span className="text-xs font-bold text-gray-900">
                                    {stat.amount.toLocaleString()}원 <span className="text-gray-400 font-normal">({stat.count}건)</span>
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${stat.amount > 0 ? percent : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                 })}
                 
                 {newTransactions.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
                        <p>이번 달 신규 매출 데이터가 없습니다.</p>
                    </div>
                 )}
             </div>
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">최근 거래 내역</h3>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                     <tr>
                         <th className="px-4 py-3">날짜</th>
                         <th className="px-4 py-3">회원명</th>
                         <th className="px-4 py-3">구분</th>
                         <th className="px-4 py-3">유입경로</th>
                         <th className="px-4 py-3 text-right">금액</th>
                         <th className="px-4 py-3 text-right">세션</th>
                     </tr>
                 </thead>
                 <tbody>
                     {[...transactions].reverse().slice(0, 10).map(t => (
                         <tr key={t.id} className="border-b hover:bg-gray-50">
                             <td className="px-4 py-3 text-gray-500">{t.date}</td>
                             <td className="px-4 py-3 font-medium text-gray-900">{t.memberName}</td>
                             <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'New' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                    {t.type === 'New' ? '신규' : '재등록'}
                                </span>
                             </td>
                             <td className="px-4 py-3 text-gray-600">
                                {t.type === 'New' && t.source ? sourceLabels[t.source] : '-'}
                             </td>
                             <td className="px-4 py-3 text-right font-bold text-indigo-600">{t.amount.toLocaleString()}원</td>
                             <td className="px-4 py-3 text-right text-gray-600">+{t.sessionCount}회</td>
                         </tr>
                     ))}
                 </tbody>
             </table>
          </div>
      </div>

      {/* Modal for Renewal Payment (Simple, No Source Needed) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
                <div className="bg-gray-900 text-white p-6 rounded-t-2xl flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <CreditCard className="text-indigo-400" /> 매출 등록 (재등록)
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">회원 선택</label>
                        <div className="relative">
                            <select 
                                required
                                value={selectedMemberId}
                                onChange={e => setSelectedMemberId(e.target.value)}
                                className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                            >
                                <option value="">회원을 선택하세요</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.phoneNumber.slice(-4)})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">추가 세션 수</label>
                             <input 
                                type="number" 
                                required
                                value={sessions}
                                onChange={e => setSessions(e.target.value)}
                                className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right focus:bg-white"
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-bold text-gray-700 mb-2">결제 일자</label>
                             <input 
                                type="date" 
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                             />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">결제 금액 (원)</label>
                         <div className="relative">
                            <input 
                                type="text" 
                                required
                                value={amountStr}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-right pr-8 font-bold text-lg focus:bg-white"
                             />
                             <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                         </div>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-lg text-xs text-indigo-700">
                        * 등록 시 해당 회원의 잔여 세션이 자동으로 증가하고, 총 결제 금액이 갱신됩니다.
                    </div>

                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg transition flex items-center justify-center gap-2">
                        <Check size={20} />
                        결제 등록 완료
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManager;
