import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import "./MerchantOnboarding.css";

const MerchantOnboardingNew = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const hasFetchedData = useRef(false);

  const countryCodes = [
    { code: "+254", flag: "🇰🇪", name: "Kenya" },
    { code: "+1", flag: "🇺🇸", name: "USA" },
    { code: "+27", flag: "🇿🇦", name: "South Africa" },
    { code: "+255", flag: "🇹🇿", name: "Tanzania" },
  ];

  // Step 1: Owner Information State
  const [ownerInfo, setOwnerInfo] = useState({
    username: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    middleName: "",
    idNumber: "",
    kraPin: "",
  });
  const [ownerId, setOwnerId] = useState(null);

  // Step 2: Organization Information State
  const [businessInfo, setBusinessInfo] = useState({
    companyNumber: "",
    registrationDate: "",
    businessName: "",
    phoneCountryCode: "+254",
    phoneNumber: "",
    businessEmail: "",
    taxNumber: "",
    tradingName: "",
    industrialClassification: "",
    industrialSector: "",
    typeOfBusiness: "",
    businessType: "",
  });
  const [organizationId, setOrganizationId] = useState(null);

  // Step 2: Business Address State (part of organization creation)
  const [businessAddress, setBusinessAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    postalCode: "",
    country: "Kenya",
  });

  // Step 3: Business Documents State
  const [businessDocs, setBusinessDocs] = useState({
    certificateOfIncorporation: null,
    kraPinCertificate: null,
    cr12: null,
    businessPermit: null,
  });

  // Step 4: Directors State (with sub-steps)
  const [directors, setDirectors] = useState([]);
  const [currentDirector, setCurrentDirector] = useState({
    username: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    middleName: "",
    idNumber: "",
    kraPin: "",
    position: "DIRECTOR",
  });
  const [currentDirectorId, setCurrentDirectorId] = useState(null);
  const [directorDocuments, setDirectorDocuments] = useState({
    photoIdFront: null,
    photoIdBack: null,
    kraCertificate: null,
    proofOfAddress: null,
    selfie: null,
  });
  const [directorSubStep, setDirectorSubStep] = useState(1); // 1: director info, 2: director documents

  // Step 5: Organization Status State
  const [organizationStatus, setOrganizationStatus] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState({
    payaApproval: "pending",
    bankApproval: "pending",
    walletConnected: false,
  });

  // Validation errors state
  const [errors, setErrors] = useState({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch fresh user data from backend
  const fetchUserData = async () => {
    try {
      const response = await api.get("/users/profile");
      // API returns { user: {...} }
      const userData = response.data.user || response.data;

      console.log("Fetched user data:", userData);
      console.log("Business info:", userData.businessInfo);

      // Update user context with fresh data
      updateUser(userData);

      // Update approval status from fresh data
      if (userData.businessInfo) {
        const newStatus = {
          payaApproval:
            userData.businessInfo?.payaApproval?.status ||
            userData.businessInfo?.approvalStatus ||
            "pending",
          bankApproval:
            userData.businessInfo?.bankApproval?.status || "pending",
          walletConnected: userData.businessInfo?.walletConnected || false,
        };
        console.log("Setting approval status:", newStatus);
        setApprovalStatus(newStatus);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  // Fetch organization status from external API
  const fetchOrganizationStatus = async (organizationId) => {
    try {
      const response = await api.get(
        `/v1/external/organizations/${organizationId}`
      );
      const orgData = response.data;

      console.log("Fetched organization data:", orgData);

      // Set the organization status for rendering
      setOrganizationStatus(orgData);

      // Update approval status based on organization data
      // You can customize this based on your backend's approval logic
      const newStatus = {
        payaApproval: orgData.status || "pending",
        bankApproval: orgData.bankApproval?.status || "pending",
        walletConnected: orgData.walletConnected || false,
      };

      setApprovalStatus(newStatus);
      return orgData;
    } catch (error) {
      console.error("Failed to fetch organization status:", error);
      // Fallback to user profile if external API fails
      await fetchUserData();
    }
  };

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    if (!authLoading && !token) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [authLoading, navigate]);

  // Restore step when user is loaded (only once)
  useEffect(() => {
    if (!authLoading && user && !hasFetchedData.current) {
      hasFetchedData.current = true;

      // Check if they've actually completed the onboarding
      const hasCompletedOnboarding =
        user.businessInfo?.businessName &&
        user.businessInfo?.companyNumber &&
        user.businessInfo?.directors?.length > 0;

      if (hasCompletedOnboarding) {
        // They've completed onboarding, restore their saved step or go to step 5
        const savedStep = localStorage.getItem("merchantOnboardingStep");
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (step >= 1 && step <= 5) {
            setCurrentStep(step);
          }
        } else {
          // No saved step, go to review
          setCurrentStep(5);
          localStorage.setItem("merchantOnboardingStep", "5");
        }
      } else {
        // New merchant - start at step 1 and clear any old localStorage
        localStorage.removeItem("merchantOnboardingStep");
        setCurrentStep(1);
      }
    }
  }, [authLoading, user]);

  // Fetch fresh data whenever we're on step 5
  useEffect(() => {
    if (!authLoading && user && currentStep === 5) {
      console.log("Fetching data for step 5");

      // Try to get organization ID from user data
      const organizationId =
        user.businessInfo?.organizationId ||
        localStorage.getItem("merchantOrganizationId");

      if (organizationId) {
        // Fetch from external API if we have organization ID
        fetchOrganizationStatus(organizationId);
      } else {
        // Fallback to user profile endpoint
        fetchUserData();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, authLoading, user]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    if (currentStep >= 1 && currentStep <= 5) {
      localStorage.setItem("merchantOnboardingStep", currentStep.toString());
    }
  }, [currentStep]);

  const handleBusinessDocChange = (docType, file) => {
    setBusinessDocs((prev) => ({ ...prev, [docType]: file }));
    // Clear error when file is selected
    if (file) {
      setErrors((prev) => ({ ...prev, [docType]: null }));
    }
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // Accept phone with or without country code
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateKraPin = (pin) => {
    // KRA PIN format: A001234567Z
    const kraRegex = /^[A-Z][0-9]{9}[A-Z]$/;
    return kraRegex.test(pin);
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!ownerInfo.username || ownerInfo.username.trim() === '') {
      newErrors.ownerUsername = 'Username is required';
    }
    
    if (!ownerInfo.email || ownerInfo.email.trim() === '') {
      newErrors.ownerEmail = 'Email is required';
    } else if (!validateEmail(ownerInfo.email)) {
      newErrors.ownerEmail = 'Please enter a valid email address';
    }
    
    if (!ownerInfo.phone || ownerInfo.phone.trim() === '') {
      newErrors.ownerPhone = 'Phone number is required';
    } else if (!validatePhone(ownerInfo.phone)) {
      newErrors.ownerPhone = 'Please enter a valid phone number';
    }
    
    if (!ownerInfo.firstName || ownerInfo.firstName.trim() === '') {
      newErrors.ownerFirstName = 'First name is required';
    }
    
    if (!ownerInfo.lastName || ownerInfo.lastName.trim() === '') {
      newErrors.ownerLastName = 'Last name is required';
    }
    
    if (!ownerInfo.idNumber || ownerInfo.idNumber.trim() === '') {
      newErrors.ownerIdNumber = 'ID number is required';
    }
    
    if (!ownerInfo.kraPin || ownerInfo.kraPin.trim() === '') {
      newErrors.ownerKraPin = 'KRA PIN is required';
    } else if (!validateKraPin(ownerInfo.kraPin)) {
      newErrors.ownerKraPin = 'Invalid KRA PIN format (e.g., A001234567Z)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!businessInfo.companyNumber || businessInfo.companyNumber.trim() === '') {
      newErrors.companyNumber = 'Company number is required';
    }
    
    if (!businessInfo.registrationDate) {
      newErrors.registrationDate = 'Registration date is required';
    }
    
    if (!businessInfo.businessName || businessInfo.businessName.trim() === '') {
      newErrors.businessName = 'Business name is required';
    }
    
    if (!businessInfo.phoneNumber || businessInfo.phoneNumber.trim() === '') {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (businessInfo.phoneNumber.length < 9) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!businessInfo.businessEmail || businessInfo.businessEmail.trim() === '') {
      newErrors.businessEmail = 'Business email is required';
    } else if (!validateEmail(businessInfo.businessEmail)) {
      newErrors.businessEmail = 'Please enter a valid email address';
    }
    
    if (!businessInfo.taxNumber || businessInfo.taxNumber.trim() === '') {
      newErrors.taxNumber = 'Tax number is required';
    } else if (!validateKraPin(businessInfo.taxNumber)) {
      newErrors.taxNumber = 'Invalid KRA PIN format (e.g., A001234567Z)';
    }
    
    if (!businessInfo.typeOfBusiness || businessInfo.typeOfBusiness === '') {
      newErrors.typeOfBusiness = 'Type of business is required';
    }
    
    if (!businessInfo.businessType || businessInfo.businessType === '') {
      newErrors.businessType = 'Business type is required';
    }
    
    // Address validation
    if (!businessAddress.addressLine1 || businessAddress.addressLine1.trim() === '') {
      newErrors.addressLine1 = 'Address line 1 is required';
    }
    
    if (!businessAddress.city || businessAddress.city.trim() === '') {
      newErrors.city = 'City is required';
    }
    
    if (!businessAddress.county || businessAddress.county.trim() === '') {
      newErrors.county = 'County/State is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!businessDocs.certificateOfIncorporation) {
      newErrors.certificateOfIncorporation = 'Certificate of Incorporation is required';
    }
    
    if (!businessDocs.kraPinCertificate) {
      newErrors.kraPinCertificate = 'KRA PIN Certificate is required';
    }
    
    if (!businessDocs.cr12) {
      newErrors.cr12 = 'CR-12 document is required';
    }
    
    if (!businessDocs.businessPermit) {
      newErrors.businessPermit = 'Business Permit is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4SubStep1 = () => {
    const newErrors = {};
    
    if (!currentDirector.username || currentDirector.username.trim() === '') {
      newErrors.directorUsername = 'Username is required';
    }
    
    if (!currentDirector.email || currentDirector.email.trim() === '') {
      newErrors.directorEmail = 'Email is required';
    } else if (!validateEmail(currentDirector.email)) {
      newErrors.directorEmail = 'Please enter a valid email address';
    }
    
    if (!currentDirector.phone || currentDirector.phone.trim() === '') {
      newErrors.directorPhone = 'Phone number is required';
    } else if (!validatePhone(currentDirector.phone)) {
      newErrors.directorPhone = 'Please enter a valid phone number';
    }
    
    if (!currentDirector.firstName || currentDirector.firstName.trim() === '') {
      newErrors.directorFirstName = 'First name is required';
    }
    
    if (!currentDirector.lastName || currentDirector.lastName.trim() === '') {
      newErrors.directorLastName = 'Last name is required';
    }
    
    if (!currentDirector.idNumber || currentDirector.idNumber.trim() === '') {
      newErrors.directorIdNumber = 'ID number is required';
    }
    
    if (!currentDirector.kraPin || currentDirector.kraPin.trim() === '') {
      newErrors.directorKraPin = 'KRA PIN is required';
    } else if (!validateKraPin(currentDirector.kraPin)) {
      newErrors.directorKraPin = 'Invalid KRA PIN format (e.g., A001234567Z)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4SubStep2 = () => {
    const newErrors = {};
    
    if (!directorDocuments.photoIdFront) {
      newErrors.photoIdFront = 'National ID (Front) is required';
    }
    
    if (!directorDocuments.photoIdBack) {
      newErrors.photoIdBack = 'National ID (Back) is required';
    }
    
    if (!directorDocuments.selfie) {
      newErrors.selfie = 'Facial Photo/Selfie is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Map UI document types to API document types
  const mapBusinessDocType = (uiType) => {
    const mapping = {
      certificateOfIncorporation: "CERT_OF_INCORP",
      kraPinCertificate: "TAX",
      cr12: "BUSINESS_CERTIFICATE",
      businessPermit: "BUSINESS_LICENSE",
    };
    return mapping[uiType] || uiType;
  };

  const mapDirectorDocType = (uiType) => {
    const mapping = {
      photoIdFront: "NATIONAL_IDENTITY",
      photoIdBack: "BACK_OF_NATIONAL_IDENTITY",
      kraCertificate: "TAX",
      proofOfAddress: "PROOF_OF_ADDRESS",
      selfie: "FACIAL_PHOTO",
    };
    return mapping[uiType] || uiType;
  };

  // Upload organization document
  const uploadOrganizationDocument = async (
    organizationId,
    file,
    documentType
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", mapBusinessDocType(documentType));

    try {
      const response = await api.post(
        `/v1/external/organizations/${organizationId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Organization document upload error:", error);
      throw error;
    }
  };

  // Upload director document
  const uploadDirectorDocument = async (
    organizationId,
    directorId,
    file,
    documentType
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", mapDirectorDocType(documentType));

    try {
      const response = await api.post(
        `/v1/external/organizations/${organizationId}/directors/${directorId}/documents`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Director document upload error:", error);
      throw error;
    }
  };

  const handleStepSubmit = async () => {
    // Clear previous errors
    setErrors({});
    
    // Step-specific validation
    if (currentStep === 1) {
      if (!validateStep1()) {
        toast.error("Please fill in all required fields correctly");
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!validateStep2()) {
        toast.error("Please fill in all required fields correctly");
        return;
      }
    }
    
    if (currentStep === 3) {
      if (!validateStep3()) {
        toast.error("Please upload all required documents");
        return;
      }
    }
    
    if (currentStep === 4 && directorSubStep === 1) {
      if (!validateStep4SubStep1()) {
        toast.error("Please fill in all required director fields correctly");
        return;
      }
    }
    
    if (currentStep === 4 && directorSubStep === 2) {
      if (!validateStep4SubStep2()) {
        toast.error("Please upload all required director documents");
        return;
      }
    }
    
    setLoading(true);
    try {
      // STEP 1: Create Organization Owner
      if (currentStep === 1) {
        const ownerData = {
          username: ownerInfo.username,
          email: ownerInfo.email,
          phone: ownerInfo.phone,
          firstName: ownerInfo.firstName,
          lastName: ownerInfo.lastName,
          middleName: ownerInfo.middleName || undefined,
          idNumber: ownerInfo.idNumber,
          kraPin: ownerInfo.kraPin,
        };

        const response = await api.post(
          "/v1/external/organizations/owners",
          ownerData
        );
        const createdOwner = response.data;

        setOwnerId(createdOwner.userId);
        toast.success("Owner created successfully!");
        setCurrentStep(2);
        return;
      }

      // STEP 2: Create Organization
      if (currentStep === 2) {
        if (!ownerId) {
          toast.error("Owner ID not found. Please complete step 1 first.");
          setCurrentStep(1);
          return;
        }

        // Map business type values to API expectations
        const businessTypeMapping = {
          "Sole Proprietorship": "SOLE_PROPRIETORSHIP",
          Partnership: "PARTNERSHIP",
          "Limited Company": "LIMITED_COMPANY",
          NGO: "NGO",
          Other: "OTHER",
        };

        const typeMapping = {
          Business: "BUSINESS",
          Family: "FAMILY",
          Club: "CLUB",
          Other: "OTHER",
        };

        // Format phone number - ensure it starts with country code (e.g., 254)
        let formattedPhone = businessInfo.phoneNumber;
        if (
          !formattedPhone.startsWith("254") &&
          !formattedPhone.startsWith("+")
        ) {
          // If phone number doesn't start with country code, add it
          formattedPhone =
            businessInfo.phoneCountryCode.replace("+", "") + formattedPhone;
        }

        const orgData = {
          ownerId: ownerId,
          companyNumber: businessInfo.companyNumber,
          name: businessInfo.businessName,
          businessType:
            businessTypeMapping[businessInfo.businessType] || "OTHER",
          type: typeMapping[businessInfo.typeOfBusiness] || "OTHER",
          phone: formattedPhone,
          email: businessInfo.businessEmail,
          taxNumber: businessInfo.taxNumber,
          tradingName: businessInfo.tradingName || undefined,
          businessRegistrationDate: businessInfo.registrationDate,
          industrialClassification:
            businessInfo.industrialClassification || undefined,
          industrialSector: businessInfo.industrialSector || undefined,
          address: {
            addressType: "BUSINESS",
            line1: businessAddress.addressLine1,
            line2: businessAddress.addressLine2 || undefined,
            city: businessAddress.city,
            state: businessAddress.county,
            country: businessAddress.country,
            postalCode: businessAddress.postalCode || undefined,
          },
        };

        const response = await api.post("/v1/external/organizations", orgData);
        const createdOrg = response.data;

        setOrganizationId(createdOrg.organizationId);
        localStorage.setItem(
          "merchantOrganizationId",
          createdOrg.organizationId
        );
        toast.success("Organization created successfully!");
        setCurrentStep(3);
        return;
      }

      // STEP 3: Upload Organization Documents
      if (currentStep === 3) {
        if (!organizationId) {
          toast.error(
            "Organization ID not found. Please complete step 2 first."
          );
          setCurrentStep(2);
          return;
        }

        const uploadPromises = [];

        if (businessDocs.certificateOfIncorporation) {
          uploadPromises.push(
            uploadOrganizationDocument(
              organizationId,
              businessDocs.certificateOfIncorporation,
              "certificateOfIncorporation"
            )
          );
        }
        if (businessDocs.kraPinCertificate) {
          uploadPromises.push(
            uploadOrganizationDocument(
              organizationId,
              businessDocs.kraPinCertificate,
              "kraPinCertificate"
            )
          );
        }
        if (businessDocs.cr12) {
          uploadPromises.push(
            uploadOrganizationDocument(
              organizationId,
              businessDocs.cr12,
              "cr12"
            )
          );
        }
        if (businessDocs.businessPermit) {
          uploadPromises.push(
            uploadOrganizationDocument(
              organizationId,
              businessDocs.businessPermit,
              "businessPermit"
            )
          );
        }

        await Promise.all(uploadPromises);
        toast.success("Organization documents uploaded successfully!");
        setCurrentStep(4);
        return;
      }

      // STEP 4: Add Directors (Sub-step 1: Director Info)
      if (currentStep === 4 && directorSubStep === 1) {
        if (!organizationId) {
          toast.error(
            "Organization ID not found. Please complete previous steps first."
          );
          return;
        }

        const directorData = {
          username: currentDirector.username,
          email: currentDirector.email,
          phone: currentDirector.phone,
          firstName: currentDirector.firstName,
          lastName: currentDirector.lastName,
          middleName: currentDirector.middleName || undefined,
          idNumber: currentDirector.idNumber,
          kraPin: currentDirector.kraPin,
          position: currentDirector.position,
        };

        const response = await api.post(
          `/v1/external/organizations/${organizationId}/directors`,
          directorData
        );
        const createdDirector = response.data;

        setCurrentDirectorId(createdDirector.directorId);
        toast.success(
          "Director created successfully! Now upload director documents."
        );
        setDirectorSubStep(2);
        return;
      }

      // STEP 4: Add Directors (Sub-step 2: Director Documents)
      if (currentStep === 4 && directorSubStep === 2) {
        if (!organizationId || !currentDirectorId) {
          toast.error("Missing organization or director ID");
          return;
        }

        const uploadPromises = [];

        if (directorDocuments.photoIdFront) {
          uploadPromises.push(
            uploadDirectorDocument(
              organizationId,
              currentDirectorId,
              directorDocuments.photoIdFront,
              "photoIdFront"
            )
          );
        }
        if (directorDocuments.photoIdBack) {
          uploadPromises.push(
            uploadDirectorDocument(
              organizationId,
              currentDirectorId,
              directorDocuments.photoIdBack,
              "photoIdBack"
            )
          );
        }
        if (directorDocuments.kraCertificate) {
          uploadPromises.push(
            uploadDirectorDocument(
              organizationId,
              currentDirectorId,
              directorDocuments.kraCertificate,
              "kraCertificate"
            )
          );
        }
        if (directorDocuments.proofOfAddress) {
          uploadPromises.push(
            uploadDirectorDocument(
              organizationId,
              currentDirectorId,
              directorDocuments.proofOfAddress,
              "proofOfAddress"
            )
          );
        }
        if (directorDocuments.selfie) {
          uploadPromises.push(
            uploadDirectorDocument(
              organizationId,
              currentDirectorId,
              directorDocuments.selfie,
              "selfie"
            )
          );
        }

        await Promise.all(uploadPromises);

        // Add director to list
        setDirectors((prev) => [
          ...prev,
          { ...currentDirector, id: currentDirectorId },
        ]);
        toast.success("Director documents uploaded successfully!");

        // Show option to add another director
        setDirectorSubStep(3);
        return;
      }

      // STEP 5: Get Organization Status
      if (currentStep === 5) {
        if (!organizationId) {
          toast.error("Organization ID not found");
          return;
        }

        const response = await api.get(
          `/v1/external/organizations/${organizationId}`
        );
        setOrganizationStatus(response.data);
        toast.success("Organization status retrieved!");
        return;
      }
      if (currentStep === 1) {
        // Validate Step 1
        if (
          !businessInfo.companyNumber ||
          !businessInfo.businessName ||
          !businessInfo.phoneNumber
        ) {
          toast.error("Please fill in all required fields");
          setLoading(false);
          return;
        }

        // Step 1: Create Organization Owner
        const ownerPayload = {
          username: user.username || user.email.split("@")[0],
          email: user.email,
          phone: `${businessInfo.phoneCountryCode}${businessInfo.phoneNumber}`,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          middleName: user.middleName || "",
          idNumber: user.idNumber || "",
          kraPin: user.kraPin || businessInfo.taxNumber,
        };

        const ownerResponse = await api.post(
          "/v1/external/organizations/owners",
          ownerPayload
        );
        const ownerId = ownerResponse.data.userId;

        toast.success("Owner information saved successfully");

        // Store ownerId for next step
        localStorage.setItem("merchantOwnerId", ownerId);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Validate Step 2
        if (
          !businessAddress.addressLine1 ||
          !businessAddress.city ||
          !businessAddress.county
        ) {
          toast.error("Please fill in all required address fields");
          setLoading(false);
          return;
        }

        // Step 2: Create Organization
        const ownerId = localStorage.getItem("merchantOwnerId");
        if (!ownerId) {
          toast.error("Owner information not found. Please go back to Step 1.");
          setLoading(false);
          return;
        }

        // Map businessType to API format
        const businessTypeMapping = {
          "Sole Proprietorship": "SOLE_PROPRIETORSHIP",
          Partnership: "PARTNERSHIP",
          "Limited Company": "LIMITED_COMPANY",
        };

        // Map typeOfBusiness to API format
        const typeMapping = {
          Business: "BUSINESS",
          Family: "FAMILY",
          Club: "CLUB",
          Other: "OTHER",
        };

        const organizationPayload = {
          ownerId: ownerId,
          companyNumber: businessInfo.companyNumber,
          name: businessInfo.businessName,
          businessType:
            businessTypeMapping[businessInfo.businessType] || "OTHER",
          type: typeMapping[businessInfo.typeOfBusiness] || "BUSINESS",
          phone: `${businessInfo.phoneCountryCode}${businessInfo.phoneNumber}`,
          email: businessInfo.businessEmail,
          taxNumber: businessInfo.taxNumber,
          tradingName: businessInfo.tradingName || businessInfo.businessName,
          businessRegistrationDate: businessInfo.registrationDate,
          industrialClassification: businessInfo.industrialClassification || "",
          industrialSector: businessInfo.industrialSector || "",
          address: {
            addressType: "BUSINESS",
            line1: businessAddress.addressLine1,
            line2: "",
            city: businessAddress.city,
            state: businessAddress.county,
            country: businessAddress.country,
            postalCode: businessAddress.postalCode || "",
          },
        };

        const orgResponse = await api.post(
          "/v1/external/organizations",
          organizationPayload
        );
        const organizationId = orgResponse.data.organizationId;

        toast.success("Organization created successfully");

        // Store organizationId for next steps
        localStorage.setItem("merchantOrganizationId", organizationId);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Step 3: Upload Organization Documents
        const organizationId = localStorage.getItem("merchantOrganizationId");
        if (!organizationId) {
          toast.error(
            "Organization not found. Please complete previous steps."
          );
          setLoading(false);
          return;
        }

        const requiredDocs = [
          "certificateOfIncorporation",
          "kraPinCertificate",
          "cr12",
          "businessPermit",
        ];
        const missingDocs = requiredDocs.filter((doc) => !businessDocs[doc]);

        if (missingDocs.length > 0) {
          toast.error("Please upload all required business documents");
          setLoading(false);
          return;
        }

        // Upload all business documents
        const uploadPromises = [];
        for (const [docType, file] of Object.entries(businessDocs)) {
          if (file) {
            uploadPromises.push(
              uploadOrganizationDocument(organizationId, file, docType)
            );
          }
        }

        await Promise.all(uploadPromises);
        toast.success("Business documents uploaded successfully");
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Step 4: Add Directors and Upload Their Documents
        const organizationId = localStorage.getItem("merchantOrganizationId");
        if (!organizationId) {
          toast.error(
            "Organization not found. Please complete previous steps."
          );
          setLoading(false);
          return;
        }

        // Validate all directors have required information
        for (let i = 0; i < directors.length; i++) {
          const director = directors[i];
          if (
            !director.name ||
            !director.dob ||
            !director.kraPin ||
            !director.address
          ) {
            toast.error(
              `Please fill in all required information for Director ${i + 1}`
            );
            setLoading(false);
            return;
          }

          const requiredDocs = [
            "photoIdFront",
            "photoIdBack",
            "kraCertificate",
            "proofOfAddress",
            "selfie",
          ];
          const missingDocs = requiredDocs.filter(
            (doc) => !director.documents[doc]
          );

          if (missingDocs.length > 0) {
            toast.error(
              `Please upload all required documents for Director ${i + 1}`
            );
            setLoading(false);
            return;
          }
        }

        // Add each director and upload their documents
        for (let i = 0; i < directors.length; i++) {
          const director = directors[i];
          const nameParts = director.name.trim().split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts[nameParts.length - 1] || "";
          const middleName =
            nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "";

          // Create director
          const directorPayload = {
            username: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${Date.now()}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${
              businessInfo.businessEmail.split("@")[1]
            }`,
            phone: `${businessInfo.phoneCountryCode}${businessInfo.phoneNumber}`,
            firstName: firstName,
            lastName: lastName,
            middleName: middleName,
            idNumber: director.kraPin.substring(1, 9), // Extract ID from KRA PIN format
            kraPin: director.kraPin,
            position: "DIRECTOR",
          };

          const directorResponse = await api.post(
            `/v1/external/organizations/${organizationId}/directors`,
            directorPayload
          );
          const directorId = directorResponse.data.directorId;

          // Upload director documents
          const docUploadPromises = [];
          for (const [docType, file] of Object.entries(director.documents)) {
            if (file) {
              docUploadPromises.push(
                uploadDirectorDocument(
                  organizationId,
                  directorId,
                  file,
                  docType
                )
              );
            }
          }

          await Promise.all(docUploadPromises);
          toast.success(`Director ${i + 1} added successfully`);
        }

        toast.success("All directors and documents submitted successfully!");

        // Clear localStorage
        localStorage.removeItem("merchantOwnerId");
        localStorage.removeItem("merchantOrganizationId");

        setCurrentStep(5);
      }
    } catch (error) {
      console.error("Step submission error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save information"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderHelpBox = () => (
    <div className="help-box">
      <div className="help-icon">ℹ️</div>
      <div>
        <strong>Need Help?</strong>
        <p>
          Make sure all information matches your official business registration
          documents. This ensures smooth verification and compliance with our
          platform requirements.
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step">
      <h2>Organization Owner Information</h2>
      <p>
        Enter the details of the person who will own and manage this
        organization
      </p>

      {renderHelpBox()}

      <div className="form-grid">
        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            value={ownerInfo.username}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, username: e.target.value }));
              if (errors.ownerUsername) {
                setErrors((prev) => ({ ...prev, ownerUsername: null }));
              }
            }}
            placeholder="john_doe_corp"
            className={errors.ownerUsername ? 'input-error' : ''}
            required
          />
          {errors.ownerUsername && <span className="error-message">{errors.ownerUsername}</span>}
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            value={ownerInfo.email}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, email: e.target.value }));
              if (errors.ownerEmail) {
                setErrors((prev) => ({ ...prev, ownerEmail: null }));
              }
            }}
            placeholder="john.doe@company.com"
            className={errors.ownerEmail ? 'input-error' : ''}
            required
          />
          {errors.ownerEmail && <span className="error-message">{errors.ownerEmail}</span>}
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            value={ownerInfo.phone}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, phone: e.target.value }));
              if (errors.ownerPhone) {
                setErrors((prev) => ({ ...prev, ownerPhone: null }));
              }
            }}
            placeholder="254712345678"
            className={errors.ownerPhone ? 'input-error' : ''}
            required
          />
          {errors.ownerPhone ? (
            <span className="error-message">{errors.ownerPhone}</span>
          ) : (
            <small>Format: Country code + number (e.g., 254712345678)</small>
          )}
        </div>

        <div className="form-group">
          <label>First Name *</label>
          <input
            type="text"
            value={ownerInfo.firstName}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, firstName: e.target.value }));
              if (errors.ownerFirstName) {
                setErrors((prev) => ({ ...prev, ownerFirstName: null }));
              }
            }}
            placeholder="John"
            className={errors.ownerFirstName ? 'input-error' : ''}
            required
          />
          {errors.ownerFirstName && <span className="error-message">{errors.ownerFirstName}</span>}
        </div>

        <div className="form-group">
          <label>Last Name *</label>
          <input
            type="text"
            value={ownerInfo.lastName}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, lastName: e.target.value }));
              if (errors.ownerLastName) {
                setErrors((prev) => ({ ...prev, ownerLastName: null }));
              }
            }}
            placeholder="Doe"
            className={errors.ownerLastName ? 'input-error' : ''}
            required
          />
          {errors.ownerLastName && <span className="error-message">{errors.ownerLastName}</span>}
        </div>

        <div className="form-group">
          <label>Middle Name</label>
          <input
            type="text"
            value={ownerInfo.middleName}
            onChange={(e) =>
              setOwnerInfo((prev) => ({ ...prev, middleName: e.target.value }))
            }
            placeholder="Michael"
          />
        </div>

        <div className="form-group">
          <label>ID Number *</label>
          <input
            type="text"
            value={ownerInfo.idNumber}
            onChange={(e) => {
              setOwnerInfo((prev) => ({ ...prev, idNumber: e.target.value }));
              if (errors.ownerIdNumber) {
                setErrors((prev) => ({ ...prev, ownerIdNumber: null }));
              }
            }}
            placeholder="12345678"
            className={errors.ownerIdNumber ? 'input-error' : ''}
            required
          />
          {errors.ownerIdNumber && <span className="error-message">{errors.ownerIdNumber}</span>}
        </div>

        <div className="form-group">
          <label>KRA PIN *</label>
          <input
            type="text"
            value={ownerInfo.kraPin}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setOwnerInfo((prev) => ({ ...prev, kraPin: value }));
              if (errors.ownerKraPin) {
                setErrors((prev) => ({ ...prev, ownerKraPin: null }));
              }
            }}
            placeholder="A001234567Z"
            className={errors.ownerKraPin ? 'input-error' : ''}
            required
          />
          {errors.ownerKraPin && <span className="error-message">{errors.ownerKraPin}</span>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <h2>Organization Information</h2>
      <p>Enter your organization details and business address</p>

      {renderHelpBox()}

      <h3 style={{ marginTop: "1.5rem", marginBottom: "1rem" }}>
        Business Details
      </h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Company Number *</label>
          <input
            type="text"
            value={businessInfo.companyNumber}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                companyNumber: e.target.value,
              }));
              if (errors.companyNumber) {
                setErrors((prev) => ({ ...prev, companyNumber: null }));
              }
            }}
            placeholder="e.g., PVT-123456"
            className={errors.companyNumber ? 'input-error' : ''}
            required
          />
          {errors.companyNumber && <span className="error-message">{errors.companyNumber}</span>}
        </div>

        <div className="form-group">
          <label>Registration Date *</label>
          <input
            type="date"
            value={businessInfo.registrationDate}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                registrationDate: e.target.value,
              }));
              if (errors.registrationDate) {
                setErrors((prev) => ({ ...prev, registrationDate: null }));
              }
            }}
            className={errors.registrationDate ? 'input-error' : ''}
            required
          />
          {errors.registrationDate && <span className="error-message">{errors.registrationDate}</span>}
        </div>

        <div className="form-group full-width">
          <label>Business Name *</label>
          <input
            type="text"
            value={businessInfo.businessName}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                businessName: e.target.value,
              }));
              if (errors.businessName) {
                setErrors((prev) => ({ ...prev, businessName: null }));
              }
            }}
            placeholder="Enter registered business name"
            className={errors.businessName ? 'input-error' : ''}
            required
          />
          {errors.businessName && <span className="error-message">{errors.businessName}</span>}
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <div style={{ position: "relative" }}>
            <div className="phone-input-wrapper">
              <div ref={dropdownRef} className="country-code-selector">
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="country-code-button"
                >
                  <span className="flag">
                    {
                      countryCodes.find(
                        (c) => c.code === businessInfo.phoneCountryCode
                      )?.flag
                    }
                  </span>
                  <span>{businessInfo.phoneCountryCode}</span>
                  <span
                    className={`arrow ${showCountryDropdown ? "open" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {showCountryDropdown && (
                  <div className="country-dropdown">
                    {countryCodes.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setBusinessInfo((prev) => ({
                            ...prev,
                            phoneCountryCode: country.code,
                            phoneNumber: "",
                          }));
                          setShowCountryDropdown(false);
                        }}
                        className={`country-option ${
                          businessInfo.phoneCountryCode === country.code
                            ? "selected"
                            : ""
                        }`}
                      >
                        <span className="flag">{country.flag}</span>
                        <span className="country-name">{country.name}</span>
                        <span className="country-code">{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="tel"
                value={businessInfo.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  const maxLength =
                    businessInfo.phoneCountryCode === "+1" ? 10 : 9;
                  if (value.length <= maxLength) {
                    setBusinessInfo((prev) => ({
                      ...prev,
                      phoneNumber: value,
                    }));
                    if (errors.phoneNumber) {
                      setErrors((prev) => ({ ...prev, phoneNumber: null }));
                    }
                  }
                }}
                placeholder="712345678"
                className={`phone-number-input ${errors.phoneNumber ? 'input-error' : ''}`}
                required
              />
            </div>
          </div>
          {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
        </div>

        <div className="form-group">
          <label>Business Email Address *</label>
          <input
            type="email"
            value={businessInfo.businessEmail}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                businessEmail: e.target.value,
              }));
              if (errors.businessEmail) {
                setErrors((prev) => ({ ...prev, businessEmail: null }));
              }
            }}
            placeholder="business@example.com"
            className={errors.businessEmail ? 'input-error' : ''}
            required
          />
          {errors.businessEmail && <span className="error-message">{errors.businessEmail}</span>}
        </div>

        <div className="form-group">
          <label>Tax Number (KRA PIN) *</label>
          <input
            type="text"
            value={businessInfo.taxNumber}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setBusinessInfo((prev) => ({
                ...prev,
                taxNumber: value,
              }));
              if (errors.taxNumber) {
                setErrors((prev) => ({ ...prev, taxNumber: null }));
              }
            }}
            placeholder="A123456789X"
            className={errors.taxNumber ? 'input-error' : ''}
            required
          />
          {errors.taxNumber && <span className="error-message">{errors.taxNumber}</span>}
        </div>

        <div className="form-group">
          <label>Trading Name</label>
          <input
            type="text"
            value={businessInfo.tradingName}
            onChange={(e) =>
              setBusinessInfo((prev) => ({
                ...prev,
                tradingName: e.target.value,
              }))
            }
            placeholder="Enter trading name (if different)"
          />
        </div>

        <div className="form-group">
          <label>Industrial Classification *</label>
          <input
            type="text"
            value={businessInfo.industrialClassification}
            onChange={(e) =>
              setBusinessInfo((prev) => ({
                ...prev,
                industrialClassification: e.target.value,
              }))
            }
            placeholder="e.g., Retail Trade"
          />
        </div>

        <div className="form-group">
          <label>Industrial Sector *</label>
          <input
            type="text"
            value={businessInfo.industrialSector}
            onChange={(e) =>
              setBusinessInfo((prev) => ({
                ...prev,
                industrialSector: e.target.value,
              }))
            }
            placeholder="e.g., Technology, Agriculture"
          />
        </div>

        <div className="form-group">
          <label>Type of Business *</label>
          <select
            value={businessInfo.typeOfBusiness}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                typeOfBusiness: e.target.value,
              }));
              if (errors.typeOfBusiness) {
                setErrors((prev) => ({ ...prev, typeOfBusiness: null }));
              }
            }}
            className={errors.typeOfBusiness ? 'input-error' : ''}
            required
          >
            <option value="">Select type</option>
            <option value="Business">Business</option>
            <option value="Family">Family</option>
            <option value="Club">Club</option>
            <option value="Other">Other</option>
          </select>
          {errors.typeOfBusiness && <span className="error-message">{errors.typeOfBusiness}</span>}
        </div>

        <div className="form-group">
          <label>Business Type *</label>
          <select
            value={businessInfo.businessType}
            onChange={(e) => {
              setBusinessInfo((prev) => ({
                ...prev,
                businessType: e.target.value,
              }));
              if (errors.businessType) {
                setErrors((prev) => ({ ...prev, businessType: null }));
              }
            }}
            className={errors.businessType ? 'input-error' : ''}
            required
          >
            <option value="">Select business type</option>
            <option value="Sole Proprietorship">Sole Proprietorship</option>
            <option value="Partnership">Partnership</option>
            <option value="Limited Company">Limited Company</option>
            <option value="NGO">NGO</option>
            <option value="Other">Other</option>
          </select>
          {errors.businessType && <span className="error-message">{errors.businessType}</span>}
        </div>
      </div>

      <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>
        Business Address
      </h3>
      <div className="form-grid">
        <div className="form-group full-width">
          <label>Address Line 1 *</label>
          <input
            type="text"
            value={businessAddress.addressLine1}
            onChange={(e) => {
              setBusinessAddress((prev) => ({
                ...prev,
                addressLine1: e.target.value,
              }));
              if (errors.addressLine1) {
                setErrors((prev) => ({ ...prev, addressLine1: null }));
              }
            }}
            placeholder="Street address, P.O. Box, Building, etc."
            className={errors.addressLine1 ? 'input-error' : ''}
            required
          />
          {errors.addressLine1 && <span className="error-message">{errors.addressLine1}</span>}
        </div>

        <div className="form-group full-width">
          <label>Address Line 2</label>
          <input
            type="text"
            value={businessAddress.addressLine2}
            onChange={(e) =>
              setBusinessAddress((prev) => ({
                ...prev,
                addressLine2: e.target.value,
              }))
            }
            placeholder="Floor, Office, Suite (optional)"
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={businessAddress.city}
            onChange={(e) => {
              setBusinessAddress((prev) => ({ ...prev, city: e.target.value }));
              if (errors.city) {
                setErrors((prev) => ({ ...prev, city: null }));
              }
            }}
            placeholder="Enter city"
            className={errors.city ? 'input-error' : ''}
            required
          />
          {errors.city && <span className="error-message">{errors.city}</span>}
        </div>

        <div className="form-group">
          <label>County/State *</label>
          <input
            type="text"
            value={businessAddress.county}
            onChange={(e) => {
              setBusinessAddress((prev) => ({
                ...prev,
                county: e.target.value,
              }));
              if (errors.county) {
                setErrors((prev) => ({ ...prev, county: null }));
              }
            }}
            placeholder="Enter county"
            className={errors.county ? 'input-error' : ''}
            required
          />
          {errors.county && <span className="error-message">{errors.county}</span>}
        </div>

        <div className="form-group">
          <label>Postal Code</label>
          <input
            type="text"
            value={businessAddress.postalCode}
            onChange={(e) =>
              setBusinessAddress((prev) => ({
                ...prev,
                postalCode: e.target.value,
              }))
            }
            placeholder="00100"
          />
        </div>

        <div className="form-group">
          <label>Country *</label>
          <select
            value={businessAddress.country}
            onChange={(e) =>
              setBusinessAddress((prev) => ({
                ...prev,
                country: e.target.value,
              }))
            }
            required
          >
            <option value="Kenya">Kenya</option>
            <option value="United States">United States</option>
            <option value="South Africa">South Africa</option>
            <option value="Tanzania">Tanzania</option>
            <option value="Uganda">Uganda</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <h2>Business Documents</h2>
      <p>Upload required business registration documents</p>

      {renderHelpBox()}

      <div className="document-upload-section">
        {[
          {
            key: "certificateOfIncorporation",
            label: "Certificate of Incorporation",
            required: true,
          },
          {
            key: "kraPinCertificate",
            label: "KRA PIN Certificate",
            required: true,
          },
          { key: "cr12", label: "CR-12", required: true },
          { key: "businessPermit", label: "Business Permit", required: true },
        ].map((doc) => (
          <div key={doc.key} className="document-item">
            <h3 className="document-title">
              {doc.label} {doc.required && "*"}
            </h3>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id={doc.key}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) =>
                  handleBusinessDocChange(doc.key, e.target.files[0])
                }
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleBusinessDocChange(doc.key, file);
                }}
                className="file-input-hidden"
              />
              <label
                htmlFor={doc.key}
                className={`file-upload-label ${errors[doc.key] ? 'error' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleBusinessDocChange(doc.key, file);
                }}
              >
                {businessDocs[doc.key] ? (
                  <div className="file-selected">
                    <div>
                      <span>✓ {businessDocs[doc.key].name}</span>
                      <small>
                        ({(businessDocs[doc.key].size / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </small>
                    </div>
                  </div>
                ) : (
                  <div className="file-upload-placeholder">
                    <div className="upload-text">
                      <span className="upload-main">
                        Choose file or drag here
                      </span>
                      <small>Supported file type(s): PDF, DOC, JPG</small>
                      <small>Size limit: 10 MB </small>
                    </div>
                  </div>
                )}
              </label>
              {errors[doc.key] && <span className="error-message">{errors[doc.key]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (directorSubStep === 1) {
      // Sub-step 1: Director Information
      return (
        <div className="onboarding-step">
          <h2>Add Director</h2>
          <p>Provide information for a business director or partner</p>

          {renderHelpBox()}

          {directors.length > 0 && (
            <div
              style={{
                marginBottom: "2rem",
                padding: "1rem",
                background: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <h3>Added Directors ({directors.length})</h3>
              <ul style={{ marginTop: "0.5rem" }}>
                {directors.map((dir, idx) => (
                  <li key={idx}>
                    {dir.firstName} {dir.lastName} - {dir.position}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                value={currentDirector.username}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }));
                  if (errors.directorUsername) {
                    setErrors((prev) => ({ ...prev, directorUsername: null }));
                  }
                }}
                placeholder="jane_smith_dir"
                className={errors.directorUsername ? 'input-error' : ''}
                required
              />
              {errors.directorUsername && <span className="error-message">{errors.directorUsername}</span>}
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={currentDirector.email}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }));
                  if (errors.directorEmail) {
                    setErrors((prev) => ({ ...prev, directorEmail: null }));
                  }
                }}
                placeholder="jane.smith@company.com"
                className={errors.directorEmail ? 'input-error' : ''}
                required
              />
              {errors.directorEmail && <span className="error-message">{errors.directorEmail}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={currentDirector.phone}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }));
                  if (errors.directorPhone) {
                    setErrors((prev) => ({ ...prev, directorPhone: null }));
                  }
                }}
                placeholder="254723456789"
                className={errors.directorPhone ? 'input-error' : ''}
                required
              />
              {errors.directorPhone ? (
                <span className="error-message">{errors.directorPhone}</span>
              ) : (
                <small>Format: Country code + number (e.g., 254723456789)</small>
              )}
            </div>

            <div className="form-group">
              <label>First Name *</label>
              <input
                type="text"
                value={currentDirector.firstName}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }));
                  if (errors.directorFirstName) {
                    setErrors((prev) => ({ ...prev, directorFirstName: null }));
                  }
                }}
                placeholder="Jane"
                className={errors.directorFirstName ? 'input-error' : ''}
                required
              />
              {errors.directorFirstName && <span className="error-message">{errors.directorFirstName}</span>}
            </div>

            <div className="form-group">
              <label>Last Name *</label>
              <input
                type="text"
                value={currentDirector.lastName}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    lastName: e.target.value,
                  }));
                  if (errors.directorLastName) {
                    setErrors((prev) => ({ ...prev, directorLastName: null }));
                  }
                }}
                placeholder="Smith"
                className={errors.directorLastName ? 'input-error' : ''}
                required
              />
              {errors.directorLastName && <span className="error-message">{errors.directorLastName}</span>}
            </div>

            <div className="form-group">
              <label>Middle Name</label>
              <input
                type="text"
                value={currentDirector.middleName}
                onChange={(e) =>
                  setCurrentDirector((prev) => ({
                    ...prev,
                    middleName: e.target.value,
                  }))
                }
                placeholder="Elizabeth"
              />
            </div>

            <div className="form-group">
              <label>ID Number *</label>
              <input
                type="text"
                value={currentDirector.idNumber}
                onChange={(e) => {
                  setCurrentDirector((prev) => ({
                    ...prev,
                    idNumber: e.target.value,
                  }));
                  if (errors.directorIdNumber) {
                    setErrors((prev) => ({ ...prev, directorIdNumber: null }));
                  }
                }}
                placeholder="23456789"
                className={errors.directorIdNumber ? 'input-error' : ''}
                required
              />
              {errors.directorIdNumber && <span className="error-message">{errors.directorIdNumber}</span>}
            </div>

            <div className="form-group">
              <label>KRA PIN *</label>
              <input
                type="text"
                value={currentDirector.kraPin}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setCurrentDirector((prev) => ({
                    ...prev,
                    kraPin: value,
                  }));
                  if (errors.directorKraPin) {
                    setErrors((prev) => ({ ...prev, directorKraPin: null }));
                  }
                }}
                placeholder="A001234568Z"
                className={errors.directorKraPin ? 'input-error' : ''}
                required
              />
              {errors.directorKraPin && <span className="error-message">{errors.directorKraPin}</span>}
            </div>

            <div className="form-group">
              <label>Position *</label>
              <select
                value={currentDirector.position}
                onChange={(e) =>
                  setCurrentDirector((prev) => ({
                    ...prev,
                    position: e.target.value,
                  }))
                }
                required
              >
                <option value="DIRECTOR">Director</option>
                <option value="PARTNER">Partner</option>
                <option value="PRIMARY_CONTACT">Primary Contact</option>
                <option value="HEAD">Head</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>
        </div>
      );
    } else if (directorSubStep === 2) {
      // Sub-step 2: Director Documents
      return (
        <div className="onboarding-step">
          <h2>Upload Director Documents</h2>
          <p>
            Upload identity documents for {currentDirector.firstName}{" "}
            {currentDirector.lastName}
          </p>

          {renderHelpBox()}

          <div className="document-upload-section">
            {[
              {
                key: "photoIdFront",
                label: "National ID (Front)",
                required: true,
              },
              {
                key: "photoIdBack",
                label: "National ID (Back)",
                required: true,
              },
              {
                key: "kraCertificate",
                label: "KRA Certificate",
                required: false,
              },
              {
                key: "proofOfAddress",
                label: "Proof of Address",
                required: false,
              },
              { key: "selfie", label: "Facial Photo / Selfie", required: true },
            ].map((doc) => (
              <div key={doc.key} className="document-item">
                <h3 className="document-title">
                  {doc.label} {doc.required && "*"}
                </h3>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id={doc.key}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      setDirectorDocuments((prev) => ({
                        ...prev,
                        [doc.key]: e.target.files[0],
                      }));
                      if (errors[doc.key]) {
                        setErrors((prev) => ({ ...prev, [doc.key]: null }));
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        setDirectorDocuments((prev) => ({
                          ...prev,
                          [doc.key]: file,
                        }));
                        if (errors[doc.key]) {
                          setErrors((prev) => ({ ...prev, [doc.key]: null }));
                        }
                      }
                    }}
                    className="file-input-hidden"
                  />
                  <label
                    htmlFor={doc.key}
                    className={`file-upload-label ${errors[doc.key] ? 'error' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) {
                        setDirectorDocuments((prev) => ({
                          ...prev,
                          [doc.key]: file,
                        }));
                        if (errors[doc.key]) {
                          setErrors((prev) => ({ ...prev, [doc.key]: null }));
                        }
                      }
                    }}
                  >
                    {directorDocuments[doc.key] ? (
                      <div className="file-selected">
                        <div>
                          <span>✓ {directorDocuments[doc.key].name}</span>
                          <small>
                            (
                            {(
                              directorDocuments[doc.key].size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB)
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="file-upload-placeholder">
                        <div className="upload-text">
                          <span className="upload-main">
                            Choose file or drag here
                          </span>
                          <small>Supported file type(s): PDF, JPG, PNG</small>
                          <small>Size limit: 10 MB</small>
                        </div>
                      </div>
                    )}
                  </label>
                  {errors[doc.key] && <span className="error-message">{errors[doc.key]}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // Director saved, ask if they want to add another
      return (
        <div className="onboarding-step">
          <h2>Directors Added Successfully!</h2>
          <p>
            You have added {directors.length} director(s) to your organization.
          </p>

          <div
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <h3>Added Directors</h3>
            <ul style={{ marginTop: "1rem" }}>
              {directors.map((dir, idx) => (
                <li key={idx} style={{ marginBottom: "0.5rem" }}>
                  <strong>
                    {dir.firstName} {dir.lastName}
                  </strong>{" "}
                  - {dir.position}
                  <br />
                  <small>{dir.email}</small>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                // Reset form and go back to substep 1
                setCurrentDirector({
                  username: "",
                  email: "",
                  phone: "",
                  firstName: "",
                  lastName: "",
                  middleName: "",
                  idNumber: "",
                  kraPin: "",
                  position: "DIRECTOR",
                });
                setCurrentDirectorId(null);
                setDirectorDocuments({
                  photoIdFront: null,
                  photoIdBack: null,
                  kraCertificate: null,
                  proofOfAddress: null,
                  selfie: null,
                });
                setDirectorSubStep(1);
              }}
              style={{ marginRight: "1rem" }}
            >
              + Add Another Director
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setCurrentStep(5);
              }}
            >
              Continue to Review →
            </button>
          </div>
        </div>
      );
    }
  };

  const renderStep5 = () => {
    if (!organizationStatus) {
      return (
        <div className="onboarding-step">
          <h2>Loading Organization Status...</h2>
          <div className="loading-spinner">Loading...</div>
        </div>
      );
    }

    return (
      <div className="onboarding-step">
        <h2>Organization Status</h2>
        <p>Your organization has been successfully submitted for review</p>

        <div className="review-info-box">
          <h3>Organization Details</h3>
          <div style={{ marginTop: "1rem" }}>
            <p>
              <strong>Name:</strong> {organizationStatus.name}
            </p>
            <p>
              <strong>Company Number:</strong>{" "}
              {organizationStatus.companyNumber}
            </p>
            <p>
              <strong>Email:</strong> {organizationStatus.email}
            </p>
            <p>
              <strong>Phone:</strong> {organizationStatus.phone}
            </p>
            <p>
              <strong>Type:</strong> {organizationStatus.type}
            </p>
            <p>
              <strong>Business Type:</strong> {organizationStatus.businessType}
            </p>
          </div>
        </div>

        {organizationStatus.owner && (
          <div className="review-info-box" style={{ marginTop: "1.5rem" }}>
            <h3>Owner Information</h3>
            <div style={{ marginTop: "1rem" }}>
              <p>
                <strong>Name:</strong> {organizationStatus.owner.firstName}{" "}
                {organizationStatus.owner.lastName}
              </p>
              <p>
                <strong>Email:</strong> {organizationStatus.owner.email}
              </p>
              <p>
                <strong>Position:</strong> {organizationStatus.owner.position}
              </p>
              <p>
                <strong>Verified:</strong>{" "}
                {organizationStatus.owner.isVerified ? "✅ Yes" : "⏳ Pending"}
              </p>
            </div>
          </div>
        )}

        {organizationStatus.directors &&
          organizationStatus.directors.length > 0 && (
            <div className="review-info-box" style={{ marginTop: "1.5rem" }}>
              <h3>Directors ({organizationStatus.directors.length})</h3>
              <div style={{ marginTop: "1rem" }}>
                {organizationStatus.directors.map((director, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "1rem",
                      padding: "0.75rem",
                      background: "#f9f9f9",
                      borderRadius: "4px",
                    }}
                  >
                    <p>
                      <strong>
                        {director.firstName} {director.lastName}
                      </strong>
                    </p>
                    <p>
                      <small>Email: {director.email}</small>
                    </p>
                    <p>
                      <small>Position: {director.position}</small>
                    </p>
                    <p>
                      <small>
                        Verified:{" "}
                        {director.isVerified ? "✅ Yes" : "⏳ Pending"}
                      </small>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {organizationStatus.documents &&
          organizationStatus.documents.length > 0 && (
            <div className="review-info-box" style={{ marginTop: "1.5rem" }}>
              <h3>
                Uploaded Documents ({organizationStatus.documents.length})
              </h3>
              <ul style={{ marginTop: "1rem" }}>
                {organizationStatus.documents.map((doc, idx) => (
                  <li key={idx} style={{ marginBottom: "0.5rem" }}>
                    <strong>{doc.name}</strong>
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: "1rem", color: "#007bff" }}
                      >
                        View Document
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

        {organizationStatus.address && (
          <div className="review-info-box" style={{ marginTop: "1.5rem" }}>
            <h3>Business Address</h3>
            <div style={{ marginTop: "1rem" }}>
              <p>{organizationStatus.address.line1}</p>
              {organizationStatus.address.line2 && (
                <p>{organizationStatus.address.line2}</p>
              )}
              <p>
                {organizationStatus.address.city},{" "}
                {organizationStatus.address.country}
              </p>
            </div>
          </div>
        )}

        <div className="approval-steps" style={{ marginTop: "2rem" }}>
          <div
            className={`approval-step ${
              approvalStatus.payaApproval === "approved"
                ? "completed"
                : approvalStatus.payaApproval === "pending"
                ? "pending"
                : "rejected"
            }`}
          >
            <div className="step-icon">
              {approvalStatus.payaApproval === "approved"
                ? "✅"
                : approvalStatus.payaApproval === "rejected"
                ? "❌"
                : "⏳"}
            </div>
            <div className="step-content">
              <h3>1. Paya Approval</h3>
              <p>
                Our team is reviewing your business information and documents
              </p>
            </div>
            <span className={`status-badge ${approvalStatus.payaApproval}`}>
              {approvalStatus.payaApproval.toUpperCase()}
            </span>
          </div>

          <div
            className={`approval-step ${
              approvalStatus.bankApproval === "approved"
                ? "completed"
                : approvalStatus.bankApproval === "pending"
                ? "pending"
                : "rejected"
            }`}
          >
            <div className="step-icon">
              {approvalStatus.bankApproval === "approved"
                ? "✅"
                : approvalStatus.bankApproval === "rejected"
                ? "❌"
                : "⏳"}
            </div>
            <div className="step-content">
              <h3>2. Diamond Trust Bank Approval</h3>
              <p>Setting up your Paya Business Wallet for payments</p>
            </div>
            <span className={`status-badge ${approvalStatus.bankApproval}`}>
              {approvalStatus.bankApproval.toUpperCase()}
            </span>
          </div>

          {approvalStatus.payaApproval === "approved" &&
            approvalStatus.bankApproval === "approved" && (
              <div className={`approval-step completed`}>
                <div className="step-icon">✅</div>
                <div className="step-content">
                  <h3>3. Complete! Ready to Sell</h3>
                  <p>
                    Your wallet is connected and you can start uploading
                    products
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/products")}
                  >
                    Start Selling
                  </button>
                </div>
              </div>
            )}
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#e7f3ff",
            borderRadius: "8px",
            border: "1px solid #b3d9ff",
          }}
        >
          <h3>What happens next?</h3>
          <ul>
            <li>
              Our team will review your application within 1-3 business days
            </li>
            <li>Once approved, your Paya Business Wallet will be activated</li>
            <li>
              You can then upload products and start receiving BNPL orders
            </li>
          </ul>
          <p>
            <strong>Need help?</strong> Contact us at{" "}
            <a href="mailto:support@paya.co.ke">support@paya.co.ke</a>
          </p>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div
        className="container"
        style={{ padding: "2rem 0", textAlign: "center" }}
      >
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-header">
        <h1>Merchant Onboarding</h1>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicators">
          {[
            "Owner Info",
            "Business Info",
            "Business Documents",
            "Directors",
            "Review",
          ].map((label, index) => (
            <div
              key={index}
              className={`step-indicator ${
                currentStep > index + 1
                  ? "completed"
                  : currentStep === index + 1
                  ? "active"
                  : ""
              }`}
            >
              <div className="step-number">{index + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-content">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      {currentStep < 5 && directorSubStep !== 3 && (
        <div className="onboarding-actions">
          {(currentStep > 1 ||
            (currentStep === 4 && directorSubStep === 2)) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                if (currentStep === 4 && directorSubStep === 2) {
                  setDirectorSubStep(1);
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
              disabled={loading}
            >
              ← Back
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleStepSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : currentStep === 4 && directorSubStep === 1
              ? "Create Director →"
              : currentStep === 4 && directorSubStep === 2
              ? "Upload Documents & Save"
              : "Continue →"}
          </button>
        </div>
      )}
    </div>
  );
};

export default MerchantOnboardingNew;
