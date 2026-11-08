// White hat: rates and counts on zero-based scales, and the US next to its wealthy peers.

const PEERS = ['CAN', 'GBR', 'FRA', 'DEU', 'JPN', 'AUS'];

function drawWhiteHat(data) {
  drawRegionRates(data);
  drawDeathsByRegion(data);
  drawPeerTrends(data);
}

// Dumbbell chart: each region's rate in 2000 (hollow) and 2017 (filled)
function drawRegionRates(data) {
  const last = data.years.length - 1;
  const us = country(data, 'USA');
  const rows = ['SSF', 'SAS', 'WLD', 'EAS', 'LCN', 'MEA', 'ECS', 'HIC']
    .map(code => ({ name: REGION_NAMES[code], values: aggregate(data, code).mmr, bold: code === 'WLD' }))
    .concat({ name: 'United States', values: us.mmr, bold: true })
    .map(d => ({ ...d, start: d.values[0], end: d.values[last] }))
    .sort((a, b) => b.end - a.end);

  const margin = { top: 40, right: 110, bottom: 52, left: 210 };
  const rowHeight = 34;
  const width = 760;
  const height = margin.top + rows.length * rowHeight + margin.bottom;
  const x = d3.scaleLinear([0, 900], [margin.left, width - margin.right]);

  const svg = createSvg('#wh-rates', width, height, 'Dumbbell chart of maternal mortality ratio by region in 2000 and 2017');

  svg.append('g').attr('class', 'grid')
    .selectAll('line').data(x.ticks(5)).join('line')
    .attr('x1', x).attr('x2', x)
    .attr('y1', margin.top - 10).attr('y2', height - margin.bottom);
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(0).tickPadding(10));
  svg.append('text').attr('class', 'axis-title')
    .attr('x', x(0)).attr('y', height - 10)
    .text('Maternal deaths per 100,000 live births');

  const legend = svg.append('g').attr('transform', `translate(${margin.left},16)`);
  legend.append('circle').attr('class', 'dot-start').attr('cx', 6).attr('r', 5);
  legend.append('text').attr('class', 'legend-text').attr('x', 18).attr('dy', '0.32em').text('2000');
  legend.append('circle').attr('class', 'dot-end').attr('cx', 72).attr('r', 6);
  legend.append('text').attr('class', 'legend-text').attr('x', 84).attr('dy', '0.32em').text('2017');

  const row = svg.append('g').selectAll('g').data(rows).join('g')
    .attr('class', 'row')
    .attr('transform', (d, i) => `translate(0,${margin.top + i * rowHeight + rowHeight / 2})`);

  row.append('text')
    .attr('class', d => (d.bold ? 'row-label bold' : 'row-label'))
    .attr('x', margin.left - 16).attr('dy', '0.32em')
    .text(d => d.name);
  row.append('line').attr('class', 'dumbbell-bar')
    .attr('x1', d => x(d.start)).attr('x2', d => x(d.end));
  row.append('circle').attr('class', 'dot-start').attr('cx', d => x(d.start)).attr('r', 5);
  row.append('circle').attr('class', 'dot-end').attr('cx', d => x(d.end)).attr('r', 6);
  row.append('text').attr('class', 'value-label')
    .attr('x', d => x(Math.max(d.start, d.end)) + 12).attr('dy', '0.32em')
    .text(d => `${d.start} → ${d.end}`);
  row.append('rect').attr('class', 'hit')
    .attr('x', 0).attr('y', -rowHeight / 2)
    .attr('width', width).attr('height', rowHeight)
    .on('pointerenter pointermove', (event, d) => showTooltip(event, d.name, [
      { value: fmtInt(d.start), label: 'per 100,000 births in 2000' },
      { value: fmtInt(d.end), label: 'per 100,000 births in 2017', color: token('--series-1') },
      { value: fmtPct(d.end / d.start - 1), label: 'change' },
    ]))
    .on('pointerleave', hideTooltip);

  addTable('#wh-rates-table', ['Region', '2000', '2017', 'Change'],
    rows.map(d => [d.name, d.start, d.end, fmtPct(d.end / d.start - 1)]));
}

// Bar chart: number of maternal deaths in 2017 and each region's share of the world total
function drawDeathsByRegion(data) {
  const last = data.years.length - 1;
  const total = aggregate(data, 'WLD').deaths[last];
  const usDeaths = country(data, 'USA').deaths[last];
  const rows = ['SSF', 'SAS', 'EAS', 'LCN', 'MEA', 'ECS', 'NAC']
    .map(code => ({ code, name: REGION_NAMES[code], deaths: aggregate(data, code).deaths[last] }))
    .sort((a, b) => b.deaths - a.deaths);
  const fmtShare = v => d3.format(v < 0.01 ? '.1%' : '.0%')(v);

  const margin = { top: 8, right: 170, bottom: 52, left: 210 };
  const rowHeight = 40;
  const barHeight = 20;
  const width = 760;
  const height = margin.top + rows.length * rowHeight + margin.bottom;
  const x = d3.scaleLinear([0, d3.max(rows, d => d.deaths)], [margin.left, width - margin.right]).nice();

  const svg = createSvg('#wh-deaths', width, height, 'Bar chart of maternal deaths by region in 2017');

  svg.append('g').attr('class', 'grid')
    .selectAll('line').data(x.ticks(4)).join('line')
    .attr('x1', x).attr('x2', x)
    .attr('y1', margin.top).attr('y2', height - margin.bottom);
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat(d => (d === 0 ? '0' : `${d / 1000}K`)).tickSize(0).tickPadding(10));
  svg.append('text').attr('class', 'axis-title')
    .attr('x', x(0)).attr('y', height - 10)
    .text('Maternal deaths, 2017');

  const row = svg.append('g').selectAll('g').data(rows).join('g')
    .attr('class', 'row')
    .attr('transform', (d, i) => `translate(0,${margin.top + i * rowHeight + rowHeight / 2})`);

  row.append('text').attr('class', 'row-label')
    .attr('x', margin.left - 16).attr('dy', '0.32em')
    .text(d => d.name);
  row.append('path').attr('class', 'bar')
    .attr('d', d => barPath(x(0), x(d.deaths), -barHeight / 2, barHeight));
  row.append('text').attr('class', 'value-label')
    .attr('x', d => x(d.deaths) + 8).attr('dy', '0.32em')
    .text(d => `${fmtInt(d.deaths)} (${fmtShare(d.deaths / total)})`)
    .filter(d => d.code === 'NAC')
    .append('tspan').attr('class', 'note-label')
    .text(`  ·  United States: ${fmtInt(usDeaths)} (${fmtShare(usDeaths / total)})`);
  row.append('rect').attr('class', 'hit')
    .attr('x', 0).attr('y', -rowHeight / 2)
    .attr('width', width).attr('height', rowHeight)
    .on('pointerenter pointermove', (event, d) => showTooltip(event, d.name, [
      { value: fmtInt(d.deaths), label: 'maternal deaths in 2017', color: token('--series-1') },
      { value: fmtShare(d.deaths / total), label: `of the world's ${fmtInt(total)}` },
    ]))
    .on('pointerleave', hideTooltip);

  addTable('#wh-deaths-table', ['Region', 'Maternal deaths, 2017', 'Share of world'],
    rows.map(d => [d.name, fmtInt(d.deaths), fmtShare(d.deaths / total)])
      .concat([['United States (part of North America)', fmtInt(usDeaths), fmtShare(usDeaths / total)]]));
}

// Line chart: the US against six wealthy peers, on the same zero-based scale
function drawPeerTrends(data) {
  const years = data.years;
  const series = ['USA', ...PEERS].map(iso3 => {
    const c = country(data, iso3);
    return { name: c.name, highlight: iso3 === 'USA', values: c.mmr };
  });

  const margin = { top: 28, right: 130, bottom: 40, left: 52 };
  const width = 760;
  const height = 340;
  const x = d3.scaleLinear([years[0], years[years.length - 1]], [margin.left, width - margin.right]);
  const y = d3.scaleLinear([0, 25], [height - margin.bottom, margin.top]);

  const svg = createSvg('#wh-peers', width, height, 'Line chart of maternal mortality in the US and six peer countries, 2000 to 2017');

  svg.append('g').attr('class', 'grid')
    .selectAll('line').data(y.ticks(5)).join('line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6, 'd').tickSizeOuter(0));
  svg.append('g').attr('class', 'axis axis-y')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(0).tickPadding(8));
  svg.append('text').attr('class', 'axis-title')
    .attr('x', margin.left - 30).attr('y', 12)
    .text('Deaths per 100,000 live births');

  const line = d3.line()
    .defined(v => v != null)
    .x((v, i) => x(years[i]))
    .y(v => y(v));

  // Peers first so the US line draws on top
  svg.append('g').selectAll('path')
    .data([...series].sort((a, b) => a.highlight - b.highlight))
    .join('path')
    .attr('class', d => (d.highlight ? 'line line-highlight' : 'line line-context'))
    .attr('d', d => line(d.values));

  const us = series.find(s => s.highlight);
  const usEnd = us.values[us.values.length - 1];
  svg.append('circle').attr('class', 'end-dot')
    .attr('cx', x(years[years.length - 1])).attr('cy', y(usEnd)).attr('r', 5);
  svg.append('text').attr('class', 'end-label bold')
    .attr('x', x(years[years.length - 1]) + 10).attr('y', y(usEnd)).attr('dy', '0.32em')
    .text(`United States ${usEnd}`);

  addCrosshair(svg, {
    x, years, series,
    top: margin.top, bottom: height - margin.bottom,
    left: margin.left, right: width - margin.right,
    format: v => (v == null ? '–' : fmtInt(v)),
    color: s => token(s.highlight ? '--series-1' : '--context'),
  });

  addTable('#wh-peers-table', ['Country', ...years.filter((y, i) => i % 5 === 0 || i === years.length - 1)],
    series.map(s => [s.name, ...s.values.filter((v, i) => i % 5 === 0 || i === years.length - 1)]));
}
