import React, { useState } from 'react';
import { Shield, Key, Eye, EyeOff, Info, ArrowRight } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { EquitasIcon, EquitasTextLogo } from './EquitasLogo';
import { loginRequest } from '../authConfig';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, name: string, role: 'PM' | 'Stakeholder', employeeId?: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { instance } = useMsal();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Trigger Microsoft Entra ID (Azure AD) sign-in via redirect.
  // The redirect result is handled in main.tsx / App.tsx, which then maps the
  // MSAL account into the app session.
  const handleMicrosoftSignIn = async () => {
    setError('');
    try {
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      console.error('[MSAL] loginRedirect failed:', err);
      setError('Microsoft sign-in failed to start. Please try again or use a profile below.');
    }
  };

  // Stakeholder quick logins to test RBAC
  const testUsers = [
    { label: 'Super Admin - Approve Deletions & Full Control', id: 'superadmin', pass: 'password123', name: 'Super Admin', type: 'PM' as const, empId: 'EMP0000' },
    { label: 'Admin (Vinoth) - Request Deletion & Edit All', id: 'admin', pass: 'password123', name: 'Vinoth', type: 'PM' as const, empId: 'EMP0001' },
    { label: 'Project Manager (Deepan) - Create & Own Project Edit', id: 'deepan', pass: 'password123', name: 'Deepan', type: 'PM' as const, empId: 'EMP1111' },
    { label: 'Application Owner (Chandru) - Create & Own Project Edit', id: 'chandru', pass: 'password123', name: 'Chandru', type: 'Stakeholder' as const, empId: 'EMP2222' },
    { label: 'Regular User (Padma) - Create & View Only', id: 'padma', pass: 'password123', name: 'Padma', type: 'Stakeholder' as const, empId: 'EMP3333' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('Please enter your User ID or Employee ID.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    // 1a. Super Admin login (checker role for the deletion workflow)
    if (userId.toLowerCase() === 'superadmin' && password === 'password123') {
      onLoginSuccess('superadmin', 'Super Admin', 'PM', 'EMP0000');
      return;
    }

    // 1b. Check for standard PM Admin login
    if (userId.toLowerCase() === 'admin' && password === 'password123') {
      onLoginSuccess('admin', 'Vinoth', 'PM', 'EMP0001');
      return;
    }

    // 2. Check for Stakeholder mock logins
    const foundUser = testUsers.find(u => u.id === userId && u.pass === password);
    if (foundUser) {
      onLoginSuccess(foundUser.id, foundUser.name, foundUser.type, foundUser.empId);
      return;
    }

    // 3. Fallback for testing any stakeholder ID with standard password
    if (userId.startsWith('EMP') && password === 'password123') {
      onLoginSuccess(userId, `Stakeholder (${userId})`, 'Stakeholder', userId);
      return;
    }

    setError('Invalid credentials. Use admin / password123 or one of the quick-login profiles below.');
  };

  const fillCredentials = (user: typeof testUsers[0]) => {
    setUserId(user.id);
    setPassword(user.pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="login-container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center gap-2">
            <EquitasIcon className="h-14 w-14 drop-shadow-md" id="login-equitas-icon" />
            <div className="h-10 w-[1px] bg-slate-300 self-center mx-1" />
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              Equitas<span className="bg-[#1b4d8c] text-white px-1.5 py-0.5 rounded text-xs ml-1.5 font-black uppercase tracking-wider align-middle">PM</span>
            </span>
          </div>
          <EquitasTextLogo className="h-11 w-auto" id="login-equitas-text-logo" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold text-slate-800 tracking-tight" id="login-heading">
          Project Management
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500" id="login-subheading">
          Equitas Small Finance Bank
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-card-container">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200" id="login-card">
          <form className="space-y-6" onSubmit={handleSubmit} id="login-form">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2" id="login-error-alert">
                <Info className="h-5 w-5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-slate-700">
                User ID / Employee ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-5 w-5" />
                </div>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-10 pr-3 py-2.5 sm:text-sm border border-slate-200 rounded-xl"
                  placeholder="e.g. admin or EMP9087"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent block w-full pl-10 pr-10 py-2.5 sm:text-sm border border-slate-200 rounded-xl"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  id="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 cursor-pointer"
                id="login-submit-btn"
              >
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6" id="login-divider">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 uppercase tracking-wider">or</span>
            </div>
          </div>

          {/* Microsoft SSO */}
          <button
            type="button"
            onClick={handleMicrosoftSignIn}
            className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 cursor-pointer"
            id="microsoft-signin-btn"
          >
            <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>

          {/* Development Testing Guide */}
          <div className="mt-8 border-t border-slate-200 pt-6" id="login-testing-panel">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Info className="h-3.5 w-3.5 text-blue-500" />
              Mock Role-Based Access Profiles
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select a test account below to automatically fill credentials and test different access controls.
            </p>
            <div className="space-y-2.5" id="quick-logins-list">
              {testUsers.map((user, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => fillCredentials(user)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition duration-150 flex flex-col gap-1 cursor-pointer"
                  id={`quick-login-${user.id}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-800">{user.label}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-200 rounded text-slate-600 border border-slate-300">
                      {user.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>ID: <strong className="text-blue-600">{user.id}</strong></span>
                    <span>Pass: <strong className="text-slate-600">{user.pass}</strong></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
