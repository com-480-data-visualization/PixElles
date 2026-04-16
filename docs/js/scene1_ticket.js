/* ============================================
   SCENE 1: MUSEUM ENTRANCE + TICKET
   ============================================ */

const Scene1 = {
  worldData: null,

  async init() {
    console.log('Initializing Scene 1: Ticket');

    try {
      this.worldData = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      this.renderTicketMap();
    } catch (error) {
      console.error('Failed to load world map:', error);
    }

    this.attachTicketClickHandler();
  },

  renderTicketMap() {
    const container = document.getElementById('ticketMiniMap');
    const width = 280;
    const height = 140;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const projection = d3.geoNaturalEarth1()
      .fitSize([width, height], topojson.feature(this.worldData, this.worldData.objects.countries));

    const path = d3.geoPath().projection(projection);

    const countries = topojson.feature(this.worldData, this.worldData.objects.countries);

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#e8e6d8');

    svg.append('g')
      .selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', d => {
        // Get country ISO code from the topology
        const countryId = d.id;
        const iso3 = this.getISO3FromNumericId(countryId);

        if (iso3 && COUNTRY_DOMINANT[iso3]) {
          return COUNTRY_DOMINANT[iso3].color;
        }
        return '#d4d2c0'; // Light grey for no data
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9);
  },

  getISO3FromNumericId(numericId) {
    // Map numeric IDs to ISO3 codes for major countries
    const idToISO = {
      '156': 'CHN', // China
      '840': 'USA', // United States
      '356': 'IND', // India
      '360': 'IDN', // Indonesia
      '608': 'PHL', // Philippines
      '392': 'JPN', // Japan
      '050': 'BGD', // Bangladesh
      '586': 'PAK', // Pakistan
      '076': 'BRA', // Brazil
      '484': 'MEX', // Mexico
      '036': 'AUS', // Australia
      '276': 'DEU', // Germany
      '250': 'FRA', // France
      '826': 'GBR', // United Kingdom
      '724': 'ESP', // Spain
      '380': 'ITA', // Italy
      '792': 'TUR', // Turkey
      '364': 'IRN', // Iran
      '231': 'ETH', // Ethiopia
      '404': 'KEN', // Kenya
      '566': 'NGA', // Nigeria
      '710': 'ZAF', // South Africa
      '704': 'VNM', // Vietnam
      '764': 'THA', // Thailand
      '004': 'AFG', // Afghanistan
      '524': 'NPL', // Nepal
      '104': 'MMR', // Myanmar
      '332': 'HTI', // Haiti
      '440': 'LTU', // Lithuania
      '112': 'BLR', // Belarus
      '643': 'RUS', // Russia
      '124': 'CAN', // Canada
      '032': 'ARG', // Argentina
      '152': 'CHL', // Chile
      '170': 'COL', // Colombia
      '604': 'PER', // Peru
      '858': 'URY', // Uruguay
      '862': 'VEN', // Venezuela
      '012': 'DZA', // Algeria
      '818': 'EGY', // Egypt
      '434': 'LBY', // Libya
      '504': 'MAR', // Morocco
      '788': 'TUN', // Tunisia
      '426': 'LSO', // Lesotho
      '508': 'MOZ', // Mozambique
      '834': 'TZA', // Tanzania
      '800': 'UGA', // Uganda
      '894': 'ZMB', // Zambia
      '716': 'ZWE', // Zimbabwe
      '024': 'AGO', // Angola
      '120': 'CMR', // Cameroon
      '148': 'TCD', // Chad
      '178': 'COG', // Congo
      '180': 'COD', // DR Congo
      '266': 'GAB', // Gabon
      '288': 'GHN', // Ghana
      '384': 'CIV', // Ivory Coast
      '466': 'MLI', // Mali
      '478': 'MRT', // Mauritania
      '562': 'NER', // Niger
      '686': 'SEN', // Senegal
      '694': 'SLE', // Sierra Leone
      '729': 'SDN', // Sudan
      '728': 'SSD'  // South Sudan
    };

    return idToISO[numericId];
  },

  attachTicketClickHandler() {
    const ticket = document.getElementById('museumTicket');

    ticket.addEventListener('click', () => {
      console.log('Ticket clicked - transitioning to globe scene');

      // Zoom animation
      ticket.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      ticket.style.transform = 'scale(8)';
      ticket.style.opacity = '0';

      // Navigate to globe scene after animation
      setTimeout(() => {
        App.showScene('scene-globe');

        // Reset ticket for next time
        setTimeout(() => {
          ticket.style.transition = 'none';
          ticket.style.transform = '';
          ticket.style.opacity = '1';
          setTimeout(() => {
            ticket.style.transition = '';
          }, 50);
        }, 100);
      }, 600);
    });
  }
};
