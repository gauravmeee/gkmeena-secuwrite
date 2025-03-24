"use client";


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <h1 className="text-3xl font-bold mb-8">About Unseen Stories</h1>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-300 mb-6">
            Unseen Stories is a personal journaling app designed to help you document your thoughts, ideas, and memories in a secure and private environment. 
            We believe that journaling is a powerful tool for self-reflection, personal growth, and mental well-being.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-2 mb-6">
            <li>Rich text journaling with multiple formatting options</li>
            <li>Daily diary entries to record your thoughts and experiences</li>
            <li>Private and secure - your data belongs to you</li>
            <li>Cloud storage for registered users</li>
            <li>Local storage option for quick access without registration</li>
            <li>Modern, clean interface designed for focused writing</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-300">
            Unseen Stories was created by a team of developers who are passionate about personal development and mental wellbeing. 
            We wanted to create a tool that would help people express themselves freely and keep track of their thoughts and experiences 
            over time. The app was built with a focus on privacy, ease of use, and beautiful design.
          </p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-4">
            We&aposd love to hear from you! If you have any questions, feedback, or suggestions, please feel free to reach out to us.
          </p>
          <p className="text-gray-300">
            Email: <a href="mailto:gaurav28.official@gmail.com" className="text-primary hover:underline">gaurav28.official@gmail.com</a>
          </p>
        </div>
      </main>
      
    </div>
  );
} 