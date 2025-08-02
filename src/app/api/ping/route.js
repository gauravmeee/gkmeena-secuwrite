export async function GET() {
  try {
    const startTime = Date.now();
    
    const response = await fetch("https://btlgquarcynurgrrhzhs.supabase.co/rest/v1/diary_entries?select=id&limit=1", {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      console.error(`Supabase ping failed: ${response.status} ${response.statusText}`);
      return Response.json(
        { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          responseTime: `${responseTime}ms`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`Supabase ping successful: ${responseTime}ms`);
    
    return Response.json({
      success: true,
      message: "Supabase is active and responding",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      data: data
    });
    
  } catch (error) {
    console.error('Supabase ping error:', error.message);
    
    return Response.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        message: "Failed to ping Supabase"
      },
      { status: 500 }
    );
  }
}
  