import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Merchants = () => {
  const navigate = useNavigate();
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchMerchants();
  }, [filters]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/admin/merchants?${params}`);
      setMerchants(response.data.merchants);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (merchantId, status, rejectionReason = '') => {
    try {
      await axios.patch(`/admin/merchants/${merchantId}/approval`, {
        status,
        rejectionReason
      });
      
      toast.success(`Merchant ${status} successfully`);
      fetchMerchants();
    } catch (error) {
      console.error('Failed to update merchant:', error);
      toast.error('Failed to update merchant status');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
      page: 1 // Reset to first page when filtering
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'badge-warning', label: 'Pending' },
      approved: { class: 'badge-success', label: 'Approved' },
      rejected: { class: 'badge-danger', label: 'Rejected' }
    };
    
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Merchants</h1>
        <p className="page-subtitle">Manage merchant applications and approvals</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Search merchants..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Merchants ({pagination.totalItems || 0})
          </h3>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Products</th>
                  <th>Orders</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr key={merchant._id}>
                    <td>
                      <button
                        onClick={() => navigate(`/merchants/${merchant._id}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#667eea',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <strong>{merchant.businessInfo?.businessName || 'N/A'}</strong>
                      </button>
                      <br />
                      <small style={{ color: '#718096' }}>
                        {merchant.businessInfo?.businessType || 'retail'}
                      </small>
                    </td>
                    <td>{merchant.firstName} {merchant.lastName}</td>
                    <td>{merchant.email}</td>
                    <td>{getStatusBadge(merchant.businessInfo?.approvalStatus)}</td>
                    <td>{merchant.stats?.productCount || 0}</td>
                    <td>{merchant.stats?.orderCount || 0}</td>
                    <td>{new Date(merchant.createdAt).toLocaleDateString()}</td>
                    <td>
                      {merchant.businessInfo?.approvalStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApproval(merchant._id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) {
                                handleApproval(merchant._id, 'rejected', reason);
                              }
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {merchant.businessInfo?.approvalStatus === 'rejected' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApproval(merchant._id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      
                      {merchant.businessInfo?.approvalStatus === 'approved' && (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {merchants.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                No merchants found
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem', 
            padding: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === 1}
              onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Merchants;
