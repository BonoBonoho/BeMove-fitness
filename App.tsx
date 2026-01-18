import React, { useState, useEffect } from 'react';
import { 
  Member, 
  DietEntry, 
  InBodyEntry, 
  WorkoutEntry,
  Schedule,
  Transaction,
  User,
  BranchTargetMap,
  SurveyResult,
  Equipment
} from './types';
import LoginScreen from './components/LoginScreen';
import TrainerDashboard from './components/TrainerDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

// --- MOCK DATA ---
// Assigned 'u2' (강철우 Trainer) to some members for demo
const MOCK_MEMBERS: Member[] = [
  { 
    id: '1', name: '김민수', trainerId: 'u2', age: 28, gender: 'male', phoneNumber: '010-1234-5678', joinDate: '2025-01-15', 
    profileImage: 'https://picsum.photos/200/200?random=1', 
    goal: '바디프로필 촬영 및 체지방 10% 달성', status: 'active',
    totalSessions: 30, usedSessions: 22, monthlySessionCount: 12, behavioralStage: 'Action',
    paymentAmount: 1500000, source: 'WalkIn'
  },
  { 
    id: '2', name: '이지은', trainerId: 'u2', age: 34, gender: 'female', phoneNumber: '010-9876-5432', joinDate: '2025-02-20', 
    profileImage: 'https://picsum.photos/200/200?random=2', 
    goal: '체력 증진 및 라운드 숄더 교정', status: 'active',
    totalSessions: 20, usedSessions: 5, monthlySessionCount: 4, behavioralStage: 'Preparation',
    paymentAmount: 1100000, source: 'Referral'
  },
  { 
    id: '3', name: '박준형', trainerId: 'u3', age: 41, gender: 'male', phoneNumber: '010-5555-7777', joinDate: '2024-12-10', 
    profileImage: 'https://picsum.photos/200/200?random=3', 
    goal: '골프 비거리 향상을 위한 코어 운동', status: 'inactive',
    totalSessions: 50, usedSessions: 48, monthlySessionCount: 2, behavioralStage: 'Maintenance',
    paymentAmount: 2200000, source: 'OT'
  },
  { 
    id: '4', name: '최서연', trainerId: 'u2', age: 25, gender: 'female', phoneNumber: '010-1111-2222', joinDate: '2024-11-05', 
    profileImage: 'https://picsum.photos/200/200?random=4', 
    goal: '다이어트 -5kg 감량', status: 'active',
    totalSessions: 10, usedSessions: 2, monthlySessionCount: 8, behavioralStage: 'Contemplation',
    paymentAmount: 600000, source: 'FreeTrial'
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = MOCK_MEMBERS.map(m => ({
    id: `t_${m.id}`,
    memberId: m.id,
    memberName: m.name,
    date: m.joinDate,
    amount: m.paymentAmount || 0,
    sessionCount: m.totalSessions,
    type: 'New',
    source: m.source
}));

const MOCK_SCHEDULES: Schedule[] = [
  { id: 's1', memberId: '1', memberName: '김민수', startTime: new Date().toISOString(), durationMinutes: 50, type: 'PT' },
  { id: 's2', memberId: '2', memberName: '이지은', startTime: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 50, type: 'PT' }, 
];

const MOCK_DIET_ENTRIES: DietEntry[] = [
  {
    id: 'd1', memberId: '1', date: new Date(Date.now() - 86400000).toISOString(),
    imageUrl: 'https://picsum.photos/400/300?food=1',
    description: '닭가슴살 샐러드',
    calories: 350,
    macros: { protein: '30g', carbs: '15g', fat: '8g' },
    teacherFeedback: '아주 훌륭한 식단입니다! 드레싱만 조금 주의해주세요.'
  }
];

const MOCK_INBODY_ENTRIES: InBodyEntry[] = [
  { id: 'i1', memberId: '1', date: '2023-01-15', weight: 80.5, muscleMass: 35.2, bodyFat: 22.0, score: 72 },
  { id: 'i2', memberId: '1', date: '2023-02-15', weight: 78.2, muscleMass: 35.8, bodyFat: 19.5, score: 76 },
  { id: 'i3', memberId: '1', date: '2023-03-15', weight: 76.0, muscleMass: 36.5, bodyFat: 17.0, score: 82 },
];

const MOCK_WORKOUT_ENTRIES: WorkoutEntry[] = [
  { 
    id: 'w1', memberId: '1', date: new Date().toISOString(), title: '하체 루틴', durationMinutes: 60, 
    content: '스쿼트 5세트\n레그 프레스 4세트\n런지 3세트',
    checkIn: { conditionScore: 4, sleepHours: 7, painLevel: '없음' },
    feedback: '자세가 매우 좋아졌습니다. 다음주 증량 가능할 듯.',
    nextGoal: '스쿼트 100kg 도전'
  }
];

// Initial Branch List
const INITIAL_BRANCHES = ["야음점", "병영점", "구영점", "언양점", "천곡점", "상인점", "덕신점", "평산점", "매곡점"];

// Mock Staff for Admin Management
const INITIAL_STAFF: User[] = [
  { id: 'u1', username: 'manager1', name: '김지점', role: 'MANAGER', position: '지점장', branchName: '야음점' },
  { id: 'u2', username: 'trainer1', name: '강철우', role: 'TRAINER', position: '팀장', branchName: '야음점' },
  { id: 'u3', username: 'trainer2', name: '이소라', role: 'TRAINER', position: 'LV3 트레이너', branchName: '야음점' },
  { id: 'u4', username: 'manager2', name: '박병영', role: 'MANAGER', position: '지점장', branchName: '병영점' },
  { id: 'u5', username: 'trainer3', name: '최구영', role: 'TRAINER', position: '트레이너', branchName: '구영점' },
];

const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'e1', name: '러닝머신 (Treadmill)', category: '유산소' },
  { id: 'e2', name: '천국의 계단 (Stair Climber)', category: '유산소' },
  { id: 'e3', name: '벤치 프레스', category: '가슴' },
  { id: 'e4', name: '펙 덱 플라이', category: '가슴' },
  { id: 'e5', name: '랫 풀 다운', category: '등' },
  { id: 'e6', name: '시티드 로우', category: '등' },
  { id: 'e7', name: '레그 프레스', category: '하체' },
  { id: 'e8', name: '레그 익스텐션', category: '하체' },
  { id: 'e9', name: '숄더 프레스 머신', category: '어깨' },
  { id: 'e10', name: '케이블 크로스 오버', category: '기타' },
];

// Default Targets by Position
const DEFAULT_TARGETS: Record<string, number> = {
  "팀장": 11000000,
  "부팀장": 11000000,
  "LV3 트레이너": 10000000,
  "트레이너": 9000000,
  "수습1": 3500000,
  "수습2": 5500000,
  "수습3": 9000000,
};

// Initial Mock Survey Results
const INITIAL_SURVEY_RESULTS: SurveyResult[] = [
  { 
    id: 's1', trainerId: 'u2', memberId: '1', memberName: '김민수', date: '2025-01-20', rating: 5, 
    metrics: { 
      punctuality: 5, goalAchievement: 5, kindness: 5, professionalism: 5, 
      appearance: 5, durationCompliance: 5, feedbackReflection: 5, focus: 5 
    }, 
    comment: '수업이 너무 체계적이고 좋아요!',
    privateComment: '가끔 수업 시간에 핸드폰을 보시는 것 같아 아쉽습니다.'
  },
  { 
    id: 's2', trainerId: 'u2', memberId: '2', memberName: '이지은', date: '2025-01-22', rating: 4, 
    metrics: { 
      punctuality: 4, goalAchievement: 4, kindness: 5, professionalism: 4, 
      appearance: 5, durationCompliance: 5, feedbackReflection: 3, focus: 4 
    }, 
    comment: '친절하게 잘 가르쳐주십니다.',
    privateComment: '시설 샤워실 청소 상태가 조금 미흡해요.'
  },
  { 
    id: 's3', trainerId: 'u3', memberId: '3', memberName: '박준형', date: '2025-01-25', rating: 5, 
    metrics: { 
      punctuality: 5, goalAchievement: 5, kindness: 5, professionalism: 5, 
      appearance: 5, durationCompliance: 5, feedbackReflection: 5, focus: 5 
    }, 
    comment: '최고의 트레이너 선생님!',
    privateComment: ''
  },
];

const App: React.FC = () => {
  // --- Global State ---
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [initError, setInitError] = useState(false);

  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [dietEntries, setDietEntries] = useState<DietEntry[]>(MOCK_DIET_ENTRIES);
  const [inBodyEntries, setInBodyEntries] = useState<InBodyEntry[]>(MOCK_INBODY_ENTRIES);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>(MOCK_WORKOUT_ENTRIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>(INITIAL_SURVEY_RESULTS);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [pendingEquipment, setPendingEquipment] = useState<string[]>([]);
  
  // New State for Staff & Branch Management
  const [staffList, setStaffList] = useState<User[]>(INITIAL_STAFF);
  const [branches, setBranches] = useState<string[]>(INITIAL_BRANCHES);
  
  // Custom Targets per Branch and Position
  const [branchTargets, setBranchTargets] = useState<BranchTargetMap>({});

  // --- Firebase Auth Listener ---
  useEffect(() => {
    let unsubscribe: () => void;
    
    // Safety timeout: If Firebase fails to init, stop loading so user can at least see Login (Demo)
    const safetyTimer = setTimeout(() => {
        if (loading) {
            console.warn("Firebase init timed out or failed. Showing login screen.");
            setLoading(false);
            setInitError(true);
        }
    }, 2500);

    try {
        if (auth) {
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                clearTimeout(safetyTimer);
                if (firebaseUser) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as User;
                            setUser({ ...userData, id: firebaseUser.uid });
                        } else {
                            setUser(null);
                        }
                    } catch (error) {
                        console.error("Error fetching user data:", error);
                        setUser(null);
                    }
                }
                setLoading(false);
            });
        } else {
             // Auth not initialized (likely due to missing config in firebase.ts)
             throw new Error("Auth service not available");
        }
    } catch (e) {
        console.error("Firebase Auth Error:", e);
        // Fallback to allow demo login
        setLoading(false);
        setInitError(true);
    }

    return () => {
        if (unsubscribe) unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, []);

  // --- Helper: Get Target for a specific user ---
  const getStaffTarget = (staff: User) => {
    if (!staff.branchName || !staff.position) return 0;
    
    // Branch Managers have no individual sales target
    if (staff.position === '지점장') return 0;

    // Check for custom override first
    if (branchTargets[staff.branchName] && branchTargets[staff.branchName][staff.position]) {
      return branchTargets[staff.branchName][staff.position];
    }
    
    // Fallback to default
    return DEFAULT_TARGETS[staff.position] || 0;
  };

  // --- Branch Management Handlers ---
  const handleAddBranch = (name: string) => {
    if (!branches.includes(name)) {
      setBranches(prev => [...prev, name]);
    }
  };

  const handleUpdateBranch = (oldName: string, newName: string) => {
    setBranches(prev => prev.map(b => b === oldName ? newName : b));
    setStaffList(prev => prev.map(staff => staff.branchName === oldName ? { ...staff, branchName: newName } : staff));
    
    // Update target map key if exists
    if (branchTargets[oldName]) {
      setBranchTargets(prev => {
        const newData = { ...prev };
        newData[newName] = newData[oldName];
        delete newData[oldName];
        return newData;
      });
    }
  };

  const handleDeleteBranch = (name: string) => {
    setBranches(prev => prev.filter(b => b !== name));
    setStaffList(prev => prev.map(staff => staff.branchName === name ? { ...staff, branchName: '' } : staff));
    setBranchTargets(prev => {
      const newData = { ...prev };
      delete newData[name];
      return newData;
    });
  };

  const handleUpdateTargets = (branch: string, position: string, amount: number) => {
    setBranchTargets(prev => ({
      ...prev,
      [branch]: {
        ...(prev[branch] || {}),
        [position]: amount
      }
    }));
  };

  const handleAddSurveyResult = (result: SurveyResult) => {
      setSurveyResults(prev => [result, ...prev]);
  };

  // --- Equipment Management Handlers ---
  const handleReportNewEquipment = (machineName: string) => {
    if (!equipmentList.find(e => e.name === machineName) && !pendingEquipment.includes(machineName)) {
        setPendingEquipment(prev => [...prev, machineName]);
    }
  };

  const handleApproveEquipment = (name: string, category: Equipment['category']) => {
      const newEq: Equipment = {
          id: `e_${Date.now()}`,
          name: name,
          category: category
      };
      setEquipmentList(prev => [...prev, newEq]);
      setPendingEquipment(prev => prev.filter(item => item !== name));
  };

  const handleRejectEquipment = (name: string) => {
      setPendingEquipment(prev => prev.filter(item => item !== name));
  };

  const handleLogout = async () => {
    try {
        if (auth) await signOut(auth);
        setUser(null);
    } catch (error) {
        console.error("Logout Error:", error);
        setUser(null);
    }
  };

  const handleUpdateStaff = (updatedUser: User) => {
    setStaffList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user && user.id === updatedUser.id) {
        setUser(updatedUser);
    }
  };

  // --- Demo Login Handler ---
  const handleDemoLogin = (demoUser: User) => {
      setUser(demoUser);
  };

  // --- Router Logic ---
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center">
                <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">로그인 정보를 확인 중입니다...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="relative">
             {initError && (
                 <div className="bg-orange-100 text-orange-800 p-2 text-center text-xs font-bold fixed top-0 w-full z-50 flex justify-center items-center gap-2">
                     <AlertTriangle size={14}/>
                     Firebase 설정이 올바르지 않아 '데모 모드'만 사용 가능합니다.
                 </div>
             )}
            <LoginScreen onDemoLogin={handleDemoLogin} />
            
            {/* Version Footer */}
            <div className="fixed bottom-2 right-2 text-xs text-gray-400 flex items-center gap-1 opacity-50 hover:opacity-100 transition">
               <ShieldCheck size={12}/> BE MOVE v2.0 (Stable)
            </div>
        </div>
    );
  }

  // Calculate current month's stats for dashboards
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  if (user.role === 'ADMIN') {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
        staffList={staffList}
        onUpdateStaff={handleUpdateStaff}
        allMembers={members}
        allTransactions={transactions}
        branches={branches}
        onAddBranch={handleAddBranch}
        onUpdateBranch={handleUpdateBranch}
        onDeleteBranch={handleDeleteBranch}
        // Stats Props
        getStaffTarget={getStaffTarget}
        branchTargets={branchTargets}
        onUpdateTargets={handleUpdateTargets}
        surveyResults={surveyResults}
        // Equipment Props
        equipmentList={equipmentList}
        setEquipmentList={setEquipmentList}
        pendingEquipment={pendingEquipment}
        onApproveEquipment={handleApproveEquipment}
        onRejectEquipment={handleRejectEquipment}
      />
    );
  }

  if (user.role === 'MANAGER') {
    return (
      <ManagerDashboard 
        user={user} 
        onLogout={handleLogout}
        transactions={transactions}
        members={members}
        staffList={staffList} // Pass full staff list to calculate branch stats
        getStaffTarget={getStaffTarget}
        surveyResults={surveyResults}
        equipmentList={equipmentList}
        setEquipmentList={setEquipmentList}
        pendingEquipment={pendingEquipment}
        onApproveEquipment={handleApproveEquipment}
        onRejectEquipment={handleRejectEquipment}
      />
    );
  }

  if (user.role === 'MEMBER') {
    // In a real app, you would fetch member data from Firestore based on user.memberId
    // For now, we simulate finding the member by user.memberId or fallback
    const memberData = members.find(m => m.id === user.memberId) || members[0]; 
    
    return (
      <MemberDashboard
        user={user}
        memberData={memberData}
        onLogout={handleLogout}
        dietEntries={dietEntries.filter(e => e.memberId === memberData.id)}
        workoutEntries={workoutEntries.filter(e => e.memberId === memberData.id)}
        inBodyEntries={inBodyEntries.filter(e => e.memberId === memberData.id)}
        schedules={schedules.filter(s => s.memberId === memberData.id)}
        onAddDiet={(entry) => setDietEntries(prev => [entry, ...prev])}
        onAddWorkout={(entry) => setWorkoutEntries(prev => [entry, ...prev])}
        onAddInBody={(entry) => setInBodyEntries(prev => [...prev, entry])}
        onAddSurveyResult={handleAddSurveyResult}
        equipmentList={equipmentList} 
        onReportNewEquipment={handleReportNewEquipment}
      />
    );
  }

  // Trainer Dashboard Logic
  // Filter members to only show those assigned to this trainer (or new unassigned ones if needed)
  // For this demo, we assume trainers only see their own assigned members + any unassigned members
  const myMembers = members.filter(m => m.trainerId === user.id || !m.trainerId);

  // Calculate specific revenue for this trainer
  const personalRevenue = user.name === '강철우' 
    ? transactions.filter(t => t.date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0) * 0.6
    : transactions.filter(t => t.date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0) * 0.2; // fallback

  const personalTarget = getStaffTarget(user);

  return (
    <TrainerDashboard
      user={user}
      onLogout={handleLogout}
      members={myMembers} // PASS FILTERED MEMBERS
      setMembers={setMembers}
      schedules={schedules.filter(s => myMembers.map(m=>m.id).includes(s.memberId))}
      setSchedules={setSchedules}
      dietEntries={dietEntries.filter(d => myMembers.map(m=>m.id).includes(d.memberId))}
      setDietEntries={setDietEntries}
      inBodyEntries={inBodyEntries.filter(i => myMembers.map(m=>m.id).includes(i.memberId))}
      setInBodyEntries={setInBodyEntries}
      workoutEntries={workoutEntries.filter(w => myMembers.map(m=>m.id).includes(w.memberId))}
      setWorkoutEntries={setWorkoutEntries}
      transactions={transactions}
      setTransactions={setTransactions}
      // Stats
      monthlyRevenue={personalRevenue}
      monthlyTarget={personalTarget}
      // Survey
      surveyResults={surveyResults.filter(s => s.trainerId === user.id)}
      onAddSurveyResult={handleAddSurveyResult}
      // Equipment
      equipmentList={equipmentList}
      onReportNewEquipment={handleReportNewEquipment}
    />
  );
};

export default App;