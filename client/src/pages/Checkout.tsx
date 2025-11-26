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
} from "@mui/icons-material";
import api from "../utils/api";
import toast from "react-hot-toast";

const steps = [
  "Personal Info",
  "OTP Verification",
  "Shipping",
  "Decision",
  "BNPL Agreement",
  "Complete",
];

const Checkout = () => {
  const { items, getSubtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState<any>(null);

  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    companyEmail: "",
    phoneCountryCode: "+254",
    phoneNumber: "",
    kraPin: "",
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
    interestRate: 8,
    numberOfPayments: 4,
    paymentAmount: 0,
    payments: [] as any[],
  });

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [underwritingResult, setUnderwritingResult] = useState<any>(null);

  // OTP state
  const [otp, setOtp] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    const subtotal = getSubtotal();
    const totalInterest =
      subtotal * (bnplTerms.interestRate / 100) * bnplTerms.numberOfPayments;
    const totalWithInterest = subtotal + totalInterest;
    const paymentAmount = totalWithInterest / bnplTerms.numberOfPayments;

    const payments: Array<{ number: number; amount: number; date: string }> =
      [];
    const today = new Date();
    for (let i = 0; i < bnplTerms.numberOfPayments; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      payments.push({
        number: i + 1,
        amount: paymentAmount,
        date: paymentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });
    }

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
      !personalInfo.kraPin
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
        lastName: personalInfo.lastName,
        dateOfBirth: personalInfo.dateOfBirth,
        companyEmail: personalInfo.companyEmail,
        phoneCountryCode: personalInfo.phoneCountryCode.replace('+', ''),
        phoneNumber: personalInfo.phoneNumber,
        kraPin: personalInfo.kraPin,
      });

      // OTP sent via SMS automatically
      toast.success(
        `OTP sent to ${personalInfo.phoneCountryCode} ${personalInfo.phoneNumber}`
      );
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
        `New OTP sent to ${personalInfo.phoneCountryCode} ${personalInfo.phoneNumber}`
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

    setLoading(true);
    setCurrentStep(3); // Move to Decision step (adjusted for OTP step)

    try {
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
          lastName: personalInfo.lastName,
          email: personalInfo.companyEmail,
          phoneCountryCode: personalInfo.phoneCountryCode,
          phoneNumber: personalInfo.phoneNumber,
          dateOfBirth: new Date(personalInfo.dateOfBirth),
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
            setCurrentStep(3); // Stay on Decision step
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
            setCurrentStep(4); // Move to BNPL Agreement step
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
            setCurrentStep(3); // Stay on Decision step to show rejection
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
    } catch (error) {
      console.error("Error creating order:", error);
      setLoading(false);
      toast.error("Failed to process application. Please try again.");
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

      clearCart();
      setCurrentStep(6); // Move to Complete step
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
              bgcolor: "#4f46e5",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Step 1 of 6
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
          Personal Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please provide your personal details for the BNPL application
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
          value={personalInfo.firstName}
          onChange={(e) =>
            setPersonalInfo({ ...personalInfo, firstName: e.target.value })
          }
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
          label="KRA PIN"
          required
          fullWidth
          placeholder="A001234567Z"
          value={personalInfo.kraPin}
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            if (value.length <= 11) {
              setPersonalInfo({ ...personalInfo, kraPin: value });
            }
          }}
          helperText="Enter your Kenya Revenue Authority PIN (11 characters)"
          inputProps={{
            maxLength: 11,
            style: { textTransform: 'uppercase' }
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
            borderColor: "#4f46e5",
            color: "#4f46e5",
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
            bgcolor: "#4f46e5",
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
              bgcolor: "#4f46e5",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Step 2 of 6
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
          Phone Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We've sent a 6-digit verification code to{" "}
          <Box component="span" sx={{ fontWeight: 600, color: "#4f46e5" }}>
            {personalInfo.phoneCountryCode} {personalInfo.phoneNumber}
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
              borderColor: "#4f46e5",
            },
            "&.Mui-focused fieldset": {
              borderWidth: 2,
            },
          },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Button variant="text" onClick={handleResendOtp} size="small"
        sx={{ color: "#4f46e5" }}>
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
          sx={{ width: { xs: "100%", sm: "auto" },
            borderRadius: 1,
            color: "#4f46e5",
            borderColor: "#4f46e5",
            borderWidth: 2,
            py: 1.5,
            px: 3,
            "&:hover": {
              borderWidth: 2,
              borderColor: "#4f46e5",
            },
         }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          // bgcolor="#4f46e5"
          size="large"
          disabled={otp.length !== 6}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
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
              bgcolor: "#4f46e5",
            }}
          />
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px" }}
          >
            Step 3 of 6
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}>
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
          sx={{ width: { xs: "100%", sm: "auto" }, borderColor: "#4f46e5", color: "#4f46e5" }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          // color="primary"
          size="large"
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
        >
          Submit Application
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
    <Box>
      <Box
        sx={{
          textAlign: "center",
          mb: 4,
          p: 4,
          borderRadius: 3,
          background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)",
          border: "2px solid",
          borderColor: "#4f46e5",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "success.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
            boxShadow: "0 8px 24px rgba(76, 175, 80, 0.3)",
          }}
        >
          <Typography sx={{ fontSize: "3rem" }}>🎉</Typography>
        </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
              bgcolor: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "white", fontSize: "1.25rem" }}>💳</Typography>
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
              Payment Amount
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#4f46e5">
              {formatCurrency(bnplTerms.paymentAmount)}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Payment Schedule
        </Typography>
        <List dense>
          {bnplTerms.payments.map((payment) => (
            <ListItem key={payment.number} sx={{ px: 0 }}>
              <ListItemText
                primary={`Payment ${payment.number}`}
                secondary={payment.date}
              />
              <Typography fontWeight={600}>
                {formatCurrency(payment.amount)}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          // color="primary"
          size="large"
          onClick={() => setCurrentStep(5)}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
        >
          Accept Terms & Continue
        </Button>
      </Box>
    </Box>
  );

  const renderAgreementStep = () => (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        BNPL Agreement
      </Typography>

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
            {bnplTerms.numberOfPayments} equal monthly installments.
          </Typography>
          <Typography component="li" variant="body2" paragraph>
            Each payment of {formatCurrency(bnplTerms.paymentAmount)} will be
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
            sx={{ color: "#4f46e5" }}
          />
        }
        label="I have read and agree to the terms and conditions of this BNPL agreement"
        sx={{ mb: 3 }}
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
          onClick={() => setCurrentStep(4)}
          sx={{ width: { xs: "100%", sm: "auto" }, borderColor: "#4f46e5", color: "#4f46e5" }}
        >
          Back to Terms
        </Button>
        <Button
          variant="contained"
          // color="primary"
          size="large"
          onClick={handleAgreementSubmit}
          disabled={!agreementAccepted || loading}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
        >
          {loading ? "Processing..." : "Complete Order"}
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
              bgcolor: "success.main",
              display: "grid",
              placeItems: "center",
              mx: "auto",
              mb: 3,
              boxShadow: "0 8px 24px rgba(76, 175, 80, 0.3)",
            }}
          >
            <CheckIcon sx={{ fontSize: "3rem", color: "white" }} />
          </Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            fontSize: { xs: "1.75rem", sm: "2.125rem" },
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
            <Typography variant="h6" fontWeight={700} color="#4f46e5">
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

            {orderDetails.bnplTerms.payments.map((payment: any) => {
              const principalPerPayment =
                orderDetails.bnplTerms.subtotal /
                orderDetails.bnplTerms.numberOfPayments;
              const interestPerPayment =
                orderDetails.bnplTerms.totalInterest /
                orderDetails.bnplTerms.numberOfPayments;

              return (
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
                    {formatCurrency(principalPerPayment)}
                  </Typography>
                  <Typography variant="body2" textAlign="right">
                    {formatCurrency(interestPerPayment)}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="#4f46e5"
                    textAlign="right"
                  >
                    {formatCurrency(payment.amount)}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Mobile view */}
          <Box sx={{ mb: 2, display: { xs: "block", md: "none" } }}>
            {orderDetails.bnplTerms.payments.map((payment: any) => {
              const principalPerPayment =
                orderDetails.bnplTerms.subtotal /
                orderDetails.bnplTerms.numberOfPayments;
              const interestPerPayment =
                orderDetails.bnplTerms.totalInterest /
                orderDetails.bnplTerms.numberOfPayments;

              return (
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
                      {formatCurrency(principalPerPayment)}
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
                      {formatCurrency(interestPerPayment)}
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
                      color="#4f46e5"
                    >
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
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
              sx={{ color: "#4f46e5", fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              Total Amount to Pay:
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ color: "#4f46e5", fontSize: { xs: "1rem", sm: "1.25rem" } }}
            >
              {formatCurrency(orderDetails.bnplTerms.totalAmount)}
            </Typography>
          </Box>
        </Paper>

        <Button
          variant="contained"
          // color="primary"
          size="large"
          onClick={() => navigate("/marketplace")}
          sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
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
                sx={{ width: { xs: "100%", sm: "auto" }, borderColor: "#4f46e5", color: "#4f46e5" }}
              >
                Return to Marketplace
              </Button>
              <Button
                variant="contained"
                // color="#4f46e5"
                onClick={() => navigate("/support")}
                sx={{ width: { xs: "100%", sm: "auto" }, bgcolor: "#4f46e5" }}
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
      sx={{ pt: { xs: 3, sm: 4 }, pb: 8, px: { xs: 2, sm: 3 },
      marginTop:"-50px"
     }}
    >
      {/* Header with Back Button */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/cart")}
          sx={{
            mb: 2,
            color: "#4f46e5",
            borderColor: "#4f46e5",
            fontWeight: 500,
            textTransform: "none",
            fontSize: "0.95rem",
            "&:hover": {
              bgcolor: "action.hover",
              color: "#4f46e5",
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
            color: "#4f46e5",
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
          activeStep={currentStep}
          sx={{
            "& .MuiStepLabel-root .Mui-completed": {
              color: "success.main",
            },
            "& .MuiStepLabel-root .Mui-active": {
              color: "#4f46e5",
            },
            "& .MuiStepLabel-label": {
              fontSize: "0.875rem",
              fontWeight: 500,
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
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
            STEP {currentStep + 1} OF {steps.length}
          </Typography>
          <Typography variant="caption" color="#4f46e5" fontWeight={600}>
            {Math.round(((currentStep + 1) / steps.length) * 100)}%
          </Typography>
        </Box>
        <Typography variant="body2" fontWeight={700} sx={{ mb: 1.5 }}>
          {steps[currentStep]}
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
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              bgcolor: "#4f46e5",
              transition: "width 0.3s ease",
            }}
          />
        </Box>
      </Box>

      {currentStep < 6 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
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
            {currentStep === 3 && renderUnderwritingStep()}
            {currentStep === 4 && renderApprovedStep()}
            {currentStep === 5 && renderAgreementStep()}
          </Paper>

          {currentStep < 5 && (
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
                  color: "#4f46e5",
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
                      borderBottom: index < items.length - 1 ? "1px solid" : "none",
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
                      sx={{ whiteSpace: "nowrap", color: "#4f46e5" }}
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
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="#4f46e5"
                  >
                    {formatCurrency(bnplTerms.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {currentStep === 6 && (
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
