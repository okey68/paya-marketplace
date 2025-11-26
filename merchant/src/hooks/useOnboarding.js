import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import {
  setCurrentStep,
  setDirectorSubStep,
  completeStep,
  updateOwnerInfo,
  setOwnerId,
  updateBusinessInfo,
  updateBusinessAddress,
  setOrganizationId,
  updateBusinessDocs,
  updateCurrentDirector,
  setCurrentDirectorId,
  updateDirectorDocuments,
  addDirector,
  setOrganizationStatus,
  updateApprovalStatus,
  setErrors,
  clearError,
  clearAllErrors,
  setOnboardingComplete,
  resetOnboarding,
  restoreOnboardingState,
} from '../store/slices/onboardingSlice';

/**
 * Custom hook for accessing and managing onboarding state
 * Provides a clean interface for components to interact with Redux
 */
export const useOnboarding = () => {
  const dispatch = useDispatch();
  
  // Select all onboarding state
  const onboardingState = useSelector((state) => state.onboarding);
  
  // Destructure commonly used state
  const {
    currentStep,
    directorSubStep,
    completedSteps,
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
    organizationStatus,
    approvalStatus,
    errors,
    isOnboardingComplete,
    lastSaved,
  } = onboardingState;
  
  // Navigation actions
  const goToStep = useCallback((step) => {
    dispatch(setCurrentStep(step));
  }, [dispatch]);
  
  const setSubStep = useCallback((subStep) => {
    dispatch(setDirectorSubStep(subStep));
  }, [dispatch]);
  
  const markStepComplete = useCallback((step) => {
    dispatch(completeStep(step));
  }, [dispatch]);
  
  // Check if a step is completed
  const isStepCompleted = useCallback((step) => {
    return completedSteps.includes(step);
  }, [completedSteps]);
  
  // Owner info actions
  const saveOwnerInfo = useCallback((data) => {
    dispatch(updateOwnerInfo(data));
  }, [dispatch]);
  
  const saveOwnerId = useCallback((id) => {
    dispatch(setOwnerId(id));
  }, [dispatch]);
  
  // Business info actions
  const saveBusinessInfo = useCallback((data) => {
    dispatch(updateBusinessInfo(data));
  }, [dispatch]);
  
  const saveBusinessAddress = useCallback((data) => {
    dispatch(updateBusinessAddress(data));
  }, [dispatch]);
  
  const saveOrganizationId = useCallback((id) => {
    dispatch(setOrganizationId(id));
  }, [dispatch]);
  
  // Document actions
  const saveBusinessDocs = useCallback((docs) => {
    dispatch(updateBusinessDocs(docs));
  }, [dispatch]);
  
  // Director actions
  const saveCurrentDirector = useCallback((data) => {
    dispatch(updateCurrentDirector(data));
  }, [dispatch]);
  
  const saveCurrentDirectorId = useCallback((id) => {
    dispatch(setCurrentDirectorId(id));
  }, [dispatch]);
  
  const saveDirectorDocuments = useCallback((docs) => {
    dispatch(updateDirectorDocuments(docs));
  }, [dispatch]);
  
  const addNewDirector = useCallback((director) => {
    dispatch(addDirector(director));
  }, [dispatch]);
  
  // Organization status actions
  const saveOrganizationStatus = useCallback((status) => {
    dispatch(setOrganizationStatus(status));
  }, [dispatch]);
  
  const saveApprovalStatus = useCallback((status) => {
    dispatch(updateApprovalStatus(status));
  }, [dispatch]);
  
  // Error handling actions
  const saveErrors = useCallback((errorObj) => {
    dispatch(setErrors(errorObj));
  }, [dispatch]);
  
  const removeError = useCallback((errorKey) => {
    dispatch(clearError(errorKey));
  }, [dispatch]);
  
  const removeAllErrors = useCallback(() => {
    dispatch(clearAllErrors());
  }, [dispatch]);
  
  // Completion actions
  const markOnboardingComplete = useCallback((isComplete = true) => {
    dispatch(setOnboardingComplete(isComplete));
  }, [dispatch]);
  
  const resetAllOnboarding = useCallback(() => {
    dispatch(resetOnboarding());
  }, [dispatch]);
  
  const restoreState = useCallback((state) => {
    dispatch(restoreOnboardingState(state));
  }, [dispatch]);
  
  // Utility: Determine which step to show on app load
  const getInitialStep = useCallback(() => {
    // If onboarding is complete, go to step 5
    if (isOnboardingComplete) {
      return 5;
    }
    
    // If step 4 is completed, go to step 5
    if (completedSteps.includes(4)) {
      return 5;
    }
    
    // If step 3 is completed, go to step 4
    if (completedSteps.includes(3)) {
      return 4;
    }
    
    // If step 2 is completed, go to step 3
    if (completedSteps.includes(2)) {
      return 3;
    }
    
    // If step 1 is completed, go to step 2
    if (completedSteps.includes(1)) {
      return 2;
    }
    
    // Otherwise, start at step 1
    return 1;
  }, [completedSteps, isOnboardingComplete]);
  
  // Utility: Check if user can proceed to a specific step
  const canProceedToStep = useCallback((targetStep) => {
    // Can always go to step 1
    if (targetStep === 1) return true;
    
    // For other steps, check if previous step is completed
    return completedSteps.includes(targetStep - 1);
  }, [completedSteps]);
  
  // Utility: Get progress percentage
  const getProgressPercentage = useCallback(() => {
    return (currentStep / 5) * 100;
  }, [currentStep]);
  
  return {
    // State
    currentStep,
    directorSubStep,
    completedSteps,
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
    organizationStatus,
    approvalStatus,
    errors,
    isOnboardingComplete,
    lastSaved,
    
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
    saveOrganizationStatus,
    saveApprovalStatus,
    saveErrors,
    removeError,
    removeAllErrors,
    markOnboardingComplete,
    resetAllOnboarding,
    restoreState,
    
    // Utilities
    getInitialStep,
    canProceedToStep,
    getProgressPercentage,
  };
};
