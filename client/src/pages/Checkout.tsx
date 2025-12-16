import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Alert,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  ArrowBack as ArrowBackIcon,
  ShoppingBag,
} from "@mui/icons-material";
import api from "../utils/api";
import toast from "react-hot-toast";

const steps = [
  "Personal Info",
  "OTP Verification",
  "Shipping",
  "Income & Pay Slip",
  // "Complete",
];

const Checkout = () => {
  const { items, getSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);

  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    companyEmail: "",
    phoneCountryCode: "+254",
    phoneNumber: "",
    nationalId: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Kenya",
  });

  const [bnplTerms, setBnplTerms] = useState({
    subtotal: 0,
    totalAmount: 0,
    totalInterest: 0,
    interestRate: 8, // Will be fetched from API
    numberOfPayments: 4, // Will be fetched from API
    paymentAmount: 0,
    payments: [] as any[],
  });

  // Fetch loan parameters from API on component mount
  useEffect(() => {
    const fetchLoanParameters = async () => {
      try {
        const response = await api.get("/underwriting/loan-parameters");
        setBnplTerms((prev) => ({
          ...prev,
          interestRate: response.data.interestRate,
          numberOfPayments: response.data.termMonths,
        }));
      } catch (error) {
        console.error("Failed to fetch loan parameters, using defaults");
      }
    };
    fetchLoanParameters();
  }, []);

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [underwritingResult, setUnderwritingResult] = useState<any>(null);

  // OTP state
  const [otp, setOtp] = useState("");

  // Pay slip state
  const [paySlip, setPaySlip] = useState<File | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyDebt, setMonthlyDebt] = useState("");
  const [incomeConfirmed, setIncomeConfirmed] = useState(false);

  // Next of Kin state
  const [nextOfKin, setNextOfKin] = useState({
    firstName: "",
    lastName: "",
    relationship: "",
    phoneCountryCode: "+254",
    phoneNumber: "",
    email: "",
  });

  // Decision flow state
  const [showDecision, setShowDecision] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [showNextOfKin, setShowNextOfKin] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    const subtotal = getSubtotal();
    const interestRate = bnplTerms.interestRate / 100; // Convert percentage to decimal
    const numberOfPayments = bnplTerms.numberOfPayments;
    const principalPerPayment = subtotal / numberOfPayments;

    // Calculate payment schedule using declining balance method
    let outstandingBalance = subtotal;
    let totalInterest = 0;
    const payments: Array<{
      number: number;
      principal: number;
      outstandingBalance: number;
      interest: number;
      amount: number;
      date: string;
    }> = [];
    const today = new Date();

    for (let i = 0; i < numberOfPayments; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);

      // Interest is calculated on the outstanding balance
      const interest = outstandingBalance * interestRate;
      const monthlyPayment = principalPerPayment + interest;

      payments.push({
        number: i + 1,
        principal: principalPerPayment,
        outstandingBalance: outstandingBalance,
        interest: interest,
        amount: monthlyPayment,
        date: paymentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      totalInterest += interest;
      outstandingBalance -= principalPerPayment;
    }

    const totalWithInterest = subtotal + totalInterest;
    // First payment amount (highest) for display purposes
    const paymentAmount = payments.length > 0 ? payments[0].amount : 0;

    setBnplTerms((prev) => ({
      ...prev,
      subtotal,
      totalInterest,
      totalAmount: totalWithInterest,
      paymentAmount,
      payments,
    }));
  }, [getSubtotal, bnplTerms.interestRate, bnplTerms.numberOfPayments]);

  useEffect(() => {
    if (items.length === 0 && currentStep === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [items, navigate, currentStep]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !personalInfo.firstName ||
      !personalInfo.lastName ||
      !personalInfo.dateOfBirth ||
      !personalInfo.companyEmail ||
      !personalInfo.phoneNumber ||
      !personalInfo.nationalId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate phone number length based on country code
    const phoneValidation: { [key: string]: { length: number; name: string } } =
      {
        "+254": { length: 9, name: "Kenya" }, // Kenya: 9 digits (e.g., 712345678)
        "+1": { length: 10, name: "USA" }, // USA: 10 digits
        "+27": { length: 9, name: "South Africa" }, // South Africa: 9 digits
        "+255": { length: 9, name: "Tanzania" }, // Tanzania: 9 digits
      };

    const validation = phoneValidation[personalInfo.phoneCountryCode];
    if (
      validation &&
      personalInfo.phoneNumber.replace(/\D/g, "").length !== validation.length
    ) {
      toast.error(
        `Phone number for ${validation.name} must be exactly ${validation.length} digits`
      );
      return;
    }

    try {
      await api.post("/auth/customer/add-info", {
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName || undefined,
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth,
        companyEmail: personalInfo.companyEmail,
        phoneCountryCode: personalInfo.phoneCountryCode.replace("+", ""),
        phoneNumber: personalInfo.phoneNumber,
        nationalId: personalInfo.nationalId,
      });

      // OTP sent via email automatically
      toast.success(
        `OTP sent to ${personalInfo.companyEmail}`
      );
      setCompletedSteps(prev => {
        if (!prev.includes(0)) {
          return [...prev, 0];
        }
        return prev;
      });
      setCurrentStep(1); // Move to OTP verification step
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save information"
      );
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP code");
      return;
    }

    try {
      await api.post("/auth/customer/verify-otp", {
        companyEmail: personalInfo.companyEmail,
        otp: otp,
      });

      toast.success("Phone number verified successfully!");
      setCompletedSteps(prev => {
        if (!prev.includes(1)) {
          return [...prev, 1];
        }
        return prev;
      });
      setCurrentStep(2); // Move to Shipping step
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Invalid OTP code. Please try again."
      );
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.post("/auth/customer/resend-otp", {
        companyEmail: personalInfo.companyEmail,
      });

      setOtp("");
      toast.success(
        `New OTP sent to ${personalInfo.companyEmail}`
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    // Validate zip code length based on country
    const zipValidation: { [key: string]: { maxLength: number } } = {
      Kenya: { maxLength: 5 },
      "United States": { maxLength: 5 },
      USA: { maxLength: 5 },
      "South Africa": { maxLength: 4 },
      Tanzania: { maxLength: 5 },
    };

    const validation = zipValidation[shippingAddress.country];
    if (
      validation &&
      shippingAddress.zipCode.replace(/\D/g, "").length > validation.maxLength
    ) {
      toast.error(
        `ZIP/Postal code for ${shippingAddress.country} must be maximum ${validation.maxLength} digits`
      );
      return;
    }

    setCompletedSteps(prev => {
      if (!prev.includes(2)) {
        return [...prev, 2];
      }
      return prev;
    });
    setCurrentStep(3); // Move to Pay Slip step
  };

  const handlePaySlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paySlip) {
      toast.error("Please upload your pay slip");
      return;
    }

    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) {
      toast.error("Please enter a valid monthly income");
      return;
    }

    if (!monthlyDebt || parseFloat(monthlyDebt) < 0) {
      toast.error("Please enter a valid monthly debt amount");
      return;
    }

    if (!incomeConfirmed) {
      toast.error("Please confirm that your income information is correct");
      return;
    }

    setLoading(true);

    try {
      // Upload pay slip
      const formData = new FormData();
      formData.append("email", personalInfo.companyEmail);
      formData.append("monthlyIncome", monthlyIncome);
      formData.append("monthlyDebt", monthlyDebt);
      formData.append("payslip", paySlip);

      await api.post("/underwriting/upload-financial-info", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Financial information uploaded successfully");

      // Only proceed to decision if upload was successful
      setShowDecision(true);

      // Create order
      const orderData = {
        items: items.map((item: any) => ({
          product: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          street: shippingAddress.street,
          city: shippingAddress.city,
          county: shippingAddress.state,
          postalCode: shippingAddress.zipCode,
          country: shippingAddress.country,
        },
        customerNotes: `BNPL Application - ${
          bnplTerms.numberOfPayments
        } payments of ${formatCurrency(bnplTerms.paymentAmount)}`,
        customerInfo: {
          firstName: personalInfo.firstName,
          middleName: personalInfo.middleName || undefined,
          lastName: personalInfo.lastName,
          email: personalInfo.companyEmail,
          phoneCountryCode: personalInfo.phoneCountryCode,
          phoneNumber: personalInfo.phoneNumber,
          dateOfBirth: new Date(personalInfo.dateOfBirth),
          nationalId: personalInfo.nationalId,
        },
        payment: {
          method: "paya_bnpl",
          status: "pending",
          bnpl: {
            loanAmount: bnplTerms.totalAmount,
            loanTerm: 30,
            agreementAccepted: false,
            advanceRate: 0.99,
            advanceAmount: bnplTerms.totalAmount * 0.99,
          },
        },
      };

      const response = await api.post("/orders", orderData);
      const orderId = response.data.order._id;
      const orderNumber = response.data.order.orderNumber;
      localStorage.setItem("currentOrderId", orderId);
      localStorage.setItem("currentOrderNumber", orderNumber);

      await api.patch(`/orders/${orderId}/status`, {
        status: "underwriting",
        note: "BNPL underwriting started",
      });

      // Simulate underwriting process
      setTimeout(async () => {
        try {
          // Try to fetch user data by email to get credit info
          let userData = null;
          try {
            const userResponse = await api.get(
              `/users/by-email/${encodeURIComponent(personalInfo.companyEmail)}`
            );
            userData = userResponse.data.user;
            console.log("User data found:", userData);
          } catch (error: any) {
            console.log(
              "No user found with this email:",
              error.response?.data?.message || error.message
            );
            // If no user found, reject the application
            toast.error(
              "Email not found in HR system. Please contact your employer."
            );
            await api.patch(`/orders/${orderId}/status`, {
              status: "rejected",
              note: "BNPL application rejected: Email not found in HR system",
            });
            setUnderwritingResult({
              approved: false,
              reasons: [
                "Email not found in HR system. Please ensure you are using your company email address.",
              ],
              score: 0,
              maxLoanAmount: 0,
            });
            setLoading(false);
            setShowDecision(false);
            return;
          }

          // Call underwriting API to evaluate the applicant
          // Use data from HR partner (stored in user account)
          const underwritingResponse = await api.post(
            "/underwriting/model/test",
            {
              applicant: {
                age:
                  new Date().getFullYear() -
                  new Date(personalInfo.dateOfBirth).getFullYear(),
                income: userData?.employmentInfo?.monthlyIncome || 0,
                yearsEmployed: userData?.employmentInfo?.yearsEmployed || 0,
                creditScore: userData?.financialInfo?.creditScore || 0,
                defaults: userData?.financialInfo?.defaultCount || 0,
                otherObligations:
                  userData?.financialInfo?.otherObligations || 0,
              },
              loanAmount: bnplTerms.subtotal,
            }
          );

          const evaluation = underwritingResponse.data.evaluation;
          setUnderwritingResult(evaluation);

          if (evaluation.approved) {
            setCompletedSteps(prev => {
              if (!prev.includes(3)) {
                return [...prev, 3];
              }
              return prev;
            });
            // Application approved
            await api.patch(`/orders/${orderId}/status`, {
              status: "approved",
              note: "BNPL application approved",
              underwritingResult: {
                approved: evaluation.approved,
                reasons: evaluation.reasons || [],
                thresholds: underwritingResponse.data.thresholds || {},
                applicantData: {
                  age:
                    new Date().getFullYear() -
                    new Date(personalInfo.dateOfBirth).getFullYear(),
                  income: userData?.employmentInfo?.monthlyIncome || 0,
                  yearsEmployed: userData?.employmentInfo?.yearsEmployed || 0,
                  creditScore: userData?.financialInfo?.creditScore || 0,
                  defaults: userData?.financialInfo?.defaultCount || 0,
                  otherObligations:
                    userData?.financialInfo?.otherObligations || 0,
                },
              },
            });
            setLoading(false);
            setShowDecision(false);
            setShowApproval(true); // Show approval screen
          } else {
            // Application rejected
            console.log(
              "Application rejected, updating order status to rejected..."
            );
            console.log("Order ID:", orderId);
            console.log("Rejection reasons:", evaluation.reasons);

            const rejectionResponse = await api.patch(
              `/orders/${orderId}/status`,
              {
                status: "rejected",
                note: `BNPL application rejected: ${evaluation.reasons.join(
                  ", "
                )}`,
                underwritingResult: {
                  approved: evaluation.approved,
                  reasons: evaluation.reasons || [],
                  thresholds: underwritingResponse.data.thresholds || {},
                  applicantData: {
                    age:
                      new Date().getFullYear() -
                      new Date(personalInfo.dateOfBirth).getFullYear(),
                    income: userData?.employmentInfo?.monthlyIncome || 0,
                    yearsEmployed: userData?.employmentInfo?.yearsEmployed || 0,
                    creditScore: userData?.financialInfo?.creditScore || 0,
                    defaults: userData?.financialInfo?.defaultCount || 0,
                    otherObligations:
                      userData?.financialInfo?.otherObligations || 0,
                  },
                },
              }
            );

            console.log(
              "Rejection status update response:",
              rejectionResponse.data
            );
            setLoading(false);
            setShowDecision(false); // Hide decision processing
          }
        } catch (error: any) {
          console.error("Error during underwriting:", error);
          console.error("Error details:", error.response?.data);
          setLoading(false);
          toast.error(
            error.response?.data?.message ||
              "Error processing application. Please try again."
          );
        }
      }, 3000);
    } catch (error: any) {
      console.error("Error creating order:", error);
      setLoading(false);
      setShowDecision(false);
      toast.error(
        error.response?.data?.message ||
          "Failed to process application. Please try again."
      );
    }
  };

  const handleAgreementSubmit = async () => {
    if (!agreementAccepted) {
      toast.error("Please accept the BNPL agreement to continue");
      return;
    }

    setLoading(true);

    try {
      const orderId = localStorage.getItem("currentOrderId");
      const orderNumber = localStorage.getItem("currentOrderNumber");

      if (orderId) {
        await api.patch(`/orders/${orderId}/status`, {
          status: "paid",
          note: "BNPL agreement accepted and payment completed",
        });
      }

      setLoading(false);
      toast.success("Order completed successfully!");

      setCompletedOrderDetails({
        orderNumber: orderNumber,
        items: items.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        bnplTerms,
        personalInfo,
        shippingAddress,
      });

      // Show completion screen first - don't clear cart yet
      setShowAgreement(false);
      setShowCompletion(true); // Show completion screen within step 3
      localStorage.removeItem("currentOrderId");
      localStorage.removeItem("currentOrderNumber");
    } catch (error) {
      console.error("Order completion error:", error);
      setLoading(false);
      toast.error("Failed to complete order. Please try again.");
    }
  };

  const renderPersonalInfoStep = () => (
    <Box component="form" onSubmit={handlePersonalInfoSubmit}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Step 1 of 6
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Personal Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please provide your personal details for the BNPL application
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="First Name"
          required
          fullWidth
          value={personalInfo.firstName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, firstName: e.target.value })
          }
        />
        <TextField
          label="Middle Name"
          fullWidth
          value={personalInfo.middleName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, middleName: e.target.value })
          }
          helperText="Optional"
        />
        <TextField
          label="Last Name"
          required
          fullWidth
          value={personalInfo.lastName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, lastName: e.target.value })
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Date of Birth"
          type="date"
          required
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={personalInfo.dateOfBirth}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })
          }
        />
        <TextField
          label="Company Email Address"
          type="email"
          required
          fullWidth
          placeholder="your.name@company.com"
          value={personalInfo.companyEmail}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, companyEmail: e.target.value })
          }
          helperText="We'll verify your employment through your HR system"
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          label="National ID Number"
          required
          fullWidth
          placeholder="12345678"
          value={personalInfo.nationalId}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ""); // Only allow digits
            if (value.length <= 8) {
              setPersonalInfo({ ...personalInfo, nationalId: value });
            }
          }}
          helperText="Enter your Kenya National ID number (8 digits)"
          inputProps={{
            maxLength: 8,
          }}
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          label="Phone Number"
          required
          fullWidth
          placeholder={
            personalInfo.phoneCountryCode === "+1"
              ? "2025551234"
              : personalInfo.phoneCountryCode === "+27"
              ? "821234567"
              : personalInfo.phoneCountryCode === "+255"
              ? "712345678"
              : "712345678"
          }
          value={personalInfo.phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ""); // Only allow digits
            const maxLength =
              personalInfo.phoneCountryCode === "+1"
                ? 10
                : personalInfo.phoneCountryCode === "+27"
                ? 9
                : personalInfo.phoneCountryCode === "+255"
                ? 9
                : 9; // Kenya default
            if (value.length <= maxLength) {
              setPersonalInfo({ ...personalInfo, phoneNumber: value });
            }
          }}
          helperText={
            personalInfo.phoneCountryCode === "+1"
              ? "Enter 10 digits"
              : personalInfo.phoneCountryCode === "+27"
              ? "Enter 9 digits"
              : personalInfo.phoneCountryCode === "+255"
              ? "Enter 9 digits"
              : "Enter 9 digits"
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TextField
                  select
                  value={personalInfo.phoneCountryCode}
                  onChange={(e) => {
                    setPersonalInfo({
                      ...personalInfo,
                      phoneCountryCode: e.target.value,
                      phoneNumber: "",
                    });
                  }}
                  variant="standard"
                  sx={{
                    minWidth: "120px",
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <MenuItem value="+254">🇰🇪 +254</MenuItem>
                  <MenuItem value="+1">🇺🇸 +1</MenuItem>
                  <MenuItem value="+27">🇿🇦 +27</MenuItem>
                  <MenuItem value="+255">🇹🇿 +255</MenuItem>
                </TextField>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/cart")}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderRadius: 2,
            borderWidth: 1,
            borderColor: "#667FEA",
            color: "#667FEA",
            py: 1.5,
            px: 3,
            "&:hover": {
              borderWidth: 2,
            },
          }}
        >
          Back to Cart
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderRadius: 2,
            py: 1.5,
            px: 4,
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.5)",
            },
            bgcolor: "#667FEA",
          }}
        >
          Continue to Verification
        </Button>
      </Box>
    </Box>
  );

  const renderOtpStep = () => (
    <Box component="form" onSubmit={handleOtpSubmit}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Step 2 of 6
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Email Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We've sent a 6-digit verification code to{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "#667FEA" }}>
            {personalInfo.companyEmail}
          </Box>
        </Typography>
      </Box>

      <TextField
        label="Enter OTP Code"
        required
        fullWidth
        placeholder="123456"
        value={otp}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, ""); // Only allow digits
          if (value.length <= 6) {
            setOtp(value);
          }
        }}
        inputProps={{
          maxLength: 6,
          style: {
            fontSize: "2rem",
            textAlign: "center",
            letterSpacing: "1rem",
            fontWeight: 600,
          },
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            bgcolor: "grey.50",
            "& fieldset": {
              borderWidth: 2,
            },
            "&:hover fieldset": {
              borderColor: "#667FEA",
            },
            "&.Mui-focused fieldset": {
              borderWidth: 2,
            },
          },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Button
          variant="text"
          onClick={handleResendOtp}
          size="small"
          sx={{ color: "#667FEA" }}
        >
          Didn't receive the code? Resend OTP
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentStep(0)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderRadius: 1,
            color: "#667FEA",
            borderColor: "#667FEA",
            borderWidth: 2,
            py: 1.5,
            px: 3,
            "&:hover": {
              borderWidth: 2,
              borderColor: "#667FEA",
            },
          }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          // bgcolor="#667FEA"
          size="large"
          disabled={otp.length !== 6}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
        >
          Verify & Continue
        </Button>
      </Box>
    </Box>
  );

  const renderShippingStep = () => (
    <Box component="form" onSubmit={handleShippingSubmit}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Step 3 of 6
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Shipping Address
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Where should we deliver your order?
        </Typography>
      </Box>

      <TextField
        label="Street Address"
        required
        fullWidth
        placeholder="123 Main Street"
        value={shippingAddress.street}
        onChange={(e) =>
          setShippingAddress({ ...shippingAddress, street: e.target.value })
        }
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 2,
        }}
      >
        <TextField
          label="City"
          required
          fullWidth
          placeholder="Nairobi"
          value={shippingAddress.city}
          onChange={(e) =>
            setShippingAddress({ ...shippingAddress, city: e.target.value })
          }
        />
        <TextField
          label="State/County"
          required
          fullWidth
          placeholder="Nairobi County"
          value={shippingAddress.state}
          onChange={(e) =>
            setShippingAddress({ ...shippingAddress, state: e.target.value })
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 4,
        }}
      >
        <TextField
          label="ZIP/Postal Code"
          required
          fullWidth
          placeholder={
            shippingAddress.country === "South Africa"
              ? "0001"
              : shippingAddress.country === "United States" ||
                shippingAddress.country === "USA"
              ? "10001"
              : "00100"
          }
          value={shippingAddress.zipCode}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, ""); // Only allow digits
            const maxLength =
              shippingAddress.country === "South Africa"
                ? 4
                : shippingAddress.country === "United States" ||
                  shippingAddress.country === "USA"
                ? 5
                : 5; // Kenya, Tanzania default
            if (value.length <= maxLength) {
              setShippingAddress({ ...shippingAddress, zipCode: value });
            }
          }}
          helperText={
            shippingAddress.country === "South Africa"
              ? "Max 4 digits"
              : shippingAddress.country === "United States" ||
                shippingAddress.country === "USA"
              ? "Max 5 digits"
              : "Max 5 digits"
          }
        />
        <TextField
          label="Country"
          select
          fullWidth
          value={shippingAddress.country}
          onChange={(e) => {
            setShippingAddress({
              ...shippingAddress,
              country: e.target.value,
              zipCode: "",
            });
          }}
        >
          <MenuItem value="Kenya">Kenya</MenuItem>
          <MenuItem value="United States">United States</MenuItem>
          <MenuItem value="South Africa">South Africa</MenuItem>
          <MenuItem value="Tanzania">Tanzania</MenuItem>
        </TextField>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentStep(1)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "#667FEA",
            color: "#667FEA",
          }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          // color="primary"
          size="large"
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
        >
          Continue to Income Verification
        </Button>
      </Box>
    </Box>
  );

  const renderPaySlipStep = () => (
    <Box component="form" onSubmit={handlePaySlipSubmit}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Step 4 of 5
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Income Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload your pay slip and confirm your financial information
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 3,
          p: 3,
          border: "2px dashed",
          borderColor: paySlip ? "success.main" : "grey.300",
          borderRadius: 2,
          bgcolor: paySlip ? "success.50" : "grey.50",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: "#667FEA",
            bgcolor: "primary.50",
          },
        }}
        onClick={() => document.getElementById("payslip-upload")?.click()}
      >
        <input
          id="payslip-upload"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setPaySlip(e.target.files[0]);
              toast.success("Pay slip uploaded successfully");
            }
          }}
        />
        {paySlip ? (
          <Box>
            <Typography sx={{ fontSize: "3rem", mb: 1 }}>✅</Typography>
            <Typography variant="body1" fontWeight={600} color="success.main">
              {paySlip.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to change file
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: "3rem", mb: 1 }}>📄</Typography>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Upload Your Pay Slip
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to select a file (PDF, JPG, or PNG)
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Monthly Income (KES)"
          required
          fullWidth
          type="number"
          placeholder="50000"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">KES</InputAdornment>
            ),
          }}
          helperText="Enter your gross monthly income"
        />
        <TextField
          label="Monthly Debt Obligations (KES)"
          required
          fullWidth
          type="number"
          placeholder="10000"
          value={monthlyDebt}
          onChange={(e) => setMonthlyDebt(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">KES</InputAdornment>
            ),
          }}
          helperText="Total monthly loan/credit payments"
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={incomeConfirmed}
            onChange={(e) => setIncomeConfirmed(e.target.checked)}
            sx={{ color: "#667FEA" }}
          />
        }
        label="I confirm that the income information I have entered is accurate and true"
        sx={{ mb: 4 }}
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => setCurrentStep(2)}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "#667FEA",
            color: "#667FEA",
          }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
        >
          {loading ? "Processing..." : "Submit for Decision"}
        </Button>
      </Box>
    </Box>
  );

  const renderUnderwritingStep = () => {
    // Show rejection if underwriting failed - full page centered layout
    if (underwritingResult && !underwritingResult.approved) {
      return null; // Will be handled by special rejection layout below
    }

    // Show loading state during underwriting
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <CircularProgress size={80} sx={{ mb: 3 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Processing Your Application
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Paya is reviewing your information and performing underwriting...
        </Typography>
        <Box sx={{ maxWidth: 400, mx: "auto", textAlign: "left" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckIcon color="success" />
            <Typography>Verifying personal information</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CheckIcon color="success" />
            <Typography>Checking employment status</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={20} />
            <Typography>Calculating payment terms</Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderApprovedStep = () => (
    <Box sx={{ width: "100%", mx: "auto" }}>
      <Box
        sx={{
          textAlign: "center",
          mb: 4,
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, #667eea15 0%, #667FEA15 100%)",
          border: "2px solid",
          borderColor: "#667FEA",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "#50C878	",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(130, 243, 134, 0.3)",
          }}
        >
          {/* <Typography sx={{ fontSize: "3rem" }}></Typography> */}
          <CheckIcon sx={{ fontSize: "3rem", color: "white" }} />
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            background: "linear-gradient(135deg, #667eea 0%, #667FEA 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Congratulations! Your Order Was Approved
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ px: { xs: 0, sm: 3 } }}
        >
          Your Buy Now, Pay Later application has been approved! Your payments
          will be automatically deducted from your monthly payroll via your
          employer.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          mb: 3,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: "#667FEA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "white", fontSize: "1.25rem" }}>
              💳
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700}>
            Payment Terms
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total Amount
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatCurrency(bnplTerms.totalAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Interest Rate
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {bnplTerms.interestRate}%
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Number of Payments
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {bnplTerms.numberOfPayments} monthly payments
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              First Payment (Highest)
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#667FEA">
              {formatCurrency(bnplTerms.paymentAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Payments decrease each month
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Payment Schedule (Declining Balance)
        </Typography>
        <List dense>
          {bnplTerms.payments.map((payment: any) => (
            <ListItem key={payment.number} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                <ListItemText
                  primary={`Payment ${payment.number}`}
                  secondary={payment.date}
                />
                <Typography fontWeight={700} color="#667FEA">
                  {formatCurrency(payment.amount)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pl: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Principal: {formatCurrency(payment.principal)} | Interest: {formatCurrency(payment.interest)}
                </Typography>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            setShowApproval(false);
            setShowNextOfKin(true);
          }}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
        >
          Continue to Next of Kin
        </Button>
      </Box>
    </Box>
  );

  const handleNextOfKinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !nextOfKin.firstName ||
      !nextOfKin.lastName ||
      !nextOfKin.relationship ||
      !nextOfKin.phoneNumber ||
      !nextOfKin.email
    ) {
      toast.error("Please fill in all next of kin fields");
      return;
    }

    // Validate phone number length
    const phoneValidation: { [key: string]: { length: number; name: string } } =
      {
        "+254": { length: 9, name: "Kenya" },
        "+1": { length: 10, name: "USA" },
        "+27": { length: 9, name: "South Africa" },
        "+255": { length: 9, name: "Tanzania" },
      };

    const validation = phoneValidation[nextOfKin.phoneCountryCode];
    if (
      validation &&
      nextOfKin.phoneNumber.replace(/\D/g, "").length !== validation.length
    ) {
      toast.error(
        `Phone number for ${validation.name} must be exactly ${validation.length} digits`
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/underwriting/add-next-of-kin", {
        email: personalInfo.companyEmail,
        nextOfKin: {
          firstName: nextOfKin.firstName,
          lastName: nextOfKin.lastName,
          relationship: nextOfKin.relationship,
          phoneCountryCode: nextOfKin.phoneCountryCode.replace("+", ""),
          phoneNumber: nextOfKin.phoneNumber,
          email: nextOfKin.email,
        },
      });

      setLoading(false);
      toast.success("Next of kin information saved successfully");
      setShowNextOfKin(false);
      setShowAgreement(true);
    } catch (error: any) {
      console.error("Next of kin submission error:", error);
      setLoading(false);
      toast.error(
        error.response?.data?.message ||
          "Failed to save next of kin information"
      );
    }
  };

  const renderNextOfKinStep = () => (
    <Box component="form" onSubmit={handleNextOfKinSubmit}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Next of Kin
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          Add Next of Kin for BNPL Agreement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please provide emergency contact information for your Buy Now, Pay
          Later agreement
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="First Name"
          required
          fullWidth
          value={nextOfKin.firstName}
          onChange={(e) =>
            setNextOfKin({ ...nextOfKin, firstName: e.target.value })
          }
        />
        <TextField
          label="Last Name"
          required
          fullWidth
          value={nextOfKin.lastName}
          onChange={(e) =>
            setNextOfKin({ ...nextOfKin, lastName: e.target.value })
          }
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Relationship"
          select
          required
          fullWidth
          value={nextOfKin.relationship}
          onChange={(e) =>
            setNextOfKin({ ...nextOfKin, relationship: e.target.value })
          }
        >
          <MenuItem value="Spouse">Spouse</MenuItem>
          <MenuItem value="Parent">Parent</MenuItem>
          <MenuItem value="Sibling">Sibling</MenuItem>
          <MenuItem value="Child">Child</MenuItem>
          <MenuItem value="Friend">Friend</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
        <TextField
          label="Email Address"
          type="email"
          required
          fullWidth
          placeholder="nextofkin@example.com"
          value={nextOfKin.email}
          onChange={(e) =>
            setNextOfKin({ ...nextOfKin, email: e.target.value })
          }
        />
      </Box>

      <Box sx={{ mb: 4 }}>
        <TextField
          label="Phone Number"
          required
          fullWidth
          placeholder={
            nextOfKin.phoneCountryCode === "+1"
              ? "2025551234"
              : nextOfKin.phoneCountryCode === "+27"
              ? "821234567"
              : nextOfKin.phoneCountryCode === "+255"
              ? "712345678"
              : "712345678"
          }
          value={nextOfKin.phoneNumber}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "");
            const maxLength =
              nextOfKin.phoneCountryCode === "+1"
                ? 10
                : nextOfKin.phoneCountryCode === "+27"
                ? 9
                : nextOfKin.phoneCountryCode === "+255"
                ? 9
                : 9;
            if (value.length <= maxLength) {
              setNextOfKin({ ...nextOfKin, phoneNumber: value });
            }
          }}
          helperText={
            nextOfKin.phoneCountryCode === "+1"
              ? "Enter 10 digits"
              : nextOfKin.phoneCountryCode === "+27"
              ? "Enter 9 digits"
              : nextOfKin.phoneCountryCode === "+255"
              ? "Enter 9 digits"
              : "Enter 9 digits"
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TextField
                  select
                  value={nextOfKin.phoneCountryCode}
                  onChange={(e) =>
                    setNextOfKin({
                      ...nextOfKin,
                      phoneCountryCode: e.target.value,
                      phoneNumber: "",
                    })
                  }
                  variant="standard"
                  sx={{
                    minWidth: "120px",
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <MenuItem value="+254">🇰🇪 +254</MenuItem>
                  <MenuItem value="+1">🇺🇸 +1</MenuItem>
                  <MenuItem value="+27">🇿🇦 +27</MenuItem>
                  <MenuItem value="+255">🇹🇿 +255</MenuItem>
                </TextField>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            setShowNextOfKin(false);
            setShowApproval(true);
          }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "#667FEA",
            color: "#667FEA",
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
              borderColor: "#667FEA",
            },
          }}
        >
          Back to Payment Plan
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            width: { xs: "100%", sm: "auto" },
            bgcolor: "#667FEA",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.5)",
            },
          }}
        >
          {loading ? "Saving..." : "Continue to Agreement"}
        </Button>
      </Box>
    </Box>
  );

  const renderAgreementStep = () => (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.5,
            mb: 2,
            px: 2,
            py: 1,
            bgcolor: "primary.50",
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#667FEA",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{
              color: "#667FEA",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Agreement Terms
          </Typography>
        </Box>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
        >
          BNPL Agreement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please review and accept the terms and conditions
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: 1,
          borderColor: "divider",
          mb: 3,
          maxHeight: 400,
          overflow: "auto",
        }}
      >
        <Typography variant="h6" gutterBottom>
          Buy Now, Pay Later Agreement
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>
            This agreement is between you and Paya Financial Services.
          </strong>
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Terms and Conditions:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body2" paragraph>
            You agree to pay the total amount of{" "}
            {formatCurrency(bnplTerms.totalAmount)} in{" "}
            {bnplTerms.numberOfPayments} monthly installments using declining balance method.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Monthly payments will decrease from {formatCurrency(bnplTerms.payments[0]?.amount || 0)} to{" "}
            {formatCurrency(bnplTerms.payments[bnplTerms.payments.length - 1]?.amount || 0)} and will be
            automatically deducted from your payroll.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            An interest rate of {bnplTerms.interestRate}% has been applied to
            the total purchase amount.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Payments will begin 30 days from the date of purchase.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Late payment fees may apply if payments are not processed
            successfully.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            You have the right to pay off the balance early without penalty.
          </Typography>
          <Typography component="li" variant="body2">
            This agreement is governed by the laws of Kenya.
          </Typography>
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Your Rights:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <Typography component="li" variant="body2" paragraph>
            You may cancel this agreement within 14 days of signing.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            You have the right to dispute any charges you believe are incorrect.
          </Typography>
          <Typography component="li" variant="body2">
            You can contact customer service at support@paya.co.ke for
            assistance.
          </Typography>
        </Box>
      </Paper>

      <FormControlLabel
        control={
          <Checkbox
            checked={agreementAccepted}
            onChange={(e) => setAgreementAccepted(e.target.checked)}
            sx={{
              color: "#667FEA",
              "&.Mui-checked": {
                color: "#667FEA",
              },
            }}
          />
        }
        label="I have read and agree to the terms and conditions of this BNPL agreement"
        sx={{ mb: 4 }}
      />

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => {
            setShowAgreement(false);
            setShowNextOfKin(true);
          }}
          sx={{
            width: { xs: "100%", sm: "auto" },
            borderColor: "#667FEA",
            color: "#667FEA",
            borderWidth: 2,
            "&:hover": {
              borderWidth: 2,
              borderColor: "#667FEA",
            },
          }}
        >
          Back to Next of Kin
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleAgreementSubmit}
          disabled={!agreementAccepted || loading}
          sx={{
            width: { xs: "100%", sm: "auto" },
            bgcolor: "#667FEA",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            "&:hover": {
              boxShadow: "0 6px 16px rgba(102, 126, 234, 0.5)",
            },
          }}
        >
          {loading ? "Processing..." : "I Agree - Complete Order"}
        </Button>
      </Box>
    </Box>
  );

  const renderCompletedStep = () => {
    const orderDetails = completedOrderDetails || {
      items: items,
      bnplTerms: bnplTerms,
    };

    return (
      <Box sx={{ textAlign: "center" }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "#50C878	",
            display: "grid",
            placeItems: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(76, 175, 80, 0.3)",
          }}
        >
          {/* <CheckIcon sx={{ fontSize: "3rem", color: "white" }} /> */}
          <ShoppingBag sx={{ fontSize: "3rem", color: "white" }} />
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            background: "linear-gradient(135deg, #667eea 0%, #667FEA 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 2,
          }}
        >
          Order Completed Successfully!
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 4, px: { xs: 0, sm: 2 } }}
        >
          Thank you for your purchase! Your order has been confirmed and you
          will receive email confirmations shortly. Your first payment will be
          deducted from your payroll next month.
        </Typography>

        <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            What's Next?
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2">
              📧 You'll receive order confirmation emails
            </Typography>
            <Typography component="li" variant="body2">
              📦 Your items will be shipped to the provided address
            </Typography>
            <Typography component="li" variant="body2">
              💳 First payment will be deducted next month
            </Typography>
            <Typography component="li" variant="body2">
              📱 Track your payments in your Paya account
            </Typography>
          </Box>
        </Alert>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            border: 1,
            borderColor: "divider",
            mb: 3,
            textAlign: "left",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="h6" fontWeight={700}>
              Order Summary
            </Typography>
            {orderDetails.orderNumber && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                #{orderDetails.orderNumber}
              </Typography>
            )}
          </Box>
          {orderDetails.items.map((item: any) => (
            <Box
              key={item.id}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1.5,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Qty: {item.quantity}
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(item.price * item.quantity)}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">Subtotal:</Typography>
            <Typography variant="body2">
              {formatCurrency(orderDetails.bnplTerms.subtotal)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2">Interest (8%):</Typography>
            <Typography variant="body2">
              {formatCurrency(orderDetails.bnplTerms.totalInterest)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight={700}>
              Total:
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#667FEA">
              {formatCurrency(orderDetails.bnplTerms.totalAmount)}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            border: 1,
            borderColor: "divider",
            mb: 3,
            textAlign: "left",
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Payment Plan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your payments will be automatically deducted from your payroll on
            the following dates
          </Typography>

          <Box sx={{ mb: 2, display: { xs: "none", md: "block" } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1.5fr 0.8fr 1fr 1fr 1.2fr",
                gap: 2,
                p: 1.5,
                bgcolor: "grey.100",
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                PAYMENT
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                DATE
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
              >
                STATUS
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                textAlign="right"
              >
                PRINCIPAL
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                textAlign="right"
              >
                INTEREST
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                textAlign="right"
              >
                TOTAL
              </Typography>
            </Box>

            {orderDetails.bnplTerms.payments.map((payment: any) => (
                <Box
                  key={payment.number}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr 0.8fr 1fr 1fr 1.2fr",
                    gap: 2,
                    p: 1.5,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    alignItems: "center",
                    "&:hover": {
                      bgcolor: "grey.50",
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    Payment {payment.number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {payment.date}
                  </Typography>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      bgcolor: "#FEF3C7",
                      borderRadius: 1,
                      display: "inline-block",
                      width: "fit-content",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ color: "#92400E" }}
                    >
                      Pending
                    </Typography>
                  </Box>
                  <Typography variant="body2" textAlign="right">
                    {formatCurrency(payment.principal)}
                  </Typography>
                  <Typography variant="body2" textAlign="right">
                    {formatCurrency(payment.interest)}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#667FEA"
                    textAlign="right"
                  >
                    {formatCurrency(payment.amount)}
                  </Typography>
                </Box>
              ))}
          </Box>

          {/* Mobile view */}
          <Box sx={{ mb: 2, display: { xs: "block", md: "none" } }}>
            {orderDetails.bnplTerms.payments.map((payment: any) => (
                <Box
                  key={payment.number}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Payment {payment.number}
                    </Typography>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        bgcolor: "#FEF3C7",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: "#92400E" }}
                      >
                        Pending
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1.5 }}
                  >
                    {payment.date}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Principal:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(payment.principal)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Interest:
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(payment.interest)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Total:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#667FEA"
                    >
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </Box>
                </Box>
              ))}
          </Box>

          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 2,
              bgcolor: "#DBEAFE",
              borderRadius: 1,
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: "#667FEA", fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Total Amount to Pay:
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: "#667FEA", fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {formatCurrency(orderDetails.bnplTerms.totalAmount)}
            </Typography>
          </Box>
        </Paper>

        <Button
          variant="contained"
          // color="primary"
          size="large"
          onClick={() => {
            clearCart();
            navigate("/marketplace");
          }}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
        >
          Back to Shop
        </Button>
      </Box>
    );
  };

  if (items.length === 0 && currentStep < 5) {
    return (
      <Container
        maxWidth="md"
        sx={{ pt: 8, pb: 8, textAlign: "center", px: { xs: 2, sm: 3 } }}
      >
        <Typography sx={{ fontSize: { xs: "4rem", sm: "5rem" }, mb: 2 }}>
          🛒
        </Typography>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{ fontSize: { xs: "1.75rem", sm: "2.125rem" } }}
        >
          Your cart is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Add some items to your cart before checking out.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => navigate("/marketplace")}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  // Show rejection page with centered layout (no stepper, no sidebar)
  if (underwritingResult && !underwritingResult.approved) {
    return (
      <Container
        maxWidth="md"
        sx={{ pt: { xs: 2, sm: 3 }, pb: 8, px: { xs: 2, sm: 3 } }}
      >
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, sm: 6 }, border: 1, borderColor: "divider" }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Box
              sx={{
                width: { xs: 50, sm: 60 },
                height: { xs: 50, sm: 60 },
                borderRadius: "50%",
                bgcolor: "#ffebee",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                  color: "#d32f2f",
                }}
              >
                ❌
              </Typography>
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              color="error.main"
              sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
            >
              Application Not Approved
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 600, mx: "auto" }}
            >
              We're sorry, but your BNPL application was not approved at this
              time. Please review the reasons below.
            </Typography>

            <Box
              sx={{
                maxWidth: 600,
                mx: "auto",
                mb: 3,
                bgcolor: "#ffebee",
                border: "1px solid #ef5350",
                borderRadius: 1,
                p: { xs: 1.5, sm: 2 },
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                color="error.main"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Rejection Reasons:
              </Typography>
              <Box sx={{ mt: 1 }}>
                {underwritingResult.reasons.map(
                  (reason: string, index: number) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        color: "error.dark",
                        mb: 0.5,
                        fontWeight: 500,
                        fontSize: { xs: "0.875rem", sm: "0.875rem" },
                      }}
                    >
                      • {reason}
                    </Typography>
                  )
                )}
              </Box>
            </Box>

            <Alert
              severity="info"
              sx={{ maxWidth: 600, mx: "auto", mb: 3, textAlign: "left" }}
            >
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: "0.875rem", sm: "0.875rem" } }}
              >
                <strong>What can you do?</strong>
                <br />
                • Contact your HR department to update your employment
                information
                <br />
                • Check your credit score and work on improving it
                <br />
                • Reduce other financial obligations before reapplying
                <br />• Contact our support team if you believe there's an error
              </Typography>
            </Alert>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                variant="outlined"
                // color="primary"
                onClick={() => navigate("/marketplace")}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderColor: "#667FEA",
                  color: "#667FEA",
                }}
              >
                Return to Marketplace
              </Button>
              <Button
                variant="contained"
                // color="#667FEA"
                onClick={() => navigate("/support")}
                sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#667FEA" }}
              >
                Contact Support
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        pt: { xs: 3, sm: 4 },
        pb: 8,
        px: { xs: 2, sm: 3 },
        marginTop: "-70px",
      }}
    >
      {/* Header with Back Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/cart")}
          sx={{
            mb: 2,
            color: "#667FEA",
            borderColor: "#667FEA",
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.95rem",
            "&:hover": {
              bgcolor: "action.hover",
              color: "#667FEA",
            },
          }}
        >
          Back to Cart
        </Button>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.25rem" },
            color: "#667FEA",
            letterSpacing: "-0.02em",
            mb: 0.5,
          }}
        >
          Buy Now, Pay Later
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1rem", fontWeight: 400 }}
        >
          Complete your purchase with flexible payment options
        </Typography>
      </Box>

      {/* Desktop Stepper */}
      <Box sx={{ mb: 5, display: { xs: "none", sm: "block" } }}>
        <Stepper
          activeStep={showCompletion ? 4 : currentStep}
          sx={{
            "& .MuiStepLabel-root .Mui-completed": {
              color: "#50C878",
            },
            "& .MuiStepLabel-root .Mui-active": {
              color: "#667FEA",
            },
            "& .MuiStepLabel-label": {
              fontSize: "0.875rem",
              fontWeight: 500,
            },
          }}
        >
          {steps.map((label, index) => (
            <Step
              key={label}
              completed={completedSteps.includes(index) || (showCompletion && index === 3)}
            >
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Mobile Progress Indicator */}
      <Box
        sx={{
          mb: 3,
          display: { xs: "block", sm: "none" },
          bgcolor: "grey.50",
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            STEP {showCompletion ? 5 : currentStep + 1} OF {steps.length}
          </Typography>
          <Typography variant="caption" color="#667FEA" fontWeight={600}>
            {showCompletion
              ? 100
              : Math.round(((currentStep + 1) / steps.length) * 100)}
            %
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
          {showCompletion ? steps[4] : steps[currentStep]}
        </Typography>
        <Box
          sx={{
            height: 6,
            bgcolor: "grey.200",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${
                showCompletion ? 100 : ((currentStep + 1) / steps.length) * 100
              }%`,
              bgcolor: "#667FEA",
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>

      {currentStep < 4 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md:
                showDecision ||
                showApproval ||
                showNextOfKin ||
                showAgreement ||
                showCompletion
                  ? "1fr"
                  : "2fr 1fr",
            },
            gap: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "background.paper",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.2s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              },
            }}
          >
            {currentStep === 0 && renderPersonalInfoStep()}
            {currentStep === 1 && renderOtpStep()}
            {currentStep === 2 && renderShippingStep()}
            {currentStep === 3 && (
              <>
                {!showDecision &&
                  !showApproval &&
                  !showNextOfKin &&
                  !showAgreement &&
                  !showCompletion &&
                  renderPaySlipStep()}
                {showDecision && renderUnderwritingStep()}
                {showApproval && renderApprovedStep()}
                {showNextOfKin && renderNextOfKinStep()}
                {showAgreement && renderAgreementStep()}
                {showCompletion && renderCompletedStep()}
              </>
            )}
          </Paper>

          {currentStep < 4 &&
            !showDecision &&
            !showApproval &&
            !showNextOfKin &&
            !showAgreement &&
            !showCompletion && (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 3.5 },
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  height: "fit-content",
                  position: { xs: "relative", md: "sticky" },
                  top: { xs: 0, md: 100 },
                  order: { xs: -1, md: 0 },
                  bgcolor: "grey.50",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{
                    mb: 3,
                    fontSize: "1.125rem",
                    color: "#667FEA",
                  }}
                >
                  Order Summary
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {items.map((item: any, index: number) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        py: 1.5,
                        gap: 2,
                        borderBottom:
                          index < items.length - 1 ? "1px solid" : "none",
                        borderColor: "divider",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ mb: 0.25, lineHeight: 1.4 }}
                        >
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Quantity: {item.quantity}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ whiteSpace: "nowrap", color: "#667FEA" }}
                      >
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    pt: 2.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(getSubtotal())}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Interest ({bnplTerms.interestRate}%)
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {formatCurrency(bnplTerms.totalAmount - getSubtotal())}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      pt: 2.5,
                      borderTop: "2px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="h6" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="#667FEA">
                      {formatCurrency(bnplTerms.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
        </Box>
      )}

      {currentStep === 4 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {renderCompletedStep()}
        </Paper>
      )}
    </Container>
  );
};

export default Checkout;
