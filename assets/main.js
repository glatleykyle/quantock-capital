// Fills in the tables and charts from trades.js and prices.js,
// so I only have to update the numbers in one place.

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const inResearch = location.pathname.includes('/research/');

function niceDate(s) {
  const d = new Date(s);
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
}

function lastPrice(t) {
  const p = prices[t.code];
  return p[p.length - 1][1];
}

function lastDate(t) {
  const p = prices[t.code];
  return p[p.length - 1][0];
}

function pnl(t) {
  return (lastPrice(t) - t.entry) / t.entry * 100;
}

function pnlText(t) {
  const x = pnl(t);
  return (x > 0 ? '+' : '') + x.toFixed(2) + '%';
}

function pnlClass(t) {
  const x = pnl(t);
  return x > 0 ? 'up' : x < 0 ? 'dn' : 'flat';
}

// Price strip under the header
const strip = document.getElementById('strip');
if (strip) {
  let html = '<span>Prices as of ' + niceDate(lastDate(trades[0])) + '</span>';
  trades.forEach(t => {
    html += '<span>' + t.short + ' <b>' + lastPrice(t).toFixed(2) + '</b> <span class="' + pnlClass(t) + '">' + pnlText(t) + '</span></span>';
  });
  strip.innerHTML = html;
}

// Positions table
document.querySelectorAll('.blotter').forEach(tbody => {
  trades.forEach(t => {
    const link = (inResearch ? '' : 'research/') + t.page;
    tbody.innerHTML += `
      <tr>
        <td>${t.id}</td>
        <td class="l inst"><a href="${link}">${t.name}</a></td>
        <td class="l">${t.direction}</td>
        <td>${niceDate(t.opened)}</td>
        <td>${t.entry.toFixed(2)}</td>
        <td>${lastPrice(t).toFixed(2)}</td>
        <td>${t.stop.toFixed(2)}</td>
        <td>${t.target.toFixed(2)}</td>
        <td class="${pnlClass(t)}">${pnlText(t)}</td>
      </tr>`;
  });
});

// Single values, e.g. <dd data-trade="001" data-f="entry">
document.querySelectorAll('[data-trade]').forEach(el => {
  const t = trades.find(x => x.id === el.dataset.trade);
  const f = el.dataset.f;
  if (f === 'opened') el.textContent = niceDate(t.opened);
  else if (f === 'last') el.textContent = lastPrice(t).toFixed(2);
  else if (f === 'pnl') { el.textContent = pnlText(t); el.className = pnlClass(t); }
  else if (f === 'rr') el.textContent = ((t.target - t.entry) / (t.entry - t.stop)).toFixed(2) + ' to 1';
  else el.textContent = t[f].toFixed(2);
});

document.querySelectorAll('[data-asof]').forEach(el => el.textContent = niceDate(lastDate(trades[0])));
document.querySelectorAll('[data-open]').forEach(el => el.textContent = trades.length);

// Charts (Chart.js), with entry, stop and target drawn as flat lines
Chart.defaults.font.family = 'Public Sans, sans-serif';
Chart.defaults.color = '#8A95A3';

document.querySelectorAll('canvas[data-chart]').forEach(canvas => {
  const t = trades.find(x => x.id === canvas.dataset.chart);
  const data = prices[t.code];
  const labels = data.map(d => niceDate(d[0]));
  const flat = v => data.map(() => v);
  const level = (label, v, colour) => ({
    label: label + ' ' + v.toFixed(2), data: flat(v), borderColor: colour,
    borderWidth: 1, borderDash: [4, 4], pointRadius: 0, pointHoverRadius: 0
  });

  const ctx = canvas.getContext('2d');
  const fill = ctx.createLinearGradient(0, 0, 0, 300);
  fill.addColorStop(0, 'rgba(31, 58, 104, 0.18)');
  fill.addColorStop(1, 'rgba(31, 58, 104, 0)');

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: t.short, data: data.map(d => d[1]), borderColor: '#1F3A68', backgroundColor: fill,
          fill: true, borderWidth: 1.8, pointRadius: 0, pointHoverRadius: 4, tension: 0.15 },
        level('Target', t.target, '#1F3A68'),
        level('Entry', t.entry, '#5A6676'),
        level('Stop', t.stop, '#A3241E')
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 1400, easing: 'easeOutQuart' },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 14, boxHeight: 1, padding: 14 } },
        tooltip: { backgroundColor: '#15202E', displayColors: false, filter: item => item.datasetIndex === 0,
          callbacks: { label: item => item.raw.toFixed(2) + ' EUR/MWh' } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7, maxRotation: 0,
          callback: function (v) { return this.getLabelForValue(v).split(' ').slice(1).join(' '); } } },
        y: { grid: { color: '#EEF1F5' }, border: { display: false } }
      }
    }
  });
});
