
const TYPES = {
  flood:    { color: '#6EB6FF', label: 'Flood' },
  quake:    { color: '#FF8775', label: 'Earthquake' },
  storm:    { color: '#97AEC4', label: 'Storm / Typhoon' },
  wildfire: { color: '#FFB199', label: 'Wildfire' },
  volcano:  { color: '#C56558', label: 'Volcanic activity' },
  drought:  { color: '#C8D4E0', label: 'Drought' },
};
 
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 
const years = [];
for (let y = 1975; y <= 2025; y++) {
  const rng = mulberry32(y * 9301 + 49297);
  const total = 4 + Math.floor(rng() * 14);
  const typeKeys = Object.keys(TYPES);
  const breakdown = {};
  let remaining = total;
  typeKeys.forEach((t, i) => {
    if (i === typeKeys.length - 1) { breakdown[t] = remaining; return; }
    const take = Math.floor(rng() * (remaining + 1) / 2);
    breakdown[t] = take;
    remaining -= take;
  });
  const isSpike = ([1995, 2011, 2018, 2019, 2024].includes(y));
  const deaths   = Math.floor(rng() * 800) + (isSpike ? (y === 2011 ? 18000 : 5000) : 50);
  const affected = Math.floor(rng() * 200000) + (isSpike ? 300000 : 5000);
  const damage   = +(rng() * 8 + (isSpike ? (y === 2011 ? 230 : 90) : 1)).toFixed(1);
  years.push({ year: y, total, breakdown, deaths, affected, damage, isSpike });
}
try { sessionStorage.setItem('jp_years', JSON.stringify(years)); } catch(e) {}
 
function makePhoto(year) {
  const rng = mulberry32(year * 17 + 3);
  const buildings = [];
  for (let i = 0; i < 22; i++) {
    const x = i * 26 + rng() * 6;
    const w = 18 + rng() * 14;
    const h = 60 + rng() * 220;
    const shade = Math.floor(30 + rng() * 50);
    buildings.push(`<rect x="${x.toFixed(1)}" y="${(360 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgb(${shade},${shade-2},${shade+5})"/>`);
    for (let r = 0; r < Math.floor(h / 14); r++) {
      for (let c = 0; c < Math.floor(w / 6); c++) {
        if (rng() > 0.55) {
          const wx = x + 2 + c * 6;
          const wy = 360 - h + 4 + r * 14;
          const lit = Math.floor(rng() > 0.6 ? 110 + rng()*60 : 40 + rng()*20);
          buildings.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="6" fill="rgb(${lit},${lit-3},${lit+10})"/>`);
        }
      }
    }
  }
  const ground = `<rect x="0" y="360" width="600" height="180" fill="rgb(15,20,28)"/>`;
  const sky = `<defs><linearGradient id="sk${year}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(35,45,60)"/><stop offset="100%" stop-color="rgb(12,17,22)"/></linearGradient><filter id="grain${year}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${year%50}"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.55  0 0 0 0 0.65  0 0 0 .15 0"/></filter></defs><rect width="600" height="360" fill="url(#sk${year})"/>`;
  const billboardX = Math.floor(200 + rng() * 200);
  const billboardY = Math.floor(80 + rng() * 80);
  const labels = ['電器','SONY','東芝','銀座','新宿','カメラ'];
  const lbl = labels[year % labels.length];
  const billboard = `<rect x="${billboardX}" y="${billboardY}" width="120" height="36" fill="rgb(60,70,85)" stroke="rgb(90,100,115)"/><text x="${billboardX + 60}" y="${billboardY + 24}" font-family="serif" font-size="18" fill="rgb(180,190,205)" text-anchor="middle">${lbl}</text>`;
  let cars = '';
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(40 + i * 120 + rng() * 30);
    const cy = Math.floor(380 + rng() * 20);
    cars += `<rect x="${cx}" y="${cy}" width="40" height="14" rx="3" fill="rgb(8,12,18)"/><circle cx="${cx + 8}" cy="${cy + 14}" r="4" fill="rgb(5,8,12)"/><circle cx="${cx + 32}" cy="${cy + 14}" r="4" fill="rgb(5,8,12)"/>`;
  }
  const grain = `<rect width="600" height="540" filter="url(#grain${year})" opacity="0.55"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="540" viewBox="0 0 600 540">${sky}${buildings.join('')}${billboard}${ground}${cars}${grain}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
 
function eraOf(year) {
  if (year < 1980) return 'The late seventies';
  if (year < 1990) return 'The eighties';
  if (year < 2000) return 'The nineties';
  if (year < 2010) return 'The two-thousands';
  if (year < 2020) return 'The twenty-tens';
  return 'This decade';
}
 
function taglineFor(yd) {
  const lookup = {
    1995: 'Kobe wakes to a magnitude 6.9 quake.',
    2011: 'March 11. The Tōhoku earthquake and tsunami.',
    2018: 'A summer of compound extremes.',
    2019: 'Typhoon Hagibis floods the Kantō plain.',
    2024: 'The Noto Peninsula trembles on New Year\'s Day.',
  };
  if (lookup[yd.year]) return lookup[yd.year];
  const top = Object.entries(yd.breakdown).sort((a, b) => b[1] - a[1])[0];
  const typeName = TYPES[top[0]].label.toLowerCase();
  return `${yd.total} events catalogued — chiefly ${typeName}.`;
}
 
/* ---------- Build cards on alternating walls ---------- */
const stage = document.getElementById('stage');
const SPACING = 600;
const stageCards = [];
 
years.forEach((yd, i) => {
  const depth = i * SPACING;
  const side = i % 2 === 0 ? -1 : 1;     // even years on left, odd on right
  const card = document.createElement('div');
  card.className = 'year-card' + (yd.isSpike ? ' highlighted' : '');
  card.style.setProperty('--depth', depth);
  card.style.setProperty('--side', side);
  card.dataset.year = yd.year;
 
  const glyphs = Object.entries(yd.breakdown)
    .filter(([_, n]) => n > 0)
    .flatMap(([k, n]) => Array(Math.min(n, 12)).fill(k))
    .map(k => `<span class="g-${k}"></span>`).join('');
 
  const deathsShort = yd.deaths > 999 ? (yd.deaths/1000).toFixed(1)+'k' : yd.deaths;
  const dmgShort = yd.damage >= 100 ? Math.round(yd.damage) : yd.damage.toFixed(1);
 
  card.innerHTML = `
    <div class="frame">
      <div class="photo-wrap">
        <div class="photo" style="background-image:url('${makePhoto(yd.year)}')"></div>
      </div>
      <div class="card-head">
        <div class="file-no">№ ${yd.year - 1974} · File JP/${yd.year}</div>
        <div class="title">Japan<br><span class="yr">in ${yd.year}</span></div>
      </div>
      <div class="card-tagline">${taglineFor(yd)}</div>
      <div class="card-action-hint">Open exhibit →</div>
      <div class="card-info">
        <div class="stats-row">
          <div class="stat">
            <div class="lbl">Events</div>
            <div class="v">${yd.total}</div>
          </div>
          <div class="stat">
            <div class="lbl">Deaths</div>
            <div class="v"><em>${deathsShort}</em></div>
          </div>
          <div class="stat">
            <div class="lbl">Damage</div>
            <div class="v">$${dmgShort}<span class="unit">B</span></div>
          </div>
        </div>
        <div class="glyphs-row">
          <div class="glyph-label">Disaster mix</div>
          <div class="glyphs">${glyphs}</div>
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', () => openDetail(yd.year));
  stage.appendChild(card);
  stageCards.push({ el: card, depth, side, year: yd.year });
});
 
/* ---------- Camera + slide-to-center logic ---------- */
const totalDepth = (years.length - 1) * SPACING;
const spacer = document.getElementById('spacer');
spacer.style.height = (totalDepth + window.innerHeight * 1.8) + 'px';
 
const stageEl = document.getElementById('stage');
const introEl = document.getElementById('intro');
const hudYear = document.getElementById('hudYear');
const hudEra  = document.getElementById('hudEra');
const hudProg = document.getElementById('hudProgress');
const endCard = document.getElementById('endCard');
let currentEra = '';
 
const ACTIVE_RANGE = SPACING * 0.5;
const BEHIND_THRESHOLD = 100;
 
function tick() {
  const sc = window.scrollY;
  const introFade = Math.min(1, sc / (window.innerHeight * 0.4));
  introEl.style.opacity = (1 - introFade).toString();
 
  const cameraZ = Math.max(0, sc - window.innerHeight * 0.3);
  stageEl.style.transform = `translateZ(${cameraZ}px)`;
 
  /* For each card: compute relative depth and find the closest one to the camera. */
  let closest = stageCards[0];
  let bestAbs = Infinity;
 
  for (const c of stageCards) {
    const rel = c.depth - cameraZ;          /* + ahead, - behind */
    const abs = Math.abs(rel);
 
    /* Hide cards that have moved past us */
    if (rel < -BEHIND_THRESHOLD) {
      c.el.classList.add('behind');
    } else {
      c.el.classList.remove('behind');
    }
 
    if (abs < bestAbs) {
      bestAbs = abs;
      closest = c;
    }
  }
 
  /* Active state — only the truly nearest card */
  for (const c of stageCards) {
    if (c === closest && bestAbs < ACTIVE_RANGE) {
      c.el.classList.add('active');
    } else {
      c.el.classList.remove('active');
    }
  }
 
  hudYear.textContent = closest.year;
  const era = eraOf(closest.year);
  if (era !== currentEra) {
    currentEra = era;
    hudEra.style.opacity = '0';
    setTimeout(() => { hudEra.textContent = era; hudEra.style.opacity = '1'; }, 200);
  }
 
  const pct = Math.min(100, (cameraZ / totalDepth) * 100);
  hudProg.style.width = pct + '%';
 
  if (cameraZ >= totalDepth - 100) {
    endCard.classList.add('show');
  } else {
    endCard.classList.remove('show');
  }
 
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
 
/* ---------- Detail modal ---------- */
const panel = document.getElementById('detailPanel');
document.getElementById('closeDetail').addEventListener('click', closeDetail);
panel.addEventListener('click', e => { if (e.target === panel) closeDetail(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });
 
const fmt = n => n.toLocaleString('en-US');
 
function openDetail(year) {
  const yd = years.find(x => x.year === year);
  if (!yd) return;
 
  document.getElementById('detailYear').textContent = year;
  document.getElementById('fileNo').textContent = `File № JP / ${year}`;
  document.getElementById('pieTotal').textContent = yd.total;
  document.getElementById('detailPhoto').style.backgroundImage = `url('${makePhoto(year)}')`;
 
  const svg = document.getElementById('pieSvg');
  svg.innerHTML = '';
  const r = 32, cx = 50, cy = 50;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const entries = Object.entries(yd.breakdown).filter(([_, n]) => n > 0);
  const tot = entries.reduce((s, [_, n]) => s + n, 0) || 1;
  entries.forEach(([k, n]) => {
    const len = (n / tot) * C;
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r);
    c.setAttribute('stroke', TYPES[k].color);
    c.setAttribute('stroke-dasharray', `${len} ${C - len}`);
    c.setAttribute('stroke-dashoffset', -offset);
    svg.appendChild(c);
    offset += len;
  });
 
  document.getElementById('pieLegend').innerHTML = entries.map(([k, n]) => `
    <div class="item">
      <span class="swatch" style="background:${TYPES[k].color}"></span>
      ${TYPES[k].label}
      <span class="ct">${n}</span>
    </div>
  `).join('');
 
  document.getElementById('statDeaths').innerHTML   = `<em>${fmt(yd.deaths)}</em>`;
  document.getElementById('statAffected').innerHTML = `${fmt(yd.affected)}<span class="unit">souls</span>`;
  document.getElementById('statDamage').innerHTML   = `$${yd.damage}<span class="unit">billion USD</span>`;
 
  const ctx = curatedContext(year, yd);
  document.getElementById('ctxDeaths').textContent   = ctx.deaths;
  document.getElementById('ctxAffected').textContent = ctx.affected;
  document.getElementById('ctxDamage').textContent   = ctx.damage;
  document.getElementById('narrative').textContent   = ctx.narrative;
 
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDetail() {
  panel.classList.remove('open');
  document.body.style.overflow = '';
}
 
function curatedContext(year, yd) {
  const lookup = {
    1995: {
      deaths: 'Concentrated in a single January morning, in Kobe.',
      affected: 'Displacement extended weeks beyond the initial shock.',
      damage: 'Reconstruction reshaped the urban code of the Kansai region.',
      narrative: 'On the seventeenth of January, Kobe woke to a magnitude 6.9 earthquake. Within twenty seconds, elevated highways folded, fires bloomed across wooden neighbourhoods, and over six thousand lives were lost. The disaster reshaped Japanese seismic policy and accelerated the adoption of base-isolated construction. The year also saw a cluster of typhoons make landfall along the southern coast, contributing to the elevated event count for this folder.'
    },
    2011: {
      deaths: 'The Tōhoku earthquake and tsunami of March 11.',
      affected: 'Triple-disaster: quake, tsunami, then nuclear emergency.',
      damage: 'Among the costliest natural disasters ever recorded.',
      narrative: 'At 14:46 on March 11th, the seafloor off the Pacific coast of Tōhoku ruptured along a 500-kilometre line, releasing energy equivalent to roughly six hundred years of Japan\'s typical seismic budget. Within forty minutes, a wave reached the Sanriku coast at heights exceeding fifteen metres. The cascading failure at Fukushima Daiichi added a third disaster on top of the first two — and rewrote the world\'s posture toward nuclear power.'
    },
    2018: {
      deaths: 'Heat, floods, and Typhoon Jebi struck within months.',
      affected: 'Western Japan flooding alone displaced over 200,000.',
      damage: 'A year that catalogued nearly every disaster type at once.',
      narrative: 'A summer of compound extremes: torrential rains in early July submerged Hiroshima and Okayama prefectures, a record-breaking heat dome followed in late July, and Typhoon Jebi tore through Kansai in September, lifting tankers into bridges. Each event would have defined a quieter year on its own.'
    }
  };
  if (lookup[year]) return lookup[year];
 
  const top = Object.entries(yd.breakdown).sort((a, b) => b[1] - a[1])[0];
  return {
    deaths: yd.deaths > 1000 ? 'Concentrated in a small number of high-impact events.' : 'Distributed across multiple smaller-scale incidents.',
    affected: 'Includes displaced, injured, and otherwise impacted persons.',
    damage: 'Estimated direct economic losses, adjusted to USD.',
    narrative: `${year} produced ${yd.total} catalogued events across the archipelago, dominated by ${TYPES[top[0]].label.toLowerCase()} incidents (${top[1]} of the total). Cumulative impact was assessed at $${yd.damage} billion USD. The year sits within the broader pattern of ${year < 2000 ? 'late-twentieth-century Pacific volatility' : 'the twenty-first century\'s climate-amplified extremes'}.`
  };
}