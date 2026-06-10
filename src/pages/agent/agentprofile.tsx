import { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Edit, Save, X, MapPin, Calendar, CreditCard, Shield, Phone, Mail, CheckCircle, Clock, AlertCircle, PlusCircle, RefreshCw } from 'lucide-react';
import Sidebar from '../../components/agentsidebar';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectProfile, selectProfileStatus } from '../../features/profile/profileSelectors';
import { getProfileByRoleThunk, updateProfileThunk, createProfileThunk } from '../../features/profile/profileThunks';

// Interfaces
interface ProfileAddress {
  line1?: string; line2?: string; city?: string; region?: string; postal_code?: string; country?: string;
}

interface ProfileData {
  _id?: string; id?: string; role: string; name: string; email: string; phone?: string; full_name?: string;
  dob?: string; national_id?: string; address?: ProfileAddress; driver_license?: { number?: string; class?: string; expires_at?: string; verified?: boolean };
  preferences?: { currency?: string; locale?: string }; gdpr?: { marketing_opt_in?: boolean }; status?: string;
  email_verified?: boolean; created_at?: string; updated_at?: string; roles?: string[];
}

// LocalStorage helpers
const getStoredUser = () => {
  try { 
    const auth = localStorage.getItem('car_rental_auth'); 
    return auth ? JSON.parse(auth)?.user : null; 
  } catch { 
    return null; 
  }
};

const getStoredRole = () => {
  const user = getStoredUser(); 
  return user?.roles?.[0] || localStorage.getItem('userRole') || localStorage.getItem('role') || '';
};

// Initial form state
const initialFormData: Partial<ProfileData> = {
  name: '', email: '', phone: '', full_name: '', dob: '', national_id: '',
  address: { line1: '', line2: '', city: '', region: '', postal_code: '', country: '' },
  driver_license: { number: '', class: '', expires_at: '' },
  preferences: { currency: 'USD', locale: 'en-ZW' }, 
  gdpr: { marketing_opt_in: false }
};

const AgentProfile = () => {
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const status = useAppSelector(selectProfileStatus);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>(initialFormData);
  const [hasProfile, setHasProfile] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: 'info' as 'success' | 'error' | 'info' });

  // Initialize from localStorage on component mount
  useEffect(() => {
    const role = getStoredRole();
    const user = getStoredUser();
    
    setUserRole(role);
    setAuthUser(user);
    
    if (user) {
      setFormData(prev => ({ 
        ...prev, 
        _id: user._id, 
        id: user._id, 
        name: user.name || '', 
        email: user.email || '', 
        phone: user.phone || '',
        role: user.roles?.[0] || role, 
        full_name: user.full_name || user.name || '', 
        status: user.status, 
        email_verified: user.email_verified,
        created_at: user.created_at, 
        updated_at: user.updated_at, 
        roles: user.roles || []
      }));
    }
  }, []);

  // Fetch profile when userRole changes
  const fetchProfile = useCallback(async () => {
    if (!userRole) return;
    
    try {
      const response = await dispatch(getProfileByRoleThunk(userRole)).unwrap();
      console.log('✅ Profile fetch response:', response);
      setHasProfile(true);
      
      // Show success notification when profile is fetched
      if (response?.data || response) {
        showNotify('Profile loaded successfully!', 'success');
      }
    } catch (error) {
      console.log('❌ Profile fetch error:', error);
      setHasProfile(false);
      if (!isCreating) {
        showNotify('Create your profile to get started', 'info');
      }
    }
  }, [dispatch, userRole, isCreating]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update form when profile loads
  useEffect(() => {
    if (!authUser) return;

    let newFormData: Partial<ProfileData> = {
      ...initialFormData,
      _id: authUser._id,
      id: authUser._id,
      name: authUser.name || '',
      email: authUser.email || '',
      phone: authUser.phone || '',
      role: authUser.roles?.[0] || userRole,
      full_name: authUser.full_name || authUser.name || '',
      status: authUser.status,
      email_verified: authUser.email_verified,
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
      roles: authUser.roles || []
    };

    // If we have a profile from API, merge it
    if (profile && typeof profile === 'object') {
      const profileData = profile as any;
      const data = profileData.data || profileData;
      
      if (data) {
        newFormData = {
          ...newFormData,
          _id: data._id || data.id || authUser._id,
          id: data.id || data._id || authUser._id,
          role: data.role || userRole,
          name: data.name || authUser.name || '',
          email: data.email || authUser.email || '',
          phone: data.phone || authUser.phone || '',
          full_name: data.full_name || authUser.full_name || authUser.name || '',
          dob: data.dob || '',
          national_id: data.national_id || '',
          address: data.address || initialFormData.address,
          driver_license: data.driver_license || initialFormData.driver_license,
          preferences: data.preferences || initialFormData.preferences,
          gdpr: data.gdpr || initialFormData.gdpr,
          status: data.status || authUser.status,
          email_verified: data.email_verified || authUser.email_verified,
          created_at: data.created_at || authUser.created_at,
          updated_at: data.updated_at || authUser.updated_at,
          roles: data.roles || authUser.roles || []
        };
      }
    }

    setFormData(newFormData);
  }, [profile, userRole, authUser]);

  // Helper functions
  const showNotify = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return 'Not set';
    try { 
      return new Date(dateString).toLocaleDateString('en-ZW', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch { 
      return 'Invalid date'; 
    }
  }, []);

  const getInitials = useCallback((name?: string) => {
    if (!name) return 'U';
    return name.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }, []);

  const getStatusBadge = useCallback((status?: string) => {
    const badges = {
      active: <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</span>,
      pending: <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>,
      suspended: <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />Suspended</span>
    };
    return badges[status as keyof typeof badges] || <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">{status || 'Unknown'}</span>;
  }, []);

  const getNotificationStyles = useCallback(() => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    };
    return styles[notification.type];
  }, [notification.type]);

  const getNotificationIcon = useCallback(() => {
    const icons = {
      success: <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />,
      error: <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />,
      info: <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
    };
    return icons[notification.type];
  }, [notification.type]);

  // Handlers
  const handleCreateProfile = () => {
    console.log('🚀 Creating profile triggered');
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditProfile = () => {
    console.log('✏️ Editing profile triggered');
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const profileId = formData._id || formData.id || authUser?._id;
      console.log('💾 Save triggered:', { isCreating, profileId, formData });
      
      let response;
      
      if (isCreating) {
        // Create new profile
        const createData = {
          role: userRole,
          name: formData.name || authUser?.name || '',
          email: formData.email || authUser?.email || '',
          phone: formData.phone || authUser?.phone || '',
          full_name: formData.full_name || authUser?.full_name || authUser?.name || '',
          dob: formData.dob,
          national_id: formData.national_id,
          address: formData.address,
          driver_license: formData.driver_license,
          preferences: formData.preferences,
          gdpr: formData.gdpr
        };
        
        console.log('📤 Create profile payload:', createData);
        response = await dispatch(createProfileThunk(createData as any)).unwrap();
        console.log('✅ Create profile response:', response);
        showNotify('Profile created successfully!', 'success');
        setHasProfile(true);
      } else {
        // Update existing profile
        const { _id, id, status, email_verified, created_at, updated_at, roles, ...updateData } = formData;
        console.log('📤 Update profile payload:', { id: profileId!, profileData: updateData });
        response = await dispatch(updateProfileThunk({ id: profileId!, profileData: updateData })).unwrap();
        console.log('✅ Update profile response:', response);
        showNotify('Profile updated successfully!', 'success');
      }

      setIsEditing(false);
      setIsCreating(false);
      
      // Refresh profile data
      await fetchProfile();
      
    } catch (error: any) {
      console.error('❌ Save error:', error);
      showNotify(error?.message || 'Failed to save profile', 'error');
    }
  };

  const handleCancel = () => {
    console.log('❌ Cancel triggered');
    setIsEditing(false);
    setIsCreating(false);
    
    // Trigger a fresh fetch to reset form data
    fetchProfile();
  };

  const handleRefreshProfile = async () => {
    console.log('🔄 Refresh profile triggered');
    try {
      await fetchProfile();
      showNotify('Profile refreshed successfully!', 'success');
    } catch (error) {
      console.log('❌ Profile refresh failed:', error);
      showNotify('Failed to refresh profile', 'error');
    }
  };

  // Form field components
  const FormField = ({ label, value, onChange, type = 'text', disabled = false, placeholder = '' }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    disabled?: boolean;
    placeholder?: string;
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label === 'Date of Birth' && <Calendar className="w-3 h-3 inline mr-1" />}{label}
        </label>
        {status === 'loading' ? (
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        ) : (isEditing || isCreating) ? (
          <input 
            type={type}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
          />
        ) : (
          <p className="text-gray-900 p-3 bg-gray-50 rounded-xl min-h-[44px] flex items-center">
            {value || 'Not set'}
          </p>
        )}
      </div>
    );
  };

  // Handler functions for form fields
  const handleFullNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, full_name: value }));
  };

  const handleEmailChange = (value: string) => {
    setFormData(prev => ({ ...prev, email: value }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleDobChange = (value: string) => {
    setFormData(prev => ({ ...prev, dob: value + 'T00:00:00Z' }));
  };

  const handleNationalIdChange = (value: string) => {
    setFormData(prev => ({ ...prev, national_id: value }));
  };

  const handleLicenseNumberChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      driver_license: { ...prev.driver_license, number: value }
    }));
  };

  const handleLicenseClassChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      driver_license: { ...prev.driver_license, class: value }
    }));
  };

  const handleLicenseExpiresChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      driver_license: { ...prev.driver_license, expires_at: value + 'T00:00:00Z' }
    }));
  };

  const handleAddressLine1Change = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, line1: value }
    }));
  };

  const handleAddressLine2Change = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, line2: value }
    }));
  };

  const handleAddressCityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, city: value }
    }));
  };

  const handleAddressPostalCodeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, postal_code: value }
    }));
  };

  const handleCurrencyChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, currency: value }
    }));
  };

  const handleMarketingOptInChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      gdpr: { ...prev.gdpr, marketing_opt_in: checked }
    }));
  };

  // Memoized current data for display
  const currentData = useMemo((): ProfileData => {
    if (isEditing || isCreating) {
      return formData as ProfileData;
    }
    
    // Always prioritize auth user data for basic information
    const baseData: ProfileData = { 
      role: userRole, 
      name: authUser?.name || '', 
      email: authUser?.email || '', 
      phone: authUser?.phone || '',
      full_name: authUser?.full_name || authUser?.name || '', 
      status: authUser?.status, 
      email_verified: authUser?.email_verified,
      created_at: authUser?.created_at, 
      updated_at: authUser?.updated_at, 
      roles: authUser?.roles || []
    };

    // If we have a profile from API, merge it
    if (profile && typeof profile === 'object') {
      const profileData = profile as any;
      const data = profileData.data || profileData;
      
      if (data) {
        return {
          ...baseData,
          ...data,
          _id: data._id || data.id || authUser?._id,
          id: data.id || data._id || authUser?._id,
          role: data.role || userRole,
          name: data.name || authUser?.name || '',
          email: data.email || authUser?.email || '',
          phone: data.phone || authUser?.phone || '',
          full_name: data.full_name || authUser?.full_name || authUser?.name || '',
        };
      }
    }

    return baseData;
  }, [formData, isEditing, isCreating, profile, userRole, authUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex">
      {/* Notification Popup */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in border rounded-xl shadow-lg p-4 max-w-sm ${getNotificationStyles()}`}>
          <div className="flex items-start">
            {getNotificationIcon()}
            <div className="flex-1">
              <h4 className="font-medium">{notification.type === 'success' ? 'Success!' : notification.type === 'error' ? 'Error!' : 'Info'}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="ml-4 hover:opacity-70"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-72">
        {/* Navbar */}
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm border-b border-blue-100">
          <div className="px-4 sm:px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-4 p-2 rounded-lg bg-slate-100/50 hover:bg-slate-200 transition-all" aria-label="Open menu">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-gray-600 hidden sm:inline">Dashboard</span>
                  <span className="text-slate-300 hidden sm:inline">›</span>
                  <span className="text-gray-800 font-medium">Profile</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center px-3 py-1 bg-blue-50 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-blue-700 font-medium">Authenticated</span>
                </div>
                {hasProfile && (
                  <button onClick={handleRefreshProfile} className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-all" title="Refresh Profile">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
            {/* Header Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 border border-blue-100 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    {status === 'loading' ? <div className="w-12 h-12 bg-blue-400 rounded-full animate-pulse"></div> : 
                      <span className="text-white font-bold text-2xl">{getInitials(currentData.full_name || currentData.name)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {status === 'loading' ? (
                      <>
                        <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 truncate">
                            {currentData.full_name || currentData.name || 'Not set'}
                          </h1>
                          {currentData.status && getStatusBadge(currentData.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                          <p className="text-gray-600 capitalize">{currentData.role}</p>
                          {currentData.email_verified && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />Email Verified
                            </span>
                          )}
                          {(isEditing || isCreating) && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {isCreating ? 'Creating Profile' : 'Editing Profile'}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {status !== 'loading' && (
                  <div className="flex gap-3 w-full sm:w-auto">
                    {!isEditing && !isCreating ? (
                      hasProfile ? (
                        <>
                          <button onClick={handleEditProfile} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none justify-center">
                            <Edit className="w-5 h-5" /> Edit Profile
                          </button>
                          <button onClick={handleCreateProfile} className="bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none justify-center">
                            <PlusCircle className="w-5 h-5" /> Create New
                          </button>
                        </>
                      ) : (
                        <button onClick={handleCreateProfile} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg w-full sm:w-auto justify-center">
                          <PlusCircle className="w-5 h-5" /> Create Profile
                        </button>
                      )
                    ) : (
                      <>
                        <button onClick={handleCancel} className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none justify-center">
                          <X className="w-5 h-5" /> Cancel
                        </button>
                        <button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg flex-1 sm:flex-none justify-center">
                          <Save className="w-5 h-5" /> {isCreating ? 'Create Profile' : 'Save Changes'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Auth Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentData.email && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Email</span>
                    </div>
                    <p className="text-blue-700 truncate">{currentData.email}</p>
                  </div>
                )}
                {currentData.phone && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Phone</span>
                    </div>
                    <p className="text-green-700">{currentData.phone}</p>
                  </div>
                )}
                {currentData.created_at && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Member Since</span>
                    </div>
                    <p className="text-purple-700">{formatDate(currentData.created_at).split(',')[0]}</p>
                  </div>
                )}
                {currentData.roles && currentData.roles.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Roles</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {currentData.roles.map((role, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Grid */}
            {authUser ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />Personal Information
                  </h2>
                  <FormField
                    label="Full Name"
                    value={formData.full_name || ''}
                    onChange={handleFullNameChange}
                    disabled={!isEditing && !isCreating}
                  />
                  <FormField
                    label="Email"
                    value={formData.email || ''}
                    onChange={handleEmailChange}
                    type="email"
                    disabled={true}
                  />
                  <FormField
                    label="Phone"
                    value={formData.phone || ''}
                    onChange={handlePhoneChange}
                    type="tel"
                    disabled={!isEditing && !isCreating}
                  />
                  <FormField
                    label="Date of Birth"
                    value={formData.dob?.split('T')[0] || ''}
                    onChange={(val) => handleDobChange(val)}
                    type="date"
                    disabled={!isEditing && !isCreating}
                  />
                  <FormField
                    label="National ID"
                    value={formData.national_id || ''}
                    onChange={handleNationalIdChange}
                    disabled={!isEditing && !isCreating}
                  />
                </div>

                {/* Address */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />Address
                  </h2>
                  <div className="space-y-4">
                    {status === 'loading' ? (
                      <div className="space-y-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>)}
                      </div>
                    ) : (isEditing || isCreating) ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                          <input 
                            type="text" 
                            value={formData.address?.line1 || ''}
                            onChange={(e) => handleAddressLine1Change(e.target.value)}
                            placeholder="Address Line 1"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                          <input 
                            type="text" 
                            value={formData.address?.line2 || ''}
                            onChange={(e) => handleAddressLine2Change(e.target.value)}
                            placeholder="Address Line 2"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input 
                            type="text" 
                            value={formData.address?.city || ''}
                            onChange={(e) => handleAddressCityChange(e.target.value)}
                            placeholder="City"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                          <input 
                            type="text" 
                            value={formData.address?.postal_code || ''}
                            onChange={(e) => handleAddressPostalCodeChange(e.target.value)}
                            placeholder="Postal Code"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all" 
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-900">{currentData.address?.line1 || 'Not set'}</p>
                        {currentData.address?.line2 && <p className="text-gray-900">{currentData.address.line2}</p>}
                        <p className="text-gray-900">
                          {[currentData.address?.city, currentData.address?.region].filter(Boolean).join(', ')}
                        </p>
                        <p className="text-gray-900">
                          {[currentData.address?.postal_code, currentData.address?.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Driver's License */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />Driver's License
                  </h2>
                  <div className="space-y-4">
                    <FormField
                      label="License Number"
                      value={formData.driver_license?.number || ''}
                      onChange={handleLicenseNumberChange}
                      disabled={!isEditing && !isCreating}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        label="Class"
                        value={formData.driver_license?.class || ''}
                        onChange={handleLicenseClassChange}
                        disabled={!isEditing && !isCreating}
                      />
                      <FormField
                        label="Expires"
                        value={formData.driver_license?.expires_at?.split('T')[0] || ''}
                        onChange={(val) => handleLicenseExpiresChange(val)}
                        type="date"
                        disabled={!isEditing && !isCreating}
                      />
                    </div>
                    {status !== 'loading' && !isEditing && !isCreating && currentData.driver_license && (
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${currentData.driver_license?.verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {currentData.driver_license?.verified ? 'Verified' : 'Pending Verification'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
                  <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />Preferences & Privacy
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      {status === 'loading' ? (
                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                      ) : (isEditing || isCreating) ? (
                        <select 
                          value={formData.preferences?.currency || 'USD'} 
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                        >
                          <option value="USD">USD</option>
                          <option value="ZWL">ZWL</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 p-3 bg-gray-50 rounded-xl min-h-[44px] flex items-center">
                          {currentData.preferences?.currency || 'USD'}
                        </p>
                      )}
                    </div>
                    {status !== 'loading' && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                        <input 
                          type="checkbox" 
                          checked={formData.gdpr?.marketing_opt_in || false} 
                          onChange={(e) => handleMarketingOptInChange(e.target.checked)}
                          disabled={!isEditing && !isCreating} 
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-1 flex-shrink-0 cursor-pointer" 
                        />
                        <label className="text-sm text-gray-700 cursor-pointer">
                          I agree to receive marketing communications
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-blue-100">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Not Authenticated</h3>
                  <p className="text-gray-600 mb-8">Please log in to view and manage your profile.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;