import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// --- (이 아래 코드는 아까와 같지만, 에러 방지 로직이 더 강화되었습니다) ---

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

  useEffect(() => {
    // 로컬 스토리지 데이터 로드
    const savedMarbles = localStorage.getItem('em_marbles');
    const savedArchives = localStorage.getItem('em_archives');
    if (savedMarbles) setMarbles(JSON.parse(savedMarbles));
    if (savedArchives) setArchives(JSON.parse(savedArchives));

    // 공유된 주소 확인 (브라우저에서 직접 읽기)
    const params = new URLSearchParams(window.location.search);
    const jarData = params.get('jar');
    if (jarData) {
      try {
        setSharedData(JSON.parse(atob(jarData)));
      } catch (e) {
        console.error("공유 데이터 오류", e);
      }
    }
  }, []);

  function save(m, a) {
    localStorage.setItem('em_marbles', JSON.stringify(m));
    localStorage.setItem('em_archives', JSON.stringify(a));
  }

  function showNotif(msg) {
    setNotif(msg);
    setTimeout(() => setNotif(''), 2800);
  }

  function addMarble() {
    if (!memo.trim() || !selectedEmotion) return;
    const newMarble = { id: Date.now(), emotion: selectedEmotion, text: memo.trim(), anon: isAnon, ts: Date.now() };
    let newMarbles = [...marbles, newMarble];
    let newArchives = archives;
    if (newMarbles.length >= 20) {
      newArchives = [...archives, { marbles: newMarbles, completedAt: Date.now() }];
      newMarbles = [];
      showNotif('🎉 병이 가득 찼어요! 보관함으로 이동했어요');
    } else {
      showNotif(`✨ ${EMOTIONS.find(e => e.id === selectedEmotion)?.name} 구슬이 담겼어요`);
    }
    setMarbles(newMarbles);
    setArchives(newArchives);
    save(newMarbles, newArchives);
    setMemo(''); setSelectedEmotion(null); setTab('jar');
  }

  function generateShareLink() {
    if (marbles.length === 0) return null;
    const payload = btoa(JSON.stringify({ marbles, createdAt: Date.now() }));
    return `${window.location.origin}?jar=${payload}`;
  }

  function copyLink() {
    const link = generateShareLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function getTimeAgo(ts) {
    const d = Date.now() - ts, m = Math.floor(d / 60000), h = Math.floor(d / 3600000);
    if (m < 1) return '방금 전'; if (m < 60) return `${m}분 전`; if (h < 24) return `${h}시간 전`;
    return `${Math.floor(d / 86400000)}일 전`;
  }

  if (sharedData) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0eeff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
        <h2 style={{ color: '#7c5cbf', fontSize: 20, fontWeight: 600, marginBottom: 4 }}>🫙 공유된 감정 구슬 병</h2>
        <p style={{ color: '#a090c0', fontSize: 12, marginBottom: 24 }}>{sharedData.marbles.length}개의 구슬</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 300, marginBottom: 32 }}>
          {sharedData.marbles.map((m, i) => {
            const e = EMOTIONS.find(x => x.id === m.emotion);
            const size = [30,26,28,24,32,26,28,30,24,28][i % 10];
            return (
              <div key={m.id} style={{ position: 'relative' }} onMouseEnter={() => setHoveredMarble(m.id)} onMouseLeave={() => setHoveredMarble(null)}>
                <div style={marbleStyle(e.color, size)} />
                {hoveredMarble === m.id && (
                  <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,.97)', border: '1px solid rgba(160,140,220,.3)', borderRadius: 14, padding: '12px 14px', width: 200, fontSize: 12, color: '#2a2050', zIndex: 100, boxShadow: '0 8px 32px rgba(124,92,191,.15)', lineHeight: 1.5 }}>
                    <div style={{ fontSize: 10, color: '#a090c0', marginBottom: 4 }}>{e.name}</div>
                    <div>{m.anon ? '(익명) ' : ''}{m.text}</div>
                    <div style={{ fontSize: 10, color: '#a090c0', marginTop: 6 }}>{getTimeAgo(m.ts)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={() => window.location.href = '/'} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#7c5cbf,#4e8de8)', border: 'none', borderRadius: 16, color: '#fff', fontSize: 14, cursor: 'pointer' }}>
          ✦ 나도 구슬 만들기
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>
        <div style={{ textAlign: 'center', padding: '32px 24px 20px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: 3, color: '#7c5cbf', textTransform: 'uppercase' }}>Emotion Marbles</h1>
          <p style={{ fontSize: 12, color: '#a090c0', marginTop: 4 }}>당신의 감정을 구슬에 담아 보관하세요</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '0 24px 16px' }}>
          {[['jar','🫙 나의 병'],['add','✦ 기록'],['share','↗ 공유'],['archive','◎ 보관함']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ background: tab===id ? '#7c5cbf' : 'rgba(255,255,255,.6)', border: '1px solid rgba(160,140,220,.25)', borderRadius: 20, padding: '6px 14px', fontSize: 12, color: tab===id ? '#fff' : '#7060a0', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'jar' && (
          <div style={{ padding: '0 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#a090c0', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              {marbles.length > 0 ? `${new Date(marbles[0].ts).getFullYear()}년 ${new Date(marbles[0].ts).getMonth()+1}월의 기억` : '현재 병'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 120, alignContent: 'flex-end', background: 'rgba(180,160,255,.08)', border: '1px solid rgba(160,140,220,.2)', borderRadius: 20, padding: '20px 16px', marginBottom: 12 }}>
              {marbles.length === 0
                ? <p style={{ fontSize: 12, color: '#c0b0e0', alignSelf: 'center' }}>아직 구슬이 없어요</p>
                : marbles.map((m, i) => {
                    const e = EMOTIONS.find(x => x.id === m.emotion);
                    const size = [30,26,28,24,32,26,28,30,24,28][i % 10];
                    return (
                      <div key={m.id} style={{ position: 'relative' }} onMouseEnter={() => setHoveredMarble(m.id)} onMouseLeave={() => setHoveredMarble(null)}>
                        <div style={marbleStyle(e.color, size)} />
                        {hoveredMarble === m.id && (
                          <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,.97)', border: '1px solid rgba(160,140,220,.3)', borderRadius: 14, padding: '10px 12px', width: 180, fontSize: 12, color: '#2a2050', zIndex: 100, boxShadow: '0 8px 20px rgba(124,92,191,.15)', lineHeight: 1.5 }}>
                            <div style={{ fontSize: 10, color: '#a090c0', marginBottom: 3 }}>{e.name}</div>
                            <div>{m.text}</div>
                            <div style={{ fontSize: 10, color: '#a090c0', marginTop: 4 }}>{getTimeAgo(m.ts)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
            </div>
            <p style={{ fontSize: 12, color: '#a090c0' }}>{marbles.length} / 20개</p>
          </div>
        )}

        {tab === 'add' && (
          <div style={{ padding: '0 20px' }}>
            <p style={{ fontSize: 11, color: '#a090c0', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>감정 선택</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
              {EMOTIONS.map(e => (
                <button key={e.id} onClick={() => setSelectedEmotion(e.id)} style={{ background: selectedEmotion===e.id ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.7)', border: `1px solid ${selectedEmotion===e.id ? e.color+'88' : 'rgba(160,140,220,.2)'}`, borderRadius: 14, padding: '10px 4px 8px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  <div style={{ ...marbleStyle(e.color, 24), margin: '0 auto 6px' }} />
                  <div style={{ fontSize: 10, color: '#7060a0' }}>{e.name}</div>
                </button>
              ))}
            </div>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} maxLength={500} placeholder="오늘의 감정을 자유롭게 써보세요..." style={{ width: '100%', minHeight: 100, background: 'rgba(255,255,255,.8)', border: '1px solid rgba(160,140,220,.25)', borderRadius: 16, padding: '14px 16px', fontSize: 14, resize: 'none', outline: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 4px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setIsAnon(!isAnon)}>
                <div style={{ width: 36, height: 20, background: isAnon ? 'rgba(124,92,191,.5)' : 'rgba(160,140,220,.2)', borderRadius: 10, position: 'relative' }}>
                  <div style={{ position: 'absolute', width: 14, height: 14, background: '#fff', borderRadius: '50%', top: 2.5, left: isAnon ? 19 : 3, transition: 'left .2s' }} />
                </div>
                <span style={{ fontSize: 12, color: '#7060a0' }}>익명 저장</span>
              </div>
            </div>
            <button onClick={addMarble} disabled={!selectedEmotion || !memo.trim()} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#7c5cbf,#4e8de8)', border: 'none', borderRadius: 16, color: '#fff', fontSize: 14, cursor: 'pointer', opacity: (!selectedEmotion || !memo.trim()) ? 0.4 : 1 }}>
              구슬에 담기 ✦
            </button>
          </div>
        )}

        {tab === 'share' && (
          <div style={{ padding: '0 20px' }}>
            <div style={{ background: 'rgba(255,255,255,.75)', border: '1px solid rgba(160,140,220,.2)', borderRadius: 20, padding: 20 }}>
              <h3 style={{ fontSize: 13, color: '#7060a0', marginBottom: 10 }}>현재 병 공유하기</h3>
              {marbles.length === 0 ? <p style={{ fontSize: 12, color: '#c0b0d0' }}>기록을 먼저 추가해보세요!</p> : (
                <>
                  {copied && <p style={{ fontSize: 11, color: '#2dbf88', marginBottom: 8 }}>✓ 복사되었습니다!</p>}
                  <button onClick={copyLink} style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,.8)', border: '1px solid rgba(160,140,220,.25)', borderRadius: 10, color: '#7060a0', cursor: 'pointer' }}>
                    {copied ? '✓ 복사됨!' : '🔗 공유 링크 복사하기'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {notif && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 20, padding: '10px 20px', fontSize: 13, color: '#7c5cbf', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 9999 }}>{notif}</div>}
    </div>
  );
}

// *** 이 부분이 핵심입니다: 서버 사이드 렌더링을 완전히 꺼버리는 마법 ***
const DynamicHome = dynamic(() => Promise.resolve(HomeContent), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Head><title>Emotion Marbles</title></Head>
      <DynamicHome />
    </>
  );
}
