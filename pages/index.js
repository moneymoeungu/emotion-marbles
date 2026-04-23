import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

const EMOTIONS = [
  { id: 'happy',   name: '행복',   color: '#FFD700' },
  { id: 'excited', name: '설렘',   color: '#FF69B4' },
  { id: 'calm',    name: '평온',   color: '#00C87A' },
  { id: 'joy',     name: '즐거움', color: '#FF8C00' },
  { id: 'sad',     name: '슬픔',   color: '#1E90FF' },
  { id: 'angry',   name: '분노',   color: '#FF4500' },
  { id: 'anxious', name: '불안',   color: '#9370DB' },
  { id: 'tired',   name: '무기력', color: '#8899AA' },
];

function darken(hex, f = 0.55) {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * f);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * f);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * f);
  return `rgb(${r},${g},${b})`;
}

function marbleStyle(color, size = 28) {
  return {
    width: size, height: size, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
    background: `radial-gradient(circle at 35% 32%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.5) 10%, ${color}DD 28%, ${color}AA 52%, ${color}77 74%, ${darken(color)} 100%)`,
    boxShadow: `inset -2px -2px 5px rgba(0,0,0,.15), inset 2px 2px 5px rgba(255,255,255,.7), 0 0 ${Math.round(size / 2)}px ${color}44, 0 3px 10px rgba(0,0,0,.12)`,
    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };
}

function HomeContent() {
  const [marbles, setMarbles] = useState([]);
  const [archives, setArchives] = useState([]);
  const [tab, setTab] = useState('jar');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [memo, setMemo] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notif, setNotif] = useState('');
  const [sharedData, setSharedData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hoveredMarble, setHoveredMarble] = useState(null);
  
  const audioRef = useRef(null);

  useEffect(() => {
    setMarbles(JSON.parse(localStorage.getItem('em_marbles') || '[]'));
    setArchives(JSON.parse(localStorage.getItem('em_archives') || '[]'));
    
    const params = new URLSearchParams(window.location.search);
    const jarData = params.get('jar');
    if (jarData) {
      try { setSharedData(JSON.parse(atob(jarData))); } catch (e) { console.error(e); }
    }
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const save = (m, a) => {
    localStorage.setItem('em_marbles', JSON.stringify(m));
    localStorage.setItem('em_archives', JSON.stringify(a));
  };

  const showNotif = (msg) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 2500);
  };

  const addMarble = () => {
    if (!memo.trim() || !selectedEmotion) return;
    playSound();
    const newMarble = { id: Date.now(), emotion: selectedEmotion, text: memo.trim(), ts: new Date(selectedDate).getTime() };
    let newMarbles = [...marbles, newMarble].sort((a,b) => a.ts - b.ts);
    let newArchives = archives;
    
    if (newMarbles.length >= 20) {
      newArchives = [...archives, { marbles: newMarbles, completedAt: Date.now() }];
      newMarbles = [];
      showNotif('🎉 병이 가득 차서 보관함에 저장했어요!');
    } else {
      showNotif('✨ 구슬을 병에 담았습니다');
    }
    setMarbles(newMarbles);
    setArchives(newArchives);
    save(newMarbles, newArchives);
    setMemo(''); setSelectedEmotion(null); setTab('jar');
  };

  const copyLink = async () => {
    const payload = btoa(JSON.stringify({ marbles, createdAt: Date.now() }));
    const link = `${window.location.origin}?jar=${payload}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showNotif('🔗 공유 링크가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // 구형 브라우저 대응용 임시 텍스트 에어리어 방식
      const t = document.createElement("textarea");
      document.body.appendChild(t);
      t.value = link; t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      setCopied(true);
      showNotif('🔗 링크가 복사되었습니다!');
    }
  };

  // 유리병 렌더링 컴포넌트
  const GlassJar = ({ items }) => (
    <div style={{ position: 'relative', width: 220, height: 280, margin: '20px auto' }}>
      {/* 병 입구 */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 20, background: 'rgba(255,255,255,0.4)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '10px 10px 0 0', zIndex: 2 }} />
      {/* 병 몸통 */}
      <div style={{ position: 'absolute', top: 18, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '20px 20px 60px 60px', backdropFilter: 'blur(4px)', boxShadow: '0 10px 30px rgba(0,0,0,0.05), inset 0 0 20px rgba(255,255,255,0.4)', display: 'flex', flexWrap: 'wrap-reverse', alignContent: 'flex-start', justifyContent: 'center', padding: '20px 15px', gap: 6, overflow: 'hidden' }}>
        {items.map((m, i) => (
          <div key={m.id} style={{ position: 'relative' }} onMouseEnter={() => setHoveredMarble(m.id)} onMouseLeave={() => setHoveredMarble(null)}>
            <div style={marbleStyle(EMOTIONS.find(e => e.id === m.emotion).color, 32)} />
            {hoveredMarble === m.id && (
              <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '8px 12px', borderRadius: 12, fontSize: 12, width: 140, boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 10 }}>
                {m.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeff', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" />
      
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#7c5cbf', letterSpacing: 2 }}>EMOTION MARBLES</h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '20px 0' }}>
          {[['jar','🫙 나의 병'],['add','✦ 기록'],['share','↗ 공유'],['archive','◎ 보관함']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab===id ? '#7c5cbf' : '#fff', color: tab===id ? '#fff' : '#7c5cbf', border: 'none', padding: '8px 15px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>{label}</button>
          ))}
        </div>

        {tab === 'jar' && <GlassJar items={marbles} />}
        
        {tab === 'add' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 25, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 15, borderRadius: 10, border: '1px solid #eee' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
              {EMOTIONS.map(e => (
                <div key={e.id} onClick={() => setSelectedEmotion(e.id)} style={{ cursor: 'pointer', textAlign: 'center', opacity: selectedEmotion === e.id ? 1 : 0.5 }}>
                  <div style={{ ...marbleStyle(e.color, 30), margin: '0 auto' }} />
                  <div style={{ fontSize: 10, marginTop: 5 }}>{e.name}</div>
                </div>
              ))}
            </div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="기억하고 싶은 감정을 적어주세요" style={{ width: '100%', height: 100, padding: 15, borderRadius: 15, border: '1px solid #eee', marginBottom: 15, resize: 'none' }} />
            <button onClick={addMarble} style={{ width: '100%', padding: 15, background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: 15, fontWeight: 'bold', cursor: 'pointer' }}>구슬 담기 ✦</button>
            <div style={{ marginTop: 20 }}><GlassJar items={marbles.slice(-3)} /></div>
          </div>
        )}

        {tab === 'share' && (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 25 }}>
            <div style={{ fontSize: 50, marginBottom: 20 }}>🔗</div>
            <button onClick={copyLink} style={{ padding: '15px 30px', background: copied ? '#00C87A' : '#7c5cbf', color: '#fff', border: 'none', borderRadius: 15, cursor: 'pointer' }}>
              {copied ? '✓ 복사완료!' : '공유 링크 복사하기'}
            </button>
          </div>
        )}
      </div>

      {notif && <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 25px', borderRadius: 30, fontSize: 14, zIndex: 100 }}>{notif}</div>}
    </div>
  );
}

const DynamicHome = dynamic(() => Promise.resolve(HomeContent), { ssr: false });
export default function Home() { return <><Head><title>Emotion Marbles</title></Head><DynamicHome /></>; }
