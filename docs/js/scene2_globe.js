/* ============================================
   SCENE 2: 3D GLOBE
   ============================================ */

const Scene2 = {
  _inited: false,
  globe: null,
  worldData: null,
  currentYearRange: [1975, 2025],
  currentCountryData: {},
  debounceTimeout: null,
  disasterTypes: [],

  async init() {
    console.log('Initializing Scene 2: 3D Globe');
    this.disasterTypes = getAvailableDisasterTypes();
    this.selectedTypes = new Set(this.disasterTypes.map(({ type }) => type));

    this.initFilters();
    this.initGlobe();

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

    this.globe.controls().autoRotate = true;
    this.globe.controls().autoRotateSpeed = 0.5;

    const resizeGlobe = () => {
      this.globe.width(container.clientWidth);
      this.globe.height(container.clientHeight);
    };

    resizeGlobe();
    window.addEventListener('resize', resizeGlobe);
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

      this.toggleType(button.getAttribute('data-type'));
    });

    document.getElementById('unselectAllFilters')?.addEventListener('click', () => {
      this.selectedTypes.clear();
      this.updateSelectedTypeButtons();
      this.updateEventCount();
      this.debounceUpdate();
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
      button.className = 'chip active';
      button.type = 'button';
      button.dataset.type = type;
      button.style.setProperty('--c', color);
      button.setAttribute('aria-pressed', 'true');
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

  toggleType(type) {
    if (!type) return;

    if (this.selectedTypes.has(type)) {
      this.selectedTypes.delete(type);
    } else {
      this.selectedTypes.add(type);
    }

    this.updateSelectedTypeButtons();
    this.updateEventCount();
    this.debounceUpdate();
  },

  updateSelectedTypeButtons() {
    this.refreshTypeButtons();

    this.typeButtons.forEach(button => {
      const isSelected = this.selectedTypes.has(button.getAttribute('data-type'));
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
      types: Array.from(this.selectedTypes)
    };
  },

  refreshCurrentCountryData() {
    this.currentCountryData = getFilteredCountryData(this.getActiveFilters());
  },

  getCountryColor(country) {
    const iso3 = Scene1.getISO3FromNumericId(country.id);
    const filteredStats = iso3 ? this.currentCountryData[iso3] : null;

    if (filteredStats && filteredStats.count > 0) {
      return getDisasterColor(filteredStats.dominantType);
    }

    return 'rgba(100,100,100,0.28)';
  },

  getCountryLabel(country) {
    const iso3 = Scene1.getISO3FromNumericId(country.id);
    if (!iso3 || !COUNTRY_STATS[iso3]) return '';

    const stats = COUNTRY_STATS[iso3];
    const filteredStats = this.currentCountryData[iso3];
    const count = filteredStats?.count || 0;
    const deaths = filteredStats?.deaths || 0;
    const dominantType = filteredStats?.dominantType
      ? filteredStats.dominantType.replace(/_/g, ' ')
      : 'No matching type';

    return `
      <div style="background: rgba(13,17,23,0.95); padding: 12px; border-radius: 8px; border: 1px solid rgba(151,174,196,0.35);">
        <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: #97AEC4; margin-bottom: 4px;">
          ${stats.country}
        </div>
        <div style="font-size: 0.85rem; color: #fff;">
          ${formatNumber(count)} matching events · ${formatNumber(deaths)} deaths
        </div>
        <div style="font-size: 0.75rem; color: #97AEC4; margin-top: 4px; text-transform: capitalize;">
          ${dominantType}
        </div>
      </div>
    `;
  },

  updateVisualization() {
    this.refreshCurrentCountryData();
    this.updateEventCount();

    if (!this.globe || !this.worldData) return;

    this.updateGlobePolygons();
  },

  updateGlobePolygons() {
    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);

    this.globe
      .polygonsData(countries.features)
      .polygonAltitude(0.01)
      .polygonCapColor(d => this.getCountryColor(d))
      .polygonSideColor(() => 'rgba(0,0,0,0.1)')
      .polygonStrokeColor(() => '#111')
      .polygonLabel(d => this.getCountryLabel(d))
      .onPolygonClick(d => {
        const iso3 = Scene1.getISO3FromNumericId(d.id);
        if (iso3 && COUNTRY_STATS[iso3]) {
          this.handleCountryClick(iso3);
        }
      })
      .onPolygonHover(d => {
        const container = document.getElementById('globeContainer');
        if (container) container.style.cursor = d ? 'pointer' : 'default';
      });
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
    console.log('Country clicked:', iso);
    Scene3.open(iso);
  }
};
