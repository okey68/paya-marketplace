/**
 * STEP-BY-STEP INTEGRATION EXAMPLE
 * 
 * This file shows exactly how to integrate Redux Persist into your existing
 * MerchantOnboardingNew.js component with minimal changes.
 */

// ============================================================================
// STEP 1: Update your index.js
// ============================================================================

// File: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// ============================================================================
// STEP 2: Modify MerchantOnboardingNew.js
// ============================================================================

// Add this import at the top
import { useOnboarding } from '../hooks/useOnboarding';

// REPLACE all useState declarations with useOnboarding hook
const MerchantOnboardingNew = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // ❌ REMOVE these useState declarations:
  // const [currentStep, setCurrentStep] = useState(1);
  // const [ownerInfo, setOwnerInfo] = useState({...});
  // const [ownerId, setOwnerId] = useState(null);
  // etc.
  
  // ✅ ADD this instead:
  const {
    currentStep,
    directorSubStep,
    ownerInfo,
    ownerId,
    businessInfo,
    businessAddress,
    organizationId,
    businessDocs,
    directors,
    currentDirector,
    currentDirectorId,
    directorDocuments,
    errors,
    goToStep,
    setSubStep,
    markStepComplete,
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
    getInitialStep,
    isStepCompleted,
  } = useOnboarding();

  // REMOVE the useEffect that manages localStorage
  // ❌ DELETE THIS:
  // useEffect(() => {
  //   if (currentStep >= 1 && currentStep <= 5) {
  //     localStorage.setItem('merchantOnboardingStep', currentStep.toString());
  //   }
  // }, [currentStep]);

  // REPLACE the restoration useEffect
  useEffect(() => {
    if (!authLoading && user) {
      const hasCompletedOnboarding =
        user.businessInfo?.businessName &&
        user.businessInfo?.companyNumber &&
        user.businessInfo?.directors?.length > 0;

      if (hasCompletedOnboarding) {
        // Use persisted step or go to step 5
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      } else {
        // Restore from persisted state
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      }
    }
  }, [authLoading, user, getInitialStep, currentStep, goToStep]);

  // UPDATE input handlers
  // ❌ OLD:
  // onChange={(e) => setOwnerInfo(prev => ({ ...prev, username: e.target.value }))}
  
  // ✅ NEW:
  // onChange={(e) => {
  //   saveOwnerInfo({ username: e.target.value });
  //   if (errors.ownerUsername) {
  //     removeError('ownerUsername');
  //   }
  // }}

  // UPDATE validation and error handling
  const validateStep1 = () => {
    const newErrors = {};
    
    if (!ownerInfo.username || ownerInfo.username.trim() === '') {
      newErrors.ownerUsername = 'Username is required';
    }
    // ... other validations
    
    // ❌ OLD: setErrors(newErrors);
    // ✅ NEW:
    saveErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // UPDATE step submission
  const handleStepSubmit = async () => {
    // ❌ OLD: setErrors({});
    // ✅ NEW:
    removeAllErrors();
    
    // Step-specific validation
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast.error("Please fill in all required fields correctly");
        return;
      }
    }
    
    setLoading(true);
    try {
      if (currentStep === 1) {
        const ownerData = {
          username: ownerInfo.username,
          email: ownerInfo.email,
          phone: ownerInfo.phone,
          firstName: ownerInfo.firstName,
          lastName: ownerInfo.lastName,
          middleName: ownerInfo.middleName || undefined,
          idNumber: ownerInfo.idNumber,
          kraPin: ownerInfo.kraPin,
        };

        const response = await api.post(
          "/v1/external/organizations/owners",
          ownerData
        );
        const createdOwner = response.data;

        // ❌ OLD: setOwnerId(createdOwner.userId);
        // ✅ NEW:
        saveOwnerId(createdOwner.userId);
        
        // ✅ Mark step complete
        markStepComplete(1);
        
        toast.success("Owner created successfully!");
        
        // ❌ OLD: setCurrentStep(2);
        // ✅ NEW:
        goToStep(2);
        return;
      }
      
      // Similar pattern for other steps...
      
    } catch (error) {
      console.error("Step submission error:", error);
      toast.error(error.response?.data?.message || "Failed to save information");
    } finally {
      setLoading(false);
    }
  };

  // Rest of component remains the same...
};

// ============================================================================
// STEP 3: Update Input Fields
// ============================================================================

// EXAMPLE: Update owner info inputs
<input
  type="text"
  value={ownerInfo.username}
  onChange={(e) => {
    saveOwnerInfo({ username: e.target.value });
    if (errors.ownerUsername) {
      removeError('ownerUsername');
    }
  }}
  placeholder="john_doe_corp"
  className={errors.ownerUsername ? 'input-error' : ''}
  required
/>

// EXAMPLE: Update business info inputs
<input
  type="text"
  value={businessInfo.businessName}
  onChange={(e) => {
    saveBusinessInfo({ businessName: e.target.value });
    if (errors.businessName) {
      removeError('businessName');
    }
  }}
  placeholder="Enter registered business name"
  className={errors.businessName ? 'input-error' : ''}
  required
/>

// EXAMPLE: Update business address inputs
<input
  type="text"
  value={businessAddress.city}
  onChange={(e) => {
    saveBusinessAddress({ city: e.target.value });
    if (errors.city) {
      removeError('city');
    }
  }}
  placeholder="Enter city"
  className={errors.city ? 'input-error' : ''}
  required
/>

// ============================================================================
// STEP 4: Update Document Handlers
// ============================================================================

const handleBusinessDocChange = (docType, file) => {
  // ❌ OLD: setBusinessDocs((prev) => ({ ...prev, [docType]: file }));
  // ✅ NEW:
  saveBusinessDocs({ [docType]: file });
  
  // Clear error when file is selected
  if (file) {
    // ❌ OLD: setErrors((prev) => ({ ...prev, [docType]: null }));
    // ✅ NEW:
    removeError(docType);
  }
};

// ============================================================================
// STEP 5: Update Director Handlers
// ============================================================================

// Update current director input
<input
  type="text"
  value={currentDirector.username}
  onChange={(e) => {
    saveCurrentDirector({ username: e.target.value });
    if (errors.directorUsername) {
      removeError('directorUsername');
    }
  }}
  placeholder="jane_smith_dir"
  className={errors.directorUsername ? 'input-error' : ''}
  required
/>

// When director is completed
const completeDirector = () => {
  const directorData = {
    ...currentDirector,
    userId: currentDirectorId,
  };
  
  // ❌ OLD: setDirectors([...directors, directorData]);
  // ✅ NEW:
  addNewDirector(directorData);
  
  // The hook automatically resets currentDirector state
};

// ============================================================================
// STEP 6: Update Navigation
// ============================================================================

// Back button
<button
  className="btn btn-secondary"
  onClick={() => {
    if (currentStep === 4 && directorSubStep === 2) {
      // ❌ OLD: setDirectorSubStep(1);
      // ✅ NEW:
      setSubStep(1);
    } else {
      // ❌ OLD: setCurrentStep(currentStep - 1);
      // ✅ NEW:
      goToStep(currentStep - 1);
    }
  }}
  disabled={loading}
>
  ← Back
</button>

// ============================================================================
// STEP 7: Test Your Implementation
// ============================================================================

// Test checklist:
// 1. ✅ Fill in Step 1 data, refresh page - data should persist
// 2. ✅ Submit Step 1, refresh page - should show Step 2
// 3. ✅ Fill partial data in Step 2, close browser, reopen - data should be there
// 4. ✅ Complete all steps, refresh - should show Step 5
// 5. ✅ Logout and login - onboarding state should be preserved
// 6. ✅ Check localStorage (key: persist:root) - should see your data

// ============================================================================
// BENEFITS YOU GET
// ============================================================================

// ✨ Auto-save: Every input change is automatically persisted
// ✨ No manual localStorage: Redux Persist handles everything
// ✨ Step tracking: Completed steps are tracked automatically
// ✨ Restore on reload: User returns to exactly where they left off
// ✨ Cross-session: Data survives browser close/reopen
// ✨ Clean code: No scattered setState calls, centralized state management
// ✨ Type-safe: Full TypeScript support if needed
// ✨ Debuggable: Redux DevTools show all state changes
// ✨ Testable: Easy to unit test with Redux

// ============================================================================
// ADVANCED: Sync with Backend
// ============================================================================

// Optional: Sync persisted state with backend on mount
useEffect(() => {
  const syncWithBackend = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.user || response.data;
      
      // If backend has more recent data, restore it
      if (userData.businessInfo && userData.businessInfo.lastUpdated > lastSaved) {
        // Map backend data to Redux state
        if (userData.businessInfo.businessName) {
          saveBusinessInfo({
            businessName: userData.businessInfo.businessName,
            companyNumber: userData.businessInfo.companyNumber,
            // ... other fields
          });
        }
        
        // Update organization ID if present
        if (userData.businessInfo.organizationId) {
          saveOrganizationId(userData.businessInfo.organizationId);
        }
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
    }
  };
  
  if (!authLoading && user) {
    syncWithBackend();
  }
}, [authLoading, user]);

export default MerchantOnboardingNew;
