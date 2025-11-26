import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../hooks/useOnboarding';
import api from '../utils/api';
import './MerchantOnboarding.css';

/**
 * Example component showing how to integrate Redux Persist with onboarding
 * This demonstrates the core patterns for using the useOnboarding hook
 */
const MerchantOnboardingRedux = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Get all onboarding state and actions from Redux
  const {
    // State
    currentStep,
    directorSubStep,
    ownerInfo,
    ownerId,
    businessInfo,
    businessAddress,
    organizationId,
    businessDocs,
    currentDirector,
    currentDirectorId,
    directors,
    directorDocuments,
    errors,
    isOnboardingComplete,
    
    // Actions
    goToStep,
    setSubStep,
    markStepComplete,
    isStepCompleted,
    saveOwnerInfo,
    saveOwnerId,
    saveBusinessInfo,
    saveBusinessAddress,
    saveOrganizationId,
    saveBusinessDocs,
    saveCurrentDirector,
    saveCurrentDirectorId,
    saveDirectorDocuments,
    addNewDirector,
    saveErrors,
    removeError,
    removeAllErrors,
    markOnboardingComplete,
    
    // Utilities
    getInitialStep,
    canProceedToStep,
    getProgressPercentage,
  } = useOnboarding();

  // On component mount, restore the appropriate step
  useEffect(() => {
    if (!authLoading && user) {
      // Check if user has completed onboarding in backend
      const hasCompletedOnboarding =
        user.businessInfo?.businessName &&
        user.businessInfo?.companyNumber &&
        user.businessInfo?.directors?.length > 0;

      if (hasCompletedOnboarding) {
        // User has completed onboarding
        if (!isOnboardingComplete) {
          markOnboardingComplete(true);
        }
        
        // If they're viewing onboarding again, show step 5
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      } else {
        // New user or incomplete onboarding - restore from persisted state
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      }
    }
  }, [authLoading, user]);

  // Example: Handle input change for owner info (with auto-save to Redux)
  const handleOwnerInfoChange = (field, value) => {
    // Update Redux state (automatically persisted)
    saveOwnerInfo({ [field]: value });
    
    // Clear error for this field if it exists
    if (errors[`owner${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      removeError(`owner${field.charAt(0).toUpperCase() + field.slice(1)}`);
    }
  };

  // Example: Handle step 1 submission
  const handleStep1Submit = async () => {
    removeAllErrors();
    
    // Validate
    const newErrors = {};
    if (!ownerInfo.username?.trim()) {
      newErrors.ownerUsername = 'Username is required';
    }
    if (!ownerInfo.email?.trim()) {
      newErrors.ownerEmail = 'Email is required';
    }
    if (!ownerInfo.phone?.trim()) {
      newErrors.ownerPhone = 'Phone number is required';
    }
    if (!ownerInfo.firstName?.trim()) {
      newErrors.ownerFirstName = 'First name is required';
    }
    if (!ownerInfo.lastName?.trim()) {
      newErrors.ownerLastName = 'Last name is required';
    }
    if (!ownerInfo.idNumber?.trim()) {
      newErrors.ownerIdNumber = 'ID number is required';
    }
    if (!ownerInfo.kraPin?.trim()) {
      newErrors.ownerKraPin = 'KRA PIN is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      saveErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      // Call API to create owner
      const response = await api.post('/v1/external/organizations/owners', ownerInfo);
      const createdOwner = response.data;
      
      // Save owner ID to Redux (persisted automatically)
      saveOwnerId(createdOwner.userId);
      
      // Mark step 1 as complete
      markStepComplete(1);
      
      // Move to step 2
      goToStep(2);
      
      toast.success('Owner created successfully!');
    } catch (error) {
      console.error('Step 1 error:', error);
      toast.error(error.response?.data?.message || 'Failed to create owner');
    } finally {
      setLoading(false);
    }
  };

  // Example: Handle business info change
  const handleBusinessInfoChange = (field, value) => {
    saveBusinessInfo({ [field]: value });
    
    if (errors[field]) {
      removeError(field);
    }
  };

  // Example: Handle business address change
  const handleBusinessAddressChange = (field, value) => {
    saveBusinessAddress({ [field]: value });
    
    if (errors[field]) {
      removeError(field);
    }
  };

  // Example: Handle step 2 submission
  const handleStep2Submit = async () => {
    removeAllErrors();
    
    // Validation
    const newErrors = {};
    if (!businessInfo.companyNumber?.trim()) {
      newErrors.companyNumber = 'Company number is required';
    }
    if (!businessInfo.businessName?.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    // ... add other validations
    
    if (Object.keys(newErrors).length > 0) {
      saveErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      // Prepare data for API
      const orgData = {
        ownerId,
        name: businessInfo.businessName,
        companyNumber: businessInfo.companyNumber,
        registrationDate: businessInfo.registrationDate,
        // ... other fields
        address: businessAddress,
      };
      
      // Call API
      const response = await api.post('/v1/external/organizations', orgData);
      const createdOrg = response.data;
      
      // Save organization ID
      saveOrganizationId(createdOrg.organizationId);
      
      // Mark step 2 as complete
      markStepComplete(2);
      
      // Move to step 3
      goToStep(3);
      
      toast.success('Organization created successfully!');
    } catch (error) {
      console.error('Step 2 error:', error);
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  // Example: Handle document upload
  const handleDocumentChange = (docType, file) => {
    // Save to Redux (Note: Files are in ignoredPaths for serialization)
    saveBusinessDocs({ [docType]: file });
    
    if (errors[docType]) {
      removeError(docType);
    }
  };

  // Example: Handle director info change
  const handleDirectorChange = (field, value) => {
    saveCurrentDirector({ [field]: value });
    
    if (errors[`director${field.charAt(0).toUpperCase() + field.slice(1)}`]) {
      removeError(`director${field.charAt(0).toUpperCase() + field.slice(1)}`);
    }
  };

  // Example: Navigate back
  const handleBack = () => {
    if (currentStep === 4 && directorSubStep === 2) {
      setSubStep(1);
    } else if (currentStep > 1) {
      goToStep(currentStep - 1);
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
          <div
            className="progress-fill"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="step-indicators">
          {['Owner Info', 'Business Info', 'Documents', 'Directors', 'Review'].map(
            (label, index) => (
              <div
                key={index}
                className={`step-indicator ${
                  isStepCompleted(index + 1)
                    ? 'completed'
                    : currentStep === index + 1
                    ? 'active'
                    : ''
                }`}
              >
                <div className="step-number">{index + 1}</div>
                <span>{label}</span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="onboarding-content">
        {/* Step 1: Owner Information */}
        {currentStep === 1 && (
          <div className="onboarding-step">
            <h2>Organization Owner Information</h2>
            <p>Enter the details of the person who will own and manage this organization</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={ownerInfo.username}
                  onChange={(e) => handleOwnerInfoChange('username', e.target.value)}
                  placeholder="john_doe_corp"
                  className={errors.ownerUsername ? 'input-error' : ''}
                />
                {errors.ownerUsername && (
                  <span className="error-message">{errors.ownerUsername}</span>
                )}
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={ownerInfo.email}
                  onChange={(e) => handleOwnerInfoChange('email', e.target.value)}
                  placeholder="john.doe@company.com"
                  className={errors.ownerEmail ? 'input-error' : ''}
                />
                {errors.ownerEmail && (
                  <span className="error-message">{errors.ownerEmail}</span>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={ownerInfo.phone}
                  onChange={(e) => handleOwnerInfoChange('phone', e.target.value)}
                  placeholder="254712345678"
                  className={errors.ownerPhone ? 'input-error' : ''}
                />
                {errors.ownerPhone && (
                  <span className="error-message">{errors.ownerPhone}</span>
                )}
              </div>

              {/* Add other fields similarly */}
            </div>
          </div>
        )}

        {/* Add other steps similarly */}
      </div>

      <div className="onboarding-actions">
        {currentStep > 1 && (
          <button
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={loading}
          >
            ← Back
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={currentStep === 1 ? handleStep1Submit : handleStep2Submit}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
};

export default MerchantOnboardingRedux;
