import { useEffect, useState } from 'react';
import '../dashboard/Dashboard.css';
import { LineChart } from '@mui/x-charts/LineChart';

type ApiResponse = {
    user_id: number;
    k1: number;
    k2: number;
    k3: number;
    k4:number;
    k5: number;
};

const normalizeArray = (data: any): ApiResponse[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
};


const getUserMetrics = (userId: number | null, data: ApiResponse[]) => {
    const user = data.find((u) => u.user_id === userId);

    return [
        Number(user?.k1 ?? 0),
        Number(user?.k2 ?? 0),
        Number(user?.k3 ?? 0),
        Number(user?.k4 ?? 0),
        Number(user?.k5 ?? 0),
    ];
};

const Chart = () => {
    const [precisionData, setPrecisionData] = useState<ApiResponse[]>([]);
    const [f1Data, setF1Data] = useState<ApiResponse[]>([]);
    const [recallData, setRecallData] = useState<ApiResponse[]>([]);

    const [users, setUsers] = useState<number[]>([]);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
        try {
        const [pRes, fRes, rRes] = await Promise.all([
            fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/precision"),
            fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/f1"),
            fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/recall"),
        ]);

        const pData = normalizeArray(await pRes.json());
        const fData = normalizeArray(await fRes.json());
        const rData = normalizeArray(await rRes.json());

        setPrecisionData(pData);
        setF1Data(fData);
        setRecallData(rData);


        const validUsers = pData
            .map((u) => u.user_id)
            .filter(
                (id) =>
                fData.some((f) => f.user_id === id) &&
                rData.some((r) => r.user_id === id)
            );

            setUsers(validUsers);

            if (validUsers.length > 0) {
            setSelectedUser(validUsers[0]);
            }

        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
        };

        fetchAll();
    }, []);

const precision = getUserMetrics(selectedUser, precisionData);
const f1 = getUserMetrics(selectedUser, f1Data);
const recall = getUserMetrics(selectedUser, recallData);

    return (
        <div className="dashboard-container">
        <h2 className="dashboard-title">Chart Metrics (Per User)</h2>

        {loading ? (
            <p>Loading chart...</p>
        ) : users.length === 0 ? (
            <p>Tidak ada user dengan data lengkap</p>
        ) : (
            <>
            <div style={{ marginBottom: '20px' }}>
                <select
                value={selectedUser ?? ''}
                onChange={(e) => setSelectedUser(Number(e.target.value))}
                style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px'
                }}
                >
                {users.map((id) => (
                    <option key={id} value={id}>
                    User {id}
                    </option>
                ))}
                </select>
            </div>


            <div style={{
                width: '100%',
                background: '#fff',
                borderRadius: '20px',
                padding: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <LineChart
                height={500}
                xAxis={[{
                    scaleType: 'point',
                    data: ['K=1','K=2','K=3', 'K=4','K=5'],
                    label: 'Top-K Recommendation',
                }]}
                yAxis={[{
                    label: 'Metric Value',
                    min: 0,
                    max: 1,
                }]}
                series={[
                    { data: precision, label: 'Precision', showMark: true },
                    { data: f1, label: 'F1 Score', showMark: true },
                    { data: recall, label: 'Recall', showMark: true },
                ]}
                grid={{ vertical: true, horizontal: true }}
                slotProps={{
                    legend: {
                    position: { vertical: 'top', horizontal: 'end' },
                    },
                }}
                />
            </div>
            </>
        )}
        </div>
    );
    };

export default Chart;