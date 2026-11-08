// Loads the data and draws both visualizations. Redraws when the color scheme changes,
// since the map and tooltips read their colors from CSS tokens at draw time.

function render(data, world) {
  d3.selectAll('.chart, .table-view').selectAll('*').remove();
  drawWhiteHat(data);
  drawBlackHat(data, world);
}

Promise.all([
  d3.json('data/maternal_mortality.json'),
  d3.json('data/countries-110m.json'),
]).then(([data, world]) => {
  render(data, world);
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => render(data, world));
});
