# Redux Persist Onboarding Setup

This implementation provides a robust, production-ready onboarding flow with Redux Toolkit and Redux Persist.

## 📦 Installation

Install the required dependencies:

```bash
npm install @reduxjs/toolkit react-redux redux-persist
```

## 🏗️ Architecture

### File Structure

```
src/
├── store/
│   ├── store.js                    # Redux store with persist configuration
│   └── slices/
│       └── onboardingSlice.js      # Onboarding state management
├── hooks/
│   └── useOnboarding.js            # Custom hook for onboarding
├── pages/
│   ├── MerchantOnboardingRedux.js  # Example component implementation
│   └── MerchantOnboardingNew.js    # Your existing component
└── index.js                         # App entry point with Provider
```

## 🚀 Quick Start

### 1. Update your `index.js` or `App.js`

Wrap your app with Redux Provider and PersistGate:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import App from './App';

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
```

### 2. Use the hook in your component

```javascript
import { useOnboarding } from '../hooks/useOnboarding';

const YourComponent = () => {
  const {
    currentStep,
    ownerInfo,
    saveOwnerInfo,
    goToStep,
    markStepComplete,
  } = useOnboarding();

  // Auto-save on input change
  const handleInputChange = (field, value) => {
    saveOwnerInfo({ [field]: value });
  };

  // Submit and advance
  const handleSubmit = async () => {
    // API call here
    await api.post('/endpoint', ownerInfo);
    
    // Mark step complete and advance
    markStepComplete(1);
    goToStep(2);
  };

  return (
    <div>
      <input
        value={ownerInfo.username}
        onChange={(e) => handleInputChange('username', e.target.value)}
      />
      <button onClick={handleSubmit}>Continue</button>
    </div>
  );
};
```

## ✨ Key Features

### 1. **Automatic Persistence**
- All state changes are automatically saved to localStorage
- Data survives page refreshes and browser restarts
- No manual `localStorage.setItem()` calls needed

### 2. **Partial Data Saving**
```javascript
// User types in a field - data is automatically persisted
saveOwnerInfo({ username: 'john_doe' });

// User closes browser and returns later
// Data is still there: ownerInfo.username === 'john_doe'
```

### 3. **Step Completion Tracking**
```javascript
// Mark step as complete after successful API call
markStepComplete(1);

// Check if step is completed
if (isStepCompleted(1)) {
  // User can access step 2
}

// Get the appropriate step to show on load
const initialStep = getInitialStep();
```

### 4. **Smart State Restoration**
```javascript
useEffect(() => {
  if (!authLoading && user) {
    // Check backend completion status
    const hasCompletedOnboarding = user.businessInfo?.businessName;

    if (hasCompletedOnboarding) {
      markOnboardingComplete(true);
    }
    
    // Restore to appropriate step
    const initialStep = getInitialStep();
    goToStep(initialStep);
  }
}, [authLoading, user]);
```

## 📚 API Reference

### State Properties

| Property | Type | Description |
|----------|------|-------------|
| `currentStep` | number | Current onboarding step (1-5) |
| `directorSubStep` | number | Director sub-step (1-3) |
| `completedSteps` | array | Array of completed step numbers |
| `ownerInfo` | object | Owner information data |
| `ownerId` | string | Created owner ID |
| `businessInfo` | object | Business information data |
| `businessAddress` | object | Business address data |
| `organizationId` | string | Created organization ID |
| `businessDocs` | object | Business documents |
| `directors` | array | List of added directors |
| `currentDirector` | object | Current director being added |
| `errors` | object | Validation errors |
| `isOnboardingComplete` | boolean | Completion status |
| `lastSaved` | string | ISO timestamp of last save |

### Actions

#### Navigation
```javascript
goToStep(stepNumber)        // Navigate to specific step
setSubStep(subStepNumber)   // Set director sub-step
markStepComplete(step)      // Mark step as completed
```

#### Data Management
```javascript
// Owner
saveOwnerInfo(data)         // Update owner info (partial or full)
saveOwnerId(id)             // Set owner ID

// Business
saveBusinessInfo(data)      // Update business info
saveBusinessAddress(data)   // Update business address
saveOrganizationId(id)      // Set organization ID

// Documents
saveBusinessDocs(docs)      // Update business documents

// Directors
saveCurrentDirector(data)   // Update current director
saveCurrentDirectorId(id)   // Set current director ID
saveDirectorDocuments(docs) // Update director documents
addNewDirector(director)    // Add completed director to list

// Status
saveOrganizationStatus(status)  // Update organization status
saveApprovalStatus(status)      // Update approval status
```

#### Error Handling
```javascript
saveErrors(errorObject)     // Set validation errors
removeError(errorKey)       // Remove specific error
removeAllErrors()           // Clear all errors
```

#### Utilities
```javascript
isStepCompleted(step)       // Check if step is completed
getInitialStep()            // Get step to show on load
canProceedToStep(step)      // Check if user can access step
getProgressPercentage()     // Get completion percentage
markOnboardingComplete(bool)// Mark onboarding complete
resetAllOnboarding()        // Reset to initial state
```

## 🎯 Usage Patterns

### Pattern 1: Auto-save on Input Change
```javascript
const handleChange = (field, value) => {
  // Automatically saved to Redux Persist
  saveOwnerInfo({ [field]: value });
  
  // Clear validation error
  if (errors[field]) {
    removeError(field);
  }
};

<input
  value={ownerInfo.username}
  onChange={(e) => handleChange('username', e.target.value)}
/>
```

### Pattern 2: Submit and Advance
```javascript
const handleSubmit = async () => {
  // Validate
  const errors = validateStep1();
  if (errors) {
    saveErrors(errors);
    return;
  }

  setLoading(true);
  try {
    // API call
    const response = await api.post('/owners', ownerInfo);
    
    // Save ID
    saveOwnerId(response.data.userId);
    
    // Mark complete and advance
    markStepComplete(1);
    goToStep(2);
    
    toast.success('Step completed!');
  } catch (error) {
    toast.error('Failed to save');
  } finally {
    setLoading(false);
  }
};
```

### Pattern 3: Restore on Mount
```javascript
useEffect(() => {
  if (!authLoading && user) {
    // Check backend status
    const isComplete = user.businessInfo?.isComplete;
    
    if (isComplete) {
      markOnboardingComplete(true);
    }
    
    // Restore appropriate step
    const step = getInitialStep();
    goToStep(step);
  }
}, [authLoading, user, getInitialStep, goToStep, markOnboardingComplete]);
```

### Pattern 4: Conditional Navigation
```javascript
const handleNext = () => {
  const nextStep = currentStep + 1;
  
  // Check if user can proceed
  if (canProceedToStep(nextStep)) {
    goToStep(nextStep);
  } else {
    toast.error('Please complete previous steps first');
  }
};
```

## 🔒 Data Persistence

### What Gets Persisted?
- ✅ All form data (owner info, business info, addresses)
- ✅ Step progress and completion status
- ✅ Director information and list
- ✅ Organization IDs and references
- ⚠️ Files are stored in memory (not serialized to localStorage)

### Storage Key
Data is stored in localStorage under the key: `persist:root`

### Clear Persisted Data
```javascript
// Programmatically
resetAllOnboarding();

// Manually
localStorage.removeItem('persist:root');
```

## 🧪 Testing

### Test Persistence
1. Fill in Step 1 data
2. Close browser tab
3. Reopen application
4. ✅ Data should still be there

### Test Step Completion
1. Complete Step 1 (submit successfully)
2. Refresh page
3. ✅ Should automatically show Step 2

### Test Logout/Login
1. Fill in partial data
2. Logout
3. Login again
4. Navigate to onboarding
5. ✅ Partial data should be restored

## 🚨 Important Notes

### File Uploads
Files cannot be serialized to localStorage. They're stored in memory and cleared on refresh. To persist file uploads:

```javascript
// Option 1: Upload immediately
const handleFileChange = async (docType, file) => {
  // Upload to server
  const response = await api.upload(file);
  
  // Save file reference (URL or ID)
  saveBusinessDocs({ 
    [docType]: { 
      name: file.name, 
      url: response.data.url 
    } 
  });
};

// Option 2: Store in IndexedDB (for larger files)
// Use a library like idb-keyval
```

### Logout Behavior
Decide when to clear onboarding data:

```javascript
// Option A: Clear on logout
const handleLogout = () => {
  resetAllOnboarding();
  // ... other logout logic
};

// Option B: Keep data for re-login
const handleLogout = () => {
  // Don't clear - data persists for next login
};
```

## 📖 Migration Guide

To migrate your existing `MerchantOnboardingNew.js`:

1. **Replace useState with Redux actions**
```javascript
// Before
const [ownerInfo, setOwnerInfo] = useState({...});

// After
const { ownerInfo, saveOwnerInfo } = useOnboarding();
```

2. **Update onChange handlers**
```javascript
// Before
onChange={(e) => setOwnerInfo({...ownerInfo, username: e.target.value})}

// After
onChange={(e) => saveOwnerInfo({ username: e.target.value })}
```

3. **Update step navigation**
```javascript
// Before
setCurrentStep(2);

// After
markStepComplete(1);
goToStep(2);
```

4. **Remove localStorage calls**
```javascript
// Before
localStorage.setItem('merchantOnboardingStep', '2');

// After - not needed, Redux Persist handles it
```

## 🎨 Best Practices

1. **Always mark steps complete**: `markStepComplete(step)` after successful API calls
2. **Use partial updates**: `saveOwnerInfo({ username: 'new' })` instead of replacing entire object
3. **Clear errors on change**: Remove validation errors when user modifies field
4. **Validate before submit**: Check all required fields before API calls
5. **Handle loading states**: Disable buttons during async operations
6. **Provide feedback**: Use toast notifications for success/error

## 🔧 Troubleshooting

### Data not persisting?
- Check Redux DevTools to verify state updates
- Verify PersistGate is wrapping your app
- Check browser localStorage (key: `persist:root`)

### State not updating?
- Ensure you're using actions from `useOnboarding` hook
- Check that actions are dispatched (Redux DevTools)
- Verify component is inside Redux Provider

### Step not restoring on reload?
- Check `getInitialStep()` logic
- Verify `completedSteps` array is populated
- Ensure `useEffect` restoration logic runs

## 📄 License

This implementation follows Redux Toolkit and React best practices for production use.
