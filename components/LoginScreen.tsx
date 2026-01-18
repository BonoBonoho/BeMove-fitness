
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Lock, User as UserIcon, ArrowRight, Mail, UserPlus, Loader2, Briefcase, MapPin, PlayCircle } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface LoginScreenProps {
    onDemoLogin?: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onDemoLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Additional State
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('TRAINER');
  const [branchName, setBranchName] = useState('야음점'); // Default Branch

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // App.tsx auth listener will handle redirection
    } catch (err: any) {
      console.error(err);
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Auth Profile
      await updateProfile(user, { displayName: name });

      // Save additional user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        username: email,
        name: name,
        role: selectedRole,
        branchName: branchName,
        position: selectedRole === 'MANAGER' ? '지점장' : '트레이너', // Default logic
        email: email,
        createdAt: new Date().toISOString()
      });

      // App.tsx auth listener will handle redirection
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자리 이상이어야 합니다.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists, if not create one with default role
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
         await setDoc(docRef, {
            id: user.uid,
            username: user.email,
            name: user.displayName || 'Google User',
            role: 'MEMBER', // Default to Member for social login
            email: user.email,
            profileImage: user.photoURL,
            createdAt: new Date().toISOString()
         });
      }
    } catch (err: any) {
      console.error(err);
      setError('Google 로그인에 실패했습니다.');
    }
  };

  const handleDemoStart = (role: UserRole) => {
      if (!onDemoLogin) return;

      let demoUser: User;
      
      if (role === 'TRAINER') {
          demoUser = {
              id: 'u2', // Matches mock data in App.tsx
              username: 'demo_trainer',
              name: '강철우',
              role: 'TRAINER',
              position: '팀장',
              branchName: '야음점'
          };
      } else if (role === 'MANAGER') {
           demoUser = {
              id: 'u1',
              username: 'demo_manager',
              name: '김지점',
              role: 'MANAGER',
              position: '지점장',
              branchName: '야음점'
          };
      } else {
           demoUser = {
              id: 'admin',
              username: 'admin',
              name: '관리자',
              role: 'ADMIN',
              position: '총괄'
          };
      }

      onDemoLogin(demoUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        {/* Logo Header */}
        <div className="p-8 text-center bg-gray-50 border-b border-gray-100">
          <div className="h-16 flex items-center justify-center mb-4">
             <img 
               src="/logo.png" 
               alt="BE MOVE FITNESS" 
               className="h-full w-auto object-contain"
               onError={(e) => {
                 e.currentTarget.style.display = 'none';
                 if(e.currentTarget.parentElement) {
                   e.currentTarget.parentElement.innerHTML = '<div class="text-3xl font-black italic text-gray-800">BE <span class="text-indigo-600">MOVE</span></div>';
                 }
               }}
             />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {isRegistering ? '새 계정 만들기' : '피트니스 관리 통합 시스템'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isRegistering ? '필수 정보를 입력하여 가입을 완료하세요' : '로그인하여 서비스를 이용하세요'}
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 text-center font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            
            {/* Register Fields */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">이름</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="본명 입력"
                      className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">직책</label>
                        <div className="relative">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors appearance-none"
                            >
                                <option value="TRAINER">트레이너</option>
                                <option value="MANAGER">지점장</option>
                                <option value="ADMIN">총괄 관리자</option>
                                <option value="MEMBER">회원</option>
                            </select>
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">지점</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                                placeholder="지점명"
                                className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">이메일</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1 uppercase">비밀번호</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력 (6자리 이상)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-200 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 mt-2 disabled:bg-indigo-400"
            >
              {loading ? (
                  <Loader2 className="animate-spin" />
              ) : isRegistering ? (
                  <>회원가입 완료 <UserPlus size={20} /></>
              ) : (
                  <>로그인 <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          {/* Social Login (Only show on Login mode) */}
          {!isRegistering && (
              <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-gray-400 font-medium">데모 체험하기 (설정 불필요)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                     <button 
                        onClick={() => handleDemoStart('TRAINER')}
                        className="flex items-center justify-center gap-2 py-3 px-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl hover:bg-orange-100 transition shadow-sm font-bold text-sm"
                     >
                         <PlayCircle size={18}/> 트레이너 데모
                     </button>
                     <button 
                        onClick={() => handleDemoStart('MANAGER')}
                        className="flex items-center justify-center gap-2 py-3 px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition shadow-sm font-bold text-sm"
                     >
                         <PlayCircle size={18}/> 지점장 데모
                     </button>
                </div>
              </>
          )}

          {/* Toggle Register/Login */}
          <div className="text-center mt-6">
             <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-sm text-indigo-600 font-bold hover:underline"
             >
                {isRegistering ? '이미 계정이 있으신가요? 로그인하기' : '계정이 없으신가요? 회원가입하기'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
