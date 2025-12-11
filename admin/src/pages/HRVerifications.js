import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const HRVerifications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [verifications, setVerifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    company: searchParams.get('company') || '',
    isEscalated: searchParams.get('isEscalated') || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchVerifications();
    fetchStats();
    fetchCompanies();
  }, [filters]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status) params.append('status', filters.status);
      if (filters.company) params.append('company', filters.company);
      if (filters.isEscalated) params.append('isEscalated', filters.isEscalated);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page);
      params.append('limit', filters.limit);

      const response = await axios.get(`/hr-verification?${params}`);
      setVerifications(response.data.verifications || []);
      setPagination(response.data.pagination || {});

      // Update URL params
      setSearchParams(params);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/hr-verification/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('/cdl-companies');
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_send: { class: 'badge-warning', label: 'Pending Send' },
      email_sent: { class: 'badge-info', label: 'Email Sent' },
      awaiting_response: { class: 'badge-info', label: 'Awaiting Response' },
      verified: { class: 'badge-success', label: 'Verified' },
      unverified: { class: 'badge-danger', label: 'Not Verified' },
      customer_contacted: { class: 'badge-warning', label: 'Customer Contacted' },
      timeout: { class: 'badge-danger', label: 'Timeout' },
      cancelled: { class: 'badge-secondary', label: 'Cancelled' }
    };
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSendEmail = async (verificationId) => {
    try {
      await axios.post(`/hr-verification/${verificationId}/send-email`);
      toast.success('Email sent successfully');
      fetchVerifications();
      fetchStats();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const downloadCSV = () => {
    const headers = ['Order Number', 'Customer', 'Company', 'HR Email', 'Status', 'Created', 'Order Amount'];
    const rows = verifications.map(v => [
      v.order?.orderNumber || '',
      `${v.customerSnapshot?.firstName} ${v.customerSnapshot?.lastName}`,
      v.hrContactSnapshot?.companyName || '',
      v.hrContactSnapshot?.email || '',
      v.status,
      formatDate(v.createdAt),
      v.order?.totalAmount || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-verifications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Verifications</h1>
          <p className="page-subtitle">Manage employment verification requests</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/cdl-companies')}
          >
            Manage Companies
          </button>
          <button className="btn btn-secondary" onClick={downloadCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '4px solid #667eea' }}
            onClick={() => handleFilterChange('status', '')}
          >
            <div className="stat-value">{stats.total || 0}</div>
            <div className="stat-label">Total Verifications</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '4px solid #f6ad55' }}
            onClick={() => handleFilterChange('status', 'pending')}
          >
            <div className="stat-value">{stats.pendingCount || 0}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '4px solid #48bb78' }}
            onClick={() => handleFilterChange('status', 'verified')}
          >
            <div className="stat-value">{stats.verified || 0}</div>
            <div className="stat-label">Verified</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '4px solid #f56565' }}
            onClick={() => handleFilterChange('status', 'unverified')}
          >
            <div className="stat-value">{stats.unverified || 0}</div>
            <div className="stat-label">Not Verified</div>
          </div>
          <div
            className="stat-card"
            style={{ cursor: 'pointer', borderLeft: '4px solid #e53e3e' }}
            onClick={() => handleFilterChange('isEscalated', 'true')}
          >
            <div className="stat-value">{stats.escalatedCount || 0}</div>
            <div className="stat-label">Escalated</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by customer or order..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending (All)</option>
                <option value="pending_send">Pending Send</option>
                <option value="email_sent">Email Sent</option>
                <option value="awaiting_response">Awaiting Response</option>
                <option value="verified">Verified</option>
                <option value="unverified">Not Verified</option>
                <option value="customer_contacted">Customer Contacted</option>
                <option value="timeout">Timeout</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Company</label>
              <select
                className="form-input"
                value={filters.company}
                onChange={(e) => handleFilterChange('company', e.target.value)}
              >
                <option value="">All Companies</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Escalated</label>
              <select
                className="form-input"
                value={filters.isEscalated}
                onChange={(e) => handleFilterChange('isEscalated', e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Escalated Only</option>
                <option value="false">Not Escalated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : verifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
              <p>No verifications found</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>HR Contact</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((verification) => (
                  <tr
                    key={verification._id}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: verification.isEscalated ? '#fff5f5' : 'inherit'
                    }}
                    onClick={() => navigate(`/hr-verifications/${verification._id}`)}
                  >
                    <td>
                      <div>
                        <strong>{verification.order?.orderNumber || '-'}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                          {formatCurrency(verification.order?.totalAmount)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>
                          {verification.customerSnapshot?.firstName} {verification.customerSnapshot?.lastName}
                        </strong>
                        <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                          {verification.customerSnapshot?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{verification.hrContactSnapshot?.companyName || '-'}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{verification.hrContactSnapshot?.contactName || '-'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                          {verification.hrContactSnapshot?.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {getStatusBadge(verification.status)}
                        {verification.isEscalated && (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                            ESCALATED
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{formatDate(verification.createdAt)}</div>
                        {verification.emailSentAt && (
                          <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                            Sent: {formatDate(verification.emailSentAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => navigate(`/hr-verifications/${verification._id}`)}
                        >
                          View
                        </button>
                        {verification.status === 'pending_send' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleSendEmail(verification._id)}
                          >
                            Send Email
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ color: '#718096' }}>
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </button>
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                const pageNum = pagination.page <= 3
                  ? i + 1
                  : pagination.page + i - 2;
                if (pageNum > pagination.pages || pageNum < 1) return null;
                return (
                  <button
                    key={pageNum}
                    className={`btn btn-sm ${pageNum === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRVerifications;
