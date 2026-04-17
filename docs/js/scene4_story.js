/* ============================================
   SCENE 4: EARTH STORY - TRENDS PANEL
   ============================================ */

const Scene4 = {
  _inited: false,
  currentView: 'overview', // 'overview' or 'deepdive'

  // Disaster type to subgroup mapping
  typeToSubgroup: {
    'storm': 'Meteorological',
    'flood': 'Hydrological',
    'drought': 'Climatological',
    'wildfire': 'Climatological',
    'earthquake': 'Geophysical',
    'volcano': 'Geophysical',
    'landslide': 'Geophysical'
  },

  subgroupColors: {
    'Meteorological': '#7c4dff',
    'Hydrological': '#2196f3',
    'Climatological': '#ff6f00',
    'Geophysical': '#795548'
  },

  init() {
    console.log('Initializing Scene 4: Earth Story');

    this.renderFrequencyExhibit();
    this.renderMortalityExhibit();
    this.renderAffectedExhibit();
    this.renderRegionalVulnerability();
  },

  renderFrequencyExhibit() {
    const container = document.getElementById('viz-frequency');
    if (!container) return;

    container.innerHTML = '';

    // Group data by year and subgroup
    const yearSubgroupData = d3.rollup(
      RAW_DATA,
      v => v.length,
      d => d.year,
      d => this.typeToSubgroup[d.type] || 'Unknown'
    );

    // Convert to array format for stacking
    const years = Array.from(new Set(RAW_DATA.map(d => d.year))).sort((a, b) => a - b);
    const subgroups = ['Meteorological', 'Hydrological', 'Climatological', 'Geophysical'];

    const data = years.map(year => {
      const obj = { year };
      const yearData = yearSubgroupData.get(year) || new Map();
      subgroups.forEach(sg => {
        obj[sg] = yearData.get(sg) || 0;
      });
      return obj;
    });

    // Set up dimensions
    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => subgroups.reduce((sum, sg) => sum + d[sg], 0))])
      .nice()
      .range([height, 0]);

    // Create stack
    const stack = d3.stack()
      .keys(subgroups)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(data);

    // Create area generator
    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas
    svg.selectAll('.area')
      .data(series)
      .join('path')
      .attr('class', 'area')
      .attr('fill', d => this.subgroupColors[d.key])
      .attr('opacity', 0.8)
      .attr('d', area);

    // Add axes
    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(y);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    svg.append('g')
      .call(yAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width + 10}, 0)`);

    subgroups.forEach((sg, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 22})`);

      g.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', this.subgroupColors[sg])
        .attr('opacity', 0.8);

      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(sg)
        .style('font-size', '11px')
        .style('fill', '#9e9e9e');
    });
  },

  renderMortalityExhibit() {
    const container = document.getElementById('viz-mortality');
    if (!container) return;

    container.innerHTML = '';

    // Group data by year for deaths only
    const yearlyDeaths = d3.rollup(
      RAW_DATA,
      v => d3.sum(v, d => d.deaths),
      d => d.year
    );

    const data = Array.from(yearlyDeaths, ([year, deaths]) => ({
      year,
      deaths
    })).sort((a, b) => a.year - b.year);

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.deaths)])
      .nice()
      .range([height, 0]);

    // Draw bars
    svg.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year) - 2)
      .attr('y', d => y(d.deaths))
      .attr('width', 4)
      .attr('height', d => height - y(d.deaths))
      .attr('fill', '#E74C3C')
      .attr('opacity', 0.7);

    // Add 5-year moving average line
    const avgData = data.map((d, idx) => {
      const start = Math.max(0, idx - 2);
      const end = Math.min(data.length - 1, idx + 2);
      const slice = data.slice(start, end + 1);
      const avg = d3.mean(slice, s => s.deaths);
      return { year: d.year, value: avg };
    });

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(avgData)
      .attr('fill', 'none')
      .attr('stroke', '#E74C3C')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add axes
    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d3.format(','));
    svg.append('g')
      .call(yAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9e9e9e')
      .attr('font-size', '12px')
      .text('Annual Deaths');
  },

  renderAffectedExhibit() {
    const container = document.getElementById('viz-economic');
    if (!container) return;

    container.innerHTML = '';

    // Group data by year for affected population only
    const yearlyAffected = d3.rollup(
      RAW_DATA,
      v => d3.sum(v, d => d.affected),
      d => d.year
    );

    const data = Array.from(yearlyAffected, ([year, affected]) => ({
      year,
      affected
    })).sort((a, b) => a.year - b.year);

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.affected)])
      .nice()
      .range([height, 0]);

    // Draw bars
    svg.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.year) - 2)
      .attr('y', d => y(d.affected))
      .attr('width', 4)
      .attr('height', d => height - y(d.affected))
      .attr('fill', '#F39C12')
      .attr('opacity', 0.7);

    // Add 5-year moving average line
    const avgData = data.map((d, idx) => {
      const start = Math.max(0, idx - 2);
      const end = Math.min(data.length - 1, idx + 2);
      const slice = data.slice(start, end + 1);
      const avg = d3.mean(slice, s => s.affected);
      return { year: d.year, value: avg };
    });

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(avgData)
      .attr('fill', 'none')
      .attr('stroke', '#F39C12')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add axes
    const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).ticks(10);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d => d3.format('.1f')(d / 1e6) + 'M');
    svg.append('g')
      .call(yAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '11px');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9e9e9e')
      .attr('font-size', '12px')
      .text('Affected Population (Millions)');
  },

  renderRegionalVulnerability() {
    const container = document.getElementById('viz-geography');
    if (!container) return;

    container.innerHTML = '';

    if (REGIONAL_DATA.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
      .domain(REGIONAL_DATA.map(d => d.region))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(REGIONAL_DATA, d => d.events)])
      .nice()
      .range([height, 0]);

    // Color scale for regions
    const regionColors = {
      'Asia': '#7c4dff',
      'Americas': '#2196f3',
      'Africa': '#ff6f00',
      'Europe': '#795548',
      'Oceania': '#4caf50'
    };

    // Draw bars
    svg.selectAll('.bar')
      .data(REGIONAL_DATA)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.region))
      .attr('y', d => y(d.events))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.events))
      .attr('fill', d => regionColors[d.region] || '#666')
      .attr('opacity', 0.8);

    // Add value labels on top of bars
    svg.selectAll('.value')
      .data(REGIONAL_DATA)
      .join('text')
      .attr('class', 'value')
      .attr('x', d => x(d.region) + x.bandwidth() / 2)
      .attr('y', d => y(d.events) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.events)
      .style('font-size', '11px')
      .style('fill', '#f0f0f0')
      .style('font-weight', 'bold');

    // Add axes
    const xAxis = d3.axisBottom(x);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '10px')
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    const yAxis = d3.axisLeft(y).ticks(5);
    svg.append('g')
      .call(yAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '10px');

    // Add y-axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9e9e9e')
      .attr('font-size', '11px')
      .text('Number of Disasters');
  },

};
