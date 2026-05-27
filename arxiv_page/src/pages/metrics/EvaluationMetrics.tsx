import { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import '../dashboard/Dashboard.css';
import './Testing.css';

type ApiResponse = {
  user_id: number;
  username:string;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
};

type User = {
  id: number;
  username: string;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
};

type MapAtK = {
  [key: string]: number;
};

type UserAPAtK = {
  user_id: number;
  username: string;
  ap_at_k: MapAtK;
};

type MAPEMetrics = {
  mean_average_precision: number;
  map_at_k: MapAtK;
  average_precision_per_user: UserAPAtK[];
  total_user: number;
};

type MetricData = {
  f1: User[];
  precision: User[];
  recall: User[];
  mape?: MAPEMetrics;
};

const normalizeArray = (data: any): ApiResponse[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  console.error("Unexpected API format:", data);
  return [];
};

const mapData = (data: any): User[] =>
  normalizeArray(data).map((item: ApiResponse) => ({
    id: item.user_id,
    username: `User ${item.username}`,
    k1: item.k1 ?? 0,
    k2: item.k2 ?? 0,
    k3: item.k3 ?? 0,
    k4: item.k4 ?? 0,
    k5: item.k5 ?? 0
  }));

const EvaluationMetrics = () => {
  const [data, setData] = useState<MetricData>({ f1: [], precision: [], recall: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'f1' | 'precision' | 'recall'>('f1');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [f1Res, precisionRes, recallRes, mapeRes] = await Promise.all([
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/f1"),
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/precision"),
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/recall"),
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/mape")
        ]);

        const f1 = await f1Res.json();
        const precision = await precisionRes.json();
        const recall = await recallRes.json();
        const mape = await mapeRes.json();


        console.log("F1:", f1);
        console.log("Precision:", precision);
        console.log("Recall:", recall);
        console.log("MAPE:", mape);

        setData({
          f1: mapData(f1),
          precision: mapData(precision),
          recall: mapData(recall),
          mape: mape
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderTable = (title: string, users: User[]) => (
    <div className="table-section">
      <h3 className="table-title">{title}</h3>
      <table className="custom-table">
        <thead>
          <tr>
            <th>Nama Pengguna</th>
            <th>K = 1</th>
            <th>K = 2</th>
            <th>K = 3</th>
            <th>K = 4</th>
            <th>K = 5</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center" }}>No data</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="user-cell">
                  <div className="avatar"></div>
                  {user.username}
                </td>
                <td>{user.k1.toFixed(2)}</td>
                <td>{user.k2.toFixed(2)}</td>
                <td>{user.k3.toFixed(2)}</td>
                <td>{user.k4.toFixed(2)}</td>
                <td>{user.k5.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMAPESummary = (mape: MAPEMetrics) => (
    <div className="table-section">
      <h3 className="table-title">Mean Average Precision (MAP)</h3>
      <div className="average-metrics-summary">
        <div className="metric-summary-card">
          <p>Overall Mean AP</p>
          <h3>{mape.mean_average_precision.toFixed(4)}</h3>
        </div>
        {Object.entries(mape.map_at_k).map(([key, value]) => (
          <div key={key} className="metric-summary-card">
            <p>{key.replace("map@", "MAP @")}</p>
            <h3>{value.toFixed(4)}</h3>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMAPETable = (mape: MAPEMetrics) => (
    <div className="table-section">
      <h3 className="table-title">Average Precision per User</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>AP@1</th>
              <th>AP@2</th>
              <th>AP@3</th>
              <th>AP@4</th>
              <th>AP@5</th>
            </tr>
          </thead>
          <tbody>
            {mape.average_precision_per_user.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>No data</td>
              </tr>
            ) : (
              mape.average_precision_per_user.map((user) => (
                <tr key={user.user_id}>
                  <td className="user-cell">
                    <div className="avatar"></div>
                    {user.username}
                  </td>
                  <td>{user.ap_at_k.k1.toFixed(4)}</td>
                  <td>{user.ap_at_k.k2.toFixed(4)}</td>
                  <td>{user.ap_at_k.k3.toFixed(4)}</td>
                  <td>{user.ap_at_k.k4.toFixed(4)}</td>
                  <td>{user.ap_at_k.k5.toFixed(4)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
        Total Users: {mape.total_user}
      </p>
    </div>
  );

  const renderChart = (users: User[], metricName: string) => {
    if (users.length === 0) return null;

    const chartData = users.map((user) => ({
      username: user.username.replace('User ', ''),
      k1: Math.round(user.k1 * 10000) / 10000,
      k2: Math.round(user.k2 * 10000) / 10000,
      k3: Math.round(user.k3 * 10000) / 10000,
      k4: Math.round(user.k4 * 10000) / 10000,
      k5: Math.round(user.k5 * 10000) / 10000,
    }));

    const chartWidth = windowWidth < 768 ? Math.min(windowWidth - 40, 500) : Math.min(windowWidth - 100, 1000);
    const chartHeight = windowWidth < 768 ? 300 : 380;

    return (
      <div className="table-section">
        <h3 className="table-title">{metricName} - Per User (K=1-5)</h3>
        <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowX: 'auto', width: '100%' }}>
          <BarChart
            dataset={chartData}
            xAxis={[{ scaleType: 'band', dataKey: 'username' }]}
            series={[
              { dataKey: 'k1', label: 'K=1' },
              { dataKey: 'k2', label: 'K=2' },
              { dataKey: 'k3', label: 'K=3' },
              { dataKey: 'k4', label: 'K=4' },
              { dataKey: 'k5', label: 'K=5' }
            ]}
            width={chartWidth}
            height={chartHeight}
            margin={{ top: 10, bottom: 30, left: 40, right: 20 }}
          />
        </div>
      </div>
    );
  };

  const renderHistogram = (users: User[], metricName: string) => {
    const HISTOGRAM_USER_IDS = [19, 41, 42,46, 29];
    const filteredUsers = users.filter((u) => HISTOGRAM_USER_IDS.includes(u.id));

    if (filteredUsers.length === 0) return null;

    const bins = [
      { range: '0.0-0.1', min: 0.0, max: 0.1 },
      { range: '0.1-0.2', min: 0.1, max: 0.2 },
      { range: '0.2-0.3', min: 0.2, max: 0.3 },
      { range: '0.3-0.4', min: 0.3, max: 0.4 },
      { range: '0.4-0.5', min: 0.4, max: 0.5 },
      { range: '0.5-0.6', min: 0.5, max: 0.6 },
      { range: '0.6-0.7', min: 0.6, max: 0.7 },
      { range: '0.7-0.8', min: 0.7, max: 0.8 },
      { range: '0.8-0.9', min: 0.8, max: 0.9 },
      { range: '0.9-1.0', min: 0.9, max: 1.01 },
    ];

    const countInBin = (value: number, min: number, max: number) =>
      value >= min && value < max ? 1 : 0;

    const histogramData = bins.map((bin) => {
      const counts = { k1: 0, k2: 0, k3: 0, k4: 0, k5: 0 };
      filteredUsers.forEach((user) => {
        counts.k1 += countInBin(user.k1, bin.min, bin.max);
        counts.k2 += countInBin(user.k2, bin.min, bin.max);
        counts.k3 += countInBin(user.k3, bin.min, bin.max);
        counts.k4 += countInBin(user.k4, bin.min, bin.max);
        counts.k5 += countInBin(user.k5, bin.min, bin.max);
      });
      return {
        range: bin.range,
        ...counts,
      };
    });

    const chartWidth = windowWidth < 768 ? Math.min(windowWidth - 40, 500) : Math.min(windowWidth - 100, 1000);
    const chartHeight = windowWidth < 768 ? 300 : 380;

    return (
      <div className="table-section">
        <h3 className="table-title">{metricName} - Distribution Histogram</h3>
        <p style={{ marginTop: '-8px', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
          Jumlah user pada setiap rentang nilai metrik (per K)
        </p>
        <div className="chart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowX: 'auto', width: '100%' }}>
          <BarChart
            dataset={histogramData}
            xAxis={[{ scaleType: 'band', dataKey: 'range', label: 'Rentang Nilai' }]}
            yAxis={[{ label: 'Jumlah User' }]}
            series={[
              { dataKey: 'k1', label: 'K=1' },
              { dataKey: 'k2', label: 'K=2' },
              { dataKey: 'k3', label: 'K=3' },
              { dataKey: 'k4', label: 'K=4' },
              { dataKey: 'k5', label: 'K=5' }
            ]}
            width={chartWidth}
            height={chartHeight}
            margin={{ top: 10, bottom: 50, left: 50, right: 20 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Evaluation Metrics</h2>

      {loading && <p>Loading data...</p>}

      {data.mape && (
        <>
          {renderMAPESummary(data.mape)}
          {renderMAPETable(data.mape)}
        </>
      )}

      <div className="table-section">
        <h3 className="table-title">View by Metric</h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedMetric('f1')}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedMetric === 'f1' ? '#4e7eff' : '#f1f5f9',
              color: selectedMetric === 'f1' ? '#ffffff' : '#64748b',
              border: selectedMetric === 'f1' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            F1 Score
          </button>
          <button
            onClick={() => setSelectedMetric('precision')}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedMetric === 'precision' ? '#4e7eff' : '#f1f5f9',
              color: selectedMetric === 'precision' ? '#ffffff' : '#64748b',
              border: selectedMetric === 'precision' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Precision
          </button>
          <button
            onClick={() => setSelectedMetric('recall')}
            style={{
              padding: '10px 20px',
              backgroundColor: selectedMetric === 'recall' ? '#4e7eff' : '#f1f5f9',
              color: selectedMetric === 'recall' ? '#ffffff' : '#64748b',
              border: selectedMetric === 'recall' ? 'none' : '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            Recall
          </button>
        </div>
      </div>

      {!loading && (
        <>
          {selectedMetric === 'f1' && renderChart(data.f1, 'F1 Score')}
          {selectedMetric === 'precision' && renderChart(data.precision, 'Precision')}
          {selectedMetric === 'recall' && renderChart(data.recall, 'Recall')}

          {selectedMetric === 'f1' && renderHistogram(data.f1, 'F1 Score')}
          {selectedMetric === 'precision' && renderHistogram(data.precision, 'Precision')}
          {selectedMetric === 'recall' && renderHistogram(data.recall, 'Recall')}
        </>
      )}

      {renderTable("F1 Score", data.f1)}
      {renderTable("Precision", data.precision)}
      {renderTable("Recall", data.recall)}
    </div>
  );
};

export default EvaluationMetrics;
