import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await axios.patch(`/orders/${id}/status`, {
        status: newStatus,
        note: `Status updated to ${newStatus} by admin`
      });
      
      setOrder(prev => ({
        ...prev,
        status: newStatus,
        timeline: [
          ...prev.timeline,
          {
            status: newStatus,
            timestamp: new Date(),
            note: `Status updated to ${newStatus} by admin`
          }
        ]
      }));
      
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
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

  // Helper function to construct document URL from path
  const getDocumentUrl = (path) => {
    if (!path) return '#';

    const baseUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

    // Handle different path formats
    if (path.startsWith('/uploads')) {
      return `${baseUrl}${path}`;
    }

    const uploadsIndex = path.indexOf('/uploads');
    if (uploadsIndex !== -1) {
      return `${baseUrl}${path.substring(uploadsIndex)}`;
    }

    return `${baseUrl}/uploads/${path}`;
  };

  const generatePaymentSchedule = (bnplDetails) => {
    if (!bnplDetails) return [];
    
    const { loanAmount, loanTerm } = bnplDetails;
    const numberOfPayments = 4; // 4 monthly payments
    const monthlyPayment = loanAmount / numberOfPayments;
    
    const schedule = [];
    for (let i = 0; i < numberOfPayments; i++) {
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      
      schedule.push({
        paymentNumber: i + 1,
        dueDate: paymentDate,
        amount: monthlyPayment,
        status: i === 0 ? 'upcoming' : 'pending'
      });
    }
    
    return schedule;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="error-container">
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  const customerName = order.customer 
    ? `${order.customer.firstName} ${order.customer.lastName}` 
    : `${order.customerInfo?.firstName || ''} ${order.customerInfo?.lastName || ''}`.trim() || 'N/A';

  const customerEmail = order.customer?.email || order.customerInfo?.email || 'N/A';
  const paymentSchedule = generatePaymentSchedule(order.payment?.bnpl);

  return (
    <div className="admin-order-detail">
      <div className="order-detail-header">
        <div className="header-left">
          <button onClick={() => navigate('/orders')} className="btn btn-outline">
            ← Back to Orders
          </button>
          <div className="order-title">
            <h1>Order #{order.orderNumber}</h1>
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-outline timeline-btn"
            onClick={() => setShowTimeline(true)}
            title="View Order Timeline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            className="status-select"
          >
            <option value="pending_payment">Pending Payment</option>
            <option value="underwriting">Underwriting</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="order-detail-content">
        {/* Condensed Top Section - 2 columns */}
        <div className="order-info-compact">
          {/* Left Column: Customer & Shipping */}
          <div className="info-card customer-shipping-styled">
            <div className="card-header-with-status">
              <h3>Customer & Shipping</h3>
              <span className={`status-badge status-${order.payment?.status}`}>
                {order.payment?.status}
              </span>
            </div>
            <div className="customer-item">
              <span>Name:</span>
              <strong>{customerName}</strong>
            </div>
            <div className="customer-item">
              <span>Email:</span>
              <strong>{customerEmail}</strong>
            </div>
            {(order.customerInfo?.phoneNumber || order.customer?.phoneNumber) && (
              <div className="customer-item">
                <span>Phone:</span>
                <strong>
                  {order.customerInfo?.phoneCountryCode || order.customer?.phoneCountryCode || '+254'}{' '}
                  {order.customerInfo?.phoneNumber || order.customer?.phoneNumber}
                </strong>
              </div>
            )}
            <div className="customer-item">
              <span>Type:</span>
              <strong>{order.customer ? 'Registered' : 'Guest'}</strong>
            </div>
            <div className="customer-item">
              <span>Address:</span>
              <strong>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.county} {order.shippingAddress.postalCode}</strong>
            </div>
            <div className="customer-item">
              <span>Order Date:</span>
              <strong>{new Date(order.createdAt).toLocaleDateString()}</strong>
            </div>
            <div className="customer-item">
              <span>Payment:</span>
              <strong>{order.payment?.method === 'paya_bnpl' ? 'Paya BNPL' : order.payment?.method}</strong>
            </div>
          </div>

          {/* Right Column: BNPL Financial Details */}
          {order.payment?.method === 'paya_bnpl' && (
            <div className="info-card bnpl-details-styled">
              <h3>BNPL Financial Details</h3>
              <div className="bnpl-item">
                <span>Total Loan Amount:</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
              <div className="bnpl-item highlight">
                <span>Advance to Merchant (99%):</span>
                <strong>{formatCurrency(Math.floor(order.totalAmount * 0.99))}</strong>
              </div>
              <div className="bnpl-item">
                <span>Paya Fee (1%):</span>
                <strong>{formatCurrency(Math.floor(order.totalAmount * 0.01))}</strong>
              </div>
              <div className="bnpl-item">
                <span>Loan Term:</span>
                <strong>120 days (4 months)</strong>
              </div>
              <div className="bnpl-item">
                <span>Interest Rate:</span>
                <strong>8% per month</strong>
              </div>
            </div>
          )}
        </div>

        {/* Underwriting Scorecard */}
        {order.payment?.method === 'paya_bnpl' && order.underwritingResult && (
          <div className="info-card underwriting-scorecard">
            <h3>Underwriting Scorecard</h3>
            <div className="scorecard-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Threshold Value</th>
                    <th>Actual Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Minimum Age</td>
                    <td>{order.underwritingResult.thresholds?.minAge || 'N/A'}</td>
                    <td>{order.underwritingResult.applicantData?.age || 'N/A'}</td>
                    <td>
                      {order.underwritingResult.applicantData?.age >= (order.underwritingResult.thresholds?.minAge || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Minimum Income (KSh)</td>
                    <td>{formatCurrency(order.underwritingResult.thresholds?.minIncome || 0)}</td>
                    <td>{formatCurrency(order.underwritingResult.applicantData?.income || 0)}</td>
                    <td>
                      {order.underwritingResult.applicantData?.income >= (order.underwritingResult.thresholds?.minIncome || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Minimum Years Employed</td>
                    <td>{order.underwritingResult.thresholds?.minYearsEmployed || 'N/A'}</td>
                    <td>{order.underwritingResult.applicantData?.yearsEmployed || 'N/A'}</td>
                    <td>
                      {order.underwritingResult.applicantData?.yearsEmployed >= (order.underwritingResult.thresholds?.minYearsEmployed || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Minimum Credit Score</td>
                    <td>{order.underwritingResult.thresholds?.minCreditScore || 'N/A'}</td>
                    <td>{order.underwritingResult.applicantData?.creditScore || 'N/A'}</td>
                    <td>
                      {order.underwritingResult.applicantData?.creditScore >= (order.underwritingResult.thresholds?.minCreditScore || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Maximum Defaults</td>
                    <td>{order.underwritingResult.thresholds?.maxDefaults || 'N/A'}</td>
                    <td>{order.underwritingResult.applicantData?.defaults || 'N/A'}</td>
                    <td>
                      {order.underwritingResult.applicantData?.defaults <= (order.underwritingResult.thresholds?.maxDefaults || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Maximum Other Obligations (KSh)</td>
                    <td>{formatCurrency(order.underwritingResult.thresholds?.maxOtherObligations || 0)}</td>
                    <td>{formatCurrency(order.underwritingResult.applicantData?.otherObligations || 0)}</td>
                    <td>
                      {order.underwritingResult.applicantData?.otherObligations <= (order.underwritingResult.thresholds?.maxOtherObligations || 0) ? (
                        <span className="badge badge-success">✓ Pass</span>
                      ) : (
                        <span className="badge badge-danger">✗ Fail</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: order.underwritingResult.approved ? '#d4edda' : '#f8d7da', borderRadius: '4px' }}>
                <strong>Overall Result: </strong>
                <span className={`badge ${order.underwritingResult.approved ? 'badge-success' : 'badge-danger'}`}>
                  {order.underwritingResult.approved ? '✓ Approved' : '✗ Rejected'}
                </span>
                {order.underwritingResult.reason && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                    Reason: {order.underwritingResult.reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items & Financials - Split into 2 cards */}
        <div className="order-info-compact">
          {/* Left: Order Items */}
          <div className="info-card customer-shipping-styled">
            <h3>Order Items</h3>
            <div className="items-table-compact">
              <div className="items-header">
                <div className="col-product">Product</div>
                <div className="col-merchant">Merchant</div>
                <div className="col-price">Price</div>
                <div className="col-quantity">Qty</div>
                <div className="col-total">Total</div>
              </div>
              {order.items.map((item, index) => (
                <div key={index} className="item-row-compact">
                  <div className="col-product">
                    <div className="product-name">{item.productName}</div>
                    <div className="product-sku">SKU: {item.product?.sku || 'N/A'}</div>
                  </div>
                  <div className="col-merchant">{item.merchantName}</div>
                  <div className="col-price">{formatCurrency(item.productPrice)}</div>
                  <div className="col-quantity">{item.quantity}</div>
                  <div className="col-total">{formatCurrency(item.productPrice * item.quantity)}</div>
                </div>
              ))}
            </div>
            
            {/* Order Totals */}
            <div className="order-totals-compact">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="total-row">
                <span>Merchant Fee (1%):</span>
                <span className="fee-amount">- {formatCurrency(Math.floor(order.totalAmount * 0.01))}</span>
              </div>
              <div className="total-row total-final">
                <span>Amount Advanced (99%):</span>
                <span className="advanced-amount">{formatCurrency(Math.floor(order.totalAmount * 0.99))}</span>
              </div>
            </div>
          </div>

          {/* Right: Financials (Payment Schedule & Revenue) */}
          {order.payment?.method === 'paya_bnpl' && (
            <div className="info-card bnpl-details-styled">
              <h3>Financials</h3>
              
              <div className="payment-schedule-vertical">
                <h4>Payment Schedule</h4>
                <p className="schedule-info">4 monthly payments of {formatCurrency((order.totalAmount * 1.32) / 4)}</p>
                <div className="payments-list">
                  {[1, 2, 3, 4].map((paymentNum) => {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + paymentNum);
                    return (
                      <div key={paymentNum} className="payment-row">
                        <span className="payment-label">Payment {paymentNum}</span>
                        <span className="payment-date">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="payment-status-badge pending">Pending</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="revenue-summary-compact">
                <h4>Revenue Breakdown</h4>
                <div className="revenue-item">
                  <span>Customer Pays Total:</span>
                  <strong>{formatCurrency(order.totalAmount * 1.32)}</strong>
                </div>
                <div className="revenue-item">
                  <span>Interest (32%):</span>
                  <strong>{formatCurrency(order.totalAmount * 0.32)}</strong>
                </div>
                <div className="revenue-item">
                  <span>Merchant Fee (1%):</span>
                  <strong>{formatCurrency(Math.floor(order.totalAmount * 0.01))}</strong>
                </div>
                <div className="revenue-item highlight">
                  <span>Paya Revenue:</span>
                  <strong>{formatCurrency((order.totalAmount * 0.32) + Math.floor(order.totalAmount * 0.01))}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Documents Section */}
        {order.payment?.method === 'paya_bnpl' && (
          <div className="info-card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Customer Documents
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* Payslip Document */}
              <div style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: (order.hrVerification?.payslipPath || order.customer?.financialInfo?.payslip?.path) ? '#dbeafe' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(order.hrVerification?.payslipPath || order.customer?.financialInfo?.payslip?.path) ? '#2563eb' : '#94a3b8'} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>Payslip</h4>
                    {(order.hrVerification?.payslipPath || order.customer?.financialInfo?.payslip?.path) ? (
                      <>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.5rem',
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          marginBottom: '0.5rem'
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Uploaded
                        </span>
                        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                          {order.hrVerification?.payslipOriginalName || order.customer?.financialInfo?.payslip?.originalName || 'Payslip document'}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <a
                            href={getDocumentUrl(order.hrVerification?.payslipPath || order.customer?.financialInfo?.payslip?.path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            View
                          </a>
                          <a
                            href={getDocumentUrl(order.hrVerification?.payslipPath || order.customer?.financialInfo?.payslip?.path)}
                            download={order.hrVerification?.payslipOriginalName || 'payslip'}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No payslip uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* BNPL Agreement Document */}
              <div style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: '#f8fafc'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: (order.hrVerification?.agreementPdfPath || order.payment?.bnpl?.agreementPdfPath) ? '#f3e8ff' : '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={(order.hrVerification?.agreementPdfPath || order.payment?.bnpl?.agreementPdfPath) ? '#7c3aed' : '#94a3b8'} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <path d="M9 15l2 2 4-4" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1e293b' }}>BNPL Agreement</h4>
                    {(order.hrVerification?.agreementPdfPath || order.payment?.bnpl?.agreementPdfPath) ? (
                      <>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0.5rem',
                            backgroundColor: '#ede9fe',
                            color: '#5b21b6',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Generated
                          </span>
                          {order.payment?.bnpl?.agreementAccepted && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.5rem',
                              backgroundColor: '#dcfce7',
                              color: '#166534',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              Signed
                            </span>
                          )}
                        </div>
                        {order.payment?.bnpl?.agreementAcceptedAt && (
                          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', color: '#64748b' }}>
                            Signed on: {formatDate(order.payment.bnpl.agreementAcceptedAt)}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <a
                            href={getDocumentUrl(order.hrVerification?.agreementPdfPath || order.payment?.bnpl?.agreementPdfPath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            View
                          </a>
                          <a
                            href={getDocumentUrl(order.hrVerification?.agreementPdfPath || order.payment?.bnpl?.agreementPdfPath)}
                            download={`BNPL_Agreement_${order.orderNumber}.pdf`}
                            className="btn btn-sm btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          >
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        Agreement not generated yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* HR Verification Status Link */}
            {order.hrVerification && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                    HR Verification Status:
                  </span>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    backgroundColor: order.hrVerification.status === 'verified' ? '#dcfce7' :
                                     order.hrVerification.status === 'unverified' ? '#fee2e2' : '#fef3c7',
                    color: order.hrVerification.status === 'verified' ? '#166534' :
                           order.hrVerification.status === 'unverified' ? '#991b1b' : '#92400e',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {order.hrVerification.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/hr-verifications/${order.hrVerification._id}`)}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.75rem' }}
                >
                  View HR Verification Details
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Timeline Slide-out Panel */}
      {showTimeline && (
        <>
          <div className="timeline-overlay" onClick={() => setShowTimeline(false)} />
          <div className="timeline-slideout">
            <div className="slideout-header">
              <h3>Order Timeline</h3>
              <button 
                className="close-btn"
                onClick={() => setShowTimeline(false)}
              >
                ✕
              </button>
            </div>
            <div className="slideout-content">
              <div className="timeline">
                {order.timeline?.map((entry, index) => {
                  const isCurrentStatus = entry.status === order.status;
                  return (
                    <div key={index} className={`timeline-item ${isCurrentStatus ? 'current-step' : ''}`}>
                      <div className={`timeline-marker ${isCurrentStatus ? 'current' : ''}`}></div>
                      <div className="timeline-content">
                        <div className="timeline-status">{entry.status}</div>
                        <div className="timeline-note">{entry.note}</div>
                        <div className="timeline-date">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrderDetail;
