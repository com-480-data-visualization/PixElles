const Scene4 = {
  globe: null,
  chapters: [],
  yearly: {},
  meta: {},
  activeIndex: -1,
  countryByIso: {},

  ISO3_TO_2: {
    CHN: 'cn', ETH: 'et', SDN: 'sd', BGD: 'bd', IDN: 'id', LKA: 'lk',
    IND: 'in', THA: 'th', PAK: 'pk', MMR: 'mm', HTI: 'ht', TUR: 'tr'
  },

  // mirrors DISASTER_TYPE_META in data.js
  TYPE_COLORS: {
    drought: '#FFC857', earthquake: '#C96B32', extreme_temperature: '#FF5DB8',
    flood: '#5EA8FF', landslide: '#7FE36A', storm: '#8C86FF', epidemic: '#6EE7C8',
    infestation: '#D6E75B', animal_incident: '#6DD6E8', volcano: '#FF695B',
    wildfire: '#FFA142', impact: '#C7A8FF'
  },

  YEAR_MIN: 1975,
  YEAR_MAX: 2025,

  async init() {
    const data = await this.loadData();
    if (!data) return;

    this.chapters = data.chapters || [];
    this.yearly = data.yearly || {};
    this.meta = data.meta || {};
    if (this.meta.year_min) this.YEAR_MIN = this.meta.year_min;
    if (this.meta.year_max) this.YEAR_MAX = this.meta.year_max;

    // The globe, starfield and country shapes are enhancements; if any fail,
    // the chapter content must still render.
    try {
      this.buildStarfield();
    } catch (err) {
      console.error('Earth Story: starfield unavailable', err);
    }

    try {
      this.buildGlobe();
    } catch (err) {
      console.error('Earth Story: globe unavailable', err);
      this.globe = null;
    }

    try {
      await this.loadCountries();
    } catch (err) {
      console.error('Earth Story: country shapes unavailable', err);
    }

    try {
      this.buildSteps();
      this.observeSteps();
      this.bindScroll();
      this.initYearRail();
      this.buildRailTicks();
      this.goToChapter(0);
    } catch (err) {
      console.error('Earth Story: failed to build the page', err);
    } finally {
      const loading = document.getElementById('es-loading');
      if (loading) loading.remove();
    }
  },

  /* ---- data ------------------------------------------------------------ */

  async loadData() {
    const candidates = [
      'data/story_chapters.json',
      'docs/data/story_chapters.json',
      '/docs/data/story_chapters.json'
    ];
    for (const path of candidates) {
      try {
        const res = await fetch(path);
        if (res.ok) return await res.json();
      } catch (err) {
        /* try next candidate */
      }
    }
    const loading = document.getElementById('es-loading');
    if (loading) {
      loading.textContent =
        'Could not load story data. Serve the page from a local web server.';
      loading.classList.add('es-error');
    }
    return null;
  },

  typeColor(type) {
    return this.TYPE_COLORS[type] || '#97AEC4';
  },

  typeLabel(type) {
    return (type || 'event').replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  },

  hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  },

  async loadCountries() {
    if (!this.globe) return;
    const candidates = [
      'data/countries_110m.geojson',
      'docs/data/countries_110m.geojson',
      '/docs/data/countries_110m.geojson'
    ];
    for (const path of candidates) {
      try {
        const res = await fetch(path);
        if (!res.ok) continue;
        const gj = await res.json();
        this.countryByIso = {};
        for (const f of gj.features || []) {
          const iso = f.properties && f.properties.iso;
          if (iso) this.countryByIso[iso] = f;
        }
        // Re-apply the active chapter now that country shapes exist.
        if (this.activeIndex >= 0 && this.chapters[this.activeIndex]) {
          this.updateGlobeMarkers(this.chapters[this.activeIndex]);
        }
        return;
      } catch (err) {
        /* try next candidate */
      }
    }
  },

  /* ---- globe ----------------------------------------------------------- */

  buildGlobe() {
    const wrap = document.getElementById('es-globe');
    if (!wrap || typeof Globe === 'undefined') return;

    this.globe = Globe()(wrap)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('rgb(37,94,150)')
      .atmosphereAltitude(0.42)
      .ringColor(d => d.__interp)
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('speed')
      .ringRepeatPeriod('period')
      .labelLat('lat')
      .labelLng('lng')
      .labelText('text')
      .labelColor(d => d.color)
      .labelSize(d => d.size)
      .labelDotRadius(d => d.dot)
      .labelAltitude(0.013)
      .labelResolution(2)
      .polygonCapColor(d => d.__capColor || 'rgba(0,0,0,0)')
      .polygonSideColor(d => d.__sideColor || 'rgba(0,0,0,0)')
      .polygonStrokeColor(d => d.__strokeColor || 'rgba(0,0,0,0)')
      .polygonAltitude(0.008)
      .polygonLabel(d => d.__label || '')
      .polygonsTransitionDuration(400)
      .htmlElementsData([])
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.02)
      .htmlElement(d => d.__el);

    this.globe.pointOfView(
      { lat: 10, lng: 20, altitude: 2.6 }, 0);

    const controls = this.globe.controls();
    controls.enableZoom = false;
    controls.autoRotate = false;
    controls.enablePan = false;

    const resize = () => {
      this.globe.width(wrap.clientWidth);
      this.globe.height(wrap.clientHeight);
    };
    resize();
    window.addEventListener('resize', resize);
  },

  /* ---- animated starfield ---------------------------------------------- */

  buildStarfield() {
    const canvas = document.getElementById('es-stars');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stars = [];
    let w = 0, h = 0;

    const seed = () => {
      const count = Math.round(
        Math.min(460, Math.max(180, (w * h) / 4200)));
      stars = Array.from({ length: count }, () => {
        const roll = Math.random();
        const hero = roll < 0.16;
        const mid = !hero && roll < 0.5;
        return {
          x: Math.random(),
          y: Math.random(),
          r: hero ? 1.4 + Math.random() * 1.3
            : mid ? 0.9 + Math.random() * 0.7
              : 0.5 + Math.random() * 0.5,
          a: hero ? 0.85 + Math.random() * 0.15
            : mid ? 0.55 + Math.random() * 0.35
              : 0.32 + Math.random() * 0.3,
          tw: 0.4 + Math.random() * 1.1,
          ph: Math.random() * Math.PI * 2,
          drift: hero ? 0.01 : 0.005,
          glow: hero
        };
      });
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (tSec) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const alpha = reduceMotion
          ? s.a
          : s.a * (0.6 + 0.4 * Math.sin(tSec * s.tw + s.ph));
        const y = reduceMotion ? s.y : (s.y + tSec * s.drift) % 1;
        const px = s.x * w, py = y * h;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        if (s.glow) {
          const grad = ctx.createRadialGradient(px, py, 0, px, py, s.r * 4);
          grad.addColorStop(0, 'rgba(214,230,250,0.85)');
          grad.addColorStop(1, 'rgba(214,230,250,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        }
        ctx.fillStyle = '#e8effc';
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    if (reduceMotion) {
      draw(0);
      return;
    }
    const loop = ts => { draw(ts / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  },

  // Per-ring t -> rgba() interpolator so each ring fades as it propagates.
  ringInterpolator(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return t => `rgba(${r},${g},${b},${(1 - t).toFixed(3)})`;
  },

  updateGlobeMarkers(chapter) {
    if (!this.globe) return;

    const markers = chapter.markers || [];

    const rings = markers.map(m => {
      const color = this.typeColor(m.type);
      const intensity = Math.min(1, (m.deaths || 0) / 120000);
      return {
        lat: m.lat,
        lng: m.lng,
        maxR: 3.5 + intensity * 6,
        speed: 2.4,
        period: 1100,
        __interp: this.ringInterpolator(color)
      };
    });

    const callouts = markers.map(m => {
      const color = this.typeColor(m.type);
      const iso2 = this.ISO3_TO_2[m.iso];
      const flag = iso2
        ? `<img class="es-callout-flag" src="https://flagcdn.com/40x30/${iso2}.png" alt="">`
        : '';
      const el = document.createElement('div');
      el.className = 'es-callout';
      el.innerHTML = `
        <div class="es-callout-card" style="--c:${color}">
          ${flag}<span class="es-callout-name">${m.country}</span>
        </div>
        <div class="es-callout-stem" style="--c:${color}"></div>
        <div class="es-callout-dot" style="--c:${color}"></div>`;
      return { lat: m.lat, lng: m.lng, __el: el };
    });

    const polygons = [];
    for (const m of markers) {
      const feat = this.countryByIso[m.iso];
      if (!feat) continue;
      const color = this.typeColor(m.type);
      feat.__capColor = this.hexToRgba(color, 0.5);
      feat.__sideColor = this.hexToRgba(color, 0.15);
      feat.__strokeColor = color;
      feat.__label =
        `<b>${m.country}</b><br/>${this.typeLabel(m.hazard || m.type)}`;
      polygons.push(feat);
    }

    this.globe.ringsData(rings);
    this.globe.labelsData([]);
    this.globe.htmlElementsData(callouts);
    this.globe.polygonsData(polygons);
  },

  /* ---- chapters / DOM -------------------------------------------------- */

  buildSteps() {
    const root = document.getElementById('es-steps');
    if (!root) return;

    let chapterNo = 0;

    this.chapters.forEach((ch, i) => {
      const step = document.createElement('section');
      step.className = `es-step es-step--${ch.kind}`;
      step.dataset.index = i;

      let badge;
      if (ch.kind === 'intro') badge = 'Prologue';
      else if (ch.kind === 'outro') badge = 'Epilogue';
      else badge = `Chapter ${String(++chapterNo).padStart(2, '0')}`;

      const card = document.createElement('article');
      card.className = `es-card es-card--${ch.kind}`;
      card.innerHTML = `
        <div class="es-card-meta">
          <span class="es-card-badge">${badge}</span>
          <span class="es-card-year">${ch.year}</span>
        </div>
        <h2 class="es-card-title">${ch.title}</h2>
        <p class="es-card-body">${ch.body}</p>
        ${this.eventsHTML(ch)}
        ${this.statsHTML(ch)}
        ${ch.kind === 'event' ? '' : '<div class="es-card-chart"></div>'}
      `;

      step.appendChild(card);
      root.appendChild(step);
    });
  },

  eventsHTML(ch) {
    if (ch.kind !== 'event' || !ch.markers || !ch.markers.length) return '';
    const rows = ch.markers.map(m => `
      <li class="es-event-row">
        <span class="es-event-dot" style="--c:${this.typeColor(m.type)}"></span>
        <span class="es-event-country">${m.country}</span>
        <span class="es-event-type">${m.hazard || this.typeLabel(m.type)}</span>
        <span class="es-event-deaths">${this.fmt(m.deaths)} deaths</span>
      </li>`).join('');
    return `<ul class="es-card-events">${rows}</ul>`;
  },

  statsHTML(ch) {
    if (!ch.stats || !ch.stats.length) return '';
    const cells = ch.stats.map(s => `
      <div class="es-stat">
        <div class="es-stat-value">${s.value}</div>
        <div class="es-stat-label">${s.label}</div>
      </div>`).join('');
    return `<div class="es-card-stats">${cells}</div>`;
  },

  /* ---- scroll wiring --------------------------------------------------- */

  observeSteps() {
    const steps = document.querySelectorAll('.es-step');
    // Active = the step crossing the middle band of the viewport.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = +entry.target.dataset.index;
          this.goToChapter(index);
        }
      });
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });

    steps.forEach(step => observer.observe(step));
  },

  bindScroll() {
    const hint = document.getElementById('es-scroll-hint');
    const onScroll = () => {
      if (hint) hint.classList.toggle('is-hidden', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  // Even per-chapter spacing so the dots never cluster; label shows the year.
  setRailIndex(index) {
    const fill = document.getElementById('es-rail-fill');
    const dot = document.getElementById('es-rail-dot');
    const yearEl = document.getElementById('es-rail-year');
    if (!fill || !dot || !yearEl) return;

    const n = this.chapters.length;
    const frac = n > 1 ? Math.min(1, Math.max(0, index / (n - 1))) : 0;
    fill.style.height = `${frac * 100}%`;
    dot.style.top = `${frac * 100}%`;
    const year = this.chapters[index] ? this.chapters[index].year : this.YEAR_MIN;
    yearEl.textContent = year;

    const track = document.getElementById('es-rail-track');
    if (track) {
      track.setAttribute('aria-valuenow', year);
      track.setAttribute('aria-valuetext', String(year));
    }
  },

  // The rail doubles as a scrubber: click or drag to jump to the nearest chapter.
  initYearRail() {
    const track = document.getElementById('es-rail-track');
    if (!track || !this.chapters.length) return;

    const goToStep = index => {
      const step = document.querySelector(`.es-step[data-index="${index}"]`);
      if (step) step.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    const indexAt = clientY => {
      const rect = track.getBoundingClientRect();
      if (rect.height === 0) return 0;
      const f = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      return Math.round(f * (this.chapters.length - 1));
    };

    let dragging = false;
    let lastIndex = -1;
    const scrubTo = clientY => {
      const index = indexAt(clientY);
      if (index !== lastIndex) { lastIndex = index; goToStep(index); }
    };

    track.addEventListener('pointerdown', e => {
      dragging = true;
      lastIndex = -1;
      track.classList.add('is-dragging');
      if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
      scrubTo(e.clientY);
      e.preventDefault();
    });
    track.addEventListener('pointermove', e => {
      if (dragging) scrubTo(e.clientY);
    });
    const endDrag = e => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      if (track.releasePointerCapture && e.pointerId != null) {
        try { track.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
      }
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    track.addEventListener('keydown', e => {
      let delta = 0;
      switch (e.key) {
        case 'ArrowDown': case 'ArrowRight': case 'PageDown': delta = 1; break;
        case 'ArrowUp': case 'ArrowLeft': case 'PageUp': delta = -1; break;
        case 'Home': delta = -this.chapters.length; break;
        case 'End': delta = this.chapters.length; break;
        default: return;
      }
      e.preventDefault();
      const next = Math.min(this.chapters.length - 1,
        Math.max(0, this.activeIndex + delta));
      goToStep(next);
    });
  },

  buildRailTicks() {
    const track = document.getElementById('es-rail-track');
    if (!track || !this.chapters.length) return;
    const n = this.chapters.length;
    this.chapters.forEach((ch, i) => {
      const frac = n > 1 ? i / (n - 1) : 0;
      const tick = document.createElement('span');
      tick.className = 'es-rail-tick';
      tick.dataset.index = i;
      tick.style.top = `${frac * 100}%`;
      tick.title = `${ch.year} · ${ch.title}`;
      track.appendChild(tick);
    });
  },

  goToChapter(index) {
    if (index === this.activeIndex) return;
    const chapter = this.chapters[index];
    if (!chapter) return;
    this.activeIndex = index;

    this.setRailIndex(index);
    document.querySelectorAll('.es-rail-tick').forEach(t =>
      t.classList.toggle('is-current', +t.dataset.index === index));

    if (this.globe && chapter.camera) {
      this.globe.pointOfView(chapter.camera, 1700);
    }
    this.updateGlobeMarkers(chapter);

    document.querySelectorAll('.es-step').forEach(step => {
      step.classList.toggle('is-active', +step.dataset.index === index);
    });

    // Render the trend chart lazily, once the card has a measured width.
    if (chapter.kind !== 'event') {
      const step = document.querySelector(`.es-step[data-index="${index}"]`);
      const host = step && step.querySelector('.es-card-chart');
      if (host && !host.dataset.rendered) {
        host.dataset.rendered = 'true';
        this.renderTrendChart(host, chapter);
      }
    }
  },

  /* ---- trend mini-chart ------------------------------------------------ */

  renderTrendChart(host, chapter) {
    const events = this.yearly.events || {};
    const climate = this.yearly.climate_events || {};
    const years = Object.keys(events).map(Number).sort((a, b) => a - b);
    if (!years.length || typeof d3 === 'undefined') return;

    const series = years.map(y => ({
      year: y,
      events: events[y] || 0,
      climate: climate[y] || 0
    }));

    const width = host.clientWidth || 320;
    const height = 116;
    const margin = { top: 22, right: 4, bottom: 18, left: 4 };
    const iw = width - margin.left - margin.right;
    const ih = height - margin.top - margin.bottom;

    const svg = d3.select(host).append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'es-trend-svg');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([this.YEAR_MIN, this.YEAR_MAX]).range([0, iw]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(series, d => d.events) * 1.1]).range([ih, 0]);

    const area = d3.area()
      .x(d => x(d.year))
      .y0(ih)
      .y1(d => y(d.events))
      .curve(d3.curveMonotoneX);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.climate))
      .curve(d3.curveMonotoneX);

    // Years the stats describe; trend chapters carry an explicit [start, end].
    const span = Array.isArray(chapter.span) && chapter.span.length === 2
      ? chapter.span
      : [this.YEAR_MIN, this.YEAR_MAX];
    const s0 = Math.max(this.YEAR_MIN, span[0]);
    const s1 = Math.min(this.YEAR_MAX, span[1]);

    g.append('path')
      .datum(series)
      .attr('fill', 'rgba(151,174,196,0.16)')
      .attr('d', area);

    g.append('rect')
      .attr('x', x(s0)).attr('y', 0)
      .attr('width', Math.max(0, x(s1) - x(s0))).attr('height', ih)
      .attr('fill', 'rgba(110,182,255,0.10)');

    const within = series.filter(d => d.year >= s0 && d.year <= s1);
    if (within.length > 1) {
      g.append('path')
        .datum(within)
        .attr('fill', 'rgba(110,182,255,0.40)')
        .attr('d', area);
    }

    g.append('path')
      .datum(series)
      .attr('fill', 'none')
      .attr('stroke', '#FFA142')
      .attr('stroke-width', 1.6)
      .attr('opacity', 0.9)
      .attr('d', line);

    [s0, s1].forEach(yr => {
      const cx = x(yr);
      g.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', 0).attr('y2', ih)
        .attr('stroke', '#FF8775')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '3 3')
        .attr('opacity', 0.7);
    });

    const axis = svg.append('g')
      .attr('transform', `translate(${margin.left},${height - 4})`);
    [this.YEAR_MIN, 2000, this.YEAR_MAX].forEach(yr => {
      axis.append('text')
        .attr('x', x(yr))
        .attr('text-anchor', yr === this.YEAR_MIN ? 'start'
          : yr === this.YEAR_MAX ? 'end' : 'middle')
        .attr('fill', 'rgba(151,174,196,0.7)')
        .attr('font-size', '9px')
        .text(yr);
    });

    const caption = svg.append('text')
      .attr('x', margin.left)
      .attr('y', 10)
      .attr('font-size', '9px')
      .attr('letter-spacing', '0.08em');
    caption.append('tspan')
      .attr('fill', 'rgba(151,174,196,0.7)')
      .text('DISASTERS PER YEAR  ·  ');
    caption.append('tspan')
      .attr('fill', '#FFA142')
      .text('CLIMATE-RELATED');
  },

  /* ---- helpers --------------------------------------------------------- */

  fmt(n) {
    if (n == null) return '0';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
    return String(n);
  }
};
