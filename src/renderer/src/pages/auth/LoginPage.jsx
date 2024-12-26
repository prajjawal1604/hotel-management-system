import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Eye, EyeOff, Loader } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useRoomsStore } from '../../store/roomsStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useStore(state => state.setAuth);
  
  const [selectedRole, setSelectedRole] = useState('FRONT_OFFICE');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    identifier: '',
    password: '',
    general: ''
  });

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setErrors({ identifier: '', password: '', general: '' });
    };
  }, []);

// Form validation
const validateForm = () => {
  let isValid = true;
  const newErrors = { identifier: '', password: '', general: '' };

  if (!formData.identifier.trim()) {
    newErrors.identifier = 'Username or email is required';
    isValid = false;
  }

  if (formData.identifier.includes('@')) {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email';
      isValid = false;
    }
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
    isValid = false;
  }

  setErrors(newErrors);
  return isValid;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setErrors({ identifier: '', password: '', general: '' });

  if (!validateForm()) return;

  setIsLoading(true);
  console.log('Attempting login with:', { 
    identifier: formData.identifier, 
    role: selectedRole 
  });
  
  try {        
    // Login attempt
    const result = await window.electron.login({
      identifier: formData.identifier,
      password: formData.password,
      role: selectedRole
    });

    console.log('Login response:', {
      success: result.success,
      hasWarning: !!result.subscriptionWarning,
      isExpired: result.subscriptionExpired
    });

    if (result.subscriptionExpired) {
      setErrors({
        ...errors,
        general: 'Your subscription has expired. Please contact administrator to continue.'
      });
      return;
    }

    if (result.success) {        
      if (result.subscriptionWarning) {
        alert(result.subscriptionWarning);
      }

      // Extract relevant data from result
      const { username, role, data } = result;
      console.log('Setting auth data:', { username, role });

      // Update auth store with proper data structure
      setAuth({
        isAuthenticated: true,
        userRole: role,
        userData: { username },
        orgDetails: data.orgDetails // Using data from the proper path
      });

      // Initialize rooms store
      const {
        setSpaces,
        setCategories,
        setStats
      } = useRoomsStore.getState();

      // Fetch and set room data
      const roomDataResult = await window.electron.getRoomData();
      console.log('Room data received:', {
        success: roomDataResult.success,
        spacesCount: roomDataResult.data?.spaces?.length,
        categoriesCount: roomDataResult.data?.categories?.length
      });

      if (roomDataResult.success && roomDataResult.data) {
        // Set store data with defaults if needed
        setSpaces(roomDataResult.data.spaces || []);
        setCategories(roomDataResult.data.categories || []);
        setStats(roomDataResult.data.stats || {
          available: 0,
          occupied: 0,
          maintenance: 0
        });
        
        console.log('Store data updated, navigating to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Failed to fetch room data');
      }
    } else {
      setErrors({
        ...errors,
        general: result.message || 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login process error:', error);
    setErrors({
      ...errors,
      general: error.message || 'Login failed. Please try again.'
    });
  } finally {
    setIsLoading(false);
  }
};

const handleInputChange = (field) => (e) => {
  setFormData(prev => ({
    ...prev,
    [field]: e.target.value
  }));
  if (errors[field]) {
    setErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  }
};

  return (
    <div className="h-[calc(100vh-12rem)] w-full flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Sign In
        </h1>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {errors.general}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setSelectedRole('FRONT_OFFICE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors
              ${selectedRole === 'FRONT_OFFICE' 
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
            onClick={() => setSelectedRole('ADMIN')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors
              ${selectedRole === 'ADMIN' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border border-gray-300'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
          >
            <Shield size={20} />
            <span>Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={formData.identifier}
              onChange={handleInputChange('identifier')}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                ${errors.identifier ? 'border-red-500' : 'border-gray-300'}
                ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
              placeholder="Enter your username or email"
            />
            {errors.identifier && (
              <p className="mt-1 text-sm text-red-600">{errors.identifier}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange('password')}
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