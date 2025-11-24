# 🚀 Quick Start Guide - Redux Persist Onboarding

## ⚡ 30-Second Setup

### 1. Dependencies (Already Installed ✅)
```bash
# Already in your package.json:
# @reduxjs/toolkit: ^2.10.1
# react-redux: ^9.2.0  
# redux-persist: ^6.0.0
```

### 2. Update `src/index.js`

Replace your current index.js with:

```javascript
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
```

### 3. Use in Your Component

```javascript
import { useOnboarding } from '../hooks/useOnboarding';

const MerchantOnboardingNew = () => {
  // Get state and actions
  const {
    currentStep,
    ownerInfo,
    saveOwnerInfo,
    goToStep,
    markStepComplete,
  } = useOnboarding();

  // Auto-save on input change
  const handleChange = (field, value) => {
    saveOwnerInfo({ [field]: value });
  };

  // Submit step
  const handleSubmit = async () => {
    const response = await api.post('/owners', ownerInfo);
    saveOwnerId(response.data.userId);
    markStepComplete(1);
    goToStep(2);
  };

  return (
    <input
      value={ownerInfo.username}
      onChange={(e) => handleChange('username', e.target.value)}
    />
  );
};
```

## ✨ What You Get

✅ **Auto-save**: Data persists on every keystroke  
✅ **Step tracking**: Automatically returns to correct step  
✅ **Cross-session**: Survives browser close/reopen  
✅ **No localStorage code**: All handled automatically  

## 🧪 Test It

1. Fill in Step 1 data
2. **Close browser completely**
3. Reopen and navigate to onboarding
4. ✨ **All your data is still there!**

## 📁 Files Created

```
src/
├── store/
│   ├── store.js                     ✅ Redux store with persist
│   └── slices/
│       └── onboardingSlice.js       ✅ State management
├── hooks/
│   └── useOnboarding.js             ✅ Easy-to-use hook
└── pages/
    └── MerchantOnboardingRedux.js   ✅ Example component
```

## 📚 Full Documentation

- `REDUX_ONBOARDING_GUIDE.md` - Complete API reference
- `INTEGRATION_EXAMPLE.js` - Step-by-step migration guide
- `MerchantOnboardingRedux.js` - Working example component

## 🎯 Next Steps

1. **Option A**: Use the example component (`MerchantOnboardingRedux.js`) as-is
2. **Option B**: Migrate your existing component using `INTEGRATION_EXAMPLE.js`
3. **Option C**: Build from scratch using the patterns in the guide

## 🆘 Need Help?

Check `REDUX_ONBOARDING_GUIDE.md` for:
- Complete API reference
- Usage patterns
- Troubleshooting
- Best practices

---

**That's it!** You now have production-ready onboarding with automatic persistence. 🎉
