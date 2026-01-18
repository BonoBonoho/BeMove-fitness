
import React, { useState, useRef } from 'react';
import { InBodyEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trophy, TrendingUp, TrendingDown, Minus, Camera, Loader2, Sparkles } from 'lucide-react';
import { analyzeInBodyImage } from '../services/geminiService';

interface InBodyTrackerProps {
  memberId: string;
  entries: InBodyEntry[];
  onAddEntry: (entry: InBodyEntry) => void;
}

const InBodyTracker: React.FC<InBodyTrackerProps> = ({ memberId, entries, onAddEntry }) => {
  const [showForm, setShowForm] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    weight: '',
    muscleMass: '',
    bodyFat: '',
    score: ''
  });

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const previousEntry = sortedEntries.length > 1 ? sortedEntries[sortedEntries.length - 2] : null;
  
  // Format data for chart
  const chartData = sortedEntries.map(entry => ({
    name: new Date(entry.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }),
    체중: entry.weight,
    골격근량: entry.muscleMass,
    체지방률: entry.bodyFat,
    점수: entry.score || 0
  }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setShowForm(true); // Open form to show progress/result

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      
      // Call Gemini API
      const result = await analyzeInBodyImage(base64);
      
      setFormData({
        weight: result.weight.toString(),
        muscleMass: result.muscleMass.toString(),
        bodyFat: result.bodyFat.toString(),
        score: result.score.toString()
      });
      
      setIsAnalyzing(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: InBodyEntry = {
      id: Date.now().toString(),
      memberId,
      date: new Date().toISOString(),
      weight: parseFloat(formData.weight),
      muscleMass: parseFloat(formData.muscleMass),
      bodyFat: parseFloat(formData.bodyFat),
      score: formData.score ? parseFloat(formData.score) : undefined
    };
    onAddEntry(newEntry);
    setFormData({ weight: '', muscleMass: '', bodyFat: '', score: '' });
    setShowForm(false);
  };

  const getChange = (current?: number, prev?: number) => {
      if (current === undefined || prev === undefined) return null;
      const diff = current - prev;
      return {
          val: Math.abs(diff).toFixed(1),
          dir: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
      };
  };

  const scoreChange = getChange(latestEntry?.score, previousEntry?.score);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Score Summary Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
          <div>
              <p className="text-indigo-100 text-sm font-medium mb-1 flex items-center gap-1">
                  <Trophy size={16} /> InBody 종합 점수
              </p>
              <div className="flex items-end gap-3">
                  <h2 className="text-5xl font-extrabold">{latestEntry?.score || '-'}</h2>
                  <span className="text-2xl font-bold opacity-80 mb-1">점</span>
              </div>
          </div>
          <div className="text-right">
              {scoreChange && (
                  <div className={`flex items-center gap-1 font-bold ${scoreChange.dir === 'up' ? 'text-green-300' : scoreChange.dir === 'down' ? 'text-red-300' : 'text-gray-300'}`}>
                      {scoreChange.dir === 'up' ? <TrendingUp size={20}/> : scoreChange.dir === 'down' ? <TrendingDown size={20}/> : <Minus size={20}/>}
                      <span className="text-xl">{scoreChange.val}</span>
                  </div>
              )}
              <p className="text-xs text-indigo-100 opacity-70">지난 측정 대비</p>
          </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-gray-800">변화 그래프</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-100 transition border border-indigo-200"
            >
              <Camera size={16} />
              AI 결과지 분석
            </button>
            <input 
               type="file" 
               accept="image/*"
               ref={fileInputRef}
               className="hidden"
               onChange={handleFileChange}
            />
            <button 
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-800 transition"
            >
              <Plus size={16} />
              직접 입력
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-200 relative overflow-hidden">
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-indigo-600">
                 <Loader2 className="w-8 h-8 animate-spin mb-2" />
                 <p className="text-sm font-bold animate-pulse">인바디 결과지를 분석 중입니다...</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                    {isAnalyzing ? <Sparkles size={16} className="text-indigo-400"/> : <Plus size={16}/>}
                    {isAnalyzing ? 'AI가 수치를 읽어오고 있습니다' : '새로운 측정 기록 입력'}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                    <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">체중 (kg)</label>
                    <input 
                        type="number" step="0.1" required
                        value={formData.weight}
                        onChange={e => setFormData({...formData, weight: e.target.value})}
                        className="w-full p-2 bg-gray-200 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors focus:bg-white"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">골격근량 (kg)</label>
                    <input 
                        type="number" step="0.1" required
                        value={formData.muscleMass}
                        onChange={e => setFormData({...formData, muscleMass: e.target.value})}
                        className="w-full p-2 bg-gray-200 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors focus:bg-white"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">체지방률 (%)</label>
                    <input 
                        type="number" step="0.1" required
                        value={formData.bodyFat}
                        onChange={e => setFormData({...formData, bodyFat: e.target.value})}
                        className="w-full p-2 bg-gray-200 border border-gray-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors focus:bg-white"
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-indigo-600 mb-1">인바디 점수</label>
                    <input 
                        type="number"
                        value={formData.score}
                        onChange={e => setFormData({...formData, score: e.target.value})}
                        placeholder="선택"
                        className="w-full p-2 bg-gray-200 border border-indigo-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors focus:bg-white"
                    />
                    </div>
                    <button 
                    type="submit"
                    className="bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 transition"
                    >
                    저장
                    </button>
                </div>
            </form>
          </div>
        )}

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" tick={{fontSize: 12}} domain={['auto', 'auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} domain={[0, 100]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="체중" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              <Line yAxisId="left" type="monotone" dataKey="골격근량" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              <Line yAxisId="left" type="monotone" dataKey="체지방률" stroke="#f59e0b" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
              <Line yAxisId="right" type="monotone" dataKey="점수" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <th className="py-3 px-4">날짜</th>
                <th className="py-3 px-4 text-red-600">체중 (kg)</th>
                <th className="py-3 px-4 text-blue-600">골격근량 (kg)</th>
                <th className="py-3 px-4 text-yellow-600">체지방률 (%)</th>
                <th className="py-3 px-4 text-indigo-600">점수</th>
              </tr>
            </thead>
            <tbody>
              {[...sortedEntries].reverse().map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-gray-600">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{entry.weight}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{entry.muscleMass}</td>
                  <td className="py-3 px-4 font-bold text-gray-800">{entry.bodyFat}</td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{entry.score || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InBodyTracker;
