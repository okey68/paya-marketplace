#!/bin/bash

FILE="src/pages/MerchantOnboardingNew.js"

echo "Fixing updater function patterns in $FILE..."

# Fix all patterns: saveXxx((prev) => ({ ...prev, field: value })) → saveXxx({ field: value })

# The pattern is complex, so we'll use perl for better regex support
perl -i -pe 's/save(\w+)\(\(prev\) => \(\{ \.\.\.prev,/save$1\({/g' "$FILE"

# Also remove any lingering })) patterns at the end of these calls
perl -i -pe 's/\}\)\)/\}/g' "$FILE"

# Fix the specific error removal pattern
perl -i -pe 's/saveErrors\(\(prev\) => \(\{ \.\.\.prev, (\w+): null \}\)\)/removeError('"'"'$1'"'"')/g' "$FILE"

echo "✓ Fixed all updater function patterns"
echo "Done!"
