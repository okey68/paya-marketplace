const mongoose = require('mongoose');

const underwritingModelSchema = new mongoose.Schema({
  // Model Metrics - Thresholds
  metrics: {
    minAge: {
      type: Number,
      default: 18,
      required: true
    },
    minIncome: {
      type: Number,
      default: 30000,
      required: true
    },
    minYearsEmployed: {
      type: Number,
      default: 1,
      required: true
    },
    minCreditScore: {
      type: Number,
      default: 600,
      required: true
    },
    maxDefaults: {
      type: Number,
      default: 0,
      required: true
    },
    maxOtherObligations: {
      type: Number,
      default: 50000,
      required: true
    }
  },
  
  // Model Parameters
  parameters: {
    interestRate: {
      type: Number,
      default: 8,
      required: true,
      description: 'Interest rate per month (%)'
    },
    advanceRate: {
      type: Number,
      default: 99,
      required: true,
      description: 'Percentage advanced to merchant (%)'
    },
    termMonths: {
      type: Number,
      default: 4,
      required: true,
      description: 'Loan term in months'
    },
    maxMonthlyPaymentRatio: {
      type: Number,
      default: 25,
      required: true,
      description: 'Maximum monthly payment as percentage of monthly income (%)'
    },
    paymentSchedule: {
      type: [Number],
      default: [25, 25, 25, 25],
      required: true,
      validate: {
        validator: function(v) {
          // Sum of percentages should equal 100
          const sum = v.reduce((acc, val) => acc + val, 0);
          return sum === 100;
        },
        message: 'Payment schedule percentages must sum to 100%'
      },
      description: 'Percentage of total payment for each month'
    }
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to evaluate an applicant against the model
underwritingModelSchema.methods.evaluateApplicant = function(applicant, loanAmount) {
  const results = {
    approved: true,
    reasons: [],
    score: 0,
    maxLoanAmount: null
  };
  
  // Check age
  if (applicant.age < this.metrics.minAge) {
    results.approved = false;
    results.reasons.push(`Age must be at least ${this.metrics.minAge}`);
  } else {
    results.score += 15;
  }
  
  // Check income
  if (applicant.income < this.metrics.minIncome) {
    results.approved = false;
    results.reasons.push(`Income must be at least ${this.metrics.minIncome}`);
  } else {
    results.score += 25;
  }
  
  // Check years employed
  if (applicant.yearsEmployed < this.metrics.minYearsEmployed) {
    results.approved = false;
    results.reasons.push(`Must be employed for at least ${this.metrics.minYearsEmployed} year(s)`);
  } else {
    results.score += 15;
  }
  
  // Check credit score
  if (applicant.creditScore < this.metrics.minCreditScore) {
    results.approved = false;
    results.reasons.push(`Credit score must be at least ${this.metrics.minCreditScore}`);
  } else {
    results.score += 30;
  }
  
  // Check defaults
  if (applicant.defaults > this.metrics.maxDefaults) {
    results.approved = false;
    results.reasons.push(`Too many defaults (max: ${this.metrics.maxDefaults})`);
  } else {
    results.score += 10;
  }
  
  // Check other obligations
  if (applicant.otherObligations > this.metrics.maxOtherObligations) {
    results.approved = false;
    results.reasons.push(`Other obligations exceed maximum (${this.metrics.maxOtherObligations})`);
  } else {
    results.score += 5;
  }
  
  // Calculate maximum loan amount based on monthly payment capacity
  // Monthly payment capacity = income * maxMonthlyPaymentRatio
  // Max loan = monthly payment capacity * term months
  const monthlyPaymentCapacity = applicant.income * (this.parameters.maxMonthlyPaymentRatio / 100);
  const maxLoanAmount = monthlyPaymentCapacity * this.parameters.termMonths;
  results.maxLoanAmount = maxLoanAmount;
  
  // Check if requested loan amount exceeds maximum
  if (loanAmount && loanAmount > maxLoanAmount) {
    results.approved = false;
    results.reasons.push(`Loan amount (${loanAmount}) exceeds maximum allowed (${Math.floor(maxLoanAmount)} - ${this.parameters.maxMonthlyPaymentRatio}% of income)`);
  }
  
  return results;
};

// Method to calculate loan details using declining balance method
underwritingModelSchema.methods.calculateLoanDetails = function(loanAmount) {
  const interestRate = this.parameters.interestRate / 100; // Convert percentage to decimal
  const termMonths = this.parameters.termMonths;
  const principalPerPayment = loanAmount / termMonths;

  // Calculate payment schedule using declining balance method
  let outstandingBalance = loanAmount;
  let totalInterest = 0;
  const payments = [];

  for (let i = 0; i < termMonths; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);

    // Interest is calculated on the outstanding balance
    const interest = outstandingBalance * interestRate;
    const monthlyPayment = principalPerPayment + interest;

    payments.push({
      paymentNumber: i + 1,
      principal: principalPerPayment,
      outstandingBalance: outstandingBalance,
      interest: interest,
      amount: monthlyPayment,
      dueDate: dueDate
    });

    totalInterest += interest;
    outstandingBalance -= principalPerPayment;
  }

  const totalRepayment = loanAmount + totalInterest;
  const merchantAdvance = loanAmount * (this.parameters.advanceRate / 100);
  const payaFee = loanAmount * ((100 - this.parameters.advanceRate) / 100);

  return {
    loanAmount,
    interestRate: this.parameters.interestRate,
    totalInterest,
    totalRepayment,
    merchantAdvance,
    payaFee,
    termMonths: this.parameters.termMonths,
    payments
  };
};

const UnderwritingModel = mongoose.model('UnderwritingModel', underwritingModelSchema);

module.exports = UnderwritingModel;
