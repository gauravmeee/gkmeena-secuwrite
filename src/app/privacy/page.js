"use client";


export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <p className="text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Our Commitment to Privacy</h2>
          <p className="text-gray-300 mb-6">
            At Unseen Stories, we take your privacy very seriously. This Privacy Policy outlines how we collect, use, store, and protect your information when you use our service.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <div className="text-gray-300 mb-6">
            <p className="mb-2"><strong>Account Information:</strong> When you register, we collect your email address for account authentication.</p>
            <p className="mb-2"><strong>Journal Content:</strong> We store the journal and diary entries you create using our service.</p>
            <p><strong>Usage Data:</strong> We collect anonymous data about how you interact with our application to improve user experience.</p>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-2 mb-6">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information to improve our service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4">Data Storage</h2>
          <div className="text-gray-300 mb-6">
            <p className="mb-4"><strong>For Registered Users:</strong> Your journal entries are stored in our Supabase database. Each entry is securely linked to your account and cannot be accessed by other users.</p>
            <p className="mb-4"><strong>For Non-Registered Users:</strong> Your entries are stored in your browser&apos;s local storage and are not transmitted to our servers. These entries remain on your device and are not accessible to us.</p>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-gray-300 mb-6">
            We value your trust in providing us your personal information, and we are committed to protecting it. We use commercially acceptable means to protect your data, but no method of transmission over the Internet or method of electronic storage is 100% secure.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </div>
      </main>
      
    </div>
  );
} 