const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure agreements directory exists
const AGREEMENTS_DIR = path.join(__dirname, '../../uploads/agreements');
if (!fs.existsSync(AGREEMENTS_DIR)) {
  fs.mkdirSync(AGREEMENTS_DIR, { recursive: true });
}

/**
 * Generate BNPL Agreement PDF
 * @param {Object} options - Agreement options
 * @param {Object} options.order - Order document
 * @param {Object} options.customer - Customer user document
 * @param {Object} options.loanDetails - Loan calculation details from UnderwritingModel
 * @returns {Promise<string>} Path to generated PDF
 */
const generateBNPLAgreement = async (options) => {
  const { order, customer, loanDetails } = options;

  return new Promise((resolve, reject) => {
    try {
      const filename = `BNPL_Agreement_${order.orderNumber}_${Date.now()}.pdf`;
      const filePath = path.join(AGREEMENTS_DIR, filename);

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('PAYA BUY NOW PAY LATER AGREEMENT', { align: 'center' });

      doc.moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text(`Agreement Reference: ${order.orderNumber}`, { align: 'center' })
        .text(`Date: ${new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });

      doc.moveDown(2);

      // Parties Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PARTIES TO THIS AGREEMENT');

      doc.moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text('This Buy Now Pay Later Agreement ("Agreement") is entered into between:');

      doc.moveDown(0.5);

      doc.font('Helvetica-Bold')
        .text('1. LENDER:');
      doc.font('Helvetica')
        .text('   Paya Limited')
        .text('   Nairobi, Kenya')
        .text('   ("Paya" or "Lender")');

      doc.moveDown(0.5);

      doc.font('Helvetica-Bold')
        .text('2. BORROWER:');
      doc.font('Helvetica')
        .text(`   Name: ${customer.firstName} ${customer.lastName}`)
        .text(`   Email: ${customer.email}`)
        .text(`   Phone: ${customer.phoneCountryCode || '+254'}${customer.phoneNumber || 'N/A'}`)
        .text(`   KRA PIN: ${customer.kraPin || 'N/A'}`)
        .text('   ("Customer" or "Borrower")');

      doc.moveDown(1.5);

      // Loan Details Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('LOAN DETAILS');

      doc.moveDown(0.5);

      const loanAmount = loanDetails?.loanAmount || order.totalAmount;
      const interestRate = loanDetails?.interestRate || 8;
      const termMonths = loanDetails?.termMonths || 4;

      // Calculate declining balance totals if not provided
      let totalInterest = loanDetails?.totalInterest;
      if (!totalInterest) {
        // Calculate using declining balance method
        const rate = interestRate / 100;
        const principalPerPayment = loanAmount / termMonths;
        let outstanding = loanAmount;
        totalInterest = 0;
        for (let i = 0; i < termMonths; i++) {
          totalInterest += outstanding * rate;
          outstanding -= principalPerPayment;
        }
      }
      const totalRepayment = loanDetails?.totalRepayment || (loanAmount + totalInterest);

      // Loan details table
      doc.fontSize(10).font('Helvetica');

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 300;

      const drawRow = (label, value, y) => {
        doc.font('Helvetica').text(label, col1, y);
        doc.font('Helvetica-Bold').text(value, col2, y);
      };

      let rowY = tableTop;
      const rowHeight = 20;

      drawRow('Principal Amount:', `KES ${loanAmount.toLocaleString()}`, rowY);
      rowY += rowHeight;
      drawRow('Interest Rate:', `${interestRate}% per month`, rowY);
      rowY += rowHeight;
      drawRow('Loan Term:', `${termMonths} months`, rowY);
      rowY += rowHeight;
      drawRow('Total Interest:', `KES ${totalInterest.toLocaleString()}`, rowY);
      rowY += rowHeight;
      drawRow('Total Repayment:', `KES ${totalRepayment.toLocaleString()}`, rowY);

      doc.y = rowY + 30;

      // Payment Schedule Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('PAYMENT SCHEDULE');

      doc.moveDown(0.5);

      // Payment schedule table header (Declining Balance format)
      doc.fontSize(8);
      const scheduleTop = doc.y;
      const cols = [50, 100, 170, 250, 330, 420];

      doc.font('Helvetica-Bold')
        .text('#', cols[0], scheduleTop)
        .text('Due Date', cols[1], scheduleTop)
        .text('Principal', cols[2], scheduleTop)
        .text('Outstanding', cols[3], scheduleTop)
        .text('Interest', cols[4], scheduleTop)
        .text('Payment', cols[5], scheduleTop);

      doc.moveTo(50, scheduleTop + 12)
        .lineTo(500, scheduleTop + 12)
        .stroke();

      // Payment rows - generate using declining balance if not provided
      const payments = loanDetails?.payments || generateDefaultPayments(loanAmount, termMonths, interestRate);
      let paymentY = scheduleTop + 20;

      payments.forEach((payment, index) => {
        const dueDate = payment.dueDate instanceof Date
          ? payment.dueDate.toLocaleDateString('en-KE')
          : new Date(payment.dueDate).toLocaleDateString('en-KE');

        doc.font('Helvetica')
          .text(`${index + 1}`, cols[0], paymentY)
          .text(dueDate, cols[1], paymentY)
          .text(Math.round(payment.principal || payment.amount / 1.08).toLocaleString(), cols[2], paymentY)
          .text(Math.round(payment.outstandingBalance || 0).toLocaleString(), cols[3], paymentY)
          .text(Math.round(payment.interest || 0).toLocaleString(), cols[4], paymentY)
          .text(Math.round(payment.amount).toLocaleString(), cols[5], paymentY);

        paymentY += 18;
      });

      doc.y = paymentY + 20;

      // Terms and Conditions
      doc.addPage();

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('TERMS AND CONDITIONS');

      doc.moveDown(0.5);

      doc.fontSize(9)
        .font('Helvetica');

      const terms = [
        '1. GRANT OF CREDIT: Paya agrees to advance funds to the Merchant on behalf of the Customer for the purchase of goods/services as specified in the Order.',
        '2. REPAYMENT OBLIGATION: The Customer agrees to repay the Total Repayment Amount according to the Payment Schedule above.',
        '3. INTEREST: Interest is calculated at the stated rate per month on the Principal Amount.',
        '4. LATE PAYMENT: In case of late payment, a penalty fee may be applied as per Paya\'s current fee schedule.',
        '5. DEFAULT: Failure to make payments as scheduled constitutes default. Upon default, Paya reserves the right to pursue collection through legal means.',
        '6. PREPAYMENT: The Customer may prepay the outstanding balance at any time without penalty.',
        '7. DATA USAGE: The Customer consents to Paya using their personal and financial information for credit assessment and reporting purposes.',
        '8. DISPUTE RESOLUTION: Any disputes arising from this Agreement shall be resolved through arbitration in Nairobi, Kenya.',
        '9. GOVERNING LAW: This Agreement shall be governed by the laws of Kenya.',
        '10. AMENDMENTS: This Agreement may only be amended in writing signed by both parties.'
      ];

      terms.forEach(term => {
        doc.text(term, { align: 'justify' });
        doc.moveDown(0.5);
      });

      doc.moveDown(1);

      // Next of Kin Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('NEXT OF KIN / EMERGENCY CONTACT');

      doc.moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica');

      if (customer.nextOfKin && customer.nextOfKin.firstName) {
        doc.text(`Name: ${customer.nextOfKin.firstName} ${customer.nextOfKin.lastName || ''}`)
          .text(`Relationship: ${customer.nextOfKin.relationship || 'N/A'}`)
          .text(`Phone: ${customer.nextOfKin.phoneCountryCode || '+254'}${customer.nextOfKin.phoneNumber || 'N/A'}`)
          .text(`Email: ${customer.nextOfKin.email || 'N/A'}`);
      } else {
        doc.text('Not provided');
      }

      doc.moveDown(2);

      // Signature Section
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('ACKNOWLEDGEMENT AND ACCEPTANCE');

      doc.moveDown(0.5);

      doc.fontSize(10)
        .font('Helvetica')
        .text('By accepting this agreement electronically, the Customer acknowledges that they have read, understood, and agree to be bound by the terms and conditions set forth in this Agreement.');

      doc.moveDown(1);

      // Signature lines
      const sigY = doc.y;

      doc.text('Customer Signature:', 50, sigY);
      doc.moveTo(150, sigY + 25).lineTo(280, sigY + 25).stroke();

      doc.text('Date:', 300, sigY);
      doc.moveTo(330, sigY + 25).lineTo(450, sigY + 25).stroke();

      doc.moveDown(3);

      doc.text(`Digital Acceptance: ${order.payment?.bnpl?.agreementAccepted ? 'YES' : 'PENDING'}`, 50);
      if (order.payment?.bnpl?.agreementAcceptedAt) {
        doc.text(`Accepted On: ${new Date(order.payment.bnpl.agreementAcceptedAt).toLocaleString('en-KE')}`, 50);
      }

      // Footer
      doc.fontSize(8)
        .text('This document is generated electronically and is valid without a physical signature when accepted digitally.',
          50, doc.page.height - 70, { align: 'center', width: 500 });

      doc.text(`Generated: ${new Date().toISOString()}`,
        50, doc.page.height - 50, { align: 'center', width: 500 });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate default payment schedule using declining balance method
 */
const generateDefaultPayments = (loanAmount, termMonths, interestRate = 8) => {
  const rate = interestRate / 100;
  const principalPerPayment = loanAmount / termMonths;
  let outstandingBalance = loanAmount;
  const payments = [];

  for (let i = 0; i < termMonths; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + i + 1);

    // Interest calculated on outstanding balance (declining balance method)
    const interest = outstandingBalance * rate;
    const monthlyPayment = principalPerPayment + interest;

    payments.push({
      paymentNumber: i + 1,
      principal: principalPerPayment,
      outstandingBalance: outstandingBalance,
      interest: interest,
      amount: monthlyPayment,
      dueDate
    });

    outstandingBalance -= principalPerPayment;
  }

  return payments;
};

/**
 * Delete a generated PDF file
 * @param {string} filePath - Path to the PDF file
 */
const deletePDF = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting PDF:', error.message);
    return false;
  }
};

module.exports = {
  generateBNPLAgreement,
  deletePDF,
  AGREEMENTS_DIR
};
