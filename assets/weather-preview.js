const weatherMount = document.getElementById('weather-analysis');
const weatherPeriods = {"all":{"label":"January–July 2026","hours":5088,"airMean":12.7,"humidityMean":69.9,"precipitationSum":359.5,"airHours":5088,"humidityHours":5088,"precipitationHours":5039,"soilHours":5042},"01":{"label":"January 2026","hours":744,"airMean":1.6,"humidityMean":85.3,"precipitationSum":41.1,"airHours":744,"humidityHours":744,"precipitationHours":744,"soilHours":744},"02":{"label":"February 2026","hours":672,"airMean":6.1,"humidityMean":86.6,"precipitationSum":100.0,"airHours":672,"humidityHours":672,"precipitationHours":672,"soilHours":672},"03":{"label":"March 2026","hours":744,"airMean":7.6,"humidityMean":73.9,"precipitationSum":39.8,"airHours":744,"humidityHours":744,"precipitationHours":744,"soilHours":744},"04":{"label":"April 2026","hours":720,"airMean":11.6,"humidityMean":63.8,"precipitationSum":16.8,"airHours":720,"humidityHours":720,"precipitationHours":720,"soilHours":720},"05":{"label":"May 2026","hours":744,"airMean":16.2,"humidityMean":68.1,"precipitationSum":72.5,"airHours":744,"humidityHours":744,"precipitationHours":744,"soilHours":744},"06":{"label":"June 2026","hours":720,"airMean":22.3,"humidityMean":60.2,"precipitationSum":43.0,"airHours":720,"humidityHours":720,"precipitationHours":720,"soilHours":720},"07":{"label":"July 2026","hours":744,"airMean":23.1,"humidityMean":52.8,"precipitationSum":46.3,"airHours":744,"humidityHours":744,"precipitationHours":695,"soilHours":698}};
const weatherVariables = {
  air: { name: 'Air temperature', unit: '°C' },
  humidity: { name: 'Relative humidity', unit: '%' },
  soil: { name: 'Soil temperature at 5 cm', unit: '°C' }
};
let weatherPeriod = 'all';
let weatherMode = 'heatmap';
let weatherVariable = 'air';
let weatherRefs;

function weatherElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function weatherNumber(value, decimals = 1) {
  return value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function weatherImageUrl(name) {
  return new URL(`./weather-${name}.png`, import.meta.url).href;
}

function weatherStat(label) {
  const node = weatherElement('div', 'weather-stat');
  const value = weatherElement('p', 'weather-stat-value');
  const detail = weatherElement('p', 'weather-stat-detail');
  node.append(weatherElement('p', 'weather-stat-label', label), value, detail);
  return { node, value, detail };
}

function weatherCard(number, title, description, wide = false) {
  const card = weatherElement('article', `weather-card${wide ? ' weather-summary-card' : ''}`);
  const header = weatherElement('div', 'weather-card-header');
  const heading = weatherElement('div', 'weather-card-heading');
  heading.append(weatherElement('h3', '', title));
  const descriptionNode = weatherElement('p', 'weather-card-description', description);
  header.append(weatherElement('span', 'weather-card-number', number), heading, descriptionNode);
  const button = weatherElement('button', 'weather-figure-button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  const image = weatherElement('img', 'weather-figure');
  image.decoding = 'async';
  image.width = 1254;
  image.height = 931;
  const open = weatherElement('span', 'weather-open-figure', 'Open larger figure ↗');
  button.append(image, open);
  button.addEventListener('click', () => weatherOpenFigure(image, button));
  const note = weatherElement('p', 'weather-chart-note');
  card.append(header, button, note);
  return { card, header, heading, description: descriptionNode, image, button, note };
}

function weatherSetImage(card, filename, alt) {
  const url = weatherImageUrl(filename);
  if (card.image.src !== url) card.image.src = url;
  card.image.alt = alt;
  card.button.setAttribute('aria-label', `Open larger figure: ${alt}`);
}

function weatherUpdate() {
  const period = weatherPeriods[weatherPeriod];
  weatherRefs.air.value.textContent = `${weatherNumber(period.airMean)} °C`;
  weatherRefs.humidity.value.textContent = `${weatherNumber(period.humidityMean)}%`;
  weatherRefs.precipitation.value.textContent = `${weatherNumber(period.precipitationSum)} mm`;
  weatherRefs.air.detail.textContent = `${weatherNumber(period.airHours, 0)} recorded hours`;
  weatherRefs.humidity.detail.textContent = `${weatherNumber(period.humidityHours, 0)} recorded hours`;
  weatherRefs.precipitation.detail.textContent = `${weatherNumber(period.precipitationHours, 0)} hours${period.precipitationHours < period.hours ? ' · incomplete coverage' : ' · selected period total'}`;
  weatherRefs.status.textContent = `${period.label} · ${weatherNumber(period.hours, 0)} hourly timestamps · missing readings: air temperature ${period.hours - period.airHours}, humidity ${period.hours - period.humidityHours}, precipitation ${period.hours - period.precipitationHours}, soil temperature ${period.hours - period.soilHours}.`;
  weatherSetImage(weatherRefs.density, `${weatherPeriod}-density`, `${period.label}: air temperature and relative humidity. Brighter cells contain more hourly observations.`);
  weatherRefs.density.note.textContent = 'Dots are individual observations. Cell colour shows how often similar temperature and humidity occurred together.';
  const heatMap = weatherMode === 'heatmap';
  weatherRefs.heatButton.setAttribute('aria-pressed', String(heatMap));
  weatherRefs.trendButton.setAttribute('aria-pressed', String(!heatMap));
  weatherSetImage(weatherRefs.seasonal, `${weatherPeriod}-${weatherMode}`, heatMap
    ? `${period.label}: observed air temperature by UTC date and hour, on a fixed −10 to 40 °C colour scale.`
    : `${period.label}: daily mean air temperature and soil temperature at 5 cm, in degrees Celsius.`);
  weatherRefs.seasonal.description.textContent = heatMap
    ? 'Read the daily pattern from top to bottom and the season from left to right. The same temperature scale is used for every month.'
    : 'Follow the daily means from the available hourly readings. The dashed line is soil temperature at 5 cm, a separate measurement from air temperature.';
  weatherRefs.seasonal.note.textContent = heatMap
    ? 'Recorded station temperatures, one cell per UTC date and hour. Grey marks missing observations. This is separate from the simulated heat on the aerial photographs.'
    : 'Daily means use the recorded hours that are available. Missing days remain gaps; the plot does not fill in missing readings.';
  const variable = weatherVariables[weatherVariable];
  weatherSetImage(weatherRefs.monthly, `monthly-${weatherVariable}`, `January–July 2026 monthly ${variable.name.toLowerCase()}. Dots show medians and bars span the 25th to 75th percentile of observed hourly values.`);
  weatherRefs.monthly.note.textContent = `All seven months remain visible for comparison. The bars show the spread of observed ${variable.name.toLowerCase()}, not uncertainty in the median.`;
}

function weatherOpenFigure(image, trigger) {
  weatherRefs.largeImage.src = image.src;
  weatherRefs.largeImage.alt = image.alt;
  weatherRefs.largeTitle.textContent = image.alt;
  weatherRefs.dialog.returnFocus = trigger;
  weatherRefs.dialog.showModal();
  weatherRefs.dialog.scrollTop = 0;
}

function weatherBuild() {
  weatherMount.replaceChildren();
  const top = weatherElement('div', 'weather-top');
  const intro = weatherElement('div');
  intro.append(weatherElement('p', 'weather-eyebrow', 'Weather observations · January–July 2026'));
  intro.append(weatherElement('h2', '', 'The weather around these fields'));
  intro.append(weatherElement('p', 'weather-intro', 'See how temperature and humidity changed from winter into summer, and which conditions occurred together. Choose a month for a closer look.'));
  intro.append(weatherElement('p', 'weather-period', 'Rheinstetten · 116 m elevation · all times UTC'));
  const filter = weatherElement('div', 'weather-filter');
  const label = weatherElement('label', '', 'Explore a month'); label.htmlFor = 'weather-month';
  const month = weatherElement('select'); month.id = 'weather-month';
  Object.entries(weatherPeriods).forEach(([key, period]) => {
    const option = weatherElement('option', '', key === 'all' ? 'All · January–July' : period.label.replace(' 2026', ''));
    option.value = key;
    month.append(option);
  });
  month.value = 'all';
  month.addEventListener('change', () => { weatherPeriod = month.value; weatherUpdate(); });
  filter.append(label, month); top.append(intro, filter);
  const context = weatherElement('p', 'weather-context');
  context.append(weatherElement('strong', '', 'Station observations, not field measurements. '), document.createTextNode('These recorded conditions near Karlsruhe provide context for the aerial views. They are not temperatures measured by a drone or within each pictured field.'));
  const stats = weatherElement('div', 'weather-stats');
  const air = weatherStat('Mean air temperature');
  const humidity = weatherStat('Mean relative humidity');
  const precipitation = weatherStat('Recorded precipitation');
  stats.append(air.node, humidity.node, precipitation.node);
  const status = weatherElement('p', 'weather-status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const grid = weatherElement('div', 'weather-chart-grid');
  const density = weatherCard('01', 'Temperature and humidity together', 'Each point is one hour. The cells group nearby readings so you can see which combinations were common.');
  const seasonal = weatherCard('02', 'Recorded temperature through the day', '');
  const modes = weatherElement('div', 'weather-view-toggle'); modes.setAttribute('aria-label', 'Temperature chart view');
  const heatButton = weatherElement('button', '', 'Temperature heat map'); heatButton.type = 'button';
  const trendButton = weatherElement('button', '', 'Daily trend'); trendButton.type = 'button';
  heatButton.addEventListener('click', () => { weatherMode = 'heatmap'; weatherUpdate(); });
  trendButton.addEventListener('click', () => { weatherMode = 'trend'; weatherUpdate(); });
  modes.append(heatButton, trendButton); seasonal.header.append(modes);
  const monthly = weatherCard('03', 'How the months compare', 'The dot is the median: half the readings are above it and half below. The bar spans the middle 50% of readings, showing how conditions varied within each month.', true);
  const variableControl = weatherElement('div', 'weather-variable');
  const variableLabel = weatherElement('label', '', 'Compare'); variableLabel.htmlFor = 'weather-variable';
  const variable = weatherElement('select'); variable.id = 'weather-variable';
  Object.entries(weatherVariables).forEach(([key, info]) => { const option = weatherElement('option', '', info.name); option.value = key; variable.append(option); });
  variable.addEventListener('change', () => { weatherVariable = variable.value; weatherUpdate(); });
  variableControl.append(variableLabel, variable); monthly.heading.append(variableControl);
  grid.append(density.card, seasonal.card, monthly.card);
  const dialog = weatherElement('dialog', 'weather-figure-dialog');
  dialog.setAttribute('aria-labelledby', 'weather-large-title');
  const dialogHeader = weatherElement('div', 'weather-large-heading');
  const largeTitle = weatherElement('h3', '', 'Weather figure'); largeTitle.id = 'weather-large-title';
  const close = weatherElement('button', 'weather-close-figure', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close weather figure'); close.addEventListener('click', () => dialog.close());
  dialogHeader.append(largeTitle, close);
  const largeImage = weatherElement('img', 'weather-large-image');
  dialog.append(dialogHeader, largeImage);
  dialog.addEventListener('close', () => dialog.returnFocus?.focus());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  weatherMount.append(top, context, stats, status, grid, dialog);
  weatherRefs = { air, humidity, precipitation, status, density, seasonal, monthly, heatButton, trendButton, dialog, largeTitle, largeImage };
  weatherUpdate();
}

if (weatherMount) weatherBuild();
