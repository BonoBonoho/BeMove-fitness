
export type BehavioralStage = 'Precontemplation' | 'Contemplation' | 'Preparation' | 'Action' | 'Maintenance';

export type SalesSource = 'OT' | 'Referral' | 'FreeTrial' | 'WalkIn' | 'Other';

export type UserRole = 'ADMIN' | 'MANAGER' | 'TRAINER' | 'MEMBER';

// New Type for managing targets per branch and position
export interface BranchTargetMap {
  [branchName: string]: {
    [position: string]: number;
  };
}

// New Type for Survey Results
export interface SurveyMetrics {
  punctuality: number;      // 시간 약속
  goalAchievement: number;  // 목표 달성정도
  kindness: number;         // 친절함
  professionalism: number;  // PT 수업 전문성
  appearance: number;       // 용모 단정
  durationCompliance: number; // 수업시간 50분 준수 여부
  feedbackReflection: number; // 회원 건의사항 반영
  focus: number;            // 수업집중도
}

export interface SurveyResult {
  id: string;
  trainerId: string;
  memberId: string;
  memberName: string;
  date: string;
  rating: number; // Overall Average or calculated
  metrics: SurveyMetrics;
  comment: string; // Public (Visible to Trainer)
  privateComment?: string; // Private (Visible only to Admin/Manager)
}

// New Type for Gym Equipment
export interface Equipment {
  id: string;
  name: string;
  category: '유산소' | '가슴' | '등' | '하체' | '어깨' | '팔' | '복근/코어' | '기타';
}

export interface User {
  id: string;
  username: string; // Login ID
  name: string;
  role: UserRole;
  position?: string; // Job Title (e.g. 지점장, 팀장, LV3 트레이너...)
  branchName?: string; // Assigned Branch Name
  profileImage?: string;
  memberId?: string; // If role is MEMBER, link to specific member data
}

export interface Member {
  id: string;
  name: string;
  phoneNumber: string; 
  age: number;
  gender: 'male' | 'female';
  height?: number; // cm
  initialWeight?: number; // kg
  joinDate: string;
  profileImage: string;
  goal: string;
  status: 'active' | 'inactive';
  totalSessions: number;
  usedSessions: number;
  monthlySessionCount: number; 
  behavioralStage: BehavioralStage;
  paymentAmount?: number; // Total accumulated revenue
  source?: SalesSource; // Added source field
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  date: string; // ISO string
  amount: number;
  sessionCount: number; // Sessions added
  type: 'New' | 'Renewal';
  source?: SalesSource; // Added source field for tracking
}

export interface Schedule {
  id: string;
  memberId: string;
  memberName: string;
  startTime: string; // ISO Date string
  durationMinutes: number;
  type: 'PT' | 'Consultation';
}

export interface CheckInData {
  conditionScore: number; // 1-5
  sleepHours: number;
  painLevel: string;
}

export interface WorkoutEntry {
  id: string;
  memberId: string;
  date: string;
  title: string;
  durationMinutes: number;
  // 5-5-5 System Data
  checkIn?: CheckInData;
  content: string; // The "Workout" phase
  feedback?: string; // The "Post" phase (Teacher feedback)
  nextGoal?: string; // The "Post" phase (Next session goal)
  burnedCalories?: number; // AI Estimated Calories
}

export interface DietEntry {
  id: string;
  memberId: string;
  date: string; // ISO string
  imageUrl: string;
  description: string;
  calories: number;
  macros: {
    protein: string;
    carbs: string;
    fat: string;
  };
  teacherFeedback?: string;
}

export interface InBodyEntry {
  id: string;
  memberId: string;
  date: string;
  weight: number;     // kg
  muscleMass: number; // kg
  bodyFat: number;    // %
  score?: number;     // InBody Score
}

export enum TabType {
  HOME = 'HOME',
  MEMBER = 'MEMBER',
  REVENUE = 'REVENUE', // Added Revenue Tab
  INSIGHT = 'INSIGHT',
  SCHEDULE = 'SCHEDULE', 
  MEMBER_DETAIL = 'MEMBER_DETAIL',
  EQUIPMENT = 'EQUIPMENT' // New Tab for Manager
}

export enum MemberTab {
  DIET = 'DIET',
  INBODY = 'INBODY',
  WORKOUT = 'WORKOUT',
  GOALS = 'GOALS',
  HOMEWORK = 'HOMEWORK',
  ASSIST = 'ASSIST' // AI Coaching Assist
}
