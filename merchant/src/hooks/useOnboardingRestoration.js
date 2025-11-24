import { useEffect } from 'react';
import { useOnboarding } from '../hooks/useOnboarding';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to handle onboarding state restoration
 * This demonstrates the proper way to sync persisted state with backend data
 */
export const useOnboardingRestoration = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    currentStep,
    isOnboardingComplete,
    completedSteps,
    organizationId,
    goToStep,
    markStepComplete,
    setOnboardingComplete,
    restoreState,
    saveOwnerInfo,
    saveOwnerId,
    saveBusinessInfo,
    saveOrganizationId,
    saveApprovalStatus,
    getInitialStep,
  } = useOnboarding();

  useEffect(() => {
    if (authLoading || !user) return;

    /**
     * STRATEGY 1: Backend is source of truth
     * Use this if you want backend data to always override persisted data
     */
    const restoreFromBackend = () => {
      // Check if user has completed onboarding on backend
      const backendComplete =
        user.businessInfo?.businessName &&
        user.businessInfo?.companyNumber &&
        user.businessInfo?.directors?.length > 0;

      if (backendComplete) {
        // User completed onboarding - mark complete and go to step 5
        if (!isOnboardingComplete) {
          setOnboardingComplete(true);
        }

        // Restore approval status from backend
        if (user.businessInfo) {
          saveApprovalStatus({
            payaApproval: user.businessInfo?.payaApproval?.status || 'pending',
            bankApproval: user.businessInfo?.bankApproval?.status || 'pending',
            walletConnected: user.businessInfo?.walletConnected || false,
          });
        }

        // Restore organization ID
        if (user.businessInfo?.organizationId) {
          saveOrganizationId(user.businessInfo.organizationId);
        }

        // Go to final step
        if (currentStep !== 5) {
          goToStep(5);
        }
      } else {
        // User hasn't completed - use persisted step or start fresh
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      }
    };

    /**
     * STRATEGY 2: Merge backend and persisted data
     * Use this if you want to preserve local changes but sync IDs
     */
    const mergeBackendAndPersisted = () => {
      // Check backend completion
      const backendComplete = user.businessInfo?.businessName;

      if (backendComplete) {
        // Mark complete
        if (!isOnboardingComplete) {
          setOnboardingComplete(true);
        }

        // Sync IDs from backend (these are authoritative)
        if (user.businessInfo?.organizationId && !organizationId) {
          saveOrganizationId(user.businessInfo.organizationId);
        }

        // Sync owner info if not present locally
        if (user.firstName && !saveOwnerInfo.firstName) {
          saveOwnerInfo({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          });
        }

        // Go to step 5
        if (currentStep !== 5) {
          goToStep(5);
        }
      } else {
        // Not complete - restore appropriate step
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      }
    };

    /**
     * STRATEGY 3: Smart sync based on timestamps
     * Use this for the most robust solution
     */
    const smartSync = () => {
      const backendComplete =
        user.businessInfo?.businessName &&
        user.businessInfo?.companyNumber;

      if (backendComplete) {
        // Backend has completed data
        setOnboardingComplete(true);

        // Always sync these authoritative fields from backend
        if (user.businessInfo.organizationId) {
          saveOrganizationId(user.businessInfo.organizationId);
        }

        if (user.businessInfo.ownerId) {
          saveOwnerId(user.businessInfo.ownerId);
        }

        // Sync business info if backend is more recent
        const backendTimestamp = new Date(
          user.businessInfo.lastUpdated || user.updatedAt
        ).getTime();
        const localTimestamp = new Date(
          localStorage.getItem('onboarding:lastSaved') || 0
        ).getTime();

        if (backendTimestamp > localTimestamp) {
          // Backend is more recent - restore from it
          saveBusinessInfo({
            businessName: user.businessInfo.businessName,
            companyNumber: user.businessInfo.companyNumber,
            taxNumber: user.businessInfo.taxNumber,
            phoneNumber: user.businessInfo.phone,
            businessEmail: user.businessInfo.email,
          });
        }

        // Update approval status
        saveApprovalStatus({
          payaApproval: user.businessInfo?.payaApproval?.status || 'pending',
          bankApproval: user.businessInfo?.bankApproval?.status || 'pending',
          walletConnected: user.businessInfo?.walletConnected || false,
        });

        // Go to step 5
        if (currentStep !== 5) {
          goToStep(5);
        }
      } else {
        // Not complete on backend
        if (isOnboardingComplete) {
          // Local says complete but backend doesn't - trust backend
          setOnboardingComplete(false);
        }

        // Check if we need to resume from a specific step
        if (user.businessInfo?.organizationId && !completedSteps.includes(2)) {
          // User has org ID but step 2 not marked complete
          markStepComplete(1);
          markStepComplete(2);
        }

        if (user.ownerId && !completedSteps.includes(1)) {
          // User has owner ID but step 1 not marked complete
          markStepComplete(1);
        }

        // Go to appropriate step
        const initialStep = getInitialStep();
        if (currentStep !== initialStep) {
          goToStep(initialStep);
        }
      }
    };

    // Choose your strategy
    smartSync(); // Recommended
    // restoreFromBackend(); // Simpler, backend always wins
    // mergeBackendAndPersisted(); // Middle ground

  }, [authLoading, user]); // Deliberately minimal dependencies

  return {
    isReady: !authLoading && user,
  };
};

/**
 * USAGE EXAMPLE
 * 
 * In your MerchantOnboardingNew.js:
 * 
 * const MerchantOnboardingNew = () => {
 *   const { user, loading: authLoading } = useAuth();
 *   const navigate = useNavigate();
 *   
 *   // Use the restoration hook
 *   const { isReady } = useOnboardingRestoration();
 *   
 *   // Get onboarding state
 *   const {
 *     currentStep,
 *     ownerInfo,
 *     saveOwnerInfo,
 *     // ... other state
 *   } = useOnboarding();
 *   
 *   // Wait for restoration to complete
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   // Render your component
 *   return (
 *     <div>
 *       Step {currentStep}
 *       ...
 *     </div>
 *   );
 * };
 */

/**
 * BEST PRACTICES
 * 
 * 1. Always sync IDs from backend (organizationId, ownerId)
 *    - These are authoritative and must match backend
 * 
 * 2. Use timestamps to determine which data is more recent
 *    - Backend timestamp vs local lastSaved
 * 
 * 3. Mark steps complete based on backend data
 *    - If organizationId exists, step 2 is complete
 *    - If ownerId exists, step 1 is complete
 * 
 * 4. Handle edge cases:
 *    - User completes locally but backend fails
 *    - User completes on another device
 *    - User clears cookies but backend has data
 * 
 * 5. Always redirect completed users to step 5
 *    - Don't let them re-submit completed steps
 */
