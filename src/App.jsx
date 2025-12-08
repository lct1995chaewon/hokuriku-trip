import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  CloudSnow, 
  Camera, 
  CreditCard, 
  Trash2, 
  CloudRain,
  Sun,
  Umbrella,
  Cloud,
  CloudLightning,
  RefreshCw,
  ShieldAlert,
  Phone,
  ExternalLink,
  AlertTriangle,
  Award,
  CheckCircle2,
  Trophy,
  Clock,
  Plus,
  MapPin,
  X,
  Image as ImageIcon,
  Edit2,
  ScanLine,
  Sparkles,
  Loader2,
  Plane,
  ChevronRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';

// --- API Key & Config ---

// 1. 設定 Gemini API Key
const apiKey = "AIzaSyDtHSygulqJEVLdT-3apvPcs4_vpvOTchw"; 

// 2. Firebase 設定
let firebaseConfig;
try {
  // 嘗試讀取環境變數
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error('Environment config not found');
  }
} catch (e) {
  // --- 您的個人 Firebase 設定 ---
  firebaseConfig = {
    apiKey: "AIzaSyBp8BT3jNSo_46-5dfWLkJ69wSEtlv5PZ4",
    authDomain: "hokuriku-trip.firebaseapp.com",
    projectId: "hokuriku-trip",
    storageBucket: "hokuriku-trip.firebasestorage.app",
    messagingSenderId: "170805929872",
    appId: "1:170805929872:web:ade0f3cc9f27ad7a84f515",
    measurementId: "G-4Q500J33FZ"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-hokuriku-trip';

// --- 輔助資料 ---
const DATES = [
  "12/22 (日)", "12/23 (一)", "12/24 (二)", "12/25 (三)", 
  "12/26 (四)", "12/27 (五)", "12/28 (六)", "12/29 (日)"
];

const DEFAULT_FLIGHTS = {
  "day-0": [
    {
      id: "default-flight-outbound",
      time: "14:30",
      title: "✈️ HKG -> KMQ",
      note: "抵達小松 19:00",
      createdAt: 0,
      isSystem: true
    }
  ],
  "day-7": [
    {
      id: "default-flight-inbound",
      time: "19:45",
      title: "✈️ KMQ -> HKG",
      note: "抵達香港 23:35",
      createdAt: 9999999999999,
      isSystem: true
    }
  ]
};

const CITIES = [
  { name: "金澤 (Kanazawa)", lat: 36.5613, lon: 136.6562 },
  { name: "富山 (Toyama)", lat: 36.6959, lon: 137.2137 },
  { name: "高岡 (Takaoka)", lat: 36.7550, lon: 137.0210 },
  { name: "黑部/宇奈月 (Kurobe)", lat: 36.8145, lon: 137.5815 },
  { name: "冰見 (Himi)", lat: 36.8546, lon: 136.9757 },
];

const MISSIONS = [
  { id: 'kanazawa_gold', title: '金澤奢華', desc: '吃一支金箔雪糕', location: '金澤', icon: '🍦' },
  { id: 'kenrokuen_snow', title: '兼六園之冬', desc: '拍下「雪吊」松樹', location: '金澤', icon: '🌲' },
  { id: 'omicho_seafood', title: '市場大胃王', desc: '在近江町市場吃海鮮', location: '金澤', icon: '🦀' },
  { id: 'toyama_black', title: '富山黑魂', desc: '挑戰富山黑拉麵', location: '富山', icon: '🍜' },
  { id: 'takaoka_doraemon', title: '尋找哆啦A夢', desc: '與哆啦A夢角色銅像合照', location: '高岡', icon: '🐱' },
  { id: 'himi_buri', title: '冰見王者', desc: '品嚐寒鰤魚(Buri)料理', location: '冰見', icon: '🐟' },
  { id: 'unazuki_onsen', title: '峽谷暖意', desc: '在宇奈月溫泉泡湯/足湯', location: '宇奈月', icon: '♨️' },
  { id: 'winter_train', title: '鐵道旅情', desc: '搭乘新幹線或特色列車', location: '北陸', icon: '🚅' },
];

// --- 輔助函式：圖片壓縮與處理 ---
// 這可以解決手機照片太大或格式(HEIC)不支援的問題
const processImageForAI = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // 設定最大寬度或高度，避免圖片過大
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 轉成 JPEG 格式，品質 0.8 (這會解決 HEIC 格式問題)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-zinc-900/90 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 ring-1 ring-white/10">
            <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
                <button 
                    onClick={onClose}
                    className="flex-1 py-3 rounded-2xl font-bold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors"
                >
                    取消
                </button>
                <button 
                    onClick={onConfirm}
                    className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500/80 hover:bg-red-500 shadow-lg shadow-red-500/20 transition-colors"
                >
                    刪除
                </button>
            </div>
        </div>
    </div>
  );
}

// --- App 主元件 ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary'); 

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
            await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
            await signInAnonymously(auth);
        }
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-zinc-800">
      
      {/* 1. 氛圍背景光 (Ambient Glow) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-purple-600/10 blur-[80px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] rounded-full bg-cyan-600/5 blur-[90px]"></div>
      </div>

      {/* 頂部導航 */}
      <header className="bg-black/30 backdrop-blur-md pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-lg">
          {activeTab === 'itinerary' && <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">北陸之旅 <span className="text-blue-400 font-mono text-lg">12/22-29</span></span>}
          {activeTab === 'weather' && <span className="bg-gradient-to-r from-blue-200 to-indigo-300 bg-clip-text text-transparent">天氣預報</span>}
          {activeTab === 'expenses' && <span className="bg-gradient-to-r from-emerald-200 to-teal-300 bg-clip-text text-transparent">消費記帳</span>}
          {activeTab === 'safety' && <span className="text-red-400 flex items-center gap-2"><ShieldAlert className="fill-red-400/20"/> 防災資訊</span>}
          {activeTab === 'missions' && <span className="bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">成就挑戰</span>}
        </h1>
      </header>

      {/* 主要內容區 */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth scrollbar-hide z-10">
        {!user ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'itinerary' && <ItineraryView user={user} />}
            {activeTab === 'weather' && <WeatherView />}
            {activeTab === 'expenses' && <ExpensesView user={user} />}
            {activeTab === 'safety' && <SafetyView />}
            {activeTab === 'missions' && <MissionsView user={user} />}
          </>
        )}
      </main>

      {/* 2. 懸浮導航島 (Floating Dock) */}
      <nav className="absolute bottom-6 left-4 right-4 h-16 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full z-30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-5 h-full items-center justify-items-center relative">
            <TabButton 
                icon={<Calendar size={20} />} 
                label="行程" 
                active={activeTab === 'itinerary'} 
                onClick={() => setActiveTab('itinerary')} 
            />
            <TabButton 
                icon={<CloudSnow size={20} />} 
                label="天氣" 
                active={activeTab === 'weather'} 
                onClick={() => setActiveTab('weather')} 
            />
            
            {/* 中央突出按鈕 (Missions) */}
            <div className="relative flex justify-center items-center w-full h-full">
                <button 
                    onClick={() => setActiveTab('missions')}
                    className={`absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center border-4 border-black transition-all shadow-lg
                        ${activeTab === 'missions' 
                            ? 'bg-amber-400 text-black shadow-amber-400/40 scale-110' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                    <Trophy size={24} className={activeTab === 'missions' ? 'fill-black/20' : ''} />
                </button>
            </div>

            <TabButton 
                icon={<CreditCard size={20} />} 
                label="記帳" 
                active={activeTab === 'expenses'} 
                onClick={() => setActiveTab('expenses')} 
            />
            <TabButton 
                icon={<ShieldAlert size={20} />} 
                label="防災" 
                active={activeTab === 'safety'} 
                onClick={() => setActiveTab('safety')}
                isAlert 
            />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ icon, label, active, onClick, isAlert }) {
  let activeColor = isAlert ? 'text-red-400' : 'text-cyan-400';
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-full h-full
        ${active ? `${activeColor} scale-110` : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <div className="relative">
        {icon}
        {active && <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isAlert ? 'bg-red-400' : 'bg-cyan-400'}`}></span>}
      </div>
      <span className="text-[10px] font-medium opacity-80">{label}</span>
    </button>
  );
}

// --- 5. 任務成就視圖 ---
function MissionsView({ user }) {
  const [completedMissions, setCompletedMissions] = useState({});
  const [activeMission, setActiveMission] = useState(null); 
  const [proofImage, setProofImage] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'missions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data();
      });
      setCompletedMissions(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleMissionClick = (mission) => {
    if (completedMissions[mission.id]) return; 
    setActiveMission(mission);
    setProofImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProofImage(url);
    }
  };

  const confirmCompletion = async () => {
    if (!activeMission || !proofImage) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'missions', activeMission.id);
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    await setDoc(docRef, {
      completed: true,
      completedAt: serverTimestamp(),
      title: activeMission.title,
      hasProof: true 
    });
    setActiveMission(null);
    setProofImage(null);
  };

  const completedCount = Object.keys(completedMissions).length;
  const progress = (completedCount / MISSIONS.length) * 100;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 text-white p-6 rounded-[2rem] shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)] relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-4 opacity-20 text-amber-400 rotate-12 transform scale-150 origin-top-right">
          <Trophy size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-2xl font-black text-amber-400 tracking-tight">成就紀錄</h2>
              <p className="text-amber-100/60 text-xs font-mono uppercase tracking-widest">北陸探險家</p>
            </div>
            <div className="text-4xl font-black font-mono text-white drop-shadow-md">
              {completedCount}<span className="text-lg text-white/40">/{MISSIONS.length}</span>
            </div>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 mt-4 overflow-hidden backdrop-blur-sm">
            <div 
              className="bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(251,191,36,0.6)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {MISSIONS.map((mission) => {
          const isDone = !!completedMissions[mission.id];
          return (
            <button
              key={mission.id}
              onClick={() => handleMissionClick(mission)}
              disabled={isDone}
              className={`relative p-4 rounded-3xl border text-left transition-all duration-300 group overflow-hidden
                ${isDone 
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(245,158,11,0.15)]' 
                  : 'bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60 hover:border-white/10 active:scale-[0.98]'
                }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-black/30 border border-white/5 transition-all ${isDone ? 'scale-110 shadow-lg shadow-amber-500/20' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                    {mission.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide uppercase ${isDone ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500 border-white/5'}`}>
                        {mission.location}
                      </span>
                      {isDone && <CheckCircle2 size={12} className="text-amber-400" />}
                    </div>
                    <div className={`font-bold text-base ${isDone ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                      {mission.title}
                    </div>
                  </div>
                </div>
                {!isDone && <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-white/60 group-hover:border-white/30 transition-all"><Plus size={16}/></div>}
              </div>
            </button>
          );
        })}
      </div>

      {activeMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
             {/* 裝飾背景 */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-6 relative z-10">
                <h3 className="text-2xl font-black flex items-center gap-3 text-white">
                    <span className="text-4xl">{activeMission.icon}</span> 
                    <span>{activeMission.title}</span>
                </h3>
                <button onClick={() => setActiveMission(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-colors">
                    <X size={18} />
                </button>
             </div>
             
             <p className="text-zinc-400 mb-8 text-sm leading-relaxed border-l-2 border-amber-500/30 pl-4">{activeMission.desc}</p>

             <div 
               onClick={() => fileInputRef.current?.click()}
               className={`border-2 border-dashed rounded-3xl h-56 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative overflow-hidden group
                 ${proofImage ? 'border-amber-500/50 bg-black' : 'border-zinc-700 bg-zinc-800/30 hover:border-amber-500/50 hover:bg-zinc-800/50'}`}
             >
                {proofImage ? (
                    <img src={proofImage} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="proof" />
                ) : (
                    <div className="flex flex-col items-center gap-3 transform group-hover:scale-105 transition-transform duration-300">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-400 group-hover:bg-amber-900/20 transition-colors">
                            <Camera size={28} />
                        </div>
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider group-hover:text-zinc-300">上傳證明照片</span>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
             </div>

             <button 
                onClick={confirmCompletion}
                disabled={!proofImage}
                className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/20 disabled:opacity-30 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
                {proofImage ? '✨ 領取成就獎章' : '請先上傳照片'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 1. 行程視圖 ---
function ItineraryView({ user }) {
  const [plans, setPlans] = useState({});
  const [activities, setActivities] = useState({});
  const [activeDay, setActiveDay] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'itinerary');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const legacyData = {};
      const itemsData = {};
      snapshot.forEach(doc => {
        const d = doc.data();
        legacyData[doc.id] = d.content || "";
        itemsData[doc.id] = d.items || [];
      });

      Object.keys(DEFAULT_FLIGHTS).forEach(key => {
        if (!itemsData[key]) {
           itemsData[key] = DEFAULT_FLIGHTS[key];
        }
      });

      setPlans(legacyData);
      setActivities(itemsData);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user]);

  const handleAddActivity = async () => {
    if (!newTitle) return;
    const docId = `day-${activeDay}`;
    const currentItems = activities[docId] || [];
    const newItem = {
      id: Date.now().toString(),
      time: newTime || '待定',
      title: newTitle,
      note: newNote,
      createdAt: Date.now()
    };
    const newItems = [...currentItems, newItem];
    newItems.sort((a, b) => a.time.localeCompare(b.time));
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'itinerary', docId);
    await setDoc(docRef, { items: newItems }, { merge: true });
    setIsAdding(false);
    setNewTime('');
    setNewTitle('');
    setNewNote('');
  };

  const confirmDeleteActivity = async () => {
    if(!deleteTargetId) return;
    const docId = `day-${activeDay}`;
    const currentItems = activities[docId] || [];
    const newItems = currentItems.filter(i => i.id !== deleteTargetId);
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'itinerary', docId);
    await setDoc(docRef, { items: newItems }, { merge: true }); 
    setDeleteTargetId(null);
  };

  const currentDayId = `day-${activeDay}`;
  const dayActivities = activities[currentDayId] || [];
  const legacyContent = plans[currentDayId];
  const hasItems = (dayIndex) => {
    const docId = `day-${dayIndex}`;
    return (activities[docId] && activities[docId].length > 0) || (plans[docId] && plans[docId].length > 0);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-4 gap-2 mb-6 px-1">
        {DATES.map((dateStr, index) => {
          const [date, weekDay] = dateStr.split(' ');
          const isActive = activeDay === index;
          const hasActivity = hasItems(index);
          
          return (
            <button
              key={index}
              onClick={() => setActiveDay(index)}
              className={`relative flex flex-col items-center justify-center py-4 rounded-2xl transition-all duration-300 border
                ${isActive 
                  ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105 z-10' 
                  : 'bg-zinc-900/60 text-zinc-500 border-white/5 hover:bg-zinc-800/80 hover:border-white/10'}`}
            >
              <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1.5 ${isActive ? 'text-zinc-900/60' : 'text-zinc-600'}`}>DAY {index + 1}</span>
              <span className="text-sm font-bold leading-none">{date}</span>
              {hasActivity && (
                <div className={`absolute bottom-2 w-1 h-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-zinc-600'}`}></div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-zinc-900/40 backdrop-blur-md rounded-[2rem] p-6 min-h-[400px] border border-white/5 relative shadow-inner">
          <div className="flex justify-between items-center mb-8">
            <div>
                <h3 className="font-black text-2xl text-white tracking-tight">{DATES[activeDay]}</h3>
                <p className="text-zinc-500 text-xs font-mono mt-1">ITINERARY</p>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-blue-500 text-white w-10 h-10 rounded-full hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>

          {dayActivities.length === 0 && !legacyContent && (
             <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Clock size={32} />
                </div>
                <p className="text-sm font-bold">尚未安排行程</p>
                <p className="text-xs">點擊 + 新增活動</p>
             </div>
          )}

          <div className="space-y-6 relative pl-3">
            {dayActivities.length > 0 && (
                <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
            )}

            {dayActivities.map((item) => (
              <div key={item.id} className="relative flex gap-5 items-start group">
                <div className={`z-10 w-3 h-3 rounded-full mt-2.5 flex-shrink-0 ring-4 ring-black 
                    ${item.title.includes('✈️') 
                        ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' 
                        : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse'}`}>
                </div>
                
                <div className={`flex-1 rounded-2xl p-4 transition-all relative border group-hover:-translate-y-1 duration-300
                    ${item.title.includes('✈️') 
                        ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20' 
                        : 'bg-zinc-800/40 border-white/5 hover:bg-zinc-800/60'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold tracking-wide
                                    ${item.title.includes('✈️') 
                                        ? 'bg-amber-500/20 text-amber-300' 
                                        : 'bg-blue-500/20 text-blue-300'}`}>
                                    {item.time}
                                </span>
                                {item.title.includes('✈️') && <Plane size={12} className="text-amber-400" />}
                            </div>
                            <div className={`font-bold text-lg mb-1 ${item.title.includes('✈️') ? 'text-amber-100' : 'text-white'}`}>{item.title}</div>
                            {item.note && (
                                <div className="flex items-start gap-1.5 text-zinc-400 text-xs">
                                    <MapPin size={12} className="mt-0.5 opacity-50" />
                                    {item.note}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setDeleteTargetId(item.id)}
                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
              </div>
            ))}
          </div>

          {legacyContent && (
            <div className="mt-10 pt-6 border-t border-dashed border-zinc-800/50">
                <div className="text-[10px] font-black text-zinc-600 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <Edit2 size={10} /> 舊筆記
                </div>
                <div className="text-sm text-zinc-400 whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5 font-mono leading-relaxed">
                    {legacyContent}
                </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteActivity}
        title="移除行程？"
        message="確定要刪除這個活動安排嗎？"
      />

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-white">新增活動</h3>
                    <button onClick={() => setIsAdding(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 ml-1 uppercase tracking-wider">時間</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"/>
                            <input 
                                type="time" 
                                className="w-full bg-black/50 border border-white/10 text-white rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 ml-1 uppercase tracking-wider">活動內容</label>
                        <input 
                            type="text" 
                            placeholder="例：兼六園散步"
                            className="w-full bg-black/50 border border-white/10 text-white rounded-2xl p-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-700"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 ml-1 uppercase tracking-wider">地點 / 備註</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"/>
                            <input 
                                type="text" 
                                placeholder="例：記得買門票"
                                className="w-full bg-black/50 border border-white/10 text-white rounded-2xl p-4 pl-12 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-700"
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleAddActivity}
                        disabled={!newTitle}
                        className="w-full bg-blue-500 text-white py-4 rounded-2xl font-bold mt-4 disabled:opacity-30 hover:bg-blue-400 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                    >
                        確認新增
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// --- 4. 防災視圖 ---
function SafetyView() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-4">
        <a href="tel:110" className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-[2rem] flex flex-col items-center justify-center border border-white/5 hover:border-red-500/50 transition-all active:scale-95 group relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
            <Phone className="text-red-500 mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={32} />
            <div className="font-black text-white text-3xl font-mono tracking-tighter">110</div>
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">警察局</div>
        </a>
        <a href="tel:119" className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-[2rem] flex flex-col items-center justify-center border border-white/5 hover:border-red-500/50 transition-all active:scale-95 group relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
            <div className="relative">
                <Phone className="text-red-500 mb-3 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={32} />
                <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-red-600/50">EMG</div>
            </div>
            <div className="font-black text-white text-3xl font-mono tracking-tighter">119</div>
            <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-1">消防 / 救護</div>
        </a>
      </div>

      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-8 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(220,38,38,0.4)] relative overflow-hidden border border-red-500/30">
          <div className="absolute -right-8 -top-8 opacity-20 rotate-12 text-black mix-blend-overlay">
            <ShieldAlert size={150} />
          </div>
          <h3 className="font-bold text-xl mb-6 flex items-center gap-3 relative z-10 text-white">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><ShieldAlert size={20} /></div>
            緊急求助卡
          </h3>
          <div className="bg-white text-black p-6 rounded-2xl text-center shadow-2xl relative z-10 mx-auto max-w-xs transform rotate-1 hover:rotate-0 transition-transform">
              <p className="text-4xl font-black mb-1 text-red-600 tracking-tight">助けてください</p>
              <p className="text-xs text-zinc-400 font-mono mb-4 tracking-widest uppercase">Tasukete Kudasai</p>
              <div className="h-px bg-zinc-100 my-4 w-1/2 mx-auto"></div>
              <p className="text-lg font-bold text-zinc-800">請幫幫我</p>
              <p className="text-xs text-zinc-400 font-medium">Please help me</p>
          </div>
          <p className="text-red-100/60 text-[10px] mt-6 text-center relative z-10 uppercase tracking-widest">遇到困難時請向周圍日本人出示此卡</p>
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[2rem]">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
            <AlertTriangle className="text-orange-500" size={16} />
            官方資訊連結
        </h3>
        <div className="space-y-3">
            <ExternalLinkItem 
                title="Google 避難所地圖" 
                desc="搜尋附近緊急避難場所"
                url="https://www.google.com/maps/search/evacuation+shelter"
                color="blue"
            />
            <ExternalLinkItem 
                title="NHK World Japan (防災)" 
                desc="多語言災害新聞與警報"
                url="https://www3.nhk.or.jp/nhkworld/en/news/tags/18/"
                color="zinc"
            />
            <ExternalLinkItem 
                title="日本氣象廳 (JMA)" 
                desc="地震與海嘯即時資訊"
                url="https://www.jma.go.jp/jma/indexe.html"
                color="zinc"
            />
        </div>
      </div>
    </div>
  );
}

function ExternalLinkItem({ title, desc, url, color }) {
    return (
        <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-black/20 hover:bg-white/5 border border-white/5 transition-all group"
        >
            <div>
                <div className={`font-bold text-sm group-hover:underline ${color === 'blue' ? 'text-blue-400' : 'text-zinc-200'}`}>{title}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{desc}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:bg-white/10 transition-colors">
                <ExternalLink size={14} />
            </div>
        </a>
    );
}

// --- 2. 天氣視圖 ---
function WeatherView() {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const promises = CITIES.map(async (city) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=1`;
        const response = await fetch(url);
        const data = await response.json();
        return {
          name: city.name,
          tempMax: Math.round(data.daily.temperature_2m_max[0]),
          tempMin: Math.round(data.daily.temperature_2m_min[0]),
          pop: data.daily.precipitation_probability_max[0],
          code: data.daily.weather_code[0]
        };
      });

      const results = await Promise.all(promises);
      const dataMap = {};
      results.forEach(item => {
        dataMap[item.name] = item;
      });
      setWeatherData(dataMap);
      setLastUpdated(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error("Weather fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]" size={40} />;
    if (code <= 3) return <Cloud className="text-zinc-400 drop-shadow-md" size={40} />;
    if (code <= 48) return <Cloud className="text-zinc-500 drop-shadow-md" size={40} />;
    if (code <= 67) return <CloudRain className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]" size={40} />;
    if (code <= 77) return <CloudSnow className="text-cyan-200 drop-shadow-[0_0_15px_rgba(165,243,252,0.6)]" size={40} />;
    if (code <= 82) return <CloudRain className="text-blue-500 drop-shadow-md" size={40} />;
    if (code <= 86) return <CloudSnow className="text-cyan-400 drop-shadow-md" size={40} />;
    return <CloudLightning className="text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" size={40} />;
  };

  const getWeatherText = (code) => {
    if (code === 0) return "晴天";
    if (code <= 3) return "多雲";
    if (code <= 48) return "起霧";
    if (code <= 67) return "下雨";
    if (code <= 77) return "下雪";
    if (code <= 82) return "陣雨";
    if (code <= 86) return "陣雪";
    return "雷雨";
  };

  return (
    <div className="space-y-4">
      {/* 3. 玻璃質感天氣小工具 (Glass Widgets) */}
      <div className="bg-gradient-to-br from-blue-600/20 to-indigo-900/40 border border-blue-500/20 text-white p-8 rounded-[2.5rem] shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-[-20%] right-[-10%] opacity-20 text-blue-300 rotate-12">
           <CloudSnow size={180} />
        </div>
        <div className="relative z-10">
            <h2 className="text-3xl font-black mb-1 text-white tracking-tight">冬季裝備檢查</h2>
            <p className="text-blue-200/60 text-xs font-mono uppercase tracking-widest mb-6">生存指南</p>
            <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-full"><Umbrella size={16} /></div>
                <span className="text-sm font-bold">防風外套</span>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl backdrop-blur-sm border border-white/5 flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-full"><CloudSnow size={16} /></div>
                <span className="text-sm font-bold">防滑靴子</span>
            </div>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-end px-2 pt-2">
        <h3 className="font-bold text-white text-lg">天氣預報</h3>
        <button 
            onClick={fetchWeather} 
            disabled={loading}
            className="text-[10px] flex items-center gap-1.5 text-zinc-400 hover:text-white bg-zinc-800/50 px-3 py-1.5 rounded-full transition-all"
        >
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            {loading ? "更新中..." : `已更新 ${lastUpdated || '--:--'}`}
        </button>
      </div>

      {loading && !lastUpdated ? (
         <div className="p-12 text-center text-zinc-600 text-xs font-mono tracking-widest animate-pulse">連線氣象衛星中...</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
            {CITIES.map((city) => {
            const data = weatherData[city.name];
            if (!data) return null;

            return (
                <div key={city.name} className="group bg-zinc-900/40 backdrop-blur-md border border-white/5 p-5 rounded-[1.5rem] flex items-center justify-between transition-all hover:bg-zinc-800/60 hover:scale-[1.01]">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 flex items-center justify-center bg-black/20 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                            {getWeatherIcon(data.code)}
                        </div>
                        <div>
                            <div className="font-bold text-white text-lg leading-tight mb-1">{city.name.split(' ')[0]}</div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/5 text-zinc-400 rounded-md border border-white/5 uppercase tracking-wide group-hover:bg-white/10 group-hover:text-white transition-colors">
                                    {getWeatherText(data.code)}
                                </span>
                                {data.pop > 0 && (
                                    <span className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5">
                                        <Umbrella size={10} /> {data.pop}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="font-black text-3xl text-white tracking-tighter">{data.tempMax}°</span>
                        </div>
                        <div className="text-xs font-bold text-zinc-500">低溫: {data.tempMin}°</div>
                    </div>
                </div>
            );
            })}
        </div>
      )}
    </div>
  );
}

// --- 3. 記帳視圖 ---
function ExpensesView({ user }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const fileInputRef = useRef(null);
  const fileRef = useRef(null); 

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [scanError, setScanError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'expenses');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setExpenses(items);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      fileRef.current = file;
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setScanError(null);
    }
  };

  const handleSmartScan = async () => {
    if (!fileRef.current) return;
    setIsAnalyzing(true);
    setScanError(null);

    try {
      const { base64 } = await processImageForAI(fileRef.current);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze this receipt image. Extract the total amount (number only) and a short description. If the description is in Japanese, translate it to Traditional Chinese (繁體中文). Return ONLY valid JSON format: {\"amount\": number, \"description\": \"string\"}. If uncertain, amount is 0." },
              { inline_data: { mime_type: "image/jpeg", data: base64 } }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const result = JSON.parse(data.candidates[0].content.parts[0].text);
        if (result.amount) setAmount(result.amount);
        if (result.description) setDescription(result.description);
      } else {
        throw new Error("No response");
      }
    } catch (error) {
      setScanError("分析失敗，請手動輸入");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), {
        amount: Number(amount),
        description,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString('zh-TW'),
        hasImage: !!imagePreview 
      });

      setAmount('');
      setDescription('');
      setImagePreview(null);
      fileRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const total = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4. 數位錢包風格卡片 (Wallet Card) */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-500/20 p-8 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] relative overflow-hidden group">
        <div className="absolute -right-16 -bottom-16 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-500">
            <CreditCard size={200} />
        </div>
        {/* 使用 CSS 漸層替代外部圖片，避免 404 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-emerald-400/80 text-xs font-mono uppercase tracking-widest mb-1">總支出</p>
                    <h2 className="text-4xl font-black text-white font-mono tracking-tighter">
                        <span className="text-emerald-400 mr-2">¥</span>
                        {total.toLocaleString()}
                    </h2>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-xl backdrop-blur-md">
                    <Sparkles className="text-emerald-400" size={20} />
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200/50 font-mono">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                即時匯率換算
            </div>
        </div>
      </div>

      <form onSubmit={handleAddExpense} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] space-y-4 shadow-inner">
        <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-white text-sm">新增一筆</h3>
            {imagePreview && !isAnalyzing && (
                <button 
                type="button"
                onClick={handleSmartScan}
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse hover:scale-105 transition-transform uppercase tracking-wider"
                >
                <ScanLine size={12} /> AI 掃描
                </button>
            )}
        </div>

        <div 
           onClick={() => !isAnalyzing && fileInputRef.current.click()}
           className={`relative w-full h-28 rounded-2xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group
             ${imagePreview ? 'border-emerald-500/50 bg-black' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-zinc-600'}
             ${isAnalyzing ? 'border-cyan-500 animate-pulse' : ''}
           `}
        >
            {isAnalyzing ? (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-cyan-400 z-10 backdrop-blur-sm">
                <Loader2 size={24} className="animate-spin mb-2" />
                <span className="text-[10px] font-mono tracking-widest">分析中...</span>
              </div>
            ) : null}

            {imagePreview ? (
              <>
                <img src={imagePreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" alt="preview" />
                 {!isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-black/60 p-3 rounded-full backdrop-blur-md text-white">
                        <Edit2 size={16} />
                     </div>
                  </div>
                 )}
              </>
            ) : (
               <div className="flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-white group-hover:bg-zinc-700 transition-colors">
                    <Camera size={18} />
                 </div>
                 <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold">上傳收據</span>
               </div>
            )}
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {scanError && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2">
                 <AlertTriangle size={14} />
                 {scanError}
             </div>
        )}

        <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
                <input 
                    type="number" 
                    placeholder="¥ 金額" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600 text-sm font-mono"
                />
            </div>
            <div className="col-span-2">
                <input 
                    type="text" 
                    placeholder="說明..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl p-3.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-zinc-600 text-sm"
                />
            </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || !amount || isAnalyzing}
          className="w-full bg-white text-black py-3.5 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : '儲存紀錄'}
        </button>
      </form>

      <div className="space-y-3 pb-8">
        <h3 className="font-bold text-zinc-500 text-xs uppercase tracking-widest px-2">歷史紀錄</h3>
        {expenses.length === 0 && (
            <div className="text-center text-zinc-700 py-10 text-xs font-mono tracking-widest border-2 border-dashed border-zinc-900 rounded-2xl">暫無消費</div>
        )}
        {expenses.map((item) => (
          <div key={item.id} className="group flex justify-between items-center bg-zinc-900/60 border border-white/5 p-4 rounded-2xl hover:bg-zinc-800 transition-colors">
            <div className="flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20
                ${item.hasImage ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' : ''}`}>
                {item.hasImage ? <ImageIcon size={16} /> : <CreditCard size={16} />}
              </div>
              <div>
                <div className="font-bold text-gray-200 text-sm">{item.description}</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.date}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold font-mono text-white tracking-tight">¥{item.amount.toLocaleString()}</span>
              <button onClick={() => setDeleteTargetId(item.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="移除紀錄？"
        message="確定要刪除這筆消費紀錄嗎？這項操作無法復原。"
      />
    </div>
  );
}
