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

    const { text, advancedMode = false, writingMode = 'academic', styleSample = null } = await request.json();

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
          { 
            error: 'No credits remaining. You have used your free weekly credit and have no paid credits. Please purchase more credits, subscribe, or add your own OpenAI API key.',
            creditsRemaining: 0,
            freeCreditsUsed: userCredits.freeCreditsUsed,
            freeCreditsRemaining: Math.max(0, 1 - userCredits.freeCreditsUsed),
            lastFreeCreditReset: userCredits.lastFreeCreditReset
          },
          { status: 402 }
        );
      }
    }

    // Initialize OpenAI with appropriate API key
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Define writing mode configurations
    const writingModes = {
      academic: {
        systemPrompt: `You are an expert at creating undetectable human-like academic writing. Transform AI text into authentic student academic writing.

CRITICAL RULES:
- Return ONLY plain text (no JSON, markdown, quotes, or formatting)
- Preserve ALL titles/headings exactly as written (unless over 50 words)
- Use ONLY regular hyphens (-), never em dashes (– or —)
- Maintain original text length (within 10-15% variation)
- Ensure proper word spacing and punctuation

ACADEMIC REQUIREMENTS:
- Use formal scholarly language (no contractions, casual expressions, or colloquialisms)
- Break long sentences into shorter, clearer ones for readability
- Add smooth transitions between ideas ("Furthermore," "Moreover," "In contrast")
- Include natural academic qualifiers ("it appears that," "research suggests")
- Vary sentence structure while maintaining sophistication
- Preserve all original details and arguments

UNDETECTABILITY KEYS:
- Perfect grammar and punctuation
- Natural human imperfections in phrasing
- Logical flow and coherent structure
- Appropriate academic redundancy
- Varied paragraph structures`,
        
        temperature: 0.8,
        frequency_penalty: 0.9,
        presence_penalty: 0.7
      },
      
      professional: {
        systemPrompt: `You are an expert at creating undetectable human-like professional business writing. Transform AI text into authentic professional communication.

CRITICAL RULES:
- Return ONLY plain text (no JSON, markdown, quotes, or formatting)
- Preserve ALL titles/headings exactly as written (unless over 50 words)
- Use ONLY regular hyphens (-), never em dashes (– or —)
- Maintain original text length (within 10-15% variation)
- Ensure proper word spacing and punctuation

PROFESSIONAL REQUIREMENTS:
- Use clear, business-appropriate language with industry terminology
- Maintain neutral, objective tone with subtle personal touches
- Include occasional business-appropriate contractions
- Add natural professional qualifiers and hesitations
- Vary sentence structure while avoiding corporate jargon
- Create logical flow with natural business transitions

UNDETECTABILITY KEYS:
- Natural business redundancy and clarification
- Professional discourse markers used naturally
- Varied sentence and paragraph lengths
- Authentic professional voice with slight personal perspective`,
        
        temperature: 0.8,
        frequency_penalty: 0.6,
        presence_penalty: 0.4
      },
      
      casual: {
        systemPrompt: `You are an expert at creating undetectable human-like casual writing. Transform AI text into natural, conversational human writing.

CRITICAL RULES:
- Return ONLY plain text (no JSON, markdown, quotes, or formatting)
- Preserve ALL titles/headings exactly as written (unless over 50 words)
- Use ONLY regular hyphens (-), never em dashes (– or —)
- Maintain original text length (within 10-15% variation)
- Ensure proper word spacing and punctuation

CASUAL REQUIREMENTS:
- Use frequent contractions (don't, won't, can't, it's, they're)
- Include idiomatic expressions and colloquialisms
- Add personal pronouns and subjective language
- Use relaxed, friendly tone with personal opinions
- Include natural hesitations, qualifiers, and asides
- Add conversational redundancy and natural digressions

UNDETECTABILITY KEYS:
- Natural conversational transitions and flow
- Varied sentence structures including occasional fragments
- Parenthetical thoughts and commentary
- Genuine casual voice while maintaining readability`,
        
        temperature: 0.9,
        frequency_penalty: 0.8,
        presence_penalty: 0.6
      },
      
      creative: {
        systemPrompt: `You are an expert at creating undetectable human-like creative writing. Transform AI text into natural, engaging creative writing.

CRITICAL RULES:
- Return ONLY plain text (no JSON, markdown, quotes, or formatting)
- Preserve ALL titles/headings exactly as written (unless over 50 words)
- Use ONLY regular hyphens (-), never em dashes (– or —)
- Maintain original text length (within 10-15% variation)
- Ensure proper word spacing and punctuation

CREATIVE REQUIREMENTS:
- Use vivid imagery and descriptive language
- Create varied sentence rhythms and poetic flow
- Include creative metaphors and figurative language
- Add emotional depth and personal perspective
- Use engaging narrative voice and personal style
- Include varied vocabulary with creative word choices

UNDETECTABILITY KEYS:
- Unpredictable sentence structures and rhythms
- Natural creative transitions and flow
- Original expressions and phrasing (avoid clichés)
- Creative redundancy and emphasis for effect`,
        
        temperature: 0.95,
        frequency_penalty: 0.9,
        presence_penalty: 0.7
      }
    };

    const modeConfig = writingModes[writingMode as keyof typeof writingModes] || writingModes.academic;

    // Analyze style sample if provided
    let styleAnalysis = '';
    if (styleSample && styleSample.trim()) {
      const analysisPrompt = `Analyze the following writing sample and identify the key style characteristics. Focus on:

1. Sentence structure patterns (length, complexity, variety)
2. Vocabulary level and word choices
3. Use of contractions, formal vs informal language
4. Transition words and phrases commonly used
5. Personal voice and perspective
6. Punctuation and formatting patterns
7. Overall tone and personality

Writing sample:
${styleSample}

Provide a concise analysis of the writing style characteristics:`;

      try {
        const analysisCompletion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at analyzing writing styles and identifying key characteristics that make each writer unique.'
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        });

        styleAnalysis = analysisCompletion.choices[0]?.message?.content || '';
      } catch (error) {
        console.error('Error analyzing style sample:', error);
        // Continue without style analysis if it fails
      }
    }

    const userPrompt = `Transform this AI text into authentic human ${writingMode} writing that passes all AI detection.

KEY REQUIREMENTS:
- NO em dashes (– or —) - use regular hyphens (-) only
- Preserve titles/headings exactly (unless over 50 words)
- Maintain original length (within 10-15% variation)
- Return ONLY plain text (no JSON, formatting, quotes)
- Ensure proper word spacing and punctuation

${writingMode === 'academic' ? 'ACADEMIC FOCUS: Use formal scholarly language, no contractions, smooth transitions, proper punctuation, and break long sentences for readability.' : ''}

${styleAnalysis ? `STYLE MATCHING: Apply these characteristics from the writing sample:
${styleAnalysis}` : ''}

Original text (${text.length} characters):
${text}

Transform into natural ${writingMode} writing:`;

    // Use mode-specific parameters for optimal output
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: modeConfig.systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: modeConfig.temperature,
      max_tokens: 2500,
      frequency_penalty: modeConfig.frequency_penalty,
      presence_penalty: modeConfig.presence_penalty,
      top_p: 0.9,
    });

    let humanizedText = completion.choices[0]?.message?.content;

    if (!humanizedText) {
      throw new Error('No response from OpenAI');
    }

    // Post-processing: Replace any em dashes that might have slipped through
    humanizedText = humanizedText.replace(/[–—]/g, '-');

    // Advanced mode: Second pass for even better humanization
    if (advancedMode) {
      const refinementPrompt = `Refine this ${writingMode} text to be even more naturally human and undetectable.

CRITICAL RULES:
- NO em dashes (– or —) - use regular hyphens (-) only
- Return ONLY plain text (no JSON, formatting, quotes)
- Preserve titles/headings exactly
- Maintain original length (${text.length} chars, ±10-15%)
- Ensure proper spacing and punctuation

${writingMode === 'academic' ? 'ACADEMIC FOCUS: Keep scholarly vocabulary (not "brainiacs"), maintain formal tone, avoid casual expressions, use precise academic language.' : ''}

REFINEMENT GOALS:
- Add subtle human imperfections in phrasing
- Increase natural ${writingMode} patterns and flow
- Break remaining AI patterns while maintaining quality
- ${writingMode === 'academic' ? 'Include natural academic hesitations and qualifiers' : 'Add appropriate personal touches'}

${styleAnalysis ? `ENHANCE STYLE MATCHING: ${styleAnalysis}` : ''}

Current text:
${humanizedText}

Make it more naturally human:`;

      const refinementCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a master at making text appear completely human-written with natural imperfections and authentic ${writingMode} voice. CRITICAL: Never use em dashes (– or —). Only use regular hyphens (-) or double hyphens (--). Use standard punctuation that humans naturally use. MAINTAIN ${writingMode.toUpperCase()} TONE throughout - do not make it too casual if it should be academic.`
          },
          {
            role: 'user',
            content: refinementPrompt
          }
        ],
        temperature: 0.98, // Even higher temperature for maximum variation
        max_tokens: 2500,
        frequency_penalty: 1.0, // Maximum penalty for repetition
        presence_penalty: 0.8,
        top_p: 0.95,
      });

      const refinedText = refinementCompletion.choices[0]?.message?.content;
      if (refinedText) {
        // Post-processing: Replace any em dashes that might have slipped through
        humanizedText = refinedText.replace(/[–—]/g, '-');
      }
    }

    // Use credit after successful processing
    if (!userCredits.customOpenAIKey) {
      const freeCreditEligible = await checkFreeCreditEligibility(userCredits);
      const creditResult = await consumeCredit(user.uid, 'humanize', freeCreditEligible);
      
      if (!creditResult.success) {
        return NextResponse.json(
          { error: creditResult.message },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      originalText: text,
      humanizedText: humanizedText.trim(),
      advancedMode: advancedMode,
      writingMode: writingMode,
      styleMatched: !!styleSample,
      creditsRemaining: userCredits.customOpenAIKey ? 'unlimited' : (userCredits.credits - (userCredits.customOpenAIKey ? 0 : 1))
    });

  } catch (error) {
    console.error('Error humanizing text:', error);
    return NextResponse.json(
      { error: 'Failed to humanize text. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
