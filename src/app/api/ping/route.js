export async function GET() {
    const response = await fetch("https://btlgquarcynurgrrhzhs.supabase.co/rest/v1/diary_entries?select=id&limit=1", {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
  
    const data = await response.json();
    return Response.json(data); // Send response correctly for App Router
  }
  