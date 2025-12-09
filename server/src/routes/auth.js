const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const slackService = require("../../services/slackService");
const otpService = require("../../services/otpService");
const { generateOTP, getOTPExpiration } = require("../utils/otpGenerator");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// General Registration (for merchant portal)
router.post(
  "/register",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["customer", "merchant"])
      .withMessage("Valid role is required"),
    body("phone").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        phone,
        role,
        phoneNumber,
        phoneCountryCode,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create user based on role
      const userData = {
        firstName,
        lastName,
        email,
        password,
        role,
        phoneNumber: phoneNumber || phone,
        phoneCountryCode: phoneCountryCode || "+254",
        isActive: true,
        isVerified: role === "merchant" ? false : true, // Merchants need email verification
      };

      // If merchant, set pending approval status
      if (role === "merchant") {
        userData.businessInfo = {
          approvalStatus: "pending",
        };
      }

      const user = new User(userData);

      // Generate and send OTP for merchants
      if (role === "merchant") {
        const otp = generateOTP();
        user.otp = {
          code: otp,
          expiresAt: getOTPExpiration(),
          attempts: 0,
        };

        await user.save();

        // Send OTP via email
        try {
          await otpService.sendOTP(email, otp, "email");
          console.log("OTP sent successfully to:", email);
        } catch (otpError) {
          console.error("OTP sending failed:", otpError.message);
          // Continue with registration even if OTP fails
        }

        // Send Slack notification for new merchant application
        try {
          await slackService.notifyMerchantApplication(user);
        } catch (slackError) {
          console.error("Slack notification failed:", slackError.message);
        }
      } else {
        await user.save();
      }

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message:
          role === "merchant"
            ? "Merchant account created successfully. Please verify your email with the OTP sent."
            : "Account created successfully",
        token,
        user: user.toSafeObject(),
        requiresVerification: role === "merchant",
      });
    } catch (error) {
      console.error("Registration error:", error);
      res
        .status(500)
        .json({ message: "Registration failed", error: error.message });
    }
  }
);

// Customer Registration
router.post(
  "/register/customer",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Valid date of birth is required"),
    body("kraPin")
      .trim()
      .isLength({ min: 1 })
      .withMessage("KRA PIN is required"),
    body("phoneNumber").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        kraPin,
        phoneNumber,
        address,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create customer user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: "customer",
        dateOfBirth: new Date(dateOfBirth),
        kraPin: kraPin.toUpperCase(),
        phoneNumber,
        address: address || {},
        isVerified: true, // Auto-verify for now
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message: "Customer account created successfully",
        token,
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      res
        .status(500)
        .json({ message: "Registration failed", error: error.message });
    }
  }
);

// Merchant Registration
router.post(
  "/register/merchant",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("businessName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Business name is required"),
    body("businessEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid business email is required"),
    body("phoneNumber").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        email,
        password,
        businessName,
        businessEmail,
        businessRegistrationNumber,
        businessType,
        phoneNumber,
        address,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { "businessInfo.businessEmail": businessEmail }],
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists with this email or business email",
        });
      }

      // Create merchant user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        role: "merchant",
        phoneNumber,
        address: address || {},
        isVerified: false, // Set to false until email is verified
        businessInfo: {
          businessName,
          businessEmail,
          businessRegistrationNumber,
          businessType,
          approvalStatus: "pending",
        },
      });

      // Generate OTP
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: getOTPExpiration(),
        attempts: 0,
      };

      await user.save();

      // Send OTP via email
      try {
        await otpService.sendOTP(email, otp, "email");
      } catch (otpError) {
        console.error("OTP sending failed:", otpError.message);
        // Continue with registration even if OTP fails
      }

      // Send Slack notification for new merchant application
      await slackService.notifyMerchantApplication(user);

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        message:
          "Merchant account created successfully. Please verify your email with the OTP sent.",
        token,
        user: user.toSafeObject(),
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Merchant registration error:", error);
      res
        .status(500)
        .json({ message: "Registration failed", error: error.message });
    }
  }
);

// Login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").isLength({ min: 1 }).withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: "Login successful",
        token,
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed", error: error.message });
    }
  }
);

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user data" });
  }
});

// Update password
router.put(
  "/password",
  authenticateToken,
  [
    body("currentPassword")
      .isLength({ min: 1 })
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await req.user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordValid) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      req.user.password = newPassword;
      await req.user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password update error:", error);
      res.status(500).json({ message: "Password update failed" });
    }
  }
);

// Logout (client-side token removal)
router.post("/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logout successful" });
});

// Verify token (for client-side token validation)
router.get("/verify", authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user.toSafeObject(),
  });
});

// Verify OTP
router.post(
  "/verify-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email, otp } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      // Check if OTP exists
      if (!user.otp || !user.otp.code) {
        return res
          .status(400)
          .json({ message: "No OTP found. Please request a new one." });
      }

      // Check OTP expiration
      if (new Date() > user.otp.expiresAt) {
        return res
          .status(400)
          .json({ message: "OTP has expired. Please request a new one." });
      }

      // Check OTP attempts
      if (user.otp.attempts >= 5) {
        return res.status(400).json({
          message: "Too many failed attempts. Please request a new OTP.",
        });
      }

      // Verify OTP
      if (user.otp.code !== otp) {
        user.otp.attempts += 1;
        await user.save();
        return res.status(400).json({
          message: "Invalid OTP",
          attemptsRemaining: 5 - user.otp.attempts,
        });
      }

      // OTP is valid - verify user
      user.isVerified = true;
      user.otp = undefined; // Clear OTP data
      await user.save();

      res.json({
        message: "Email verified successfully",
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res
        .status(500)
        .json({ message: "Verification failed", error: error.message });
    }
  }
);

// Resend OTP
router.post(
  "/resend-otp",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      // Find user
      const user = await User.findOne({ email, isActive: true });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      // Generate new OTP
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: getOTPExpiration(),
        attempts: 0,
      };

      await user.save();

      // Send OTP via email
      try {
        await otpService.sendOTP(email, otp, "email");
        res.json({ message: "OTP sent successfully to your email" });
      } catch (otpError) {
        console.error("OTP sending failed:", otpError.message);
        res
          .status(500)
          .json({ message: "Failed to send OTP. Please try again." });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      res
        .status(500)
        .json({ message: "Failed to resend OTP", error: error.message });
    }
  }
);

// Customer: Add personal info and send OTP via SMS
router.post(
  "/customer/add-info",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("First name is required"),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Last name is required"),
    body("dateOfBirth")
      .isISO8601()
      .withMessage("Valid date of birth is required"),
    body("companyEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid company email is required"),
    body("phoneCountryCode")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Phone country code is required"),
    body("phoneNumber")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Phone number is required"),
    body("kraPin")
      .trim()
      .isLength({ min: 1 })
      .withMessage("KRA PIN is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        firstName,
        lastName,
        dateOfBirth,
        companyEmail,
        phoneCountryCode,
        phoneNumber,
        kraPin,
      } = req.body;

      // Check if user already exists with this email
      let user = await User.findOne({ email: companyEmail });

      if (user) {
        // User exists - update their info and send new OTP
        user.firstName = firstName;
        user.lastName = lastName;
        user.dateOfBirth = new Date(dateOfBirth);
        user.phoneCountryCode = phoneCountryCode;
        user.phoneNumber = phoneNumber;
        user.kraPin = kraPin.toUpperCase();
        user.isVerified = false; // Reset verification status to allow re-verification
      } else {
        // Create new customer user (without password - will be set later)
        user = new User({
          firstName,
          lastName,
          email: companyEmail,
          dateOfBirth: new Date(dateOfBirth),
          phoneCountryCode,
          phoneNumber,
          kraPin: kraPin.toUpperCase(),
          role: "customer",
          isVerified: false,
          isActive: true,
          password: Math.random().toString(36).slice(-8) + "Temp123!", // Temporary password
        });
      }

      // Generate OTP
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: getOTPExpiration(),
        attempts: 0,
      };

      await user.save();

      // Format phone number for display
      const fullPhoneNumber = `${phoneCountryCode}${phoneNumber}`;

      // Send OTP via email
      try {
        await otpService.sendOTP(companyEmail, otp, "email");
        console.log("Email OTP sent successfully to:", companyEmail);
      } catch (otpError) {
        console.error("Email OTP sending failed:", otpError.message);
        // Continue even if email fails - for development
      }

      res.status(200).json({
        message: "Customer information saved. OTP sent via email.",
        otp: otp, // Include OTP in response for development/testing
        customerInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: fullPhoneNumber,
        },
      });
    } catch (error) {
      console.error("Customer add-info error:", error);
      res.status(500).json({
        message: "Failed to save customer information",
        error: error.message,
      });
    }
  }
);

// Customer: Verify OTP from SMS
router.post(
  "/customer/verify-otp",
  [
    body("companyEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("otp")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be 6 digits"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { companyEmail, otp } = req.body;

      // Find user
      const user = await User.findOne({ email: companyEmail, isActive: true });
      if (!user) {
        return res.status(404).json({
          message: "Customer not found. Please add your information first.",
        });
      }

      // Check if OTP exists
      if (!user.otp || !user.otp.code) {
        return res
          .status(400)
          .json({ message: "No OTP found. Please request a new one." });
      }

      // Check OTP expiration
      if (new Date() > user.otp.expiresAt) {
        return res
          .status(400)
          .json({ message: "OTP has expired. Please request a new one." });
      }

      // Check OTP attempts
      if (user.otp.attempts >= 5) {
        return res.status(400).json({
          message: "Too many failed attempts. Please request a new OTP.",
        });
      }

      // Verify OTP
      if (user.otp.code !== otp) {
        user.otp.attempts += 1;
        await user.save();
        return res.status(400).json({
          message: "Invalid OTP",
          attemptsRemaining: 5 - user.otp.attempts,
        });
      }

      // OTP is valid - verify user
      user.isVerified = true;
      user.otp = undefined; // Clear OTP data
      await user.save();

      res.json({
        message: "Phone number verified successfully",
        customerInfo: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: `${user.phoneCountryCode}${user.phoneNumber}`,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error("Customer OTP verification error:", error);
      res
        .status(500)
        .json({ message: "Verification failed", error: error.message });
    }
  }
);

// Customer: Resend OTP via SMS
router.post(
  "/customer/resend-otp",
  [
    body("companyEmail")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { companyEmail } = req.body;

      // Find user
      const user = await User.findOne({ email: companyEmail, isActive: true });
      if (!user) {
        return res.status(404).json({
          message: "Customer not found. Please add your information first.",
        });
      }

      // Generate new OTP
      const otp = generateOTP();
      user.otp = {
        code: otp,
        expiresAt: getOTPExpiration(),
        attempts: 0,
      };

      await user.save();

      // Format phone number for SMS
      const fullPhoneNumber = `${user.phoneCountryCode}${user.phoneNumber}`;

      // Send OTP via SMS
      try {
        await otpService.sendOTP(fullPhoneNumber, otp, "sms");
        res.json({ message: "OTP sent successfully via SMS" });
      } catch (otpError) {
        console.error("SMS OTP sending failed:", otpError.message);
        res
          .status(500)
          .json({ message: "Failed to send OTP. Please try again." });
      }
    } catch (error) {
      console.error("Resend customer OTP error:", error);
      res
        .status(500)
        .json({ message: "Failed to resend OTP", error: error.message });
    }
  }
);

module.exports = router;
