"use client";

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiUser, FiX } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

export default function AuthModal() {
  const { isAuthModalOpen, toggleAuthModal, signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    // Validate fields
    if (!email || !password) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      setLoading(false);
      return;
    }

    // For signup, check if passwords match
    if (!isLogin && password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in
        const { success, error } = await signIn(email, password);
        if (!success) {
          setMessage({ text: error || 'Login failed', type: 'error' });
        }
      } else {
        // Sign up
        const { success, error, message } = await signUp(email, password);
        if (success) {
          setMessage({ text: message || 'Registration successful. Check your email.', type: 'success' });
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        } else {
          setMessage({ text: error || 'Registration failed', type: 'error' });
        }
      }
    } catch (error) {
      setMessage({ text: error.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const { success, error } = await signInWithGoogle();
      
      if (!success) {
        setMessage({ text: error || 'Google login failed', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: error.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-md rounded-xl border border-gray-800 shadow-xl overflow-hidden">
        <div className="relative p-6">
          <button 
            onClick={toggleAuthModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
              {message.text}
            </div>
          )}
          
          {/* Google Sign-in Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 p-3 rounded-md hover:bg-gray-100 transition-colors font-medium mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <FcGoogle size={20} />
            <span>{isLogin ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or continue with email</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiMail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <FiLock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <FiLock size={16} />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage({ text: '', type: '' });
              }}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 