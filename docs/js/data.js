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
let DATA_SOURCE = 'empty';
let DATA_LOAD_ERROR = null;

// Metadata for normalized values from the CSV `type` column.
const DISASTER_TYPE_META = {
  drought: { label: 'Drought', color: '#FFC857', order: 10 },
  earthquake: { label: 'Earthquake', color: '#C96B32', order: 20 },
  extreme_temperature: { label: 'Extreme Temperature', color: '#FF5DB8', order: 30 },
  flood: { label: 'Flood', color: '#5EA8FF', order: 40 },
  landslide: { label: 'Landslide', color: '#7FE36A', order: 50 },
  storm: { label: 'Storm', color: '#8C86FF', order: 60 },
  epidemic: { label: 'Epidemic', color: '#6EE7C8', order: 70 },
  infestation: { label: 'Infestation', color: '#D6E75B', order: 80 },
  animal_incident: { label: 'Animal Incident', color: '#6DD6E8', order: 90 },
  volcano: { label: 'Volcano', color: '#FF695B', order: 100 },
  wildfire: { label: 'Wildfire', color: '#FFA142', order: 110 },
  impact: { label: 'Impact', color: '#C7A8FF', order: 120 }
};

const DISASTER_COLORS = Object.fromEntries(
  Object.entries(DISASTER_TYPE_META).map(([type, meta]) => [type, meta.color])
);

// Initialize data from the cleaned EM-DAT CSV.
async function initData(csvPath = 'data/emdat_clean.csv') {
  const csvCandidates = Array.from(new Set([
    csvPath,
    'docs/data/emdat_clean.csv',
    '/docs/data/emdat_clean.csv'
  ]));

  let lastError = null;

  for (const candidate of csvCandidates) {
    try {
      console.log(`Loading EM-DAT dataset from ${candidate}...`);
      const raw = await d3.csv(candidate);

      if (raw.length > 0) {
        loadRawRows(raw);
        DATA_SOURCE = 'csv';
        DATA_LOAD_ERROR = null;
        console.log(`Loaded ${raw.length} EM-DAT records from ${candidate}`);
        processData();
        console.log('Data processing complete');
        return;
      }
    } catch (error) {
      lastError = error;
    }
  }

  DATA_SOURCE = 'error';
  DATA_LOAD_ERROR = lastError;
  RAW_DATA = [];
  TYPOLOGY_DATA = [];
  MAP_DATA = {};
  COUNTRY_DOMINANT = {};
  COUNTRY_EVENTS = {};
  COUNTRY_STATS = {};
  SUMMARY_STATS = {};
  TOP_EVENTS = [];
  REGIONAL_DATA = [];
  console.error('Failed to load real EM-DAT CSV. Start a local server from docs/ or the repo root.', lastError);
}

function loadRawRows(raw) {
  RAW_DATA = raw.map(d => ({
    year: +d.year,
    iso: d.iso,
    country: d.country,
    region: d.region || 'Unknown',
    subregion: d.subregion || 'Unknown',
    type: d.type,
    rawType: d.raw_type || d.type,
    typeDetail: d.type_detail,
    name: d.name || 'Unnamed Event',
    deaths: +d.deaths || 0,
    affected: +d.affected || 0,
    damage: +d.damage_usd_thousands || 0,
    lat: +d.lat || null,
    lon: +d.lon || null
  }));
}

// Process loaded data into required formats
function processData() {
  // 1. TYPOLOGY_DATA: Annual counts by type
  const disasterTypes = getAvailableDisasterTypes().map(({ type }) => type);
  const yearlyTypes = d3.rollup(RAW_DATA, v => d3.rollup(v, vv => vv.length, d => d.type), d => d.year);

  TYPOLOGY_DATA = Array.from(yearlyTypes, ([year, counts]) => {
    const row = { year };
    disasterTypes.forEach(type => {
      row[type] = counts.get(type) || 0;
    });
    return row;
  }).sort((a, b) => a.year - b.year);

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

// Helper function to get country data by year and type filters
function getFilteredEvents(filters = {}) {
  if (!RAW_DATA || RAW_DATA.length === 0) {
    return [];
  }

  let filtered = RAW_DATA;
  const { yearStart = null, yearEnd = null, types = 'all' } = filters;

  if (yearStart !== null) {
    filtered = filtered.filter(d => d.year >= yearStart);
  }

  if (yearEnd !== null) {
    filtered = filtered.filter(d => d.year <= yearEnd);
  }

  if (Array.isArray(types)) {
    if (types.length === 0) return [];
    const selected = new Set(types);
    filtered = filtered.filter(d => selected.has(d.type));
  } else if (types && types !== 'all') {
    filtered = filtered.filter(d => d.type === types);
  }

  return filtered;
}

// Helper function to get country data by year and type filters
function getFilteredCountryData(year = null, type = 'all') {
  if (!RAW_DATA || RAW_DATA.length === 0) {
    return MAP_DATA['2000_2025'] || {};
  }

  const filters = typeof year === 'object' && year !== null
    ? year
    : {
        yearStart: year || null,
        yearEnd: year || null,
        types: type
      };

  const filtered = getFilteredEvents(filters);

  const countryData = d3.rollup(
    filtered,
    v => {
      const typeCounts = d3.rollup(v, vv => vv.length, d => d.type);
      const dominantType = Array.from(typeCounts, ([eventType, count]) => ({ eventType, count }))
        .sort((a, b) => b.count - a.count)[0]?.eventType || 'unknown';

      return {
        count: v.length,
        deaths: d3.sum(v, d => d.deaths),
        damage: d3.sum(v, d => d.damage),
        dominantType
      };
    },
    d => d.iso
  );

  return Object.fromEntries(countryData);
}

function getFilteredEventCount(filters = {}) {
  if (!RAW_DATA || RAW_DATA.length === 0) {
    return SUMMARY_STATS.totalEvents || 0;
  }

  return getFilteredEvents(filters).length;
}

function getAvailableDisasterTypes() {
  const types = RAW_DATA.length
    ? Array.from(new Set(RAW_DATA.map(d => d.type).filter(Boolean)))
    : [];

  return types
    .map(type => ({
      type,
      label: getDisasterTypeLabel(type),
      color: getDisasterColor(type),
      order: DISASTER_TYPE_META[type]?.order ?? 999
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
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
  return DISASTER_COLORS[type] || '#97AEC4';
}

function getDisasterTypeLabel(type) {
  return DISASTER_TYPE_META[type]?.label || type.replace(/_/g, ' ');
}

function isRealDataLoaded() {
  return DATA_SOURCE === 'csv' && RAW_DATA.length > 0;
}
