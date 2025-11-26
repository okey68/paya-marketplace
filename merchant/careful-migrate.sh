#!/bin/bash

FILE="src/pages/MerchantOnboardingNew.js"

echo "Starting careful Redux migration..."

# Step 1: Replace all setter function names (simple replacements)
sed -i 's/\bsetErrors(/saveErrors(/g' "$FILE"
sed -i 's/\bsetOwnerId(/saveOwnerId(/g' "$FILE"
sed -i 's/\bsetOrganizationId(/saveOrganizationId(/g' "$FILE"
sed -i 's/\bsetBusinessInfo(/saveBusinessInfo(/g' "$FILE"
sed -i 's/\bsetBusinessAddress(/saveBusinessAddress(/g' "$FILE"
sed -i 's/\bsetBusinessDocs(/saveBusinessDocs(/g' "$FILE"
sed -i 's/\bsetDirectorSubStep(/setSubStep(/g' "$FILE"
sed -i 's/\bsetCurrentDirectorId(/saveCurrentDirectorId(/g' "$FILE"
sed -i 's/\bsetCurrentDirector(/saveCurrentDirector(/g' "$FILE"
sed -i 's/\bsetDirectorDocuments(/saveDirectorDocuments(/g' "$FILE"
sed -i 's/\bsetOwnerInfo(/saveOwnerInfo(/g' "$FILE"
sed -i 's/\bsetOrganizationStatus(/saveOrganizationStatus(/g' "$FILE"

echo "✓ Function names replaced"

# Step 2: Fix step navigation
sed -i 's/setCurrentStep(5)/goToStep(5); markStepComplete(4)/g' "$FILE"
sed -i 's/setCurrentStep(4)/goToStep(4); markStepComplete(3)/g' "$FILE"
sed -i 's/setCurrentStep(3)/goToStep(3); markStepComplete(2)/g' "$FILE"
sed -i 's/setCurrentStep(2)/goToStep(2); markStepComplete(1)/g' "$FILE"
sed -i 's/setCurrentStep(1)/goToStep(1)/g' "$FILE"

echo "✓ Step navigation fixed"

# Step 3: Now fix the updater patterns - remove (prev) => ({ ...prev,
# This needs to be done carefully to preserve the field updates
sed -i 's/saveBusinessInfo((prev) => ({ \.\.\.prev,/saveBusinessInfo({/g' "$FILE"
sed -i 's/saveBusinessAddress((prev) => ({ \.\.\.prev,/saveBusinessAddress({/g' "$FILE"
sed -i 's/saveOwnerInfo((prev) => ({ \.\.\.prev,/saveOwnerInfo({/g' "$FILE"
sed -i 's/saveCurrentDirector((prev) => ({ \.\.\.prev,/saveCurrentDirector({/g' "$FILE"
sed -i 's/saveBusinessDocs((prev) => ({ \.\.\.prev,/saveBusinessDocs({/g' "$FILE"
sed -i 's/saveDirectorDocuments((prev) => ({ \.\.\.prev,/saveDirectorDocuments({/g' "$FILE"
sed -i 's/saveErrors((prev) => ({ \.\.\.prev,/saveErrors({/g' "$FILE"

echo "✓ Updater patterns fixed"

# Step 4: Fix closing parentheses - remove the extra ))
sed -i 's/}));$/});/g' "$FILE"

echo "✓ Closing parentheses fixed"

# Step 5: Fix error clearing
sed -i 's/saveErrors({})/removeAllErrors()/g' "$FILE"

echo "✓ Error clearing fixed"

echo ""
echo "✅ Migration complete!"
echo ""
echo "Remaining manual fixes:"
echo "1. Search for 'setDirectors((prev)' and replace with addNewDirector"
echo "2. Search for any 'saveErrors({ field: null' and replace with removeError('field')"
