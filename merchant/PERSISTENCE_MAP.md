# 💾 What Gets Saved & When

## 📊 Complete Persistence Map

### localStorage Key
```
persist:root
```

### Full State Structure (What's Saved)
```javascript
{
  onboarding: {
    // ═══════════════════════════════════════════════════════════
    // NAVIGATION STATE
    // ═══════════════════════════════════════════════════════════
    currentStep: 1,              // ✅ Auto-saved on goToStep()
    directorSubStep: 1,          // ✅ Auto-saved on setSubStep()
    completedSteps: [1, 2],      // ✅ Auto-saved on markStepComplete()
    
    // ═══════════════════════════════════════════════════════════
    // STEP 1: OWNER INFORMATION
    // ═══════════════════════════════════════════════════════════
    ownerInfo: {
      username: 'john_doe',      // ✅ Auto-saved on saveOwnerInfo()
      email: 'john@example.com', // ✅ Auto-saved on saveOwnerInfo()
      phone: '254712345678',     // ✅ Auto-saved on saveOwnerInfo()
      firstName: 'John',         // ✅ Auto-saved on saveOwnerInfo()
      lastName: 'Doe',           // ✅ Auto-saved on saveOwnerInfo()
      middleName: 'Michael',     // ✅ Auto-saved on saveOwnerInfo()
      idNumber: '12345678',      // ✅ Auto-saved on saveOwnerInfo()
      kraPin: 'A001234567Z',     // ✅ Auto-saved on saveOwnerInfo()
    },
    ownerId: 'owner-123',        // ✅ Auto-saved on saveOwnerId()
    
    // ═══════════════════════════════════════════════════════════
    // STEP 2: BUSINESS INFORMATION
    // ═══════════════════════════════════════════════════════════
    businessInfo: {
      companyNumber: 'PVT-123',       // ✅ Auto-saved on saveBusinessInfo()
      registrationDate: '2024-01-15', // ✅ Auto-saved on saveBusinessInfo()
      businessName: 'Acme Corp',      // ✅ Auto-saved on saveBusinessInfo()
      phoneCountryCode: '+254',       // ✅ Auto-saved on saveBusinessInfo()
      phoneNumber: '712345678',       // ✅ Auto-saved on saveBusinessInfo()
      businessEmail: 'info@acme.com', // ✅ Auto-saved on saveBusinessInfo()
      taxNumber: 'A123456789X',       // ✅ Auto-saved on saveBusinessInfo()
      tradingName: 'Acme Trading',    // ✅ Auto-saved on saveBusinessInfo()
      industrialClassification: 'Retail', // ✅ Auto-saved on saveBusinessInfo()
      industrialSector: 'Technology', // ✅ Auto-saved on saveBusinessInfo()
      typeOfBusiness: 'Business',     // ✅ Auto-saved on saveBusinessInfo()
      businessType: 'Limited Company',// ✅ Auto-saved on saveBusinessInfo()
    },
    
    businessAddress: {
      addressLine1: '123 Main St',  // ✅ Auto-saved on saveBusinessAddress()
      addressLine2: 'Suite 100',    // ✅ Auto-saved on saveBusinessAddress()
      city: 'Nairobi',              // ✅ Auto-saved on saveBusinessAddress()
      county: 'Nairobi',            // ✅ Auto-saved on saveBusinessAddress()
      postalCode: '00100',          // ✅ Auto-saved on saveBusinessAddress()
      country: 'Kenya',             // ✅ Auto-saved on saveBusinessAddress()
    },
    
    organizationId: 'org-456',    // ✅ Auto-saved on saveOrganizationId()
    
    // ═══════════════════════════════════════════════════════════
    // STEP 3: BUSINESS DOCUMENTS
    // ═══════════════════════════════════════════════════════════
    businessDocs: {
      certificateOfIncorporation: null, // ⚠️ NOT persisted (File object)
      kraPinCertificate: null,          // ⚠️ NOT persisted (File object)
      cr12: null,                       // ⚠️ NOT persisted (File object)
      businessPermit: null,             // ⚠️ NOT persisted (File object)
    },
    
    // ═══════════════════════════════════════════════════════════
    // STEP 4: DIRECTORS
    // ═══════════════════════════════════════════════════════════
    directors: [
      {
        username: 'jane_smith',      // ✅ Auto-saved on addNewDirector()
        email: 'jane@example.com',   // ✅ Auto-saved on addNewDirector()
        phone: '254723456789',       // ✅ Auto-saved on addNewDirector()
        firstName: 'Jane',           // ✅ Auto-saved on addNewDirector()
        lastName: 'Smith',           // ✅ Auto-saved on addNewDirector()
        middleName: 'Elizabeth',     // ✅ Auto-saved on addNewDirector()
        idNumber: '23456789',        // ✅ Auto-saved on addNewDirector()
        kraPin: 'A001234568Z',       // ✅ Auto-saved on addNewDirector()
        position: 'DIRECTOR',        // ✅ Auto-saved on addNewDirector()
        userId: 'dir-789',           // ✅ Auto-saved on addNewDirector()
      }
    ],
    
    currentDirector: {
      username: '',                  // ✅ Auto-saved on saveCurrentDirector()
      email: '',                     // ✅ Auto-saved on saveCurrentDirector()
      phone: '',                     // ✅ Auto-saved on saveCurrentDirector()
      firstName: '',                 // ✅ Auto-saved on saveCurrentDirector()
      lastName: '',                  // ✅ Auto-saved on saveCurrentDirector()
      middleName: '',                // ✅ Auto-saved on saveCurrentDirector()
      idNumber: '',                  // ✅ Auto-saved on saveCurrentDirector()
      kraPin: '',                    // ✅ Auto-saved on saveCurrentDirector()
      position: 'DIRECTOR',          // ✅ Auto-saved on saveCurrentDirector()
    },
    
    currentDirectorId: null,         // ✅ Auto-saved on saveCurrentDirectorId()
    
    directorDocuments: {
      photoIdFront: null,            // ⚠️ NOT persisted (File object)
      photoIdBack: null,             // ⚠️ NOT persisted (File object)
      kraCertificate: null,          // ⚠️ NOT persisted (File object)
      proofOfAddress: null,          // ⚠️ NOT persisted (File object)
      selfie: null,                  // ⚠️ NOT persisted (File object)
    },
    
    // ═══════════════════════════════════════════════════════════
    // STEP 5: STATUS & APPROVAL
    // ═══════════════════════════════════════════════════════════
    organizationStatus: {
      name: 'Acme Corp',             // ✅ Auto-saved on saveOrganizationStatus()
      companyNumber: 'PVT-123',      // ✅ Auto-saved on saveOrganizationStatus()
      status: 'pending',             // ✅ Auto-saved on saveOrganizationStatus()
      // ... full organization object
    },
    
    approvalStatus: {
      payaApproval: 'approved',      // ✅ Auto-saved on saveApprovalStatus()
      bankApproval: 'pending',       // ✅ Auto-saved on saveApprovalStatus()
      walletConnected: false,        // ✅ Auto-saved on saveApprovalStatus()
    },
    
    // ═══════════════════════════════════════════════════════════
    // VALIDATION & META
    // ═══════════════════════════════════════════════════════════
    errors: {},                      // ✅ Auto-saved on saveErrors()
    isOnboardingComplete: false,     // ✅ Auto-saved on markOnboardingComplete()
    lastSaved: '2025-11-24T10:30:00.000Z', // ✅ Auto-saved on every action
  }
}
```

## ⏰ When Does Auto-Save Happen?

### Every Keystroke (Input Changes)
```javascript
// User types in input field
<input onChange={(e) => saveOwnerInfo({ username: e.target.value })} />
// ✅ Saved immediately after each keystroke
```

### After API Calls (IDs)
```javascript
// After successful API response
const response = await api.post('/owners', ownerInfo);
saveOwnerId(response.data.userId);
// ✅ Saved immediately
```

### On Step Navigation
```javascript
// When moving to next step
goToStep(2);
// ✅ Saved immediately
```

### On Step Completion
```javascript
// When marking step complete
markStepComplete(1);
// ✅ Saved immediately
```

### On Error Changes
```javascript
// When validation errors occur
saveErrors({ ownerUsername: 'Required' });
// ✅ Saved immediately

// When errors are cleared
removeError('ownerUsername');
// ✅ Saved immediately
```

## ⚠️ What's NOT Persisted (And Why)

### File Objects
```javascript
businessDocs: {
  certificateOfIncorporation: File, // ❌ Cannot serialize File objects
  kraPinCertificate: File,          // ❌ Cannot serialize File objects
  cr12: File,                       // ❌ Cannot serialize File objects
  businessPermit: File,             // ❌ Cannot serialize File objects
}
```

**Why?** File objects cannot be serialized to JSON/localStorage.

**Solution:** Upload files immediately and save file metadata instead:
```javascript
// Upload file immediately
const response = await uploadFile(file);

// Save file metadata (can be persisted)
saveBusinessDocs({
  certificateOfIncorporation: {
    name: file.name,
    size: file.size,
    url: response.data.url,
    uploadedAt: new Date().toISOString()
  }
});
```

## 📊 Persistence Timeline

### Scenario: User Fills Out Onboarding

```
TIME    | USER ACTION                    | WHAT GETS SAVED
────────|───────────────────────────────|──────────────────────────────────
10:00   | Opens onboarding page         | (Loads from localStorage)
10:01   | Types username: "j"           | ✅ ownerInfo.username = "j"
10:01   | Types username: "jo"          | ✅ ownerInfo.username = "jo"
10:01   | Types username: "john"        | ✅ ownerInfo.username = "john"
10:02   | Types email: "john@ex.com"    | ✅ ownerInfo.email = "john@ex.com"
10:03   | Fills all Step 1 fields       | ✅ All ownerInfo fields saved
10:05   | Clicks "Continue"             | API call starts...
        | → API creates owner           | Backend saves owner
        | → Returns userId: "owner-123" | ✅ ownerId = "owner-123"
        | → Marks step complete         | ✅ completedSteps = [1]
        | → Navigates to Step 2         | ✅ currentStep = 2
10:06   | Starts filling Step 2         | ✅ businessInfo fields saved
10:10   | Gets interrupted, closes tab  | 🚪 Browser closed
        |                               |
10:30   | Returns to site               | 🌅 Redux Persist rehydrates
        | → Opens onboarding page       | ✅ currentStep = 2 (not 1!)
        | → Step 2 loads                | ✅ businessInfo still has data
        | → User continues from Step 2  | ✅ No data lost!
```

## 🔍 localStorage Inspection

### View Your Saved Data

**In Browser Console:**
```javascript
// Get the persisted data
const data = localStorage.getItem('persist:root');
console.log(JSON.parse(data));

// Output:
{
  onboarding: "{\"currentStep\":2,\"ownerInfo\":{\"username\":\"john\"...}",
  _persist: "{\"version\":1,\"rehydrated\":true}"
}

// Parse the onboarding data
const onboardingData = JSON.parse(JSON.parse(data).onboarding);
console.log(onboardingData);

// Output:
{
  currentStep: 2,
  completedSteps: [1],
  ownerInfo: {
    username: 'john',
    email: 'john@example.com',
    // ...
  },
  ownerId: 'owner-123',
  // ...
}
```

## 📈 Data Size in localStorage

### Typical Data Sizes

```
Empty state:          ~500 bytes
After Step 1:         ~1 KB
After Step 2:         ~2 KB
After Step 3:         ~2 KB (files not saved)
After Step 4:         ~3-5 KB (depends on # of directors)
Complete:             ~5-8 KB
```

**localStorage limit:** 5-10 MB (varies by browser)  
**Your usage:** < 10 KB (well within limits ✅)

## 🎯 Save Triggers Summary

| Action | Trigger | What's Saved |
|--------|---------|--------------|
| **Input Change** | User types | Field value |
| **Step Navigation** | User clicks Next/Back | Current step |
| **Step Completion** | API success | Completed steps array |
| **API Response** | Backend returns ID | organizationId, ownerId, etc. |
| **Validation Error** | Form validation fails | errors object |
| **Error Clear** | User fixes field | errors object (error removed) |
| **Director Add** | Director submitted | directors array |
| **Approval Update** | Status changes | approvalStatus |
| **Complete** | All steps done | isOnboardingComplete |

## ✨ Key Benefits

### 1. Zero Data Loss
```
User fills data → Browser crashes → ✅ Data saved
User fills data → Internet drops → ✅ Data saved
User fills data → Power outage → ✅ Data saved*
```
*As long as localStorage.setItem() completed (usually < 1ms)

### 2. Resume Exactly Where You Left Off
```
Complete Step 1 → Close browser → Reopen → ✅ Shows Step 2
Fill half of Step 2 → Close browser → Reopen → ✅ Half-filled data still there
```

### 3. No Manual Save Needed
```
❌ OLD: User must click "Save Draft" button
✅ NEW: Every keystroke automatically saved
```

### 4. Cross-Session Persistence
```
Monday: Start onboarding
Tuesday: Continue onboarding
Wednesday: Complete onboarding
✅ All data persists across days
```

## 🔒 Security Considerations

### Data Stored in localStorage
- ✅ Non-sensitive form data (names, emails, phone numbers)
- ✅ Progress tracking (current step, completed steps)
- ✅ IDs (organizationId, ownerId)
- ❌ NO passwords stored
- ❌ NO payment information stored
- ❌ NO authentication tokens stored

### Clearing Data
```javascript
// On logout (optional - decide if you want to keep draft)
const handleLogout = () => {
  // Option A: Clear onboarding data
  resetAllOnboarding();
  
  // Option B: Keep data for when user logs back in
  // (do nothing)
};
```

## 📊 Redux DevTools View

```
State:
  onboarding:
    currentStep: 2
    completedSteps: [1]
    ownerInfo:
      username: "john_doe"
      email: "john@example.com"
      ✅ All field values visible
    ownerId: "owner-123"
    ✅ Real-time state inspection

Actions:
  → updateOwnerInfo { username: "john_doe" }
  → setOwnerId "owner-123"
  → completeStep 1
  → setCurrentStep 2
  ✅ Complete action history
```

---

**Everything is automatically saved. You don't need to think about persistence - it just works!** ✨
