import { useEffect, useState } from 'react';

const METROMAP = 'http://localhost:8091';
const PROJECT_ROOT = '/Users/sergei/Documents/Projects/Ruslan/p2ptax';

// No __DEV__ guard — this is a local-only dev page, always render

interface PageItem {
  idx: number;
  role: string;
  label: string;
  url: string;
  file: string;
}
interface ScoreItem {
  route: string;
  score: number;
  critique: string;
}
interface MosaicData {
  ts: string;
  viewport: string;
  overallScore: number;
  model: string;
  pagesIndex: PageItem[];
  scores: ScoreItem[];
  pagesDir: string;
}

function stripUrl(label: string) {
  let s = label.replace(/^https?:\/\/localhost:\d+/, '');
  s = s.replace(/\?.*$/, '');
  if (!s) s = '/';
  if (s.length > 32) s = s.slice(0, 32) + '…';
  return s;
}

function scoreColor(s: number | undefined) {
  if (s === undefined) return '#555';
  if (s >= 8) return '#22c55e';
  if (s >= 6) return '#eab308';
  return '#ef4444';
}

function imageUrl(pagesDir: string, file: string) {
  const rel = pagesDir.replace(PROJECT_ROOT + '/', '') + '/' + file;
  return `${METROMAP}/mosaic-image?file=${encodeURIComponent(rel)}`;
}

export default function MosaicMobile() {
  const [data, setData] = useState<MosaicData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // fix RN Web scroll lock
    if (typeof document !== 'undefined') {
      document.documentElement.style.cssText = 'overflow:auto;height:auto';
      document.body.style.cssText = 'overflow:auto;height:auto;background:#111';
      const root = document.getElementById('root');
      if (root) root.style.cssText = 'overflow:auto;height:auto';
    }

    async function load() {
      try {
        const listRes = await fetch(`${METROMAP}/mosaic-list`);
        const listJson = await listRes.json();
        const items: any[] = listJson.items || [];
        const latest = items.find(i => i.viewport === 'mobile');
        if (!latest) { setError('No mobile mosaic found. Run: metromap mosaic p2ptax --mobile'); return; }

        const reportRes = await fetch(`${METROMAP}/mosaic-report?file=${encodeURIComponent(latest.critiquePath)}`);
        const report = await reportRes.json();

        setData({
          ts: latest.ts || '',
          viewport: 'mobile',
          overallScore: latest.overallScore ?? 0,
          model: latest.model || '',
          pagesIndex: report.pagesIndex || [],
          scores: report.critique?.perPageScores || [],
          pagesDir: report.pagesDir || '',
        });
      } catch (e: any) {
        setError('metromap not responding. Start it with: metromap p2ptax');
      }
    }
    load();
  }, []);

  if (error) return (
    // @ts-ignore
    <div style={{background:'#111',color:'#888',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,fontFamily:'monospace'}}>
      {/* @ts-ignore */}
      <div style={{color:'#ef4444',fontSize:16}}>{error}</div>
    </div>
  );

  if (!data) return (
    // @ts-ignore
    <div style={{background:'#111',color:'#888',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace'}}>
      Loading…
    </div>
  );

  const getScore = (page: PageItem) => {
    const s = data.scores.find(s => s.route === page.label || s.route === page.url);
    return s?.score;
  };

  const ts = data.ts ? new Date(data.ts).toLocaleDateString('en', {month:'short',day:'numeric'}) : '';

  return (
    // @ts-ignore
    <div style={{background:'#111',minHeight:'100vh',fontFamily:'system-ui,sans-serif'}}>
      {/* sticky header */}
      {/* @ts-ignore */}
      <div style={{position:'sticky',top:0,zIndex:10,background:'#1a1a1a',borderBottom:'1px solid #333',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        {/* @ts-ignore */}
        <span style={{color:'#fff',fontWeight:600,fontSize:15}}>Mobile Mosaic</span>
        {/* @ts-ignore */}
        <span style={{background:scoreColor(data.overallScore),color:'#fff',fontWeight:700,fontSize:13,padding:'2px 10px',borderRadius:20}}>
          {data.overallScore}/10
        </span>
        {/* @ts-ignore */}
        <span style={{color:'#666',fontSize:12}}>{data.pagesIndex.length} pages · {ts} · {data.model}</span>
      </div>

      {/* grid */}
      {/* @ts-ignore */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
        gap:12,
        padding:12,
      }}>
        {data.pagesIndex.map(page => {
          const score = getScore(page);
          return (
            // @ts-ignore
            <div key={page.idx} style={{background:'#1e1e1e',borderRadius:8,overflow:'hidden',position:'relative',cursor:'pointer'}}
              onClick={() => window.open(page.url, '_blank')}>
              {/* @ts-ignore */}
              <img
                src={imageUrl(data.pagesDir, page.file)}
                alt={page.label}
                style={{width:'100%',display:'block'}}
                loading="lazy"
              />
              {/* score badge */}
              {/* @ts-ignore */}
              <div style={{position:'absolute',top:6,right:6,background:scoreColor(score),color:'#fff',fontWeight:700,fontSize:11,padding:'2px 7px',borderRadius:12}}>
                {score !== undefined ? `${score}/10` : '–'}
              </div>
              {/* label */}
              {/* @ts-ignore */}
              <div style={{padding:'6px 8px',color:'#aaa',fontSize:11,fontFamily:'monospace',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                {stripUrl(page.label)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
