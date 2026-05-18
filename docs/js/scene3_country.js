/* ============================================
   SCENE 3: COUNTRY OVERVIEW
   ============================================ */

const Scene3 = {
  currentCountry: null,

  open(iso) {
    console.log('Opening country overview for:', iso);
    this.currentCountry = iso;

    App.showScene('scene-country');

    this.renderView(iso);
    this.attachHandlers();
  },

  renderView(iso) {
    const stats = COUNTRY_STATS[iso];
    if (!stats) {
      console.warn('No stats found for country:', iso);
      return;
    }

    document.getElementById('timelineCountryName').textContent = stats.country;
    document.getElementById('timelineCountryRegion').textContent = stats.region;

    // Trigger all D3 Visualizations
    this.renderFrequencyChart(iso, events);
    this.renderTypeDistribution(iso, stats);
    this.renderDeathsChart(iso, events);
    this.renderEconomicChart(iso, events);
  },

  renderFrequencyChart(iso, events) {
    const container = document.getElementById('overviewFrequency');
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate by year
    const yearCounts = d3.rollup(events, v => v.length, d => d.year);
    const yearData = Array.from(yearCounts, ([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(yearData, d => d.year))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d.count)])
      .nice()
      .range([chartHeight, 0]);

    // Line
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(yearData)
      .attr('fill', 'none')
      .attr('stroke', '#7c4dff')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Dots
    g.selectAll('circle')
      .data(yearData)
      .join('circle')
      .attr('cx', d => x(d.year))
      .attr('cy', d => y(d.count))
      .attr('r', 4)
      .attr('fill', '#7c4dff');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5))
      .attr('color', '#555');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#555');
  },

  renderTypeDistribution(iso, stats) {
    const container = document.getElementById('overviewDistribution');
    container.innerHTML = '';

    if (!stats.typeBreakdown) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Prepare data
    const typeData = Object.entries(stats.typeBreakdown)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Pie layout
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    // Arcs
    g.selectAll('path')
      .data(pie(typeData))
      .join('path')
      .attr('d', arc)
      .attr('fill', d => getDisasterColor(d.data.type))
      .attr('opacity', 0.8)
      .attr('stroke', '#0d1117')
      .attr('stroke-width', 2);

    // Labels
    const labelArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius * 0.7);

    g.selectAll('text')
      .data(pie(typeData))
      .join('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f0f0f0')
      .attr('font-size', '0.75rem')
      .text(d => d.data.count > 0 ? this.capitalize(d.data.type) : '');
  },

  renderDeathsChart(iso, events) {
    const container = document.getElementById('overviewDeaths');
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate deaths by year
    const yearDeaths = d3.rollup(events, v => d3.sum(v, d => d.deaths || 0), d => d.year);
    const deathData = Array.from(yearDeaths, ([year, deaths]) => ({ year, deaths }))
      .sort((a, b) => a.year - b.year);

    // Scales
    const x = d3.scaleBand()
      .domain(deathData.map(d => d.year))
      .range([0, chartWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(deathData, d => d.deaths)])
      .nice()
      .range([chartHeight, 0]);

    // Bars
    g.selectAll('rect')
      .data(deathData)
      .join('rect')
      .attr('x', d => x(d.year))
      .attr('y', d => y(d.deaths))
      .attr('width', x.bandwidth())
      .attr('height', d => chartHeight - y(d.deaths))
      .attr('fill', '#f44336')
      .attr('opacity', 0.8);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 5 === 0)))
      .attr('color', '#555');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#555');
  },

  renderEconomicChart(iso, events) {
    const container = document.getElementById('overviewDamages');
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate damages by year
    const yearDamages = d3.rollup(events, v => d3.sum(v, d => d.damage_usd_thousands || 0), d => d.year);
    const damageData = Array.from(yearDamages, ([year, damage]) => ({ year, damage: damage / 1000 }))
      .sort((a, b) => a.year - b.year);

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(damageData, d => d.year))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(damageData, d => d.damage)])
      .nice()
      .range([chartHeight, 0]);

    // Area
    const area = d3.area()
      .x(d => x(d.year))
      .y0(chartHeight)
      .y1(d => y(d.damage))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(damageData)
      .attr('fill', '#ff6f00')
      .attr('opacity', 0.3)
      .attr('d', area);

    // Line
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.damage))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(damageData)
      .attr('fill', 'none')
      .attr('stroke', '#ff6f00')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5))
      .attr('color', '#555');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#555');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9e9e9e')
      .attr('font-size', '0.75rem')
      .text('USD (Millions)');
  },

  attachHandlers() {
    // Return to the main Globe page
  const backBtn = document.getElementById('backToGlobe');
  if (backBtn) {
    backBtn.onclick = () => {
      window.location.href = 'coutry_timeline.html'; 
    };
  }
  },

  capitalize(str) {
    return getDisasterTypeLabel(str).replace(/\b\w/g, char => char.toUpperCase());
  }
};
