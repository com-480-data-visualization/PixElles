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
    this.renderDeadliestEvents();
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

    // Group data by year for deaths, affected, and damage
    const yearlyStats = d3.rollup(
      RAW_DATA,
      v => ({
        deaths: d3.sum(v, d => d.deaths),
        affected: d3.sum(v, d => d.affected),
        damage: d3.sum(v, d => d.damage)
      }),
      d => d.year
    );

    const data = Array.from(yearlyStats, ([year, stats]) => ({
      year,
      ...stats
    })).sort((a, b) => a.year - b.year);

    // Create three small multiples
    const margin = { top: 15, right: 15, bottom: 30, left: 50 };
    const chartHeight = (container.clientHeight - 40) / 3;
    const width = container.clientWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', container.clientWidth)
      .attr('height', container.clientHeight);

    const metrics = [
      { key: 'deaths', label: 'Deaths', color: '#E74C3C', format: d3.format(',') },
      { key: 'affected', label: 'Affected (Millions)', color: '#F39C12', format: d => d3.format('.1f')(d / 1e6) },
      { key: 'damage', label: 'Damage ($B USD)', color: '#3498DB', format: d => d3.format('.1f')(d / 1e6) }
    ];

    metrics.forEach((metric, i) => {
      const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${i * chartHeight + margin.top})`);

      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[metric.key])])
        .nice()
        .range([height, 0]);

      // Draw bars
      g.selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.year) - 2)
        .attr('y', d => y(d[metric.key]))
        .attr('width', 4)
        .attr('height', d => height - y(d[metric.key]))
        .attr('fill', metric.color)
        .attr('opacity', 0.6);

      // Add 5-year moving average line
      const avgData = data.map((d, idx) => {
        const start = Math.max(0, idx - 2);
        const end = Math.min(data.length - 1, idx + 2);
        const slice = data.slice(start, end + 1);
        const avg = d3.mean(slice, s => s[metric.key]);
        return { year: d.year, value: avg };
      });

      const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(avgData)
        .attr('fill', 'none')
        .attr('stroke', metric.color)
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add axes
      if (i === 2) {
        const xAxis = d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8);
        g.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(xAxis)
          .style('color', '#9e9e9e')
          .style('font-size', '10px');
      }

      const yAxis = d3.axisLeft(y).ticks(4).tickFormat(metric.format);
      g.append('g')
        .call(yAxis)
        .style('color', '#9e9e9e')
        .style('font-size', '10px');

      // Add label
      g.append('text')
        .attr('x', -margin.left + 5)
        .attr('y', -5)
        .text(metric.label)
        .style('font-size', '11px')
        .style('fill', metric.color)
        .style('font-weight', 'bold');
    });
  },

  renderDeadliestEvents() {
    const container = document.getElementById('viz-economic');
    if (!container) return;

    container.innerHTML = '';

    // Get top 10 deadliest events
    const topEvents = TOP_EVENTS.slice(0, 10);

    if (topEvents.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const margin = { top: 20, right: 20, bottom: 40, left: 150 };
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
      .domain([0, d3.max(topEvents, d => d.deaths)])
      .nice()
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(topEvents.map((d, i) => i))
      .range([0, height])
      .padding(0.2);

    // Draw bars
    svg.selectAll('.bar')
      .data(topEvents)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (d, i) => y(i))
      .attr('width', d => x(d.deaths))
      .attr('height', y.bandwidth())
      .attr('fill', d => getDisasterColor(d.type))
      .attr('opacity', 0.8);

    // Add country labels
    svg.selectAll('.label')
      .data(topEvents)
      .join('text')
      .attr('class', 'label')
      .attr('x', -5)
      .attr('y', (d, i) => y(i) + y.bandwidth() / 2)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text(d => `${d.name || d.country} (${d.year})`)
      .style('font-size', '10px')
      .style('fill', '#9e9e9e');

    // Add death count labels
    svg.selectAll('.value')
      .data(topEvents)
      .join('text')
      .attr('class', 'value')
      .attr('x', d => x(d.deaths) + 5)
      .attr('y', (d, i) => y(i) + y.bandwidth() / 2)
      .attr('alignment-baseline', 'middle')
      .text(d => formatNumber(d.deaths))
      .style('font-size', '10px')
      .style('fill', '#f0f0f0')
      .style('font-weight', 'bold');

    // Add x-axis
    const xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatNumber);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('color', '#9e9e9e')
      .style('font-size', '10px');
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
