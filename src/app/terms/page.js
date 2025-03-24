"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-24 px-4 pb-20">
        <h1 className="text-3xl font-bold mb-8">Terms and Conditions</h1>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <p className="text-gray-300 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p className="text-gray-300 mb-6">
            By accessing or using My Journal, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these Terms, you should not use our service.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Description of Service</h2>
          <p className="text-gray-300 mb-6">
            My Journal is a personal journaling application that allows users to create, edit, and store journal entries, diary notes, and other personal content. We offer both free and premium services with varying features.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
          <div className="text-gray-300 mb-6">
            <p className="mb-3">When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password. You are also responsible for all activities that occur under your account.</p>
            <p>We reserve the right to terminate accounts that violate our terms or for any other reason at our sole discretion.</p>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">User Content</h2>
          <div className="text-gray-300 mb-6">
            <p className="mb-3">Our service allows you to create and store personal content. You retain all rights to your content. By using our service, you grant us a license to host and store your content.</p>
            <p className="mb-3">You agree not to use our service to store or distribute content that is illegal, harmful, threatening, abusive, or otherwise objectionable.</p>
            <p>We reserve the right to remove any content that violates these terms or for any other reason at our sole discretion.</p>
          </div>
          
          <h2 className="text-2xl font-semibold mb-4">Data Backup</h2>
          <p className="text-gray-300 mb-6">
            While we strive to maintain the integrity and security of your data, we recommend that you regularly backup your important journal entries. For users utilizing local storage, please note that clearing your browser cache will result in the permanent loss of your data.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
          <p className="text-gray-300 mb-6">
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use or inability to use the service.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
          <p className="text-gray-300 mb-6">
            We reserve the right to modify these terms at any time. If we make changes, we will provide notice by posting the updated terms on this page. Your continued use of the service after any changes indicates your acceptance of the new terms.
          </p>
          
          <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
          <p className="text-gray-300">
            These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 