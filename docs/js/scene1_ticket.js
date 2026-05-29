/* ============================================
   SCENE 1: MUSEUM ENTRANCE + TICKET
   ============================================ */

// Kept as a global utility — scene2_globe.js calls Scene1.getISO3FromNumericId()
const Scene1 = {
  getISO3FromNumericId(numericId) {
    const idToISO = {
      '156': 'CHN', '840': 'USA', '356': 'IND', '360': 'IDN', '608': 'PHL',
      '392': 'JPN', '050': 'BGD', '586': 'PAK', '076': 'BRA', '484': 'MEX',
      '036': 'AUS', '276': 'DEU', '250': 'FRA', '826': 'GBR', '724': 'ESP',
      '380': 'ITA', '792': 'TUR', '364': 'IRN', '231': 'ETH', '404': 'KEN',
      '566': 'NGA', '710': 'ZAF', '704': 'VNM', '764': 'THA', '004': 'AFG',
      '524': 'NPL', '104': 'MMR', '332': 'HTI', '643': 'RUS', '124': 'CAN',
      '032': 'ARG', '152': 'CHL', '170': 'COL', '604': 'PER', '012': 'DZA',
      '818': 'EGY', '504': 'MAR', '508': 'MOZ', '800': 'UGA', '024': 'AGO',
      '120': 'CMR', '180': 'COD', '729': 'SDN', '440': 'LTU', '112': 'BLR',
      '426': 'LSO', '834': 'TZA', '894': 'ZMB', '716': 'ZWE', '178': 'COG',
      '266': 'GAB', '288': 'GHA', '384': 'CIV', '466': 'MLI', '478': 'MRT',
      '562': 'NER', '686': 'SEN', '694': 'SLE', '728': 'SSD'
    };
    return idToISO[numericId];
  }
};

// Drifting starfield background
(function initTimeTravel() {
  const canvas = document.getElementById('timeTravel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let stars = [];
  let w, h, cx, cy;
  const STAR_COUNT = 880;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.clientWidth = window.innerWidth;
    h = canvas.clientHeight = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
  }

  function makeStar() {
    return {
      // Position in 3D space — z is depth (small z = far, large z = close)
      x: (Math.random() - 0.5) * w * 2,
      y: (Math.random() - 0.5) * h * 2,
      z: Math.random() * w,
      pz: 0,
    };
  }

  function init() {
    resize();
    stars = Array.from({ length: STAR_COUNT }, makeStar);
  }

  function frame() {
    // Soft trailing fade — instead of clearing, draw a translucent dark layer.
    // This creates faint motion-trails that sell the "drifting through space" feel.
    ctx.fillStyle = 'rgba(12, 17, 22, 0.25)';
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      s.pz = s.z;
      s.z -= 0.8; // drift speed (smaller = slower, more meditative)

      if (s.z < 1) {
        // Reset star: throw it back into the distance
        s.x = (Math.random() - 0.5) * w * 2;
        s.y = (Math.random() - 0.5) * h * 2;
        s.z = w;
        s.pz = w;
        continue;
      }

      // Project 3D point onto 2D screen using simple perspective
      const sx = (s.x / s.z) * (w * 0.5) + cx;
      const sy = (s.y / s.z) * (w * 0.5) + cy;

      const psx = (s.x / s.pz) * (w * 0.5) + cx;
      const psy = (s.y / s.pz) * (w * 0.5) + cy;

      // Skip if off-screen
      if (sx < 0 || sx > w || sy < 0 || sy > h) continue;

      // Closer stars are brighter and bigger
      const depth = 1 - s.z / w;
      const size = depth * 1.4;
      const alpha = Math.min(1, depth * 1.2);

      // Draw a short streak from previous to current position
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(psx, psy);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      // Bright dot at the leading edge
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  init();
  requestAnimationFrame(frame);
})();

// Ticket click → Scene 2
(function attachTicketHandler() {
  const ticket = document.getElementById('ticket');
  const frame  = document.getElementById('scene-ticket');
  if (!ticket || !frame) return;

  function enterMuseum() {
    ticket.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease';
    ticket.style.transform  = 'scale(8)';
    ticket.style.opacity    = '0';

    setTimeout(() => {
      window.location.href = 'globe.html';
    }, 700);
  }

  ticket.addEventListener('click', enterMuseum);
  ticket.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') enterMuseum(); });
})();