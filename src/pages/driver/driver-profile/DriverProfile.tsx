import React, { useState, useEffect, useCallback, useRef } from "react";
import DriverSidebar from "../../../components/DriverSideBar";
import DriverProfileService, { 
  type DriverProfile, 
  type CreateDriverProfilePayload, 
  type UpdateDriverProfilePayload,
  uploadFileToSupabase
} from "../../../Services/adminAndManager/driver_profiles_service";
import {
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  Languages,
  Award,
  Star,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  RefreshCw,
  Upload,
  Camera,
  Calendar,
  Clock,
  FileText,
  CreditCard,
  IdCard,
  Car,
  Globe,
  Building,
  Hash,
  Info,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DriverProfileScreen: React.FC = () => {
  // State
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Image preview states
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [driverLicensePreview, setDriverLicensePreview] = useState<string | null>(null);
  
  // New image files to upload
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null);
  const [newIdDocument, setNewIdDocument] = useState<File | null>(null);
  const [newDriverLicense, setNewDriverLicense] = useState<File | null>(null);
  
  // Form state for create/edit
  const [formData, setFormData] = useState<CreateDriverProfilePayload | UpdateDriverProfilePayload>({
    display_name: "",
    base_city: "",
    base_region: "",
    base_country: "Zimbabwe",
    hourly_rate: 0,
    bio: "",
    years_experience: 0,
    languages: [],
    identity_document: {
      type: "national_id",
      imageUrl: "",
    },
    driver_license: {
      number: "",
      imageUrl: "",
      country: "ZW",
      class: "",
      expires_at: "",
      verified: false,
    },
  });
  
  // Language input
  const [newLanguage, setNewLanguage] = useState("");
  
  // File upload refs
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const idDocumentInputRef = useRef<HTMLInputElement>(null);
  const driverLicenseInputRef = useRef<HTMLInputElement>(null);
  
  // Drag and drop states
  const [isDraggingProfile, setIsDraggingProfile] = useState(false);
  const [isDraggingId, setIsDraggingId] = useState(false);
  const [isDraggingLicense, setIsDraggingLicense] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Show snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };
  
  // Load driver profile
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DriverProfileService.getMyDriverProfile();
      
      if (response.success && response.data) {
        setProfile(response.data);
        setHasProfile(true);
        // Populate form data for editing
        setFormData({
          display_name: response.data.display_name,
          base_city: response.data.base_city,
          base_region: response.data.base_region,
          base_country: response.data.base_country,
          hourly_rate: response.data.hourly_rate,
          bio: response.data.bio,
          years_experience: response.data.years_experience,
          languages: response.data.languages,
          identity_document: response.data.identity_document,
          driver_license: response.data.driver_license,
          profile_image: response.data.profile_image,
        });
        // Set existing image previews
        setProfileImagePreview(response.data.profile_image || null);
        setIdDocumentPreview(response.data.identity_document?.imageUrl || null);
        setDriverLicensePreview(response.data.driver_license?.imageUrl || null);
      }
    } catch (err: any) {
      if (err.notFound) {
        setHasProfile(false);
        setProfile(null);
        setError(null);
      } else {
        const errorMessage = err?.message || "Failed to load driver profile";
        setError(errorMessage);
        showSnackbar(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  // Handle file selection with preview
  const handleFileSelect = (
    file: File,
    type: "profile" | "id_document" | "driver_license"
  ) => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      showSnackbar("Please select an image file", "error");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("File size must be less than 5MB", "error");
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      if (type === "profile") {
        setProfileImagePreview(previewUrl);
        setNewProfileImage(file);
      } else if (type === "id_document") {
        setIdDocumentPreview(previewUrl);
        setNewIdDocument(file);
      } else if (type === "driver_license") {
        setDriverLicensePreview(previewUrl);
        setNewDriverLicense(file);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    if (type === "profile") setIsDraggingProfile(true);
    if (type === "id") setIsDraggingId(true);
    if (type === "license") setIsDraggingLicense(true);
  };
  
  const handleDragLeave = (type: string) => {
    if (type === "profile") setIsDraggingProfile(false);
    if (type === "id") setIsDraggingId(false);
    if (type === "license") setIsDraggingLicense(false);
  };
  
  const handleDrop = (e: React.DragEvent, type: "profile" | "id_document" | "driver_license") => {
    e.preventDefault();
    if (type === "profile") setIsDraggingProfile(false);
    if (type === "id_document") setIsDraggingId(false);
    if (type === "driver_license") setIsDraggingLicense(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file, type);
    }
  };
  
  // Upload all new images
  const uploadNewImages = async (): Promise<{
    profileImageUrl?: string;
    idDocumentUrl?: string;
    driverLicenseUrl?: string;
  }> => {
    const uploadedUrls: {
      profileImageUrl?: string;
      idDocumentUrl?: string;
      driverLicenseUrl?: string;
    } = {};
    
    // Upload profile image if new
    if (newProfileImage) {
      const url = await uploadFileToSupabase(newProfileImage, "topics", setUploadProgress);
      uploadedUrls.profileImageUrl = url;
    }
    
    // Upload ID document if new
    if (newIdDocument) {
      const url = await uploadFileToSupabase(newIdDocument, "topics", setUploadProgress);
      uploadedUrls.idDocumentUrl = url;
    }
    
    // Upload driver license if new
    if (newDriverLicense) {
      const url = await uploadFileToSupabase(newDriverLicense, "topics", setUploadProgress);
      uploadedUrls.driverLicenseUrl = url;
    }
    
    return uploadedUrls;
  };
  
  // Handle create profile
  // Handle create profile - FIXED VERSION
const handleCreateProfile = async () => {
  try {
    setLoading(true);
    setUploadProgress(0);
    
    // Validate required fields
    if (!formData.display_name || !formData.base_city || !formData.base_country) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }
    
    // Upload images first
    const uploadedUrls = await uploadNewImages();
    
    // Prepare payload with uploaded image URLs - ENSURE ALL FIELDS HAVE STRING VALUES
    const payload: CreateDriverProfilePayload = {
      display_name: formData.display_name || "",
      base_city: formData.base_city || "",
      base_region: formData.base_region || "", // Ensure string, not undefined
      base_country: formData.base_country || "Zimbabwe",
      hourly_rate: formData.hourly_rate || 0,
      bio: formData.bio || "",
      years_experience: formData.years_experience || 0,
      languages: formData.languages || [],
      identity_document: {
        type: formData.identity_document?.type || "national_id",
        imageUrl: uploadedUrls.idDocumentUrl || formData.identity_document?.imageUrl || "",
      },
      driver_license: {
        number: formData.driver_license?.number || "",
        imageUrl: uploadedUrls.driverLicenseUrl || formData.driver_license?.imageUrl || "",
        country: formData.driver_license?.country || "ZW",
        class: formData.driver_license?.class || "",
        expires_at: formData.driver_license?.expires_at || "",
        verified: false,
      },
     
    };
    
    const response = await DriverProfileService.createDriverProfile(payload);
    
    if (response.success) {
      showSnackbar("Driver profile created successfully", "success");
      setIsCreating(false);
      // Reset image states
      setNewProfileImage(null);
      setNewIdDocument(null);
      setNewDriverLicense(null);
      loadProfile();
    }
  } catch (err: any) {
    const errorMessage = err?.message || "Failed to create driver profile";
    showSnackbar(errorMessage, "error");
  } finally {
    setLoading(false);
    setUploadProgress(0);
  }
};
  
  // Handle update profile
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setUploadProgress(0);
      
      // Upload new images first
      const uploadedUrls = await uploadNewImages();
      
      // Prepare payload with uploaded image URLs
      const payload: UpdateDriverProfilePayload = {
        display_name: formData.display_name,
        base_city: formData.base_city,
        base_region: formData.base_region,
        base_country: formData.base_country,
        hourly_rate: formData.hourly_rate,
        bio: formData.bio,
        years_experience: formData.years_experience,
        languages: formData.languages,
        identity_document: {
          type: formData.identity_document?.type || "national_id",
          imageUrl: uploadedUrls.idDocumentUrl || formData.identity_document?.imageUrl || "",
        },
        driver_license: {
          number: formData.driver_license?.number || "",
          imageUrl: uploadedUrls.driverLicenseUrl || formData.driver_license?.imageUrl || "",
          country: formData.driver_license?.country || "ZW",
          class: formData.driver_license?.class || "",
          expires_at: formData.driver_license?.expires_at || "",
          verified: false,
        },
        profile_image: uploadedUrls.profileImageUrl || (formData as any).profile_image,
      };
      
      const response = await DriverProfileService.updateDriverProfile(payload);
      
      if (response.success) {
        showSnackbar("Driver profile updated successfully", "success");
        setIsEditing(false);
        // Reset image states
        setNewProfileImage(null);
        setNewIdDocument(null);
        setNewDriverLicense(null);
        loadProfile();
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to update driver profile";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  // Remove image
  const removeImage = (type: "profile" | "id_document" | "driver_license") => {
    if (type === "profile") {
      setProfileImagePreview(null);
      setNewProfileImage(null);
      setFormData(prev => ({ ...prev, profile_image: "" }));
    } else if (type === "id_document") {
      setIdDocumentPreview(null);
      setNewIdDocument(null);
      setFormData(prev => ({
        ...prev,
        identity_document: { ...prev.identity_document!, imageUrl: "" }
      }));
    } else if (type === "driver_license") {
      setDriverLicensePreview(null);
      setNewDriverLicense(null);
      setFormData(prev => ({
        ...prev,
        driver_license: { ...prev.driver_license!, imageUrl: "" }
      }));
    }
  };
  
  // Handle language management
  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages?.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...(prev.languages || []), newLanguage.trim()]
      }));
      setNewLanguage("");
    }
  };
  
  const removeLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: (prev.languages || []).filter(l => l !== language)
    }));
  };
  
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Get status badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return { text: "APPROVED", color: "bg-green-100 text-green-800" };
      case "pending":
        return { text: "PENDING", color: "bg-yellow-100 text-yellow-800" };
      case "rejected":
        return { text: "REJECTED", color: "bg-red-100 text-red-800" };
      default:
        return { text: "UNKNOWN", color: "bg-gray-100 text-gray-800" };
    }
  };
  
  // Render loading state
  if (loading && !profile && !isCreating) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
            <p className="text-gray-600">Loading driver profile...</p>
          </div>
        </div>
        {snackbar.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
              "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{snackbar.message}</span>
              <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render create profile screen
  if (!hasProfile && !isCreating && !loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Profile</h1>
                <p className="text-sm text-gray-600 mt-1">Set up your driver profile to start accepting bookings</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Driver Profile Yet</h2>
                <p className="text-gray-600 mb-6">
                  You haven't created your driver profile yet. Complete the registration to start accepting bookings and earning money.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-6 py-3 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                >
                  Create Driver Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {snackbar.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
              "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{snackbar.message}</span>
              <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render create/edit form
  if (isCreating || isEditing) {
    const statusBadge = profile ? getStatusBadge(profile.status) : null;
    
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {isCreating ? "Create Driver Profile" : "Edit Driver Profile"}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {isCreating ? "Complete the form below to become a driver" : "Update your profile information"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {profile && statusBadge && (
                  <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${statusBadge.color}`}>
                    {statusBadge.text}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (isCreating) setIsCreating(false);
                    if (isEditing) setIsEditing(false);
                    // Reset image states
                    setNewProfileImage(null);
                    setNewIdDocument(null);
                    setNewDriverLicense(null);
                    if (profile) {
                      setProfileImagePreview(profile.profile_image || null);
                      setIdDocumentPreview(profile.identity_document?.imageUrl || null);
                      setDriverLicensePreview(profile.driver_license?.imageUrl || null);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile Image */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Image</h3>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                      {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    {profileImagePreview && (
                      <button
                        onClick={() => removeImage("profile")}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div 
                    className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      isDraggingProfile ? "border-[#1EA2E4] bg-[#1EA2E4]/5" : "border-gray-300 hover:border-[#1EA2E4]"
                    }`}
                    onClick={() => profileImageInputRef.current?.click()}
                    onDragOver={(e) => handleDragOver(e, "profile")}
                    onDragLeave={() => handleDragLeave("profile")}
                    onDrop={(e) => handleDrop(e, "profile")}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click or drag & drop to upload profile photo</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP (Max 5MB)</p>
                  </div>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, "profile");
                    }}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="e.g., John D. - Harare Driver"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={formData.years_experience || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base City *
                    </label>
                    <input
                      type="text"
                      value={formData.base_city || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_city: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="e.g., Harare"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Region
                    </label>
                    <input
                      type="text"
                      value={formData.base_region || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_region: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="e.g., Harare Province"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Country *
                    </label>
                    <input
                      type="text"
                      value={formData.base_country || "Zimbabwe"}
                      onChange={(e) => setFormData(prev => ({ ...prev, base_country: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate (USD) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.hourly_rate || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    placeholder="Tell customers about yourself, your experience, and what makes you a great driver..."
                  />
                </div>
              </div>
              
              {/* Languages */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Languages</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    placeholder="Add a language (e.g., English, Shona)"
                  />
                  <button
                    onClick={addLanguage}
                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.languages?.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full flex items-center gap-2"
                    >
                      {lang}
                      <button
                        onClick={() => removeLanguage(lang)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Identity Document */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Identity Document</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={formData.identity_document?.type || "national_id"}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        identity_document: { ...prev.identity_document!, type: e.target.value }
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="national_id">National ID</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Image
                    </label>
                    <div className="flex items-center gap-4">
                      {idDocumentPreview && (
                        <div className="relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden">
                          <img src={idDocumentPreview} alt="ID Document" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage("id_document")}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div 
                        className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          isDraggingId ? "border-[#1EA2E4] bg-[#1EA2E4]/5" : "border-gray-300 hover:border-[#1EA2E4]"
                        }`}
                        onClick={() => idDocumentInputRef.current?.click()}
                        onDragOver={(e) => handleDragOver(e, "id")}
                        onDragLeave={() => handleDragLeave("id")}
                        onDrop={(e) => handleDrop(e, "id_document")}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click or drag & drop to upload document</p>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP (Max 5MB)</p>
                      </div>
                      <input
                        ref={idDocumentInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file, "id_document");
                        }}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Driver License */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver License</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number *
                    </label>
                    <input
                      type="text"
                      value={formData.driver_license?.number || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license!, number: e.target.value }
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Class
                    </label>
                    <input
                      type="text"
                      value={formData.driver_license?.class || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license!, class: e.target.value }
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="e.g., Class 4"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Country
                    </label>
                    <input
                      type="text"
                      value={formData.driver_license?.country || "ZW"}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license!, country: e.target.value }
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={formData.driver_license?.expires_at?.split('T')[0] || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        driver_license: { ...prev.driver_license!, expires_at: e.target.value }
                      }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Image
                  </label>
                  <div className="flex items-center gap-4">
                    {driverLicensePreview && (
                      <div className="relative w-32 h-32 rounded-lg border border-gray-200 overflow-hidden">
                        <img src={driverLicensePreview} alt="Driver License" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage("driver_license")}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div 
                      className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isDraggingLicense ? "border-[#1EA2E4] bg-[#1EA2E4]/5" : "border-gray-300 hover:border-[#1EA2E4]"
                      }`}
                      onClick={() => driverLicenseInputRef.current?.click()}
                      onDragOver={(e) => handleDragOver(e, "license")}
                      onDragLeave={() => handleDragLeave("license")}
                      onDrop={(e) => handleDrop(e, "driver_license")}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click or drag & drop to upload license</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP (Max 5MB)</p>
                    </div>
                    <input
                      ref={driverLicenseInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, "driver_license");
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {/* Upload Progress */}
              {uploading && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading images...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1EA2E4] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-end gap-3 pb-6">
                <button
                  onClick={() => {
                    if (isCreating) setIsCreating(false);
                    if (isEditing) setIsEditing(false);
                    if (profile) {
                      setProfileImagePreview(profile.profile_image || null);
                      setIdDocumentPreview(profile.identity_document?.imageUrl || null);
                      setDriverLicensePreview(profile.driver_license?.imageUrl || null);
                    }
                    setNewProfileImage(null);
                    setNewIdDocument(null);
                    setNewDriverLicense(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={isCreating ? handleCreateProfile : handleUpdateProfile}
                  disabled={uploading || loading}
                  className="px-6 py-3 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isCreating ? "Creating..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {isCreating ? "Create Profile" : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {snackbar.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
              "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{snackbar.message}</span>
              <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Render view profile screen
  if (profile && hasProfile && !isEditing && !isCreating) {
    const statusBadge = getStatusBadge(profile.status);
    
    return (
      <div className="flex h-screen bg-gray-50">
        <DriverSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">My Driver Profile</h1>
                  <p className="text-sm text-gray-600 mt-1">View and manage your driver information</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 text-sm font-semibold rounded-full ${statusBadge.color}`}>
                  {statusBadge.text}
                </span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={loadProfile}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Profile Header */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] h-32"></div>
                <div className="relative px-6 pb-6">
                  <div className="flex flex-col md:flex-row gap-6 -mt-16">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden">
                        {profile.profile_image ? (
                          <img src={profile.profile_image} alt={profile.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pt-4">
                      <h2 className="text-2xl font-bold text-gray-800">{profile.display_name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{profile.rating_average || 0}</span>
                          <span className="text-gray-500">({profile.rating_count || 0} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{profile.base_city}, {profile.base_country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Hourly Rate</p>
                      <p className="text-2xl font-bold text-gray-800">{formatCurrency(profile.hourly_rate)}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="text-2xl font-bold text-gray-800">{profile.years_experience} years</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Award className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Languages</p>
                      <p className="text-2xl font-bold text-gray-800">{profile.languages?.length || 0}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Languages className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bio */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">About Me</h3>
                <p className="text-gray-600">{profile.bio || "No bio provided yet."}</p>
              </div>
              
              {/* Details Grid */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{profile.base_city}, {profile.base_region}, {profile.base_country}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Languages className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Languages</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.languages?.map(lang => (
                          <span key={lang} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">{formatDate(profile.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Documents */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Identity Document</h4>
                    <p className="text-sm text-gray-500 mb-2">Type: {profile.identity_document?.type}</p>
                    {profile.identity_document?.imageUrl && (
                      <div className="w-40 h-40 rounded-lg border border-gray-200 overflow-hidden">
                        <img src={profile.identity_document.imageUrl} alt="ID Document" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Driver License</h4>
                    <p className="text-sm text-gray-500">Number: {profile.driver_license?.number}</p>
                    <p className="text-sm text-gray-500">Class: {profile.driver_license?.class}</p>
                    <p className="text-sm text-gray-500">Expires: {formatDate(profile.driver_license?.expires_at)}</p>
                    {profile.driver_license?.imageUrl && (
                      <div className="w-40 h-40 rounded-lg border border-gray-200 overflow-hidden mt-2">
                        <img src={profile.driver_license.imageUrl} alt="Driver License" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {snackbar.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
              snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
              "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
              {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
              {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium flex-1">{snackbar.message}</span>
              <button onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return null;
};

export default DriverProfileScreen;