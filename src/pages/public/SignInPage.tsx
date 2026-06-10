// pages/auth/SignInScreen.tsx
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loginUser } from "../../features/auth/authThunks";
import { resetAuthError } from "../../features/auth/authSlice";
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { branchesService } from '../../Services/branchesService';

// API call to get manager's branch
const getAndStoreManagerBranch = async (managerId: string) => {
  try {
    const branches = await branchesService.getBranchesByManagerId(managerId);
    
    if (branches && branches.length > 0) {
      // Store the first branch's ID (or you can store all if needed)
      const branchId = branches[0]._id;
      localStorage.setItem('manager_branch_id', branchId);
     
      return branchId;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch manager branches:', error);
    return null;
  }
};

export default function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState<string>('');

  const dispatch = useAppDispatch();
  const { loading, error, status, user, token } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  // hydrate from ?role=
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const role = searchParams.get('role') || '';
    if (role) {
      setSelectedRole(role);
      sessionStorage.setItem("selected_role", role);
      console.log('Selected role from query:', role);
    }
  }, [location]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign In submitted with:', formData, 'Role:', selectedRole);

    dispatch(resetAuthError());

    dispatch(loginUser({
      email: formData.email,
      password: formData.password,
      // if your backend ignores extra fields, this won’t break; remove if strict:
      // @ts-ignore
      selected_role: selectedRole || undefined,
    }) as any).then((res: any) => {
      console.log("LOGIN RESPONSE FROM THUNK:", res);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(resetAuthError());
  };

  // redirect post-login based on selectedRole (fallback to user's first role)
  useEffect(() => {
    if (status === 'succeeded' && user && token) {
      const role =
        selectedRole ||
        user.roles?.[0] ||
        'customer';

     
    if (role === 'manager' || role === 'branch-manager') {
      getAndStoreManagerBranch(user._id).then(() => {
        window.location.href = '/branch-manager-dashboard';
      });
    } else {

      switch (role) {
        case 'admin':
          window.location.href = '/admin-dashboard';
          break;
       
        case 'agent':
          window.location.href = '/agentdashboard';
          break;
        case 'driver':
          window.location.href = '/driver-dashboard';
          break;
        case 'customer':
        default:
          window.location.href = '/dashboardy';
          break;
      }
    }
    }
  },  [status, user, token, selectedRole, navigate]);

  useEffect(() => {
    if (error) console.error('Login error:', error);
  }, [error]);

  const isLoading = loading || status === 'loading';

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl top-20 left-10 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl bottom-20 right-10 animate-pulse"></div>
        <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl top-1/3 right-1/4 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:scale-[1.02]">

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
              Sign In
            </h1>
            {selectedRole && (
              <div className="inline-block px-3 py-1 mb-2 bg-blue-500/30 rounded-full border border-blue-400/50">
                <p className="text-blue-200 text-sm font-medium">
                  Logging in as: <span className="capitalize font-bold">{selectedRole.replace('-', ' ')}</span>
                </p>
              </div>
            )}
            <p className="text-gray-300 text-sm">
              Welcome back to the exclusive experience
            </p>
            {!selectedRole && (
              <p className="text-yellow-300 text-xs mt-2">
                Note: No role selected. You'll be redirected to default dashboard.
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-xl text-blue-200 text-sm text-center">
              Signing you in...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors duration-300 disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-blue-500 disabled:opacity-50" 
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-300 text-sm">Remember me</span>
              </label>
              <a href="#" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-blue-500/30 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300 text-sm">
              Don't have an account?{' '}
              <Link
                to={`/signup${selectedRole ? `?role=${encodeURIComponent(selectedRole)}` : ""}`}
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors underline"
              >
                Signup
              </Link>
            </p>
            <div className="mt-4">
              <button
                onClick={() => navigate('/roles')}
                className="text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                ← Choose different role
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6 backdrop-blur-sm bg-black/30 rounded-lg py-2 px-4">
          Protected by our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
