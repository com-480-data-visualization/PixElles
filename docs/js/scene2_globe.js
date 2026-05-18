/* ============================================
   SCENE 2: 3D GLOBE
   ============================================ */

const GLOBE_COUNTRY_NAME_ALIASES = {
  'bolivia plurinational state of': 'bolivia',
  'bosnia and herz': 'bosnia and herzegovina',
  'brunei darussalam': 'brunei',
  'cape verde': 'cabo verde',
  'central african rep': 'central african republic',
  'czech republic': 'czechia',
  'dem rep congo': 'democratic republic of the congo',
  'dominican rep': 'dominican republic',
  'eq guinea': 'equatorial guinea',
  'iran islamic republic of': 'iran',
  'ivory coast': 'cote d ivoire',
  'lao peoples democratic republic': 'laos',
  'macedonia': 'north macedonia',
  'micronesia federated states of': 'micronesia',
  'moldova': 'republic of moldova',
  'netherlands kingdom of the': 'netherlands',
  'north korea': 'democratic peoples republic of korea',
  'republic of congo': 'congo',
  'republic of korea': 'south korea',
  'russian federation': 'russia',
  's korea': 'south korea',
  's sudan': 'south sudan',
  'solomon is': 'solomon islands',
  'state of palestine': 'palestine',
  'swaziland': 'eswatini',
  'syrian arab republic': 'syria',
  'tanzania': 'united republic of tanzania',
  'turkiye': 'turkey',
  'united kingdom of great britain and northern ireland': 'united kingdom',
  'venezuela bolivarian republic of': 'venezuela',
  'viet nam': 'vietnam'
};

const GLOBE_ISO_CENTER_ALIASES = {
  CSK: 'CZE',
  DDR: 'DEU',
  DFR: 'DEU',
  SCG: 'SRB',
  SUN: 'RUS',
  YMD: 'YEM',
  YMN: 'YEM',
  YUG: 'SRB'
};

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
      .atmosphereColor('#4b7bff')
      .atmosphereAltitude(0.15);

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
    window.addEventListener('resize', resizeGlobe);

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
    this.refreshTypeButtons();

    this.yearStartSlider?.addEventListener('input', () => this.handleYearRangeInput('start'));
    this.yearStartSlider?.addEventListener('change', () => this.handleYearRangeInput('start'));
    this.yearEndSlider?.addEventListener('input', () => this.handleYearRangeInput('end'));
    this.yearEndSlider?.addEventListener('change', () => this.handleYearRangeInput('end'));

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
    if (!type || type === this.selectedType) return;

    this.selectedType = type;
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
      types: this.selectedType ? [this.selectedType] : []
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
    return GLOBE_ISO_CENTER_ALIASES[iso] || iso;
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
    const displayName = country?.properties?.name || stats.country;

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
    const normalized = String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return GLOBE_COUNTRY_NAME_ALIASES[normalized] || normalized;
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
    const color = getDisasterColor(this.selectedType);

    return countryGroups.map(({ iso, events: countryEvents, center }) => {
      const country = COUNTRY_STATS[iso]?.country || countryEvents[0]?.country || iso;
      const count = countryEvents.length;
      const deaths = d3.sum(countryEvents, d => d.deaths);

      return {
        id: iso,
        iso,
        country,
        count,
        deaths,
        type: this.selectedType,
        typeLabel: getDisasterTypeLabel(this.selectedType),
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
  }
};
