import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET() {
  try {
    // Test if the otp_verification table exists
    const { data, error } = await supabase
      .from('otp_verification')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database table exists and is accessible',
      data: data
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}
