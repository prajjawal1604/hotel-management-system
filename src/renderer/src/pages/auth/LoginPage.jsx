// renderer/src/pages/auth/LoginPage.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Eye, EyeOff, Loader } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('front-office');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Validation states
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });

  // Form validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '', general: '' };

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });
  
    if (!validateForm()) return;
  
    setIsLoading(true);
    
    try {  
      const result = await window.electron.login({
        email: formData.email,
        password: formData.password,
        role: selectedRole
      });

  
      if (result.success) {        
        if (result.warning) {
          alert(result.warning);
        }
  
        const destinationPath = `/dashboard/${selectedRole}`;
        console.log('Navigating to:', destinationPath);
        navigate(destinationPath);
        console.log('Navigation triggered');
      } else {
        console.log('Login failed:', result.message);
        setErrors({
          ...errors,
          general: result.message || 'Invalid credentials'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        ...errors,
        general: 'Login failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] w-full flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Sign In
        </h1>

        {/* General Error Message */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Role Selection */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setSelectedRole('front-office')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors
              ${selectedRole === 'front-office' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
          >
            <User size={20} />
            <span>Front Office</span>
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setSelectedRole('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors
              ${selectedRole === 'admin' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
          >
            <Shield size={20} />
            <span>Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
  {/* Email Field */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Email
    </label>
    <input
      type="email"
      value={formData.email}
      onChange={(e) => {
        setFormData({ ...formData, email: e.target.value });
        if (errors.email) setErrors({ ...errors, email: '' });
      }}
      onBlur={() => {
        if (!formData.email) {
          setErrors({ ...errors, email: 'Email is required' });
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          setErrors({ ...errors, email: 'Please enter a valid email' });
        }
      }}
      disabled={isLoading}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
        ${errors.email ? 'border-red-500' : 'border-gray-300'}
        ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
      placeholder="Enter your email"
    />
    {errors.email && (
      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
    )}
  </div>

  {/* Password Field */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Password
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={formData.password}
        onChange={(e) => {
          setFormData({ ...formData, password: e.target.value });
          if (errors.password) setErrors({ ...errors, password: '' });
        }}
        onBlur={() => {
          if (!formData.password) {
            setErrors({ ...errors, password: 'Password is required' });
          } else if (formData.password.length < 6) {
            setErrors({ ...errors, password: 'Password must be at least 6 characters' });
          }
        }}
        disabled={isLoading}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
          ${errors.password ? 'border-red-500' : 'border-gray-300'}
          ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
        placeholder="Enter your password"
      />
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
    {errors.password && (
      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
    )}
  </div>
   {/* Submit Button */}
   <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </span>
          </button>
</form>
      </div>
    </div>
  );
};

export default LoginPage;