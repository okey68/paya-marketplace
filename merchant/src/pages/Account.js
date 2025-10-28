import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Account.css';

const Account = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('banking');
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState({
    payaApproval: 'pending',
    bankApproval: 'pending'
  });

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = user.businessInfo?.businessName && 
                                      user.businessInfo?.companyNumber &&
                                      user.businessInfo?.directors?.length > 0;
      
      if (!hasCompletedOnboarding) {
        toast.error('Please complete your onboarding first');
        navigate('/onboarding');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.businessInfo) {
      setApprovalStatus({
        payaApproval: user.businessInfo?.payaApproval?.status || user.businessInfo?.approvalStatus || 'pending',
        bankApproval: user.businessInfo?.bankApproval?.status || 'pending'
      });
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.user || response.data;
      updateUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to refresh data');
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

  const renderBusinessInfo = () => (
    <div className="account-section">
      <div className="section-header">
        <h2>Business Information</h2>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h3>Company Details</h3>
          <div className="info-row">
            <span className="info-label">Business Name:</span>
            <span className="info-value">{user.businessInfo?.businessName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Trading Name:</span>
            <span className="info-value">{user.businessInfo?.tradingName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Company Number:</span>
            <span className="info-value">{user.businessInfo?.companyNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Tax Number:</span>
            <span className="info-value">{user.businessInfo?.taxNumber || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Business Type:</span>
            <span className="info-value">{user.businessInfo?.businessType || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Type of Business:</span>
            <span className="info-value">{user.businessInfo?.typeOfBusiness || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Industrial Sector:</span>
            <span className="info-value">{user.businessInfo?.industrialSector || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Registration Date:</span>
            <span className="info-value">
              {user.businessInfo?.registrationDate 
                ? new Date(user.businessInfo.registrationDate).toLocaleDateString() 
                : 'N/A'}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h3>Contact Information</h3>
          <div className="info-row">
            <span className="info-label">Business Email:</span>
            <span className="info-value">{user.businessInfo?.businessEmail || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone:</span>
            <span className="info-value">
              {user.phoneCountryCode || '+254'} {user.phoneNumber || 'N/A'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Street:</span>
            <span className="info-value">{user.address?.street || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">City:</span>
            <span className="info-value">{user.address?.city || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">County:</span>
            <span className="info-value">{user.address?.county || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Postal Code:</span>
            <span className="info-value">{user.address?.postalCode || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Country:</span>
            <span className="info-value">{user.address?.country || 'N/A'}</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Approval Status</h3>
          <div className="info-row">
            <span className="info-label">Paya Approval:</span>
            {getStatusBadge(approvalStatus.payaApproval)}
          </div>
          {user.businessInfo?.payaApproval?.approvedAt && (
            <div className="info-row">
              <span className="info-label">Paya Approved At:</span>
              <span className="info-value">
                {new Date(user.businessInfo.payaApproval.approvedAt).toLocaleString()}
              </span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Bank Approval:</span>
            {getStatusBadge(approvalStatus.bankApproval)}
          </div>
          {user.businessInfo?.bankApproval?.approvedAt && (
            <div className="info-row">
              <span className="info-label">Bank Approved At:</span>
              <span className="info-value">
                {new Date(user.businessInfo.bankApproval.approvedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDirectors = () => (
    <div className="account-section">
      <h2>Directors</h2>
      {user.businessInfo?.directors && user.businessInfo.directors.length > 0 ? (
        <div className="directors-grid">
          {user.businessInfo.directors.map((director, index) => (
            <div key={index} className="info-card">
              <h3>Director {index + 1}</h3>
              <div className="info-row">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{director.fullName || director.name || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">KRA PIN:</span>
                <span className="info-value">{director.kraPin || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Nationality:</span>
                <span className="info-value">{director.nationality || 'N/A'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Date of Birth:</span>
                <span className="info-value">
                  {director.dob || director.dateOfBirth
                    ? new Date(director.dob || director.dateOfBirth).toLocaleDateString() 
                    : 'N/A'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{director.address || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-data">No directors information available</p>
      )}
    </div>
  );

  const renderDocuments = () => {
    const businessDocs = [
      { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', file: user.businessInfo?.documents?.certificateOfIncorporation },
      { key: 'kraPinCertificate', label: 'KRA PIN Certificate', file: user.businessInfo?.documents?.kraPinCertificate },
      { key: 'cr12', label: 'CR-12', file: user.businessInfo?.documents?.cr12 },
      { key: 'businessPermit', label: 'Business Permit', file: user.businessInfo?.documents?.businessPermit },
      { key: 'bankStatement', label: 'Bank Statement', file: user.businessInfo?.documents?.bankStatement }
    ];

    return (
      <div className="account-section">
        <h2>Business Documents</h2>
        <div className="documents-grid">
          {businessDocs.map(doc => doc.file && (
            <div key={doc.key} className="document-card">
              <div className="document-card-content">
                <span className="document-icon-large">📄</span>
                <div className="document-info">
                  <h4>{doc.label}</h4>
                  <p className="document-filename">{doc.file.originalName || doc.file.filename || 'Uploaded document'}</p>
                </div>
              </div>
              <div className="document-actions">
                <button 
                  className="btn-download"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = doc.file.url || doc.file.path;
                    link.download = doc.file.originalName || doc.file.filename || doc.label;
                    link.click();
                  }}
                  title="Download"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => window.open(doc.file.url || doc.file.path, '_blank')}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {user.businessInfo?.directors && user.businessInfo.directors.length > 0 && (
          <>
            <h2 style={{ marginTop: '3rem' }}>Director Documents</h2>
            {user.businessInfo.directors.map((director, index) => {
              const directorDocs = [
                { key: 'photoIdFront', label: 'Photo ID (Front)', file: director.documents?.photoIdFront },
                { key: 'photoIdBack', label: 'Photo ID (Back)', file: director.documents?.photoIdBack },
                { key: 'kraCertificate', label: 'KRA Certificate', file: director.documents?.kraCertificate },
                { key: 'proofOfAddress', label: 'Proof of Address', file: director.documents?.proofOfAddress },
                { key: 'selfie', label: 'Selfie', file: director.documents?.selfie }
              ];

              return (
                <div key={index} style={{ marginBottom: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#4a5568', fontSize: '1.1rem' }}>
                    Director {index + 1}: {director.name || director.fullName || 'N/A'}
                  </h3>
                  <div className="documents-grid">
                    {directorDocs.map(doc => doc.file && (
                      <div key={doc.key} className="document-card">
                        <div className="document-card-content">
                          <span className="document-icon-large">📄</span>
                          <div className="document-info">
                            <h4>{doc.label}</h4>
                            <p className="document-filename">{doc.file.originalName || doc.file.filename || 'Uploaded document'}</p>
                          </div>
                        </div>
                        <div className="document-actions">
                          <button 
                            className="btn-download"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.file.url || doc.file.path;
                              link.download = doc.file.originalName || doc.file.filename || doc.label;
                              link.click();
                            }}
                            title="Download"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => window.open(doc.file.url || doc.file.path, '_blank')}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };

  const renderBanking = () => {
    const isWalletActive = approvalStatus.payaApproval === 'approved' && approvalStatus.bankApproval === 'approved';
    
    // Mock transaction data - replace with real API call
    const transactions = [];
    
    return (
      <div className="banking-wallet-section">
        {/* Approval Status Banner - Show if not fully approved */}
        {!isWalletActive && (
          <div className="approval-banner">
            <div className="approval-status-cards">
              <div className={`approval-card ${approvalStatus.payaApproval === 'approved' ? 'approved' : 'pending'}`}>
                <div className="approval-icon">
                  {approvalStatus.payaApproval === 'approved' ? '✅' : '⏳'}
                </div>
                <div className="approval-content">
                  <h4>Paya Approval</h4>
                  <p className="approval-status">{approvalStatus.payaApproval === 'approved' ? 'Approved' : 'Pending Review'}</p>
                  {user.businessInfo?.payaApproval?.approvedAt && (
                    <small>{new Date(user.businessInfo.payaApproval.approvedAt).toLocaleString()}</small>
                  )}
                </div>
              </div>
              <div className={`approval-card ${approvalStatus.bankApproval === 'approved' ? 'approved' : 'pending'}`}>
                <div className="approval-icon">
                  {approvalStatus.bankApproval === 'approved' ? '✅' : '⏳'}
                </div>
                <div className="approval-content">
                  <h4>Bank Approval</h4>
                  <p className="approval-status">{approvalStatus.bankApproval === 'approved' ? 'Approved' : 'Pending Setup'}</p>
                  {user.businessInfo?.bankApproval?.approvedAt && (
                    <small>{new Date(user.businessInfo.bankApproval.approvedAt).toLocaleString()}</small>
                  )}
                </div>
              </div>
            </div>
            <p className="approval-message">
              {!isWalletActive && '⏳ Your wallet will be activated once both approvals are complete'}
            </p>
          </div>
        )}

        {/* Business Accounts Section */}
        <div className="business-accounts-section">
          <div className="section-header">
            <div>
              <h2>Business Accounts</h2>
              <p>Manage your business accounts and cards</p>
            </div>
          </div>

          <div className="account-card-container">
            {/* Main Business Account Card */}
            <div className="business-account-card">
              <div className="card-header-status">
                <h3 className="business-name">{user.businessInfo?.businessName || user.firstName + ' ' + user.lastName || 'Paya Business'}</h3>
                <span className={`status-badge-card ${approvalStatus.bankApproval === 'approved' ? 'active' : 'inactive'}`}>
                  {approvalStatus.bankApproval === 'approved' ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="card-body">
                <p className="balance-label">Available Balance</p>
                <h2 className="balance-amount">0 KES</h2>
              </div>
              <div className="card-footer">
                <span className="account-number">•••••••••••• {user._id?.slice(-4) || '1234'}</span>
                <span className="card-action-icon">💵</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              <button className="action-button" disabled>
                <div className="action-icon blue">↔️</div>
                <div className="action-content">
                  <h4>Send to Paya</h4>
                  <p>Transfer instantly</p>
                </div>
              </button>
              
              <button className="action-button" disabled>
                <div className="action-icon purple">📱</div>
                <div className="action-content">
                  <h4>Mobile Money</h4>
                  <p>Send to mobile</p>
                </div>
              </button>
              
              <button className="action-button" disabled>
                <div className="action-icon green">💳</div>
                <div className="action-content">
                  <h4>Deposit</h4>
                  <p>Add funds</p>
                </div>
              </button>
              
              <button className="action-button" disabled>
                <div className="action-icon orange">🏦</div>
                <div className="action-content">
                  <h4>Bank Transfer</h4>
                  <p>Send to bank</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="transaction-history-section">
          <div className="section-header">
            <h2>Transaction History ({transactions.length})</h2>
            <button className="btn btn-secondary export-btn" disabled>
              📥 Export
            </button>
          </div>

          <div className="transaction-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="search-input"
              />
            </div>
            <select className="filter-select">
              <option>All Status</option>
              <option>Success</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
            <select className="filter-select">
              <option>All Types</option>
              <option>Credit</option>
              <option>Debit</option>
              <option>Transfer</option>
            </select>
            <div className="pagination-info">
              <span>Show:</span>
              <select className="filter-select small">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <div className="transactions-table-container">
            {transactions.length > 0 ? (
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Gateway</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn, index) => (
                    <tr key={index}>
                      <td>
                        <span className="transaction-type-icon">⭕</span>
                      </td>
                      <td>**** {txn.account}</td>
                      <td className="amount">KES {txn.amount.toLocaleString()}</td>
                      <td>{txn.description}</td>
                      <td>{txn.gateway}</td>
                      <td>{txn.date}</td>
                      <td>
                        <span className="status-badge success">{txn.status}</span>
                      </td>
                      <td>
                        <button className="view-btn">👁️ View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-transactions">
                <div className="empty-icon">💳</div>
                <h3>No Transactions Yet</h3>
                <p>Your transaction history will appear here once you start receiving payments</p>
                {!isWalletActive && (
                  <small>Complete your approval process to activate your wallet</small>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { key: 'banking', label: 'Banking & Wallet', icon: '🏦' },
    { key: 'business', label: 'Business Info', icon: '🏢' },
    { key: 'directors', label: 'Directors', icon: '👥' },
    { key: 'documents', label: 'Documents', icon: '📄' }
  ];

  return (
    <div className="account-page">
      <div className="container">
        <div className="page-header">
          <h1>Account Settings</h1>
          <p>Manage your business information and settings</p>
        </div>

        <div className="account-tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="account-content">
          {activeTab === 'business' && renderBusinessInfo()}
          {activeTab === 'directors' && renderDirectors()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'banking' && renderBanking()}
        </div>
      </div>
    </div>
  );
};

export default Account;
