/* CoviSpark dashboard: loads the pipeline results from the Flask API and renders each view. */
(function () {
  'use strict';

  const VIEWS = {
    overview:    ['Overview', 'Global picture across all countries in the dataset'],
    countries:   ['Countries', 'Country-wise totals from the Hadoop MapReduce job'],
    wave:        ['Infection wave', 'Global daily cases and the 7-day rolling average (Spark Job 3)'],
    fatality:    ['Case fatality', 'Where confirmed cases were most likely to be fatal (Spark Job 4)'],
    vaccination: ['Vaccination', 'Share of each population with at least one dose (Spark Job 5)'],
    pipeline:    ['Pipeline', 'Status of every job output the dashboard depends on'],
  };
  const CONTINENT_COLORS = ['#2F6DB5', '#1B998B', '#D98E2B', '#C8414F', '#7A5EA8', '#5B8C3A', '#8A97A8'];

  const data = {};
  const charts = {};
  const ui = { view: 'overview', sortKey: 'total_cases', sortAsc: false, continent: 'All', query: '', range: 'All' };

  const $ = (sel) => document.querySelector(sel);
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  // ── Formatting ─────────────────────────────────────────────
  const intFmt = new Intl.NumberFormat('en-US');
  function compact(n) {
    const a = Math.abs(n);
    if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.round(n));
  }
  function niceDate(iso) {
    const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function ago(iso) {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── Data loading ───────────────────────────────────────────
  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(url + ' → ' + r.status);
    return r.json();
  }

  async function loadData() {
    const [status, summary, countries, top10, continents, waveWeekly, waveDaily, cfr, vax] = await Promise.all([
      getJSON('/api/status'), getJSON('/api/summary'), getJSON('/api/countries'), getJSON('/api/top10'),
      getJSON('/api/continents'), getJSON('/api/wave'), getJSON('/api/wave?step=1'),
      getJSON('/api/cfr'), getJSON('/api/vaccination'),
    ]);
    Object.assign(data, { status, summary, countries, top10, continents, waveWeekly, waveDaily, cfr, vax });
    data.totalCases = continents.reduce((s, r) => s + r.total_cases, 0);
    data.totalDeaths = continents.reduce((s, r) => s + r.total_deaths, 0);
    data.globalCFR = data.totalCases ? (data.totalDeaths / data.totalCases) * 100 : 0;
    data.hasResults = status.files.some((f) => f.ready);
  }

  // ── Chart helpers ──────────────────────────────────────────
  function baseOptions(extra) {
    const grid = css('--grid'), muted = css('--muted');
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.color = muted;
    return Object.assign({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: css('--ink'), titleColor: css('--surface'), bodyColor: css('--surface'),
          padding: 10, cornerRadius: 6, displayColors: false,
        },
      },
      scales: {
        x: { grid: { color: grid }, border: { display: false }, ticks: { color: muted } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { color: muted } },
      },
    }, extra || {});
  }

  function draw(id, config) {
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(document.getElementById(id), config);
  }

  function hbar(id, labels, values, color, valueFmt, extraPlugins) {
    const opts = baseOptions({ indexAxis: 'y' });
    opts.scales.y.grid.display = false;
    opts.scales.x.ticks.callback = (v) => valueFmt(v);
    opts.plugins.tooltip.callbacks = { label: (c) => valueFmt(c.parsed.x) };
    draw(id, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: color, borderRadius: 4, barPercentage: 0.72, categoryPercentage: 0.9 }] },
      options: opts,
      plugins: extraPlugins || [],
    });
  }

  // Vertical reference line on a horizontal bar chart.
  function refLine(value) {
    return {
      id: 'refLine',
      afterDatasetsDraw(chart) {
        const x = chart.scales.x.getPixelForValue(value);
        const { top, bottom } = chart.chartArea;
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = css('--ink-2');
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = css('--ink-2');
        ctx.font = '600 11px ' + Chart.defaults.font.family;
        ctx.fillText('global ' + value.toFixed(2) + '%', x + 5, bottom - 6);
        ctx.restore();
      },
    };
  }

  function waveChart(id, rows, showDaily, showAvg) {
    const cases = css('--cases');
    const opts = baseOptions({ interaction: { mode: 'index', intersect: false } });
    opts.scales.x.grid.display = false;
    opts.scales.x.ticks = Object.assign(opts.scales.x.ticks, { maxTicksLimit: window.innerWidth < 640 ? 4 : 9, maxRotation: 0,
      callback(v) { const d = this.getLabelForValue(v); return d ? niceDate(d).replace(/^\d+ /, '') : ''; } });
    opts.scales.y.ticks.callback = (v) => compact(v);
    opts.plugins.tooltip.displayColors = true;
    opts.plugins.tooltip.callbacks = {
      title: (items) => niceDate(items[0].label),
      label: (c) => ' ' + c.dataset.label + ': ' + intFmt.format(Math.round(c.parsed.y)),
    };
    draw(id, {
      type: 'line',
      data: {
        labels: rows.map((r) => r.date),
        datasets: [
          { label: 'Daily cases', data: rows.map((r) => r.daily_cases), hidden: !showDaily,
            borderColor: 'transparent', backgroundColor: css('--cases-soft'), fill: true, pointRadius: 0, tension: 0.25 },
          { label: '7-day average', data: rows.map((r) => r.rolling_avg), hidden: !showAvg,
            borderColor: cases, borderWidth: 2, pointRadius: 0, tension: 0.35, fill: false },
        ],
      },
      options: opts,
    });
  }

  // ── Views ──────────────────────────────────────────────────
  function renderOverview() {
    $('#kpi-countries').textContent = data.summary.countries || '—';
    $('#kpi-cases').textContent = compact(data.totalCases);
    $('#kpi-cases-note').textContent = intFmt.format(data.totalCases);
    $('#kpi-deaths').textContent = compact(data.totalDeaths);
    $('#kpi-deaths-note').textContent = intFmt.format(data.totalDeaths);
    $('#kpi-cfr').textContent = data.totalCases ? data.globalCFR.toFixed(2) + '%' : '—';
    if (data.waveDaily.length) {
      const peak = data.waveDaily.reduce((a, b) => (b.rolling_avg > a.rolling_avg ? b : a));
      $('#kpi-peak').textContent = compact(peak.rolling_avg);
      $('#kpi-peak-note').textContent = 'on ' + niceDate(peak.date);
    }

    waveChart('ov-wave', data.waveWeekly, true, true);
    hbar('ov-top10', data.top10.map((r) => r.country), data.top10.map((r) => r.total_cases), css('--cases'), compact);

    const conts = data.continents;
    draw('ov-continents', {
      type: 'doughnut',
      data: { labels: conts.map((r) => r.continent),
              datasets: [{ data: conts.map((r) => r.total_cases), backgroundColor: CONTINENT_COLORS,
                           borderColor: css('--surface'), borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '64%',
                 plugins: { legend: { display: false },
                            tooltip: { callbacks: { label: (c) => ' ' + c.label + ': ' + compact(c.parsed) } } } },
    });
    $('#continent-legend').innerHTML = conts.map((r, i) =>
      `<li><span class="sw" style="background:${CONTINENT_COLORS[i % CONTINENT_COLORS.length]}"></span>
           <span>${esc(r.continent)}</span>
           <span class="val"><b>${(r.total_cases / data.totalCases * 100).toFixed(1)}%</b>${compact(r.total_cases)}</span></li>`).join('');
  }

  function renderCountries() {
    const chips = ['All', ...new Set(data.countries.map((r) => r.continent))].sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)));
    $('#continent-chips').innerHTML = chips.map((c) =>
      `<button class="chip${c === ui.continent ? ' active' : ''}" data-continent="${esc(c)}">${esc(c)}</button>`).join('');

    const q = ui.query.toLowerCase();
    let rows = data.countries.filter((r) =>
      (ui.continent === 'All' || r.continent === ui.continent) && r.country.toLowerCase().includes(q));
    const k = ui.sortKey;
    rows.sort((a, b) => {
      const v = typeof a[k] === 'string' ? a[k].localeCompare(b[k]) : a[k] - b[k];
      return ui.sortAsc ? v : -v;
    });

    const total = data.countries.reduce((s, r) => s + r.total_cases, 0) || 1;
    const maxShare = Math.max(...data.countries.map((r) => r.total_cases / total), 0.0001);
    $('#country-table tbody').innerHTML = rows.map((r) => {
      const share = r.total_cases / total;
      return `<tr>
        <td><b>${esc(r.country)}</b></td>
        <td><span class="tag">${esc(r.continent)}</span></td>
        <td class="num">${intFmt.format(r.total_cases)}</td>
        <td><div class="share"><div class="share-bar"><i style="width:${(share / maxShare * 100).toFixed(1)}%"></i></div><span>${(share * 100).toFixed(1)}%</span></div></td>
        <td class="num">${intFmt.format(r.total_deaths)}</td>
        <td class="num${r.cfr_pct > data.globalCFR ? ' cfr-high' : ''}">${r.cfr_pct.toFixed(2)}%</td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" style="color:var(--muted)">No countries match.</td></tr>';

    document.querySelectorAll('#country-table th[data-sort]').forEach((th) => {
      th.classList.toggle('sorted', th.dataset.sort === k);
      th.classList.toggle('asc', th.dataset.sort === k && ui.sortAsc);
    });
    $('#country-foot').textContent = `Showing ${rows.length} of ${data.countries.length} countries · CFR in red is above the global rate of ${data.globalCFR.toFixed(2)}%`;
  }

  function renderWave() {
    const years = [...new Set(data.waveDaily.map((r) => r.date.slice(0, 4)))];
    const ranges = ['All', ...years];
    $('#wave-range').innerHTML = ranges.map((r) =>
      `<button data-range="${r}" class="${r === ui.range ? 'active' : ''}">${r}</button>`).join('');
    const rows = ui.range === 'All' ? data.waveDaily : data.waveDaily.filter((r) => r.date.startsWith(ui.range));
    if (!rows.length) return;

    const peak = rows.reduce((a, b) => (b.rolling_avg > a.rolling_avg ? b : a));
    const low = rows.reduce((a, b) => (b.rolling_avg < a.rolling_avg ? b : a));
    const mean = rows.reduce((s, r) => s + r.daily_cases, 0) / rows.length;
    $('#w-peak').textContent = compact(peak.rolling_avg);
    $('#w-peak-note').textContent = niceDate(peak.date);
    $('#w-low').textContent = compact(low.rolling_avg);
    $('#w-low-note').textContent = niceDate(low.date);
    $('#w-mean').textContent = compact(mean);
    $('#w-mean-note').textContent = `${rows.length} days · ${ui.range === 'All' ? 'full range' : ui.range}`;
    waveChart('wave-chart', rows, $('#show-daily').checked, $('#show-avg').checked);
  }

  function renderFatality() {
    $('#cfr-global').textContent = data.globalCFR.toFixed(2) + '%';
    const pct = (v) => v.toFixed(2) + '%';
    hbar('cfr-chart', data.cfr.map((r) => r.country), data.cfr.map((r) => r.cfr_pct), css('--deaths'), pct,
         [refLine(data.globalCFR)]);
    $('#cfr-table').innerHTML = data.cfr.slice(0, 5).map((r) =>
      `<div class="mini-row"><b>${esc(r.country)}</b><span>${compact(r.total_deaths)} / ${compact(r.total_cases)}</span><b>${r.cfr_pct.toFixed(2)}%</b></div>`).join('');
  }

  function renderVaccination() {
    const pct = (v) => v.toFixed(0) + '%';
    hbar('vax-chart', data.vax.map((r) => r.country), data.vax.map((r) => r.vax_pct), css('--vax'),
         (v) => (Number.isInteger(v) ? pct(v) : v.toFixed(2) + '%'));
    charts['vax-chart'].options.scales.x.max = 100;
    charts['vax-chart'].update();
    $('#vax-list').innerHTML = data.vax.map((r) =>
      `<li><div class="row"><b>${esc(r.country)}</b><span>${compact(r.vaccinated)} people · ${r.vax_pct.toFixed(1)}%</span></div>
           <div class="bar"><i style="width:${Math.min(r.vax_pct, 100)}%"></i></div></li>`).join('');
  }

  function renderPipeline() {
    $('#status-table tbody').innerHTML = data.status.files.map((f) => `<tr>
      <td><b>${esc(f.stage)}</b></td>
      <td>${esc(f.description)}</td>
      <td><code>${esc(f.file)}</code></td>
      <td class="num">${f.ready ? intFmt.format(f.records) : '—'}</td>
      <td>${f.updated ? new Date(f.updated).toLocaleString() : '—'}</td>
      <td>${f.ready ? '<span class="status ok">Ready</span>' : '<span class="status missing">Missing</span>'}</td>
    </tr>`).join('');
  }

  const RENDER = { overview: renderOverview, countries: renderCountries, wave: renderWave,
                   fatality: renderFatality, vaccination: renderVaccination, pipeline: renderPipeline };

  // ── Shell ──────────────────────────────────────────────────
  function updateFreshness() {
    const el = $('#freshness'), txt = $('#freshness-text');
    const times = data.status.files.filter((f) => f.updated).map((f) => new Date(f.updated).getTime());
    el.classList.remove('ok', 'warn');
    if (data.status.ready) {
      el.classList.add('ok');
      txt.textContent = 'Results updated ' + ago(new Date(Math.max(...times)).toISOString());
    } else if (times.length) {
      el.classList.add('warn');
      txt.textContent = 'Some job outputs are missing';
    } else {
      el.classList.add('warn');
      txt.textContent = 'No results yet';
    }
  }

  function show(view) {
    if (!VIEWS[view]) view = 'overview';
    ui.view = view;
    document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    $('#view-title').textContent = VIEWS[view][0];
    $('#view-sub').textContent = VIEWS[view][1];
    const empty = !data.hasResults && view !== 'pipeline';
    $('#empty').hidden = !empty;
    Object.keys(VIEWS).forEach((v) => { $('#view-' + v).hidden = empty || v !== view; });
    closeMenu();
    if (!empty) RENDER[view]();
    window.scrollTo(0, 0);
  }

  function closeMenu() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }

  async function refresh() {
    const btn = $('#refresh-btn');
    btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
    try {
      await loadData();
      updateFreshness();
      show(ui.view);
    } catch (e) {
      $('#freshness-text').textContent = 'Could not reach the API';
      $('#freshness').classList.add('warn');
      console.error(e);
    }
  }

  // ── Events ─────────────────────────────────────────────────
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  $('#refresh-btn').addEventListener('click', refresh);
  $('#theme-btn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('covispark-theme', next);
    if (data.status) show(ui.view);
  });
  $('#menu-btn').addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); });
  $('#scrim').addEventListener('click', closeMenu);

  $('#country-search').addEventListener('input', (e) => { ui.query = e.target.value; renderCountries(); });
  $('#continent-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-continent]');
    if (b) { ui.continent = b.dataset.continent; renderCountries(); }
  });
  document.querySelectorAll('#country-table th[data-sort]').forEach((th) => th.addEventListener('click', () => {
    const k = th.dataset.sort;
    if (ui.sortKey === k) ui.sortAsc = !ui.sortAsc;
    else { ui.sortKey = k; ui.sortAsc = typeof data.countries[0]?.[k] === 'string'; }
    renderCountries();
  }));
  $('#wave-range').addEventListener('click', (e) => {
    const b = e.target.closest('[data-range]');
    if (b) { ui.range = b.dataset.range; renderWave(); }
  });
  ['#show-daily', '#show-avg'].forEach((s) => $(s).addEventListener('change', renderWave));

  ui.view = location.hash.slice(1) || 'overview';
  refresh();
})();
