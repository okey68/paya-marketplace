import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current step (1-5)
  currentStep: 1,
  
  // Director sub-step (1-3) for step 4
  directorSubStep: 1,
  
  // Track which steps have been completed
  completedSteps: [],
  
  // Step 1: Owner Information
  ownerInfo: {
    username: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    middleName: '',
    idNumber: '',
    kraPin: '',
  },
  ownerId: null,
  
  // Step 2: Business Information
  businessInfo: {
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
    businessType: '',
  },
  
  // Business Address (part of step 2)
  businessAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postalCode: '',
    country: 'Kenya',
  },
  organizationId: null,
  
  // Step 3: Business Documents
  businessDocs: {
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    cr12: null,
    businessPermit: null,
  },
  
  // Step 4: Directors
  directors: [],
  currentDirector: {
    username: '',
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    middleName: '',
    idNumber: '',
    kraPin: '',
    position: 'DIRECTOR',
  },
  currentDirectorId: null,
  directorDocuments: {
    photoIdFront: null,
    photoIdBack: null,
    kraCertificate: null,
    proofOfAddress: null,
    selfie: null,
  },
  
  // Step 5: Organization Status
  organizationStatus: null,
  approvalStatus: {
    payaApproval: 'pending',
    bankApproval: 'pending',
    walletConnected: false,
  },
  
  // Validation errors
  errors: {},
  
  // Track if onboarding is fully complete
  isOnboardingComplete: false,
  
  // Last saved timestamp
  lastSaved: null,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    // Navigate to a specific step
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Set director sub-step
    setDirectorSubStep: (state, action) => {
      state.directorSubStep = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Mark a step as completed
    completeStep: (state, action) => {
      const step = action.payload;
      if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
      }
      state.lastSaved = new Date().toISOString();
    },
    
    // Update owner information (partial or complete)
    updateOwnerInfo: (state, action) => {
      state.ownerInfo = { ...state.ownerInfo, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Set owner ID after creation
    setOwnerId: (state, action) => {
      state.ownerId = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Update business information (partial or complete)
    updateBusinessInfo: (state, action) => {
      state.businessInfo = { ...state.businessInfo, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Update business address (partial or complete)
    updateBusinessAddress: (state, action) => {
      state.businessAddress = { ...state.businessAddress, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Set organization ID after creation
    setOrganizationId: (state, action) => {
      state.organizationId = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Update business documents (individual or multiple)
    updateBusinessDocs: (state, action) => {
      state.businessDocs = { ...state.businessDocs, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Update current director information
    updateCurrentDirector: (state, action) => {
      state.currentDirector = { ...state.currentDirector, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Set current director ID
    setCurrentDirectorId: (state, action) => {
      state.currentDirectorId = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Update director documents
    updateDirectorDocuments: (state, action) => {
      state.directorDocuments = { ...state.directorDocuments, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Add a completed director to the list
    addDirector: (state, action) => {
      state.directors.push(action.payload);
      // Reset current director form
      state.currentDirector = {
        username: '',
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        middleName: '',
        idNumber: '',
        kraPin: '',
        position: 'DIRECTOR',
      };
      state.currentDirectorId = null;
      state.directorDocuments = {
        photoIdFront: null,
        photoIdBack: null,
        kraCertificate: null,
        proofOfAddress: null,
        selfie: null,
      };
      state.lastSaved = new Date().toISOString();
    },
    
    // Update organization status
    setOrganizationStatus: (state, action) => {
      state.organizationStatus = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Update approval status
    updateApprovalStatus: (state, action) => {
      state.approvalStatus = { ...state.approvalStatus, ...action.payload };
      state.lastSaved = new Date().toISOString();
    },
    
    // Set validation errors
    setErrors: (state, action) => {
      state.errors = action.payload;
    },
    
    // Clear specific errors
    clearError: (state, action) => {
      const errorKey = action.payload;
      if (state.errors[errorKey]) {
        delete state.errors[errorKey];
      }
    },
    
    // Clear all errors
    clearAllErrors: (state) => {
      state.errors = {};
    },
    
    // Mark onboarding as complete
    setOnboardingComplete: (state, action) => {
      state.isOnboardingComplete = action.payload;
      state.lastSaved = new Date().toISOString();
    },
    
    // Reset onboarding state (for logout or starting over)
    resetOnboarding: (state) => {
      return { ...initialState };
    },
    
    // Restore from persisted state (useful for syncing with backend)
    restoreOnboardingState: (state, action) => {
      return { ...state, ...action.payload, lastSaved: new Date().toISOString() };
    },
  },
});

export const {
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
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
