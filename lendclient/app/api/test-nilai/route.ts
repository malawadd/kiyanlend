import { NextRequest, NextResponse } from 'next/server';

const NILLION_API_KEY = process.env.NILLION_API_KEY;

interface DocumentData {
  filename: string;
  category: string;
  documentType: string;
  keyDetails: string[];
  summary: string;
  rawOutput: string;
}

interface TestRequest {
  documentsData: DocumentData[];
  loanAmount: number;
  loanDuration: number;
  loanPurpose: string;
}

interface AssessmentResult {
  trustScore: number;
  summaryBullets: string[];
  riskFactors: string[];
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { documentsData, loanAmount, loanDuration, loanPurpose }: TestRequest = await request.json();

    if (!documentsData || !Array.isArray(documentsData)) {
      return NextResponse.json(
        { error: 'Documents data is required' },
        { status: 400 }
      );
    }

    if (!NILLION_API_KEY) {
      return NextResponse.json(
        { error: 'NILLION_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Prepare the context for AI analysis
    const documentsContext = documentsData.map(doc => ({
      filename: doc.filename,
      category: doc.category,
      type: doc.documentType,
      keyFinancialDetails: doc.keyDetails,
      aiSummary: doc.summary,
    }));

    const analysisPrompt = `
You are a financial risk assessment AI analyzing loan application documents. 

LOAN APPLICATION:
- Amount: $${loanAmount}
- Duration: ${loanDuration} months  
- Purpose: ${loanPurpose}

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

    console.log('🤖 Testing Nilai API with prompt length:', analysisPrompt.length);

    // Call the Nillion Nilai API
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

    console.log('📡 Nilai API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Nilai API error:', response.status, errorText);
      throw new Error(`Nilai API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const apiResult = await response.json();
    const aiResponse = apiResult.choices[0].message.content;

    console.log('🎯 AI Response received:', aiResponse.substring(0, 200) + '...');

    // Parse the JSON response from AI
    let assessmentResult: AssessmentResult;
    try {
      // Extract JSON from the AI response (in case there's additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      assessmentResult = JSON.parse(jsonStr);
      
      console.log('✅ Successfully parsed AI response');
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Raw AI response:', aiResponse);
      
      // Fallback assessment
      assessmentResult = {
        trustScore: 75,
        summaryBullets: [
          "Document analysis completed with AI review",
          "Financial data processed for risk assessment", 
          "Standard risk profile based on available information"
        ],
        riskFactors: [
          "AI response parsing failed - manual review recommended"
        ],
        recommendations: [
          "Request additional financial documentation for better assessment"
        ]
      };
    }

    // Validate and sanitize the results
    const finalResult = {
      trustScore: Math.max(0, Math.min(100, Math.floor(assessmentResult.trustScore))),
      summaryBullets: assessmentResult.summaryBullets.slice(0, 5), // Max 5 bullets
      riskFactors: assessmentResult.riskFactors.slice(0, 3), // Max 3 risk factors
      recommendations: assessmentResult.recommendations.slice(0, 2), // Max 2 recommendations
    };

    console.log('🎉 Test completed successfully. Trust Score:', finalResult.trustScore);

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('💥 Error in Nilai test:', error);
    
    // Return detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to test Nilai AI',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}