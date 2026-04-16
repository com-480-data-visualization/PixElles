/* ============================================
   SCENE 2: 3D GLOBE
   ============================================ */

const Scene2 = {
  _inited: false,
  globe: null,
  currentYear: 2000,
  currentType: 'all',

  async init() {
    console.log('Initializing Scene 2: 3D Globe');

    try {
      this.worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    } catch (error) {
      console.error('Failed to load world map:', error);
      return;
    }

    this.initGlobe();

    this.initFilters();

    this.initLegend();
  },

  initGlobe() {
    const container = document.getElementById('globeContainer');

    this.globe = Globe()
      (container)
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .showAtmosphere(true)
      .atmosphereColor('#4b7bff')
      .atmosphereAltitude(0.15);

    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);

    this.globe
      .polygonsData(countries.features)
      .polygonAltitude(0.01)
      .polygonCapColor(d => {
        const countryId = d.id;
        const iso3 = Scene1.getISO3FromNumericId(countryId);

        if (iso3 && COUNTRY_DOMINANT[iso3]) {
          if (this.currentType === 'all') {
            return COUNTRY_DOMINANT[iso3].color;
          } else {
            const filteredData = getFilteredCountryData(
              this.currentYear === 2000 ? null : this.currentYear,
              this.currentType
            );

            if (filteredData[iso3] && filteredData[iso3].count > 0) {
              return getDisasterColor(this.currentType);
            }
          }
        }
        return 'rgba(100,100,100,0.3)';
      })
      .polygonSideColor(() => 'rgba(0,0,0,0.1)')
      .polygonStrokeColor(() => '#111')
      .polygonLabel(d => {
        const iso3 = Scene1.getISO3FromNumericId(d.id);
        if (iso3 && COUNTRY_STATS[iso3]) {
          const stats = COUNTRY_STATS[iso3];
          return `
            <div style="background: rgba(13,17,23,0.95); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,213,79,0.3);">
              <div style="font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; color: #ffd54f; margin-bottom: 4px;">
                ${stats.country}
              </div>
              <div style="font-size: 0.85rem; color: #9e9e9e;">
                ${stats.totalEvents} events · ${formatNumber(stats.totalDeaths)} deaths
              </div>
              <div style="font-size: 0.75rem; color: #555; margin-top: 4px;">
                Click to explore timeline →
              </div>
            </div>
          `;
        }
        return '';
      })
      .onPolygonClick(d => {
        const iso3 = Scene1.getISO3FromNumericId(d.id);
        if (iso3 && COUNTRY_STATS[iso3]) {
          this.handleCountryClick(iso3);
        }
      })
      .onPolygonHover(d => {
        container.style.cursor = d ? 'pointer' : 'default';
      });

    this.globe.pointOfView({ altitude: 2.5 });

    this.globe.controls().autoRotate = true;
    this.globe.controls().autoRotateSpeed = 0.5;

    window.addEventListener('resize', () => {
      this.globe.width(container.clientWidth);
      this.globe.height(container.clientHeight);
    });
  },

  initFilters() {
    const typeChips = document.querySelectorAll('#typeFilter .chip');
    typeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        typeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentType = chip.getAttribute('data-type');
        this.updateVisualization();
      });
    });

    const yearSlider = document.getElementById('yearSlider');
    const yearVal = document.getElementById('yearVal');
    yearSlider.addEventListener('input', (e) => {
      this.currentYear = +e.target.value;
      yearVal.textContent = this.currentYear;
      this.debounceUpdate();
    });
  },

  debounceTimeout: null,
  debounceUpdate() {
    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => {
      this.updateVisualization();
    }, 150);
  },

  updateVisualization() {
    if (!this.globe) return;

    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);

    this.globe
      .polygonsData(countries.features)
      .polygonCapColor(d => {
        const countryId = d.id;
        const iso3 = Scene1.getISO3FromNumericId(countryId);

        if (iso3 && COUNTRY_DOMINANT[iso3]) {
          if (this.currentType === 'all') {
            return COUNTRY_DOMINANT[iso3].color;
          } else {
            const filteredData = getFilteredCountryData(
              this.currentYear === 2000 ? null : this.currentYear,
              this.currentType
            );

            if (filteredData[iso3] && filteredData[iso3].count > 0) {
              return getDisasterColor(this.currentType);
            }
          }
        }
        return 'rgba(100,100,100,0.3)';
      });
  },

  initLegend() {
    const legend = document.getElementById('globeLegend');
    const types = [
      { type: 'flood', label: 'Flood' },
      { type: 'storm', label: 'Storm' },
      { type: 'drought', label: 'Drought' },
      { type: 'wildfire', label: 'Wildfire' },
      { type: 'earthquake', label: 'Earthquake' },
      { type: 'volcano', label: 'Volcano' },
      { type: 'landslide', label: 'Landslide' }
    ];

    types.forEach(({ type, label }) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <div class="legend-dot" style="background: ${getDisasterColor(type)}"></div>
        <span>${label}</span>
      `;
      legend.appendChild(item);
    });
  },

  handleCountryClick(iso) {
    console.log('Country clicked:', iso);
    Scene3.open(iso);
  }
};
