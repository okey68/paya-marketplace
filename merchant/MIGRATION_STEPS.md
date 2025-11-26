# FIND AND REPLACE GUIDE

**Run these find/replace operations in your editor (Ctrl+H in VS Code):**

## 1. Error handling
Find: `setErrors(`
Replace with: `saveErrors(`

Find: `setErrors((prev) => ({ ...prev,`
Replace with: `// Remove this pattern - use removeError instead`

## 2. Step navigation
Find: `setCurrentStep(1)`
Replace with: `goToStep(1)`

Find: `setCurrentStep(2)`
Replace with: `goToStep(2); markStepComplete(1)`

Find: `setCurrentStep(3)`
Replace with: `goToStep(3); markStepComplete(2)`

Find: `setCurrentStep(4)`
Replace with: `goToStep(4); markStepComplete(3)`

Find: `setCurrentStep(5)`
Replace with: `goToStep(5); markStepComplete(4)`

## 3. Owner info
Find: `setOwnerId(`
Replace with: `saveOwnerId(`

Find: `setOwnerInfo((prev) => ({ ...prev,`
Replace with: `saveOwnerInfo({`

## 4. Business info
Find: `setOrganizationId(`
Replace with: `saveOrganizationId(`

Find: `setBusinessInfo((prev) => ({`
Replace with: `saveBusinessInfo({`

Find: `setBusinessAddress((prev) => ({`
Replace with: `saveBusinessAddress({`

Find: `setBusinessDocs((prev) => ({ ...prev,`
Replace with: `saveBusinessDocs({`

## 5. Directors
Find: `setDirectorSubStep(`
Replace with: `setSubStep(`

Find: `setCurrentDirectorId(`
Replace with: `saveCurrentDirectorId(`

Find: `setCurrentDirector((prev) => ({`
Replace with: `saveCurrentDirector({`

Find: `setDirectorDocuments((prev) => ({`
Replace with: `saveDirectorDocuments({`

Find: `setDirectors((prev) => [`
Replace with: `// Use addNewDirector() instead of setDirectors`

## 6. Organization status
Find: `setOrganizationStatus(`
Replace with: `saveOrganizationStatus(`

## MANUAL CHANGES NEEDED

### In input handlers, change from:
```javascript
onChange={(e) => {
  setOwnerInfo((prev) => ({ ...prev, username: e.target.value }));
  if (errors.ownerUsername) {
    setErrors((prev) => ({ ...prev, ownerUsername: null }));
  }
}}
```

### To:
```javascript
onChange={(e) => {
  saveOwnerInfo({ username: e.target.value });
  if (errors.ownerUsername) {
    removeError('ownerUsername');
  }
}}
```

### For directors, change from:
```javascript
setDirectors((prev) => [
  ...prev,
  {
    ...currentDirector,
    userId: currentDirectorId,
  },
]);
```

### To:
```javascript
addNewDirector({
  ...currentDirector,
  userId: currentDirectorId,
});
```

### For error clearing in onChange:
```javascript
// OLD:
if (errors.fieldName) {
  setErrors((prev) => ({ ...prev, fieldName: null }));
}

// NEW:
if (errors.fieldName) {
  removeError('fieldName');
}
```

### For clearing all errors:
```javascript
// OLD:
setErrors({});

// NEW:
removeAllErrors();
```
