// Loads the data and draws both visualizations. Redraws when the color scheme changes,
// since the map and tooltips read their colors from CSS tokens at draw time.

function render(data, world, checkbox) {
  d3.selectAll('.chart, .table-view').selectAll('*').remove();
  drawWhiteHat(data, checkbox);
  drawBlackHat(data, world);
}

Promise.all([
  d3.json('data/maternal_mortality.json'),
  d3.json('data/countries-110m.json'),
  d3.json('data/nchs_checkbox.json'),
]).then(([data, world, checkbox]) => {
  render(data, world, checkbox);
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => render(data, world, checkbox));
});
