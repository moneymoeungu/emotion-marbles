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
  const router = useRouter();
  const [marbles, setMarbles] = useState([]);
  const [archives, setArchives] = useState([]);
  const [tab, setTab] = useState('jar');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [memo, setMemo] = useState('');
  const [isAnon, setIsAnon] = useState(false);
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
    const newMarble = { id: Date.now(), emotion: selectedEmotion, text: memo.trim(), anon: isAnon, ts: Date.now() };
    let newMarbles = [...marbles, newMarble].sort((a,b) => a.ts - b.ts);
    let newArchives = archives;
    
    if (newMarbles.length >= 20) {
      newArchives = [...archives, { id: Date.now(), marbles: newMarbles, completedAt: Date.now() }];
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

  const copyLink = () => {
    const payload = btoa(JSON.stringify({ marbles, createdAt: Date.now() }));
    const link = `${window.location.origin}?jar=${payload}`;
    
    // 무조건 복사되는 마법의 코드
    const el = document.createElement('textarea');
    el.value = link; el.style.position = 'absolute'; el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      showNotif('🔗 공유 링크가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showNotif('❌ 복사에 실패했습니다.');
    }
    document.body.removeChild(el);
  };

  const getTimeAgo = (ts) => {
    const d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(d / 3600000);
    if (m < 1) return '방금 전'; if (m < 60) return `${m}분 전`; if (h < 24) return `${h}시간 전`;
    return `${Math.floor(d / 86400000)}일 전`;
  };

  // ★ 완벽한 대칭을 가진 둥글포근한 유리병 컴포넌트 (image_defb3b.png 스타일)
  const GlassJar = ({ items }) => (
    <div style={{ position: 'relative', width: 220, height: 280, margin: '20px auto 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* 병 입구 */}
      <div style={{ width: 100, height: 20, background: 'rgba(255,255,255,0.4)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '10px 10px 0 0', position: 'relative', zIndex: 2 }} />
      {/* 병 몸통 (대칭 둥근 실루엣) */}
      <div style={{ width: '100%', height: 'calc(100% - 20px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1))', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '30px 30px 80px 80px', backdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)', boxShadow: '0 10px 40px rgba(0,0,0,0.06), inset 0 0 25px rgba(255,255,255,0.4)', display: 'flex', flexWrap: 'wrap-reverse', alignContent: 'flex-start', justifyContent: 'center', padding: '30px 20px', gap: 6, overflow: 'hidden' }}>
        {items.map((m, i) => (
          <div key={m.id} style={{ position: 'relative' }} onMouseEnter={() => setHoveredMarble(m.id)} onMouseLeave={() => setHoveredMarble(null)}>
            <div style={marbleStyle(EMOTIONS.find(e => e.id === m.emotion).color, 32)} />
            {hoveredMarble === m.id && (
              <div style={{ position: 'absolute', bottom: '125%', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '10px 14px', borderRadius: 14, fontSize: 12, width: 160, boxShadow: '0 8px 25px rgba(0,0,0,0.12)', zIndex: 10, lineHeight: 1.5, color: '#2a2050' }}>
                <div style={{ fontSize: 10, color: '#a090c0', marginBottom: 4 }}>{EMOTIONS.find(e => e.id === m.emotion).name}</div>
                <div>{m.anon ? '(익명) ' : ''}{m.text}</div>
                <div style={{ fontSize: 10, color: '#a090c0', marginTop: 6 }}>{getTimeAgo(m.ts)}</div>
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
        <h1 style={{ textAlign: 'center', color: '#7c5cbf', fontSize: 24, fontWeight: 700, letterSpacing: 3, marginBottom: 25, textTransform: 'uppercase' }}>Emotion Marbles</h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 25 }}>
          {[['jar','🫙 나의 병'],['add','✦ 기록'],['share','↗ 공유'],['archive','◎ 보관함']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab===id ? '#7c5cbf' : 'rgba(255,255,255,0.7)', color: tab===id ? '#fff' : '#7c5cbf', border: 'none', padding: '10px 18px', borderRadius: 25, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>

        {tab === 'jar' && (
          <div style={{ textAlign: 'center' }}>
            <GlassJar items={marbles} />
            <p style={{ color: '#a090c0', fontSize: 13, marginTop: 10 }}>{marbles.length} / 20 구슬</p>
          </div>
        )}
        
        {tab === 'add' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 25, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {EMOTIONS.map(e => (
                <button key={e.id} onClick={() => setSelectedEmotion(e.id)} style={{ background: selectedEmotion === e.id ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.6)', border: `1px solid ${selectedEmotion===e.id ? e.color+'88' : 'rgba(160,140,220,.2)'}`, borderRadius: 16, padding: '12px 6px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  <div style={{ ...marbleStyle(e.color, 26), margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 10, color: '#7060a0' }}>{e.name}</div>
                </button>
              ))}
            </div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} maxLength={500} placeholder="오늘의 감정을 기록해보세요" style={{ width: '100%', height: 120, padding: 18, borderRadius: 18, border: '1px solid rgba(160,140,220,.2)', marginBottom: 15, resize: 'none', fontSize: 14, color: '#2a2050', outline: 'none', lineHeight: 1.6 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }} onClick={() => setIsAnon(!isAnon)}>
              <div style={{ width: 36, height: 20, background: isAnon ? 'rgba(124,92,191,.5)' : 'rgba(160,140,220,.2)', borderRadius: 10, position: 'relative', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', width: 14, height: 14, background: '#fff', borderRadius: '50%', top: 3, left: isAnon ? 19 : 3, transition: 'left .2s' }} />
              </div>
              <span style={{ fontSize: 12, color: '#7060a0' }}>익명으로 저장</span>
            </div>
            <button onClick={addMarble} disabled={!selectedEmotion || !memo.trim()} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#7c5cbf,#4e8de8)', color: '#fff', border: 'none', borderRadius: 18, fontWeight: 'bold', cursor: 'pointer', opacity: (!selectedEmotion || !memo.trim()) ? 0.4 : 1, transition: 'opacity 0.2s' }}>구슬에 담기 ✦</button>
          </div>
        )}

        {tab === 'share' && (
          <div style={{ background: '#fff', padding: 30, borderRadius: 25, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🔗</div>
            <h3 style={{ fontSize: 16, color: '#7c5cbf', marginBottom: 15 }}>나의 감정 구슬 병 공유하기</h3>
            <button onClick={copyLink} style={{ width: '100%', padding: 16, background: copied ? '#00C87A' : '#7c5cbf', color: '#fff', border: 'none', borderRadius: 18, fontWeight: 'bold', cursor: 'pointer' }}>
              {copied ? '✓ 복사완료!' : '🔗 공유 링크 복사하기'}
            </button>
          </div>
        )}

        {tab === 'archive' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#7c5cbf', fontSize: 15, fontWeight: 'bold', marginBottom: 5 }}>가득 찬 유리병들이</p>
            <p style={{ color: '#a090c0', fontSize: 13, marginBottom: 30 }}>안전하게 보관되어 있어요</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {archives.length === 0 ? <p style={{ gridColumn: '1/3', color: '#c0b0e0' }}>아직 보관된 병이 없어요</p> : archives.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.6)', padding: 15, borderRadius: 25, boxShadow: '0 5px 15px rgba(0,0,0,0.03)' }}>
                  <GlassJar items={a.marbles} />
                  <p style={{ fontSize: 11, color: '#a090c0', marginTop: -20 }}>{new Date(a.completedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {notif && <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: 'rgba(50,50,50,0.9)', color: '#fff', padding: '12px 25px', borderRadius: 30, fontSize: 14, zIndex: 100, boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}>{notif}</div>}
    </div>
  );
}

const DynamicHome = dynamic(() => Promise.resolve(HomeContent), { ssr: false });
export default function Home() { return <><Head><title>Emotion Marbles</title></Head><DynamicHome /></>; }
