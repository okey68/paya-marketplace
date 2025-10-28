import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './MerchantOnboarding.css';

const MerchantOnboardingNew = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const hasFetchedData = useRef(false);

  const countryCodes = [
    { code: '+254', flag: '🇰🇪', name: 'Kenya' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+27', flag: '🇿🇦', name: 'South Africa' },
    { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  ];

  // Business Information State
  const [businessInfo, setBusinessInfo] = useState({
    companyNumber: '',
    registrationDate: '',
    businessName: '',
    phoneCountryCode: '+254',
    phoneNumber: '',
    businessEmail: '',
    taxNumber: '',
    tradingName: '',
    industrialClassification: '',
    industrialSector: '',
    typeOfBusiness: '',
    businessType: ''
  });

  // Business Address State
  const [businessAddress, setBusinessAddress] = useState({
    addressLine1: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'Kenya'
  });

  // Business Documents State
  const [businessDocs, setBusinessDocs] = useState({
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    cr12: null,
    businessPermit: null
  });

  const [uploadedBusinessDocs, setUploadedBusinessDocs] = useState({
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    cr12: null,
    businessPermit: null
  });

  // Directors State
  const [numberOfDirectors, setNumberOfDirectors] = useState(1);
  const [directors, setDirectors] = useState([{
    name: '',
    dob: '',
    nationality: 'Kenyan',
    kraPin: '',
    address: '',
    documents: {
      photoIdFront: null,
      photoIdBack: null,
      kraCertificate: null,
      proofOfAddress: null,
      selfie: null
    },
    uploadedDocuments: {
      photoIdFront: null,
      photoIdBack: null,
      kraCertificate: null,
      proofOfAddress: null,
      selfie: null
    }
  }]);

  // Approval Status State
  const [approvalStatus, setApprovalStatus] = useState({
    payaApproval: 'pending',
    bankApproval: 'pending',
    walletConnected: false
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch fresh user data from backend
  const fetchUserData = async () => {
    try {
      const response = await api.get('/users/profile');
      // API returns { user: {...} }
      const userData = response.data.user || response.data;
      
      console.log('Fetched user data:', userData);
      console.log('Business info:', userData.businessInfo);
      
      // Update user context with fresh data
      updateUser(userData);
      
      // Update approval status from fresh data
      if (userData.businessInfo) {
        const newStatus = {
          payaApproval: userData.businessInfo?.payaApproval?.status || userData.businessInfo?.approvalStatus || 'pending',
          bankApproval: userData.businessInfo?.bankApproval?.status || 'pending',
          walletConnected: userData.businessInfo?.walletConnected || false
        };
        console.log('Setting approval status:', newStatus);
        setApprovalStatus(newStatus);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('merchantToken');
    if (!authLoading && !token) {
      toast.error('Please login to continue');
      navigate('/login');
    }
  }, [authLoading, navigate]);

  // Restore step when user is loaded (only once)
  useEffect(() => {
    if (!authLoading && user && !hasFetchedData.current) {
      hasFetchedData.current = true;

      // Check if they've actually completed the onboarding
      const hasCompletedOnboarding = user.businessInfo?.businessName && 
                                      user.businessInfo?.companyNumber &&
                                      user.businessInfo?.directors?.length > 0;
      
      if (hasCompletedOnboarding) {
        // They've completed onboarding, restore their saved step or go to step 5
        const savedStep = localStorage.getItem('merchantOnboardingStep');
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (step >= 1 && step <= 5) {
            setCurrentStep(step);
          }
        } else {
          // No saved step, go to review
          setCurrentStep(5);
          localStorage.setItem('merchantOnboardingStep', '5');
        }
      } else {
        // New merchant - start at step 1 and clear any old localStorage
        localStorage.removeItem('merchantOnboardingStep');
        setCurrentStep(1);
      }
    }
  }, [authLoading, user]);

  // Fetch fresh data whenever we're on step 5
  useEffect(() => {
    if (!authLoading && user && currentStep === 5) {
      console.log('Fetching data for step 5');
      fetchUserData();
    }
  }, [currentStep, authLoading, user]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (currentStep >= 1 && currentStep <= 5) {
      localStorage.setItem('merchantOnboardingStep', currentStep.toString());
    }
  }, [currentStep]);


  // Update number of directors
  useEffect(() => {
    const newDirectors = Array.from({ length: numberOfDirectors }, (_, i) => 
      directors[i] || {
        name: '',
        dob: '',
        nationality: 'Kenyan',
        kraPin: '',
        address: '',
        documents: {
          photoIdFront: null,
          photoIdBack: null,
          kraCertificate: null,
          proofOfAddress: null,
          selfie: null
        },
        uploadedDocuments: {
          photoIdFront: null,
          photoIdBack: null,
          kraCertificate: null,
          proofOfAddress: null,
          selfie: null
        }
      }
    );
    setDirectors(newDirectors);
  }, [numberOfDirectors]);


  const handleBusinessInfoChange = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setBusinessAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleDirectorChange = (index, field, value) => {
    const newDirectors = [...directors];
    newDirectors[index] = { ...newDirectors[index], [field]: value };
    setDirectors(newDirectors);
  };

  const handleBusinessDocChange = (docType, file) => {
    setBusinessDocs(prev => ({ ...prev, [docType]: file }));
  };

  const handleDirectorDocChange = (directorIndex, docType, file) => {
    const newDirectors = [...directors];
    newDirectors[directorIndex].documents[docType] = file;
    setDirectors(newDirectors);
  };

  const uploadDocument = async (file, documentType, category = 'business') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);
    formData.append('category', category);

    try {
      const response = await api.post('/uploads/business-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.file;
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  };

  const handleStepSubmit = async () => {
    setLoading(true);
    try {
      if (currentStep === 1) {
        // Validate Step 1
        if (!businessInfo.companyNumber || !businessInfo.businessName || !businessInfo.phoneNumber) {
          toast.error('Please fill in all required fields');
          setLoading(false);
          return;
        }
        
        // Save business information to database
        await api.put('/users/profile', {
          businessInfo: {
            companyNumber: businessInfo.companyNumber,
            registrationDate: businessInfo.registrationDate,
            businessName: businessInfo.businessName,
            businessEmail: businessInfo.businessEmail,
            taxNumber: businessInfo.taxNumber,
            tradingName: businessInfo.tradingName,
            industrialClassification: businessInfo.industrialClassification,
            industrialSector: businessInfo.industrialSector,
            typeOfBusiness: businessInfo.typeOfBusiness,
            businessType: businessInfo.businessType
          },
          phoneCountryCode: businessInfo.phoneCountryCode,
          phoneNumber: businessInfo.phoneNumber
        });
        
        toast.success('Business information saved!');
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Validate Step 2
        if (!businessAddress.addressLine1 || !businessAddress.city || !businessAddress.county) {
          toast.error('Please fill in all required address fields');
          setLoading(false);
          return;
        }
        
        // Save business address to database
        await api.put('/users/profile', {
          address: {
            street: businessAddress.addressLine1,
            city: businessAddress.city,
            county: businessAddress.county,
            postalCode: businessAddress.postalCode,
            country: businessAddress.country
          }
        });
        
        toast.success('Business address saved!');
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Upload business documents
        const uploadPromises = [];
        const newUploadedDocs = { ...uploadedBusinessDocs };
        
        for (const [key, file] of Object.entries(businessDocs)) {
          if (file && !uploadedBusinessDocs[key]) {
            uploadPromises.push(
              uploadDocument(file, key, 'business').then(uploadedFile => {
                newUploadedDocs[key] = uploadedFile;
                setUploadedBusinessDocs(prev => ({ ...prev, [key]: uploadedFile }));
                return { key, uploadedFile };
              })
            );
          }
        }
        
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }
        
        // Save business documents to database
        await api.put('/users/profile', {
          businessInfo: {
            documents: {
              certificateOfIncorporation: newUploadedDocs.certificateOfIncorporation || uploadedBusinessDocs.certificateOfIncorporation || null,
              kraPinCertificate: newUploadedDocs.kraPinCertificate || uploadedBusinessDocs.kraPinCertificate || null,
              cr12: newUploadedDocs.cr12 || uploadedBusinessDocs.cr12 || null,
              businessPermit: newUploadedDocs.businessPermit || uploadedBusinessDocs.businessPermit || null
            }
          }
        });
        
        toast.success('Business documents uploaded and saved!');
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Upload director documents
        const uploadPromises = [];
        directors.forEach((director, index) => {
          for (const [key, file] of Object.entries(director.documents)) {
            if (file && !director.uploadedDocuments[key]) {
              uploadPromises.push(
                uploadDocument(file, `director_${index}_${key}`, 'director').then(uploadedFile => {
                  const newDirectors = [...directors];
                  newDirectors[index].uploadedDocuments[key] = uploadedFile;
                  setDirectors(newDirectors);
                })
              );
            }
          }
        });
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
        }

        // Prepare directors data with uploaded documents
        const directorsData = directors.map(director => ({
          name: director.name,
          dob: director.dob,
          nationality: director.nationality,
          kraPin: director.kraPin,
          address: director.address,
          documents: {
            photoIdFront: director.uploadedDocuments.photoIdFront || null,
            photoIdBack: director.uploadedDocuments.photoIdBack || null,
            kraCertificate: director.uploadedDocuments.kraCertificate || null,
            proofOfAddress: director.uploadedDocuments.proofOfAddress || null,
            selfie: director.uploadedDocuments.selfie || null
          }
        }));

        // Save directors and set approval status to pending
        await api.put('/users/profile', {
          businessInfo: {
            directors: directorsData,
            approvalStatus: 'pending',
            payaApproval: {
              status: 'pending'
            },
            bankApproval: {
              status: 'pending'
            },
            walletConnected: false
          }
        });

        toast.success('Application submitted successfully!');
        setCurrentStep(5);
      }
    } catch (error) {
      console.error('Step submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to save information');
    } finally {
      setLoading(false);
    }
  };

  const renderHelpBox = () => (
    <div className="help-box">
      <div className="help-icon">ℹ️</div>
      <div>
        <strong>Need Help?</strong>
        <p>Make sure all information matches your official business registration documents. This ensures smooth verification and compliance with our platform requirements.</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>Business Information</h2>
      <p>Enter your business details as they appear on official documents</p>
      
      {renderHelpBox()}

      <div className="form-grid">
        <div className="form-group">
          <label>Company Number *</label>
          <input
            type="text"
            value={businessInfo.companyNumber}
            onChange={(e) => handleBusinessInfoChange('companyNumber', e.target.value)}
            placeholder="e.g., PVT-123456"
            required
          />
        </div>

        <div className="form-group">
          <label>Registration Date *</label>
          <input
            type="date"
            value={businessInfo.registrationDate}
            onChange={(e) => handleBusinessInfoChange('registrationDate', e.target.value)}
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Business Name *</label>
          <input
            type="text"
            value={businessInfo.businessName}
            onChange={(e) => handleBusinessInfoChange('businessName', e.target.value)}
            placeholder="Enter registered business name"
            required
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <div style={{ position: 'relative' }}>
            <div className="phone-input-wrapper">
              <div ref={dropdownRef} className="country-code-selector">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="country-code-button"
                >
                  <span className="flag">{countryCodes.find(c => c.code === businessInfo.phoneCountryCode)?.flag}</span>
                  <span>{businessInfo.phoneCountryCode}</span>
                  <span className={`arrow ${showCountryDropdown ? 'open' : ''}`}>▼</span>
                </button>

                {showCountryDropdown && (
                  <div className="country-dropdown">
                    {countryCodes.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          handleBusinessInfoChange('phoneCountryCode', country.code);
                          handleBusinessInfoChange('phoneNumber', '');
                          setShowCountryDropdown(false);
                        }}
                        className={`country-option ${businessInfo.phoneCountryCode === country.code ? 'selected' : ''}`}
                      >
                        <span className="flag">{country.flag}</span>
                        <span className="country-name">{country.name}</span>
                        <span className="country-code">{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="tel"
                value={businessInfo.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  const maxLength = businessInfo.phoneCountryCode === '+1' ? 10 : 9;
                  if (value.length <= maxLength) {
                    handleBusinessInfoChange('phoneNumber', value);
                  }
                }}
                placeholder="712345678"
                className="phone-number-input"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Business Email Address *</label>
          <input
            type="email"
            value={businessInfo.businessEmail}
            onChange={(e) => handleBusinessInfoChange('businessEmail', e.target.value)}
            placeholder="business@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Tax Number (KRA PIN) *</label>
          <input
            type="text"
            value={businessInfo.taxNumber}
            onChange={(e) => handleBusinessInfoChange('taxNumber', e.target.value)}
            placeholder="A123456789X"
            required
          />
        </div>

        <div className="form-group">
          <label>Trading Name</label>
          <input
            type="text"
            value={businessInfo.tradingName}
            onChange={(e) => handleBusinessInfoChange('tradingName', e.target.value)}
            placeholder="Enter trading name (if different)"
          />
        </div>

        <div className="form-group">
          <label>Industrial Classification</label>
          <input
            type="text"
            value={businessInfo.industrialClassification}
            onChange={(e) => handleBusinessInfoChange('industrialClassification', e.target.value)}
            placeholder="e.g., Retail Trade"
          />
        </div>

        <div className="form-group">
          <label>Industrial Sector</label>
          <input
            type="text"
            value={businessInfo.industrialSector}
            onChange={(e) => handleBusinessInfoChange('industrialSector', e.target.value)}
            placeholder="e.g., Technology, Agriculture"
          />
        </div>

        <div className="form-group">
          <label>Type of Business *</label>
          <select
            value={businessInfo.typeOfBusiness}
            onChange={(e) => handleBusinessInfoChange('typeOfBusiness', e.target.value)}
            required
          >
            <option value="">Select type</option>
            <option value="Business">Business</option>
            <option value="Family">Family</option>
            <option value="Club">Club</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Business Type *</label>
          <select
            value={businessInfo.businessType}
            onChange={(e) => handleBusinessInfoChange('businessType', e.target.value)}
            required
          >
            <option value="">Select business type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Limited Company">Limited Company</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <h2>Business Address</h2>
      <p>Enter your registered business address</p>
      
      {renderHelpBox()}

      <div className="form-grid">
        <div className="form-group full-width">
          <label>Address Line 1 *</label>
          <input
            type="text"
            value={businessAddress.addressLine1}
            onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
            placeholder="Street address, P.O. Box, etc."
            required
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={businessAddress.city}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            placeholder="Enter city"
            required
          />
        </div>

        <div className="form-group">
          <label>County *</label>
          <input
            type="text"
            value={businessAddress.county}
            onChange={(e) => handleAddressChange('county', e.target.value)}
            placeholder="Enter county"
            required
          />
        </div>

        <div className="form-group">
          <label>Postal Code</label>
          <input
            type="text"
            value={businessAddress.postalCode}
            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            placeholder="00100"
          />
        </div>

        <div className="form-group">
          <label>Country *</label>
          <select
            value={businessAddress.country}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            required
          >
            <option value="Kenya">Kenya</option>
            <option value="United States">United States</option>
            <option value="South Africa">South Africa</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Uganda">Uganda</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <h2>Business Documents</h2>
      <p>Upload required business registration documents</p>
      
      {renderHelpBox()}

      <div className="document-upload-section">
        {[
          { key: 'certificateOfIncorporation', label: 'Certificate of Incorporation', required: true },
          { key: 'kraPinCertificate', label: 'KRA PIN Certificate', required: true },
          { key: 'cr12', label: 'CR-12', required: true },
          { key: 'businessPermit', label: 'Business Permit', required: true }
        ].map(doc => (
          <div key={doc.key} className="document-item">
            <h3 className="document-title">{doc.label} {doc.required && '*'}</h3>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id={doc.key}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => handleBusinessDocChange(doc.key, e.target.files[0])}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleBusinessDocChange(doc.key, file);
                }}
                className="file-input-hidden"
              />
              <label 
                htmlFor={doc.key} 
                className="file-upload-label"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleBusinessDocChange(doc.key, file);
                }}
              >
                {businessDocs[doc.key] ? (
                  <div className="file-selected">
                    <div>
                      <span>✓ {businessDocs[doc.key].name}</span>
                      <small>({(businessDocs[doc.key].size / 1024 / 1024).toFixed(2)} MB)</small>
                    </div>
                  </div>
                ) : uploadedBusinessDocs[doc.key] ? (
                  <div className="file-selected">
                    <span>✓ {uploadedBusinessDocs[doc.key].originalName}</span>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <div className="upload-text">
                      <span className="upload-main">Choose file or drag here</span>
                      <small>Supported file type(s): PDF, DOC, JPG</small>
                      <small>Size limit: 10 MB </small>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <h2>Business Directors</h2>
      <p>Provide information for all business directors</p>
      
      {renderHelpBox()}

      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <label>Number of Directors *</label>
        <select
          value={numberOfDirectors}
          onChange={(e) => setNumberOfDirectors(parseInt(e.target.value))}
          style={{ maxWidth: '200px' }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {directors.map((director, index) => (
        <div key={index} className="director-section">
          <h3>Director {index + 1}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={director.name}
                onChange={(e) => handleDirectorChange(index, 'name', e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                value={director.dob}
                onChange={(e) => handleDirectorChange(index, 'dob', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Nationality *</label>
              <select
                value={director.nationality}
                onChange={(e) => handleDirectorChange(index, 'nationality', e.target.value)}
                required
              >
                <option value="Kenyan">Kenyan</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Tanzanian">Tanzanian</option>
                <option value="South African">South African</option>
              </select>
            </div>

            <div className="form-group">
              <label>KRA PIN *</label>
              <input
                type="text"
                value={director.kraPin}
                onChange={(e) => handleDirectorChange(index, 'kraPin', e.target.value)}
                placeholder="A123456789X"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Address *</label>
              <input
                type="text"
                value={director.address}
                onChange={(e) => handleDirectorChange(index, 'address', e.target.value)}
                placeholder="Enter residential address"
                required
              />
            </div>
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Director Documents</h4>
          <div className="document-upload-section">
            {[
              { key: 'photoIdFront', label: 'Photo ID (Front)', required: true },
              { key: 'photoIdBack', label: 'Photo ID (Back)', required: true },
              { key: 'kraCertificate', label: 'KRA Certificate', required: true },
              { key: 'proofOfAddress', label: 'Proof of Address', required: true },
              { key: 'selfie', label: 'Selfie with Thumbs Up', required: true }
            ].map(doc => (
              <div key={doc.key} className="document-item">
                <h3 className="document-title">{doc.label} {doc.required && '*'}</h3>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id={`director_${index}_${doc.key}`}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDirectorDocChange(index, doc.key, e.target.files[0])}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleDirectorDocChange(index, doc.key, file);
                    }}
                    className="file-input-hidden"
                  />
                  <label 
                    htmlFor={`director_${index}_${doc.key}`} 
                    className="file-upload-label"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleDirectorDocChange(index, doc.key, file);
                    }}
                  >
                    {director.documents[doc.key] ? (
                      <div className="file-selected">
                        <div>
                          <span>✓ {director.documents[doc.key].name}</span>
                          <small>({(director.documents[doc.key].size / 1024 / 1024).toFixed(2)} MB)</small>
                        </div>
                      </div>
                    ) : director.uploadedDocuments[doc.key] ? (
                      <div className="file-selected">
                        <span>✓ {director.uploadedDocuments[doc.key].originalName || 'Uploaded'}</span>
                      </div>
                    ) : (
                      <div className="file-upload-placeholder">
                        <div className="upload-text">
                          <span className="upload-main">Choose file or drag here</span>
                          <small>Supported file type(s): PDF, JPG, PNG</small>
                          <small>Size limit: 10 MB</small>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <h2>Application Review</h2>
      <p>Your application is being processed</p>

      <div className="review-info-box">
        <h3>What happens next?</h3>
        <ul>
          <li>Our team will review your application within 1-3 business days</li>
          <li>Once approved, your Paya Business Wallet will be activated</li>
          <li>You can then upload products and start receiving BNPL orders</li>
        </ul>
        <p><strong>Need help?</strong> Contact us at <a href="mailto:support@paya.co.ke">support@paya.co.ke</a></p>
      </div>

      <div className="approval-steps">
        <div className={`approval-step ${approvalStatus.payaApproval === 'approved' ? 'completed' : approvalStatus.payaApproval === 'pending' ? 'pending' : 'rejected'}`}>
          <div className="step-icon">
            {approvalStatus.payaApproval === 'approved' ? '✅' : 
             approvalStatus.payaApproval === 'rejected' ? '❌' : '⏳'}
          </div>
          <div className="step-content">
            <h3>1. Paya Approval</h3>
            <p>Our team is reviewing your business information and documents</p>
          </div>
          <span className={`status-badge ${approvalStatus.payaApproval}`}>
            {approvalStatus.payaApproval.toUpperCase()}
          </span>
        </div>

        <div className={`approval-step ${approvalStatus.bankApproval === 'approved' ? 'completed' : approvalStatus.bankApproval === 'pending' ? 'pending' : 'rejected'}`}>
          <div className="step-icon">
            {approvalStatus.bankApproval === 'approved' ? '✅' : 
             approvalStatus.bankApproval === 'rejected' ? '❌' : '⏳'}
          </div>
          <div className="step-content">
            <h3>2. Diamond Trust Bank Approval</h3>
            <p>Setting up your Paya Business Wallet for payments</p>
          </div>
          <span className={`status-badge ${approvalStatus.bankApproval}`}>
            {approvalStatus.bankApproval.toUpperCase()}
          </span>
        </div>

        {/* Only show step 3 when both approvals are complete */}
        {approvalStatus.payaApproval === 'approved' && approvalStatus.bankApproval === 'approved' && (
          <div className={`approval-step completed`}>
            <div className="step-icon">✅</div>
            <div className="step-content">
              <h3>3. Complete! Ready to Sell</h3>
              <p>Your wallet is connected and you can start uploading products</p>
              <button className="btn btn-primary" onClick={() => navigate('/products')}>
                Start Selling
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1>Merchant Onboarding</h1>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
        </div>
        <div className="step-indicators">
          {['Business Info', 'Address', 'Documents', 'Directors', 'Review'].map((label, index) => (
            <div key={index} className={`step-indicator ${currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''}`}>
              <div className="step-number">{index + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      {currentStep < 5 && (
        <div className="onboarding-actions">
          {currentStep > 1 && (
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={loading}
            >
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleStepSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : currentStep === 4 ? 'Submit Application' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MerchantOnboardingNew;
