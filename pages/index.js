import Head from 'next/head';
import { useState, useEffect } from 'react';
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
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `radial-gradient(circle at 35% 32%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.5) 10%, ${color}DD 28%, ${color}AA 52%, ${color}77 74%, ${darken(color)} 100%)`,
    boxShadow: `inset -2px -2px 5px rgba(0,0,0,.15), inset 2px 2px 5px rgba(255,255,255,.7), 0 0 ${Math.round(size / 2)}px ${color}44, 0 3px 10px rgba(0,0,0,.12)`,
  };
}

function HomeContent() {
  const [marbles, setMarbles] = useState([]);
  const [archives, setArchives] = useState([]);
  const [tab, setTab] = useState('jar');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [memo, setMemo] = useState('');
  const [notif, setNotif] = useState('');
  const [sharedData, setSharedData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hoveredMarble, setHoveredMarble] = useState(null);

  useEffect(() => {
    setMarbles(JSON.parse(localStorage.getItem('em_marbles') || '[]'));
    setArchives(JSON.parse(localStorage.getItem('em_archives') || '[]'));
    const params = new URLSearchParams(window.location.search);
    const jarData = params.get('jar');
    if (jarData) {
      try { setSharedData(JSON.parse(atob(jarData))); } catch (e) { console.error(e); }
    }
  }, []);

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
    const newMarble = { id: Date.now(), emotion: selectedEmotion, text: memo.trim(), ts: Date.now() };
    let newMarbles = [...marbles, newMarble];
    let newArchives = archives;
    if (newMarbles.length >= 20) {
      newArchives = [...archives, { id: Date.now(), marbles: newMarbles, completedAt: Date.now() }];
      newMarbles = [];
      showNotif('🎉 병이 가득 찼어요! 보관함에서 확인하세요.');
    } else {
      showNotif('✨ 구슬이 담겼어요');
    }
    setMarbles(newMarbles);
    setArchives(newArchives);
    save(newMarbles, newArchives);
    setMemo(''); setSelectedEmotion(null); setTab('jar');
  };

  // ★ 무조건 복사되는 마법의 코드
  const copyLink = () => {
    const payload = btoa(JSON.stringify({ marbles, createdAt: Date.now() }));
    const link = `${window.location.origin}?jar=${payload}`;
    const el = document.createElement('textarea');
    el.value = link;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    showNotif('🔗 공유 링크가 복사되었습니다!');
    setTimeout(() => setCopied(false), 2000);
  };

  const GlassJar = ({ items, sizeScale = 1 }) => (
    <div style={{ position: 'relative', width: 200 * sizeScale, height: 260 * sizeScale, margin: '20px auto' }}>
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80 * sizeScale, height: 20 * sizeScale, background: 'rgba(255,255,255,0.4)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: '15px 15px 0 0', zIndex: 2 }} />
      <div style={{ position: 'absolute', top: 18 * sizeScale, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '30px 30px 70px 70px', backdropFilter: 'blur(4px)', display: 'flex', flexWrap: 'wrap-reverse', alignContent: 'flex-start', justifyContent: 'center', padding: 20 * sizeScale, gap: 4, overflow: 'hidden' }}>
        {items.map((m, i) => <div key={m.id} style={marbleStyle(EMOTIONS.find(e => e.id === m.emotion).color, 28 * sizeScale)} />)}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeff', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#7c5cbf', letterSpacing: 2, marginBottom: 30 }}>EMOTION MARBLES</h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
          {[['jar','🫙 나의 병'],['add','✦ 기록'],['share','↗ 공유'],['archive','◎ 보관함']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab===id ? '#7c5cbf' : '#fff', color: tab===id ? '#fff' : '#7c5cbf', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13 }}>{label}</button>
          ))}
        </div>

        {tab === 'jar' && (
          <div style={{ textAlign: 'center' }}>
            <GlassJar items={marbles} />
            <p style={{ color: '#a090c0', fontSize: 13, marginTop: 10 }}>{marbles.length} / 20 구슬</p>
          </div>
        )}

        {tab === 'add' && (
          <div style={{ background: '#fff', padding: 25, borderRadius: 25, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
              {EMOTIONS.map(e => (
                <div key={e.id} onClick={() => setSelectedEmotion(e.id)} style={{ cursor: 'pointer', textAlign: 'center', opacity: selectedEmotion === e.id ? 1 : 0.4 }}>
                  <div style={{ ...marbleStyle(e.color, 26), margin: '0 auto 5px' }} />
                  <div style={{ fontSize: 10 }}>{e.name}</div>
                </div>
              ))}
            </div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="오늘의 감정을 적어주세요" style={{ width: '100%', height: 100, padding: 15, borderRadius: 15, border: '1px solid #eee', marginBottom: 15, resize: 'none' }} />
            <button onClick={addMarble} style={{ width: '100%', padding: 15, background: '#7c5cbf', color: '#fff', border: 'none', borderRadius: 15, fontWeight: 'bold' }}>구슬 담기 ✦</button>
          </div>
        )}

        {tab === 'share' && (
          <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 25 }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>↗</div>
            <h3 style={{ color: '#7c5cbf', marginBottom: 20 }}>병 공유하기</h3>
            <button onClick={copyLink} style={{ padding: '15px 30px', background: copied ? '#00C87A' : '#7c5cbf', color: '#fff', border: 'none', borderRadius: 15, cursor: 'pointer' }}>{copied ? '✓ 복사완료!' : '링크 복사하기'}</button>
          </div>
        )}

        {tab === 'archive' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#7c5cbf', fontSize: 15, fontWeight: 'bold', marginBottom: 5 }}>가득 찬 유리병들이</p>
            <p style={{ color: '#a090c0', fontSize: 13, marginBottom: 30 }}>안전하게 보관되어 있어요</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {archives.length === 0 ? <p style={{ gridColumn: '1/3', color: '#ccc' }}>아직 보관된 병이 없어요</p> : archives.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.5)', padding: 10, borderRadius: 20 }}>
                  <GlassJar items={a.marbles} sizeScale={0.5} />
                  <p style={{ fontSize: 10, color: '#a090c0' }}>{new Date(a.completedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {notif && <div style={{ position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '10px 25px', borderRadius: 30, fontSize: 13, zIndex: 100 }}>{notif}</div>}
    </div>
  );
}

const DynamicHome = dynamic(() => Promise.resolve(HomeContent), { ssr: false });
export default function Home() { return <><Head><title>Emotion Marbles</title></Head><DynamicHome /></>; }
