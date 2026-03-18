import Head from 'next/head';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [dashData, setDashData] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pir_dashboard_data');
      if (stored) {
        setDashData(JSON.parse(stored));
      }
    }
  }, []);

  const handleProcessReports = async () => {
    const flashFile = document.getElementById('flashFile')?.files[0];
    const transferFile = document.getElementById('transferFile')?.files[0];
    
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
      const stored = localStorage.getItem('pir_dashboard_data');
      setDashData(JSON.parse(stored));
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
    
    let all = dashData || { entries: [] };
    all.setup = setup;
    localStorage.setItem('pir_dashboard_data', JSON.stringify(all));
    setDashData(all);
    alert('Monthly setup saved');
  };

  if (!mounted) return null;

  const all = dashData || { entries: [], setup: { monthlyRevBudget: 237800, monthlyFoodBudget: 77646, costTarget: 32, orderingDays: 11 } };
  const setup = all.setup || { monthlyRevBudget: 237800, monthlyFoodBudget: 77646, costTarget: 32, orderingDays: 11 };
  const entries = all.entries || [];
  
  let totRev = 0, totSpend = 0;
  entries.forEach(e => { totRev += e.revenue; totSpend += e.spend; });
  
  const costPct = totRev > 0 ? (totSpend / totRev * 100).toFixed(1) : 0;
  const dailyBudget = (setup.monthlyFoodBudget / setup.orderingDays).toFixed(0);
  const lastOrder = entries.length > 0 ? entries[entries.length - 1].spend : 0;

  return (
    <>
      <Head>
        <title>PIR Kitchen Food Cost Dashboard</title>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
      </Head>

      <div style={{ background: '#0f1419', color: '#e0e0e0', padding: '24px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh' }}>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: '#fff' }}>PIR Kitchen Food Cost Dashboard</h1>
            <p style={{ fontSize: '12px', color: '#888', margin: '4px 0 0 0' }}>Plantation Island Resort | March 2026</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>Ordering Days This Month</p>
            <p style={{ fontSize: '20px', fontWeight: 500, color: '#fff', margin: '4px 0' }}>{setup.orderingDays}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <MetricCard label="MTD Food Spend" value={`$${Math.round(totSpend).toLocaleString()}`} sub="11 ordering days max" color="#4ade80" />
          <MetricCard label="Daily Budget / Day" value={`$${dailyBudget}`} sub="Monthly Budget ÷ 11" color="#fbbf24" />
          <MetricCard label="Last Order Total" value={`$${Math.round(lastOrder).toLocaleString()}`} sub="Most recent transfer" color="#3b82f6" />
          <MetricCard label="Running Food Cost %" value={`${costPct}%`} sub="Actual vs Target" color={costPct > 32 ? '#ff9999' : '#4ade80'} border={costPct > 32 ? '#ff6b6b' : '#2a3142'} />
          <MetricCard label="MTD Revenue (F&B)" value={`$${Math.round(totRev).toLocaleString()}`} sub="From daily flash" color="#e879f9" />
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
              <tbody>
                {entries.length > 0 && entries[entries.length - 1].outlets ? 
                  Object.entries(entries[entries.length - 1].outlets).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([name, spend]) => (
                    <tr key={name} style={{ borderBottom: '1px solid #2a3142' }}>
                      <td style={{ padding: '8px 0', color: '#ccc' }}>{name}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#fff', fontWeight: 500 }}>${spend.toFixed(0)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0', color: '#666' }}>—</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}><span style={{ background: '#2a3142', padding: '2px 6px', borderRadius: '3px', fontSize: '10px', color: '#666' }}>OK</span></td>
                    </tr>
                  ))
                  : <tr style={{ borderBottom: '1px solid #2a3142' }}><td colSpan="4" style={{ padding: '8px 0', color: '#888', textAlign: 'center' }}>Upload reports to load</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 12px', color: '#fff', textTransform: 'uppercase' }}>Daily Flash — Revenue</h3>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a3142' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500 }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Revenue ($)</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', color: '#888', fontWeight: 500 }}>Food %</th>
                </tr>
              </thead>
              <tbody>
                {entries.length > 0 ?
                  entries.slice(-7).reverse().map((e, i) => {
                    const pct = e.revenue > 0 ? (e.spend / e.revenue * 100).toFixed(1) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #2a3142' }}>
                        <td style={{ padding: '8px 0', color: '#ccc' }}>{e.date}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0', color: '#fff' }}>${e.revenue.toFixed(0)}</td>
                        <td style={{ textAlign: 'right', padding: '8px 0', color: pct > 32 ? '#ff9999' : '#4ade80' }}>{pct}%</td>
                      </tr>
                    );
                  })
                  : <tr style={{ borderBottom: '1px solid #2a3142' }}><td colSpan="3" style={{ padding: '8px 0', color: '#888', textAlign: 'center' }}>Upload reports to load</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#1a1f2e', border: '1px solid #2a3142', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 16px', color: '#fff', textTransform: 'uppercase' }}>Monthly Setup</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Monthly Rev Budget</label>
              <input type="number" id="monthlyRevBudget" defaultValue={setup.monthlyRevBudget} style={{ width: '100%', padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Monthly Food Budget</label>
              <input type="number" id="monthlyFoodBudget" defaultValue={setup.monthlyFoodBudget} style={{ width: '100%', padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>COGS Target %</label>
              <input type="number" id="costTarget" defaultValue={setup.costTarget} step="0.1" style={{ width: '100%', padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px' }}>Ordering Days</label>
              <input type="number" id="orderingDays" defaultValue={setup.orderingDays} style={{ width: '100%', padding: '8px', background: '#0f1419', border: '1px solid #2a3142', borderRadius: '4px', color: '#fff', fontSize: '12px', boxSizing: 'border-box' }} />
            </div>
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
      </div>
    </>
  );
}

function MetricCard({ label, value, sub, color, border }) {
  return (
    <div style={{ background: '#1a1f2e', border: `1px solid ${border || '#2a3142'}`, borderRadius: '8px', padding: '16px' }}>
      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 500, margin: 0, color: color }}>{value}</p>
      <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0', textAlign: 'center' }}>{sub}</p>
    </div>
  );
}

async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) throw new Error('XLSX library not loaded');
        resolve(XLSX.read(e.target.result, { type: 'array' }));
      } catch (err) {
        reject(new Error('Failed to read file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

function parseFlashReport(wb) {
  const XLSX = window.XLSX;
  const sheetName = wb.SheetNames.find(n => n.includes('PIR')) || wb.SheetNames[1];
  if (!sheetName) throw new Error('PIR sheet not found');
  
  const sheet = wb.Sheets[sheetName];
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

  if (revenue === 0) throw new Error('Total Revenue not found in Flash Report');
  return { revenue, date };
}

function parseTransferReport(wb) {
  const XLSX = window.XLSX;
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('Transfer sheet not found');
  
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  let totalSpend = 0, outlets = {}, date = '';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const label = row[1]?.toString()?.trim() || '';
    const amount = parseFloat(row[5]);
    
    if (row[7]) {
      const potentialDate = new Date(row[7]);
      if (!isNaN(potentialDate)) date = potentialDate.toLocaleDateString();
    }
    
    if (!isNaN(amount) && amount > 0 && !label.includes('Total') && label.length > 2) {
      outlets[label] = (outlets[label] || 0) + amount;
      totalSpend += amount;
    }
  }

  if (totalSpend === 0) throw new Error('No outlet spend data found in Transfer Report');
  return { totalSpend, outlets, date };
}

function saveData(flash, transfer) {
  let all = { entries: [], setup: null };
  const stored = localStorage.getItem('pir_dashboard_data');
  if (stored) {
    all = JSON.parse(stored);
  }
  
  const entry = { 
    date: transfer.date || new Date().toLocaleDateString(), 
    revenue: flash.revenue, 
    spend: transfer.totalSpend, 
    outlets: transfer.outlets 
  };
  
  if (!all.entries) all.entries = [];
  if (!all.entries.find(e => e.date === entry.date)) {
    all.entries.push(entry);
  }
  
  localStorage.setItem('pir_dashboard_data', JSON.stringify(all));
}
