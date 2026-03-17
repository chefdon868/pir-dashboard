'use client';

export default function Dashboard() {
  const handleProcessReports = async () => {
    const flashFile = document.getElementById('flashFile').files[0];
    const transferFile = document.getElementById('transferFile').files[0];
    
    if (!flashFile || !transferFile) {
      document.getElementById('errorMsg').textContent = 'Upload both Flash and Transfer reports';
      document.getElementById('error').style.display = 'block';
      return;
    }

    try {
      document.getElementById('error').style.display = 'none';
      const flashWb = await readExcelFile(flashFile);
      const transferWb = await readExcelFile(transferFile);
      
      const flashData = parseFlashReport(flashWb);
      const transferData = parseTransferReport(transferWb);
      
      saveData(flashData, transferData);
      renderDashboard(flashData, transferData);
    } catch (err) {
      document.getElementById('errorMsg').textContent = err.message;
      document.getElementById('error').style.display = 'block';
    }
  };

  const handleSaveSetup = () => {
    const setup = {
      monthlyRevBudget: parseFloat(document.getElementById('monthlyRevBudget').value) || 237800,
      monthlyFoodBudget: parseFloat(document.getElementById('monthlyFoodBudget').value) || 77646,
      costTarget: parseFloat(document.getElementById('costTarget').value) || 32,
      orderingDays: parseInt(document.getElementById('orderingDays').value) || 11
    };
    
    let data = JSON.parse(localStorage.getItem('pir_dashboard_data') || '{"entries":[]}');
    data.setup = setup;
    localStorage.setItem('pir_dashboard_data', JSON.stringify(data));
    
    alert('Monthly setup saved');
    loadDashboard();
  };

  return (
    <div style={{ background: '#0f1419', color: '#e0e0e0', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh' }}>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }}>PIR Kitchen Food Cost Dashboard</h1>
          <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0 0' }}>Plantation Island Resort | March 2026</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Ordering Days This Month</p>
          <p style={{ fontSize: '20px', fontWeight: 500, color: '#fff', margin: '4px 0' }}>11</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>MTD Food Spend</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }} id="mtdSpend">$0</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>11 ordering days max</p>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>Daily Budget / Day</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }} id="dailyBudget">$0</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>Monthly Budget ÷ 11</p>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>Last Order Total</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }} id="lastOrder">$0</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>Most recent transfer</p>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #ff6b6b', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>Running Food Cost %</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#ff9999' }} id="foodCostPct">0%</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>Actual vs Target</p>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>MTD Revenue (F&B)</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }} id="mtdRevenue">$0</p>
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>From daily flash</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>Outlet Spend — Latest Transfer</h3>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3142' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500 }}>Outlet</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Spend ($)</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Vs Budget</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody id="outletTable">
              <tr style={{ borderBottom: '1px solid #2a3142' }}>
                <td style={{ padding: '8px 0', color: '#ccc' }}>—</td>
                <td style={{ textAlign: 'right', padding: '8px 0', color: '#888' }}>Upload to load</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>Daily Flash — Revenue by Outlet</h3>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a3142' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500 }}>Outlet</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Covers</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Revenue ($)</th>
                <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Check Avg</th>
              </tr>
            </thead>
            <tbody id="revenueTable">
              <tr style={{ borderBottom: '1px solid #2a3142' }}>
                <td style={{ padding: '8px 0', color: '#ccc' }}>—</td>
                <td style={{ textAlign: 'right', padding: '8px 0', color: '#888' }}>Upload to load</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>MTD Cumulative Spend vs Budget</h3>
          <div style={{ position: 'relative', height: '200px' }}>
            <canvas id="cumulativeChart" style={{ width: '100%' }}></canvas>
          </div>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>Spend Distribution by Outlet</h3>
          <div style={{ position: 'relative', height: '200px' }}>
            <canvas id="pieChart" style={{ width: '100%' }}></canvas>
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 16px', color: '#fff', textTransform: 'uppercase' }}>Monthly Setup</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <input type="number" id="monthlyRevBudget" placeholder="e.g. 237800" style={{ padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
          <input type="number" id="monthlyFoodBudget" placeholder="e.g. 77646" style={{ padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
          <input type="number" id="costTarget" placeholder="e.g. 32" step="0.1" style={{ padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
          <input type="number" id="orderingDays" defaultValue="11" style={{ padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px' }} />
        </div>
        <button onClick={handleSaveSetup} style={{ width: '100%', padding: '10px', background: '#0f5132', border: '1px solid #1a7d3a', borderRadius: '4px', color: '#98d8c8', fontSize: '12px', fontWeight: 500, cursor: 'pointer', textTransform: 'uppercase', marginBottom: '16px' }}>Save Monthly Setup</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#0f1419', border: '1px dashed #2a3142', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 500 }}>Upload Transfer Report</p>
            <input type="file" id="transferFile" accept=".xlsx" style={{ width: '100%', padding: '8px', background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '4px', color: '#888', fontSize: '12px' }} />
            <p style={{ fontSize: '11px', color: '#666', margin: '8px 0 0' }}>Daily outlet spend by-line</p>
          </div>
          <div style={{ background: '#0f1419', border: '1px dashed #2a3142', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 500 }}>Upload Flash Report</p>
            <input type="file" id="flashFile" accept=".xlsx" style={{ width: '100%', padding: '8px', background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '4px', color: '#888', fontSize: '12px' }} />
            <p style={{ fontSize: '11px', color: '#666', margin: '8px 0 0' }}>Covers & revenue auto-populated</p>
          </div>
        </div>
        <button onClick={handleProcessReports} style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#0f5132', border: '1px solid #1a7d3a', borderRadius: '4px', color: '#98d8c8', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textTransform: 'uppercase' }}>Process & Save Daily Data</button>
      </div>

      <div id="error" style={{ display: 'none', background: '#3d2f2f', border: '1px solid #8b4444', borderRadius: '8px', padding: '12px', color: '#ff9999', fontSize: '12px', marginTop: '16px' }}>
        <p style={{ margin: 0 }} id="errorMsg"></p>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
      <script dangerouslySetInnerHTML={{ __html: `
const STORAGE_KEY = 'pir_dashboard_data';
let cumulativeChart, pieChart;

async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(XLSX.read(e.target.result, { type: 'array' }));
      } catch (err) {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

function parseFlashReport(wb) {
  const sheet = wb.Sheets[wb.SheetNames.find(n => n.includes('PIR')) || wb.SheetNames[1]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let revenue = 0, date = '';

  for (let i = 0; i < Math.min(data.length, 40); i++) {
    const row = data[i];
    if (row[0] instanceof Date) date = row[0].toLocaleDateString();
    if (row[0]?.toString()?.trim() === 'Total Revenue') {
      for (let j = 2; j < 35; j++) {
        const v = parseFloat(row[j]);
        if (!isNaN(v) && v > 100) { revenue = v; break; }
      }
    }
  }

  return { revenue, date };
}

function parseTransferReport(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let totalSpend = 0, outlets = {}, date = '';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = row[1]?.toString()?.trim() || '';
    const amount = parseFloat(row[5]);
    
    if (row[7]) date = new Date(row[7]).toLocaleDateString();
    
    if (!isNaN(amount) && amount > 0 && !label.includes('Total') && label.length > 2) {
      outlets[label] = (outlets[label] || 0) + amount;
      totalSpend += amount;
    }
  }

  return { totalSpend, outlets, date };
}

function saveData(flash, transfer) {
  let all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"entries":[]}');
  const entry = { date: transfer.date || new Date().toLocaleDateString(), revenue: flash.revenue, spend: transfer.totalSpend, outlets: transfer.outlets };
  if (!all.entries.find(e => e.date === entry.date)) all.entries.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function renderDashboard(flash, transfer) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"entries":[]}');
  const setup = all.setup || { monthlyRevBudget: 237800, monthlyFoodBudget: 77646, costTarget: 32, orderingDays: 11 };
  const entries = all.entries || [];
  
  let totRev = 0, totSpend = 0;
  entries.forEach(e => { totRev += e.revenue; totSpend += e.spend; });
  
  const costPct = totRev > 0 ? (totSpend / totRev * 100).toFixed(1) : 0;
  const dailyBudget = (setup.monthlyFoodBudget / setup.orderingDays).toFixed(0);
  
  document.getElementById('mtdSpend').textContent = '$' + Math.round(totSpend).toLocaleString();
  document.getElementById('mtdRevenue').textContent = '$' + Math.round(totRev).toLocaleString();
  document.getElementById('dailyBudget').textContent = '$' + dailyBudget;
  document.getElementById('foodCostPct').textContent = costPct + '%';
  document.getElementById('lastOrder').textContent = '$' + Math.round(transfer.totalSpend).toLocaleString();
  
  renderOutletTable(transfer.outlets);
  renderCharts(entries);
}

function renderOutletTable(outlets) {
  const tbody = document.getElementById('outletTable');
  tbody.innerHTML = '';
  
  Object.entries(outlets).sort((a, b) => b[1] - a[1]).forEach(([name, spend]) => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #2a3142';
    row.innerHTML = \`
      <td style="padding: 8px 0; color: #ccc;">\${name}</td>
      <td style="text-align: right; padding: 8px 0; color: #fff; font-weight: 500;">$\${spend.toFixed(0)}</td>
      <td style="text-align: right; padding: 8px 0; color: #666;">—</td>
      <td style="text-align: right; padding: 8px 0;"><span style="background: #2a3142; padding: 2px 6px; border-radius: 3px; font-size: 10px; color: #666;">OK</span></td>
    \`;
    tbody.appendChild(row);
  });
}

function renderCharts(entries) {
  const dates = entries.map(e => e.date.slice(0, 5));
  const cumSpend = [];
  const cumBudget = [];
  let runSpend = 0, runBudget = 0;
  
  const setup = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').setup || { monthlyFoodBudget: 77646, orderingDays: 11 };
  const dailyBudget = setup.monthlyFoodBudget / setup.orderingDays;
  
  entries.forEach(e => {
    runSpend += e.spend;
    runBudget += dailyBudget;
    cumSpend.push(Math.round(runSpend));
    cumBudget.push(Math.round(runBudget));
  });

  if (cumulativeChart) cumulativeChart.destroy();
  cumulativeChart = new Chart(document.getElementById('cumulativeChart'), {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        { label: 'Actual Spend', data: cumSpend, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 2, tension: 0.3, fill: true },
        { label: 'Budget', data: cumBudget, borderColor: '#fbbf24', borderDash: [5,5], borderWidth: 2, tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#888', font: { size: 11 } } } }, scales: { y: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#2a3142' } }, x: { ticks: { color: '#666', font: { size: 10 } }, grid: { color: '#2a3142' } } } }
  });

  const outletTotals = {};
  entries.forEach(e => {
    Object.entries(e.outlets || {}).forEach(([k, v]) => { outletTotals[k] = (outletTotals[k] || 0) + v; });
  });

  const colors = ['#4ade80', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  const outletNames = Object.keys(outletTotals).slice(0, 8);
  
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(document.getElementById('pieChart'), {
    type: 'doughnut',
    data: {
      labels: outletNames,
      datasets: [{ data: outletNames.map(k => outletTotals[k]), backgroundColor: colors }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#888', font: { size: 10 } } } } }
  });
}

function loadDashboard() {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"entries":[]}');
  const setup = all.setup || {};
  
  if (setup.monthlyRevBudget) document.getElementById('monthlyRevBudget').value = setup.monthlyRevBudget;
  if (setup.monthlyFoodBudget) document.getElementById('monthlyFoodBudget').value = setup.monthlyFoodBudget;
  if (setup.costTarget) document.getElementById('costTarget').value = setup.costTarget;
  if (setup.orderingDays) document.getElementById('orderingDays').value = setup.orderingDays;
  
  if (all.entries && all.entries.length > 0) {
    renderDashboard({}, { totalSpend: 0, outlets: {} });
  }
}

window.addEventListener('load', loadDashboard);
      ` }} />
    </div>
  );
}
