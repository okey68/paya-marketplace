import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Support.css';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/support/merchant/tickets?${params}`);
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await api.patch(`/support/${ticketId}/status`, { status: newStatus });
      toast.success('Ticket status updated');
      fetchTickets();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim()) return;

    setSubmittingResponse(true);
    try {
      await api.post(`/support/${selectedTicket._id}/response`, {
        message: responseMessage
      });
      setResponseMessage('');
      toast.success('Response sent');
      // Refresh ticket details
      const response = await api.get(`/support/${selectedTicket._id}`);
      setSelectedTicket(response.data);
      fetchTickets();
    } catch (error) {
      console.error('Failed to add response:', error);
      toast.error('Failed to send response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { class: 'badge-warning', label: 'Open' },
      in_progress: { class: 'badge-info', label: 'In Progress' },
      resolved: { class: 'badge-success', label: 'Resolved' },
      closed: { class: 'badge-secondary', label: 'Closed' }
    };
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="support-page">
      <div className="page-header">
        <h1 className="page-title">Support Tickets</h1>
        <p className="page-subtitle">Customer inquiries related to your orders</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Order #</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td><strong>{ticket.ticketNumber}</strong></td>
                  <td>
                    <div>{ticket.name}</div>
                    <small style={{ color: '#718096' }}>{ticket.email}</small>
                  </td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.order?.orderNumber || ticket.orderNumber || '-'}</td>
                  <td>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                      className="status-select-small"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={async () => {
                        try {
                          const response = await api.get(`/support/${ticket._id}`);
                          setSelectedTicket(response.data);
                        } catch (error) {
                          toast.error('Failed to load ticket details');
                        }
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {tickets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
              No support tickets found
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <>
          <div className="modal-overlay" onClick={() => setSelectedTicket(null)} />
          <div className="ticket-modal">
            <div className="modal-header">
              <div>
                <h3>Ticket #{selectedTicket.ticketNumber}</h3>
                <div style={{ marginTop: '0.5rem' }}>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="ticket-info">
                <div className="info-row">
                  <strong>From:</strong> {selectedTicket.name} ({selectedTicket.email})
                </div>
                <div className="info-row">
                  <strong>Subject:</strong> {selectedTicket.subject}
                </div>
                {selectedTicket.order && (
                  <div className="info-row">
                    <strong>Order:</strong> {selectedTicket.order.orderNumber}
                  </div>
                )}
                <div className="info-row">
                  <strong>Date:</strong> {new Date(selectedTicket.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="ticket-message">
                <h4>Message:</h4>
                <p>{selectedTicket.message}</p>
              </div>

              {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                <div className="responses-section">
                  <h4>Responses:</h4>
                  {selectedTicket.responses.map((response, index) => (
                    <div key={index} className="response-item">
                      <div className="response-header">
                        <strong>{response.respondedByName}</strong>
                        <span>{new Date(response.timestamp).toLocaleString()}</span>
                      </div>
                      <p>{response.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddResponse} className="response-form">
                <h4>Add Response:</h4>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response to the customer..."
                  rows="4"
                  required
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingResponse}
                >
                  {submittingResponse ? 'Sending...' : 'Send Response'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Support;
