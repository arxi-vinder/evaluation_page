import { useEffect, useState } from 'react';
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

      {renderTable("F1 Score", data.f1)}
      {renderTable("Precision", data.precision)}
      {renderTable("Recall", data.recall)}
    </div>
  );
};

export default EvaluationMetrics;
