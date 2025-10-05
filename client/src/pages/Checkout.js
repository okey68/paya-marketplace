import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { items, getSubtotal, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data for each step
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    companyEmail: ''
  });
  
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Kenya'
  });
  
  const [bnplTerms, setBnplTerms] = useState({
    totalAmount: 0,
    interestRate: 8,
    numberOfPayments: 4,
    paymentAmount: 0,
    payments: []
  });
  
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Calculate BNPL terms
  useEffect(() => {
    const subtotal = getSubtotal();
    const totalWithInterest = subtotal * (1 + bnplTerms.interestRate / 100);
    const paymentAmount = totalWithInterest / bnplTerms.numberOfPayments;
    
    const payments = [];
    const today = new Date();
    for (let i = 0; i < bnplTerms.numberOfPayments; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() + i + 1);
      payments.push({
        number: i + 1,
        amount: paymentAmount,
        date: paymentDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    
    setBnplTerms(prev => ({
      ...prev,
      totalAmount: totalWithInterest,
      paymentAmount,
      payments
    }));
  }, [getSubtotal, bnplTerms.interestRate, bnplTerms.numberOfPayments]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && currentStep === 1) {
      toast.error('Your cart is empty');
      navigate('/cart');
    }
  }, [items, navigate, currentStep]);

  const handlePersonalInfoSubmit = (e) => {
    e.preventDefault();
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.dateOfBirth || !personalInfo.companyEmail) {
      toast.error('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast.error('Please fill in all shipping address fields');
      return;
    }
    
    // Start underwriting process
    setLoading(true);
    setCurrentStep(3);
    
    // Simulate underwriting delay
    setTimeout(() => {
      setLoading(false);
      setCurrentStep(4); // Auto-approve for demo
    }, 3000);
  };

  const handleTermsAccept = () => {
    setCurrentStep(5);
  };

  const handleAgreementSubmit = async () => {
    if (!agreementAccepted) {
      toast.error('Please accept the BNPL agreement to continue');
      return;
    }
    
    setLoading(true);
    
    // Simulate order processing
    setTimeout(() => {
      setLoading(false);
      clearCart();
      setCurrentStep(6);
      toast.success('Order completed successfully!');
    }, 2000);
  };

  const renderProgressBar = () => (
    <div className="checkout-progress">
      <div className="progress-steps">
        {[1, 2, 4, 5, 6].map((step, index) => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{index + 1}</div>
            <div className="step-label">
              {step === 1 && 'Personal Info'}
              {step === 2 && 'Shipping'}
              {step === 4 && 'Decision'}
              {step === 5 && 'BNPL Agreement'}
              {step === 6 && 'Complete'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="checkout-step">
      <h2>Personal Information</h2>
      <p>Please provide your personal details for the BNPL application</p>
      
      <form onSubmit={handlePersonalInfoSubmit} className="checkout-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={personalInfo.firstName}
              onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={personalInfo.lastName}
              onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={personalInfo.dateOfBirth}
              onChange={(e) => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Company Email Address *</label>
            <input
              type="email"
              value={personalInfo.companyEmail}
              onChange={(e) => setPersonalInfo({...personalInfo, companyEmail: e.target.value})}
              placeholder="your.name@company.com"
              required
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/cart')} className="btn btn-outline">
            Back to Cart
          </button>
          <button type="submit" className="btn btn-primary">
            Continue to Shipping
          </button>
        </div>
      </form>
    </div>
  );

  const renderShippingStep = () => (
    <div className="checkout-step">
      <h2>Shipping Address</h2>
      <p>Where should we deliver your order?</p>
      
      <form onSubmit={handleShippingSubmit} className="checkout-form">
        <div className="form-group">
          <label>Street Address *</label>
          <input
            type="text"
            value={shippingAddress.street}
            onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
            placeholder="123 Main Street"
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <input
              type="text"
              value={shippingAddress.city}
              onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
              placeholder="Nairobi"
              required
            />
          </div>
          <div className="form-group">
            <label>State/County *</label>
            <input
              type="text"
              value={shippingAddress.state}
              onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
              placeholder="Nairobi County"
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>ZIP/Postal Code *</label>
            <input
              type="text"
              value={shippingAddress.zipCode}
              onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
              placeholder="00100"
              required
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <select
              value={shippingAddress.country}
              onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
            >
              <option value="Kenya">Kenya</option>
              <option value="Uganda">Uganda</option>
              <option value="Tanzania">Tanzania</option>
            </select>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-outline">
            Back
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );

  const renderUnderwritingStep = () => (
    <div className="checkout-step underwriting-step">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <h2>Processing Your Application</h2>
        <p>Paya is reviewing your information and performing underwriting...</p>
        <div className="loading-steps">
          <div className="loading-step active">✓ Verifying personal information</div>
          <div className="loading-step active">✓ Checking employment status</div>
          <div className="loading-step active">⏳ Calculating payment terms</div>
        </div>
      </div>
    </div>
  );

  const renderApprovedStep = () => (
    <div className="checkout-step approved-step">
      <div className="approval-container">
        <div className="approval-icon">🎉</div>
        <h2>Congratulations! Your Order Was Approved</h2>
        <p className="approval-message">
          Your Buy Now, Pay Later application has been approved! Your payments will be 
          automatically deducted from your monthly payroll via your employer.
        </p>
        
        <div className="bnpl-terms">
          <h3>Payment Terms</h3>
          <div className="terms-summary">
            <div className="term-item">
              <span className="term-label">Total Amount:</span>
              <span className="term-value">KSh {bnplTerms.totalAmount.toLocaleString()}</span>
            </div>
            <div className="term-item">
              <span className="term-label">Interest Rate:</span>
              <span className="term-value">{bnplTerms.interestRate}%</span>
            </div>
            <div className="term-item">
              <span className="term-label">Number of Payments:</span>
              <span className="term-value">{bnplTerms.numberOfPayments} monthly payments</span>
            </div>
            <div className="term-item">
              <span className="term-label">Payment Amount:</span>
              <span className="term-value">KSh {bnplTerms.paymentAmount.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="payment-schedule">
            <h4>Payment Schedule</h4>
            {bnplTerms.payments.map(payment => (
              <div key={payment.number} className="payment-item">
                <span>Payment {payment.number}</span>
                <span>{payment.date}</span>
                <span>KSh {payment.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button onClick={handleTermsAccept} className="btn btn-primary btn-large">
            Accept Terms & Continue
          </button>
        </div>
      </div>
    </div>
  );

  const renderAgreementStep = () => (
    <div className="checkout-step agreement-step">
      <h2>BNPL Agreement</h2>
      
      <div className="agreement-content">
        <h3>Buy Now, Pay Later Agreement</h3>
        <div className="agreement-text">
          <p><strong>This agreement is between you and Paya Financial Services.</strong></p>
          
          <h4>Terms and Conditions:</h4>
          <ul>
            <li>You agree to pay the total amount of KSh {bnplTerms.totalAmount.toLocaleString()} in {bnplTerms.numberOfPayments} equal monthly installments.</li>
            <li>Each payment of KSh {bnplTerms.paymentAmount.toLocaleString()} will be automatically deducted from your payroll.</li>
            <li>An interest rate of {bnplTerms.interestRate}% has been applied to the total purchase amount.</li>
            <li>Payments will begin 30 days from the date of purchase.</li>
            <li>Late payment fees may apply if payments are not processed successfully.</li>
            <li>You have the right to pay off the balance early without penalty.</li>
            <li>This agreement is governed by the laws of Kenya.</li>
          </ul>
          
          <h4>Your Rights:</h4>
          <ul>
            <li>You may cancel this agreement within 14 days of signing.</li>
            <li>You have the right to dispute any charges you believe are incorrect.</li>
            <li>You can contact customer service at support@paya.co.ke for assistance.</li>
          </ul>
        </div>
        
        <div className="agreement-checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
            />
            <span className="checkmark"></span>
            I have read and agree to the terms and conditions of this BNPL agreement
          </label>
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-outline">
          Back to Terms
        </button>
        <button 
          onClick={handleAgreementSubmit} 
          className="btn btn-primary btn-large"
          disabled={!agreementAccepted || loading}
        >
          {loading ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </div>
  );

  const renderCompletedStep = () => (
    <div className="checkout-step completed-step">
      <div className="completion-container">
        <div className="completion-icon">✅</div>
        <h2>Order Completed Successfully!</h2>
        <p className="completion-message">
          Thank you for your purchase! Your order has been confirmed and you will receive 
          email confirmations shortly. Your first payment will be deducted from your payroll next month.
        </p>
        
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {items.map(item => (
              <div key={item.id} className="summary-item">
                <span>{item.name || item.product?.name}</span>
                <span>Qty: {item.quantity}</span>
                <span>KSh {((item.price || item.product?.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <strong>Total: KSh {bnplTerms.totalAmount.toLocaleString()}</strong>
          </div>
        </div>
        
        <div className="next-steps">
          <h4>What's Next?</h4>
          <ul>
            <li>📧 You'll receive order confirmation emails</li>
            <li>📦 Your items will be shipped to the provided address</li>
            <li>💳 First payment will be deducted next month</li>
            <li>📱 Track your payments in your Paya account</li>
          </ul>
        </div>
        
        <div className="form-actions">
          <button onClick={() => navigate('/marketplace')} className="btn btn-primary btn-large">
            Back to Shop
          </button>
        </div>
      </div>
    </div>
  );

  if (items.length === 0 && currentStep < 6) {
    return (
      <div className="checkout-container">
        <div className="container">
          <div className="empty-checkout">
            <h2>Your cart is empty</h2>
            <p>Add some items to your cart before checking out.</p>
            <button onClick={() => navigate('/marketplace')} className="btn btn-primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="container">
        <div className="checkout-header">
          <h1>Buy Now, Pay Later</h1>
          {renderProgressBar()}
        </div>
        
        <div className={`checkout-content ${currentStep === 6 ? 'completed' : ''}`}>
          <div className="checkout-main">
            {currentStep === 1 && renderPersonalInfoStep()}
            {currentStep === 2 && renderShippingStep()}
            {currentStep === 3 && renderUnderwritingStep()}
            {currentStep === 4 && renderApprovedStep()}
            {currentStep === 5 && renderAgreementStep()}
            {currentStep === 6 && renderCompletedStep()}
          </div>
          
          {currentStep < 6 && (
            <div className="checkout-sidebar">
              <div className="order-summary-sidebar">
                <h3>Order Summary</h3>
                <div className="sidebar-items">
                  {items.map(item => (
                    <div key={item.id} className="sidebar-item">
                      <span className="item-name">{item.name || item.product?.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                      <span className="item-price">KSh {((item.price || item.product?.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="sidebar-total">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>KSh {getSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="total-line">
                    <span>Interest ({bnplTerms.interestRate}%):</span>
                    <span>KSh {(bnplTerms.totalAmount - getSubtotal()).toLocaleString()}</span>
                  </div>
                  <div className="total-line total-final">
                    <span><strong>Total:</strong></span>
                    <span><strong>KSh {bnplTerms.totalAmount.toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
