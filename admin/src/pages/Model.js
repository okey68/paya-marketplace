import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import '../styles/Model.css';

const Model = () => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  
  // Form state for metrics
  const [metrics, setMetrics] = useState({
    minAge: 18,
    minIncome: 30000,
    minYearsEmployed: 1,
    minCreditScore: 600,
    maxDefaults: 0,
    maxOtherObligations: 50000
  });
  
  // Form state for parameters
  const [parameters, setParameters] = useState({
    interestRate: 8,
    advanceRate: 99,
    termMonths: 4,
    maxLoanToIncomeRatio: 30,
    paymentSchedule: [25, 25, 25, 25]
  });
  
  // Test applicant state
  const [testApplicant, setTestApplicant] = useState({
    age: 30,
    income: 50000,
    yearsEmployed: 3,
    creditScore: 700,
    defaults: 0,
    otherObligations: 10000
  });
  
  const [loanAmount, setLoanAmount] = useState(5000);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    fetchModel();
  }, []);

  const fetchModel = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/underwriting/model');
      setModel(response.data);
      setMetrics(response.data.metrics);
      setParameters(response.data.parameters);
      setIsLocked(true);
    } catch (error) {
      console.error('Error fetching model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowEditConfirm(true);
  };

  const confirmEdit = () => {
    setIsLocked(false);
    setShowEditConfirm(false);
  };

  const handleSaveClick = () => {
    // Validate payment schedule
    const sum = parameters.paymentSchedule.reduce((acc, val) => acc + val, 0);
    if (sum !== 100) {
      toast.error('Payment schedule percentages must sum to 100%');
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put('/underwriting/model', {
        metrics,
        parameters
      });
      setModel(response.data);
      setIsLocked(true);
      setShowSaveConfirm(false);
      toast.success('Model saved successfully!');
    } catch (error) {
      console.error('Error saving model:', error);
      toast.error('Failed to save model. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fetchVersionHistory = async () => {
    try {
      const response = await axios.get('/underwriting/model/history');
      setVersionHistory(response.data);
      setShowVersionHistory(true);
    } catch (error) {
      console.error('Error fetching version history:', error);
      toast.error('Failed to load version history');
    }
  };

  const handleMetricChange = (field, value) => {
    setMetrics(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleParameterChange = (field, value) => {
    setParameters(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handlePaymentScheduleChange = (index, value) => {
    const newSchedule = [...parameters.paymentSchedule];
    newSchedule[index] = parseFloat(value) || 0;
    setParameters(prev => ({
      ...prev,
      paymentSchedule: newSchedule
    }));
  };

  const handleSaveModel = async () => {
    try {
      // Validate payment schedule
      const sum = parameters.paymentSchedule.reduce((acc, val) => acc + val, 0);
      if (sum !== 100) {
        alert('Payment schedule percentages must sum to 100%');
        return;
      }
      
      setSaving(true);
      const response = await axios.put('/underwriting/model', {
        metrics,
        parameters
      });
      setModel(response.data);
      alert('Model saved successfully!');
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Error saving model: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTestApplicant = async () => {
    try {
      setTesting(true);
      const response = await axios.post('/underwriting/model/test', {
        applicant: testApplicant,
        loanAmount: loanAmount
      });
      setTestResults(response.data);
    } catch (error) {
      console.error('Error testing applicant:', error);
      alert('Error testing applicant: ' + (error.response?.data?.message || error.message));
    } finally {
      setTesting(false);
    }
  };

  const handleTestApplicantChange = (field, value) => {
    setTestApplicant(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const paymentScheduleSum = parameters.paymentSchedule.reduce((acc, val) => acc + val, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading model...</p>
      </div>
    );
  }

  return (
    <div className="model-page">
      {/* Version History Modal */}
      {showVersionHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Model Version History</h3>
              <button 
                onClick={() => setShowVersionHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {versionHistory.map((version) => (
                <div 
                  key={version._id}
                  style={{
                    padding: '1.5rem',
                    border: version.isActive ? '2px solid #6366f1' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: version.isActive ? '#f0f9ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Version {version.version}
                        {version.isActive && (
                          <span style={{
                            backgroundColor: '#6366f1',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>
                            ACTIVE
                          </span>
                        )}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                        Created: {new Date(version.createdAt).toLocaleString()}
                      </p>
                      {version.updatedBy && (
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                          By: {version.updatedBy.firstName} {version.updatedBy.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <strong>Eligibility Metrics:</strong>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        <li>Min Age: {version.metrics.minAge}</li>
                        <li>Min Income: KSh {version.metrics.minIncome.toLocaleString()}</li>
                        <li>Min Credit Score: {version.metrics.minCreditScore}</li>
                        <li>Max Defaults: {version.metrics.maxDefaults}</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Parameters:</strong>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        <li>Interest Rate: {version.parameters.interestRate}%</li>
                        <li>Advance Rate: {version.parameters.advanceRate}%</li>
                        <li>Term: {version.parameters.termMonths} months</li>
                        <li>Payment Schedule: {version.parameters.paymentSchedule.join('%, ')}%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {versionHistory.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No version history available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Confirmation Modal */}
      {showEditConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Edit Underwriting Model</h3>
            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
              Are you sure you want to edit the underwriting model? This will unlock all fields for editing.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowEditConfirm(false)}
                className="btn"
                style={{ backgroundColor: '#e2e8f0' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmEdit}
                className="btn btn-primary"
              >
                Yes, Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Save Underwriting Model</h3>
            <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
              Are you sure you want to save this underwriting model with the current changes? This will affect all new BNPL applications.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowSaveConfirm(false)}
                className="btn"
                style={{ backgroundColor: '#e2e8f0' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmSave}
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Yes, Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="model-header">
        <div>
          <h1>BNPL Underwriting Model</h1>
          <p className="model-version">Version {model?.version || 1} • Last updated: {model?.updatedAt ? new Date(model.updatedAt).toLocaleString() : 'Never'}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => toast('Coming Soon', { icon: 'ℹ️' })} 
            className="btn"
            style={{ 
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none'
            }}
          >
            Credit Policy
          </button>
          <button 
            onClick={fetchVersionHistory} 
            className="btn"
            style={{ 
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Versions
          </button>
          {isLocked ? (
            <button 
              onClick={handleEditClick} 
              className="btn"
              style={{ 
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
          ) : (
            <button 
              onClick={handleSaveClick} 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Model'}
            </button>
          )}
        </div>
      </div>

      <div className="model-content">
        {/* Metrics Section */}
        <div className="model-section">
          <h2>Eligibility Metrics</h2>
          <p className="section-description">Set the minimum thresholds for applicant approval</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Minimum Age</label>
              <input
                type="number"
                value={metrics.minAge}
                onChange={(e) => handleMetricChange('minAge', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Minimum Income (KSh)</label>
              <input
                type="number"
                value={metrics.minIncome}
                onChange={(e) => handleMetricChange('minIncome', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Minimum Years Employed</label>
              <input
                type="number"
                step="0.5"
                value={metrics.minYearsEmployed}
                onChange={(e) => handleMetricChange('minYearsEmployed', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Minimum Credit Score</label>
              <input
                type="number"
                value={metrics.minCreditScore}
                onChange={(e) => handleMetricChange('minCreditScore', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Maximum Defaults</label>
              <input
                type="number"
                value={metrics.maxDefaults}
                onChange={(e) => handleMetricChange('maxDefaults', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Maximum Other Obligations (KSh)</label>
              <input
                type="number"
                value={metrics.maxOtherObligations}
                onChange={(e) => handleMetricChange('maxOtherObligations', e.target.value)}
                className="metric-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Parameters Section */}
        <div className="model-section">
          <h2>Loan Parameters</h2>
          <p className="section-description">Configure the loan terms and payment structure</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Interest Rate (% per month)</label>
              <input
                type="number"
                step="0.1"
                value={parameters.interestRate}
                onChange={(e) => handleParameterChange('interestRate', e.target.value)}
                className="parameter-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Advance Rate to Merchant (%)</label>
              <input
                type="number"
                step="0.1"
                value={parameters.advanceRate}
                onChange={(e) => handleParameterChange('advanceRate', e.target.value)}
                className="parameter-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <label style={{ fontWeight: '500', color: '#4a5568' }}>Loan Term (Months)</label>
              <input
                type="number"
                value={parameters.termMonths}
                onChange={(e) => handleParameterChange('termMonths', e.target.value)}
                className="parameter-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <label style={{ fontWeight: '500', color: '#4a5568' }}>Max Loan to Income Ratio (%)</label>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Maximum loan amount as % of annual income
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                value={parameters.maxLoanToIncomeRatio}
                onChange={(e) => handleParameterChange('maxLoanToIncomeRatio', e.target.value)}
                className="parameter-input"
                style={{ width: '180px' }}
                disabled={isLocked}
              />
            </div>
          </div>
          
          <div className="payment-schedule-section" style={{ marginTop: '2rem' }}>
            <h3>Payment Schedule</h3>
            <p className="schedule-description">
              Define the percentage of total payment for each month (must sum to 100%)
            </p>
            <div className="payment-schedule-grid">
              {parameters.paymentSchedule.map((percentage, index) => (
                <div key={index} className="schedule-item">
                  <label>Month {index + 1} (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={percentage}
                    onChange={(e) => handlePaymentScheduleChange(index, e.target.value)}
                    className="schedule-input"
                    disabled={isLocked}
                  />
                </div>
              ))}
            </div>
            <div className={`schedule-sum ${paymentScheduleSum === 100 ? 'valid' : 'invalid'}`}>
              Total: {paymentScheduleSum}% {paymentScheduleSum === 100 ? '✓' : '✗ Must equal 100%'}
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="model-section test-section">
          <h2>Test Applicant</h2>
          <p className="section-description">Run a hypothetical applicant through the model</p>
          
          <div className="test-grid">
            <div className="test-inputs">
              <h3>Applicant Details</h3>
              <div className="test-input-grid">
                <div className="test-input-item">
                  <label>Age</label>
                  <input
                    type="number"
                    value={testApplicant.age}
                    onChange={(e) => handleTestApplicantChange('age', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Income (KSh)</label>
                  <input
                    type="number"
                    value={testApplicant.income}
                    onChange={(e) => handleTestApplicantChange('income', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Years Employed</label>
                  <input
                    type="number"
                    step="0.5"
                    value={testApplicant.yearsEmployed}
                    onChange={(e) => handleTestApplicantChange('yearsEmployed', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Credit Score</label>
                  <input
                    type="number"
                    value={testApplicant.creditScore}
                    onChange={(e) => handleTestApplicantChange('creditScore', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Defaults</label>
                  <input
                    type="number"
                    value={testApplicant.defaults}
                    onChange={(e) => handleTestApplicantChange('defaults', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Other Obligations (KSh)</label>
                  <input
                    type="number"
                    value={testApplicant.otherObligations}
                    onChange={(e) => handleTestApplicantChange('otherObligations', e.target.value)}
                    className="test-input"
                  />
                </div>
                
                <div className="test-input-item">
                  <label>Loan Amount (KSh)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value) || 0)}
                    className="test-input"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleTestApplicant}
                className="btn btn-primary test-button"
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Run Test'}
              </button>
            </div>
            
            {testResults && (
              <div className="test-results">
                <h3>Test Results</h3>
                
                <div className={`approval-status ${testResults.evaluation.approved ? 'approved' : 'rejected'}`}>
                  <div className="status-icon">
                    {testResults.evaluation.approved ? '✓' : '✗'}
                  </div>
                  <div className="status-text">
                    {testResults.evaluation.approved ? 'APPROVED' : 'REJECTED'}
                  </div>
                  <div className="status-score">
                    Score: {testResults.evaluation.score}/100
                  </div>
                  {testResults.evaluation.maxLoanAmount && (
                    <div className="max-loan-info">
                      Max Loan: {formatCurrency(testResults.evaluation.maxLoanAmount)}
                    </div>
                  )}
                </div>
                
                {!testResults.evaluation.approved && testResults.evaluation.reasons.length > 0 && (
                  <div className="rejection-reasons">
                    <h4>Rejection Reasons:</h4>
                    <ul>
                      {testResults.evaluation.reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {testResults.loanDetails && (
                  <div className="loan-details">
                    <h4>Loan Details</h4>
                    <div className="loan-detail-item">
                      <span>Loan Amount:</span>
                      <strong>{formatCurrency(testResults.loanDetails.loanAmount)}</strong>
                    </div>
                    <div className="loan-detail-item">
                      <span>Interest Rate:</span>
                      <strong>{testResults.loanDetails.interestRate}% per month</strong>
                    </div>
                    <div className="loan-detail-item">
                      <span>Total Interest:</span>
                      <strong>{formatCurrency(testResults.loanDetails.totalInterest)}</strong>
                    </div>
                    <div className="loan-detail-item highlight">
                      <span>Total Repayment:</span>
                      <strong>{formatCurrency(testResults.loanDetails.totalRepayment)}</strong>
                    </div>
                    <div className="loan-detail-item">
                      <span>Merchant Advance ({parameters.advanceRate}%):</span>
                      <strong className="green">{formatCurrency(testResults.loanDetails.merchantAdvance)}</strong>
                    </div>
                    <div className="loan-detail-item">
                      <span>Paya Fee ({100 - parameters.advanceRate}%):</span>
                      <strong>{formatCurrency(testResults.loanDetails.payaFee)}</strong>
                    </div>
                    
                    <div className="payment-schedule-results">
                      <h5>Payment Schedule</h5>
                      {testResults.loanDetails.payments.map((payment, index) => (
                        <div key={index} className="payment-row-result">
                          <span>Payment {payment.paymentNumber}</span>
                          <span>{payment.percentage}%</span>
                          <span>{formatCurrency(payment.amount)}</span>
                          <span>{new Date(payment.dueDate).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Model;
