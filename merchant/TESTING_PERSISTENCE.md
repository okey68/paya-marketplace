# Redux Persistence Verification

## How to Test

1. **Start the application:**
   ```bash
   npm start
   ```

2. **Open DevTools:**
   - Press F12
   - Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
   - Expand "Local Storage" → `http://localhost:3000`
   - Look for key: `persist:root`

3. **Test Auto-Save:**
   - Navigate to Merchant Onboarding page
   - Fill in owner information (name, email, phone, etc.)
   - **Without clicking submit**, open DevTools → Application → Local Storage
   - Click on `persist:root` key
   - You should see JSON with your data like:
     ```json
     {
       "onboarding": "{\"currentStep\":1,\"ownerInfo\":{\"firstName\":\"John\",\"email\":\"test@example.com\",...}}"
     }
     ```

4. **Test Persistence Across Refresh:**
   - Fill in Step 1 partially (don't submit)
   - Refresh the page (F5 or Ctrl+R)
   - ✅ Your data should still be there!

5. **Test Step Completion:**
   - Complete Step 1 (fill all fields and submit)
   - Check localStorage → `completedSteps` should include `[1]`
   - Navigate to another page
   - Come back → Should resume at Step 2 with Step 1 data intact

6. **Test Restoration on Login:**
   - Fill in onboarding data up to Step 3
   - Log out
   - Log back in
   - Navigate to onboarding → Should resume where you left off

## Redux DevTools (Optional but Recommended)

Install: https://chrome.google.com/webstore/detail/redux-devtools/

**With Redux DevTools you can:**
- See all actions dispatched (saveOwnerInfo, goToStep, etc.)
- Time-travel debug (undo/redo state changes)
- Inspect full state tree in real-time
- Export/import state for testing

## Verification Checklist

- [ ] Data persists when typing (auto-save)
- [ ] Data survives page refresh
- [ ] Step progress is saved
- [ ] Completed steps remain marked
- [ ] Form state restored on navigation return
- [ ] No console errors
- [ ] localStorage updates in real-time

## Common Issues

### Issue: "Nothing is persisting"
**Check:**
1. Is `<Provider>` and `<PersistGate>` in index.js?
2. Open Console → Any errors about "store" or "persistor"?
3. Is localStorage enabled? (Private browsing may disable it)

### Issue: "State resets on refresh"
**Check:**
1. localStorage → Do you see `persist:root` key?
2. If not, check browser console for errors
3. Try clearing localStorage and retry

### Issue: "Old state not loading"
**Solution:**
```javascript
// Clear old data
localStorage.removeItem('persist:root');
// Refresh page
```

## Expected Behavior

✅ **Auto-save:** Every input change saves to Redux → localStorage  
✅ **Instant persistence:** No need to click "Save" button  
✅ **Cross-session:** Data survives browser close/open  
✅ **Step tracking:** Completed steps stay completed  
✅ **Restoration:** Returns to last active step on re-entry
