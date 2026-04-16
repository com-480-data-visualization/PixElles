/* ============================================
   DATA MODULE - EM-DAT Dataset Processing
   ============================================ */

// Global data exports
let RAW_DATA = [];
let TYPOLOGY_DATA = [];
let MAP_DATA = {};
let COUNTRY_DOMINANT = {};
let COUNTRY_EVENTS = {};
let COUNTRY_STATS = {};
let SUMMARY_STATS = {};
let TOP_EVENTS = [];
let REGIONAL_DATA = [];

// Color mapping for disaster types
const DISASTER_COLORS = {
  flood: '#2196f3',
  storm: '#7c4dff',
  drought: '#ff6f00',
  wildfire: '#f44336',
  earthquake: '#795548',
  volcano: '#e64a19',
  landslide: '#6d4c41'
};

// Initialize data - load CSV or use fallback
async function initData(csvPath = 'data/emdat_clean.csv') {
  try {
    console.log('Loading EM-DAT dataset...');
    const raw = await d3.csv(csvPath);

    if (raw.length > 0) {
      console.log(`Loaded ${raw.length} EM-DAT records from CSV`);
      RAW_DATA = raw.map(d => ({
        year: +d.year,
        iso: d.iso,
        country: d.country,
        region: d.region || 'Unknown',
        subregion: d.subregion || 'Unknown',
        type: d.type,
        typeDetail: d.type_detail,
        name: d.name || 'Unnamed Event',
        deaths: +d.deaths || 0,
        affected: +d.affected || 0,
        damage: +d.damage_usd_thousands || 0,
        lat: +d.lat || null,
        lon: +d.lon || null
      }));

      processData();
      console.log('Data processing complete');
    }
  } catch(e) {
    console.warn('CSV not found, using simulated data:', e);
    createSimulatedData();
  }
}

// Process loaded data into required formats
function processData() {
  // 1. TYPOLOGY_DATA: Annual counts by type
  const yearlyTypes = d3.rollup(
    RAW_DATA,
    v => ({
      flood: v.filter(d => d.type === 'flood').length,
      storm: v.filter(d => d.type === 'storm').length,
      drought: v.filter(d => d.type === 'drought').length,
      wildfire: v.filter(d => d.type === 'wildfire').length,
      earthquake: v.filter(d => d.type === 'earthquake').length,
      volcano: v.filter(d => d.type === 'volcano').length,
      landslide: v.filter(d => d.type === 'landslide').length
    }),
    d => d.year
  );

  TYPOLOGY_DATA = Array.from(yearlyTypes, ([year, counts]) => ({
    year,
    ...counts
  })).sort((a, b) => a.year - b.year);

  // 2. COUNTRY_DOMINANT: Dominant disaster type per country
  const countryTypes = d3.rollup(
    RAW_DATA,
    v => d3.rollup(v, vv => vv.length, d => d.type),
    d => d.iso
  );

  COUNTRY_DOMINANT = {};
  countryTypes.forEach((types, iso) => {
    const sortedTypes = Array.from(types, ([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    if (sortedTypes.length > 0) {
      const dominant = sortedTypes[0].type;
      COUNTRY_DOMINANT[iso] = {
        type: dominant,
        color: DISASTER_COLORS[dominant] || '#666'
      };
    }
  });

  // 3. COUNTRY_EVENTS: All events per country
  const eventsByCountry = d3.group(RAW_DATA, d => d.iso);
  COUNTRY_EVENTS = {};
  eventsByCountry.forEach((events, iso) => {
    COUNTRY_EVENTS[iso] = events
      .sort((a, b) => a.year - b.year)
      .map(e => ({
        year: e.year,
        type: e.type,
        name: e.name,
        deaths: e.deaths,
        damage: e.damage
      }));
  });

  // 4. COUNTRY_STATS: Summary statistics per country
  const countryData = d3.rollup(
    RAW_DATA,
    v => {
      const typeCount = d3.rollup(v, vv => vv.length, d => d.type);
      const mostFrequent = Array.from(typeCount, ([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)[0];

      const deathsByYear = d3.rollup(v, vv => d3.sum(vv, d => d.deaths), d => d.year);
      const deadliestYear = Array.from(deathsByYear, ([year, deaths]) => ({ year, deaths }))
        .sort((a, b) => b.deaths - a.deaths)[0];

      return {
        totalEvents: v.length,
        totalDeaths: d3.sum(v, d => d.deaths),
        totalAffected: d3.sum(v, d => d.affected),
        totalDamage: d3.sum(v, d => d.damage),
        mostFrequentType: mostFrequent ? mostFrequent.type : 'unknown',
        worstYear: deadliestYear ? deadliestYear.year : null,
        country: v[0].country,
        region: v[0].region,
        typeBreakdown: Object.fromEntries(typeCount)
      };
    },
    d => d.iso
  );

  COUNTRY_STATS = Object.fromEntries(countryData);

  // 5. MAP_DATA: Country data by time period
  MAP_DATA = {
    '2000_2025': {}
  };

  Object.entries(COUNTRY_STATS).forEach(([iso, stats]) => {
    MAP_DATA['2000_2025'][iso] = {
      count: stats.totalEvents,
      deaths: stats.totalDeaths,
      damage: stats.totalDamage
    };
  });

  // 6. SUMMARY_STATS: Global summary
  SUMMARY_STATS = {
    totalEvents: RAW_DATA.length,
    totalDeaths: d3.sum(RAW_DATA, d => d.deaths),
    totalCountries: new Set(RAW_DATA.map(d => d.iso)).size,
    totalDamage: d3.sum(RAW_DATA, d => d.damage)
  };

  // 7. TOP_EVENTS: Top 10 deadliest events
  TOP_EVENTS = RAW_DATA
    .filter(d => d.deaths > 0)
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 10)
    .map(d => ({
      year: d.year,
      country: d.country,
      iso: d.iso,
      type: d.type,
      name: d.name,
      deaths: d.deaths
    }));

  // 8. REGIONAL_DATA: Data grouped by region
  const regionalGroups = d3.rollup(
    RAW_DATA,
    v => ({
      events: v.length,
      deaths: d3.sum(v, d => d.deaths),
      affected: d3.sum(v, d => d.affected),
      damage: d3.sum(v, d => d.damage)
    }),
    d => d.region
  );

  REGIONAL_DATA = Array.from(regionalGroups, ([region, stats]) => ({
    region,
    ...stats
  })).sort((a, b) => b.events - a.events);
}

// Create simulated data if CSV not available
function createSimulatedData() {

  TYPOLOGY_DATA = d3.range(2000, 2026).map(year => ({
    year,
    flood: Math.floor(Math.random() * 200 + 150),
    storm: Math.floor(Math.random() * 150 + 100),
    drought: Math.floor(Math.random() * 50 + 30),
    wildfire: Math.floor(Math.random() * 30 + 10),
    earthquake: Math.floor(Math.random() * 40 + 20),
    volcano: Math.floor(Math.random() * 10 + 2),
    landslide: Math.floor(Math.random() * 30 + 10)
  }));

  // Simulated dominant types for major countries
  const majorCountries = {
    'CHN': { name: 'China', type: 'flood', region: 'Asia' },
    'USA': { name: 'United States', type: 'storm', region: 'Americas' },
    'IND': { name: 'India', type: 'flood', region: 'Asia' },
    'IDN': { name: 'Indonesia', type: 'earthquake', region: 'Asia' },
    'PHL': { name: 'Philippines', type: 'storm', region: 'Asia' },
    'JPN': { name: 'Japan', type: 'earthquake', region: 'Asia' },
    'BGD': { name: 'Bangladesh', type: 'flood', region: 'Asia' },
    'PAK': { name: 'Pakistan', type: 'flood', region: 'Asia' },
    'BRA': { name: 'Brazil', type: 'flood', region: 'Americas' },
    'MEX': { name: 'Mexico', type: 'earthquake', region: 'Americas' },
    'AUS': { name: 'Australia', type: 'wildfire', region: 'Oceania' },
    'DEU': { name: 'Germany', type: 'flood', region: 'Europe' },
    'FRA': { name: 'France', type: 'storm', region: 'Europe' },
    'GBR': { name: 'United Kingdom', type: 'flood', region: 'Europe' },
    'ESP': { name: 'Spain', type: 'wildfire', region: 'Europe' },
    'ITA': { name: 'Italy', type: 'earthquake', region: 'Europe' },
    'TUR': { name: 'Turkey', type: 'earthquake', region: 'Asia' },
    'IRN': { name: 'Iran', type: 'earthquake', region: 'Asia' },
    'ETH': { name: 'Ethiopia', type: 'drought', region: 'Africa' },
    'KEN': { name: 'Kenya', type: 'drought', region: 'Africa' },
    'NGA': { name: 'Nigeria', type: 'flood', region: 'Africa' },
    'ZAF': { name: 'South Africa', type: 'drought', region: 'Africa' },
    'VNM': { name: 'Vietnam', type: 'storm', region: 'Asia' },
    'THA': { name: 'Thailand', type: 'flood', region: 'Asia' },
    'AFG': { name: 'Afghanistan', type: 'earthquake', region: 'Asia' }
  };

  COUNTRY_DOMINANT = {};
  Object.entries(majorCountries).forEach(([iso, info]) => {
    COUNTRY_DOMINANT[iso] = {
      type: info.type,
      color: DISASTER_COLORS[info.type]
    };
  });

  // Simulated country events
  COUNTRY_EVENTS = {
    'JPN': [
      { year: 2004, type: 'earthquake', name: 'Chuetsu Earthquake', deaths: 68, damage: 28000 },
      { year: 2011, type: 'earthquake', name: 'Tohoku Earthquake & Tsunami', deaths: 19747, damage: 235000 },
      { year: 2016, type: 'earthquake', name: 'Kumamoto Earthquake', deaths: 273, damage: 25000 },
      { year: 2018, type: 'flood', name: 'Japan Floods', deaths: 237, damage: 9500 }
    ],
    'USA': [
      { year: 2005, type: 'storm', name: 'Hurricane Katrina', deaths: 1833, damage: 125000 },
      { year: 2012, type: 'storm', name: 'Hurricane Sandy', deaths: 159, damage: 65000 },
      { year: 2017, type: 'wildfire', name: 'California Wildfires', deaths: 44, damage: 18000 },
      { year: 2017, type: 'storm', name: 'Hurricane Harvey', deaths: 89, damage: 125000 },
      { year: 2018, type: 'wildfire', name: 'Camp Fire', deaths: 85, damage: 16500 },
      { year: 2021, type: 'storm', name: 'Hurricane Ida', deaths: 107, damage: 75000 }
    ],
    'CHN': [
      { year: 2008, type: 'earthquake', name: 'Sichuan Earthquake', deaths: 87476, damage: 86000 },
      { year: 2010, type: 'flood', name: 'China Floods', deaths: 1691, damage: 51000 },
      { year: 2013, type: 'earthquake', name: 'Lushan Earthquake', deaths: 196, damage: 8600 },
      { year: 2020, type: 'flood', name: 'China Floods', deaths: 279, damage: 32000 }
    ]
  };

  // Simulated country stats
  COUNTRY_STATS = {};
  Object.entries(majorCountries).forEach(([iso, info]) => {
    const events = Math.floor(Math.random() * 200 + 50);
    COUNTRY_STATS[iso] = {
      totalEvents: events,
      totalDeaths: Math.floor(Math.random() * 50000 + 1000),
      totalAffected: Math.floor(Math.random() * 10000000 + 100000),
      totalDamage: Math.floor(Math.random() * 100000 + 5000),
      mostFrequentType: info.type,
      worstYear: 2000 + Math.floor(Math.random() * 25),
      country: info.name,
      region: info.region,
      typeBreakdown: {
        [info.type]: Math.floor(events * 0.6),
        'flood': Math.floor(events * 0.2),
        'storm': Math.floor(events * 0.2)
      }
    };
  });

  // Simulated map data
  MAP_DATA = { '2000_2025': {} };
  Object.entries(COUNTRY_STATS).forEach(([iso, stats]) => {
    MAP_DATA['2000_2025'][iso] = {
      count: stats.totalEvents,
      deaths: stats.totalDeaths,
      damage: stats.totalDamage
    };
  });

  SUMMARY_STATS = {
    totalEvents: 9745,
    totalDeaths: 2000000,
    totalCountries: 220,
    totalDamage: 5000000
  };

  TOP_EVENTS = [
    { year: 2004, country: 'Indonesia', iso: 'IDN', type: 'earthquake', name: 'Indian Ocean Tsunami', deaths: 227000 },
    { year: 2010, country: 'Haiti', iso: 'HTI', type: 'earthquake', name: 'Haiti Earthquake', deaths: 222570 },
    { year: 2008, country: 'China', iso: 'CHN', type: 'earthquake', name: 'Sichuan Earthquake', deaths: 87476 },
    { year: 2005, country: 'Pakistan', iso: 'PAK', type: 'earthquake', name: 'Kashmir Earthquake', deaths: 73338 },
    { year: 2003, country: 'Europe', iso: 'EUR', type: 'drought', name: 'European Heat Wave', deaths: 72210 },
    { year: 2008, country: 'Myanmar', iso: 'MMR', type: 'storm', name: 'Cyclone Nargis', deaths: 138366 },
    { year: 2011, country: 'Japan', iso: 'JPN', type: 'earthquake', name: 'Tohoku Earthquake', deaths: 19747 },
    { year: 2005, country: 'United States', iso: 'USA', type: 'storm', name: 'Hurricane Katrina', deaths: 1833 },
    { year: 2013, country: 'Philippines', iso: 'PHL', type: 'storm', name: 'Typhoon Haiyan', deaths: 7354 },
    { year: 2015, country: 'Nepal', iso: 'NPL', type: 'earthquake', name: 'Nepal Earthquake', deaths: 8964 }
  ];

  REGIONAL_DATA = [
    { region: 'Asia', events: 5500, deaths: 1200000, affected: 50000000, damage: 3000000 },
    { region: 'Americas', events: 2000, deaths: 150000, affected: 20000000, damage: 1500000 },
    { region: 'Africa', events: 1500, deaths: 300000, affected: 30000000, damage: 200000 },
    { region: 'Europe', events: 600, deaths: 100000, affected: 5000000, damage: 250000 },
    { region: 'Oceania', events: 145, deaths: 5000, affected: 1000000, damage: 50000 }
  ];
}

// Helper function to get country data by year and type filters
function getFilteredCountryData(year = null, type = 'all') {
  if (!RAW_DATA || RAW_DATA.length === 0) {
    return MAP_DATA['2000_2025'] || {};
  }

  let filtered = RAW_DATA;

  if (year) {
    filtered = filtered.filter(d => d.year === year);
  }

  if (type !== 'all') {
    filtered = filtered.filter(d => d.type === type);
  }

  const countryData = d3.rollup(
    filtered,
    v => ({
      count: v.length,
      deaths: d3.sum(v, d => d.deaths),
      damage: d3.sum(v, d => d.damage)
    }),
    d => d.iso
  );

  return Object.fromEntries(countryData);
}

// Helper to format large numbers
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
}

// Helper to get disaster color
function getDisasterColor(type) {
  return DISASTER_COLORS[type] || '#666';
}
