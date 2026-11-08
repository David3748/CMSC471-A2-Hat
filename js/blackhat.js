// Black hat: percent change and an index hide that the US rate is a tenth of the world's.

const INDEX_SERIES = [
  { code: 'USA', name: 'United States', highlight: true },
  { code: 'LCN', name: 'Latin America & Caribbean' },
  { code: 'SSF', name: 'Sub-Saharan Africa' },
  { code: 'SAS', name: 'South Asia' },
];

function drawBlackHat(data, world) {
  const ranked = data.countries
    .filter(c => c.mmr[0] && c.mmr[c.mmr.length - 1])
    .map(c => ({ ...c, change: percentChange(c.mmr) }))
    .sort((a, b) => b.change - a.change);

  drawHeadlineStats(data, ranked);
  drawChangeMap(ranked, world);
  drawIndexedTrends(data);

  addTable('#bh-table', ['Rank', 'Country', 'Change in maternal mortality, 2000–2017'],
    ranked.map((c, i) => [i + 1, c.name, fmtPct(c.change)]));
}

function drawHeadlineStats(data, ranked) {
  const usRank = ranked.findIndex(c => c.iso3 === 'USA');
  const stats = [
    { value: fmtPct(ranked[usRank].change), label: 'Rise in US maternal mortality since 2000', accent: true },
    { value: `#${usRank + 1} of ${ranked.length}`, label: 'Fastest increase of any country tracked' },
    { value: fmtPct(percentChange(aggregate(data, 'WLD').mmr)), label: 'Change worldwide over the same years' },
  ];
  const tiles = d3.select('#bh-stats').selectAll('div').data(stats).join('div')
    .attr('class', d => (d.accent ? 'stat accent' : 'stat'));
  tiles.append('div').attr('class', 'stat-value').text(d => d.value);
  tiles.append('div').attr('class', 'stat-label').text(d => d.label);
}

// Increases get a loud red ramp; declines, however large, stay close to neutral
function changeColorScale() {
  const up = d3.scaleLinear([0, 0.15, 0.6], [token('--bh-up-0'), token('--bh-up-1'), token('--bh-up-2')]).clamp(true);
  const down = d3.scaleLinear([-1, 0], [token('--bh-down-1'), token('--bh-down-0')]).clamp(true);
  return v => (v > 0 ? up(v) : down(v));
}

// Choropleth of percent change on a Mercator projection
function drawChangeMap(ranked, world) {
  const width = 960;
  const height = 600;
  const features = topojson.feature(world, world.objects.countries).features
    .filter(f => f.id !== '010'); // Antarctica
  const projection = d3.geoMercator()
    .fitExtent([[0, 0], [width, height]], { type: 'FeatureCollection', features });
  const path = d3.geoPath(projection);
  const byId = new Map(ranked.map((c, i) => [c.isoNum, { ...c, rank: i + 1 }]));
  const color = changeColorScale();

  const svg = createSvg('#bh-map', width, height, 'World map of the change in maternal mortality from 2000 to 2017');

  svg.append('g').selectAll('path').data(features).join('path')
    .attr('class', 'country')
    .attr('d', path)
    .attr('fill', f => (byId.has(f.id) ? color(byId.get(f.id).change) : token('--bh-nodata')))
    .on('pointerenter', function (event, f) {
      d3.select(this).raise().classed('hover', true);
      const c = byId.get(f.id);
      showTooltip(event, c ? c.name : f.properties.name, c
        ? [
          { value: fmtPct(c.change), label: 'change since 2000', color: color(c.change) },
          { value: `#${c.rank}`, label: `of ${ranked.length} countries` },
        ]
        : [{ value: 'No data', label: '' }]);
    })
    .on('pointermove', moveTooltip)
    .on('pointerleave', function () {
      d3.select(this).classed('hover', false);
      hideTooltip();
    });

  drawChangeLegend(color);
}

function drawChangeLegend(color) {
  const barWidth = 300;
  const barHeight = 10;
  // Declines get 40% of the bar, increases 60%
  const toValue = t => (t < 0.4 ? t / 0.4 - 1 : ((t - 0.4) / 0.6) * 0.6);
  const toPosition = v => (v < 0 ? (v + 1) * 0.4 : 0.4 + (v / 0.6) * 0.6) * barWidth;

  const svg = createSvg('#bh-map-legend', barWidth + 170, 54, 'Color legend for the change in maternal mortality');
  const g = svg.append('g').attr('transform', 'translate(24,22)');

  g.append('text').attr('class', 'legend-text').attr('y', -10).text('Change since 2000');
  g.selectAll('rect.step').data(d3.range(0, 1, 0.01)).join('rect')
    .attr('class', 'step')
    .attr('x', t => t * barWidth).attr('width', barWidth * 0.01 + 0.5).attr('height', barHeight)
    .attr('fill', t => color(toValue(t)));
  g.selectAll('text.tick').data([-1, -0.5, 0, 0.3, 0.6]).join('text')
    .attr('class', 'legend-text tick')
    .attr('x', toPosition).attr('y', barHeight + 16)
    .attr('text-anchor', 'middle')
    .text(v => (v === 0 ? '0%' : fmtPct(v)));

  g.append('rect')
    .attr('x', barWidth + 32).attr('width', barHeight).attr('height', barHeight)
    .attr('fill', token('--bh-nodata'));
  g.append('text').attr('class', 'legend-text')
    .attr('x', barWidth + 32 + barHeight + 6).attr('y', barHeight / 2).attr('dy', '0.32em')
    .text('No data');
}

// Each series indexed to its own 2000 value, so the US rise and the regional declines share one axis
function drawIndexedTrends(data) {
  const years = data.years;
  const series = INDEX_SERIES.map(s => {
    const raw = (s.code === 'USA' ? country(data, 'USA') : aggregate(data, s.code)).mmr;
    return { ...s, values: raw.map(v => (v / raw[0]) * 100) };
  });

  const margin = { top: 28, right: 210, bottom: 40, left: 52 };
  const width = 760;
  const height = 360;
  const x = d3.scaleLinear([years[0], years[years.length - 1]], [margin.left, width - margin.right]);
  const y = d3.scaleLinear([30, 170], [height - margin.bottom, margin.top]);

  const svg = createSvg('#bh-index', width, height, 'Line chart of maternal mortality indexed to 2000 for the US and three regions');

  svg.append('g').attr('class', 'grid')
    .selectAll('line').data([40, 70, 130, 160]).join('line')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', y).attr('y2', y);
  svg.append('line').attr('class', 'reference')
    .attr('x1', margin.left).attr('x2', width - margin.right)
    .attr('y1', y(100)).attr('y2', y(100));
  svg.append('text').attr('class', 'note-label')
    .attr('x', width - margin.right - 4).attr('y', y(100) - 6)
    .attr('text-anchor', 'end')
    .text('2000 level');
  svg.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6, 'd').tickSizeOuter(0));
  svg.append('g').attr('class', 'axis axis-y')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).tickValues([40, 70, 100, 130, 160]).tickSize(0).tickPadding(8));
  svg.append('text').attr('class', 'axis-title')
    .attr('x', margin.left - 30).attr('y', 12)
    .text('Maternal mortality (2000 = 100)');

  const line = d3.line()
    .x((v, i) => x(years[i]))
    .y(v => y(v));

  svg.append('g').selectAll('path')
    .data([...series].sort((a, b) => !!a.highlight - !!b.highlight))
    .join('path')
    .attr('class', d => (d.highlight ? 'line bh-line-us' : 'line bh-line-context'))
    .attr('d', d => line(d.values));

  const end = x(years[years.length - 1]);
  svg.append('g').selectAll('text').data(series).join('text')
    .attr('class', d => (d.highlight ? 'end-label bold' : 'end-label'))
    .attr('x', end + 10)
    .attr('y', d => y(d.values[d.values.length - 1]))
    .attr('dy', '0.32em')
    .text(d => `${d.name} ${fmtPct(d.values[d.values.length - 1] / 100 - 1)}`);

  addCrosshair(svg, {
    x, years, series,
    top: margin.top, bottom: height - margin.bottom,
    left: margin.left, right: width - margin.right,
    format: d3.format('.0f'),
    color: s => token(s.highlight ? '--bh-red' : '--bh-context'),
  });
}
