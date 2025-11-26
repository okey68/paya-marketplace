const axios = require("axios");

/**
 * Send OTP via external API (email or SMS)
 * @param {string} recipient - Recipient email address or phone number
 * @param {string} otp - OTP code to send
 * @param {string} channel - Channel to use: 'email' or 'sms'
 * @returns {Promise<Object>} API response
 */
const sendOTP = async (recipient, otp, channel = "email") => {
  try {
    const apiKey =
      "pk_live_3e32c86b96e0b15a1737a17b6e3fcfbf5ed910f3fd6e78510d80a33233fd1579";
    const apiUrl = "https://dev.getpaya.com/api/v1/external/otp/send";

    // For SMS, remove the '+' sign from phone number if present
    // Example: +254717255460 -> 254717255460
    let formattedRecipient = recipient;
    if (channel === "sms") {
      formattedRecipient = recipient.replace(/^\+/, "");
    }

    console.log(`Sending OTP via ${channel} to:`, formattedRecipient);

    const response = await axios.post(
      apiUrl,
      {
        channel: channel, // 'email' or 'sms'
        recipient: formattedRecipient,
        otp: otp,
      },
      {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`OTP sent successfully via ${channel} to:`, formattedRecipient);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Failed to send OTP via ${channel}:`, error.message);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
    throw new Error(`Failed to send OTP via ${channel}`);
  }
};

module.exports = {
  sendOTP,
};
