function parseCSV(text){
  const [hdrLine, ...lines] = text.trim().split(/\r?\n/);
  const keys = hdrLine.split(",");
  return lines.filter(Boolean).map(l => {
    const vals = l.split(",");
    return Object.fromEntries(vals.map((v,i)=>[keys[i], v]));
  });
}

// Global state
let byItem = {};
let chart;
let currentItem;
let currentLvl;
let itemConfig;
let currentCategory = null;
let currentTimeRangeDays = 30;
let showPoints = true;

const itemLinks = document.getElementById('itemLinks');
const levelButtons = document.getElementById('levelButtons');
const chartCanvas = document.getElementById('chart');
const timeRangeButtons = document.getElementById('timeRangeButtons');

function updateItemName() {
  const itemName = currentItem ? currentItem.replace('/items/', '').replace(/_/g, ' ') : '';
  const currentItemNameEl = document.getElementById('currentItemName');
  let nameContent = itemName;

  if (currentItem && itemConfig && itemConfig.ItemTokenPrices && itemConfig.ItemTokenPrices[currentItem]) {
    const tokenPrice = itemConfig.ItemTokenPrices[currentItem];
    if (currentLvl && byItem[currentItem] && byItem[currentItem][currentLvl]) {
        const series = byItem[currentItem][currentLvl];
        if (series.length > 0) {
            const sortedSeries = [...series].sort((a,b)=>a.t-b.t);
            const lastBid = sortedSeries[sortedSeries.length - 1].bid;
            if (lastBid && tokenPrice > 0) {
                const moneyPerToken = (lastBid / tokenPrice).toFixed(2);
                nameContent += ` (${tokenPrice} — ${moneyPerToken}/token)`;
            } else {
                 nameContent += ` (${tokenPrice} tokens)`;
            }
        } else {
            nameContent += ` (${tokenPrice} tokens)`;
        }
    } else {
        nameContent += ` (${tokenPrice} tokens)`;
    }
  }
  currentItemNameEl.textContent = nameContent;
}

function draw(){
  if (!currentItem || !currentLvl || !byItem[currentItem] || !byItem[currentItem][currentLvl]) {
    chart?.destroy();
    chart = null;
    return;
  }
  const series = byItem[currentItem][currentLvl];
  series.sort((a,b)=>a.t-b.t);
  const cutoff = new Date(Date.now() - currentTimeRangeDays * 24 * 60 * 60 * 1000);
  const filtered = series.filter(p => p.t >= cutoff);
  const askData = filtered.map(p => ({ x: p.t, y: p.ask }));
  const bidData = filtered.map(p => ({ x: p.t, y: p.bid }));

  const style = getComputedStyle(document.body);
  const textColor  = style.getPropertyValue('--text-color').trim();
  const borderClr  = style.getPropertyValue('--border-color').trim();
  const askColor   = style.getPropertyValue('--ask-color').trim() || '#00e5ff';
  const bidColor   = style.getPropertyValue('--bid-color').trim() || '#ffa040';

  const cfg = {
    type:'line',
    data:{
      datasets:[
        {
          label:'Ask',
          data:askData,
          borderWidth: 1.5,
          tension: 0.1,
          stepped: 'before',
          borderColor: askColor,
          backgroundColor: askColor.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', 'rgba(') || 'rgba(0,229,255,0.08)',
          pointBackgroundColor: askColor,
          pointBorderColor: askColor,
        },
        {
          label:'Bid',
          data:bidData,
          borderWidth: 1.5,
          tension: 0.1,
          stepped: 'before',
          borderColor: bidColor,
          backgroundColor: bidColor.replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', 'rgba(') || 'rgba(255,160,64,0.08)',
          pointBackgroundColor: bidColor,
          pointBorderColor: bidColor,
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio: false,
      scales:{
        x:{
          type: 'time',
          time: { unit: 'day', displayFormats: { day: 'MMM dd' } },
          ticks: { color: textColor, font: { family: "'Roboto', sans-serif", size: 11 } },
          grid: { color: borderClr }
        },
        y:{
          position: 'right',
          beginAtZero:false,
          ticks: { color: textColor, font: { family: "'Roboto', sans-serif", size: 11 } },
          grid: { color: borderClr }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: { family: "'Roboto', sans-serif", size: 11 },
            boxWidth: 14,
            padding: 16
          }
        }
      },
      elements: {
        point: { radius: showPoints ? 3 : 0, hoverRadius: showPoints ? 5 : 0, hitRadius: showPoints ? 5 : 0 }
      }
    }
  };
  chart?.destroy();
  chart = new Chart(chartCanvas, cfg);
}

function selectLevel(level) {
  currentLvl = level;
  document.querySelectorAll('#levelButtons button').forEach(b => {
    b.classList.toggle('active', b.dataset.level === level);
  });
  updateItemName();
  draw();
}

function selectItem(item) {
  currentItem = item;
  document.querySelectorAll('#itemLinks a').forEach(a => {
    a.classList.toggle('active', a.dataset.item === item);
  });

  levelButtons.innerHTML = '';
  const levels = Object.keys(byItem[item] || {}).sort((a,b)=>a-b);

  if (levels.length > 1) {
    for (const lvl of levels) {
      const btn = document.createElement('button');
      btn.textContent = `+${lvl}`;
      btn.dataset.level = lvl;
      btn.onclick = () => selectLevel(lvl);
      levelButtons.appendChild(btn);
    }
  }

  selectLevel(levels[0] || null);
}

function renderTimeRangeButtons() {
  if (!timeRangeButtons) return;
  timeRangeButtons.innerHTML = '';
  const ranges = [30, 15, 7, 3];
  for (const days of ranges) {
    const btn = document.createElement('button');
    btn.textContent = `${days}D`;
    btn.dataset.days = String(days);
    if (days === currentTimeRangeDays) btn.classList.add('active');
    btn.onclick = () => {
      currentTimeRangeDays = days;
      document.querySelectorAll('#timeRangeButtons button').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.days) === currentTimeRangeDays);
      });
      draw();
    };
    timeRangeButtons.appendChild(btn);
  }

  const ptsWrap = document.createElement('label');
  ptsWrap.style.cssText = 'display:inline-flex;align-items:center;gap:0.35rem;margin-left:0.4rem;';

  const ptsInput = document.createElement('input');
  ptsInput.type = 'checkbox';
  ptsInput.id = 'pointsToggle';
  ptsInput.checked = showPoints;
  ptsInput.addEventListener('change', () => { showPoints = ptsInput.checked; draw(); });

  const ptsText = document.createElement('span');
  ptsText.textContent = 'POINTS';

  ptsWrap.appendChild(ptsInput);
  ptsWrap.appendChild(ptsText);
  timeRangeButtons.appendChild(ptsWrap);
}

function renderTrendTable(trends_3d, trends_7d, trends_30d) {
  const container = document.getElementById('trendTableContainer');
  container.innerHTML = '';

  if ((!trends_3d || !trends_3d.length) && (!trends_7d || !trends_7d.length) && (!trends_30d || !trends_30d.length)) return;

  const tabsDiv = document.createElement('div');
  tabsDiv.id = 'trendTabs';

  const tab3d = document.createElement('button');
  tab3d.textContent = '3 DAYS';
  tab3d.className = 'trend-tab active';
  tab3d.onclick = () => switchTrendTab('3d');

  const tab7d = document.createElement('button');
  tab7d.textContent = '7 DAYS';
  tab7d.className = 'trend-tab';
  tab7d.onclick = () => switchTrendTab('7d');

  const tab30d = document.createElement('button');
  tab30d.textContent = '30 DAYS';
  tab30d.className = 'trend-tab';
  tab30d.onclick = () => switchTrendTab('30d');

  tabsDiv.appendChild(tab3d);
  tabsDiv.appendChild(tab7d);
  tabsDiv.appendChild(tab30d);

  const panel3d  = createTrendPanel(trends_3d  || [], '3d');
  const panel7d  = createTrendPanel(trends_7d  || [], '7d');
  const panel30d = createTrendPanel(trends_30d || [], '30d');

  const heading = document.createElement('h4');
  heading.textContent = 'MARKET TRENDS';
  heading.style.marginTop = '0';

  const note = document.createElement('p');
  note.className = 'trend-note';
  note.innerHTML =
    'Price is <strong>midpoint</strong> of ask &amp; bid — or whichever is available. ' +
    '<strong>Δ%</strong> = change from first to last price in the window. ' +
    '<strong>Ups/Downs</strong> = consecutive price increases/decreases. ' +
    '<strong>Type</strong> = trend shape (requires R²≥0.7 to be called Up/Downtrend; otherwise Flat, Volatile, or Uncertain). ' +
    'Items with &lt;5 data points or tiny absolute moves are excluded.';

  container.appendChild(heading);
  container.appendChild(tabsDiv);
  container.appendChild(panel3d);
  container.appendChild(panel7d);
  container.appendChild(panel30d);
  container.appendChild(note);
}

function createTrendPanel(trends, id) {
  const panel = document.createElement('div');
  panel.className = `trend-panel${id === '3d' ? ' active' : ''}`;
  panel.id = `trendTable_${id}`;

  const positive = trends.filter(e => e.percent > 0).sort((a,b) => b.percent - a.percent).slice(0, 10);
  const negative = trends.filter(e => e.percent < 0).sort((a,b) => a.percent - b.percent).slice(0, 10);

  panel.appendChild(buildHalfTable(positive, 'GAINERS', 'pos'));
  panel.appendChild(buildHalfTable(negative, 'LOSERS', 'neg'));

  return panel;
}

function buildHalfTable(trends, label, side) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'flex:1;min-width:0;';

  const sublabel = document.createElement('div');
  sublabel.className = `trend-sublabel trend-sublabel-${side}`;
  sublabel.textContent = label;
  wrap.appendChild(sublabel);

  const table = document.createElement('table');
  table.className = 'trend-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Item</th>
        <th>Δ%</th>
        <th>Ups</th>
        <th>Downs</th>
        <th>Type</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  for (const entry of trends) {
    const pct = entry.percent;
    const pctClass = pct > 0 ? 'pct-pos' : pct < 0 ? 'pct-neg' : '';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.item.replace('/items/', '').replace(/_/g, ' ')}</td>
      <td class="${pctClass}">${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</td>
      <td>${entry.ups}</td>
      <td>${entry.downs}</td>
      <td>${entry.trend}</td>
    `;
    tbody.appendChild(tr);
  }

  wrap.appendChild(table);
  return wrap;
}

function switchTrendTab(period) {
  document.querySelectorAll('.trend-tab').forEach(tab => tab.classList.remove('active'));
  if (period === '3d') {
    document.querySelector('#trendTabs button:first-child').classList.add('active');
  } else if (period === '7d') {
    document.querySelector('#trendTabs button:nth-child(2)').classList.add('active');
  } else {
    document.querySelector('#trendTabs button:last-child').classList.add('active');
  }
  document.querySelectorAll('.trend-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`trendTable_${period}`).classList.add('active');
}

async function loadAndInjectSvgSprite(spriteGzUrl, injectedId = "svg-sprite") {
  try {
    const res = await fetch(spriteGzUrl);
    if (!res.ok) throw new Error(`Failed to fetch sprite: ${res.status}`);
    const gzBuffer = await res.arrayBuffer();
    const svgText = new TextDecoder().decode(pako.ungzip(gzBuffer));
    document.getElementById(injectedId)?.remove();
    const div = document.createElement("div");
    div.id = injectedId;
    div.style.display = "none";
    div.innerHTML = svgText;
    document.body.prepend(div);
  } catch (e) {
    console.error("Failed to load SVG sprite:", e);
  }
}

function renderCategoryTabs(itemConfig) {
  const tabs = Object.keys(itemConfig).filter(
    k => Array.isArray(itemConfig[k]) && k !== "ItemTokenPrices"
  );
  const categoryTabs = document.getElementById('categoryTabs');
  categoryTabs.innerHTML = '';
  tabs.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = 'category-tab' + (cat === currentCategory ? ' active' : '');
    btn.onclick = () => {
      currentCategory = cat;
      renderItemsForCategory(cat, itemConfig);
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    categoryTabs.appendChild(btn);
  });

  if (!currentCategory && tabs.length > 0) {
    currentCategory = tabs[0];
    renderItemsForCategory(tabs[0], itemConfig);
    document.querySelector('.category-tab').classList.add('active');
  }
}

function renderItemsForCategory(category, itemConfig) {
  const items = itemConfig[category] || [];
  itemLinks.innerHTML = '';

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(40px, 40px))';
  grid.style.gap = '0.5rem';
  grid.style.padding = '0.25rem';
  grid.style.maxHeight = '60vh';
  grid.style.overflowY = 'auto';
  grid.style.width = '100%';
  grid.style.boxSizing = 'border-box';

  const availableItems = items.filter(itm => byItem[itm]);

  for (const itm of availableItems) {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.item = itm;
    link.title = itm.replace('/items/', '').replace(/_/g, ' ');
    link.style.cssText = 'display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:4px;box-sizing:border-box;position:relative;cursor:pointer;';

    link.onclick = (e) => {
      e.preventDefault();
      selectItem(itm);
      document.querySelectorAll('#itemLinks a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    };

    const iconId = itm.replace('/items/', '');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '28');
    svg.setAttribute('height', '28');
    svg.style.filter = 'brightness(1.1)';

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${iconId}`);
    svg.appendChild(use);
    link.appendChild(svg);

    grid.appendChild(link);
  }

  itemLinks.appendChild(grid);

  if (availableItems.length > 0) {
    selectItem(availableItems[0]);
  }
}

function populateUI(newByItem, newItemConfig, trends_3d, trends_7d, trends_30d) {
  try {
    itemLinks.innerHTML = '';
    levelButtons.innerHTML = '';
    chart?.destroy();
    chart = null;
    document.getElementById('currentItemName').textContent = '';
    byItem = newByItem;
    itemConfig = newItemConfig;
    document.getElementById('trendTableContainer').innerHTML = '';

    renderCategoryTabs(itemConfig);

    if ((trends_3d && trends_3d.length) || (trends_7d && trends_7d.length) || (trends_30d && trends_30d.length)) {
      renderTrendTable(trends_3d, trends_7d, trends_30d);
    }
  } catch (e) {
    console.error(e);
    alert('Error loading data: ' + e);
  }
}

function updateLastDataInfo(rows) {
  if (!rows || !rows.length) {
    document.getElementById('lastDataInfo').textContent = '';
    return;
  }
  const latestTs = Math.max(...rows.map(r => r[0]));
  const dt = new Date(latestTs * 1000);
  const dateStr = dt.toLocaleDateString();
  const timeStr = dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const ageHours = (Date.now() - latestTs * 1000) / 3600000;
  const statusColor = ageHours < 12 ? 'var(--pos-color)' : ageHours < 24 ? 'var(--bid-color)' : 'var(--neg-color)';
  const statusLabel = ageHours < 12 ? 'LIVE' : ageHours < 24 ? 'RECENT' : 'STALE';
  const el = document.getElementById('lastDataInfo');
  el.innerHTML = `SYNC: ${dateStr} ${timeStr} <span style="color:${statusColor}">[${statusLabel}]</span>`;
}

function parseCompactData(buffer) {
    const text = new TextDecoder().decode(pako.ungzip(buffer));
    const {items, rows, config, trends_3d, trends_7d, trends_30d} = JSON.parse(text);
    updateLastDataInfo(rows);

    const newByItem = {};
    for (const [ts, idx, lvl, ask, bid] of rows){
        const it = items[idx];
        (newByItem[it] ??= {})[lvl] ??= [];
        newByItem[it][lvl].push({ t: new Date(ts*1000), ask, bid });
    }
    return {newByItem, config, trends_3d, trends_7d, trends_30d};
}

async function loadInitialData() {
    try {
        const res = await fetch('market.compact.json.gz');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const buffer = await res.arrayBuffer();
        const {newByItem, config, trends_3d, trends_7d, trends_30d} = parseCompactData(buffer);
        populateUI(newByItem, config, trends_3d, trends_7d, trends_30d);
    } catch (e) {
        console.log("Could not load initial data.", e);
    }
}

async function main() {
  // Set Roboto as Chart.js default font
  Chart.defaults.font.family = "'Roboto', sans-serif";

  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  body.dataset.theme = savedTheme;
  themeToggle.checked = savedTheme === 'dark';

  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    body.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    draw();
  });

  await loadAndInjectSvgSprite('items_sprite_filtered.svg.gz');
  renderTimeRangeButtons();
  loadInitialData();
}
main();
