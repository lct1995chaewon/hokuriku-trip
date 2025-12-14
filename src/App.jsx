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
  ChevronRight,
  Train, 
  Languages,
  LayoutGrid,
  Bed,
  Coffee,
  Mountain,
  Utensils
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

// --- 輔助資料 (2025年版本) ---
const DATES = [
  "12/22 (一)", "12/23 (二)", "12/24 (三)", "12/25 (四)", 
  "12/26 (五)", "12/27 (六)", "12/28 (日)", "12/29 (一)"
];

// --- 預設詳細行程 ---
const DEFAULT_ITINERARY = {
  "day-0": [ // 12/22 (一)
    { id: "d1-flight", time: "14:30", title: "✈️ UO802 HKG -> KMQ", note: "19:00 抵達小松", type: "flight", isSystem: true },
    { id: "d1-bus", time: "19:40", title: "🚌 機場巴士 -> 金澤站", note: "往金澤站東口 (約40分)", type: "transport", isSystem: true },
    { id: "d1-hotel", time: "20:30", title: "🏨 Garden Hotel Kanazawa", note: "金澤站東口步行1分鐘 / 記得寄行李!", type: "hotel", isSystem: true }
  ],
  "day-1": [ // 12/23 (二)
    { id: "d2-shinkansen", time: "07:19", title: "🚄 Hakutaka 554 -> 富山", note: "預約號: 44368 / 07:42著", type: "transport", isSystem: true },
    { id: "d2-hida", time: "07:58", title: "🚆 Hida 6號 -> 高山", note: "8車 12-D / 預約號: 47964 / 09:28著", type: "transport", isSystem: true },
    { id: "d2-bus-out", time: "10:40", title: "🚌 高山 -> 新穗高纜車", note: "買奧飛驒套票 / 12:16著", type: "transport", isSystem: true },
    { id: "d2-ropeway", time: "12:30", title: "🏔️ 新穗高纜車", note: "2156m 山頂看雪 (停2.5hr)", type: "activity", isSystem: true },
    { id: "d2-bus-back", time: "14:55", title: "🚌 新穗高 -> 高山", note: "16:31 抵達高山", type: "transport", isSystem: true },
    { id: "d2-dinner", time: "18:00", title: "🥩 晚餐: 味藏天國", note: "飛驒牛燒肉", type: "food", isSystem: true },
    { id: "d2-hotel", time: "20:00", title: "🏨 Hotel Around Takayama", note: "高山站步行 3-4 分鐘", type: "hotel", isSystem: true }
  ],
  "day-2": [ // 12/24 (三)
    { id: "d3-morning", time: "09:00", title: "🍎 宮川朝市 / 高山陣屋", note: "雪中京都風情", type: "activity", isSystem: true },
    { id: "d3-train", time: "13:17", title: "🚆 Hida -> 富山", note: "前往富山 Check-in", type: "transport", isSystem: true },
    { id: "d3-starbucks", time: "17:00", title: "☕ 富山環水公園", note: "最美星巴克點燈", type: "activity", isSystem: true },
    { id: "d3-hotel", time: "19:00", title: "🏨 Dormy Inn 富山", note: "訂單: 135904111464567 / 天然溫泉", type: "hotel", isSystem: true }
  ],
  "day-3": [ // 12/25 (四)
    { id: "d4-city", time: "10:00", title: "🏛️ 富山市區", note: "玻璃美術館 / 富山城", type: "activity", isSystem: true },
    { id: "d4-train", time: "13:30", title: "🚃 電鐵富山 -> 宇奈月", note: "14:45 抵達", type: "transport", isSystem: true },
    { id: "d4-hotel", time: "15:00", title: "🏨 大江戶溫泉物語", note: "雪見露天風呂 / 晚餐Buffet", type: "hotel", isSystem: true }
  ],
  "day-4": [ // 12/26 (五)
    { id: "d5-train", time: "18:30", title: "🚃 宇奈月 -> 富山", note: "電鐵末班車確認", type: "transport", isSystem: true },
    { id: "d5-hotel", time: "20:00", title: "🏨 Dormy Inn 富山", note: "續住 / 泡湯", type: "hotel", isSystem: true }
  ],
  "day-5": [ // 12/27 (六)
    { id: "d6-day", time: "10:00", title: "🌨️ 雨晴海岸 / 高岡", note: "哆啦A夢散步道 / 瑞龍寺", type: "activity", isSystem: true },
    { id: "d6-hotel", time: "18:00", title: "🏨 Dormy Inn 富山", note: "大雪泡溫泉", type: "hotel", isSystem: true }
  ],
  "day-6": [ // 12/28 (日)
    { id: "d7-checkout", time: "10:00", title: "Check-out -> 金澤", note: "新幹線 20 分鐘", type: "transport", isSystem: true },
    { id: "d7-garden", time: "13:00", title: "🌲 兼六園", note: "專攻雪吊+積雪拍照", type: "activity", isSystem: true },
    { id: "d7-hotel", time: "18:00", title: "🏨 Garden Hotel Kanazawa", note: "站前買手信", type: "hotel", isSystem: true }
  ],
  "day-7": [ // 12/29 (一)
    { id: "d8-market", time: "10:00", title: "🦀 近江町市場", note: "最後採買", type: "food", isSystem: true },
    { id: "d8-bus", time: "16:30", title: "🚌 金澤西口 -> 小松機場", note: "17:15 抵達", type: "transport", isSystem: true },
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

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-zinc-900/90 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 ring-1 ring-white/10">
            <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
            <p className="text-zinc-400 text-sm mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-zinc-400 bg-white/5 hover:bg-white/10 transition-colors">取消</button>
                <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500/80 hover:bg-red-500 shadow-lg shadow-red-500/20 transition-colors">刪除</button>
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

function TabButton({ icon, label, active, onClick, isAlert }) {
  let activeColor = isAlert ? 'text-orange-400' : 'text-cyan-400';
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 w-full h-full ${active ? `${activeColor} scale-110` : 'text-zinc-500 hover:text-zinc-300'}`}>
      <div className="relative">
        {icon}
        {active && <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isAlert ? 'bg-orange-400' : 'bg-cyan-400'}`}></span>}
      </div>
      <span className="text-[10px] font-medium opacity-80">{label}</span>
    </button>
  );
}

// --- App 主元件 ---

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('itinerary'); 
  const [ocrReady, setOcrReady] = useState(false);

  useEffect(() => {
    if (window.Tesseract) {
        setOcrReady(true);
        return;
    }
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => setOcrReady(true);
    script.onerror = () => setOcrReady(false);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch (e) { await signInAnonymously(auth); }
      } else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-zinc-800">
      
      {/* 氛圍背景光 */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] rounded-full bg-purple-600/10 blur-[80px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] rounded-full bg-cyan-600/5 blur-[90px]"></div>
      </div>

      {/* 頂部導航 */}
      <header className="bg-black/30 backdrop-blur-md pt-12 pb-4 px-6 sticky top-0 z-20 border-b border-white/5">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 drop-shadow-lg">
          {activeTab === 'itinerary' && <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">北陸 2025 <span className="text-blue-400 font-mono text-lg">12/22</span></span>}
          {activeTab === 'weather' && <span className="bg-gradient-to-r from-blue-200 to-indigo-300 bg-clip-text text-transparent">天氣預報</span>}
          {activeTab === 'expenses' && <span className="bg-gradient-to-r from-emerald-200 to-teal-300 bg-clip-text text-transparent">消費記帳</span>}
          {activeTab === 'tools' && <span className="bg-gradient-to-r from-orange-200 to-red-400 bg-clip-text text-transparent">旅途工具</span>}
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
            {activeTab === 'expenses' && <ExpensesView user={user} ocrReady={ocrReady} />}
            {activeTab === 'tools' && <ToolsView />}
            {activeTab === 'missions' && <MissionsView user={user} />}
          </>
        )}
      </main>

      {/* 2. 懸浮導航島 (Floating Dock) */}
      <nav className="absolute bottom-6 left-4 right-4 h-16 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full z-30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-5 h-full items-center justify-items-center relative">
            <TabButton icon={<Calendar size={20} />} label="行程" active={activeTab === 'itinerary'} onClick={() => setActiveTab('itinerary')} />
            <TabButton icon={<CloudSnow size={20} />} label="天氣" active={activeTab === 'weather'} onClick={() => setActiveTab('weather')} />
            
            <div className="relative flex justify-center items-center w-full h-full">
                <button onClick={() => setActiveTab('missions')} className={`absolute -top-6 w-14 h-14 rounded-full flex items-center justify-center border-4 border-black transition-all shadow-lg ${activeTab === 'missions' ? 'bg-amber-400 text-black shadow-amber-400/40 scale-110' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    <Trophy size={24} className={activeTab === 'missions' ? 'fill-black/20' : ''} />
                </button>
            </div>

            <TabButton icon={<CreditCard size={20} />} label="記帳" active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
            <TabButton icon={<LayoutGrid size={20} />} label="工具" active={activeTab === 'tools'} onClick={() => setActiveTab('tools')} isAlert />
        </div>
      </nav>
    </div>
  );
}

// --- Views ---

function ToolsView() {
  const [activePhrase, setActivePhrase] = useState(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 交通看板 */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-lg relative">
        <div className="bg-black/50 p-3 border-b border-zinc-700 flex justify-between items-center backdrop-blur-sm">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Train size={16} className="text-green-400" /> 行程關鍵列車
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono animate-pulse">STATUS</span>
        </div>
        <div className="p-4 space-y-3 font-mono text-sm">
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-white font-bold">Hakutaka 554</span>
                    <span className="text-xs text-zinc-500">金澤 -> 富山</span>
                </div>
                <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded text-xs">正常運行</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-white font-bold">Hida 6</span>
                    <span className="text-xs text-zinc-500">富山 -> 高山</span>
                </div>
                <span className="text-green-400 font-bold bg-green-400/10 px-2 py-0.5 rounded text-xs">正常運行</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                <div className="flex flex-col">
                    <span className="text-zinc-300">濃飛巴士</span>
                    <span className="text-xs text-zinc-500">奧飛驒線</span>
                </div>
                <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded text-xs">注意雪況</span>
            </div>
        </div>
        <a href="https://trafficinfo.westjr.co.jp/hokuriku.html" target="_blank" rel="noopener noreferrer" className="block w-full text-center bg-zinc-800/50 py-2 text-xs text-blue-400 hover:bg-zinc-800 transition-colors border-t border-zinc-700">
            JR 西日本運行情報 →
        </a>
      </div>

      {/* 翻譯指差卡 */}
      <div>
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <Languages size={18} className="text-purple-400" /> 翻譯指差卡
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {PHRASES.map((p, idx) => (
                <button 
                    key={idx}
                    onClick={() => setActivePhrase(p)}
                    className="bg-zinc-800/60 border border-white/5 p-4 rounded-2xl text-left hover:bg-zinc-700 transition-all active:scale-95 group"
                >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform origin-left">{p.icon}</div>
                    <div className="text-sm font-bold text-white mb-0.5">{p.zh}</div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate">{p.romaji}</div>
                </button>
            ))}
        </div>
      </div>

      {/* 防災安全 */}
      <div className="bg-red-900/10 border border-red-500/20 p-5 rounded-3xl">
        <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2">
            <ShieldAlert size={18} /> 緊急求助
        </h3>
        <div className="flex gap-3">
            <a href="tel:110" className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-center text-xl shadow-lg hover:bg-red-400 transition-colors">110</a>
            <a href="tel:119" className="flex-1 bg-red-500 text-white py-3 rounded-xl font-black text-center text-xl shadow-lg hover:bg-red-400 transition-colors">119</a>
        </div>
        <div className="mt-4 pt-4 border-t border-red-500/20">
             <ExternalLinkItem title="Google 避難所地圖" desc="尋找最近避難點" url="https://www.google.com/maps/search/evacuation+shelter" color="zinc" />
        </div>
      </div>

      {/* 翻譯放大 Modal */}
      {activePhrase && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setActivePhrase(null)}>
            <div className="w-full max-w-sm text-center">
                <div className="text-8xl mb-6 animate-bounce">{activePhrase.icon}</div>
                <p className="text-zinc-400 text-sm mb-2 uppercase tracking-widest">Show this to staff</p>
                <h2 className="text-3xl font-black text-white leading-tight mb-4 border-2 border-white/20 p-6 rounded-3xl bg-zinc-900">
                    {activePhrase.jp}
                </h2>
                <p className="text-xl text-yellow-400 font-mono mb-8">{activePhrase.romaji}</p>
                <p className="text-zinc-500 text-sm">({activePhrase.zh})</p>
                <p className="text-zinc-600 text-xs mt-8">點擊任意處關閉</p>
            </div>
        </div>
      )}

    </div>
  );
}

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

      Object.keys(DEFAULT_ITINERARY).forEach(key => {
        if (!itemsData[key] || itemsData[key].length === 0) {
           itemsData[key] = DEFAULT_ITINERARY[key];
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
      createdAt: Date.now(),
      type: 'activity'
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
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-4 gap-2 mb-6 px-1">
        {DATES.map((dateStr, index) => {
          const [date, weekDay] = dateStr.split(' ');
          const isActive = activeDay === index;
          
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

          <div className="space-y-6 relative pl-3">
            {dayActivities.length > 0 && (
                <div className="absolute left-[31px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-transparent via-zinc-800 to-transparent"></div>
            )}

            {dayActivities.map((item) => {
              const style = getItemStyle(item.type);
              return (
                <div key={item.id} className="relative flex gap-5 items-start group">
                    <div className={`z-10 w-3 h-3 rounded-full mt-2.5 flex-shrink-0 ring-4 ring-black bg-${style.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`}></div>
                    
                    <div className={`flex-1 rounded-2xl p-4 transition-all relative border group-hover:-translate-y-1 duration-300 bg-${style.bg} border-${style.border} hover:bg-zinc-800/60`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-mono font-bold text-zinc-400">{item.time}</span>
                                    {style.icon}
                                </div>
                                <div className={`font-bold text-lg mb-1 text-white`}>{item.title}</div>
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
              );
            })}
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

function ExpensesView({ user, ocrReady }) {
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
    if (!imagePreview) return;
    setIsAnalyzing(true);
    setScanError(null);

    try {
      if (!window.Tesseract) {
        throw new Error("OCR 引擎載入中，請稍後再試");
      }

      const compressedBlob = await compressImage(fileRef.current);
      const compressedUrl = URL.createObjectURL(compressedBlob);

      const { data: { text } } = await window.Tesseract.recognize(
        compressedUrl,
        'eng', 
        { logger: m => console.log(m) }
      );

      const numbers = text.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?/g);
      
      if (numbers && numbers.length > 0) {
         const validNumbers = numbers.map(n => parseFloat(n.replace(/,/g, ''))).filter(n => !isNaN(n));
         const maxNum = validNumbers.sort((a,b)=>b-a)[0];
         if (maxNum) setAmount(maxNum);
      }
      
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      if (lines.length > 0) {
        const descLine = lines.find(l => !/^\d+$/.test(l.replace(/[,.]/g, ''))) || lines[0];
        setDescription(descLine.substring(0, 20)); 
      }

    } catch (error) {
      console.error(error);
      setScanError("OCR 辨識失敗");
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
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 border border-emerald-500/20 p-8 rounded-[2rem] shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] relative overflow-hidden group">
        <div className="absolute -right-16 -bottom-16 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-500">
            <CreditCard size={200} />
        </div>
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
                disabled={!ocrReady} 
                className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-pulse hover:scale-105 transition-transform uppercase tracking-wider disabled:opacity-50"
                >
                {ocrReady ? <><ScanLine size={12} /> OCR 掃描</> : <><Loader2 size={12} className="animate-spin" /> 載入引擎中...</>}
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
                <span className="text-[10px] font-mono tracking-widest">文字辨識中...</span>
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
            <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
        </div>

        {scanError && (
             <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 break-all">
                 <AlertTriangle size={14} className="flex-shrink-0" />
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
