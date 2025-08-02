// API route handler to ping Supabase and keep it awake
export default async function handler(req, res) {
    // Send a GET request to a lightweight Supabase REST endpoint
    const response = await fetch("https://btlgquarcynurgrrhzhs.supabase.co/rest/v1/diary_entries?select=id&limit=1", {
      headers: {
        // Supabase anon key required for public access
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        // Authorization header using the same anon key
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });
  
    // Parse the JSON response
    const data = await response.json();
  
    // Return the data (e.g., list of IDs) as the response
    res.status(200).json(data);
  }
  