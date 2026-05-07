/* ============================================
   SCENE 1: MUSEUM ENTRANCE + TICKET
   ============================================ */

// const WelcomePage = {
//   worldData: null,
//   timeTravelCanvas: null,
//   timeTravelCtx: null,
//   particles: [],
//   animationId: null,

//   async init() {
//     console.log('Initializing Scene 1: Welcome Page');


//     this.initTimeTravelEffect();
//     this.attachTicketClickHandler();
//   },

//   initTimeTravelEffect() {
//     this.timeTravelCanvas = document.getElementById('timeTravel');
//     if (!this.timeTravelCanvas) return;

//     this.timeTravelCtx = this.timeTravelCanvas.getContext('2d');

//     // Set canvas size - full screen
//     const resize = () => {
//       this.timeTravelCanvas.width = window.innerWidth;
//       this.timeTravelCanvas.height = window.innerHeight;
//     };
//     resize();

//     // Recreate particles on resize
//     let resizeTimeout;
//     window.addEventListener('resize', () => {
//       clearTimeout(resizeTimeout);
//       resizeTimeout = setTimeout(() => {
//         resize();
//         this.createParticles();
//       }, 100);
//     });

//     this.createParticles();
//     this.animateTimeTravel();
//   },

//   createParticles() {
//     this.particles = [];

//     // Create particles
//     const numParticles = 100;
//     const centerX = this.timeTravelCanvas.width / 2;
//     const centerY = this.timeTravelCanvas.height / 2;

//     for (let i = 0; i < numParticles; i++) {
//       const angle = Math.random() * Math.PI * 2;
//       const speed = Math.random() * 2 + 0.5;
//       const distance = Math.random() * 300;

//       this.particles.push({
//         x: centerX + Math.cos(angle) * distance,
//         y: centerY + Math.sin(angle) * distance,
//         vx: Math.cos(angle) * speed,
//         vy: Math.sin(angle) * speed,
//         size: Math.random() * 2 + 1,
//         opacity: Math.random() * 0.5 + 0.3,
//         year: 1975 + Math.floor(Math.random() * 51) // Random year between 1975-2025
//       });
//     }

//     // Add some year labels that travel
//     for (let year = 1975; year <= 2025; year += 5) {
//       const angle = Math.random() * Math.PI * 2;
//       const speed = Math.random() * 1.5 + 1;
//       const distance = Math.random() * 200;

//       this.particles.push({
//         x: centerX + Math.cos(angle) * distance,
//         y: centerY + Math.sin(angle) * distance,
//         vx: Math.cos(angle) * speed,
//         vy: Math.sin(angle) * speed,
//         size: 0,
//         opacity: Math.random() * 0.4 + 0.2,
//         year: year,
//         isYearLabel: true
//       });
//     }
//   },

//   animateTimeTravel() {
//     const ctx = this.timeTravelCtx;
//     const canvas = this.timeTravelCanvas;

//     const animate = () => {
//       if (!this.timeTravelCanvas || !this.timeTravelCtx) {
//         return; // Stop if canvas is removed
//       }

//       const centerX = canvas.width / 2;
//       const centerY = canvas.height / 2;

//       // Fade out effect for trails
//       ctx.fillStyle = 'rgba(8, 10, 15, 0.15)';
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // Update and draw particles
//       this.particles.forEach(particle => {
//         // Move particle
//         particle.x += particle.vx;
//         particle.y += particle.vy;

//         // Reset if out of bounds
//         const dx = particle.x - centerX;
//         const dy = particle.y - centerY;
//         const distance = Math.sqrt(dx * dx + dy * dy);

//         if (distance > Math.max(canvas.width, canvas.height) / 2 + 100) {
//           const angle = Math.random() * Math.PI * 2;
//           const speed = Math.random() * (particle.isYearLabel ? 1.5 : 2) + (particle.isYearLabel ? 1 : 0.5);
//           const resetDistance = Math.random() * 100;

//           particle.x = centerX + Math.cos(angle) * resetDistance;
//           particle.y = centerY + Math.sin(angle) * resetDistance;
//           particle.vx = Math.cos(angle) * speed;
//           particle.vy = Math.sin(angle) * speed;
//         }

//         // Draw particle
//         if (particle.isYearLabel) {
//           // Draw year label
//           ctx.fillStyle = `rgba(110, 182, 255, ${particle.opacity})`;
//           ctx.font = '14px "Bebas Neue", sans-serif';
//           ctx.fillText(particle.year, particle.x, particle.y);
//         } else {
//           // Draw dot
//           ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
//           ctx.beginPath();
//           ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
//           ctx.fill();
//         }
//       });

//       this.animationId = requestAnimationFrame(animate);
//     };

//     animate();
//   },

//   stopTimeTravelEffect() {
//     if (this.animationId) {
//       cancelAnimationFrame(this.animationId);
//       this.animationId = null;
//     }
//   },

//   attachTicketClickHandler() {
//     const ticket = document.getElementById('ticket');

//     ticket.addEventListener('click', () => {
//       console.log('Ticket clicked - transitioning to globe scene');

//       // Zoom animation
//       ticket.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
//       ticket.style.transform = 'scale(8)';
//       ticket.style.opacity = '0';

//       // Navigate to globe scene after animation
//       setTimeout(() => {
//         App.showScene('scene-globe');

//         // Reset ticket for next time
//         setTimeout(() => {
//           ticket.style.transition = 'none';
//           ticket.style.transform = '';
//           ticket.style.opacity = '1';
//           setTimeout(() => {
//             ticket.style.transition = '';
//           }, 50);
//         }, 100);
//       }, 600);
//     });
//   }
// };

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
    ctx.fillStyle = 'rgba(12, 17, 22, 0.25)';   // matches your --bgcolor
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
// (script is at end of <body> so DOM is ready — no DOMContentLoaded needed)
(function attachTicketHandler() {
  const ticket = document.getElementById('ticket');
  const frame  = document.getElementById('scene-ticket');
  if (!ticket || !frame) return;

  function enterMuseum() {
    ticket.style.transition = 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease';
    ticket.style.transform  = 'scale(8)';
    ticket.style.opacity    = '0';

    setTimeout(() => {
      App.showScene('scene-globe');

      setTimeout(() => {
        ticket.style.transition = 'none';
        ticket.style.transform  = '';
        ticket.style.opacity    = '1';
        setTimeout(() => { ticket.style.transition = ''; }, 50);
      }, 100);
    }, 700);
  }

  ticket.addEventListener('click', enterMuseum);
  ticket.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') enterMuseum(); });
})();