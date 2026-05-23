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

type MetricData = {
  f1: User[];
  precision: User[];
  recall: User[];
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
        const [f1Res, precisionRes, recallRes] = await Promise.all([
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/f1"),
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/precision"),
          fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/recall")
        ]);

        const f1 = await f1Res.json();
        const precision = await precisionRes.json();
        const recall = await recallRes.json();

        console.log("F1:", f1);
        console.log("Precision:", precision);
        console.log("Recall:", recall);

        setData({
          f1: mapData(f1),
          precision: mapData(precision),
          recall: mapData(recall)
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

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Evaluation Metrics</h2>

      {loading && <p>Loading data...</p>}

      {renderTable("F1 Score", data.f1)}
      {renderTable("Precision", data.precision)}
      {renderTable("Recall", data.recall)}
    </div>
  );
};

export default EvaluationMetrics;
