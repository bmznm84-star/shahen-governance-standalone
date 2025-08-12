
// RTL, Dark Mode, Global Descending Sort, Data Binding
const state = {
  dark: localStorage.getItem('theme') === 'dark',
  descending: localStorage.getItem('descending') !== 'false', // default true
  data: null
};

function toggleDark() {
  state.dark = !state.dark;
  document.documentElement.classList.toggle('dark', state.dark);
  localStorage.setItem('theme', state.dark ? 'dark' : 'light');
}
function toggleSort() {
  state.descending = !state.descending;
  localStorage.setItem('descending', state.descending ? 'true' : 'false');
  renderAll();
}

document.addEventListener('DOMContentLoaded', async () => {
  // set theme immediately
  if (state.dark) document.documentElement.classList.add('dark');
  try {
    const res = await fetch('data/data.json');
    state.data = await res.json();
    renderAll();
  } catch (e) {
    console.error('Failed to load data.json', e);
  }
});

function sortByKey(arr, key) {
  const dir = state.descending ? -1 : 1;
  return arr.slice().sort((a,b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
}

function numberFmt(n) {
  if (n === null || n === undefined) return '-';
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n/1_000).toFixed(1) + 'K';
  return new Intl.NumberFormat('ar-SA').format(n);
}

function percentFmt(n) {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 1 }).format(n) + '%';
}

function renderKPIs() {
  const d = state.data;
  const totalShip = d.shipments.reduce((s,x)=>s+x.count,0);
  const latestYear = sortByKey(d.shipments,'year')[0].year;
  const latestIncidents = d.incidents.find(x => x.year === 2023)?.count ?? null;
  const employees = d.kpis.employees;
  const saud = d.kpis.saudization;

  document.getElementById('kpi-shipments').textContent = numberFmt(totalShip);
  document.getElementById('kpi-latest-year').textContent = latestYear;
  document.getElementById('kpi-incidents').textContent = numberFmt(latestIncidents);
  document.getElementById('kpi-employees').textContent = numberFmt(employees);
  document.getElementById('kpi-saudization').textContent = percentFmt(saud);
}

let chartShipments, chartIncidents;
function renderCharts() {
  const d = state.data;

  // Shipments chart
  const shipments = sortByKey(d.shipments, 'year');
  const shLabels = shipments.map(x=>x.year);
  const shData = shipments.map(x=>x.count);
  const ctx1 = document.getElementById('chartShipments').getContext('2d');
  if (chartShipments) chartShipments.destroy();
  chartShipments = new Chart(ctx1, {
    type: 'line',
    data: { labels: shLabels, datasets: [{ label: 'عدد الشحنات السنوي', data: shData }]},
    options: { responsive: true, plugins: { legend: { display: false }}, scales: { y: { beginAtZero: true } } }
  });

  // Incidents chart
  const incidents = sortByKey(d.incidents, 'year');
  const inLabels = incidents.map(x=>x.year);
  const inData = incidents.map(x=>x.count);
  const ctx2 = document.getElementById('chartIncidents').getContext('2d');
  if (chartIncidents) chartIncidents.destroy();
  chartIncidents = new Chart(ctx2, {
    type: 'bar',
    data: { labels: inLabels, datasets: [{ label: 'الحوادث المرورية الجسيمة', data: inData }]},
    options: { responsive: true, plugins: { legend: { display: false }}, scales: { y: { beginAtZero: true } } }
  });

  // Regions (list)
  const regions = sortByKey(d.regions, 'share');
  const ul = document.getElementById('regions-list');
  ul.innerHTML = '';
  regions.forEach(r => {
    const li = document.createElement('li');
    li.className = 'flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800';
    li.innerHTML = `<span class="font-medium">${r.name}</span><span class="badge">${percentFmt(r.share)}</span>`;
    ul.appendChild(li);
  });

  // Cargo Types
  const types = sortByKey(d.cargo_types,'count');
  const tBody = document.getElementById('cargo-tbody');
  tBody.innerHTML = '';
  types.forEach((t,i)=>{
    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-100 dark:border-slate-800';
    tr.innerHTML = `<td class="py-2">${i+1}</td><td>${t.type}</td><td class="text-end">${numberFmt(t.count)}</td>`;
    tBody.appendChild(tr);
  });
}

function renderAll() {
  if (!state.data) return;
  // set icon text for sort
  const btn = document.getElementById('btn-sort');
  btn.innerText = state.descending ? '↧ فرز تنازلي' : '↥ فرز تصاعدي';
  renderKPIs();
  renderCharts();
}
