/* eslint-disable @typescript-eslint/no-unused-vars */
import { action } from "./_generated/server";
import { v } from "convex/values";

// Environment variable should be set in Convex dashboard
const NILLION_API_KEY = process.env.NILLION_API_KEY;

interface AssessmentResult {
  trustScore: number;
  summaryBullets: string[];
  riskFactors: string[];
  recommendations: string[];
}

export const analyzeDocumentsWithAI = action({
  args: {
    documentsData: v.array(v.object({
      filename: v.string(),
      category: v.string(),
      documentType: v.string(),
      keyDetails: v.array(v.string()),
      summary: v.string(),
      rawOutput: v.string(),
    })),
    loanAmount: v.number(),
    loanDuration: v.number(),
    loanPurpose: v.string(),
  },
  handler: async (ctx, args): Promise<AssessmentResult> => {
    if (!NILLION_API_KEY) {
      throw new Error("NILLION_API_KEY is not configured");
    }

    // Prepare the prompt with document analysis data
    const documentsContext = args.documentsData.map(doc => ({
      filename: doc.filename,
      category: doc.category,
      type: doc.documentType,
      keyFinancialDetails: doc.keyDetails,
      aiSummary: doc.summary,
    }));

    const analysisPrompt = `
You are a financial risk assessment AI analyzing loan application documents. 

LOAN APPLICATION:
- Amount: $${args.loanAmount}
- Duration: ${args.loanDuration} months  
- Purpose: ${args.loanPurpose}

DOCUMENT ANALYSIS RESULTS:
${JSON.stringify(documentsContext, null, 2)}

ASSESSMENT REQUIREMENTS:
1. Calculate a trust score (0-100) based on:
   - Income stability and verification
   - Expense patterns and financial discipline
   - Debt obligations and payment history
   - Cash flow consistency
   - Document completeness and authenticity

2. Provide 3-5 key summary points about financial health
3. Identify 2-3 main risk factors (if any)
4. Give 1-2 recommendations for the lender

RESPONSE FORMAT (JSON only):
{
  "trustScore": 85,
  "summaryBullets": [
    "Consistent monthly income of $4,200 verified through pay stubs",
    "Strong savings pattern with 15% income retention rate",
    "No missed payments in last 12 months based on bank statements"
  ],
  "riskFactors": [
    "High utility bills indicate potential overspending on housing",
    "Limited credit history with only 2 active accounts"
  ],
  "recommendations": [
    "Consider shorter loan term due to strong income",
    "Monitor borrower's housing cost ratio"
  ]
}

Analyze the financial data and provide only the JSON response:`;

    try {
      // Import the Nillion client dynamically since it's not available in Convex runtime
      // We'll use fetch to call the Nillion API directly
      const response = await fetch('https://nilai-a779.nillion.network/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NILLION_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'google/gemma-3-27b-it',
          messages: [{ 
            role: 'user', 
            content: analysisPrompt 
          }],
          temperature: 0.3, // Lower temperature for more consistent financial analysis
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Nilai API error: ${response.status} ${response.statusText}`);
      }

      const apiResult = await response.json();
      const aiResponse = apiResult.choices[0].message.content;

      // Parse the JSON response from AI
      let assessmentResult: AssessmentResult;
      try {
        // Extract JSON from the AI response (in case there's additional text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
        assessmentResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        // Fallback to default assessment
        assessmentResult = {
          trustScore: 65,
          summaryBullets: [
            "Document analysis completed with AI review",
            "Financial data processed for risk assessment",
            "Standard risk profile based on available information"
          ],
          riskFactors: [
            "Limited document context for comprehensive analysis"
          ],
          recommendations: [
            "Request additional financial documentation for better assessment"
          ]
        };
      }

      // Validate and sanitize the results
      return {
        trustScore: Math.max(0, Math.min(100, Math.floor(assessmentResult.trustScore))),
        summaryBullets: assessmentResult.summaryBullets.slice(0, 5), // Max 5 bullets
        riskFactors: assessmentResult.riskFactors.slice(0, 3), // Max 3 risk factors
        recommendations: assessmentResult.recommendations.slice(0, 2), // Max 2 recommendations
      };

    } catch (error) {
      console.error('Error calling Nilai API:', error);
      
      // Fallback assessment based on document count and categories
      const docCount = args.documentsData.length;
      const hasIncomeProof = args.documentsData.some(d => d.category.includes('Income'));
      const hasBankStatements = args.documentsData.some(d => d.category.includes('Bank'));
      
      let fallbackScore = 50; // Base score
      fallbackScore += docCount * 5; // +5 per document
      fallbackScore += hasIncomeProof ? 15 : 0; // +15 for income proof
      fallbackScore += hasBankStatements ? 10 : 0; // +10 for bank statements
      
      return {
        trustScore: Math.min(85, fallbackScore),
        summaryBullets: [
          `${docCount} financial documents provided for review`,
          hasIncomeProof ? "Income verification documents included" : "Additional income proof recommended",
          hasBankStatements ? "Bank transaction history available" : "Bank statements would strengthen application",
        ],
        riskFactors: [
          "AI analysis unavailable - manual review recommended",
          docCount < 3 ? "Limited documentation provided" : "Document review completed"
        ],
        recommendations: [
          "Manual underwriting recommended due to AI system unavailability",
          "Consider requesting additional financial documentation"
        ]
      };
    }
  },
});