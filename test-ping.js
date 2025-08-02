// Simple test script for the ping endpoint
async function testPing() {
  try {
    console.log('Testing Supabase ping endpoint...');
    
    const response = await fetch('http://localhost:3000/api/ping');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Ping successful!');
    } else {
      console.log('❌ Ping failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPing(); 