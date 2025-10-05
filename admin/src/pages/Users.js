import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      customer: { class: 'badge-success', label: 'Customer' },
      merchant: { class: 'badge-info', label: 'Merchant' },
      admin: { class: 'badge-danger', label: 'Admin' }
    };
    
    const config = roleConfig[role] || { class: 'badge-info', label: role };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getVerificationStatus = (user) => {
    if (user.role === 'merchant') {
      const status = user.businessInfo?.approvalStatus;
      if (status === 'approved') {
        return <span className="badge badge-success">Verified</span>;
      } else if (status === 'pending') {
        return <span className="badge badge-warning">Pending</span>;
      } else if (status === 'rejected') {
        return <span className="badge badge-danger">Rejected</span>;
      }
    }
    
    return user.isVerified ? 
      <span className="badge badge-success">Verified</span> : 
      <span className="badge badge-warning">Unverified</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              className="form-input"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
            >
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="merchant">Merchant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-input"
              placeholder="Name, email, business..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Users ({pagination.totalItems || 0})
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div>
                        <strong>
                          {user.role === 'merchant' && user.businessInfo?.businessName ? 
                            user.businessInfo.businessName : 
                            `${user.firstName} ${user.lastName}`
                          }
                        </strong>
                        {user.role === 'merchant' && user.businessInfo?.businessName && (
                          <div>
                            <small style={{ color: '#718096' }}>
                              {user.firstName} {user.lastName}
                            </small>
                          </div>
                        )}
                        {user.role === 'merchant' && user.businessInfo?.businessType && (
                          <div>
                            <small style={{ color: '#718096' }}>
                              {user.businessInfo.businessType}
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {user.email}
                      {user.role === 'merchant' && user.businessInfo?.businessEmail && 
                       user.businessInfo.businessEmail !== user.email && (
                        <div>
                          <small style={{ color: '#718096' }}>
                            Business: {user.businessInfo.businessEmail}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getVerificationStatus(user)}</td>
                    <td>
                      {user.address?.city && user.address?.county ? 
                        `${user.address.city}, ${user.address.county}` : 
                        user.address?.country || 'N/A'
                      }
                    </td>
                    <td>
                      {user.lastLogin ? 
                        new Date(user.lastLogin).toLocaleDateString() : 
                        'Never'
                      }
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                No users found
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
              onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
            >
              Previous
            </button>
            
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
