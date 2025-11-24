#!/usr/bin/env python3
import re

file_path = "src/pages/MerchantOnboardingNew.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Starting Redux migration...")

# 1. Simple replacements first
replacements = [
    # Error handling
    (r'\bsetErrors\(', 'saveErrors('),
    
    # Owner info
    (r'\bsetOwnerId\(', 'saveOwnerId('),
    
    # Business info  
    (r'\bsetOrganizationId\(', 'saveOrganizationId('),
    
    # Directors
    (r'\bsetDirectorSubStep\(', 'setSubStep('),
    (r'\bsetCurrentDirectorId\(', 'saveCurrentDirectorId('),
    
    # Organization status
    (r'\bsetOrganizationStatus\(', 'saveOrganizationStatus('),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)
    
print("✓ Basic replacements done")

# 2. Fix step navigation with completion tracking
step_replacements = [
    (r'\bsetCurrentStep\(5\)', 'goToStep(5); markStepComplete(4)'),
    (r'\bsetCurrentStep\(4\)', 'goToStep(4); markStepComplete(3)'),
    (r'\bsetCurrentStep\(3\)', 'goToStep(3); markStepComplete(2)'),
    (r'\bsetCurrentStep\(2\)', 'goToStep(2); markStepComplete(1)'),
    (r'\bsetCurrentStep\(1\)', 'goToStep(1)'),
]

for pattern, replacement in step_replacements:
    content = re.sub(pattern, replacement, content)
    
print("✓ Step navigation fixed")

# 3. Fix updater patterns for all save functions
# Pattern: saveFunctionName((prev) => ({ ...prev, field: value }))
# Replace with: saveFunctionName({ field: value })

updater_pattern = r'(save\w+)\(\(prev\) => \(\{\s*\.\.\.prev,\s*([^}]+)\}\)\)'
content = re.sub(updater_pattern, r'\1({ \2 })', content)

print("✓ Updater functions fixed")

# 4. Fix error clearing patterns
# saveErrors((prev) => ({ ...prev, fieldName: null })) → removeError('fieldName')
error_clear_pattern = r"saveErrors\(\(prev\) => \(\{ \.\.\.prev, (\w+): null \}\)\)"
content = re.sub(error_clear_pattern, r"removeError('\1')", content)

print("✓ Error clearing patterns fixed")

# 5. Fix clear all errors
content = re.sub(r'saveErrors\(\{\}\)', 'removeAllErrors()', content)

print("✓ Clear all errors fixed")

# 6. Fix directors array updates
# setDirectors((prev) => [...prev, newDirector]) → addNewDirector(newDirector)
# This is complex, so we'll do it manually in specific places

# 7. Fix setBusinessInfo, setBusinessAddress, setCurrentDirector patterns
simple_updaters = [
    (r'setBusinessInfo\(\(prev\) => \(\{ \.\.\.prev,', 'saveBusinessInfo({'),
    (r'setBusinessAddress\(\(prev\) => \(\{ \.\.\.prev,', 'saveBusinessAddress({'),
    (r'setCurrentDirector\(\(prev\) => \(\{ \.\.\.prev,', 'saveCurrentDirector({'),
    (r'setOwnerInfo\(\(prev\) => \(\{ \.\.\.prev,', 'saveOwnerInfo({'),
    (r'setBusinessDocs\(\(prev\) => \(\{ \.\.\.prev,', 'saveBusinessDocs({'),
    (r'setDirectorDocuments\(\(prev\) => \(\{ \.\.\.prev,', 'saveDirectorDocuments({'),
]

for pattern, replacement in simple_updaters:
    content = re.sub(pattern, replacement, content)

print("✓ Simple updater patterns fixed")

# 8. Clean up any double closing parens that might have been created
content = re.sub(r'\}\)\)', '})', content)

print("✓ Cleaned up closing parentheses")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Migration complete!")
print("\nManual fixes still needed:")
print("1. setDirectors array updates (search for 'setDirectors')")
print("2. Verify all onChange handlers work correctly")
