// Shared helpers for both visualizations.

const fmtInt = d3.format(',');
const fmtPct = d3.format('+.0%');

const REGION_NAMES = {
  WLD: 'World',
  SSF: 'Sub-Saharan Africa',
  SAS: 'South Asia',
  EAS: 'East Asia & Pacific',
  LCN: 'Latin America & Caribbean',
  MEA: 'Middle East & North Africa',
  ECS: 'Europe & Central Asia',
  NAC: 'North America',
  HIC: 'High-income countries',
};

function aggregate(data, code) {
  return data.aggregates.find(a => a.code === code);
}

function country(data, iso3) {
  return data.countries.find(c => c.iso3 === iso3);
}

function percentChange(values) {
  return values[values.length - 1] / values[0] - 1;
}

// Reads a color token from styles.css so charts follow light/dark mode
function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function createSvg(selector, width, height, label) {
  return d3.select(selector).append('svg')
    .attr('viewBox', [0, 0, width, height])
    .attr('role', 'img')
    .attr('aria-label', label);
}

// Horizontal bar with a 4px rounded data end and a square baseline end
function barPath(x0, x1, y, height, radius = 4) {
  const r = Math.min(radius, x1 - x0, height / 2);
  return `M${x0},${y}H${x1 - r}Q${x1},${y} ${x1},${y + r}V${y + height - r}Q${x1},${y + height} ${x1 - r},${y + height}H${x0}Z`;
}

// Vertical column with a 4px rounded data end on top and a square baseline end
function columnPath(x0, x1, yTop, yBase, radius = 4) {
  const r = Math.min(radius, (x1 - x0) / 2, yBase - yTop);
  return `M${x0},${yBase}V${yTop + r}Q${x0},${yTop} ${x0 + r},${yTop}H${x1 - r}Q${x1},${yTop} ${x1},${yTop + r}V${yBase}Z`;
}

function addTable(selector, columns, rows) {
  const table = d3.select(selector).append('table');
  table.append('thead').append('tr')
    .selectAll('th').data(columns).join('th').text(d => d);
  table.append('tbody')
    .selectAll('tr').data(rows).join('tr')
    .selectAll('td').data(d => d).join('td').text(d => d);
}

const tooltip = d3.select('body').append('div')
  .attr('class', 'tooltip')
  .attr('aria-hidden', 'true');

// rows: [{ value, label, color }]. Text goes in with .text(), never .html(), since names come from data files
function showTooltip(event, title, rows) {
  tooltip.selectAll('*').remove();
  tooltip.append('div').attr('class', 'tooltip-title').text(title);
  for (const row of rows) {
    const line = tooltip.append('div').attr('class', 'tooltip-row');
    line.append('span').attr('class', 'tooltip-key').style('background', row.color || 'transparent');
    line.append('strong').text(row.value);
    line.append('span').attr('class', 'tooltip-label').text(row.label);
  }
  tooltip.classed('visible', true);
  moveTooltip(event);
}

function moveTooltip(event) {
  const node = tooltip.node();
  const offset = 14;
  let left = event.clientX + offset;
  let top = event.clientY + offset;
  if (left + node.offsetWidth > window.innerWidth - 8) left = event.clientX - node.offsetWidth - offset;
  if (top + node.offsetHeight > window.innerHeight - 8) top = event.clientY - node.offsetHeight - offset;
  tooltip.style('left', `${left}px`).style('top', `${top}px`);
}

function hideTooltip() {
  tooltip.classed('visible', false);
}

// The tooltip is position: fixed, so it would otherwise float over whatever scrolls under it
window.addEventListener('scroll', hideTooltip, { passive: true });

// Line chart scaffolding shared by the white hat peer chart and the black hat index chart:
// a vertical crosshair that snaps to the nearest year and lists every series in the tooltip.
function addCrosshair(svg, { x, years, top, bottom, left, right, series, format, color }) {
  const crosshair = svg.append('line')
    .attr('class', 'crosshair')
    .attr('y1', top).attr('y2', bottom)
    .style('visibility', 'hidden');

  svg.append('rect')
    .attr('class', 'hit')
    .attr('x', left).attr('y', top)
    .attr('width', right - left).attr('height', bottom - top)
    .on('pointermove', event => {
      const [mx] = d3.pointer(event);
      const i = d3.leastIndex(years, y => Math.abs(x(y) - mx));
      crosshair.attr('x1', x(years[i])).attr('x2', x(years[i])).style('visibility', 'visible');
      const rows = series
        .map(s => ({ value: format(s.values[i]), label: s.name, color: color(s), sort: s.values[i] }))
        .sort((a, b) => b.sort - a.sort);
      showTooltip(event, String(years[i]), rows);
    })
    .on('pointerleave', () => {
      crosshair.style('visibility', 'hidden');
      hideTooltip();
    });
}
