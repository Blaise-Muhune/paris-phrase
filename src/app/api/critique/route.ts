import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getCurrentUser } from '@/lib/auth-utils';
import { getUserCredits, useCredit as consumeCredit, checkFreeCreditEligibility } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use this feature.' },
        { status: 401 }
      );
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Check user credits and eligibility
    const userCredits = await getUserCredits(user.uid);
    if (!userCredits) {
      return NextResponse.json(
        { error: 'Failed to load user credits' },
        { status: 500 }
      );
    }

    // Check if user has custom OpenAI key (unlimited usage)
    let openaiApiKey = process.env.OPENAI_API_KEY;
    if (userCredits.customOpenAIKey) {
      openaiApiKey = userCredits.customOpenAIKey;
    } else {
      // Check free credit eligibility first
      const freeCreditEligible = await checkFreeCreditEligibility(userCredits);
      
      if (!freeCreditEligible && userCredits.credits <= 0) {
        return NextResponse.json(
          { error: 'No credits remaining. Please purchase more credits, subscribe, or add your own OpenAI API key.' },
          { status: 402 }
        );
      }
    }

    // Initialize OpenAI with appropriate API key
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    const critiquePrompt = `Analyze the following text and provide a comprehensive critique. Return your response as a JSON object with the following structure:

{
  "overallScore": number (1-10),
  "feedback": [
    {
      "type": "strength" | "improvement" | "critical",
      "category": "grammar" | "clarity" | "structure" | "style" | "coherence" | "vocabulary",
      "description": "Detailed explanation of the issue or strength",
      "suggestion": "Specific actionable suggestion for improvement"
    }
  ],
  "improvedVersion": "Complete rewritten version of the text with improvements applied"
}

CRITIQUE CRITERIA:
1. Grammar and Mechanics: Spelling, punctuation, sentence structure
2. Clarity and Coherence: How well ideas flow and connect
3. Style and Tone: Appropriateness for intended audience
4. Vocabulary: Word choice, precision, variety
5. Structure: Organization, paragraph development, logical flow
6. Engagement: How compelling and readable the text is

Provide 4-6 feedback items covering both strengths and areas for improvement. Be specific and constructive.

Text to critique:
${text}

Respond with valid JSON only:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert writing instructor and editor with extensive experience in academic, professional, and creative writing. Provide constructive, specific feedback that helps writers improve their craft. Always respond with valid JSON format.'
        },
        {
          role: 'user',
          content: critiquePrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let critiqueResult;
    try {
      critiqueResult = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, create a fallback response
      console.error('Failed to parse critique response as JSON:', parseError);
      critiqueResult = {
        overallScore: 7,
        feedback: [
          {
            type: "improvement",
            category: "clarity",
            description: "The text shows good potential but could benefit from more detailed analysis.",
            suggestion: "Consider adding more specific examples and clearer explanations."
          }
        ],
        improvedVersion: responseText
      };
    }

    // Validate the response structure
    if (!critiqueResult.overallScore || !critiqueResult.feedback) {
      throw new Error('Invalid critique response format');
    }

    // Use credit after successful processing
    if (!userCredits.customOpenAIKey) {
      const freeCreditEligible = await checkFreeCreditEligibility(userCredits);
      const creditResult = await consumeCredit(user.uid, 'critique', freeCreditEligible);
      
      if (!creditResult.success) {
        return NextResponse.json(
          { error: creditResult.message },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      ...critiqueResult,
      creditsRemaining: userCredits.customOpenAIKey ? 'unlimited' : (userCredits.credits - (userCredits.customOpenAIKey ? 0 : 1))
    });

  } catch (error) {
    console.error('Error critiquing text:', error);
    return NextResponse.json(
      { error: 'Failed to critique text. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
