import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CloudSnow, Camera, CreditCard, Trash2, CloudRain, Sun, Umbrella, Cloud, CloudLightning, RefreshCw, ShieldAlert, Phone, ExternalLink, AlertTriangle, Award, CheckCircle2, Trophy, Clock, Plus, MapPin, X, Image as ImageIcon, Edit2, ScanLine, Sparkles, Loader2, Plane, ChevronRight, Train, Languages, LayoutGrid, Bed, Utensils, BookOpen, Share
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';

// --- API Key ---
const apiKey = "AIzaSyDtHSygulqJEVLdT-3apvPcs4_vpvOTchw"; 

// --- Firebase 設定 ---
let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error('Environment config not found');
  }
} catch (e) {
  // 修正：這裡的所有逗號都已改為半形 ","
  firebaseConfig = {
    apiKey: "AIzaSyBp8BT3jNSo_46-5dfWLkJ69wSEtlv5PZ4"，
    authDomain: "hokuriku-trip.firebaseapp.com"，
    projectId: "hokuriku-trip"，
    storageBucket: "hokuriku-trip.firebasestorage.app"，
    messagingSenderId: "170805929872"，
    appId: "1:170805929872:web:ade0f3cc9f27ad7a84f515"，
    measurementId: "G-4Q500J33FZ"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'my-hokuriku-trip';

// --- 資料常數 ---
const DATES = [
  "12/22 (一)", "12/23 (二)", "12/24 (三)", "12/25 (四)"， 
  "12/26 (五)", "12/27 (六)", "12/28 (日)", "12/29 (一)"
];

const DEFAULT_ITINERARY = {
  "day-0": [
    { id: "d1-flight", time: "14:30", title: "✈️ UO802 HKG -> KMQ", note: "19:00 抵達小松", type: "flight"， isSystem: true },
    { id: "d1-bus", time: "19:40", title: "🚌 機場巴士 -> 金澤站", note: "往金澤站東口 (約40分)", type: "transport"， isSystem: true },
    { id: "d1-hotel", time: "20:30", title: "🏨 Garden Hotel Kanazawa", note: "金澤站東口步行1分鐘", type: "hotel"， isSystem: true }
  ],
  "day-1": [
    { id: "d2-shinkansen", time: "07:19", title: "🚄 Hakutaka 554 -> 富山", note: "預約號: 44368 / 07:42著", type: "transport"， isSystem: true },
    { id: "d2-hida", time: "07:58", title: "🚆 Hida 6號 -> 高山", note: "8車 12-D / 預約號: 47964", type: "transport"， isSystem: true },
    { id: "d2-bus-out", time: "10:40", title: "🚌 高山 -> 新穗高纜車", note: "買奧飛驒套票 / 12:16著", type: "transport"， isSystem: true },
    { id: "d2-ropeway", time: "12:30", title: "🏔️ 新穗高纜車", note: "2156m 山頂看雪", type: "activity"， isSystem: true },
    { id: "d2-hotel", time: "20:00", title: "🏨 Hotel Around Takayama", note: "高山站步行 3-4 分鐘", type: "hotel"， isSystem: true }
  ],
  "day-2": [
    { id: "d3-morning", time: "09:00", title: "🍎 宮川朝市 / 高山陣屋", note: "雪中京都風情", type: "activity"， isSystem: true },
    { id: "d3-train", time: "13:17", title: "🚆 Hida -> 富山", note: "前往富山 Check-in", type: "transport"， isSystem: true },
    { id: "d3-starbucks", time: "17:00", title: "☕ 富山環水公園", note: "最美星巴克點燈", type: "activity"， isSystem: true },
    { id: "d3-hotel", time: "19:00", title: "🏨 Dormy Inn 富山", note: "訂單: 135904111464567", type: "hotel"， isSystem: true }
  ],
  "day-3": [
    { id: "d4-train", time: "13:30", title: "🚃 電鐵富山 -> 宇奈月", note: "14:45 抵達", type: "transport"， isSystem: true },
    { id: "d4-hotel", time: "15:00", title: "🏨 大江戶溫泉物語", note: "雪見露天風呂", type: "hotel"， isSystem: true }
  ],
  "day-4": [
    { id: "d5-train", time: "18:30", title: "🚃 宇奈月 -> 富山", note: "電鐵末班車確認", type: "transport"， isSystem: true },
    { id: "d5-hotel", time: "20:00", title: "🏨 Dormy Inn 富山", note: "續住", type: "hotel"， isSystem: true }
  ],
  "day-5": [
    { id: "d6-day", time: "10:00", title: "🌨️ 雨晴海岸 / 高岡", note: "哆啦A夢散步道", type: "activity"， isSystem: true }
  ],
  "day-6": [
    { id: "d7-garden", time: "13:00", title: "🌲 兼六園", note: "專攻雪吊+積雪拍照", type: "activity"， isSystem: true },
    { id: "d7-hotel", time: "18:00", title: "🏨 Garden Hotel Kanazawa", note: "站前買手信", type: "hotel"， isSystem: true }
  ],
  "day-7": [
    { id: "d8-bus", time: "16:30", title: "🚌 金澤西口 -> 小松機場", note: "17:15 抵達", type: "transport"， isSystem: true },
    { id: "d8-flight", time: "19:45", title: "✈️ UO803 KMQ -> HKG", note: "23:35 抵達香港", type: "flight", isSystem: true }
  ]
};

const CITIES = [
  { name: "金澤 (Kanazawa)", lat: 36.5613, lon: 136.6562 },
  { name: "富山 (Toyama)", lat: 36.6959, lon: 137.2137 },
  { name: "高岡 (Takaoka)", lat: 36.7550, lon: 137.0210 },
  { name: "新穗高 (Shinhotaka)", lat: 36.2892, lon: 137.5756 },
  { name: "宇奈月 (Unazuki)", lat: 36.8145, lon: 137.5815 },
];

const MISSIONS = [
  { id: 'shinhotaka_view', title: '2156m 絕景', desc: '在新穗高山頂展望台拍照', location: '新穗高', icon: '🏔️' },
  { id: 'starbucks_light', title: '最美星巴克', desc: '拍下環水公園聖誕點燈', location: '富山', icon: '☕' },
  { id: 'snow_onsen', title: '雪見風呂', desc: '在宇奈月露天溫泉賞雪', location: '宇奈月', icon: '♨️' },
  { id: 'kenrokuen_snow', title: '兼六園雪吊', desc: '拍下被雪覆蓋的松樹', location: '金澤', icon: '🌲' },
  { id: 'hida_beef', title: '飛驒牛燒肉', desc: '在味藏天國大吃一頓', location: '高山', icon: '🥩' },
  { id: 'kanazawa_gold', title: '金澤奢華', desc: '吃一支金箔雪糕', location: '金澤', icon: '🍦' },
  { id: 'doraemon', title: '尋找哆啦A夢', desc: '與高岡銅像合照', location: '高岡', icon: '🐱' },
  { id: 'crab', title: '香箱蟹', desc: '品嚐冬季限定香箱蟹', location: '北陸', icon: '🦀' },
];

const PHRASES = [
  { jp: '香箱ガニをください', romaji: 'Koubako-gani wo kudasai', zh: '請給我香箱蟹', icon: '🦀' },
  { jp: '飛騨牛', romaji: 'Hida Gyu', zh: '飛驒牛', icon: '🥩' },
  { jp: '雪見風呂', romaji: 'Yukimi Buro', zh: '我想泡雪見溫泉', icon: '♨️' },
  { jp: '新穂高ロープウェイ', romaji: 'Shinhotaka Ropeway', zh: '新穗高纜車在哪?', icon: '🚡' },
  { jp: 'お会計をお願いします', romaji: 'O-kaikei wo onegaishimasu', zh: '麻煩結帳', icon: '💳' },
  { jp: '免税できますか？', romaji: 'Menzei dekimasu ka?', zh: '可以退稅嗎？', icon: '🛍️' },
  { jp: 'バス乗り場はどこ？', romaji: 'Basu noriba wa doko?', zh: '巴士站在哪裡？', icon: '🚌' },
  { jp: 'これをください', romaji: 'Kore wo kudasai', zh: '我要這個 (指)', icon: '👉' },
];

// --- 輔助函式 ---
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/jpeg', 0.6);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- 共用組件 ---
function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 ring-1 ring-white/10">
        <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors">取消</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors">刪除</button>
        </div>
      </div>
    </div>
  );
}

function NavButton({ icon, label, active, onClick, color }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-full transition-all duration-300 ${active ? 'scale-110 -translate-y-1' : 'opacity-50 hover:opacity-100'}`}>
      <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-white/10' : ''} ${active ? color : 'text-zinc-400'}`}>
        {icon}
      </div>
      {active && <span className={`text-[9px] font-bold mt-1 ${color}`}>{label}</span>}
    </button>
  );
}

function ExternalLinkItem({ title, desc, url, color }) {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-black/20 hover:bg-white/5 border border-white/5 transition-all group">
            <div>
                <div className={`font-bold text-sm group-hover:underline ${color === 'blue' ? 'text-blue-400' : 'text-zinc-200'}`}>{title}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{desc}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-600 group-hover:text-white group-hover:bg-white/10 transition-colors"><ExternalLink size={14} /></div>
        </a>
    );
}

// --- 主程式 App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary'); 
  const [ocrReady, setOcrReady] = useState(false);

  useEffect(() => {
    if (window.Tesseract) { setOcrReady(true); return; }
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => setOcrReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { await signInAnonymously(auth); }
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    onAuthStateChanged(auth, setUser);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-zinc-800">
      {/* 背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-20%] w-[400px] h-[400px] rounded-full bg-blue-900/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-purple-900/20 blur-[100px]"></div>
      </div>

      {/* 頂部 Header */}
      <header className="bg-black/60 backdrop-blur-xl pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3 drop-shadow-xl">
           {activeTab === 'itinerary' && <><Calendar className="text-blue-400" /> 行程總覽</>}
           {activeTab === 'assistant' && <><LayoutGrid className="text-indigo-400" /> 旅途助手</>}
           {activeTab === 'wallet' && <><CreditCard className="text-emerald-400" /> 消費記帳</>}
           {activeTab === 'memories' && <><BookOpen className="text-amber-400" /> 回憶圖鑑</>}
        </h1>
      </header>

      {/* 主要內容 */}
      <main className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth scrollbar-hide z-10">
        {!user ? (
          <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-zinc-600" /></div>
        ) : (
          <>
            {activeTab === 'itinerary' && <ItineraryView user={user} />}
            {activeTab === 'assistant' && <AssistantView />}
            {activeTab === 'wallet' && <ExpensesView user={user} ocrReady={ocrReady} />}
            {activeTab === 'memories' && <MemoriesView user={user} />}
          </>
        )}
      </main>

      {/* 底部懸浮導航 */}
      <nav className="absolute bottom-8 left-4 right-4 h-16 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-full z-30 shadow-2xl flex justify-around items-center px-2">
        <NavButton icon={<Calendar size={20} />} label="行程" active={activeTab === 'itinerary'} onClick={() => setActiveTab('itinerary')} color="text-blue-400" />
        <NavButton icon={<LayoutGrid size={20} />} label="助手" active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} color="text-indigo-400" />
        <NavButton icon={<CreditCard size={20} />} label="記帳" active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} color="text-emerald-400" />
        <NavButton icon={<BookOpen size={20} />} label="回憶" active={activeTab === 'memories'} onClick={() => setActiveTab('memories')} color="text-amber-400" />
      </nav>
    </div>
  );
}

// --- Views 實作 ---

// 1. 行程視圖
function ItineraryView({ user }) {
  const [plans, setPlans] = useState({});
  const [items, setItems] = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'itinerary');
    return onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data().items || [];
      });
      // Merge defaults
      Object.keys(DEFAULT_ITINERARY).forEach(key => {
        if (!data[key]) data[key] = DEFAULT_ITINERARY[key];
      });
      setPlans(data);
    });
  }, [user]);

  useEffect(() => {
      if(plans) setItems(plans[`day-${activeDay}`] || []);
  }, [plans, activeDay]);

  const handleAdd = async () => {
    const newItem = { id: Date.now().toString(), time: newTime||'--:--', title: newTitle, note: newNote, type: 'activity' };
    const newItems = [...items, newItem].sort((a,b)=>a.time.localeCompare(b.time));
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'itinerary', `day-${activeDay}`), { items: newItems }, { merge: true });
    setIsAdding(false); setNewTitle(''); setNewNote('');
  };

  const confirmDeleteActivity = async () => {
    const newItems = items.filter(i => i.id !== deleteTargetId);
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'itinerary', `day-${activeDay}`), { items: newItems }, { merge: true });
    setDeleteTargetId(null);
  };

  const getItemStyle = (type) => {
    switch(type) {
        case 'flight': return { color: 'amber-400', bg: 'amber-500/10', border: 'amber-500/30', icon: <Plane size={12} className="text-amber-400"/> };
        case 'transport': return { color: 'blue-400', bg: 'blue-500/10', border: 'blue-500/30', icon: <Train size={12} className="text-blue-400"/> };
        case 'hotel': return { color: 'purple-400', bg: 'purple-500/10', border: 'purple-500/30', icon: <Bed size={12} className="text-purple-400"/> };
        case 'food': return { color: 'red-400', bg: 'red-500/10', border: 'red-500/30', icon: <Utensils size={12} className="text-red-400"/> };
        default: return { color: 'cyan-400', bg: 'zinc-800/40', border: 'white/10', icon: null };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {DATES.map((d, i) => (
            <button key={i} onClick={()=>setActiveDay(i)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeDay===i ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>{d.split(' ')[0]}</button>
        ))}
      </div>
      <div className="bg-zinc-900/50 p-6 rounded-3xl min-h-[400px]">
        <div className="flex justify-between mb-6">
            <h3 className="text-xl font-bold text-white">{DATES[activeDay]}</h3>
            <button onClick={()=>setIsAdding(true)} className="bg-blue-500 text-white p-2 rounded-full"><Plus size={16}/></button>
        </div>
        <div className="space-y-4 relative pl-2">
            {items.length > 0 && <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-zinc-800"></div>}
            {items.map(item => {
                const style = getItemStyle(item.type);
                return (
                    <div key={item.id} className="relative flex gap-4 items-start">
                        <div className={`z-10 w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-4 ring-black bg-${style.color}`}></div>
                        <div className={`flex-1 rounded-xl p-3 border ${style.bg} border-${style.border}`}>
                            <div className="flex justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1"><span className="text-[10px] text-zinc-400 font-mono">{item.time}</span>{style.icon}</div>
                                    <div className="font-bold text-white">{item.title}</div>
                                    {item.note && <div className="text-xs text-zinc-500 mt-1">{item.note}</div>}
                                </div>
                                <button onClick={()=>setDeleteTargetId(item.id)} className="text-zinc-600"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
      <ConfirmModal isOpen={!!deleteTargetId} onClose={()=>setDeleteTargetId(null)} onConfirm={confirmDeleteActivity} title="移除行程？" message="確定要刪除嗎？" />
      {isAdding && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-[80]">
            <div className="bg-zinc-900 w-full max-w-sm p-6 rounded-3xl border border-white/10">
                <h3 className="text-white font-bold mb-4">新增行程</h3>
                <input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white mb-3" />
                <input type="text" placeholder="活動內容" value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white mb-3" />
                <input type="text" placeholder="備註 (選填)" value={newNote} onChange={e=>setNewNote(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white mb-4" />
                <div className="flex gap-3">
                    <button onClick={()=>setIsAdding(false)} className="flex-1 py-3 text-zinc-400">取消</button>
                    <button onClick={handleAdd} className="flex-1 bg-blue-500 text-white rounded-xl">新增</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

// 2. 助手視圖 (交通、翻譯、防災、天氣)
function AssistantView() {
    return (
        <div className="space-y-6 animate-in fade-in">
             <WeatherView />
             <TrafficBoard />
             <Phrasebook />
             <SafetyCard />
        </div>
    );
}

function TrafficBoard() {
    return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-lg relative">
            <div className="bg-black/50 p-3 border-b border-zinc-700 flex justify-between items-center">
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Train size={16} className="text-green-400"/> 關鍵列車</h3>
                <span className="text-[10px] text-zinc-500 font-mono animate-pulse">LIVE</span>
            </div>
            <div className="p-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between"><span>Hakutaka 554</span><span className="text-green-400 bg-green-400/10 px-2 rounded text-xs">正常</span></div>
                <div className="flex justify-between"><span>Hida 6</span><span className="text-green-400 bg-green-400/10 px-2 rounded text-xs">正常</span></div>
            </div>
            <a href="https://trafficinfo.westjr.co.jp/hokuriku.html" target="_blank" className="block w-full text-center bg-zinc-800/50 py-2 text-xs text-blue-400 border-t border-zinc-700">JR 運行情報</a>
        </div>
    );
}

function Phrasebook() {
    const [activePhrase, setActivePhrase] = useState(null);
    return (
        <>
        <div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Languages size={18} className="text-purple-400"/> 翻譯指差卡</h3>
            <div className="grid grid-cols-2 gap-3">
                {PHRASES.map((p, idx) => (
                    <button key={idx} onClick={() => setActivePhrase(p)} className="bg-zinc-800/60 border border-white/5 p-4 rounded-2xl text-left hover:bg-zinc-700 transition-all active:scale-95">
                        <div className="text-2xl mb-2">{p.icon}</div>
                        <div className="text-sm font-bold text-white mb-0.5">{p.zh}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{p.romaji}</div>
                    </button>
                ))}
            </div>
        </div>
        {activePhrase && (
            <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-6" onClick={() => setActivePhrase(null)}>
                <div className="w-full max-w-sm text-center">
                    <div className="text-8xl mb-6">{activePhrase.icon}</div>
                    <h2 className="text-3xl font-black text-white mb-4 bg-zinc-900 p-4 rounded-2xl">{activePhrase.jp}</h2>
                    <p className="text-xl text-yellow-400 font-mono mb-8">{activePhrase.romaji}</p>
                    <p className="text-zinc-500 text-sm">({activePhrase.zh})</p>
                </div>
            </div>
        )}
        </>
    );
}

function SafetyCard() {
    return (
        <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-3xl">
            <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2"><ShieldAlert size={18}/> 緊急求助</h3>
            <div className="flex gap-3">
                <a href="tel:110" className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-center text-xl">110</a>
                <a href="tel:119" className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-center text-xl">119</a>
            </div>
            <div className="mt-4 pt-4 border-t border-red-500/20">
                <ExternalLinkItem title="Google 避難所" desc="尋找最近避難點" url="https://www.google.com/maps/search/evacuation+shelter" color="zinc" />
            </div>
        </div>
    );
}

// 3. 天氣視圖 (更新版：下雪機率)
function WeatherView() {
    const [weather, setWeather] = useState({});
    
    useEffect(() => {
        const fetchW = async () => {
            const dataMap = {};
            const today = new Date().toISOString().split('T')[0];
            
            for(const city of CITIES) {
                try {
                    // 請求 API 包含 precipitation_probability_max 和 snowfall_sum
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum&timezone=Asia%2FTokyo&start_date=${today}&end_date=${today}`);
                    const d = await res.json();
                    
                    if (d.daily) {
                        dataMap[city.name] = { 
                            max: Math.round(d.daily.temperature_2m_max[0]), 
                            min: Math.round(d.daily.temperature_2m_min[0]),
                            pop: d.daily.precipitation_probability_max[0], // 降水機率
                            snow: d.daily.snowfall_sum[0], // 降雪量
                            code: d.daily.weather_code[0]
                        };
                    }
                } catch (e) {
                    console.error("Weather fetch failed", e);
                }
            }
            setWeather(dataMap);
        };
        fetchW();
    }, []);

    return (
        <div className="space-y-3">
             <h3 className="text-white font-bold flex items-center gap-2">
                <CloudSnow size={18} className="text-cyan-400"/> 天氣預報 & 下雪機率
             </h3>
             {CITIES.map(city => {
                 const w = weather[city.name];
                 if(!w) return null;
                 
                 const isSnowing = w.snow > 0 || (w.code >= 71 && w.code <= 77) || (w.code >= 85 && w.code <= 86);
                 
                 return (
                     <div key={city.name} className="bg-zinc-900/40 p-4 rounded-2xl flex justify-between items-center border border-white/5 relative overflow-hidden">
                         {isSnowing && <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>}
                         <div className="flex items-center gap-4 z-10">
                             <div className={`p-2 rounded-full ${isSnowing ? 'bg-blue-500/20 text-blue-300' : 'bg-zinc-800 text-zinc-400'}`}>
                                {isSnowing ? <CloudSnow size={20} /> : <Sun size={20} />}
                             </div>
                             <div>
                                 <div className="font-bold text-white text-sm">{city.name.split(' ')[0]}</div>
                                 <div className="flex items-center gap-3 text-xs mt-1">
                                    <span className="text-zinc-500 flex items-center gap-1"><CloudRain size={10}/> {w.pop}%</span>
                                    {w.snow > 0 ? (
                                        <span className="text-cyan-400 font-bold flex items-center gap-1"><Sparkles size={10}/> 積雪 {w.snow}cm</span>
                                    ) : (
                                        <span className="text-zinc-600">無積雪</span>
                                    )}
                                 </div>
                             </div>
                         </div>
                         <div className="text-right z-10">
                             <div className="text-xl font-black text-white">{w.max}°</div>
                             <div className="text-xs text-zinc-500">{w.min}°</div>
                         </div>
                     </div>
                 );
             })}
        </div>
    );
}

// 4. 記帳視圖
function ExpensesView({ user, ocrReady }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const fileInputRef = useRef(null);
  const fileRef = useRef(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), (snap) => {
      const items = [];
      snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      setExpenses(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
  }, [user]);

  const handleFileChange = (e) => {
      if (e.target.files[0]) {
          fileRef.current = e.target.files[0];
          setImagePreview(URL.createObjectURL(e.target.files[0]));
      }
  };

  const handleSmartScan = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
      if (!window.Tesseract) throw new Error("OCR loading...");
      const compressedBlob = await compressImage(fileRef.current);
      const url = URL.createObjectURL(compressedBlob);
      const { data: { text } } = await window.Tesseract.recognize(url, 'eng');
      const numbers = text.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?/g);
      if (numbers) {
         const maxNum = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n)).sort((a,b)=>b-a)[0];
         if (maxNum) setAmount(maxNum);
      }
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if(lines.length > 0) setDescription(lines[0].substring(0, 20));
    } catch (e) { alert("辨識失敗"); } 
    finally { setIsAnalyzing(false); }
  };

  const handleAdd = async () => {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), {
        amount: Number(amount), description, createdAt: serverTimestamp(), date: new Date().toLocaleDateString('zh-TW'), hasImage: !!imagePreview 
      });
      setAmount(''); setDescription(''); setImagePreview(null);
  };

  const total = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-500/20 p-8 rounded-[2rem] shadow-2xl relative">
            <p className="text-emerald-400/80 text-xs font-mono uppercase mb-1">總支出</p>
            <h2 className="text-4xl font-black text-white font-mono">¥ {total.toLocaleString()}</h2>
            <CreditCard className="absolute -bottom-6 -right-6 text-white/10 w-32 h-32" />
       </div>
       <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] space-y-4">
           <div className="flex justify-between"><h3 className="text-white font-bold">新增消費</h3><button onClick={handleSmartScan} disabled={!imagePreview||!ocrReady} className="text-cyan-400 text-xs flex items-center gap-1"><ScanLine size={12}/> OCR</button></div>
           <div onClick={() => fileInputRef.current.click()} className="h-24 rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer relative overflow-hidden">
               {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="text-zinc-500 text-xs flex flex-col items-center"><Camera size={16}/> <span>收據</span></div>}
               {isAnalyzing && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-cyan-400 text-xs">分析中...</div>}
           </div>
           <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
           <div className="flex gap-2">
               <input type="number" placeholder="¥" value={amount} onChange={e=>setAmount(e.target.value)} className="w-1/3 bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm" />
               <input type="text" placeholder="品項" value={description} onChange={e=>setDescription(e.target.value)} className="flex-1 bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm" />
           </div>
           <button onClick={handleAdd} className="w-full bg-white text-black py-3 rounded-xl font-bold">儲存</button>
       </div>
       <div className="space-y-2">
           {expenses.map(item => (
               <div key={item.id} className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-xl border border-white/5">
                   <div className="flex gap-3 items-center">
                       <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">{item.hasImage?<ImageIcon size={14}/>:<CreditCard size={14}/>}</div>
                       <div><div className="text-white text-sm font-bold">{item.description}</div><div className="text-xs text-zinc-500">{item.date}</div></div>
                   </div>
                   <div className="flex items-center gap-3">
                       <span className="text-white font-mono font-bold">¥{item.amount.toLocaleString()}</span>
                       <button onClick={()=>setDeleteTargetId(item.id)} className="text-zinc-600"><Trash2 size={14}/></button>
                   </div>
               </div>
           ))}
       </div>
       <ConfirmModal isOpen={!!deleteTargetId} onClose={()=>setDeleteTargetId(null)} onConfirm={async()=>{await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', deleteTargetId)); setDeleteTargetId(null);}} title="刪除?" message="確定要刪除這筆紀錄嗎？" />
    </div>
  );
}

// 5. 回憶視圖
function MemoriesView({ user }) {
  const [subTab, setSubTab] = useState('collection'); 
  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 p-1 rounded-2xl flex gap-1 border border-white/5">
        {['collection', 'diary', 'missions'].map(tab => (
          <button key={tab} onClick={() => setSubTab(tab)} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${subTab === tab ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {tab === 'collection' && '📸 採集'} {tab === 'diary' && '📝 日記'} {tab === 'missions' && '🏆 成就'}
          </button>
        ))}
      </div>
      {subTab === 'collection' && <CollectionView user={user} />}
      {subTab === 'diary' && <DiaryView user={user} />}
      {subTab === 'missions' && <MissionsView user={user} />}
    </div>
  );
}

function CollectionView({ user }) {
  const [items, setItems] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('美食');
  const fileInputRef = useRef(null);
  const [showMemoir, setShowMemoir] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'collection'), (snap) => {
      const data = [];
      snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setItems(data.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, [user]);

  const handleCapture = async (e) => {
    if (e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      const base64 = await blobToBase64(compressed);
      setNewImage(base64);
      setIsAdding(true);
    }
  };

  const saveItem = async () => {
    if (!newImage || !title) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'collection'), {
      image: newImage, title, tag, createdAt: serverTimestamp(), date: new Date().toLocaleDateString('zh-TW')
    });
    setIsAdding(false); setNewImage(null); setTitle('');
  };

  const deleteItem = async (id) => {
    if(confirm("移除這張圖鑑卡？")) await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'collection', id));
  };

  if (showMemoir) return <MemoirPreview items={items} onClose={() => setShowMemoir(false)} />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => fileInputRef.current.click()} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"><Camera size={20} /> 拍攝新發現</button>
        <button onClick={() => setShowMemoir(true)} className="px-4 bg-zinc-800 rounded-2xl border border-white/5 text-zinc-400 hover:text-white"><Share size={20} /></button>
      </div>
      <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden relative group">
                <img src={item.image} className="w-full h-32 object-cover" />
                <div className="p-3"><div className="text-[10px] text-amber-500 font-bold mb-1 uppercase">{item.tag}</div><div className="text-sm font-bold text-white truncate">{item.title}</div><div className="text-[10px] text-zinc-500 mt-1">{item.date}</div></div>
                <button onClick={() => deleteItem(item.id)} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100"><X size={12}/></button>
            </div>
        ))}
      </div>
      {isAdding && (
          <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-6">
              <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 border border-white/10">
                  <h3 className="text-white font-bold mb-4">加入圖鑑</h3>
                  <img src={newImage} className="w-full h-48 object-cover rounded-xl mb-4 border border-white/10" />
                  <input type="text" placeholder="名稱" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white mb-3" />
                  <div className="flex gap-2 mb-4">
                      {['美食', '風景', '小物', '紀念'].map(t => (
                          <button key={t} onClick={()=>setTag(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${tag===t ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-zinc-500 border-zinc-700'}`}>{t}</button>
                      ))}
                  </div>
                  <div className="flex gap-3"><button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-zinc-400">取消</button><button onClick={saveItem} disabled={!title} className="flex-1 bg-amber-500 text-black rounded-xl font-bold">儲存</button></div>
              </div>
          </div>
      )}
    </div>
  );
}

function DiaryView({ user }) {
  const [diaries, setDiaries] = useState({});
  const [activeDay, setActiveDay] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  useEffect(() => {
    if(!user) return;
    return onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'diary'), (snap) => {
        const d = {}; snap.forEach(doc => d[doc.id] = doc.data().content); setDiaries(d);
    });
  }, [user]);
  const handleSave = async () => {
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'diary', `day-${activeDay}`), { content: draft, updatedAt: serverTimestamp() });
    setIsEditing(false);
  };
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 min-h-[500px] flex flex-col">
       <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
           {DATES.map((date, idx) => (<button key={idx} onClick={()=>{setActiveDay(idx); setIsEditing(false);}} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeDay === idx ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>{date.split(' ')[0]}</button>))}
       </div>
       <div className="flex-1 flex flex-col">
           <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-white">{DATES[activeDay]} 的日記</h3><button onClick={()=>{setDraft(diaries[`day-${activeDay}`]||''); setIsEditing(!isEditing);}} className="text-zinc-400 hover:text-white"><Edit2 size={18}/></button></div>
           {isEditing ? (
               <><textarea value={draft} onChange={(e)=>setDraft(e.target.value)} className="flex-1 bg-black/50 border border-zinc-700 rounded-2xl p-4 text-zinc-200 resize-none outline-none focus:border-amber-500" placeholder="今天發生了什麼有趣的事？..." /><button onClick={handleSave} className="mt-4 w-full bg-white text-black py-3 rounded-xl font-bold">儲存日記</button></>
           ) : (<div className="flex-1 text-zinc-300 whitespace-pre-wrap leading-relaxed">{diaries[`day-${activeDay}`] || <span className="text-zinc-700 italic">點擊編輯按鈕開始記錄...</span>}</div>)}
       </div>
    </div>
  );
}

// 6. 任務視圖 (更新版：拍照上傳)
function MissionsView({ user }) {
  const [missionData, setMissionData] = useState({});
  const [activeMissionId, setActiveMissionId] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if(!user) return;
    return onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'missions'), (snap) => {
        const d = {}; 
        snap.forEach(doc => d[doc.id] = doc.data()); 
        setMissionData(d);
    });
  }, [user]);

  const handleCameraClick = (missionId) => {
      setActiveMissionId(missionId);
      if(fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file || !activeMissionId) return;

      setUploading(true);
      try {
          const compressed = await compressImage(file);
          const base64 = await blobToBase64(compressed);
          
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'missions', activeMissionId), { 
              completed: true, 
              image: base64,
              completedAt: serverTimestamp()
          }, { merge: true });
          
      } catch (error) {
          console.error("Upload failed", error);
          alert("上傳失敗");
      } finally {
          setUploading(false);
          setActiveMissionId(null);
          e.target.value = '';
      }
  };

  const deleteMissionPhoto = async (id) => {
      if(!confirm("確定要刪除照片並重置任務嗎？")) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'missions', id));
  };

  return (
    <div className="space-y-4 pb-20">
        <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleFileChange} 
        />

        {uploading && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-zinc-900 p-4 rounded-xl flex items-center gap-3 border border-white/10 shadow-xl">
                    <Loader2 className="animate-spin text-amber-500"/> <span className="text-white font-bold">照片上傳中...</span>
                </div>
            </div>
        )}

        {MISSIONS.map(m => {
            const data = missionData[m.id];
            const isCompleted = !!data?.completed;
            const hasImage = !!data?.image;

            return (
                <div key={m.id} className={`rounded-2xl border transition-all overflow-hidden ${isCompleted ? 'bg-zinc-900/80 border-amber-500/50' : 'bg-zinc-900 border-white/5'}`}>
                    <div className="p-4 flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="mt-1 text-2xl filter drop-shadow-lg">{m.icon}</div>
                            <div>
                                <div className={`font-bold text-lg ${isCompleted ? 'text-amber-400' : 'text-zinc-200'}`}>{m.title}</div>
                                <div className="text-xs text-zinc-500 mb-1">{m.desc}</div>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                    <MapPin size={10}/> {m.location}
                                </div>
                            </div>
                        </div>
                        
                        {isCompleted ? (
                            <button onClick={() => deleteMissionPhoto(m.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-2">
                                <Trash2 size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleCameraClick(m.id)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 p-3 rounded-xl transition-colors border border-white/5 flex flex-col items-center gap-1 group"
                            >
                                <Camera size={20} className="group-hover:text-white transition-colors"/>
                            </button>
                        )}
                    </div>

                    {hasImage && (
                        <div className="relative h-48 w-full mt-2 group">
                            <img src={data.image} className="w-full h-full object-cover opacity-90" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
                                <span className="text-amber-400 text-xs font-bold font-mono flex items-center gap-2 border border-amber-400/30 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
                                    <Trophy size={12}/> MISSION COMPLETED
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
    </div>
  );
}

function MemoirPreview({ items, onClose }) {
    return (
        <div className="fixed inset-0 bg-black z-[90] overflow-y-auto p-4 animate-in slide-in-from-bottom">
            <div className="max-w-md mx-auto bg-white text-black min-h-screen rounded-3xl p-8 relative">
                <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                <h1 className="text-4xl font-black mb-2 tracking-tighter">HOKURIKU</h1>
                <h2 className="text-xl font-medium text-gray-500 mb-8 uppercase tracking-widest">Winter Memoir 2025</h2>
                <div className="space-y-8">
                    {items.map((item) => (
                        <div key={item.id} className="break-inside-avoid">
                            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl mb-3 bg-gray-100"><img src={item.image} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" /></div>
                            <div className="flex justify-between items-baseline border-b-2 border-black pb-2 mb-2"><span className="font-bold text-lg">{item.title}</span><span className="text-xs font-mono text-gray-400">{item.date}</span></div>
                            <div className="flex gap-2"><span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{item.tag}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
