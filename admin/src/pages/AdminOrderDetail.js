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
