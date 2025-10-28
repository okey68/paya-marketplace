import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const MerchantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchMerchantDetails();
  }, [id]);

  const fetchMerchantDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch merchant details
      const merchantResponse = await axios.get(`/admin/merchants/${id}`);
      setMerchant(merchantResponse.data);
      
      // Fetch merchant's products
      const productsResponse = await axios.get(`/admin/merchants/${id}/products`);
      setProducts(productsResponse.data);
      
      // Fetch merchant's orders
      const ordersResponse = await axios.get(`/admin/merchants/${id}/orders`);
      setOrders(ordersResponse.data);
      
    } catch (error) {
      console.error('Failed to fetch merchant details:', error);
      toast.error('Failed to load merchant details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (status, rejectionReason = '') => {
    try {
      await axios.patch(`/admin/merchants/${id}/approval`, {
        status,
        rejectionReason
      });
      
      toast.success(`Merchant ${status} successfully`);
      fetchMerchantDetails();
    } catch (error) {
      console.error('Failed to update merchant:', error);
      toast.error('Failed to update merchant status');
    }
  };

  const handleBankApproval = async (status, rejectionReason = '') => {
    try {
      await axios.patch(`/admin/merchants/${id}/bank-approval`, {
        status,
        rejectionReason
      });
      
      toast.success(`Bank approval ${status} successfully`);
      fetchMerchantDetails();
    } catch (error) {
      console.error('Failed to update bank approval:', error);
      toast.error('Failed to update bank approval status');
    }
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

  const formatCurrency = (amount) => {
    return `KES ${(amount || 0).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="card">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Merchant not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/merchants')}>
            Back to Merchants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/merchants')}
          >
            ← Back
          </button>
          <div>
            <h1 className="page-title">{merchant.businessInfo?.businessName || 'Merchant Details'}</h1>
            <p className="page-subtitle">Detailed merchant information and activity</p>
          </div>
        </div>
      </div>

      {/* Merchant Overview Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-value">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div style={{ borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', gap: '2rem', padding: '0 1.5rem' }}>
            {[
              { key: 'details', label: 'Merchant Details' },
              { key: 'directors', label: 'Directors' },
              { key: 'documents', label: 'Documents' },
              { key: 'products', label: 'Products' },
              { key: 'orders', label: 'Orders' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '1rem 0',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
                  color: activeTab === tab.key ? '#667eea' : '#64748b',
                  fontWeight: activeTab === tab.key ? '600' : '500',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'details' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {/* Personal Information Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '1.2rem' }}>👤</span>
                    </div>
                    <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>
                      Personal Information
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Name:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>{merchant.firstName} {merchant.lastName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Email:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>{merchant.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Role:</span>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{merchant.role}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Active:</span>
                      <span className={`badge ${merchant.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {merchant.isActive ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Verified:</span>
                      <span className={`badge ${merchant.isVerified ? 'badge-success' : 'badge-warning'}`}>
                        {merchant.isVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Joined:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {new Date(merchant.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Last Login:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.lastLogin ? new Date(merchant.lastLogin).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Business Information Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '1.2rem' }}>🏢</span>
                    </div>
                    <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>
                      Business Information
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Business Name:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.businessName || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Company Number:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.companyNumber || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Registration Date:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.registrationDate ? new Date(merchant.businessInfo.registrationDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Tax Number:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.taxNumber || merchant.businessInfo?.taxId || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Trading Name:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.tradingName || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Business Type:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.businessType || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Type of Business:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.typeOfBusiness || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Industrial Sector:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.industrialSector || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Phone:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.phoneCountryCode || '+254'} {merchant.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Business Email:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.businessInfo?.businessEmail || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Paya Approval:</span>
                      {getStatusBadge(merchant.businessInfo?.payaApproval?.status || merchant.businessInfo?.approvalStatus)}
                    </div>
                    {merchant.businessInfo?.payaApproval?.approvedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>Paya Approved At:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>
                          {new Date(merchant.businessInfo.payaApproval.approvedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Bank Approval:</span>
                      {getStatusBadge(merchant.businessInfo?.bankApproval?.status || 'pending')}
                    </div>
                    {merchant.businessInfo?.bankApproval?.approvedAt && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>Bank Approved At:</span>
                        <span style={{ fontWeight: '600', color: '#2d3748' }}>
                          {new Date(merchant.businessInfo.bankApproval.approvedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '1.2rem' }}>📍</span>
                    </div>
                    <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>
                      Address
                    </h3>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Street:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.address?.street || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>City:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.address?.city || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>County:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.address?.county || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Postal Code:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.address?.postalCode || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Country:</span>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>
                        {merchant.address?.country || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '1.2rem' }}>⚙️</span>
                    </div>
                    <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.25rem', fontWeight: '600' }}>
                      Actions
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Paya Approval Actions */}
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Paya Approval</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(merchant.businessInfo?.payaApproval?.status || merchant.businessInfo?.approvalStatus) !== 'approved' && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleApproval('approved')}
                            style={{ flex: 1, padding: '0.75rem 1rem' }}
                          >
                            ✅ Approve
                          </button>
                        )}
                        {(merchant.businessInfo?.payaApproval?.status || merchant.businessInfo?.approvalStatus) === 'approved' && (
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) {
                                handleApproval('rejected', reason);
                              }
                            }}
                            style={{ flex: 1, padding: '0.75rem 1rem' }}
                          >
                            🚫 Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bank Approval Actions */}
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '600' }}>Bank Approval</h4>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(merchant.businessInfo?.bankApproval?.status || 'pending') !== 'approved' && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleBankApproval('approved')}
                            style={{ flex: 1, padding: '0.75rem 1rem' }}
                          >
                            ✅ Approve
                          </button>
                        )}
                        {(merchant.businessInfo?.bankApproval?.status || 'pending') === 'approved' && (
                          <button
                            className="btn btn-danger"
                            onClick={() => {
                              const reason = prompt('Rejection reason:');
                              if (reason) {
                                handleBankApproval('rejected', reason);
                              }
                            }}
                            style={{ flex: 1, padding: '0.75rem 1rem' }}
                          >
                            🚫 Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'directors' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>
                Directors ({merchant.businessInfo?.directors?.length || 0})
              </h3>
              {merchant.businessInfo?.directors && merchant.businessInfo.directors.length > 0 ? (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {merchant.businessInfo.directors.map((director, index) => (
                    <div key={index} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '1rem'
                        }}>
                          <span style={{ color: 'white', fontSize: '1.2rem' }}>👤</span>
                        </div>
                        <h4 style={{ margin: 0, color: '#2d3748', fontSize: '1.1rem', fontWeight: '600' }}>
                          Director {index + 1}: {director.name || 'N/A'}
                        </h4>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                            Date of Birth:
                          </span>
                          <span style={{ fontWeight: '600', color: '#2d3748' }}>
                            {director.dob ? new Date(director.dob).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                            Nationality:
                          </span>
                          <span style={{ fontWeight: '600', color: '#2d3748' }}>
                            {director.nationality || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                            KRA PIN:
                          </span>
                          <span style={{ fontWeight: '600', color: '#2d3748' }}>
                            {director.kraPin || 'N/A'}
                          </span>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#64748b', fontWeight: '500', display: 'block', marginBottom: '0.25rem' }}>
                            Address:
                          </span>
                          <span style={{ fontWeight: '600', color: '#2d3748' }}>
                            {director.address || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👥</span>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>No directors information available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>Business Documents</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation' },
                  { key: 'kraPinCertificate', label: 'KRA PIN Certificate' },
                  { key: 'cr12', label: 'CR-12' },
                  { key: 'businessPermit', label: 'Business Permit' }
                ].map(doc => (
                  <div key={doc.key} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#f7fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>📄</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#2d3748' }}>{doc.label}</div>
                        {merchant.businessInfo?.documents?.[doc.key]?.originalName && (
                          <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                            {merchant.businessInfo.documents[doc.key].originalName}
                          </div>
                        )}
                      </div>
                    </div>
                    {merchant.businessInfo?.documents?.[doc.key]?.filename ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${merchant.businessInfo.documents[doc.key].path}`;
                            link.download = merchant.businessInfo.documents[doc.key].originalName || doc.label;
                            link.click();
                          }}
                          style={{
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#e2e8f0',
                            border: '1px solid #cbd5e0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#64748b'
                          }}
                          title="Download"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                        </button>
                        <a 
                          href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${merchant.businessInfo.documents[doc.key].path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-primary"
                        >
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="badge badge-warning">Not Uploaded</span>
                    )}
                  </div>
                ))}
              </div>

              <h3 style={{ marginBottom: '1.5rem', color: '#2d3748', marginTop: '2rem' }}>Director Documents</h3>
              {merchant.businessInfo?.directors && merchant.businessInfo.directors.length > 0 ? (
                <div style={{ display: 'grid', gap: '2rem' }}>
                  {merchant.businessInfo.directors.map((director, dirIndex) => (
                    <div key={dirIndex}>
                      <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>
                        Director {dirIndex + 1}: {director.name}
                      </h4>
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        {[
                          { key: 'photoIdFront', label: 'Photo ID (Front)' },
                          { key: 'photoIdBack', label: 'Photo ID (Back)' },
                          { key: 'kraCertificate', label: 'KRA Certificate' },
                          { key: 'proofOfAddress', label: 'Proof of Address' },
                          { key: 'selfie', label: 'Selfie with Thumbs Up' }
                        ].map(doc => (
                          <div key={doc.key} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '1rem',
                            background: '#f7fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>📄</span>
                              <div>
                                <div style={{ fontWeight: '600', color: '#2d3748' }}>{doc.label}</div>
                                {director.documents?.[doc.key]?.originalName && (
                                  <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                                    {director.documents[doc.key].originalName}
                                  </div>
                                )}
                              </div>
                            </div>
                            {director.documents?.[doc.key]?.filename ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${director.documents[doc.key].path}`;
                                    link.download = director.documents[doc.key].originalName || doc.label;
                                    link.click();
                                  }}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#e2e8f0',
                                    border: '1px solid #cbd5e0',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: '#64748b'
                                  }}
                                  title="Download"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                </button>
                                <a 
                                  href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${director.documents[doc.key].path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-primary"
                                >
                                  View
                                </a>
                              </div>
                            ) : (
                              <span className="badge badge-warning">Not Uploaded</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#718096', background: '#f7fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>No director documents available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Products ({products.length})</h3>
              {products.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {product.images?.[0] && (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                              )}
                              <div>
                                <strong>{product.name}</strong>
                                <br />
                                <small style={{ color: '#718096' }}>{product.sku}</small>
                              </div>
                            </div>
                          </td>
                          <td>{product.category}</td>
                          <td>{formatCurrency(product.price)}</td>
                          <td>{product.inventory?.quantity || 0}</td>
                          <td>
                            <span className={`badge ${product.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {product.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                  No products found
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Orders ({orders.length})</h3>
              {orders.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id}>
                          <td>#{order._id.slice(-6)}</td>
                          <td>
                            <div>
                              <strong>{order.customer?.firstName} {order.customer?.lastName}</strong>
                              <br />
                              <small style={{ color: '#718096' }}>{order.customer?.email}</small>
                            </div>
                          </td>
                          <td>{order.items?.length || 0} items</td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                          <td>
                            <span className={`badge badge-${order.status === 'completed' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                  No orders found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDetail;
