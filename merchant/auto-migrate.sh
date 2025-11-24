#!/bin/bash

# Automated Migration Script for MerchantOnboardingNew.js
# Converts useState setters to Redux actions

FILE="src/pages/MerchantOnboardingNew.js"

echo "Starting automatic migration of $FILE..."

# Backup original file
cp "$FILE" "${FILE}.backup"
echo "✓ Backup created: ${FILE}.backup"

# 1. Error handling
sed -i 's/setErrors(/saveErrors(/g' "$FILE"
echo "✓ Replaced setErrors → saveErrors"

# 2. Step navigation (order matters - do larger numbers first)
sed -i 's/setCurrentStep(5)/goToStep(5); markStepComplete(4)/g' "$FILE"
sed -i 's/setCurrentStep(4)/goToStep(4); markStepComplete(3)/g' "$FILE"
sed -i 's/setCurrentStep(3)/goToStep(3); markStepComplete(2)/g' "$FILE"
sed -i 's/setCurrentStep(2)/goToStep(2); markStepComplete(1)/g' "$FILE"
sed -i 's/setCurrentStep(1)/goToStep(1)/g' "$FILE"
echo "✓ Replaced setCurrentStep → goToStep + markStepComplete"

# 3. Owner info
sed -i 's/setOwnerId(/saveOwnerId(/g' "$FILE"
echo "✓ Replaced setOwnerId → saveOwnerId"

# 4. Business info
sed -i 's/setOrganizationId(/saveOrganizationId(/g' "$FILE"
sed -i 's/setBusinessInfo(/saveBusinessInfo(/g' "$FILE"
sed -i 's/setBusinessAddress(/saveBusinessAddress(/g' "$FILE"
sed -i 's/setBusinessDocs(/saveBusinessDocs(/g' "$FILE"
echo "✓ Replaced business info setters"

# 5. Directors
sed -i 's/setDirectorSubStep(/setSubStep(/g' "$FILE"
sed -i 's/setCurrentDirectorId(/saveCurrentDirectorId(/g' "$FILE"
sed -i 's/setCurrentDirector(/saveCurrentDirector(/g' "$FILE"
sed -i 's/setDirectorDocuments(/saveDirectorDocuments(/g' "$FILE"
echo "✓ Replaced director setters"

# 6. Organization status
sed -i 's/setOrganizationStatus(/saveOrganizationStatus(/g' "$FILE"
echo "✓ Replaced setOrganizationStatus → saveOrganizationStatus"

# 7. Fix owner info updates - remove (prev) => pattern
sed -i 's/saveOwnerInfo((prev) => ({ \.\.\.prev,/saveOwnerInfo({/g' "$FILE"
sed -i 's/saveBusinessInfo((prev) => ({ \.\.\.prev,/saveBusinessInfo({/g' "$FILE"
sed -i 's/saveBusinessAddress((prev) => ({ \.\.\.prev,/saveBusinessAddress({/g' "$FILE"
sed -i 's/saveCurrentDirector((prev) => ({ \.\.\.prev,/saveCurrentDirector({/g' "$FILE"
echo "✓ Fixed updater function patterns"

# 8. Fix error clearing - this is more complex, needs manual review
echo ""
echo "⚠️  MANUAL ACTIONS REQUIRED:"
echo "1. Search for: saveErrors((prev) => ({ ...prev,"
echo "   Replace with: removeError('fieldName') for single field clears"
echo ""
echo "2. Search for: setDirectors((prev) => ["
echo "   Replace with: addNewDirector({ ...director })"
echo ""
echo "3. Search for: saveErrors({})"
echo "   Replace with: removeAllErrors()"
echo ""
echo "Migration complete! Review the changes and complete manual steps."
echo "Original file backed up to: ${FILE}.backup"
