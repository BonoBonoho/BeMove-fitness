
import React, { useState, useEffect } from 'react';
import { Member, Schedule } from '../types';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, User, X, Check, LayoutGrid, List, Columns } from 'lucide-react';

interface WeeklySchedulerProps {
  members: Member[];
  schedules: Schedule[];
  onAddSchedule: (schedule: Schedule) => void;
}

type ViewMode = 'MONTH' | 'WEEK' | 'DAY';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 9); // 09:00 to 22:00
const DURATION_PRESETS = [30, 50, 60, 90];

const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({ members, schedules, onAddSchedule }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('WEEK');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Form State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('14:00');
  const [duration, setDuration] = useState(50);

  // Initialize selectedMemberId when members load
  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  // --- Date Navigation Logic ---
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() - 7);
    else newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'MONTH') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'WEEK') newDate.setDate(newDate.getDate() + 7);
    else newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  // --- Helper Functions for Calendar Data ---
  const getStartDate = () => {
    const date = new Date(currentDate);
    if (viewMode === 'MONTH') {
      date.setDate(1);
      const day = date.getDay(); // 0(Sun) - 6(Sat)
      date.setDate(date.getDate() - day);
      return date;
    } else if (viewMode === 'WEEK') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to start on Mon? Let's start on Sun for consistency with Month
      date.setDate(date.getDate() - day); // Start on Sunday
      return date;
    }
    return date;
  };

  const getCalendarDays = () => {
    const startDate = getStartDate();
    const days = [];
    const count = viewMode === 'MONTH' ? 42 : (viewMode === 'WEEK' ? 7 : 1);

    for (let i = 0; i < count; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const daysToRender = getCalendarDays();

  // --- Schedule Filtering ---
  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(s => {
      const sDate = new Date(s.startTime);
      return sDate.getFullYear() === date.getFullYear() &&
             sDate.getMonth() === date.getMonth() &&
             sDate.getDate() === date.getDate();
    }).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  // --- Form Handlers ---
  const openAddForm = (date?: Date, hour?: number) => {
    const targetDate = date || currentDate;
    setFormDate(targetDate.toISOString().split('T')[0]);
    if (hour !== undefined) {
      setFormTime(`${hour.toString().padStart(2, '0')}:00`);
    } else {
      setFormTime('14:00'); // Default
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    const startTime = `${formDate}T${formTime}:00`; 
    // Note: In real app, handle timezone carefully. Here we assume local ISO construction.
    
    onAddSchedule({
      id: Date.now().toString(),
      memberId: member.id,
      memberName: member.name,
      startTime: new Date(startTime).toISOString(),
      durationMinutes: duration,
      type: 'PT'
    });
    setIsFormOpen(false);
  };

  // --- Render Components ---

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="text-indigo-600" /> 
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          {viewMode === 'DAY' && ` ${currentDate.getDate()}일`}
        </h2>
        <div className="flex items-center gap-2 mt-2 text-gray-600">
            <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full transition"><ChevronLeft size={24}/></button>
            <button onClick={handleToday} className="px-3 py-1 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition">오늘</button>
            <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full transition"><ChevronRight size={24}/></button>
        </div>
      </div>

      <div className="flex gap-4 items-center w-full md:w-auto">
        <div className="flex bg-gray-100 p-1 rounded-lg">
           <button 
             onClick={() => setViewMode('MONTH')}
             className={`p-2 rounded-md transition flex items-center gap-1 text-sm font-bold ${viewMode === 'MONTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <LayoutGrid size={16} /> 월
           </button>
           <button 
             onClick={() => setViewMode('WEEK')}
             className={`p-2 rounded-md transition flex items-center gap-1 text-sm font-bold ${viewMode === 'WEEK' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <Columns size={16} /> 주
           </button>
           <button 
             onClick={() => setViewMode('DAY')}
             className={`p-2 rounded-md transition flex items-center gap-1 text-sm font-bold ${viewMode === 'DAY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <List size={16} /> 일
           </button>
        </div>

        <button 
          onClick={() => openAddForm()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md flex items-center gap-2 transition ml-auto md:ml-0"
        >
          <Plus size={20} /> 일정 추가
        </button>
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-7 border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
      {WEEK_DAYS.map(day => (
        <div key={day} className="p-3 text-center text-xs font-bold text-gray-500 border-b border-gray-200 bg-gray-50 uppercase">
          {day}
        </div>
      ))}
      {daysToRender.map((date, i) => {
        const isCurrentMonth = date.getMonth() === currentDate.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        const daySchedules = getSchedulesForDay(date);

        return (
          <div 
            key={i} 
            onClick={() => openAddForm(date)}
            className={`min-h-[100px] p-2 border-b border-r border-gray-100 relative hover:bg-gray-50 transition cursor-pointer group ${!isCurrentMonth ? 'bg-gray-50/50' : ''}`}
          >
             <div className="flex justify-between items-start mb-1">
               <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}`}>
                 {date.getDate()}
               </span>
               <button className="opacity-0 group-hover:opacity-100 text-indigo-400 p-1 hover:bg-indigo-100 rounded">
                  <Plus size={14} />
               </button>
             </div>
             
             <div className="space-y-1">
               {daySchedules.slice(0, 3).map(s => (
                 <div key={s.id} className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded truncate font-medium border-l-2 border-indigo-400">
                    {new Date(s.startTime).getHours()}:{new Date(s.startTime).getMinutes().toString().padStart(2, '0')} {s.memberName}
                 </div>
               ))}
               {daySchedules.length > 3 && (
                 <div className="text-[10px] text-gray-400 pl-1">+ {daySchedules.length - 3} more</div>
               )}
             </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Header Row */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
          <div className="p-3 border-r border-gray-200 text-center text-xs text-gray-400 font-bold uppercase flex items-center justify-center">Time</div>
          {daysToRender.map((date, i) => {
             const isToday = date.toDateString() === new Date().toDateString();
             return (
                <div key={i} className={`p-3 text-center border-r border-gray-200 last:border-0 ${isToday ? 'bg-indigo-50/50' : ''}`}>
                  <div className={`text-xs font-bold mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>{WEEK_DAYS[date.getDay()]}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : 'text-gray-800'}`}>{date.getDate()}</div>
                </div>
             );
          })}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto">
          {TIME_SLOTS.map(hour => (
             <div key={hour} className="grid grid-cols-8 min-h-[60px] border-b border-gray-100">
                {/* Time Label */}
                <div className="border-r border-gray-100 p-2 text-xs text-gray-400 font-medium text-center relative">
                    <span className="-mt-3 block">{hour}:00</span>
                </div>
                
                {/* Days Columns */}
                {daysToRender.map((date, i) => {
                   const daySchedules = getSchedulesForDay(date).filter(s => new Date(s.startTime).getHours() === hour);
                   return (
                      <div 
                        key={i}
                        onClick={(e) => {
                             if (e.target === e.currentTarget) openAddForm(date, hour);
                        }}
                        className="border-r border-gray-100 last:border-0 p-1 relative hover:bg-gray-50 transition cursor-pointer group"
                      >
                         {/* Hover Plus */}
                         {daySchedules.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                <Plus className="text-indigo-200" size={20} />
                            </div>
                         )}

                         {daySchedules.map(schedule => (
                             <div key={schedule.id} className="bg-indigo-100 border-l-4 border-indigo-500 p-1 rounded text-[10px] mb-1 cursor-pointer hover:bg-indigo-200 transition shadow-sm z-10">
                                 <div className="font-bold text-indigo-900 truncate flex items-center gap-1">
                                    <User size={10} /> {schedule.memberName}
                                 </div>
                                 <div className="text-indigo-700 truncate">
                                    {schedule.durationMinutes}분
                                 </div>
                             </div>
                         ))}
                      </div>
                   );
                })}
             </div>
          ))}
        </div>
    </div>
  );

  const renderDayView = () => {
    const day = currentDate;
    const daySchedules = getSchedulesForDay(day);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-lg text-gray-800">{day.toLocaleDateString()} ({WEEK_DAYS[day.getDay()]})</span>
              <span className="text-sm text-gray-500">{daySchedules.length}개의 일정</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {TIME_SLOTS.map(hour => {
                 const slotSchedules = daySchedules.filter(s => new Date(s.startTime).getHours() === hour);
                 
                 return (
                    <div key={hour} className="flex gap-4 min-h-[80px] group border-b border-gray-100 pb-2">
                       <div className="w-16 pt-2 text-right text-sm font-bold text-gray-400 border-r border-gray-200 pr-4">
                          {hour}:00
                       </div>
                       <div 
                         className="flex-1 pt-1 relative hover:bg-gray-50 rounded-lg transition p-2 cursor-pointer"
                         onClick={(e) => {
                             if(e.target === e.currentTarget) openAddForm(day, hour);
                         }}
                       >
                           {slotSchedules.length === 0 && (
                              <button className="hidden group-hover:flex items-center gap-1 text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full shadow-sm absolute top-2 left-2 pointer-events-none">
                                 <Plus size={12}/> 일정 추가
                              </button>
                           )}

                           {slotSchedules.map(s => (
                              <div key={s.id} className="bg-white border border-indigo-100 shadow-sm p-3 rounded-lg mb-2 flex justify-between items-center hover:shadow-md transition">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                         <User size={20} />
                                      </div>
                                      <div>
                                         <p className="font-bold text-gray-800 text-sm">{s.memberName} 회원님</p>
                                         <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({s.durationMinutes}분)
                                         </p>
                                      </div>
                                  </div>
                                  <div className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                                      PT
                                  </div>
                              </div>
                           ))}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col animate-fade-in">
      {renderHeader()}
      
      {viewMode === 'MONTH' && renderMonthView()}
      {viewMode === 'WEEK' && renderWeekView()}
      {viewMode === 'DAY' && renderDayView()}

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden">
            <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
               <h3 className="text-xl font-bold flex items-center gap-2">
                 <Calendar className="text-indigo-200" /> 수업 일정 잡기
               </h3>
               <button onClick={() => setIsFormOpen(false)} className="text-white/70 hover:text-white">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Member Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">어떤 회원님인가요?</label>
                <div className="relative">
                  <select 
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-4 pl-12 bg-gray-200 border border-gray-200 rounded-xl appearance-none outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-lg focus:bg-white"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} 회원님</option>
                    ))}
                  </select>
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">날짜</label>
                    <input 
                      type="date" required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">시작 시간</label>
                    <input 
                      type="time" required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full p-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium focus:bg-white"
                    />
                 </div>
              </div>

              {/* Duration */}
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">수업 진행 시간</label>
                 <div className="flex gap-2 mb-3">
                   {DURATION_PRESETS.map(min => (
                     <button
                       key={min}
                       type="button"
                       onClick={() => setDuration(min)}
                       className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                         duration === min 
                           ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                           : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                       }`}
                     >
                       {min}분
                     </button>
                   ))}
                 </div>
                 <div className="relative">
                    <input 
                      type="number" step="5"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full p-3 pl-12 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">분간 진행</span>
                 </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition flex justify-center items-center gap-2">
                  <Check size={20} />
                  일정 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyScheduler;
