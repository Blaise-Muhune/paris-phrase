import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-utils';
import { updateCustomOpenAIKey } from '@/lib/firestore';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Validate the API key by making a test request
    try {
      const openai = new OpenAI({ apiKey });
      await openai.models.list();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your key and try again.'+error },
        { status: 400 }
      );
    }

    // Store the API key
    await updateCustomOpenAIKey(user.uid, apiKey);

    return NextResponse.json({ 
      success: true, 
      message: 'OpenAI API key updated successfully. You now have unlimited usage!' 
    });

  } catch (error) {
    console.error('Error updating OpenAI key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Remove the API key
    await updateCustomOpenAIKey(user.uid, '');

    return NextResponse.json({ 
      success: true, 
      message: 'Custom OpenAI API key removed. You will now use credits.' 
    });

  } catch (error) {
    console.error('Error removing OpenAI key:', error);
    return NextResponse.json(
      { error: 'Failed to remove API key' },
      { status: 500 }
    );
  }
}
