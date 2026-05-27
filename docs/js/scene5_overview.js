/* ============================================
   SCENE 5: COUNTRY OVERVIEW
   ============================================ */

const Scene5 = {
  currentCountry: null,

  render(iso) {
    console.log('Rendering overview for:', iso);
    this.currentCountry = iso;

    const stats = COUNTRY_STATS[iso];
    const events = COUNTRY_EVENTS[iso] || [];

    if (!stats) {
      console.warn('No stats found for country:', iso);
      return;
    }

    // Populate hero section
    const countryNameEl = document.getElementById('overviewCountryMainName');
    if (countryNameEl) {
      countryNameEl.textContent = stats.country;
    }

    // Populate statistics cards
    const years = events.map(e => e.year);
    const minYear = years.length > 0 ? Math.min(...years) : 1975;
    const maxYear = years.length > 0 ? Math.max(...years) : 2025;
    const yearRange = `${maxYear - minYear} years`;

    const statTotalEventsEl = document.getElementById('statTotalEvents');
    if (statTotalEventsEl) {
      statTotalEventsEl.textContent = formatNumber(stats.totalEvents || 0);
    }

    const statYearRangeEl = document.getElementById('statYearRange');
    if (statYearRangeEl) {
      statYearRangeEl.textContent = yearRange;
    }

    const statTotalDeathsEl = document.getElementById('statTotalDeaths');
    if (statTotalDeathsEl) {
      statTotalDeathsEl.textContent = formatNumber(stats.totalDeaths || 0);
    }

    const statPeopleAffectedEl = document.getElementById('statPeopleAffected');
    if (statPeopleAffectedEl) {
      statPeopleAffectedEl.textContent = formatNumber(stats.totalAffected || 0);
    }

    const damageInBillions = ((stats.totalDamage || 0) / 1000000).toFixed(1);
    const statTotalDamageEl = document.getElementById('statTotalDamage');
    if (statTotalDamageEl) {
      statTotalDamageEl.textContent = `$${damageInBillions}B`;
    }

    const compositionYearRangeEl = document.getElementById('compositionYearRange');
    if (compositionYearRangeEl) {
      compositionYearRangeEl.textContent = `${minYear}–${maxYear}`;
    }

    // Render visualizations
    this.renderCompositionChart(iso, stats);
    this.renderTypeEvolutionChart(iso, events);
    this.renderDeathsAffectedChart(iso, events);
    this.renderEconomicChart(iso, events);
  },

  renderCompositionChart(iso, stats) {
    const container = document.getElementById('overviewComposition');
    if (!container) {
      console.warn('overviewComposition container not found');
      return;
    }
    container.innerHTML = '';

    if (!stats.typeBreakdown) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Reserve space for legend at bottom
    const legendHeight = 80;
    const pieHeight = height - legendHeight - 10;
    const centerX = width * 0.5;
    const centerY = pieHeight * 0.45;
    const radius = Math.min(width * 0.25, pieHeight * 0.35);

    console.log('Composition chart dimensions:', width, height, radius);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);

    // Prepare data
    const typeData = Object.entries(stats.typeBreakdown)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const total = d3.sum(typeData, d => d.count);

    // Pie layout
    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);

    // Create legend group below the pie chart
    const legendX = 30;
    const legendY = pieHeight + 15;
    const legend = svg.append('g')
      .attr('transform', `translate(${legendX},${legendY})`);

    // Draw pie slices with hover and click effects
    let selectedType = null;

    const slices = chartGroup.selectAll('path')
      .data(pie(typeData))
      .join('path')
      .attr('d', arc)
      .attr('fill', d => getDisasterColor(d.data.type))
      .attr('opacity', 0.9)
      .attr('stroke', '#FFF')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        if (selectedType !== d.data.type) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('transform', function() {
              const [x, y] = arc.centroid(d);
              return `translate(${x * 0.05},${y * 0.05})`;
            });

          // Enlarge the corresponding legend box
          legend.selectAll('.legend-box')
            .filter(legendData => legendData.type === d.data.type)
            .transition()
            .duration(200)
            .attr('width', 18)
            .attr('height', 18)
            .attr('x', -3)
            .attr('y', -3);
        }
      })
      .on('mouseout', function(event, d) {
        if (selectedType !== d.data.type) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.9)
            .attr('transform', 'translate(0,0)');

          // Reset the legend box
          legend.selectAll('.legend-box')
            .filter(legendData => legendData.type === d.data.type)
            .transition()
            .duration(200)
            .attr('width', 12)
            .attr('height', 12)
            .attr('x', 0)
            .attr('y', 0);
        }
      })
      .on('click', function(event, d) {
        // Toggle selection
        if (selectedType === d.data.type) {
          selectedType = null;
          // Reset all slices
          slices.transition().duration(300)
            .attr('opacity', 0.9)
            .attr('transform', 'translate(0,0)');
          // Reset all legend boxes
          legend.selectAll('.legend-box')
            .transition().duration(300)
            .attr('width', 12)
            .attr('height', 12)
            .attr('x', 0)
            .attr('y', 0);
        } else {
          selectedType = d.data.type;
          // Highlight selected slice
          slices.transition().duration(300)
            .attr('opacity', data => data.data.type === selectedType ? 1 : 0.3)
            .attr('transform', function(data) {
              if (data.data.type === selectedType) {
                const [x, y] = arc.centroid(data);
                return `translate(${x * 0.1},${y * 0.1})`;
              }
              return 'translate(0,0)';
            });
          // Enlarge corresponding legend box
          legend.selectAll('.legend-box')
            .transition().duration(300)
            .attr('width', d => d.type === selectedType ? 18 : 12)
            .attr('height', d => d.type === selectedType ? 18 : 12)
            .attr('x', d => d.type === selectedType ? -3 : 0)
            .attr('y', d => d.type === selectedType ? -3 : 0);
        }
      });

    // Add percentage labels on slices
    const labelArc = d3.arc()
      .innerRadius(radius * 0.65)
      .outerRadius(radius * 0.65);

    chartGroup.selectAll('.slice-label')
      .data(pie(typeData))
      .join('text')
      .attr('class', 'slice-label')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', '#FFF')
      .attr('font-size', '0.8rem')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-display)')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.5)')
      .text(d => {
        const percentage = ((d.data.count / total) * 100);
        return percentage > 3 ? `${percentage.toFixed(0)}%` : '';
      });

    // Center label with total
    chartGroup.append('circle')
      .attr('r', radius * 0.35)
      .attr('fill', 'var(--exhibit)')
      .attr('opacity', 0.95);

    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#FFF')
      .attr('font-size', '2.5rem')
      .attr('font-weight', '400')
      .attr('font-family', 'Playfair Display, Georgia, serif')
      .text(total);

    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '2em')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.9rem')
      .attr('font-family', 'var(--font-body)')
      .attr('letter-spacing', '0.1em')
      .text('EVENTS');

    // Populate legend
    const itemsPerRow = Math.ceil(typeData.length / 2);
    const itemWidth = Math.min(150, (width - 60) / itemsPerRow);

    typeData.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const legendItem = legend.append('g')
        .attr('transform', `translate(${col * itemWidth},${row * 25})`)
        .style('cursor', 'pointer')
        .on('click', function() {
          // Find the corresponding slice and trigger its click event
          const slice = slices.filter(sliceData => sliceData.data.type === d.type);
          if (slice.size() > 0) {
            slice.dispatch('click');
          }
        })
        .on('mouseover', function() {
          // Enlarge the box on hover
          d3.select(this).select('.legend-box')
            .transition()
            .duration(200)
            .attr('width', 16)
            .attr('height', 16)
            .attr('x', -2)
            .attr('y', -2);

          // Also highlight the corresponding slice
          slices.filter(sliceData => sliceData.data.type === d.type)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('transform', function(sliceData) {
              const [x, y] = arc.centroid(sliceData);
              return `translate(${x * 0.08},${y * 0.08})`;
            });
        })
        .on('mouseout', function() {
          // Only reset if not selected
          if (selectedType !== d.type) {
            d3.select(this).select('.legend-box')
              .transition()
              .duration(200)
              .attr('width', 12)
              .attr('height', 12)
              .attr('x', 0)
              .attr('y', 0);

            // Reset the slice
            slices.filter(sliceData => sliceData.data.type === d.type)
              .transition()
              .duration(200)
              .attr('opacity', 0.9)
              .attr('transform', 'translate(0,0)');
          }
        });

      // Color box with class for animation
      legendItem.append('rect')
        .datum(d)
        .attr('class', 'legend-box')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', getDisasterColor(d.type))
        .attr('rx', 2)
        .attr('x', 0)
        .attr('y', 0);

      // Type label
      legendItem.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('fill', 'var(--text-mid)')
        .attr('font-size', '0.75rem')
        .attr('font-family', 'var(--font-body)')
        .text(this.capitalize(d.type));

      // Count with parentheses
      const labelWidth = this.capitalize(d.type).length * 7;
      legendItem.append('text')
        .attr('x', 18 + labelWidth + 5)
        .attr('y', 10)
        .attr('fill', 'var(--text-dim)')
        .attr('font-size', '0.7rem')
        .attr('font-family', 'var(--font-body)')
        .text(`(${d.count})`);
    });
  },

  renderTypeEvolutionChart(iso, events) {
    const container = document.getElementById('overviewTypeEvolution');
    if (!container) return;
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 100, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group events by year and type
    const yearTypeData = d3.rollup(
      events,
      v => v.length,
      d => d.year,
      d => d.type
    );

    // Get all unique years and types
    const allYears = Array.from(new Set(events.map(d => d.year))).sort((a, b) => a - b);
    const allTypes = Array.from(new Set(events.map(d => d.type)));

    // Create stacked data structure
    const stackData = allYears.map(year => {
      const yearObj = { year };
      allTypes.forEach(type => {
        yearObj[type] = yearTypeData.get(year)?.get(type) || 0;
      });
      return yearObj;
    });

    // Stack generator
    const stack = d3.stack()
      .keys(allTypes)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const series = stack(stackData);

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
      .nice()
      .range([chartHeight, 0]);

    // Area generator
    const area = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveBasis);

    // Create tooltip
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--exhibit)')
      .style('border', '1px solid var(--border-dim)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-family', 'var(--font-body)')
      .style('font-size', '0.85rem')
      .style('color', 'var(--text-bright)')
      .style('z-index', 1000);

    // Draw stacked areas
    g.selectAll('.area')
      .data(series)
      .join('path')
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', d => getDisasterColor(d.key))
      .attr('opacity', 0.8)
      .attr('stroke', 'none');

    // Add invisible overlay for hover detection
    const bisect = d3.bisector(d => d.year).left;

    const focusLine = g.append('line')
      .attr('class', 'focus-line')
      .attr('stroke', 'var(--text-mid)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const year = Math.round(x.invert(mouseX));
        const dataPoint = stackData.find(d => d.year === year);

        if (dataPoint) {
          const total = allTypes.reduce((sum, type) => sum + (dataPoint[type] || 0), 0);

          // Show focus line
          focusLine
            .attr('x1', x(year))
            .attr('x2', x(year))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .style('opacity', 1);

          // Show tooltip with total
          tooltip
            .style('opacity', 1)
            .html(`
              <div style="font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 4px;">
                YEAR ${year}
              </div>
              <div style="font-size: 1.5rem; font-weight: 600; color: var(--bluesky);">
                ${total} events
              </div>
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 100) + 'px');
        }
      })
      .on('mouseout', function() {
        focusLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

    // Axes with styling
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6));

    xAxis.selectAll('text')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.75rem');

    xAxis.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(5));

    yAxis.selectAll('text')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.75rem');

    yAxis.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    // Legend on the right
    const topTypes = allTypes
      .map(type => ({
        type,
        total: d3.sum(stackData, d => d[type])
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const legendG = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10},${margin.top})`);

    topTypes.forEach((typeData, i) => {
      const legendRow = legendG.append('g')
        .attr('transform', `translate(0,${i * 22})`);

      legendRow.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', getDisasterColor(typeData.type))
        .attr('opacity', 0.8)
        .attr('rx', 2);

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('fill', 'var(--text-mid)')
        .attr('font-size', '0.7rem')
        .attr('font-family', 'var(--font-body)')
        .text(this.capitalize(typeData.type));
    });
  },

  renderDeathsAffectedChart(iso, events) {
    const container = document.getElementById('overviewDeathsAffected');
    if (!container) {
      console.warn('overviewDeathsAffected container not found');
      return;
    }
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 40px;">No data available</div>';
      return;
    }

    const width = container.clientWidth || 600;
    const height = Math.max(container.clientHeight || 300, 300);
    const margin = { top: 20, right: 70, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    if (chartWidth <= 0 || chartHeight <= 0) {
      console.warn('Chart dimensions are invalid:', { chartWidth, chartHeight });
      container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 40px;">Insufficient space to render chart</div>';
      return;
    }

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate deaths, affected, and event count by year
    const yearData = d3.rollup(
      events,
      v => ({
        deaths: d3.sum(v, d => d.deaths || 0),
        affected: d3.sum(v, d => d.affected || 0),
        count: v.length
      }),
      d => d.year
    );

    const combinedData = Array.from(yearData, ([year, data]) => ({
      year,
      deaths: data.deaths,
      affected: data.affected,
      eventCount: data.count
    })).sort((a, b) => a.year - b.year);

    if (combinedData.length === 0) {
      container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 40px;">No data available</div>';
      return;
    }

    // Scales - use separate y scales for deaths and affected
    const x = d3.scaleLinear()
      .domain(d3.extent(combinedData, d => d.year))
      .range([0, chartWidth]);

    const yDeaths = d3.scaleLinear()
      .domain([0, d3.max(combinedData, d => d.deaths)])
      .nice()
      .range([chartHeight, 0]);

    const yAffected = d3.scaleLinear()
      .domain([0, d3.max(combinedData, d => d.affected)])
      .nice()
      .range([chartHeight, 0]);

    // Create tooltip
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--exhibit)')
      .style('border', '1px solid var(--border-dim)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-family', 'var(--font-body)')
      .style('font-size', '0.85rem')
      .style('color', 'var(--text-bright)')
      .style('z-index', 1000);

    // Area for deaths
    const areaDeaths = d3.area()
      .x(d => x(d.year))
      .y0(chartHeight)
      .y1(d => yDeaths(d.deaths))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(combinedData.filter(d => d.deaths > 0))
      .attr('fill', 'var(--volcano)')
      .attr('opacity', 0.3)
      .attr('d', areaDeaths);

    // Line for deaths
    const lineDeaths = d3.line()
      .x(d => x(d.year))
      .y(d => yDeaths(d.deaths))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(combinedData.filter(d => d.deaths > 0))
      .attr('fill', 'none')
      .attr('stroke', 'var(--volcano)')
      .attr('stroke-width', 3)
      .attr('d', lineDeaths);

    // Area for affected
    const areaAffected = d3.area()
      .x(d => x(d.year))
      .y0(chartHeight)
      .y1(d => yAffected(d.affected))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(combinedData.filter(d => d.affected > 0))
      .attr('fill', 'var(--drought)')
      .attr('opacity', 0.2)
      .attr('d', areaAffected);

    // Line for affected
    const lineAffected = d3.line()
      .x(d => x(d.year))
      .y(d => yAffected(d.affected))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(combinedData.filter(d => d.affected > 0))
      .attr('fill', 'none')
      .attr('stroke', 'var(--drought)')
      .attr('stroke-width', 3)
      .attr('d', lineAffected);

    // Find peaks
    const peakDeaths = combinedData.reduce((max, d) => d.deaths > max.deaths ? d : max, combinedData[0]);
    const peakAffected = combinedData.reduce((max, d) => d.affected > max.affected ? d : max, combinedData[0]);

    // Update peak label
    const peakLabel = document.getElementById('deathsAffectedPeakLabel');
    if (peakLabel) {
      peakLabel.textContent = `DEATHS: ${peakDeaths.year} · AFFECTED: ${peakAffected.year}`;
    }

    // Add hover line and interaction
    const focusLine = g.append('line')
      .attr('class', 'focus-line')
      .attr('stroke', 'var(--text-mid)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    const bisect = d3.bisector(d => d.year).left;

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const year = x.invert(mouseX);
        const index = bisect(combinedData, year);
        const d0 = combinedData[index - 1];
        const d1 = combinedData[index];
        const d = d1 && d0 && (year - d0.year > d1.year - year) ? d1 : (d0 || d1);

        if (d) {
          focusLine
            .attr('x1', x(d.year))
            .attr('x2', x(d.year))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .style('opacity', 1);

          tooltip
            .style('opacity', 1)
            .html(`
              <div style="font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 6px;">
                YEAR ${d.year} · ${d.eventCount} EVENT${d.eventCount > 1 ? 'S' : ''}
              </div>
              <div style="font-size: 1.1rem; font-weight: 600; color: var(--volcano); margin-bottom: 4px;">
                ${formatNumber(d.deaths)} deaths
              </div>
              <div style="font-size: 1.1rem; font-weight: 600; color: var(--drought);">
                ${formatNumber(d.affected)} affected
              </div>
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 120) + 'px');
        }
      })
      .on('mouseout', function() {
        focusLine.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

    // X axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6));

    xAxis.selectAll('text')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)');

    xAxis.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    // Left Y axis for deaths
    const yAxisLeft = g.append('g')
      .call(d3.axisLeft(yDeaths).ticks(5).tickFormat(d => formatNumber(d)));

    yAxisLeft.selectAll('text')
      .attr('fill', 'var(--volcano)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)');

    yAxisLeft.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    // Right Y axis for affected
    const yAxisRight = g.append('g')
      .attr('transform', `translate(${chartWidth},0)`)
      .call(d3.axisRight(yAffected).ticks(5).tickFormat(d => formatNumber(d)));

    yAxisRight.selectAll('text')
      .attr('fill', 'var(--drought)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)');

    yAxisRight.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 30)`);

    legend.append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', 'var(--volcano)')
      .attr('opacity', 0.8);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 11)
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.75rem')
      .text('Deaths');

    legend.append('rect')
      .attr('y', 22)
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', 'var(--drought)')
      .attr('opacity', 0.8);

    legend.append('text')
      .attr('x', 20)
      .attr('y', 33)
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.75rem')
      .text('Affected');
  },

  renderEconomicChart(iso, events) {
    const container = document.getElementById('overviewDamages');
    if (!container) {
      console.warn('overviewDamages container not found');
      return;
    }
    container.innerHTML = '';

    if (events.length === 0) {
      container.innerHTML = '<div style="color: #666;">No data available</div>';
      return;
    }

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    console.log('Economic chart dimensions:', width, height);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Aggregate damages and event count by year (damage is already in thousands)
    const yearDamages = d3.rollup(
      events,
      v => ({
        damage: d3.sum(v, d => d.damage || 0),
        count: v.length
      }),
      d => d.year
    );
    const damageData = Array.from(yearDamages, ([year, data]) => ({
      year,
      damage: data.damage,
      eventCount: data.count
    }))
      .sort((a, b) => a.year - b.year)
      .filter(d => d.damage > 0);

    if (damageData.length === 0) {
      container.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 40px;">No damage data available for this country</div>';
      return;
    }

    // Scales
    const x = d3.scaleLinear()
      .domain(d3.extent(damageData, d => d.year))
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(damageData, d => d.damage)])
      .nice()
      .range([chartHeight, 0]);

    // Create tooltip
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('background', 'var(--exhibit)')
      .style('border', '1px solid var(--border-dim)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('font-family', 'var(--font-body)')
      .style('font-size', '0.85rem')
      .style('color', 'var(--text-bright)')
      .style('z-index', 1000);

    // Area
    const area = d3.area()
      .x(d => x(d.year))
      .y0(chartHeight)
      .y1(d => y(d.damage))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(damageData)
      .attr('fill', 'var(--purple)')
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
      .attr('stroke', 'var(--purple)')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Find peak
    const peakDamage = damageData.reduce((max, d) => d.damage > max.damage ? d : max, damageData[0]);

    // Highlight peak
    if (peakDamage && peakDamage.damage > 0) {
      g.append('circle')
        .attr('cx', x(peakDamage.year))
        .attr('cy', y(peakDamage.damage))
        .attr('r', 6)
        .attr('fill', 'var(--purple)')
        .attr('stroke', '#FFF')
        .attr('stroke-width', 2);

      // Peak annotation
      g.append('text')
        .attr('x', x(peakDamage.year))
        .attr('y', y(peakDamage.damage) - 15)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-mid)')
        .attr('font-size', '0.7rem')
        .attr('font-family', 'var(--font-display)')
        .text(`${peakDamage.year}`);

      // Update peak label in header
      const damagePeakLabel = document.getElementById('damagePeakLabel');
      if (damagePeakLabel) {
        damagePeakLabel.textContent = `PEAK YEAR — ${peakDamage.year}`;
      }
    }

    // Add hover line and interaction
    const focusLine = g.append('line')
      .attr('class', 'focus-line')
      .attr('stroke', 'var(--text-mid)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .style('opacity', 0);

    const focusCircle = g.append('circle')
      .attr('r', 5)
      .attr('fill', 'var(--purple)')
      .attr('stroke', '#FFF')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const bisect = d3.bisector(d => d.year).left;

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const year = x.invert(mouseX);
        const index = bisect(damageData, year);
        const d0 = damageData[index - 1];
        const d1 = damageData[index];
        const d = d1 && (year - d0.year > d1.year - year) ? d1 : d0;

        if (d) {
          // Show focus line
          focusLine
            .attr('x1', x(d.year))
            .attr('x2', x(d.year))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .style('opacity', 1);

          // Show focus circle
          focusCircle
            .attr('cx', x(d.year))
            .attr('cy', y(d.damage))
            .style('opacity', 1);

          // Show tooltip
          tooltip
            .style('opacity', 1)
            .html(`
              <div style="font-family: var(--font-display); font-size: 0.7rem; letter-spacing: 0.1em; color: var(--text-dim); margin-bottom: 4px;">
                YEAR ${d.year} · ${d.eventCount} EVENT${d.eventCount > 1 ? 'S' : ''}
              </div>
              <div style="font-size: 1.3rem; font-weight: 600; color: var(--purple);">
                $${(d.damage / 1000).toFixed(1)}M
              </div>
              <div style="font-size: 0.75rem; color: var(--text-mid); margin-top: 2px;">
                economic damage
              </div>
            `)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 120) + 'px');
        }
      })
      .on('mouseout', function() {
        focusLine.style('opacity', 0);
        focusCircle.style('opacity', 0);
        tooltip.style('opacity', 0);
      });

    // Axes with better styling
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(6));

    xAxis.selectAll('text')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)');

    xAxis.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(5));

    yAxis.selectAll('text')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)');

    yAxis.selectAll('line, path')
      .attr('stroke', 'var(--border-dim)');

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -50)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-mid)')
      .attr('font-size', '0.7rem')
      .attr('font-family', 'var(--font-body)')
      .text('USD (Millions)');
  },

  capitalize(str) {
    return getDisasterTypeLabel(str).replace(/\b\w/g, char => char.toUpperCase());
  }
};
