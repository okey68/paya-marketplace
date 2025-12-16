import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const HRVerificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [contactReason, setContactReason] = useState('');
  const [contactMethod, setContactMethod] = useState('email');

  useEffect(() => {
    fetchVerification();
  }, [id]);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/hr-verification/${id}`);
      setVerification(response.data.verification);
    } catch (error) {
      console.error('Error fetching verification:', error);
      toast.error('Failed to load verification details');
      navigate('/hr-verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setActionLoading(true);
      await axios.patch(`/hr-verification/${id}/verify`, { notes: verifyNotes });
      toast.success('Verification marked as verified');
      setShowVerifyModal(false);
      setVerifyNotes('');
      fetchVerification();
    } catch (error) {
      console.error('Error verifying:', error);
      toast.error(error.response?.data?.message || 'Failed to verify');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(true);
      await axios.patch(`/hr-verification/${id}/reject`, { reason: rejectReason });
      toast.success('Verification marked as not verified');
      setShowRejectModal(false);
      setRejectReason('');
      fetchVerification();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(error.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleContactCustomer = async () => {
    if (!contactReason.trim()) {
      toast.error('Please provide a reason for contacting the customer');
      return;
    }
    try {
      setActionLoading(true);
      await axios.post(`/hr-verification/${id}/contact-customer`, {
        reason: contactReason,
        method: contactMethod
      });
      toast.success('Customer contacted successfully');
      setShowContactModal(false);
      setContactReason('');
      fetchVerification();
    } catch (error) {
      console.error('Error contacting customer:', error);
      toast.error(error.response?.data?.message || 'Failed to contact customer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setActionLoading(true);
      await axios.post(`/hr-verification/${id}/send-email`);
      toast.success('Email sent to HR successfully');
      fetchVerification();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setActionLoading(true);
      await axios.post(`/hr-verification/${id}/resend-email`);
      toast.success('Reminder sent to HR');
      fetchVerification();
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setActionLoading(true);
      await axios.post(`/hr-verification/${id}/escalate`, { reason: 'Manually escalated by admin' });
      toast.success('Verification escalated');
      fetchVerification();
    } catch (error) {
      console.error('Error escalating:', error);
      toast.error(error.response?.data?.message || 'Failed to escalate');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this verification?')) return;
    try {
      setActionLoading(true);
      await axios.post(`/hr-verification/${id}/cancel`, { reason: 'Cancelled by admin' });
      toast.success('Verification cancelled');
      fetchVerification();
    } catch (error) {
      console.error('Error cancelling:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
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

  // Helper function to construct document URL from path
  const getDocumentUrl = (path) => {
    if (!path) return '#';

    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

    // Handle different path formats
    // If path starts with /uploads, use it directly
    if (path.startsWith('/uploads')) {
      return `${baseUrl}${path}`;
    }

    // If path is an absolute path containing 'uploads', extract from /uploads onwards
    const uploadsIndex = path.indexOf('/uploads');
    if (uploadsIndex !== -1) {
      return `${baseUrl}${path.substring(uploadsIndex)}`;
    }

    // Fallback: assume it's a relative path and prepend /uploads
    return `${baseUrl}/uploads/${path}`;
  };

  const isPending = ['pending_send', 'email_sent', 'awaiting_response', 'customer_contacted', 'timeout'].includes(verification?.status);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Verification not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/hr-verifications')}>
          Back to List
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'customer', label: 'Customer Info' },
    { key: 'documents', label: 'Documents' },
    { key: 'timeline', label: 'Timeline' }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/hr-verifications')}
          style={{ marginBottom: '1rem' }}
        >
          &larr; Back to Verifications
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
              HR Verification - {verification.order?.orderNumber || 'N/A'}
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {getStatusBadge(verification.status)}
              {verification.isEscalated && (
                <span className="badge badge-danger">ESCALATED</span>
              )}
              {verification.isPriority && (
                <span className="badge badge-warning">PRIORITY</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {verification.status === 'pending_send' && (
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={actionLoading}
                >
                  Send Email to HR
                </button>
              )}
              {['email_sent', 'awaiting_response', 'timeout'].includes(verification.status) && (
                <button
                  className="btn btn-secondary"
                  onClick={handleResendEmail}
                  disabled={actionLoading}
                >
                  Send Reminder
                </button>
              )}
              <button
                className="btn btn-success"
                onClick={() => setShowVerifyModal(true)}
                disabled={actionLoading}
              >
                Mark Verified
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                Mark Not Verified
              </button>
              <button
                className="btn btn-warning"
                onClick={() => setShowContactModal(true)}
                disabled={actionLoading}
              >
                Contact Customer
              </button>
              {!verification.isEscalated && (
                <button
                  className="btn btn-secondary"
                  onClick={handleEscalate}
                  disabled={actionLoading}
                >
                  Escalate
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(verification.order?.totalAmount)}</div>
          <div className="stat-label">Order Amount</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatCurrency(verification.customerSnapshot?.monthlyIncome)}</div>
          <div className="stat-label">Monthly Income</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{verification.daysSinceEmailSent ?? '-'}</div>
          <div className="stat-label">Days Since Email Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{verification.remindersSent?.length || 0}</div>
          <div className="stat-label">Reminders Sent</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 1rem'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '600' : '400',
                color: activeTab === tab.key ? '#667eea' : '#718096',
                borderBottom: activeTab === tab.key ? '2px solid #667eea' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card-body" style={{ padding: '1.5rem' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Order Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Order Information</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Order Number</label>
                    <div>{verification.order?.orderNumber || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Order Status</label>
                    <div>{verification.order?.status || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Total Amount</label>
                    <div>{formatCurrency(verification.order?.totalAmount)}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Order Date</label>
                    <div>{formatDate(verification.order?.createdAt)}</div>
                  </div>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => navigate(`/orders/${verification.order?._id}`)}
                    style={{ width: 'fit-content' }}
                  >
                    View Order Details
                  </button>
                </div>
              </div>

              {/* HR Contact Info */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>HR Contact Information</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Company</label>
                    <div>{verification.hrContactSnapshot?.companyName || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Contact Name</label>
                    <div>{verification.hrContactSnapshot?.contactName || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Email</label>
                    <div>
                      <a href={`mailto:${verification.hrContactSnapshot?.email}`}>
                        {verification.hrContactSnapshot?.email || '-'}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Phone</label>
                    <div>{verification.hrContactSnapshot?.phone || '-'}</div>
                  </div>
                </div>
              </div>

              {/* Email Tracking */}
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Email Tracking</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Email Sent</label>
                    <div>{verification.emailSentAt ? formatDate(verification.emailSentAt) : 'Not sent'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Response Deadline</label>
                    <div style={{ color: verification.isOverdue ? '#e53e3e' : 'inherit' }}>
                      {verification.responseDeadline ? formatDate(verification.responseDeadline) : '-'}
                      {verification.isOverdue && ' (OVERDUE)'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Reminders Sent</label>
                    <div>{verification.remindersSent?.length || 0}</div>
                  </div>
                </div>
              </div>

              {/* Verification Result */}
              {verification.verificationResult && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Verification Result</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Result</label>
                      <div>
                        {verification.verificationResult.verified ? (
                          <span style={{ color: '#48bb78' }}>Verified</span>
                        ) : (
                          <span style={{ color: '#e53e3e' }}>Not Verified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Reason/Notes</label>
                      <div>{verification.verificationResult.reason || '-'}</div>
                    </div>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Reviewed At</label>
                      <div>{formatDate(verification.reviewedAt)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customer Tab */}
          {activeTab === 'customer' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Customer Details</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Name</label>
                    <div>{verification.customerSnapshot?.firstName} {verification.customerSnapshot?.lastName}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Email</label>
                    <div>
                      <a href={`mailto:${verification.customerSnapshot?.email}`}>
                        {verification.customerSnapshot?.email}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Employer</label>
                    <div>{verification.customerSnapshot?.employerName || '-'}</div>
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Monthly Income</label>
                    <div>{formatCurrency(verification.customerSnapshot?.monthlyIncome)}</div>
                  </div>
                </div>
              </div>

              {verification.customerContact && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Customer Contact History</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Contacted At</label>
                      <div>{formatDate(verification.customerContact.contactedAt)}</div>
                    </div>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Method</label>
                      <div style={{ textTransform: 'capitalize' }}>{verification.customerContact.contactMethod}</div>
                    </div>
                    <div>
                      <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Reason</label>
                      <div>{verification.customerContact.contactReason}</div>
                    </div>
                    {verification.customerContact.customerResponse && (
                      <div>
                        <label style={{ fontWeight: '600', color: '#718096', fontSize: '0.875rem' }}>Customer Response</label>
                        <div>{verification.customerContact.customerResponse}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Payslip Document Card */}
              <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: verification.payslipPath ? '#ebf8ff' : '#f7fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={verification.payslipPath ? '#3182ce' : '#a0aec0'} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>Payslip Document</h4>
                    {verification.payslipPath ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#c6f6d5',
                            color: '#276749',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Uploaded
                          </span>
                        </div>
                        <p style={{ color: '#718096', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                          <strong>Filename:</strong> {verification.payslipOriginalName || 'Payslip document'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a
                            href={getDocumentUrl(verification.payslipPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </a>
                          <a
                            href={getDocumentUrl(verification.payslipPath)}
                            download={verification.payslipOriginalName || 'payslip'}
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>No payslip uploaded</p>
                    )}
                  </div>
                </div>
              </div>

              {/* BNPL Agreement Document Card */}
              <div className="card" style={{ padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: verification.agreementPdfPath ? '#faf5ff' : '#f7fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={verification.agreementPdfPath ? '#805ad5' : '#a0aec0'} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M9 15l2 2 4-4" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#2d3748' }}>BNPL Agreement</h4>
                    {verification.agreementPdfPath ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#e9d8fd',
                            color: '#553c9a',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Generated
                          </span>
                          {verification.order?.payment?.bnpl?.agreementAccepted && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#c6f6d5',
                              color: '#276749',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Signed by Customer
                            </span>
                          )}
                        </div>

                        {/* Agreement Details */}
                        <div style={{
                          backgroundColor: '#f7fafc',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          marginBottom: '0.75rem',
                          fontSize: '0.875rem'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div>
                              <span style={{ color: '#718096' }}>Loan Amount:</span>{' '}
                              <strong>{formatCurrency(verification.order?.payment?.bnpl?.loanAmount)}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#718096' }}>Loan Term:</span>{' '}
                              <strong>{verification.order?.payment?.bnpl?.loanTerm || 30} days</strong>
                            </div>
                            <div>
                              <span style={{ color: '#718096' }}>Due Date:</span>{' '}
                              <strong>{verification.order?.payment?.bnpl?.dueDate ? formatDate(verification.order.payment.bnpl.dueDate) : '-'}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#718096' }}>Signed:</span>{' '}
                              <strong style={{ color: verification.order?.payment?.bnpl?.agreementAccepted ? '#276749' : '#c53030' }}>
                                {verification.order?.payment?.bnpl?.agreementAccepted ? 'Yes' : 'No'}
                              </strong>
                            </div>
                          </div>
                          {verification.order?.payment?.bnpl?.agreementAcceptedAt && (
                            <div style={{ marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                              <span style={{ color: '#718096' }}>Accepted on:</span>{' '}
                              <strong>{formatDate(verification.order.payment.bnpl.agreementAcceptedAt)}</strong>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <a
                            href={getDocumentUrl(verification.agreementPdfPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Agreement
                          </a>
                          <a
                            href={getDocumentUrl(verification.agreementPdfPath)}
                            download={`BNPL_Agreement_${verification.order?.orderNumber || 'document'}.pdf`}
                            className="btn btn-sm btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#a0aec0', fontStyle: 'italic' }}>Agreement not generated yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Summary Card */}
              <div className="card" style={{ padding: '1rem', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#4a5568', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Document Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: verification.payslipPath ? '#48bb78' : '#e53e3e'
                    }}>
                      {verification.payslipPath ? '1' : '0'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>Payslip</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: verification.agreementPdfPath ? '#48bb78' : '#e53e3e'
                    }}>
                      {verification.agreementPdfPath ? '1' : '0'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>Agreement</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: 'white', borderRadius: '6px' }}>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: verification.order?.payment?.bnpl?.agreementAccepted ? '#48bb78' : '#ed8936'
                    }}>
                      {verification.order?.payment?.bnpl?.agreementAccepted ? 'Yes' : 'No'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>Agreement Signed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#2d3748' }}>Activity Timeline</h3>
              {verification.timeline && verification.timeline.length > 0 ? (
                <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                  <div style={{
                    position: 'absolute',
                    left: '0.5rem',
                    top: '0.5rem',
                    bottom: '0.5rem',
                    width: '2px',
                    backgroundColor: '#e2e8f0'
                  }} />
                  {verification.timeline.map((entry, index) => (
                    <div
                      key={entry._id || index}
                      style={{
                        position: 'relative',
                        paddingBottom: '1.5rem',
                        paddingLeft: '1.5rem'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        left: '-0.25rem',
                        top: '0.25rem',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                        border: '2px solid white',
                        boxShadow: '0 0 0 2px #667eea'
                      }} />
                      <div style={{
                        backgroundColor: '#f7fafc',
                        padding: '1rem',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ textTransform: 'capitalize' }}>
                            {entry.action?.replace(/_/g, ' ')}
                          </strong>
                          <span style={{ color: '#718096', fontSize: '0.875rem' }}>
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        {entry.details && (
                          <p style={{ color: '#4a5568', margin: 0 }}>{entry.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#718096' }}>No timeline entries</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header">
              <h3>Mark as Verified</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Add any notes about the verification..."
                />
              </div>
              <p style={{ color: '#718096', fontSize: '0.875rem' }}>
                This will mark the verification as verified and update the order status to "HR Verified".
              </p>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handleVerify} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Confirm Verification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header">
              <h3>Mark as Not Verified</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Reason for rejection *</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the verification failed..."
                  required
                />
              </div>
              <p style={{ color: '#e53e3e', fontSize: '0.875rem' }}>
                This will mark the verification as not verified and update the order status accordingly.
              </p>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Customer Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem' }}>
            <div className="card-header">
              <h3>Contact Customer</h3>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Contact Method</label>
                <select
                  className="form-input"
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Contact *</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={contactReason}
                  onChange={(e) => setContactReason(e.target.value)}
                  placeholder="Explain why you need to contact the customer..."
                  required
                />
              </div>
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowContactModal(false)}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={handleContactCustomer} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Contact Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRVerificationDetail;
