/* =============================================
   CONSTANTS & HELPERS
   ============================================= */
const ISO = new URLSearchParams(location.search).get('iso') || 'JPN';
let COUNTRY_NAME = ISO;
let YEAR_MAP = {};

const TYPES = {
  drought:             { color: '#F2B44D', label: 'Drought' },
  earthquake:          { color: '#8A4E24', label: 'Earthquake' },
  extreme_temperature: { color: '#F45FA8', label: 'Extreme Temperature' },
  flood:               { color: '#5F9CF5', label: 'Flood' },
  landslide:           { color: '#7D9D67', label: 'Landslide' },
  storm:               { color: '#7870D8', label: 'Storm / Typhoon' },
  epidemic:            { color: '#70C7A8', label: 'Epidemic' },
  infestation:         { color: '#B8C96B', label: 'Infestation' },
  animal_incident:     { color: '#66BFD2', label: 'Animal Incident' },
  volcano:             { color: '#D85745', label: 'Volcano' },
  wildfire:            { color: '#F39A3C', label: 'Wildfire' },
  impact:              { color: '#C7B2FF', label: 'Impact' },
};

function typeColor(type) { return TYPES[type]?.color || '#97AEC4'; }
function typeLabel(type) { return TYPES[type]?.label || type.replace(/_/g, ' '); }
const fmt = n => n.toLocaleString('en-US');
function fmtShort(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}
function formatDamage(billionUSD) {
  if (!billionUSD || billionUSD < 0.001) return 'Not recorded';
  if (billionUSD < 1)  return `$${(billionUSD * 1000).toFixed(0)}M`;
  if (billionUSD < 10) return `$${billionUSD.toFixed(2)}B`;
  return `$${billionUSD.toFixed(1)}B`;
}

/* =============================================
   FALLBACK PROCEDURAL SVG ART
   ============================================= */
function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function makePhoto(seed) {
  const rng = mulberry32(seed * 17 + 3);
  const buildings = [];
  for (let i = 0; i < 22; i++) {
    const x = i * 26 + rng() * 6;
    const w = 18 + rng() * 14;
    const h = 60 + rng() * 220;
    const shade = Math.floor(30 + rng() * 50);
    buildings.push(`<rect x="${x.toFixed(1)}" y="${(360-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgb(${shade},${shade-2},${shade+5})"/>`);
    for (let r = 0; r < Math.floor(h / 14); r++) {
      for (let c = 0; c < Math.floor(w / 6); c++) {
        if (rng() > 0.55) {
          const wx = x + 2 + c * 6, wy = 360 - h + 4 + r * 14;
          const lit = Math.floor(rng() > 0.6 ? 110 + rng()*60 : 40 + rng()*20);
          buildings.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="3" height="6" fill="rgb(${lit},${lit-3},${lit+10})"/>`);
        }
      }
    }
  }
  const ground = `<rect x="0" y="360" width="600" height="180" fill="rgb(15,20,28)"/>`;
  const sky = `<defs><linearGradient id="sk${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgb(35,45,60)"/><stop offset="100%" stop-color="rgb(12,17,22)"/></linearGradient><filter id="gr${seed}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed%50}"/><feColorMatrix values="0 0 0 0 0.5 0 0 0 0 0.55 0 0 0 0 0.65 0 0 0 .15 0"/></filter></defs><rect width="600" height="360" fill="url(#sk${seed})"/>`;
  let cars = '';
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(40 + i * 120 + rng() * 30), cy = Math.floor(380 + rng() * 20);
    cars += `<rect x="${cx}" y="${cy}" width="40" height="14" rx="3" fill="rgb(8,12,18)"/>`;
  }
  const grain = `<rect width="600" height="540" filter="url(#gr${seed})" opacity="0.55"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="540" viewBox="0 0 600 540">${sky}${buildings.join('')}${ground}${cars}${grain}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* =============================================
   CONTEXT TEXT & NARRATIVE
   ============================================= */
function eraOf(year) {
  if (year < 1980) return 'The late seventies';
  if (year < 1990) return 'The eighties';
  if (year < 2000) return 'The nineties';
  if (year < 2010) return 'The two-thousands';
  if (year < 2020) return 'The twenty-tens';
  return 'This decade';
}

const JAPAN_TAGLINES = {
  1995: 'Kobe wakes to a magnitude 6.9 quake.',
  2011: 'March 11. The Tōhoku earthquake and tsunami.',
  2018: 'A summer of compound extremes.',
  2019: 'Typhoon Hagibis floods the Kantō plain.',
  2024: "The Noto Peninsula trembles on New Year's Day.",
};

function taglineFor(yd) {
  if (ISO === 'JPN' && JAPAN_TAGLINES[yd.year]) return JAPAN_TAGLINES[yd.year];
  const topEntry = Object.entries(yd.breakdown).sort((a, b) => b[1] - a[1])[0];
  if (!topEntry) return `${yd.total} event${yd.total !== 1 ? 's' : ''} catalogued.`;
  const typeName = typeLabel(topEntry[0]).toLowerCase();
  return `${yd.total} event${yd.total !== 1 ? 's' : ''} — chiefly ${typeName}.`;
}

const JAPAN_CONTEXT = {
  1995: { deaths: 'Concentrated in a single January morning, in Kobe.', affected: 'Displacement extended weeks beyond the initial shock.', damage: 'Reconstruction reshaped the urban code of the Kansai region.', narrative: 'On the seventeenth of January, Kobe woke to a magnitude 6.9 earthquake. Within twenty seconds, elevated highways folded, fires bloomed across wooden neighbourhoods, and over six thousand lives were lost. The disaster reshaped Japanese seismic policy and accelerated the adoption of base-isolated construction.' },
  2011: { deaths: 'The Tōhoku earthquake and tsunami of March 11.', affected: 'Triple-disaster: quake, tsunami, then nuclear emergency.', damage: 'Among the costliest natural disasters ever recorded.', narrative: "At 14:46 on March 11th, the seafloor off the Pacific coast of Tōhoku ruptured along a 500-kilometre line. Within forty minutes, a wave reached the Sanriku coast at heights exceeding fifteen metres. The cascading failure at Fukushima Daiichi added a third disaster — and rewrote the world's posture toward nuclear power." },
  2018: { deaths: 'Heat, floods, and Typhoon Jebi struck within months.', affected: 'Western Japan flooding alone displaced over 200,000.', damage: 'A year that catalogued nearly every disaster type at once.', narrative: 'A summer of compound extremes: torrential rains in early July submerged Hiroshima and Okayama prefectures, a record-breaking heat dome followed in late July, and Typhoon Jebi tore through Kansai in September, lifting tankers into bridges. Each event would have defined a quieter year on its own.' }
};

function curatedContext(year, yd) {
  if (ISO === 'JPN' && JAPAN_CONTEXT[year]) return JAPAN_CONTEXT[year];
  const topEntry = Object.entries(yd.breakdown).sort((a, b) => b[1] - a[1])[0];
  const typeName = topEntry ? typeLabel(topEntry[0]).toLowerCase() : 'various hazards';
  const era = year < 2000 ? 'late-twentieth-century vulnerability' : "the era of climate-amplified extremes";
  const deathCtx = yd.deaths > 5000 ? 'A catastrophic toll — concentrated in one or a few high-impact events.' : yd.deaths > 500 ? 'Concentrated in a small number of high-impact events.' : yd.deaths > 0 ? 'Distributed across multiple smaller-scale incidents.' : 'No fatalities were recorded in official reports for this year.';
  const affectedCtx = yd.affected > 500000 ? 'Hundreds of thousands required assistance, shelter, or evacuation.' : yd.affected > 0 ? 'Includes displaced, injured, and otherwise impacted persons.' : 'Affected figures were not reported or fell below the registration threshold.';
  const damageCtx = yd.damage > 5 ? 'Significant economic losses triggered reconstruction programmes.' : yd.damage > 0 ? 'Estimated direct economic losses, adjusted to USD.' : 'Economic damage figures were not available for this period.';
  const deathStr  = yd.deaths  > 0 ? ` The cumulative death toll reached ${yd.deaths.toLocaleString('en-US')}.` : '';
  const damageStr = yd.damage  > 0 ? ` Economic losses were estimated at ${formatDamage(yd.damage)}.` : '';
  return { deaths: deathCtx, affected: affectedCtx, damage: damageCtx, narrative: `${year} recorded ${yd.total} catalogued event${yd.total !== 1 ? 's' : ''} in ${COUNTRY_NAME}, dominated by ${typeName} incidents.${deathStr}${damageStr} The year sits within the broader pattern of ${era}.` };
}

/* =============================================
   THREE.JS: SCENE SETUP
   ============================================= */
let scene, camera, renderer;
let stageCards = [];
let totalDepth = 0;
const SPACING = 5;

const introEl  = document.getElementById('intro');
const hudYear  = document.getElementById('hudYear');
const hudEra   = document.getElementById('hudEra');
const hudProg  = document.getElementById('hudProgress');
const endCard  = document.getElementById('endCard');
let currentEra = '';

function initThreeJS() {
  const container = document.getElementById('stage');
  container.innerHTML = ''; 

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0c10, 0.02);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* =============================================
   GLASSMORPHISM TEXTURES (CRASH-PROOF)
   ============================================= */
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 960; canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
  ctx.shadowBlur = 50;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(34, 5);
  ctx.arcTo(955, 5, 955, 1195, 32);
  ctx.arcTo(955, 1195, 5, 1195, 32);
  ctx.arcTo(5, 1195, 5, 5, 32);
  ctx.arcTo(5, 5, 955, 5, 32);
  ctx.closePath();
  ctx.stroke();
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

async function createCardTexture(yd) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 960; canvas.height = 1200; 
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(18, 24, 33, 0.4)';
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.arcTo(960, 0, 960, 1200, 32);
    ctx.arcTo(960, 1200, 0, 1200, 32);
    ctx.arcTo(0, 1200, 0, 0, 32);
    ctx.arcTo(0, 0, 960, 0, 32);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.clip(); 

    // REAL PHOTO LOGIC (With SVG Fallback)
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 960, 864); resolve(); };
      img.onerror = () => {
         const fallback = new Image();
         fallback.onload = () => { ctx.drawImage(fallback, 0, 0, 960, 864); resolve(); };
         fallback.onerror = () => resolve();
         fallback.src = makePhoto(yd.year);
      };
      img.src = `images/archive/${ISO}/${yd.year}.jpg`;
    });

    const grad = ctx.createLinearGradient(0, 500, 0, 900);
    grad.addColorStop(0, 'rgba(18, 24, 33, 0)');
    grad.addColorStop(1, 'rgba(18, 24, 33, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 500, 960, 700);

    ctx.fillStyle = '#ffffff';
    ctx.font = '400 64px "Cormorant Garamond", serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${COUNTRY_NAME.toUpperCase()}`, 880, 120);
    ctx.font = 'italic 300 56px "Cormorant Garamond", serif';
    ctx.fillText(`IN ${yd.year}`, 880, 190);
    ctx.fillStyle = '#97AEC4';
    ctx.font = 'italic 300 32px "Cormorant Garamond", serif';
    ctx.fillText(taglineFor(yd), 880, 250);

    ctx.textAlign = 'left';
    ctx.font = '300 22px "Inter", sans-serif';
    ctx.fillText(`№ ${yd.year - 1974} · FILE ${ISO}/${yd.year}`, 80, 120);

    ctx.font = '300 18px "Inter", sans-serif';
    ctx.fillStyle = '#97AEC4';
    ctx.fillText('E V E N T S', 80, 1000);
    ctx.fillText('D E A T H S', 400, 1000);
    ctx.fillText('D A M A G E', 720, 1000);

    ctx.font = '400 64px "Cormorant Garamond", serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(yd.total, 80, 1070);

    ctx.fillStyle = '#FF8775'; 
    const deathText = yd.deaths > 1000 ? (yd.deaths/1000).toFixed(1) + 'k' : yd.deaths;
    ctx.fillText(deathText, 400, 1070);

    ctx.fillStyle = '#ffffff';
    const dmgText = yd.damage > 0 ? `$${yd.damage}` : '—';
    ctx.fillText(dmgText, 720, 1070);
    if(yd.damage > 0) {
        ctx.font = 'italic 30px "Cormorant Garamond", serif';
        ctx.fillStyle = '#97AEC4';
        ctx.fillText('B', 720 + ctx.measureText(dmgText).width + 8, 1070);
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(151, 174, 196, 0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(34, 2);
    ctx.arcTo(958, 2, 958, 1198, 32);
    ctx.arcTo(958, 1198, 2, 1198, 32);
    ctx.arcTo(2, 1198, 2, 2, 32);
    ctx.arcTo(2, 2, 958, 2, 32);
    ctx.closePath();
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    if (renderer && renderer.capabilities) texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); 
    return texture;
  } catch (e) {
    console.error("Error building card", e);
    return new THREE.CanvasTexture(document.createElement('canvas'));
  }
}

/* =============================================
   GLOWING ROUND STAR TEXTURE
   ============================================= */
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Create a radial gradient for a glowing core and soft edges
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');   // Bright solid core
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); // Inner glow
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)'); // Outer glow
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');     // Fades into darkness completely

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

/* =============================================
   BUILDING THE SCENE
   ============================================= */
async function buildCards(yearDataArr) {
  initThreeJS();
  const texturePromises = yearDataArr.map(yd => createCardTexture(yd));
  const textures = await Promise.all(texturePromises);
  const glowTexture = createGlowTexture();

  yearDataArr.forEach((yd, i) => {
    const zPos = -(i * SPACING);
    const side = i % 2 === 0 ? -8 : 8; 

    const material = new THREE.MeshBasicMaterial({ map: textures[i], transparent: true, side: THREE.DoubleSide });
    const geometry = new THREE.PlaneGeometry(8, 10); 
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(side, 0, zPos);
    mesh.rotation.y = i % 2 === 0 ? 0.20 : -0.20;
    mesh.userData = { year: yd.year, isCard: true };

    const glowMaterial = new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const glowMesh = new THREE.Mesh(geometry, glowMaterial);
    glowMesh.position.z = 0.02; 
    glowMesh.userData = { targetOpacity: 0 }; 
    mesh.add(glowMesh);

    scene.add(mesh);
    stageCards.push({ mesh: mesh, glowMesh: glowMesh, zPos: zPos, year: yd.year, data: yd });
  });

  totalDepth = (yearDataArr.length - 1) * SPACING;
  const START_OFFSET = 20;
  const endCameraZ = -totalDepth - 15; 
  const maxScrollPixels = (START_OFFSET - endCameraZ) / 0.02;

  // Create a geometry to hold 3000 stars
  const starGeo = new THREE.BufferGeometry();
  const starCount = 3000;
  const posArray = new Float32Array(starCount * 3);

  for(let i = 0; i < starCount * 3; i += 3) {
    let x, y;
    
    // Create an invisible "tunnel" so stars don't spawn inside the cards
    do {
      x = (Math.random() - 0.5) * 160; // Spread X wider (-80 to 80)
      y = (Math.random() - 0.5) * 100; // Spread Y taller (-50 to 50)
      
    // KEEP LOOPING if the star lands inside the hallway area 
    // (X between -16 and 16) AND (Y between -12 and 12)
    } while (Math.abs(x) < 16 && Math.abs(y) < 12);

    posArray[i] = x;
    posArray[i+1] = y;
    posArray[i+2] = START_OFFSET + 20 - Math.random() * (totalDepth + 150); // Z
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  
  // FIX: Apply the round glowing texture and increase the size
  const starMat = new THREE.PointsMaterial({
    size: 0.4, // Increased size because the texture is soft and fades out
    map: createStarTexture(), // Applies our round, glowing canvas
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  
  const starMesh = new THREE.Points(starGeo, starMat);
  scene.add(starMesh);


  const scrollSpacer = document.getElementById('spacer');
  scrollSpacer.style.height = `${maxScrollPixels + window.innerHeight + 200}px`;
  
  setupRaycaster();
}

/* =============================================
   RAYCASTER & HOVER
   ============================================= */
let hoveredCard = null;
function setupRaycaster() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  window.addEventListener('click', (event) => {
    if (document.getElementById('detailPanel').classList.contains('open')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const cardsOnly = stageCards.map(c => c.mesh);
    const intersects = raycaster.intersectObjects(cardsOnly);
    if (intersects.length > 0) openDetail(intersects[0].object.userData.year);
  });
  
  window.addEventListener('mousemove', (event) => {
    if (document.getElementById('detailPanel').classList.contains('open')) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const cardsOnly = stageCards.map(c => c.mesh);
    const intersects = raycaster.intersectObjects(cardsOnly);

    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const object = intersects[0].object;
      if (hoveredCard !== object) {
        if (hoveredCard) hoveredCard.children[0].userData.targetOpacity = 0;
        hoveredCard = object;
        hoveredCard.children[0].userData.targetOpacity = 0.5;
      }
    } else {
      document.body.style.cursor = 'default';
      if (hoveredCard) {
        hoveredCard.children[0].userData.targetOpacity = 0;
        hoveredCard = null;
      }
    }
  });
}

/* =============================================
   RENDER LOOP
   ============================================= */
function tick() {
  if (stageCards.length === 0) {
    requestAnimationFrame(tick);
    return;
  }

  const sc = window.scrollY;

  document.body.style.setProperty('--scroll', sc);

  introEl.style.opacity = String(1 - Math.min(1, sc / (window.innerHeight * 0.4)));

  const START_OFFSET = 20; 
  const cameraZ = START_OFFSET - (sc * 0.02);
  camera.position.z = cameraZ;

  let closest = stageCards[0];
  let bestDist = Infinity;

  for (const c of stageCards) {
    const relZ = c.zPos - cameraZ; 
    const fadeStart = -12; 
    const fadeEnd = -6;    

    if (relZ > fadeEnd) {
      c.mesh.material.opacity = 0;
      c.glowMesh.material.opacity = 0;
      c.mesh.visible = false; 
    } else {
      c.mesh.visible = true;
      c.glowMesh.material.opacity += (c.glowMesh.userData.targetOpacity - c.glowMesh.material.opacity) * 0.1;

      if (relZ > fadeStart) {
        let fadeAmount = (relZ - fadeStart) / (fadeEnd - fadeStart);
        c.mesh.material.opacity = 1 - fadeAmount;
      } else {
        c.mesh.material.opacity = 1;
      }
    }

    const absDist = Math.abs(relZ);
    if (absDist < bestDist) {
      bestDist = absDist;
      closest = c;
    }
  }

  if (hudYear.textContent !== String(closest.year)) {
    hudYear.textContent = closest.year;
    const era = eraOf(closest.year);
    if (era !== currentEra) {
      currentEra = era;
      hudEra.style.opacity = '0';
      setTimeout(() => { hudEra.textContent = era; hudEra.style.opacity = '1'; }, 200);
    }
  }

  const totalTravel = totalDepth + START_OFFSET;
  const currentTravel = START_OFFSET - cameraZ;
  hudProg.style.width = Math.min(100, Math.max(0, (currentTravel / totalTravel) * 100)) + '%';
  endCard.classList.toggle('show', cameraZ <= -totalDepth);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

/* =============================================
   DETAIL MODAL & D3 PIE CHART
   ============================================= */
const detailPanel = document.getElementById('detailPanel');
const stageContainer = document.getElementById('stage');

document.getElementById('closeDetail').addEventListener('click', (e) => { closeDetail(); e.stopPropagation(); });
detailPanel.addEventListener('click', (e) => { if (e.target === detailPanel) { closeDetail(); e.stopPropagation(); }});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

function closeDetail() {
  detailPanel.classList.remove('open');
  document.body.style.overflow = ''; 
  stageContainer.style.pointerEvents = 'auto'; 
}

function openDetail(year) {
  const yd = YEAR_MAP[year];
  if (!yd) return;

  stageContainer.style.pointerEvents = 'none'; 
  document.getElementById('detailTitle').innerHTML = `${COUNTRY_NAME.toUpperCase()} <em>${year}</em>`;
  document.getElementById('fileNo').textContent  = `File № ${ISO} / ${year}`;
  document.getElementById('pieTotal').textContent = yd.total;
  
  const img = new Image();
  img.onload = () => { document.getElementById('detailPhoto').style.backgroundImage = `url('${img.src}')`; };
  img.onerror = () => { document.getElementById('detailPhoto').style.backgroundImage = `url('${makePhoto(year)}')`; };
  img.src = `images/archive/${ISO}/${yd.year}.jpg`;

  document.getElementById('detailMeta').innerHTML = `<div>${yd.region || ''}</div><div>Catalogued · 2026</div>`;

  const data = Object.entries(yd.breakdown).filter(([, n]) => n > 0).map(([k, n]) => ({ name: k, value: n }));
  const width = 240, height = 240;
  const radius = Math.min(width, height) / 2;

  const arc = d3.arc().innerRadius(radius * 0.70).outerRadius(radius - 2);
  const pie = d3.pie().padAngle(2 / radius).sort(null).value(d => d.value);

  const svg = d3.select("#pieSvg");
  svg.selectAll("*").remove(); 
  svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

  svg.append("g")
    .selectAll("path").data(pie(data)).join("path")
      .attr("fill", d => typeColor(d.data.name))
      .attr("d", arc)
    .append("title").text(d => `${typeLabel(d.data.name)}: ${d.data.value.toLocaleString()}`);

  svg.append("g")
      .attr("font-family", "'Inter', sans-serif").attr("font-size", 11)
      .attr("fill", "#ffffff").attr("text-anchor", "middle")
    .selectAll("text").data(pie(data)).join("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.35)
        .append("tspan").attr("y", "0.3em").attr("font-weight", "500")
        .text(d => d.data.value.toLocaleString("en-US")));

  document.getElementById('pieLegend').innerHTML = data.map(d => `
      <div class="item">
        <span class="swatch" style="background:${typeColor(d.name)}"></span>
        ${typeLabel(d.name)}
        <span class="ct">${d.value}</span>
      </div>`).join('');

  document.getElementById('statDeaths').innerHTML = yd.deaths > 0 ? `<em>${fmt(yd.deaths)}</em>` : '<em>0</em>';
  document.getElementById('statAffected').innerHTML = yd.affected > 0 ? `${fmt(yd.affected)}<span class="unit">souls</span>` : '—';
  document.getElementById('statDamage').innerHTML = yd.damage > 0 ? `${formatDamage(yd.damage)}<span class="unit">USD</span>` : '—';

  const ctx = curatedContext(year, yd);
  document.getElementById('ctxDeaths').textContent   = ctx.deaths;
  document.getElementById('ctxAffected').textContent = ctx.affected;
  document.getElementById('ctxDamage').textContent   = ctx.damage;
  document.getElementById('narrative').textContent   = ctx.narrative;

  detailPanel.classList.add('open');
  document.body.style.overflow = 'hidden'; 
}

/* =============================================
   DATA LOADING & INIT
   ============================================= */
async function init() {
  const csvPaths = ['data/emdat_clean.csv', '../docs/data/emdat_clean.csv'];
  let rawRows = [];
  for (const p of csvPaths) {
    try {
      const rows = await d3.csv(p);
      if (rows.length > 0) { rawRows = rows; break; }
    } catch (e) { /* try next */ }
  }

  const events = rawRows.filter(d => d.iso === ISO).map(d => ({
    year: +d.year, type: d.type || 'unknown', name: d.name || 'Unnamed Event',
    deaths: +d.deaths || 0, affected: +d.affected || 0, damage: +d.damage_usd_thousands || 0, region: d.region || ''
  }));

  // Hide the loading overlay when everything is loaded!
  document.getElementById('loadingOverlay').classList.add('done');

  if (events.length === 0) {
    document.getElementById('noData').classList.add('show');
    return;
  }

  const refRow = rawRows.find(d => d.iso === ISO);
  COUNTRY_NAME = refRow ? refRow.country : ISO;

  const allYears = [...new Set(events.map(d => d.year))].sort((a, b) => a - b);
  const yearDataArr = allYears.map(year => {
    const yEvts = events.filter(e => e.year === year);
    const breakdown = {};
    yEvts.forEach(e => { breakdown[e.type] = (breakdown[e.type] || 0) + 1; });
    const deaths   = yEvts.reduce((s, e) => s + e.deaths, 0);
    const affected = yEvts.reduce((s, e) => s + e.affected, 0);
    const damageB  = +(yEvts.reduce((s, e) => s + e.damage, 0) / 1e6).toFixed(2);
    const region   = yEvts[0]?.region || '';
    const isSpike  = deaths > 1000 || yEvts.length >= 15;
    return { year, total: yEvts.length, breakdown, deaths, affected, damage: damageB, region, isSpike };
  });

  YEAR_MAP = Object.fromEntries(yearDataArr.map(d => [d.year, d]));

  document.title = `${COUNTRY_NAME} — Country Timeline | Natural Disasters Museum`;
  document.getElementById('breadcrumbCountry').textContent = `${COUNTRY_NAME} Timeline`;
  document.getElementById('introTitle').innerHTML = `${COUNTRY_NAME},<br><em>over fifty years.</em>`;
  document.getElementById('introLede').textContent = `A walk down the museum hallway — ${yearDataArr.length} years of recorded disasters in ${COUNTRY_NAME}. Each exhibit drifts toward you, presents itself, and steps aside.`;

  const overviewHref = `country_overview.html?iso=${ISO}`;
  document.getElementById('overviewBtn').href = overviewHref;
  document.getElementById('endOverviewBtn').href = overviewHref;
  document.getElementById('endCardText').textContent = `You've walked through the full record for ${COUNTRY_NAME}. Step into the country overview to see it all at once, or walk the corridor again.`;

  document.getElementById('tickStart').textContent = allYears[0];
  document.getElementById('tickMid').textContent   = allYears[Math.floor(allYears.length / 2)];
  document.getElementById('tickEnd').textContent   = allYears[allYears.length - 1];

  buildCards(yearDataArr);
  requestAnimationFrame(tick);
}

init();