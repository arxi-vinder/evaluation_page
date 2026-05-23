import { useEffect, useRef, useState } from 'react';
import { Users, Plus, X, CheckCircle, Trash2, AlertTriangle, Search, Edit2 } from 'lucide-react';
import './Dashboard.css';

type MAPUser = {
  id: number;
  name: string;
  ap: number;
};

type MAPData = {
  mean: number;
  map1: number;
  map3: number;
  map5: number;
  users: MAPUser[];
};

type PaperForm = {
  title: string;
  abstract: string;
  published_date: string;
  category: string;
  url: string;
  author: string;
};

type UpdatePaperForm = {
  title?: string;
  published_date?: string;
  category?: string;
  url?: string;
  author?: string;
};

type Paper = {
  id: number;
  title: string;
  abstract: string;
  published_date: string;
  category: string;
  url: string;
  author: string;
};

type MetricsByK = {
  k: number;
  average_precision: number;
  average_recall: number;
  average_f1_score: number;
  average_map: number;
  count: number;
};

type AverageMetricsData = {
  total_users: number;
  metrics_by_k: MetricsByK[];
};

const EMPTY_FORM: PaperForm = {
  title: '',
  abstract: '',
  published_date: '',
  category: '',
  url: '',
  author: '',
};

const mapMAPData = (data: any): MAPData => ({
  mean: data?.mean_average_precision ?? 0,
  map1: data?.map_at_k?.["map@1"] ?? 0,
  map3: data?.map_at_k?.["map@3"] ?? 0,
  map5: data?.map_at_k?.["map@5"] ?? 0,
  users: (data?.average_precision_per_user || []).map((item: any) => ({
    id: item.user_id,
    name: `User ${item.user_id}`,
    ap: item.average_precision ?? 0,
  })),
});

const DashboardContent = () => {
  const [mapDataState, setMapDataState] = useState<MAPData>({
    mean: 0, map1: 0, map3: 0, map5: 0, users: [],
  });
  const [loading, setLoading] = useState(true);
  const [averageMetricsData, setAverageMetricsData] = useState<AverageMetricsData>({
    total_users: 0,
    metrics_by_k: [],
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PaperForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [papersError, setPapersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteOverlayRef = useRef<HTMLDivElement>(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updatePaperList, setUpdatePaperList] = useState<Paper[]>([]);
  const [loadingUpdatePapers, setLoadingUpdatePapers] = useState(false);
  const [updatePapersError, setUpdatePapersError] = useState<string | null>(null);
  const [updateSearchQuery, setUpdateSearchQuery] = useState('');
  const [selectedUpdatePaper, setSelectedUpdatePaper] = useState<Paper | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdatePaperForm>({});
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const updateOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/mape");
        const data = await res.json();
        setMapDataState(mapMAPData(data));
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, []);

  useEffect(() => {
    const fetchAverageMetrics = async () => {
      try {
        const res = await fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/evaluation/average-metrics-by-k");
        const data = await res.json();
        if (data.metrics_by_k) {
          setAverageMetricsData(data);
        }
      } catch (err) {
        console.error("Fetch average metrics error:", err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchAverageMetrics();
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setSuccessId(null);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeModal();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessId(null);

    const body = {
      ...form,
      published_date: form.published_date ? `${form.published_date}T00:00:00` : '',
    };

    try {
      const res = await fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/create/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.status === "success") {
        setSuccessId(json.data.id);
        setForm(EMPTY_FORM);
      } else {
        setErrorMsg(json.message ?? "Terjadi kesalahan, coba lagi.");
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = async () => {
    setSelectedPaper(null);
    setDeleteSuccess(false);
    setDeleteError(null);
    setSearchQuery('');
    setDeleteModalOpen(true);
    setLoadingPapers(true);
    setPapersError(null);
    try {
      const res = await fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/papers");
      const json = await res.json();
      if (json.status === "success") {
        setPapers(json.data ?? []);
      } else {
        setPapersError(json.message ?? "Gagal memuat data paper.");
      }
    } catch {
      setPapersError("Gagal terhubung ke server.");
    } finally {
      setLoadingPapers(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteModalOpen(false);
  };

  const handleDeleteOverlayClick = (e: React.MouseEvent) => {
    if (e.target === deleteOverlayRef.current) closeDeleteModal();
  };

  const handleConfirmDelete = async () => {
    if (!selectedPaper) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/delete/paper/${selectedPaper.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.status === "success") {
        setDeleteSuccess(true);
        setPapers(prev => prev.filter(p => p.id !== selectedPaper.id));
      } else {
        setDeleteError(json.message ?? "Gagal menghapus paper.");
      }
    } catch {
      setDeleteError("Gagal terhubung ke server.");
    } finally {
      setDeleting(false);
    }
  };

  const openUpdateModal = async () => {
    setSelectedUpdatePaper(null);
    setUpdateSuccess(false);
    setUpdateError(null);
    setUpdateSearchQuery('');
    setUpdateForm({});
    setUpdateModalOpen(true);
    setLoadingUpdatePapers(true);
    setUpdatePapersError(null);
    try {
      const res = await fetch("https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/papers");
      const json = await res.json();
      if (json.status === "success") {
        setUpdatePaperList(json.data ?? []);
      } else {
        setUpdatePapersError(json.message ?? "Gagal memuat data paper.");
      }
    } catch {
      setUpdatePapersError("Gagal terhubung ke server.");
    } finally {
      setLoadingUpdatePapers(false);
    }
  };

  const closeUpdateModal = () => {
    if (updating) return;
    setUpdateModalOpen(false);
  };

  const handleUpdateOverlayClick = (e: React.MouseEvent) => {
    if (e.target === updateOverlayRef.current) closeUpdateModal();
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUpdateForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUpdatePaper) return;
    setUpdating(true);
    setUpdateError(null);

    const body: UpdatePaperForm = {};
    if (updateForm.title) body.title = updateForm.title;
    if (updateForm.published_date) body.published_date = `${updateForm.published_date}T00:00:00`;
    if (updateForm.category) body.category = updateForm.category;
    if (updateForm.url) body.url = updateForm.url;
    if (updateForm.author) body.author = updateForm.author;

    try {
      const res = await fetch(`https://arxivinder-b87fc3af616f.herokuapp.com/api/v1/update/paper/${selectedUpdatePaper.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.status === "success") {
        setUpdateSuccess(true);
        setUpdatePaperList(prev =>
          prev.map(p =>
            p.id === selectedUpdatePaper.id
              ? { ...p, ...updateForm }
              : p
          )
        );
        setUpdateForm({});
      } else {
        setUpdateError(json.message ?? "Gagal mengupdate paper.");
      }
    } catch {
      setUpdateError("Gagal terhubung ke server.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="dashboard-container">

      <div className="dashboard-header-row">
        <h2 className="dashboard-title">Evaluation Dashboard</h2>
        <div className="header-actions">
          <button className="update-paper-btn" onClick={openUpdateModal}>
            <Edit2 size={18} strokeWidth={2.5} />
            <span>Update Paper</span>
          </button>
          <button className="delete-paper-btn" onClick={openDeleteModal}>
            <Trash2 size={18} strokeWidth={2.5} />
            <span>Hapus Paper</span>
          </button>
          <button className="add-paper-btn" onClick={openModal}>
            <Plus size={18} strokeWidth={2.5} />
            <span>Tambah Paper</span>
          </button>
        </div>
      </div>

      {loading && <p>Loading data...</p>}

      <div className="stat-card">
        <div className="stat-info">
          <p>Total User</p>
          <h3>{mapDataState.users.length}</h3>
        </div>
        <div className="stat-icon-wrapper">
          <Users size={28} strokeWidth={2.5} />
        </div>
      </div>

      <div className="table-section">
        <h3 className="table-title">Mean Average Precision</h3>
        <div className="stat-card">
          <div className="stat-info">
            <p>MAP Score</p>
            <h3>{mapDataState.mean.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="table-section">
        <h3 className="table-title">MAP @ K</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>MAP@1</th>
              <th>MAP@2</th>
              <th>MAP@3</th>
              <th>MAP@4</th>
              <th>MAP@5</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{mapDataState.map1.toFixed(2)}</td>
              <td>{mapDataState.map3.toFixed(2)}</td>
              <td>{mapDataState.map5.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="table-section">
        <h3 className="table-title">Average Precision per User</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Pengguna</th>
              <th>Average Precision</th>
            </tr>
          </thead>
          <tbody>
            {mapDataState.users.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ textAlign: "center" }}>No data</td>
              </tr>
            ) : (
              mapDataState.users.map((user) => (
                <tr key={user.id}>
                  <td className="user-cell">
                    <div className="avatar"></div>
                    {user.name}
                  </td>
                  <td>{user.ap.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-section">
        <h3 className="table-title">System Evaluation Metrics by K</h3>
        <div className="average-metrics-summary">
          <div className="metric-summary-card">
            <p>Total User Evaluation</p>
            <h3>{averageMetricsData.total_users}</h3>
          </div>
        </div>
        {loadingMetrics && <p>Loading metrics data...</p>}
        {averageMetricsData.metrics_by_k.length === 0 && !loadingMetrics && (
          <p style={{ textAlign: "center", padding: "20px" }}>No metrics data available</p>
        )}
        {averageMetricsData.metrics_by_k.length > 0 && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>K</th>
                <th>Average Precision</th>
                <th>Average Recall</th>
                <th>Average F1 Score</th>
                <th>Average MAP</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {averageMetricsData.metrics_by_k.map((metric) => (
                <tr key={metric.k}>
                  <td>{metric.k}</td>
                  <td>{metric.average_precision.toFixed(4)}</td>
                  <td>{metric.average_recall.toFixed(4)}</td>
                  <td>{metric.average_f1_score.toFixed(4)}</td>
                  <td>{metric.average_map.toFixed(4)}</td>
                  <td>{metric.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
          <div className="modal-box">

            <div className="modal-header">
              <h3>Tambah Paper Baru</h3>
              <button className="modal-close-btn" onClick={closeModal} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            {successId !== null ? (
              <div className="modal-success">
                <CheckCircle size={48} strokeWidth={1.5} />
                <p className="modal-success-title">Data berhasil dibuat!</p>
                <p className="modal-success-sub">Paper tersimpan dengan ID <strong>#{successId}</strong>.</p>
                <button className="modal-done-btn" onClick={closeModal}>Tutup</button>
              </div>
            ) : (
              <form className="modal-form" onSubmit={handleSubmit}>

                <div className="form-group">
                  <label>Judul</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Attention Is All You Need"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Abstract</label>
                  <textarea
                    name="abstract"
                    value={form.abstract}
                    onChange={handleChange}
                    placeholder="Deskripsi singkat paper..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Tanggal Publikasi</label>
                    <input
                      type="date"
                      name="published_date"
                      value={form.published_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Kategori</label>
                    <input
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="Machine Learning (cs.LG)"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>URL</label>
                  <input
                    name="url"
                    type="url"
                    value={form.url}
                    onChange={handleChange}
                    placeholder="https://arxiv.org/abs/..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleChange}
                    placeholder="Vaswani, Ashish and Shazeer, Noam"
                    required
                  />
                </div>

                {errorMsg && <p className="modal-error">{errorMsg}</p>}

                <div className="modal-actions">
                  <button type="button" className="modal-cancel-btn" onClick={closeModal} disabled={submitting}>
                    Batal
                  </button>
                  <button type="submit" className="modal-submit-btn" disabled={submitting}>
                    {submitting ? "Menyimpan..." : "Simpan Paper"}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="modal-overlay" ref={deleteOverlayRef} onClick={handleDeleteOverlayClick}>
          <div className="modal-box delete-modal-box">

            <div className="modal-header">
              <h3>Hapus Paper</h3>
              <button className="modal-close-btn" onClick={closeDeleteModal} disabled={deleting}>
                <X size={20} />
              </button>
            </div>

            {deleteSuccess ? (
              <div className="modal-success delete-modal-success">
                <CheckCircle size={48} strokeWidth={1.5} />
                <p className="modal-success-title">Paper berhasil dihapus!</p>
                <p className="modal-success-sub">
                  <strong>{selectedPaper?.title}</strong> telah dihapus dari sistem.
                </p>
                <button className="modal-done-btn" onClick={closeDeleteModal}>Tutup</button>
              </div>
            ) : (
              <div className="delete-modal-body">

                <div className="delete-search-bar">
                  <Search size={16} className="delete-search-icon" />
                  <input
                    type="text"
                    placeholder="Cari judul paper..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setSelectedPaper(null); }}
                  />
                </div>

                {loadingPapers && (
                  <p className="delete-status-msg">Memuat daftar paper...</p>
                )}

                {papersError && (
                  <p className="modal-error">{papersError}</p>
                )}

                {!loadingPapers && !papersError && (
                  <div className="paper-list">
                    {papers.filter(p =>
                      p.title.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <p className="delete-status-msg">Tidak ada paper ditemukan.</p>
                    ) : (
                      papers
                        .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(paper => (
                          <div
                            key={paper.id}
                            className={`paper-list-item ${selectedPaper?.id === paper.id ? 'selected' : ''}`}
                            onClick={() => setSelectedPaper(paper)}
                          >
                            <div className="paper-list-radio">
                              <div className="radio-dot" />
                            </div>
                            <div className="paper-list-info">
                              <p className="paper-list-title">{paper.title}</p>
                              <p className="paper-list-meta">
                                ID #{paper.id} &middot; {paper.author} &middot; {paper.category}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {selectedPaper && (
                  <div className="delete-confirm-zone">
                    <AlertTriangle size={18} />
                    <span>
                      Hapus <strong>"{selectedPaper.title}"</strong>? Tindakan ini tidak dapat dibatalkan.
                    </span>
                  </div>
                )}

                {deleteError && <p className="modal-error">{deleteError}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="modal-delete-btn"
                    onClick={handleConfirmDelete}
                    disabled={!selectedPaper || deleting}
                  >
                    {deleting ? "Menghapus..." : "Hapus Paper"}
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {updateModalOpen && (
        <div className="modal-overlay" ref={updateOverlayRef} onClick={handleUpdateOverlayClick}>
          <div className="modal-box update-modal-box">

            <div className="modal-header">
              <h3>Update Paper</h3>
              <button className="modal-close-btn" onClick={closeUpdateModal} disabled={updating}>
                <X size={20} />
              </button>
            </div>

            {updateSuccess ? (
              <div className="modal-success update-modal-success">
                <CheckCircle size={48} strokeWidth={1.5} />
                <p className="modal-success-title">Paper berhasil diupdate!</p>
                <p className="modal-success-sub">
                  <strong>{selectedUpdatePaper?.title}</strong> telah diperbarui di sistem.
                </p>
                <button className="modal-done-btn" onClick={closeUpdateModal}>Tutup</button>
              </div>
            ) : (
              <div className="update-modal-body">

                <div className="delete-search-bar">
                  <Search size={16} className="delete-search-icon" />
                  <input
                    type="text"
                    placeholder="Cari judul paper..."
                    value={updateSearchQuery}
                    onChange={e => { setUpdateSearchQuery(e.target.value); setSelectedUpdatePaper(null); }}
                  />
                </div>

                {loadingUpdatePapers && (
                  <p className="delete-status-msg">Memuat daftar paper...</p>
                )}

                {updatePapersError && (
                  <p className="modal-error">{updatePapersError}</p>
                )}

                {!loadingUpdatePapers && !updatePapersError && (
                  <div className="paper-list">
                    {updatePaperList.filter(p =>
                      p.title.toLowerCase().includes(updateSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <p className="delete-status-msg">Tidak ada paper ditemukan.</p>
                    ) : (
                      updatePaperList
                        .filter(p => p.title.toLowerCase().includes(updateSearchQuery.toLowerCase()))
                        .map(paper => (
                          <div
                            key={paper.id}
                            className={`paper-list-item ${selectedUpdatePaper?.id === paper.id ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedUpdatePaper(paper);
                              setUpdateForm({});
                            }}
                          >
                            <div className="paper-list-radio">
                              <div className="radio-dot" />
                            </div>
                            <div className="paper-list-info">
                              <p className="paper-list-title">{paper.title}</p>
                              <p className="paper-list-meta">
                                ID #{paper.id} &middot; {paper.author} &middot; {paper.category}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {selectedUpdatePaper && (
                  <form className="update-paper-form" onSubmit={handleUpdateSubmit}>
                    <p className="update-form-label">Update data untuk: <strong>{selectedUpdatePaper.title}</strong></p>

                    <div className="form-group">
                      <label>Judul (Opsional)</label>
                      <input
                        name="title"
                        value={updateForm.title || ''}
                        onChange={handleUpdateChange}
                        placeholder={selectedUpdatePaper.title}
                      />
                    </div>

                    <div className="form-group">
                      <label>Tanggal Publikasi (Opsional)</label>
                      <input
                        type="date"
                        name="published_date"
                        value={updateForm.published_date || ''}
                        onChange={handleUpdateChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Kategori (Opsional)</label>
                      <input
                        name="category"
                        value={updateForm.category || ''}
                        onChange={handleUpdateChange}
                        placeholder={selectedUpdatePaper.category}
                      />
                    </div>

                    <div className="form-group">
                      <label>URL (Opsional)</label>
                      <input
                        name="url"
                        type="url"
                        value={updateForm.url || ''}
                        onChange={handleUpdateChange}
                        placeholder={selectedUpdatePaper.url}
                      />
                    </div>

                    <div className="form-group">
                      <label>Author (Opsional)</label>
                      <input
                        name="author"
                        value={updateForm.author || ''}
                        onChange={handleUpdateChange}
                        placeholder={selectedUpdatePaper.author}
                      />
                    </div>

                    {updateError && <p className="modal-error">{updateError}</p>}

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="modal-cancel-btn"
                        onClick={closeUpdateModal}
                        disabled={updating}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="modal-submit-btn"
                        disabled={updating}
                      >
                        {updating ? "Mengupdate..." : "Update Paper"}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardContent;
