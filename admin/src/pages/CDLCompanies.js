import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const CDLCompanies = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    aliases: '',
    industry: '',
    website: '',
    notes: '',
    hrContacts: [{ name: '', email: '', phone: '', isPrimary: true }]
  });

  useEffect(() => {
    fetchCompanies();
  }, [searchQuery, showActiveOnly]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('active', showActiveOnly);
      params.append('limit', 100);

      const response = await axios.get(`/cdl-companies?${params}`);
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      aliases: '',
      industry: '',
      website: '',
      notes: '',
      hrContacts: [{ name: '', email: '', phone: '', isPrimary: true }]
    });
  };

  const openEditModal = (company) => {
    setEditingCompany(company);
    setFormData({
      companyName: company.companyName || '',
      aliases: company.aliases?.join(', ') || '',
      industry: company.industry || '',
      website: company.website || '',
      notes: company.notes || '',
      hrContacts: company.hrContacts?.length > 0
        ? company.hrContacts.map(c => ({
            _id: c._id,
            name: c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            isPrimary: c.isPrimary || false
          }))
        : [{ name: '', email: '', phone: '', isPrimary: true }]
    });
    setShowEditModal(true);
  };

  const handleAddContact = () => {
    setFormData({
      ...formData,
      hrContacts: [...formData.hrContacts, { name: '', email: '', phone: '', isPrimary: false }]
    });
  };

  const handleRemoveContact = (index) => {
    if (formData.hrContacts.length <= 1) {
      toast.error('At least one HR contact is required');
      return;
    }
    const removedWasPrimary = formData.hrContacts[index].isPrimary;
    const newContacts = formData.hrContacts
      .filter((_, i) => i !== index)
      .map((contact, i) => {
        // If we removed the primary, make the first one primary
        if (removedWasPrimary && i === 0) {
          return { ...contact, isPrimary: true };
        }
        return contact;
      });
    setFormData({ ...formData, hrContacts: newContacts });
  };

  const handleContactChange = (index, field, value) => {
    const newContacts = formData.hrContacts.map((contact, i) => {
      if (field === 'isPrimary' && value) {
        // Only one can be primary
        return { ...contact, isPrimary: i === index };
      }
      if (i === index) {
        return { ...contact, [field]: value };
      }
      return contact;
    });
    setFormData({ ...formData, hrContacts: newContacts });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.hrContacts.some(c => c.email?.trim())) {
      toast.error('At least one HR contact with email is required');
      return;
    }

    const payload = {
      companyName: formData.companyName.trim(),
      aliases: formData.aliases.split(',').map(a => a.trim()).filter(a => a),
      industry: formData.industry.trim(),
      website: formData.website.trim(),
      notes: formData.notes.trim(),
      hrContacts: formData.hrContacts.filter(c => c.email?.trim()).map(c => ({
        name: c.name?.trim() || '',
        email: c.email.trim(),
        phone: c.phone?.trim() || '',
        isPrimary: c.isPrimary
      }))
    };

    try {
      setFormLoading(true);
      if (editingCompany) {
        await axios.patch(`/cdl-companies/${editingCompany._id}`, payload);
        toast.success('Company updated successfully');
      } else {
        await axios.post('/cdl-companies', payload);
        toast.success('Company created successfully');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      setEditingCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error(error.response?.data?.message || 'Failed to save company');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (companyId) => {
    if (!window.confirm('Are you sure you want to deactivate this company?')) return;
    try {
      await axios.delete(`/cdl-companies/${companyId}`);
      toast.success('Company deactivated');
      fetchCompanies();
    } catch (error) {
      console.error('Error deactivating company:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate company');
    }
  };

  const handleReactivate = async (companyId) => {
    try {
      await axios.patch(`/cdl-companies/${companyId}`, { isActive: true });
      toast.success('Company reactivated');
      fetchCompanies();
    } catch (error) {
      console.error('Error reactivating company:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate company');
    }
  };

  // Determine if modal should show and which type
  const showModal = showAddModal || showEditModal;
  const isEditMode = showEditModal;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">CDL Companies</h1>
          <p className="page-subtitle">Manage employer HR contact directory</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/hr-verifications')}
          >
            &larr; Back to Verifications
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            + Add Company
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="showActive"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
              />
              <label htmlFor="showActive" style={{ margin: 0, cursor: 'pointer' }}>
                Active only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Companies List */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : companies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
              <p>No companies found</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                style={{ marginTop: '1rem' }}
              >
                Add Your First Company
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Primary HR Contact</th>
                  <th>Verification Stats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => {
                  const primaryContact = company.hrContacts?.find(c => c.isPrimary) || company.hrContacts?.[0];
                  const successRate = company.verificationStats?.totalRequests > 0
                    ? Math.round((company.verificationStats.verifiedCount / company.verificationStats.totalRequests) * 100)
                    : null;

                  return (
                    <tr key={company._id}>
                      <td>
                        <div>
                          <strong>{company.companyName}</strong>
                          {company.aliases?.length > 0 && (
                            <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                              Also: {company.aliases.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{company.industry || '-'}</td>
                      <td>
                        {primaryContact ? (
                          <div>
                            <div>{primaryContact.name || '-'}</div>
                            <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                              {primaryContact.email}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#e53e3e' }}>No contact</span>
                        )}
                      </td>
                      <td>
                        {company.verificationStats?.totalRequests > 0 ? (
                          <div>
                            <div>
                              {company.verificationStats.verifiedCount}/{company.verificationStats.totalRequests} verified
                            </div>
                            <div style={{ fontSize: '0.85rem', color: successRate >= 70 ? '#48bb78' : successRate >= 40 ? '#f6ad55' : '#e53e3e' }}>
                              {successRate}% success rate
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#718096' }}>No verifications yet</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${company.isActive ? 'badge-success' : 'badge-secondary'}`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openEditModal(company)}
                          >
                            Edit
                          </button>
                          {company.isActive ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeactivate(company._id)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleReactivate(company._id)}
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Inlined to prevent re-mounting on state changes */}
      {showModal && (
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
          zIndex: 1000,
          overflow: 'auto',
          padding: '2rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="card-header">
              <h3>{isEditMode ? 'Edit Company' : 'Add New Company'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g., Safaricom PLC"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      placeholder="e.g., Telecommunications"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Aliases (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.aliases}
                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                    placeholder="e.g., Safcom, Safaricom Kenya"
                  />
                  <small style={{ color: '#718096' }}>Alternative company names that employees might use</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this company..."
                  />
                </div>

                {/* HR Contacts Section */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>HR Contacts</h4>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleAddContact}
                    >
                      + Add Contact
                    </button>
                  </div>

                  {formData.hrContacts.map((contact, index) => (
                    <div
                      key={`contact-${index}`}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={contact.isPrimary}
                            onChange={(e) => handleContactChange(index, 'isPrimary', e.target.checked)}
                            id={`primary-${index}`}
                          />
                          <label htmlFor={`primary-${index}`} style={{ margin: 0, cursor: 'pointer' }}>
                            Primary Contact
                          </label>
                        </div>
                        {formData.hrContacts.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveContact(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={contact.name}
                            onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-input"
                            value={contact.email}
                            onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                            placeholder="hr@company.com"
                            required={index === 0}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Phone</label>
                          <input
                            type="tel"
                            className="form-input"
                            value={contact.phone}
                            onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                            placeholder="+254700123456"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                    setEditingCompany(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (isEditMode ? 'Update Company' : 'Create Company')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDLCompanies;
