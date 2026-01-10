'use client';

import { useState } from 'react';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { useToast } from '../ui/NeoToast';

interface TestResult {
  trustScore: number;
  summaryBullets: string[];
  riskFactors: string[];
  recommendations: string[];
}

export function NilaiTestComponent() {
  const [isTestingAI, setIsTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const { showToast } = useToast();

  const testNilaiAnalysis = async () => {
    setIsTestingAI(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      // Create dummy document data similar to what would come from uploaded documents
      const dummyDocumentsData = [
        {
          filename: "bank_statement_nov2024.pdf",
          category: "Bank Statement",
          documentType: "Monthly Bank Statement",
          keyDetails: [
            "Monthly income: $4,200",
            "Average balance: $2,800", 
            "No overdrafts in 6 months",
            "Regular savings deposits: $500/month"
          ],
          summary: "Primary checking account showing consistent income and responsible spending patterns",
          rawOutput: JSON.stringify({
            transactions: 45,
            income_frequency: "bi-weekly",
            spending_categories: ["groceries", "utilities", "rent", "entertainment"]
          })
        },
        {
          filename: "pay_stub_dec2024.pdf", 
          category: "Income Proof",
          documentType: "Pay Stub",
          keyDetails: [
            "Gross pay: $2,100 bi-weekly",
            "Net pay: $1,650 bi-weekly",
            "YTD earnings: $48,600",
            "Employer: Tech Solutions Inc"
          ],
          summary: "Recent pay stub showing stable employment and consistent income",
          rawOutput: JSON.stringify({
            pay_period: "bi-weekly",
            deductions: ["federal_tax", "state_tax", "health_insurance", "401k"],
            employment_status: "full_time"
          })
        },
        {
          filename: "utility_bill_dec2024.pdf",
          category: "Utilities", 
          documentType: "Electric Bill",
          keyDetails: [
            "Monthly amount: $120",
            "Payment history: On time",
            "Account in good standing",
            "Usage: 850 kWh"
          ],
          summary: "Utility bill showing timely payments and stable residence",
          rawOutput: JSON.stringify({
            payment_method: "auto_pay",
            service_address: "verified",
            account_age: "18_months"
          })
        }
      ];

      // Test with realistic loan parameters
      const testLoanData = {
        loanAmount: 15000,
        loanDuration: 24,
        loanPurpose: "Home improvement and debt consolidation"
      };

      showToast('Testing Nilai AI analysis...', 'info');

      // Make direct call to the Nilai analysis function
      const response = await fetch('/api/test-nilai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentsData: dummyDocumentsData,
          ...testLoanData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setTestResult(result);
      showToast('✅ Nilai AI test completed successfully!', 'success');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestError(errorMessage);
      showToast(`❌ Nilai AI test failed: ${errorMessage}`, 'danger');
    } finally {
      setIsTestingAI(false);
    }
  };

  return (
    <NeoCard bg="bg-primary" className="bg-opacity-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black uppercase">🤖 Nilai AI Test</h3>
        <NeoButton
          size="sm"
          variant="accent"
          onClick={testNilaiAnalysis}
          disabled={isTestingAI}
        >
          {isTestingAI ? 'Testing...' : 'Test AI Analysis'}
        </NeoButton>
      </div>
      
      <p className="text-sm font-semibold mb-4 text-gray-700">
        Test the Nilai AI integration with dummy financial documents
      </p>

      {isTestingAI && (
        <div className="p-3 bg-secondary bg-opacity-30 border-2 border-foreground mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold">Running AI analysis on dummy data...</span>
          </div>
        </div>
      )}

      {testError && (
        <div className="p-4 bg-danger bg-opacity-30 border-2 border-danger mb-4">
          <p className="text-sm font-bold text-red-800">❌ Error:</p>
          <p className="text-sm font-semibold text-red-700">{testError}</p>
        </div>
      )}

      {testResult && (
        <div className="p-4 bg-success bg-opacity-30 border-2 border-success">
          <p className="text-sm font-bold mb-3">✅ AI Analysis Results:</p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Trust Score:</span>
              <span className="text-lg font-black">{testResult.trustScore}/100</span>
            </div>
            
            <div>
              <p className="text-sm font-bold mb-2">Summary:</p>
              <ul className="space-y-1">
                {testResult.summaryBullets?.map((bullet: string, idx: number) => (
                  <li key={idx} className="text-xs font-semibold flex items-start gap-2">
                    <span className="text-success">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {testResult.riskFactors?.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-orange-700">Risk Factors:</p>
                <ul className="space-y-1">
                  {testResult.riskFactors.map((risk: string, idx: number) => (
                    <li key={idx} className="text-xs font-semibold flex items-start gap-2">
                      <span className="text-orange-600">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {testResult.recommendations?.length > 0 && (
              <div>
                <p className="text-sm font-bold mb-2 text-blue-700">Recommendations:</p>
                <ul className="space-y-1">
                  {testResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-xs font-semibold flex items-start gap-2">
                      <span className="text-blue-600">💡</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </NeoCard>
  );
}