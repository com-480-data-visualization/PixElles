/* ============================================
   SCENE 2: 3D GLOBE
   ============================================ */

// GLOBE_COUNTRY_NAME_ALIASES, baseNormalize(), canonicalIso() defined in data.js (loaded first)
const GLOBE_ISO_CENTER_ALIASES = ISO_ALIASES;

const GLOBE_FALLBACK_CENTERS = {
  AIA: { lat: 18.22, lng: -63.06 },
  ANT: { lat: 12.2, lng: -68.26 },
  ASM: { lat: -14.27, lng: -170.7 },
  ATG: { lat: 17.06, lng: -61.8 },
  AZO: { lat: 37.74, lng: -25.67 },
  BHR: { lat: 26.07, lng: 50.56 },
  BLM: { lat: 17.9, lng: -62.83 },
  BMU: { lat: 32.31, lng: -64.75 },
  BRB: { lat: 13.19, lng: -59.54 },
  COK: { lat: -21.24, lng: -159.78 },
  CYM: { lat: 19.31, lng: -81.25 },
  GLP: { lat: 16.25, lng: -61.58 },
  GUF: { lat: 3.93, lng: -53.13 },
  GUM: { lat: 13.44, lng: 144.79 },
  HKG: { lat: 22.32, lng: 114.17 },
  KNA: { lat: 17.36, lng: -62.78 },
  MAC: { lat: 22.2, lng: 113.54 },
  MAF: { lat: 18.08, lng: -63.05 },
  MNP: { lat: 15.1, lng: 145.67 },
  MSR: { lat: 16.74, lng: -62.19 },
  MTQ: { lat: 14.64, lng: -61.02 },
  MYT: { lat: -12.83, lng: 45.17 },
  NCL: { lat: -21.3, lng: 165.5 },
  NIU: { lat: -19.05, lng: -169.87 },
  PRI: { lat: 18.2, lng: -66.59 },
  PSE: { lat: 31.95, lng: 35.23 },
  PYF: { lat: -17.68, lng: -149.41 },
  REU: { lat: -21.12, lng: 55.54 },
  SHN: { lat: -15.96, lng: -5.71 },
  SPI: { lat: 28.29, lng: -16.63 },
  SXM: { lat: 18.04, lng: -63.07 },
  TCA: { lat: 21.69, lng: -71.8 },
  TKL: { lat: -9.2, lng: -171.85 },
  TUV: { lat: -7.48, lng: 178.68 },
  TWN: { lat: 23.7, lng: 121.0 },
  VGB: { lat: 18.42, lng: -64.64 },
  VIR: { lat: 18.34, lng: -64.9 },
  WLF: { lat: -13.77, lng: -177.16 }
};

const Scene2 = {
  _inited: false,
  globe: null,
  worldData: null,
  countryCentroids: {},
  countryFeatures: {},
  countryNameToISO: new Map(),
  currentYearRange: [1975, 2025],
  currentCountryData: {},
  debounceTimeout: null,
  disasterTypes: [],
  isPlaying: false,
  animationInterval: null,
  animationSpeed: 400,
  bubbleChartVisible: false,
  bubbleChartSvg: null,
  bubbleSimulation: null,
  topCountriesLimit: 30,

  async init() {
    console.log('Initializing Scene 2: 3D Globe');
    this.disasterTypes = getAvailableDisasterTypes();
    this.selectedType = this.disasterTypes[0]?.type || null;

    this.initFilters();
    this.initGlobe();
    this.initBubbleDetailDismissal();

    try {
      this.worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    } catch (error) {
      console.error('Failed to load world map:', error);
      this.updateVisualization();
      return;
    }

    this.updateVisualization();
  },

  initGlobe() {
    const container = document.getElementById('globeContainer');
    if (!container) return;

    this.globe = Globe()
      (container)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('rgb(37, 94, 150)')
      .atmosphereAltitude(0.5);

    this.globe.pointOfView({ lat: 12, lng: 68, altitude: 2.35 });

    const controls = this.globe.controls();
    controls.autoRotate = false;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;

    const resizeGlobe = () => {
      this.globe.width(container.clientWidth);
      this.globe.height(container.clientHeight);
    };

    resizeGlobe();
    window.addEventListener('resize', () => {
      resizeGlobe();
      if (this.bubbleChartVisible) {
        this.updateBubbleChart();
      }
    });

    controls.addEventListener('change', () => this.updateMarkerVisibility());
  },

  initFilters() {
    this.renderTypeFilters();

    this.yearStartSlider = document.getElementById('yearStartSlider');
    this.yearEndSlider = document.getElementById('yearEndSlider');
    this.yearMinVal = document.getElementById('yearMinVal');
    this.yearMaxVal = document.getElementById('yearMaxVal');
    this.yearRangeFill = document.getElementById('yearRangeFill');
    this.eventCount = document.getElementById('eventCount');
    this.dataStatus = document.getElementById('dataStatus');
    this.typeFilter = document.getElementById('typeFilter');
    this.playButton = document.getElementById('timelinePlayButton');
    this.bubbleChartButton = document.getElementById('bubbleChartButton');
    this.bubbleChartContainer = document.getElementById('bubbleChartContainer');
    this.closeBubbleChartButton = document.getElementById('closeBubbleChart');
    this.refreshTypeButtons();

    this.yearStartSlider?.addEventListener('input', () => this.handleYearRangeInput('start'));
    this.yearStartSlider?.addEventListener('change', () => this.handleYearRangeInput('start'));
    this.yearEndSlider?.addEventListener('input', () => this.handleYearRangeInput('end'));
    this.yearEndSlider?.addEventListener('change', () => this.handleYearRangeInput('end'));

    this.playButton?.addEventListener('click', () => this.togglePlayAnimation());
    this.bubbleChartButton?.addEventListener('click', () => this.toggleBubbleChart());
    this.closeBubbleChartButton?.addEventListener('click', () => this.closeBubbleChart());

    // Zoom controls
    document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
    document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
    document.getElementById('zoomReset')?.addEventListener('click', () => this.zoomReset());

    this.typeFilter?.addEventListener('click', event => {
      const button = event.target.closest('.chip[data-type]');
      if (!button) return;

      this.selectType(button.getAttribute('data-type'));
    });

    this.refreshCurrentCountryData();
    this.updateYearRangeUI();
    this.updateSelectedTypeButtons();
    this.updateEventCount();
  },

  renderTypeFilters() {
    const container = document.getElementById('typeFilter');
    if (!container) return;

    container.querySelectorAll('.chip[data-type]').forEach(button => button.remove());

    this.disasterTypes.forEach(({ type, label, color }) => {
      const button = document.createElement('button');
      const isSelected = type === this.selectedType;
      button.className = isSelected ? 'chip active' : 'chip';
      button.type = 'button';
      button.dataset.type = type;
      button.style.setProperty('--c', color);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      button.textContent = label;
      container.appendChild(button);
    });
  },

  refreshTypeButtons() {
    this.typeButtons = Array.from(document.querySelectorAll('#typeFilter .chip[data-type]'));
  },

  handleYearRangeInput(changedHandle) {
    // Stop animation if user manually adjusts sliders
    if (this.isPlaying) {
      this.stopAnimation();
    }

    let start = +this.yearStartSlider.value;
    let end = +this.yearEndSlider.value;

    if (start > end) {
      if (changedHandle === 'start') {
        end = start;
        this.yearEndSlider.value = end;
      } else {
        start = end;
        this.yearStartSlider.value = start;
      }
    }

    this.currentYearRange = [start, end];
    this.updateYearRangeUI();
    this.updateEventCount();
    this.debounceUpdate();
  },

  updateYearRangeUI() {
    if (!this.yearStartSlider || !this.yearEndSlider) return;

    const min = +this.yearStartSlider.min;
    const max = +this.yearStartSlider.max;
    const [start, end] = this.currentYearRange;
    const left = ((start - min) / (max - min)) * 100;
    const right = 100 - ((end - min) / (max - min)) * 100;

    if (this.yearMinVal) this.yearMinVal.textContent = start;
    if (this.yearMaxVal) this.yearMaxVal.textContent = end;

    if (this.yearRangeFill) {
      this.yearRangeFill.style.left = `${left}%`;
      this.yearRangeFill.style.right = `${right}%`;
    }
  },

  selectType(type) {
    if (!type) return;

    // Toggle off when the already-active type is clicked: no type selected
    // leaves the globe empty (no markers, 0 events).
    this.selectedType = type === this.selectedType ? null : type;
    this.updateSelectedTypeButtons();
    this.updateEventCount();
    this.debounceUpdate();
  },

  updateSelectedTypeButtons() {
    this.refreshTypeButtons();

    this.typeButtons.forEach(button => {
      const isSelected = button.getAttribute('data-type') === this.selectedType;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });
  },

  debounceUpdate() {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.updateVisualization();
    }, 120);
  },

  getActiveFilters() {
    const [yearStart, yearEnd] = this.currentYearRange;
    return {
      yearStart,
      yearEnd,
      types: this.selectedType === 'all' ? 'all' : (this.selectedType ? [this.selectedType] : [])
    };
  },

  refreshCurrentCountryData() {
    const raw = getFilteredCountryData(this.getActiveFilters());
    this.currentCountryData = {};
    Object.entries(raw).forEach(([iso, stats]) => {
      const key = this.canonicalIso(iso);
      const merged = this.currentCountryData[key];
      if (!merged) {
        this.currentCountryData[key] = { ...stats };
      } else {
        merged.count += stats.count;
        merged.deaths += stats.deaths;
        merged.damage += stats.damage;
      }
    });
  },

  canonicalIso(iso) {
    return canonicalIso(iso);
  },

  getCountryLabel(country) {
    const iso3 = this.getISOForCountryFeature(country);
    if (!iso3 || !COUNTRY_STATS[iso3]) return '';

    const stats = COUNTRY_STATS[iso3];
    const filteredStats = this.currentCountryData[iso3];
    const count = filteredStats?.count || 0;
    const hasMatches = count > 0;
    const typeLabel = hasMatches
      ? getDisasterTypeLabel(this.selectedType)
      : 'No matching type';
    const accent = hasMatches ? getDisasterColor(this.selectedType) : '#97AEC4';
    const displayName = normalizeCountryName(stats.country || country?.properties?.name);

    return `
      <div style="background: rgba(13,17,23,0.95); padding: 12px; border-radius: 8px; border: 1px solid ${accent};">
        <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: ${accent}; margin-bottom: 4px;">
          ${this.escapeHTML(displayName)}
        </div>
        <div style="font-size: 0.85rem; color: #fff;">
          ${formatNumber(count)} matching events
        </div>
        <div style="font-size: 0.75rem; color: ${accent}; margin-top: 4px;">
          ${this.escapeHTML(typeLabel)}
        </div>
      </div>
    `;
  },

  updateVisualization() {
    this.refreshCurrentCountryData();
    this.updateEventCount();

    if (this.bubbleChartVisible) {
      this.updateBubbleChart();
      return;
    }

    if (!this.globe || !this.worldData) return;

    this.updateGlobePolygons();
    this.updateGlobePoints();
  },

  updateGlobePolygons() {
    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);
    this.buildCountryCentroids(countries.features);

    this.globe
      .polygonsData(countries.features)
      .polygonAltitude(0.01)
      .polygonCapColor(() => 'rgba(0,0,0,0)')
      .polygonSideColor(() => 'rgba(0,0,0,0)')
      .polygonStrokeColor(() => 'rgba(151,174,196,0.34)')
      .polygonLabel(d => this.getCountryLabel(d))
      .onPolygonClick(d => {
        const iso3 = this.getISOForCountryFeature(d);
        if (iso3 && COUNTRY_STATS[iso3]) {
          this.handleCountryClick(iso3);
        }
      })
      .onPolygonHover(d => {
        const container = document.getElementById('globeContainer');
        if (container) container.style.cursor = d ? 'pointer' : 'default';
      });
  },

  buildCountryCentroids(features) {
    this.countryNameToISO = new Map();
    this.countryCentroids = {};
    this.countryFeatures = {};

    Object.entries(COUNTRY_STATS).forEach(([iso, stats]) => {
      const countryName = this.normalizeCountryName(stats.country);
      if (countryName && !this.countryNameToISO.has(countryName)) {
        this.countryNameToISO.set(countryName, iso);
      }
    });

    features.forEach(feature => {
      const iso3 = this.getISOForCountryFeature(feature);
      if (!iso3) return;

      const center = this.getInternalCountryCenter(feature);
      if (!center) return;

      this.countryFeatures[iso3] = feature;
      this.countryCentroids[iso3] = center;
    });

    Object.entries(GLOBE_ISO_CENTER_ALIASES).forEach(([iso, sourceIso]) => {
      if (!this.countryCentroids[iso] && this.countryCentroids[sourceIso]) {
        this.countryCentroids[iso] = { ...this.countryCentroids[sourceIso] };
      }
      if (!this.countryFeatures[iso] && this.countryFeatures[sourceIso]) {
        this.countryFeatures[iso] = this.countryFeatures[sourceIso];
      }
    });

    Object.entries(GLOBE_FALLBACK_CENTERS).forEach(([iso, center]) => {
      if (!this.countryCentroids[iso]) {
        this.countryCentroids[iso] = center;
      }
    });
  },

  getISOForCountryFeature(feature) {
    const rawId = feature?.id;
    const idCandidates = rawId === undefined || rawId === null
      ? []
      : [String(rawId), String(rawId).padStart(3, '0')];

    for (const id of idCandidates) {
      const iso3 = Scene1.getISO3FromNumericId(id);
      if (iso3) return iso3;
    }

    const countryName = this.normalizeCountryName(feature?.properties?.name);
    return this.countryNameToISO.get(countryName) || null;
  },

  normalizeCountryName(name = '') {
    const key = baseNormalize(name);
    return GLOBE_COUNTRY_NAME_ALIASES[key] || key;
  },

  getInternalCountryCenter(feature) {
    const [lng, lat] = d3.geoCentroid(feature);
    const centroid = { lat, lng: this.normalizeLongitude(lng) };

    if (this.isPositionInFeature(centroid, feature)) {
      return centroid;
    }

    const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature);
    let best = null;
    let bestDistance = Infinity;
    const steps = 18;

    for (let x = 0; x <= steps; x++) {
      for (let y = 0; y <= steps; y++) {
        const candidate = {
          lng: this.interpolateLongitude(minLng, maxLng, x / steps),
          lat: minLat + (maxLat - minLat) * (y / steps)
        };

        if (!this.isPositionInFeature(candidate, feature)) continue;

        const distance = Math.hypot(
          this.longitudeDelta(candidate.lng, centroid.lng),
          candidate.lat - centroid.lat
        );

        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
    }

    return best;
  },

  isPositionInFeature(position, feature) {
    return !!feature &&
      Number.isFinite(position?.lat) &&
      Number.isFinite(position?.lng) &&
      d3.geoContains(feature, [position.lng, position.lat]);
  },

  interpolateLongitude(start, end, amount) {
    const delta = this.longitudeDelta(end, start);
    return this.normalizeLongitude(start + delta * amount);
  },

  longitudeDelta(end, start) {
    let delta = end - start;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return delta;
  },

  updateGlobePoints() {
    const markers = this.buildCountryBubbleMarkers();

    this.globe
      .pointsData([])
      .htmlElementsData(markers)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.018)
      .htmlElement(d => this.createCountryBubbleElement(d));

    requestAnimationFrame(() => this.updateMarkerVisibility());
  },

  initBubbleDetailDismissal() {
    if (this._bubbleDetailDismissalInited) return;
    this._bubbleDetailDismissalInited = true;

    document.addEventListener('click', event => {
      if (event.target.closest('.globe-country-bubble')) return;
      this.hideBubbleDetail();
    });

    window.addEventListener('resize', () => this.hideBubbleDetail());
  },

  buildCountryBubbleMarkers() {
    if (!isRealDataLoaded() || !this.selectedType) return [];

    const events = getFilteredEvents(this.getActiveFilters());
    const eventsByCountry = d3.group(events, d => this.canonicalIso(d.iso));

    const countryGroups = Array.from(eventsByCountry, ([iso, countryEvents]) => ({
      iso,
      events: countryEvents,
      center: this.getCountryCenter(iso)
    })).filter(group => group.center && group.events.length > 0);

    const counts = countryGroups.map(group => group.events.length);
    const sizeScaleLimit = this.getBubbleSizeScaleLimit(counts);
    // Use midnight-blue for "all", otherwise use the disaster type color
    const color = this.selectedType === 'all' ? '#1E3A8A' : getDisasterColor(this.selectedType);

    return countryGroups.map(({ iso, events: countryEvents, center }) => {
      const country = normalizeCountryName(COUNTRY_STATS[iso]?.country || countryEvents[0]?.country) || iso;
      const count = countryEvents.length;
      const deaths = d3.sum(countryEvents, d => d.deaths);

      return {
        id: iso,
        iso,
        country,
        count,
        deaths,
        type: this.selectedType,
        typeLabel: this.selectedType === 'all' ? 'All Disasters' : getDisasterTypeLabel(this.selectedType),
        color,
        size: this.getBubbleMarkerSize(count, sizeScaleLimit),
        lat: center.lat,
        lng: center.lng
      };
    });
  },

  getCountryCenter(iso) {
    if (!iso) return null;

    return this.countryCentroids[iso] ||
      this.countryCentroids[GLOBE_ISO_CENTER_ALIASES[iso]] ||
      GLOBE_FALLBACK_CENTERS[iso] ||
      null;
  },

  normalizeLongitude(lng) {
    let normalized = lng;
    while (normalized > 180) normalized -= 360;
    while (normalized < -180) normalized += 360;
    return normalized;
  },

  getBubbleSizeScaleLimit(counts) {
    const sorted = counts
      .filter(value => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    if (sorted.length === 0) return 1;

    const index = Math.floor((sorted.length - 1) * 0.95);
    return Math.max(1, sorted[index]);
  },

  getBubbleMarkerSize(count, scaleLimit) {
    const limit = Math.max(1, scaleLimit);
    const normalized = Math.min(count, limit);
    const scale = Math.sqrt(normalized / limit);
    return Math.round(5 + scale * 27);
  },

  createCountryBubbleElement(marker) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'globe-country-bubble';
    element.dataset.lat = marker.lat;
    element.dataset.lng = marker.lng;
    element.style.setProperty('--marker-size', `${marker.size}px`);
    element.style.setProperty('--marker-color', marker.color);
    element.style.setProperty('--angle-opacity', '1');
    element.setAttribute('aria-label', `${marker.country}: ${formatNumber(marker.count)} ${marker.typeLabel} events`);

    element.addEventListener('click', event => {
      event.stopPropagation();
      this.showBubbleDetail(marker, event);
    });

    return element;
  },

  updateMarkerVisibility() {
    if (!this.globe) return;

    const camera = this.globe.camera?.();
    if (!camera) return;

    const camPos = camera.position;
    const camLen = Math.hypot(camPos.x, camPos.y, camPos.z);
    if (camLen === 0) return;

    const camX = camPos.x / camLen;
    const camY = camPos.y / camLen;
    const camZ = camPos.z / camLen;

    const fadeStart = 0;
    const fadeEnd = 0.35;
    const elements = document.querySelectorAll('.globe-country-bubble');

    elements.forEach(el => {
      const lat = parseFloat(el.dataset.lat);
      const lng = parseFloat(el.dataset.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = this.globe.getCoords(lat, lng, 0);
      const len = Math.hypot(pos.x, pos.y, pos.z);
      if (len === 0) return;

      const dot = (pos.x * camX + pos.y * camY + pos.z * camZ) / len;

      let opacity;
      if (dot <= fadeStart) opacity = 0;
      else if (dot >= fadeEnd) opacity = 1;
      else opacity = (dot - fadeStart) / (fadeEnd - fadeStart);

      el.style.setProperty('--angle-opacity', opacity.toFixed(3));
      el.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
    });
  },

  showBubbleDetail(marker, event) {
    const tooltip = document.getElementById('globeTooltip');
    if (!tooltip) return;

    tooltip.classList.remove('hidden');
    this.positionBubbleDetail(tooltip, event.clientX, event.clientY);
  },

  hideBubbleDetail() {
    document.getElementById('globeTooltip')?.classList.add('hidden');
  },

  positionBubbleDetail(tooltip, x, y) {
    const margin = 14;
    const offset = 14;
    const rect = tooltip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - rect.width - margin, Math.max(margin, x + offset));
    const top = Math.min(window.innerHeight - rect.height - margin, Math.max(margin, y + offset));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  },

  escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  },

  updateEventCount() {
    if (!this.eventCount) return;

    if (!isRealDataLoaded()) {
      this.eventCount.textContent = '0';
      this.dataStatus?.classList.remove('hidden');
      if (this.dataStatus) {
        this.dataStatus.textContent = 'CSV not loaded. Run the page through a local server.';
      }
      return;
    }

    this.dataStatus?.classList.add('hidden');
    this.eventCount.textContent = getFilteredEventCount(this.getActiveFilters()).toLocaleString('en-US');
  },

  handleCountryClick(iso) {
    window.location.href = `country_timeline.html?iso=${iso}`;
  },

  togglePlayAnimation() {
    if (this.isPlaying) {
      this.stopAnimation();
    } else {
      this.startAnimation();
    }
  },

  startAnimation() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.playButton?.classList.add('playing');
    this.playButton?.setAttribute('aria-label', 'Pause timeline animation');

    // Always restart the sweep from 1975 so Play replays the full animation.
    this.currentYearRange = [1975, 1975];
    this.yearStartSlider.value = 1975;
    this.yearEndSlider.value = 1975;
    this.updateYearRangeUI();
    this.updateEventCount();
    this.updateVisualization();

    // Use slower speed for bubble chart, normal speed for globe
    const speed = this.bubbleChartVisible ? this.animationSpeed * 2 : this.animationSpeed;

    this.animationInterval = setInterval(() => {
      const currentYear = this.currentYearRange[1];

      if (currentYear >= 2025) {
        this.stopAnimation();
        return;
      }

      const nextYear = currentYear + 1;
      this.currentYearRange = [1975, nextYear];
      this.yearStartSlider.value = 1975;
      this.yearEndSlider.value = nextYear;
      this.updateYearRangeUI();
      this.updateEventCount();
      this.updateVisualization();
    }, speed);
  },

  stopAnimation() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.playButton?.classList.remove('playing');
    this.playButton?.setAttribute('aria-label', 'Play timeline animation');

    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  },

  // Bubble Chart Methods

  toggleBubbleChart() {
    if (this.bubbleChartVisible) {
      this.closeBubbleChart();
    } else {
      this.openBubbleChart();
    }
  },

  openBubbleChart() {
    this.bubbleChartVisible = true;

    // Update button state
    this.bubbleChartButton?.classList.add('active');
    const buttonText = this.bubbleChartButton?.querySelector('.bubble-chart-text');
    if (buttonText) {
      buttonText.textContent = 'Return to the globe';
    }

    // Capture globe marker positions before transition
    this.captureGlobeMarkerPositions();

    // Show bubble chart container
    this.bubbleChartContainer?.classList.remove('hidden');

    // Initialize bubble chart
    this.initBubbleChart();

    // Start transition: fade out globe, fade in bubbles
    requestAnimationFrame(() => {
      const globeContainer = document.getElementById('globeContainer');
      globeContainer?.classList.add('hide-for-bubbles');

      // Show bubbles after a brief delay
      setTimeout(() => {
        this.bubbleChartContainer?.classList.add('visible');
        this.updateBubbleChart();
      }, 300);
    });
  },

  captureGlobeMarkerPositions() {
    this.globeMarkerPositions = new Map();

    // Get the HTML elements data from the globe
    const htmlElements = this.globe?.htmlElementsData?.() || [];

    // Get all visible globe country bubbles
    const bubbles = document.querySelectorAll('.globe-country-bubble');
    const bubbleArray = Array.from(bubbles);

    // Match bubbles with their data by index
    htmlElements.forEach((marker, index) => {
      if (marker.iso && bubbleArray[index]) {
        const rect = bubbleArray[index].getBoundingClientRect();
        const opacity = parseFloat(bubbleArray[index].style.getPropertyValue('--angle-opacity') || '1');

        // Only capture visible bubbles
        if (opacity > 0.1) {
          this.globeMarkerPositions.set(marker.iso, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            size: parseFloat(bubbleArray[index].style.getPropertyValue('--marker-size') || marker.size)
          });
        }
      }
    });
  },

  closeBubbleChart() {
    this.bubbleChartVisible = false;
    this.bubbleChartContainer?.classList.remove('visible');

    // Update button state
    this.bubbleChartButton?.classList.remove('active');
    const buttonText = this.bubbleChartButton?.querySelector('.bubble-chart-text');
    if (buttonText) {
      buttonText.textContent = 'Open bubble chart';
    }

    // Fade in globe
    setTimeout(() => {
      const globeContainer = document.getElementById('globeContainer');
      globeContainer?.classList.remove('hide-for-bubbles');
    }, 200);

    // Clean up after transition
    setTimeout(() => {
      this.bubbleChartContainer?.classList.add('hidden');
      this.cleanupBubbleChart();
    }, 800);
  },

  initBubbleChart() {
    if (this.bubbleChartSvg) return;

    const svg = d3.select('#bubbleChartSvg');
    this.bubbleChartSvg = svg;

    // Clear any existing content
    svg.selectAll('*').remove();

    // Create main group for bubbles
    const bubblesGroup = svg.append('g').attr('class', 'bubbles-group');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3]) // Allow zoom out to 30% and zoom in to 300%
      .on('zoom', (event) => {
        bubblesGroup.attr('transform', event.transform);
      });

    // Apply zoom to SVG
    svg.call(zoom);

    // Store zoom behavior for later use
    this.bubbleZoom = zoom;
  },

  cleanupBubbleChart() {
    if (this.bubbleSimulation) {
      this.bubbleSimulation.stop();
      this.bubbleSimulation = null;
    }

    if (this.bubbleChartSvg) {
      this.bubbleChartSvg.selectAll('*').remove();
      this.bubbleChartSvg = null;
    }
  },

  getBubbleChartData() {
    if (!isRealDataLoaded()) return [];

    const events = getFilteredEvents(this.getActiveFilters());
    const eventsByCountry = d3.group(events, d => this.canonicalIso(d.iso));

    // Calculate total disasters per country
    const countryData = Array.from(eventsByCountry, ([iso, countryEvents]) => {
      const stats = COUNTRY_STATS[iso];
      if (!stats) return null;

      return {
        iso,
        country: normalizeCountryName(stats.country),
        count: countryEvents.length,
        deaths: d3.sum(countryEvents, d => d.deaths),
        damage: d3.sum(countryEvents, d => d.damage)
      };
    }).filter(d => d !== null);

    // Sort by count and take top 35 countries
    return countryData
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  },

  updateBubbleChart() {
    if (!this.bubbleChartSvg) return;

    const data = this.getBubbleChartData();
    if (data.length === 0) return;

    const container = document.getElementById('bubbleChartContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update SVG dimensions
    this.bubbleChartSvg
      .attr('width', width)
      .attr('height', height);

    // Calculate bubble sizes
    const maxCount = d3.max(data, d => d.count);
    const minCount = d3.min(data, d => d.count);

    // Size scale: ensure bubbles are large enough for country names
    const maxRadius = Math.min(width, height) * 0.10; // Slightly larger for better readability
    const minRadius = 28; // Minimum 28px radius to fit country names

    const radiusScale = d3.scaleSqrt()
      .domain([minCount, maxCount])
      .range([minRadius, maxRadius]);

    // Color scale: use the same color as globe circles with gradient and transparency
    let baseColor = getDisasterColor('all'); // Default for "all"

    if (this.selectedType && this.selectedType !== 'all') {
      baseColor = getDisasterColor(this.selectedType);
    }

    // Create gradient from light to dark version of the base color
    const lightColor = this.lightenColor(baseColor, 0.4);
    const darkColor = this.darkenColor(baseColor, 0.5);

    // Convert hex to rgba with transparency
    const hexToRgba = (hex, alpha) => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const colorScale = d3.scaleLinear()
      .domain([minCount, maxCount])
      .range([hexToRgba(lightColor, 0.95), hexToRgba(darkColor, 0.95)])
      .interpolate(d3.interpolateRgb);

    // Get existing nodes to preserve positions, or use globe positions
    const bubblesGroup = this.bubbleChartSvg.select('.bubbles-group');
    const existingNodes = new Map();
    bubblesGroup.selectAll('.bubble-node').each(function(d) {
      if (d && d.iso) {
        existingNodes.set(d.iso, { x: d.x, y: d.y });
      }
    });

    // Prepare node data
    const nodes = data.map(d => {
      const existing = existingNodes.get(d.iso);
      const globePos = this.globeMarkerPositions?.get(d.iso);

      let startX, startY;
      if (existing) {
        // Use existing position for smooth updates
        startX = existing.x;
        startY = existing.y;
      } else if (globePos) {
        // Use globe marker position for initial transformation
        startX = globePos.x;
        startY = globePos.y;
      } else {
        // Random position near center
        startX = width / 2 + (Math.random() - 0.5) * width * 0.5;
        startY = height / 2 + (Math.random() - 0.5) * height * 0.5;
      }

      return {
        ...d,
        radius: radiusScale(d.count),
        color: colorScale(d.count),
        x: startX,
        y: startY
      };
    });

    // Create or update force simulation
    if (this.bubbleSimulation) {
      this.bubbleSimulation.nodes(nodes);
      this.bubbleSimulation.force('collision', d3.forceCollide().radius(d => d.radius + 4).strength(0.9));
      this.bubbleSimulation.alpha(0.6).restart();
    } else {
      this.bubbleSimulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(2))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(d => d.radius + 4).strength(0.9))
        .force('x', d3.forceX(width / 2).strength(0.05))
        .force('y', d3.forceY(height / 2).strength(0.05))
        .alphaDecay(0.015)
        .velocityDecay(0.3);
    }

    // Bind data
    const bubbleNodes = bubblesGroup.selectAll('.bubble-node')
      .data(nodes, d => d.iso);

    // Exit
    bubbleNodes.exit()
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .remove();

    // Enter
    const bubbleEnter = bubbleNodes.enter()
      .append('g')
      .attr('class', 'bubble-node')
      .attr('opacity', 0)
      .on('click', (event, d) => this.handleCountryClick(d.iso));

    bubbleEnter.append('circle');
    bubbleEnter.append('text').attr('class', 'bubble-label');

    // Merge enter + update
    const bubbleMerge = bubbleEnter.merge(bubbleNodes);

    // Fade in new bubbles
    bubbleMerge.transition().duration(600).attr('opacity', 1);

    // Update circles with smooth transitions
    bubbleMerge.select('circle')
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attr('r', d => d.radius)
      .attr('fill', d => d.color);

    // Update labels - show all country names with wrapping for long names
    bubbleMerge.select('.bubble-label')
      .each(function(d) {
        const label = d3.select(this);
        label.selectAll('*').remove(); // Clear existing tspans

        // Calculate optimal font size
        const charWidth = 0.6;
        const maxFontSize = 16;
        const minFontSize = 10;
        const availableWidth = d.radius * 1.8;
        let fontSize = availableWidth / (d.country.length * charWidth);
        fontSize = Math.min(maxFontSize, Math.max(minFontSize, fontSize));

        label.attr('font-size', fontSize);

        // Wrap text if needed
        const words = d.country.split(' ');
        const maxLineWidth = d.radius * 1.8;
        const lines = [];
        let currentLine = [];

        words.forEach(word => {
          const testLine = [...currentLine, word].join(' ');
          const testWidth = testLine.length * fontSize * charWidth;

          if (testWidth < maxLineWidth) {
            currentLine.push(word);
          } else {
            if (currentLine.length > 0) {
              lines.push(currentLine.join(' '));
              currentLine = [word];
            } else {
              // Word too long, add it anyway
              lines.push(word);
            }
          }
        });
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }

        // Create tspans for each line
        const lineHeight = 1.1;
        const totalHeight = lines.length * fontSize * lineHeight;
        const startY = -(totalHeight / 2) + (fontSize * lineHeight / 2);

        lines.forEach((line, i) => {
          label.append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? startY : fontSize * lineHeight)
            .text(line);
        });
      })
      .attr('opacity', 1)
      .transition()
      .duration(500);

    // Apply simulation tick
    this.bubbleSimulation.on('tick', () => {
      bubbleMerge.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  },

  // Color manipulation helpers
  lightenColor(color, amount) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Lighten by moving towards white
    const newR = Math.min(255, Math.round(r + (255 - r) * amount));
    const newG = Math.min(255, Math.round(g + (255 - g) * amount));
    const newB = Math.min(255, Math.round(b + (255 - b) * amount));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  },

  darkenColor(color, amount) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Darken by moving towards black
    const newR = Math.max(0, Math.round(r * (1 - amount)));
    const newG = Math.max(0, Math.round(g * (1 - amount)));
    const newB = Math.max(0, Math.round(b * (1 - amount)));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  },

  // Zoom control methods
  zoomIn() {
    if (!this.bubbleChartSvg || !this.bubbleZoom) return;

    this.bubbleChartSvg
      .transition()
      .duration(300)
      .call(this.bubbleZoom.scaleBy, 1.3);
  },

  zoomOut() {
    if (!this.bubbleChartSvg || !this.bubbleZoom) return;

    this.bubbleChartSvg
      .transition()
      .duration(300)
      .call(this.bubbleZoom.scaleBy, 0.77);
  },

  zoomReset() {
    if (!this.bubbleChartSvg || !this.bubbleZoom) return;

    this.bubbleChartSvg
      .transition()
      .duration(500)
      .call(this.bubbleZoom.transform, d3.zoomIdentity);
  }
};
