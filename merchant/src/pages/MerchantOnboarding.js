import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MerchantOnboarding = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [accountBalance, setAccountBalance] = useState(0);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('merchantToken');
    if (!authLoading && !token) {
      toast.error('Please login to continue');
      navigate('/login');
    }
  }, [authLoading, navigate]);

  // Check if merchant has already completed onboarding
  useEffect(() => {
    if (user?.businessInfo?.businessName) {
      setIsUpdating(true);
    }
  }, [user]);

  // Fetch account balance from paid orders
  useEffect(() => {
    const fetchAccountBalance = async () => {
      try {
        const ordersRes = await api.get('/orders/merchant/orders');
        const orders = ordersRes.data.orders || [];
        
        // Calculate balance from paid orders only
        const balance = orders
          .filter(order => order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        setAccountBalance(balance);
      } catch (error) {
        console.error('Error fetching account balance:', error);
        setAccountBalance(0);
      }
    };

    if (activeTab === 'account') {
      fetchAccountBalance();
    }
  }, [activeTab]);
  
  // Business Information State - Initialize with user data
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    taxId: '',
    businessRegistrationNumber: '',
    address: {
      street: '',
      city: '',
      county: '',
      postalCode: '',
      country: 'Kenya'
    }
  });

  // Update businessInfo when user data loads
  useEffect(() => {
    if (user) {
      console.log('Loading user data:', user);
      console.log('Business info:', user.businessInfo);
      console.log('Business Name from user:', user?.businessInfo?.businessName);
      console.log('Address from user:', user?.address);
      
      const newBusinessInfo = {
        businessName: user?.businessInfo?.businessName || '',
        businessType: user?.businessInfo?.businessType || '',
        description: user?.businessInfo?.description || '',
        website: user?.businessInfo?.website || '',
        taxId: user?.businessInfo?.taxId || '',
        businessRegistrationNumber: user?.businessInfo?.businessRegistrationNumber || '',
        address: {
          street: user?.address?.street || '',
          city: user?.address?.city || '',
          county: user?.address?.county || '',
          postalCode: user?.address?.postalCode || '',
          country: user?.address?.country || 'Kenya'
        }
      };
      
      console.log('Setting businessInfo to:', newBusinessInfo);
      setBusinessInfo(newBusinessInfo);
    }
  }, [user]);

  // Document Upload State
  const [documents, setDocuments] = useState({
    businessFormation: null,
    businessPermit: null
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    businessFormation: null,
    businessPermit: null
  });

  // Update uploaded docs when user data loads
  useEffect(() => {
    if (user?.businessInfo?.documents) {
      console.log('Documents from user:', user.businessInfo.documents);
      console.log('Business Formation:', user.businessInfo.documents.businessFormation);
      console.log('Business Permit:', user.businessInfo.documents.businessPermit);
      
      setUploadedDocs({
        businessFormation: user.businessInfo.documents.businessFormation || null,
        businessPermit: user.businessInfo.documents.businessPermit || null
      });
    }
  }, [user]);

  const handleBusinessInfoChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setBusinessInfo(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setBusinessInfo(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (documentType, file) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: file
    }));
  };

  const uploadDocument = async (documentType, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    try {
      const response = await api.post('/uploads/business-doc', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedDocs(prev => ({
        ...prev,
        [documentType]: response.data.file
      }));

      toast.success(`${documentType === 'businessFormation' ? 'Business Formation' : 'Business Permit'} document uploaded successfully!`);
      return response.data.file;
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
      throw error;
    }
  };

  const handleStepSubmit = async () => {
    setLoading(true);

    try {
      if (currentStep === 1) {
        // Save business information
        const payload = {
          businessInfo: {
            businessName: businessInfo.businessName,
            businessType: businessInfo.businessType,
            description: businessInfo.description,
            website: businessInfo.website,
            taxId: businessInfo.taxId,
            businessRegistrationNumber: businessInfo.businessRegistrationNumber
          },
          address: businessInfo.address
        };
        
        console.log('Saving business info:', payload);
        const response = await api.put('/users/profile', payload);
        console.log('Save response:', response.data);

        toast.success(isUpdating ? 'Business information updated!' : 'Business information saved!');
        
        // If updating, refresh user data and exit edit mode
        if (isUpdating) {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            updateUser(response.data.user);
          }
          setIsEditing(false);
        } else {
          setCurrentStep(2);
        }
      } else if (currentStep === 2) {
        // Upload documents
        const uploadPromises = [];
        
        if (documents.businessFormation && !uploadedDocs.businessFormation) {
          uploadPromises.push(uploadDocument('businessFormation', documents.businessFormation));
        }
        
        if (documents.businessPermit && !uploadedDocs.businessPermit) {
          uploadPromises.push(uploadDocument('businessPermit', documents.businessPermit));
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        // Update approval status to pending (preserve existing business info)
        await api.put('/users/profile', {
          businessInfo: {
            businessName: businessInfo.businessName,
            businessType: businessInfo.businessType,
            description: businessInfo.description,
            website: businessInfo.website,
            taxId: businessInfo.taxId,
            businessRegistrationNumber: businessInfo.businessRegistrationNumber,
            approvalStatus: 'pending'
          }
        });

        toast.success(isUpdating ? 'Documents updated!' : 'Documents uploaded! Your application is now under review.');
        
        // If updating, refresh user data
        if (isUpdating) {
          const response = await api.get('/auth/me');
          if (response.data.user) {
            updateUser(response.data.user);
          }
        } else {
          setCurrentStep(3);
        }
        
        // Update user context
        if (updateUser && !isUpdating) {
          updateUser({
            ...user,
            businessInfo: {
              ...user.businessInfo,
              businessName: businessInfo.businessName,
              businessType: businessInfo.businessType,
              description: businessInfo.description,
              website: businessInfo.website,
              taxId: businessInfo.taxId,
              businessRegistrationNumber: businessInfo.businessRegistrationNumber,
              approvalStatus: 'pending'
            }
          });
        }
      }
    } catch (error) {
      console.error('Step submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to save information');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileView = () => (
    <div className="settings-container">
      {/* Tabs */}
      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="tab-content">
          {/* Account Balance Card */}
          <div className="account-balance-card">
            <div className="account-card-header">
              <div>
                <div className="account-label">BUSINESS</div>
                <h2 className="account-name">{user?.businessInfo?.businessName || 'Business Account'}</h2>
                <div className="balance-label">Available Balance</div>
                <div className="balance-amount">KES {accountBalance.toLocaleString()}</div>
              </div>
              <div className="wallet-icon">💳</div>
            </div>
            <div className="account-card-footer">
              <div className="account-number">•••••••••••• 1234</div>
              <div className="account-actions">
                <button className="action-btn">
                  <span>↑</span> Send
                </button>
                <button className="action-btn">
                  <span>↓</span> Request
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="transactions-section">
            <div className="transactions-header">
              <h3>Transactions</h3>
              <button className="export-btn">
                <span>⬇</span> Export
              </button>
            </div>

            {/* Filters */}
            <div className="transactions-filters">
              <div className="search-box">
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
                <option>Refund</option>
              </select>
              <select className="filter-select">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              <span className="per-page-label">per page</span>
            </div>

            {/* Transactions Table */}
            <div className="transactions-table-container">
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
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <div className="empty-icon">📊</div>
                      <p>No transactions yet</p>
                      <span className="empty-subtitle">Your transaction history will appear here</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="tab-content">
          <div className="settings-grid">
            {/* Personal Information */}
            <div className="settings-card">
              <div className="card-header">
                <div className="card-icon personal">👤</div>
                <h3>Personal Information</h3>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{user?.phoneNumber || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Role:</span>
                  <span className="badge badge-merchant">Merchant</span>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="settings-card">
              <div className="card-header">
                <div className="card-icon business">🏢</div>
                <h3>Business Information</h3>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Business Name:</span>
                  <span className="value">{businessInfo.businessName || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Business Type:</span>
                  <span className="value">{businessInfo.businessType || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Registration Number:</span>
                  <span className="value">{businessInfo.businessRegistrationNumber || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Tax ID:</span>
                  <span className="value">{businessInfo.taxId || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Website:</span>
                  <span className="value">{businessInfo.website || 'Not provided'}</span>
                </div>
                <div className="info-row full-width">
                  <span className="label">Description:</span>
                  <span className="value">{businessInfo.description || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Approval Status:</span>
                  <span className={`badge badge-${user?.businessInfo?.approvalStatus || 'pending'}`}>
                    {(user?.businessInfo?.approvalStatus || 'pending').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="settings-card">
              <div className="card-header">
                <div className="card-icon address">📍</div>
                <h3>Address</h3>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Street:</span>
                  <span className="value">{businessInfo.address.street || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">City:</span>
                  <span className="value">{businessInfo.address.city || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">County:</span>
                  <span className="value">{businessInfo.address.county || 'Not provided'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Postal Code:</span>
                  <span className="value">{businessInfo.address.postalCode || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="tab-content">
          <div className="documents-list">
            {/* Business Formation Document */}
            <div className="document-row">
              <div className="doc-info">
                <div className="doc-type">
                  <span className="doc-icon-small">📄</span>
                  <div>
                    <h4>Formation Document</h4>
                    <p className="doc-description">Certificate of Incorporation, Business Registration</p>
                  </div>
                </div>
                <div className="doc-file">
                  {uploadedDocs.businessFormation ? (
                    <>
                      <span className="status-badge uploaded">✅ Uploaded</span>
                      <span className="file-name">
                        {uploadedDocs.businessFormation.originalName || uploadedDocs.businessFormation.filename || 'document.pdf'}
                      </span>
                      {uploadedDocs.businessFormation.size && (
                        <span className="file-size">
                          ({(uploadedDocs.businessFormation.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="status-badge missing">❌ Not uploaded</span>
                  )}
                </div>
              </div>
              <div className="doc-actions">
                {uploadedDocs.businessFormation && (
                  <a 
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${uploadedDocs.businessFormation.path || uploadedDocs.businessFormation.url || '/uploads/' + uploadedDocs.businessFormation.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </a>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setCurrentStep(2);
                    setIsEditing(true);
                  }}
                >
                  {uploadedDocs.businessFormation ? 'Update' : 'Upload'}
                </button>
              </div>
            </div>

            {/* Business Permit */}
            <div className="document-row">
              <div className="doc-info">
                <div className="doc-type">
                  <span className="doc-icon-small">📄</span>
                  <div>
                    <h4>Business Permit</h4>
                    <p className="doc-description">Trading License, Business Permit, Operating License</p>
                  </div>
                </div>
                <div className="doc-file">
                  {uploadedDocs.businessPermit ? (
                    <>
                      <span className="status-badge uploaded">✅ Uploaded</span>
                      <span className="file-name">
                        {uploadedDocs.businessPermit.originalName || uploadedDocs.businessPermit.filename || 'document.pdf'}
                      </span>
                      {uploadedDocs.businessPermit.size && (
                        <span className="file-size">
                          ({(uploadedDocs.businessPermit.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="status-badge missing">❌ Not uploaded</span>
                  )}
                </div>
              </div>
              <div className="doc-actions">
                {uploadedDocs.businessPermit && (
                  <a 
                    href={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${uploadedDocs.businessPermit.path || uploadedDocs.businessPermit.url || '/uploads/' + uploadedDocs.businessPermit.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    View
                  </a>
                )}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setCurrentStep(2);
                    setIsEditing(true);
                  }}
                >
                  {uploadedDocs.businessPermit ? 'Update' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>Business Information</h2>
      <p>{isUpdating ? 'Update your business information below.' : 'Tell us about your business to get started on Paya Marketplace.'}</p>
      
      <div className="form-grid">
        <div className="form-group">
          <label>Business Name *</label>
          <input
            type="text"
            value={businessInfo.businessName}
            onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
            placeholder="Enter your business name"
            required
          />
        </div>

        <div className="form-group">
          <label>Business Type *</label>
          <select
            value={businessInfo.businessType}
            onChange={(e) => handleBusinessInfoChange('businessType', e.target.value)}
            required
          >
            <option value="">Select business type</option>
            <option value="retail">Retail</option>
            <option value="wholesale">Wholesale</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="services">Services</option>
            <option value="technology">Technology</option>
            <option value="food-beverage">Food & Beverage</option>
            <option value="fashion">Fashion</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Business Description *</label>
          <textarea
            value={businessInfo.description}
            onChange={(e) => handleBusinessInfoChange('description', e.target.value)}
            placeholder="Describe your business and what you sell"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Website (Optional)</label>
          <input
            type="url"
            value={businessInfo.website}
            onChange={(e) => handleBusinessInfoChange('website', e.target.value)}
            placeholder="https://your-website.com"
          />
        </div>

        <div className="form-group">
          <label>Tax ID / KRA PIN *</label>
          <input
            type="text"
            value={businessInfo.taxId}
            onChange={(e) => handleBusinessInfoChange('taxId', e.target.value)}
            placeholder="Enter your tax identification number"
            required
          />
        </div>

        <div className="form-group">
          <label>Business Registration Number</label>
          <input
            type="text"
            value={businessInfo.businessRegistrationNumber}
            onChange={(e) => handleBusinessInfoChange('businessRegistrationNumber', e.target.value)}
            placeholder="Enter your business registration number"
          />
        </div>

        <div className="form-group">
          <label>Street Address *</label>
          <input
            type="text"
            value={businessInfo.address.street}
            onChange={(e) => handleBusinessInfoChange('address.street', e.target.value)}
            placeholder="Enter street address"
            required
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={businessInfo.address.city}
            onChange={(e) => handleBusinessInfoChange('address.city', e.target.value)}
            placeholder="Enter city"
            required
          />
        </div>

        <div className="form-group">
          <label>County *</label>
          <input
            type="text"
            value={businessInfo.address.county}
            onChange={(e) => handleBusinessInfoChange('address.county', e.target.value)}
            placeholder="Enter county"
            required
          />
        </div>

        <div className="form-group">
          <label>Postal Code</label>
          <input
            type="text"
            value={businessInfo.address.postalCode}
            onChange={(e) => handleBusinessInfoChange('address.postalCode', e.target.value)}
            placeholder="Enter postal code"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <h2>Document Upload</h2>
      <p>Upload required business documents for verification.</p>
      
      <div className="document-upload-section">
        <div className="document-item">
          <h3>Business Formation Document *</h3>
          <p>Certificate of Incorporation, Business Registration, or similar document</p>
          
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="businessFormation"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('businessFormation', e.target.files[0])}
              className="file-input-hidden"
            />
            <label htmlFor="businessFormation" className="file-upload-label">
              {documents.businessFormation ? (
                <div className="file-selected">
                  <span>✅ {documents.businessFormation.name}</span>
                  <small>({(documents.businessFormation.size / 1024 / 1024).toFixed(2)} MB)</small>
                </div>
              ) : uploadedDocs.businessFormation ? (
                <div className="file-selected">
                  <span>✅ {uploadedDocs.businessFormation.originalName}</span>
                  <small>({(uploadedDocs.businessFormation.size / 1024 / 1024).toFixed(2)} MB)</small>
                </div>
              ) : (
                <div className="file-upload-placeholder">
                  <span className="upload-icon">📄</span>
                  <span>Click to upload or drag and drop</span>
                  <small>(0.00 MB)</small>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="document-item">
          <h3>Business Permit *</h3>
          <p>Trading License, Business Permit, or relevant operating license</p>
          
          <div className="file-upload-wrapper">
            <input
              type="file"
              id="businessPermit"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('businessPermit', e.target.files[0])}
              className="file-input-hidden"
            />
            <label htmlFor="businessPermit" className="file-upload-label">
              {documents.businessPermit ? (
                <div className="file-selected">
                  <span>✅ {documents.businessPermit.name}</span>
                  <small>({(documents.businessPermit.size / 1024 / 1024).toFixed(2)} MB)</small>
                </div>
              ) : uploadedDocs.businessPermit ? (
                <div className="file-selected">
                  <span>✅ {uploadedDocs.businessPermit.originalName}</span>
                  <small>({(uploadedDocs.businessPermit.size / 1024 / 1024).toFixed(2)} MB)</small>
                </div>
              ) : (
                <div className="file-upload-placeholder">
                  <span className="upload-icon">📄</span>
                  <span>Click to upload or drag and drop</span>
                  <small>(0.00 MB)</small>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="upload-info">
          <h4>Accepted file formats:</h4>
          <ul>
            <li>PDF documents (.pdf)</li>
            <li>Word documents (.doc, .docx)</li>
            <li>Images (.jpg, .jpeg, .png)</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="success-message">
        <h2>🎉 Application Submitted!</h2>
        <p>Thank you for completing your merchant onboarding. Your application is now under review.</p>
        
        <div className="next-steps">
          <h3>What happens next?</h3>
          <ul>
            <li>Our team will review your business information and documents</li>
            <li>We may contact you if additional information is needed</li>
            <li>You'll receive an email notification once your account is approved</li>
            <li>Approval typically takes 1-3 business days</li>
          </ul>
        </div>

        <div className="contact-info">
          <h3>Need help?</h3>
          <p>Contact our merchant support team at <strong>merchants@paya.com</strong></p>
        </div>
      </div>
    </div>
  );

  const canProceedStep1 = () => {
    return businessInfo.businessName && 
           businessInfo.businessType && 
           businessInfo.description && 
           businessInfo.taxId &&
           businessInfo.address.street &&
           businessInfo.address.city &&
           businessInfo.address.county;
  };

  const canProceedStep2 = () => {
    return (uploadedDocs.businessFormation || documents.businessFormation) &&
           (uploadedDocs.businessPermit || documents.businessPermit);
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Settings page layout (full width like Orders page) - Show for approved merchants
  if (isUpdating && !isEditing) {
    return (
      <div className="page-container" style={{ paddingTop: 0 }}>
        <div className="page-content" style={{ position: 'relative' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
            style={{ 
              position: 'absolute', 
              top: '1.5rem', 
              right: '1.5rem',
              zIndex: 10
            }}
          >
            Edit Information
          </button>
          {renderProfileView()}
        </div>
      </div>
    );
  }

  // Onboarding layout (narrow container)
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>Merchant Onboarding</h1>
          <div className="progress-bar">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <span>1</span>
              <label>Business Info</label>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <span>2</span>
              <label>Documents</label>
            </div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
              <span>3</span>
              <label>Review</label>
            </div>
          </div>
        </div>

        <div className="onboarding-content">
          {isEditing ? (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
            </>
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </>
          )}
        </div>

        {((currentStep < 3 && !isUpdating) || (isUpdating && isEditing)) && (
          <div className="onboarding-actions">
            {currentStep > 1 && !isEditing && (
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Previous
              </button>
            )}
            
            {isEditing && (
              <button 
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={handleStepSubmit}
              disabled={loading || (currentStep === 1 && !canProceedStep1())}
            >
              {loading ? 'Saving...' : isUpdating ? 'Save Changes' : currentStep === 2 ? 'Submit Application' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
