import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { image, filename } = await request.json();
    console.log('📤 API Request received:', { filename, imageLength: image?.length });

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('🤖 Sending request to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract ALL possible financial details from this document image. Return a JSON object with:
              - category: One of "Bank Statement", "Mobile Money", "Utilities", "Income Proof", "Receipt", "Invoice", "Other"
              - documentType: Specific type (e.g., "Monthly Bank Statement", "Electricity Bill", "Pay Stub")
              - keyDetails: Array containing EVERY detail you can extract including:
                * All amounts (balances, transactions, fees, charges)
                * All dates (statement dates, transaction dates, due dates)
                * Account numbers (partial - first 4 digits only for privacy)
                * Transaction descriptions
                * Merchant names
                * Reference numbers
                * Account holder information (names, addresses if visible)
                * Bank/institution names
                * Interest rates, fees, charges
                * Available balances, credit limits
                * Any other financial or identifying information
              - summary: Brief description of document type
              - confidence: Number between 0-1 indicating confidence in analysis

              Extract EVERYTHING you can see - be comprehensive and detailed. Include partial account numbers for privacy (first 4 digits only).
              
              Filename: ${filename}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 15000, // Increased for comprehensive detail extraction
    });

    console.log('📥 OpenAI Response received');
    console.log('📊 Usage stats:', response.usage);
    console.log('🎯 Finish reason:', response.choices[0]?.finish_reason);
    
    const analysisText = response.choices[0]?.message?.content;
    console.log('📝 Raw OpenAI response length:', analysisText?.length);
    console.log('📄 Full OpenAI response:');
    console.log('='.repeat(80));
    console.log(analysisText);
    console.log('='.repeat(80));
    
    if (!analysisText) {
      console.error('❌ No analysis received from OpenAI');
      throw new Error('No analysis received from OpenAI');
    }

    // Try to parse as JSON, fall back to text parsing if needed
    let analysis;
    console.log('🔧 Attempting to parse JSON...');
    
    // Always store the raw OpenAI response first
    const rawOpenAIResponse = analysisText;
    console.log('💾 Storing raw OpenAI response for database');
    
    try {
      // Remove markdown code blocks if present
      let cleanedText = analysisText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Fix common JSON formatting issues with numbers
      cleanedText = cleanedText
        .replace(/(-?\d+),(\d+)/g, '$1$2') // Remove commas from numbers like -1,088.20 -> -1088.20
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      console.log('🧹 Cleaned text for parsing (first 200 chars):', cleanedText.substring(0, 200) + '...');
      
      analysis = JSON.parse(cleanedText);
      console.log('✅ JSON parsing successful');
      console.log('📋 Parsed analysis object keys:', Object.keys(analysis));
      
      // Handle nested keyDetails structure - flatten it to array
      if (analysis.keyDetails && typeof analysis.keyDetails === 'object' && !Array.isArray(analysis.keyDetails)) {
        console.log('🔄 Converting nested keyDetails to flat array...');
        const flattenedDetails = [];
        
        // Extract amounts
        if (analysis.keyDetails.amounts && Array.isArray(analysis.keyDetails.amounts)) {
          analysis.keyDetails.amounts.forEach((amount: number, idx: number) => {
            flattenedDetails.push(`Amount ${idx + 1}: ${amount}`);
          });
        }
        
        // Extract dates
        if (analysis.keyDetails.dates && Array.isArray(analysis.keyDetails.dates)) {
          analysis.keyDetails.dates.forEach((date: string, idx: number) => {
            flattenedDetails.push(`Date ${idx + 1}: ${date}`);
          });
        }
        
        // Extract account numbers
        if (analysis.keyDetails.accountNumbers && Array.isArray(analysis.keyDetails.accountNumbers)) {
          analysis.keyDetails.accountNumbers.forEach((account: string, idx: number) => {
            flattenedDetails.push(`Account ${idx + 1}: ${account}`);
          });
        }
        
        // Extract transaction descriptions
        if (analysis.keyDetails.transactionDescriptions && Array.isArray(analysis.keyDetails.transactionDescriptions)) {
          analysis.keyDetails.transactionDescriptions.forEach((desc: string, idx: number) => {
            flattenedDetails.push(`Transaction ${idx + 1}: ${desc}`);
          });
        }
        
        // Extract merchant names
        if (analysis.keyDetails.merchantNames && Array.isArray(analysis.keyDetails.merchantNames)) {
          analysis.keyDetails.merchantNames.forEach((merchant: string, idx: number) => {
            flattenedDetails.push(`Merchant ${idx + 1}: ${merchant}`);
          });
        }
        
        // Extract reference numbers
        if (analysis.keyDetails.referenceNumbers && Array.isArray(analysis.keyDetails.referenceNumbers)) {
          analysis.keyDetails.referenceNumbers.forEach((ref: string, idx: number) => {
            flattenedDetails.push(`Reference ${idx + 1}: ${ref}`);
          });
        }
        
        // Extract account holder info
        if (analysis.keyDetails.accountHolderInformation) {
          const holder = analysis.keyDetails.accountHolderInformation;
          if (holder.name) flattenedDetails.push(`Account Holder: ${holder.name}`);
          if (holder.address) flattenedDetails.push(`Address: ${holder.address}`);
        }
        
        // Extract bank names
        if (analysis.keyDetails.bankNames && Array.isArray(analysis.keyDetails.bankNames)) {
          analysis.keyDetails.bankNames.forEach((bank: string, idx: number) => {
            flattenedDetails.push(`Bank ${idx + 1}: ${bank}`);
          });
        }
        
        // Extract available balances
        if (analysis.keyDetails.availableBalances && Array.isArray(analysis.keyDetails.availableBalances)) {
          analysis.keyDetails.availableBalances.forEach((balance: number, idx: number) => {
            flattenedDetails.push(`Available Balance ${idx + 1}: ${balance}`);
          });
        }
        
        // Extract fees and charges
        if (analysis.keyDetails.feesAndCharges && Array.isArray(analysis.keyDetails.feesAndCharges)) {
          analysis.keyDetails.feesAndCharges.forEach((fee: number | string, idx: number) => {
            flattenedDetails.push(`Fee/Charge ${idx + 1}: ${fee}`);
          });
        }
        
        analysis.keyDetails = flattenedDetails;
        console.log('✅ Flattened keyDetails to array with', flattenedDetails.length, 'items');
      }
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('🔄 Using fallback parsing for UI display only...');
      // Fallback: create structured response from text for UI display
      analysis = {
        category: extractCategory(analysisText, filename),
        documentType: extractDocumentType(analysisText, filename),
        keyDetails: extractKeyDetails(analysisText),
        summary: analysis?.summary || `Analysis of ${filename}`,
        confidence: 0.7
      };
      console.log('🔄 Fallback analysis created for UI display');
    }

    // Validate and ensure required fields
    const validatedAnalysis = {
      category: analysis.category || categorizeFromFilename(filename),
      documentType: analysis.documentType || 'Financial Document',
      keyDetails: Array.isArray(analysis.keyDetails) ? analysis.keyDetails : ['Document uploaded successfully'],
      summary: analysis.summary || `Analysis of ${filename}`,
      confidence: Math.min(Math.max(analysis.confidence || 0.7, 0), 1),
      rawOutput: rawOpenAIResponse // Always use the actual OpenAI response, not fallback data
    };

    console.log('✅ Final validated analysis:');
    console.log('📋 keyDetails count:', validatedAnalysis.keyDetails?.length);
    console.log('💾 Raw output length:', validatedAnalysis.rawOutput?.length);

    return NextResponse.json(validatedAnalysis);

  } catch (error: unknown) {
    console.error('💥 API Error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze document',
        fallback: {
          category: 'Other',
          documentType: 'Financial Document',
          keyDetails: ['Document uploaded successfully', 'Manual review recommended'],
          summary: 'Document uploaded but automatic analysis failed',
          confidence: 0.5
        }
      }, 
      { status: 500 }
    );
  }
}

// Helper functions for fallback analysis
function extractCategory(text: string, filename: string): string {
  const lowerText = text.toLowerCase();
  const lowerFilename = filename.toLowerCase();
  
  if (lowerText.includes('bank') || lowerText.includes('statement') || lowerFilename.includes('bank')) {
    return 'Bank Statement';
  }
  if (lowerText.includes('mobile money') || lowerText.includes('m-pesa') || lowerFilename.includes('mpesa')) {
    return 'Mobile Money';
  }
  if (lowerText.includes('utility') || lowerText.includes('electric') || lowerText.includes('water')) {
    return 'Utilities';
  }
  if (lowerText.includes('pay') || lowerText.includes('salary') || lowerText.includes('income')) {
    return 'Income Proof';
  }
  return 'Other';
}

function extractDocumentType(text: string, filename: string): string {
  const category = extractCategory(text, filename);
  return `${category} Document`;
}

function extractKeyDetails(text: string): string[] {
  const details = [];
  
  // Look for amounts
  const amounts = text.match(/\$?[\d,]+\.?\d*/g);
  if (amounts) {
    details.push(`Amount found: ${amounts[0]}`);
  }
  
  // Look for dates
  const dates = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g);
  if (dates) {
    details.push(`Date: ${dates[0]}`);
  }
  
  if (details.length === 0) {
    details.push('Financial document processed');
  }
  
  return details;
}

function categorizeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  
  if (lower.includes('bank') || lower.includes('statement')) return 'Bank Statement';
  if (lower.includes('mpesa') || lower.includes('mobile')) return 'Mobile Money';
  if (lower.includes('bill') || lower.includes('utility')) return 'Utilities';
  if (lower.includes('pay') || lower.includes('salary')) return 'Income Proof';
  
  return 'Other';
}