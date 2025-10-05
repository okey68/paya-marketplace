import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MerchantOnboarding = () => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Business Information State
  const [businessInfo, setBusinessInfo] = useState({
    businessName: user?.businessInfo?.businessName || '',
    businessType: user?.businessInfo?.businessType || '',
    description: user?.businessInfo?.description || '',
    website: user?.businessInfo?.website || '',
    taxId: user?.businessInfo?.taxId || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      county: user?.address?.county || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'Kenya'
    }
  });

  // Document Upload State
  const [documents, setDocuments] = useState({
    businessFormation: null,
    businessPermit: null
  });

  const [uploadedDocs, setUploadedDocs] = useState({
    businessFormation: user?.businessInfo?.documents?.businessFormation || null,
    businessPermit: user?.businessInfo?.documents?.businessPermit || null
  });

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
      const response = await axios.post('/uploads/business-doc', formData, {
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
        await axios.put('/users/profile', {
          businessInfo: {
            ...businessInfo,
            businessName: businessInfo.businessName,
            businessType: businessInfo.businessType,
            description: businessInfo.description,
            website: businessInfo.website,
            taxId: businessInfo.taxId
          },
          address: businessInfo.address
        });

        toast.success('Business information saved!');
        setCurrentStep(2);
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

        // Update business info approval status to pending
        await axios.put('/users/profile', {
          businessInfo: {
            ...businessInfo,
            approvalStatus: 'pending'
          }
        });

        toast.success('Documents uploaded! Your application is now under review.');
        setCurrentStep(3);
        
        // Update user context
        if (updateUser) {
          updateUser({
            ...user,
            businessInfo: {
              ...user.businessInfo,
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

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>Business Information</h2>
      <p>Tell us about your business to get started on Paya Marketplace.</p>
      
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
          
          {uploadedDocs.businessFormation ? (
            <div className="uploaded-file">
              <span>✅ {uploadedDocs.businessFormation.originalName}</span>
              <small>({(uploadedDocs.businessFormation.size / 1024 / 1024).toFixed(2)} MB)</small>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('businessFormation', e.target.files[0])}
              className="file-input"
            />
          )}
        </div>

        <div className="document-item">
          <h3>Business Permit *</h3>
          <p>Trading License, Business Permit, or relevant operating license</p>
          
          {uploadedDocs.businessPermit ? (
            <div className="uploaded-file">
              <span>✅ {uploadedDocs.businessPermit.originalName}</span>
              <small>({(uploadedDocs.businessPermit.size / 1024 / 1024).toFixed(2)} MB)</small>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => handleFileChange('businessPermit', e.target.files[0])}
              className="file-input"
            />
          )}
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

  if (user?.businessInfo?.approvalStatus === 'approved') {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="success-message">
          <h2>✅ Merchant Account Approved</h2>
          <p>Your merchant account has been approved! You can now start selling on Paya Marketplace.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/merchant/dashboard'}>
            Go to Merchant Dashboard
          </button>
        </div>
      </div>
    );
  }

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
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {currentStep < 3 && (
          <div className="onboarding-actions">
            {currentStep > 1 && (
              <button 
                className="btn btn-secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
              >
                Previous
              </button>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={handleStepSubmit}
              disabled={loading || (currentStep === 1 && !canProceedStep1()) || (currentStep === 2 && !canProceedStep2())}
            >
              {loading ? 'Processing...' : currentStep === 2 ? 'Submit Application' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantOnboarding;
