import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllDriverProfiles,
  updateDriverProfile,
  deleteDriverProfile,
  approveDriverProfile,
  rejectDriverProfile,
  getErrorDisplay,
  type IDriverProfile,
  type UpdateDriverProfilePayload,
  type DriverProfileStatus,
  type IIdentityDocument,
  type IDriverLicense,
} from "../../../Services/adminAndManager/driver_profile_service";
import Sidebar from "../../../components/Sidebar";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  User,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Languages,
  Car,
  Shield,
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  Filter,
  Search,
  RefreshCw,
  Check,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  BadgeCheck,
  Maximize2,
  ZoomIn,
  Minus,
  Award,
  Briefcase,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";

import { supabase } from "../../../helpers/supa_base_client";

// Sanitize filename helper
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

// File upload function
const uploadFileToSupabase = async (file: File, bucket: string, setProgress?: (progress: number) => void): Promise<string> => {
  const sanitizedFileName = sanitizeFilename(file.name);
  const fileName = `${Date.now()}_${sanitizedFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    throw new Error(`File upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to get file URL after upload");
  }

  return publicUrlData.publicUrl;
};

// Status options
const STATUS_OPTIONS: DriverProfileStatus[] = ["pending", "approved", "rejected"];
const AVAILABILITY_OPTIONS = [true, false];
const IDENTITY_DOC_TYPES = ["national_id", "passport"];
const LICENSE_CLASSES = ["Class 1", "Class 2", "Class 3", "Class 4", "Code B", "Code C", "Other"];
const COUNTRY_OPTIONS = ["ZW", "ZA", "US", "UK", "AU", "CA", "Other"];

// Language options
const LANGUAGE_OPTIONS = [
  "English", "Shona", "Ndebele", "Afrikaans", "French", "Spanish", 
  "Portuguese", "German", "Chinese", "Arabic", "Hindi", "Other"
];

// Experience years options
const EXPERIENCE_YEARS = Array.from({ length: 51 }, (_, i) => i); // 0 to 50 years

interface DriverProfileManagementProps {}

const DriverProfileManagement: React.FC<DriverProfileManagementProps> = () => {
  const navigate = useNavigate();

  // State
  const [driverProfiles, setDriverProfiles] = useState<IDriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [selectedProfile, setSelectedProfile] = useState<IDriverProfile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageZoom, setImageZoom] = useState(1);

  // Approval modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form states
  const [editForm, setEditForm] = useState<UpdateDriverProfilePayload>({});

  // File upload states
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [identityDocFile, setIdentityDocFile] = useState<File | null>(null);
  const [identityDocPreview, setIdentityDocPreview] = useState<string>("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // File input refs
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const identityDocInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    is_available: "",
    base_country: "",
    min_experience: "",
    max_experience: "",
    min_rate: "",
    max_rate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load driver profiles
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAllDriverProfiles();
      setDriverProfiles(response.data || response.items || []);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load driver profiles");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'identity' | 'license') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      showSnackbar(`Invalid file type: Please select an image file`, 'error');
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar(`File too large: Maximum size is 5MB`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      switch (type) {
        case 'profile':
          setProfileImageFile(file);
          setProfileImagePreview(reader.result as string);
          break;
        case 'identity':
          setIdentityDocFile(file);
          setIdentityDocPreview(reader.result as string);
          break;
        case 'license':
          setLicenseFile(file);
          setLicensePreview(reader.result as string);
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload single file
  const uploadSingleFile = async (file: File, bucket: string): Promise<string> => {
    try {
      setIsUploading(true);
      setUploadProgress(50);
      
      const url = await uploadFileToSupabase(file, bucket);
      
      setUploadProgress(100);
      setIsUploading(false);
      
      return url;
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      throw err;
    }
  };

  // Handle update driver profile
  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    try {
      let profileImageUrl = editForm.profile_image;
      let identityDocUrl = editForm.identity_document?.imageUrl;
      let licenseUrl = editForm.driver_license?.imageUrl;

      // Upload new files if selected
      if (profileImageFile) {
        profileImageUrl = await uploadSingleFile(profileImageFile, "topics");
      }
      if (identityDocFile) {
        identityDocUrl = await uploadSingleFile(identityDocFile, "documents");
      }
      if (licenseFile) {
        licenseUrl = await uploadSingleFile(licenseFile, "documents");
      }

      // Prepare update payload
      const updatePayload: UpdateDriverProfilePayload = {
        ...editForm,
        ...(profileImageUrl && { profile_image: profileImageUrl }),
        ...(identityDocUrl && {
          identity_document: {
            ...editForm.identity_document,
            imageUrl: identityDocUrl,
            type: editForm.identity_document?.type || "national_id"
          }
        }),
        ...(licenseUrl && {
          driver_license: {
            ...editForm.driver_license,
            imageUrl: licenseUrl,
            number: editForm.driver_license?.number || "",
            country: editForm.driver_license?.country || "ZW",
            class: editForm.driver_license?.class || "Class 4",
            expires_at: editForm.driver_license?.expires_at || new Date().toISOString()
          }
        })
      };

      await updateDriverProfile(selectedProfile._id, updatePayload);
      showSnackbar("Driver profile updated successfully", "success");
      setIsEditModalOpen(false);
      resetEditForm();
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle delete profile
  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteDriverProfile(profileId);
      showSnackbar("Driver profile deleted successfully", "success");
      setProfileToDelete(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle approve profile
  const handleApproveProfile = async () => {
    if (!selectedProfile) return;

    try {
      await approveDriverProfile(selectedProfile._id);
      showSnackbar("Driver profile approved successfully", "success");
      setIsApproveModalOpen(false);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle reject profile
  const handleRejectProfile = async () => {
    if (!selectedProfile || !rejectionReason.trim()) return;

    try {
      await rejectDriverProfile(selectedProfile._id, rejectionReason);
      showSnackbar("Driver profile rejected successfully", "success");
      setIsRejectModalOpen(false);
      setRejectionReason("");
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Reset edit form
  const resetEditForm = () => {
    setEditForm({});
    setProfileImageFile(null);
    setProfileImagePreview("");
    setIdentityDocFile(null);
    setIdentityDocPreview("");
    setLicenseFile(null);
    setLicensePreview("");
    
    if (profileImageInputRef.current) profileImageInputRef.current.value = '';
    if (identityDocInputRef.current) identityDocInputRef.current.value = '';
    if (licenseInputRef.current) licenseInputRef.current.value = '';
  };

  // Update edit form when profile is selected
  useEffect(() => {
    if (selectedProfile && isEditModalOpen) {
      setEditForm({
        display_name: selectedProfile.display_name || "",
        base_city: selectedProfile.base_city || "",
        base_region: selectedProfile.base_region || "",
        base_country: selectedProfile.base_country || "",
        hourly_rate: selectedProfile.hourly_rate || 0,
        bio: selectedProfile.bio || "",
        profile_image: selectedProfile.profile_image || "",
        years_experience: selectedProfile.years_experience || 0,
        languages: selectedProfile.languages || [],
        identity_document: selectedProfile.identity_document || undefined,
        driver_license: selectedProfile.driver_license || undefined,
        status: selectedProfile.status,
        is_available: selectedProfile.is_available,
      });
      
      // Reset file states
      setProfileImageFile(null);
      setProfileImagePreview("");
      setIdentityDocFile(null);
      setIdentityDocPreview("");
      setLicenseFile(null);
      setLicensePreview("");
    }
  }, [selectedProfile, isEditModalOpen]);

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color and icon
  const getStatusInfo = (status?: DriverProfileStatus) => {
    switch (status) {
      case "approved":
        return {
          color: "bg-green-100 text-green-800",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Approved"
        };
      case "pending":
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <Clock className="w-4 h-4" />,
          text: "Pending"
        };
      case "rejected":
        return {
          color: "bg-red-100 text-red-800",
          icon: <XCircle className="w-4 h-4" />,
          text: "Rejected"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <Clock className="w-4 h-4" />,
          text: "Unknown"
        };
    }
  };

  // Get availability color
  const getAvailabilityInfo = (isAvailable?: boolean) => {
    return isAvailable
      ? { color: "bg-green-100 text-green-800", icon: <Check className="w-4 h-4" />, text: "Available" }
      : { color: "bg-gray-100 text-gray-800", icon: <X className="w-4 h-4" />, text: "Unavailable" };
  };

  // Get rating stars
  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Toggle profile expansion
  const toggleProfileExpansion = (profileId: string) => {
    setExpandedProfile(expandedProfile === profileId ? null : profileId);
  };

  // Toggle language selection
  const toggleLanguage = (language: string) => {
    setEditForm(prev => {
      const currentLanguages = prev.languages || [];
      const newLanguages = currentLanguages.includes(language)
        ? currentLanguages.filter(l => l !== language)
        : [...currentLanguages, language];
      
      return { ...prev, languages: newLanguages };
    });
  };

  // Filtered driver profiles
  const filteredProfiles = driverProfiles.filter(profile => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const displayName = profile.display_name?.toLowerCase() || "";
      const baseCity = profile.base_city?.toLowerCase() || "";
      const baseCountry = profile.base_country?.toLowerCase() || "";
      
      if (
        !displayName.includes(query) &&
        !baseCity.includes(query) &&
        !baseCountry.includes(query) &&
        !profile.user_id?.toString().includes(query)
      ) {
        return false;
      }
    }

    // Additional filters
    if (filters.status && profile.status !== filters.status) return false;
    if (filters.is_available && String(profile.is_available) !== filters.is_available) return false;
    if (filters.base_country && profile.base_country !== filters.base_country) return false;
    if (filters.min_experience && (profile.years_experience || 0) < parseInt(filters.min_experience)) return false;
    if (filters.max_experience && (profile.years_experience || 0) > parseInt(filters.max_experience)) return false;
    if (filters.min_rate && (profile.hourly_rate || 0) < parseInt(filters.min_rate)) return false;
    if (filters.max_rate && (profile.hourly_rate || 0) > parseInt(filters.max_rate)) return false;

    return true;
  });

  // Open image viewer
  const openImageViewer = (imageUrl: string) => {
    setCurrentImageUrl(imageUrl);
    setImageZoom(1);
    setImageViewerOpen(true);
  };

  // Reset zoom
  const resetZoom = () => {
    setImageZoom(1);
  };

  // Format user information
  const getUserInfo = (profile: IDriverProfile) => {
    if (typeof profile.user_id === 'object') {
      const user = profile.user_id;
      return {
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        fullName: user.full_name || "N/A",
      };
    }
    return { email: "N/A", phone: "N/A", fullName: "N/A" };
  };

  // Format approval information
  const getApprovalInfo = (profile: IDriverProfile) => {
    if (typeof profile.approved_by_admin === 'object') {
      const admin = profile.approved_by_admin;
      return {
        adminName: admin.full_name || "N/A",
        adminEmail: admin.email || "N/A",
        approvedAt: profile.approved_at || "N/A",
      };
    }
    return { adminName: "N/A", adminEmail: "N/A", approvedAt: "N/A" };
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans relative">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage all driver profiles in the system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{filteredProfiles.length}</span> profile(s)
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 pt-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, city, country, or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Filters</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {/* Refresh */}
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="">All Statuses</option>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <select
                      value={filters.is_available}
                      onChange={(e) => setFilters(prev => ({ ...prev, is_available: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="">All</option>
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      value={filters.base_country}
                      onChange={(e) => setFilters(prev => ({ ...prev, base_country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                    >
                      <option value="">All Countries</option>
                      {COUNTRY_OPTIONS.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Experience (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={filters.min_experience}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_experience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Experience (years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={filters.max_experience}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_experience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                      placeholder="50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={filters.min_rate}
                        onChange={(e) => setFilters(prev => ({ ...prev, min_rate: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min="0"
                        value={filters.max_rate}
                        onChange={(e) => setFilters(prev => ({ ...prev, max_rate: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setFilters({
                      status: "",
                      is_available: "",
                      base_country: "",
                      min_experience: "",
                      max_experience: "",
                      min_rate: "",
                      max_rate: "",
                    })}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                <p className="text-gray-600">Loading driver profiles...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Driver Profiles Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchQuery || Object.values(filters).some(v => v)
                  ? "No profiles match your search criteria. Try adjusting your filters."
                  : "No driver profiles found in the system."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const statusInfo = getStatusInfo(profile.status);
                const availabilityInfo = getAvailabilityInfo(profile.is_available);
                const userInfo = getUserInfo(profile);
                
                return (
                  <div
                    key={profile._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Profile Header */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {profile.profile_image ? (
                        <>
                          <img
                            src={profile.profile_image}
                            alt={profile.display_name || "Driver"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex flex-col gap-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${availabilityInfo.color}`}>
                              {availabilityInfo.icon}
                              {availabilityInfo.text}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Rating overlay */}
                      {profile.rating_average && profile.rating_average > 0 && (
                        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{profile.rating_average.toFixed(1)} ({profile.rating_count})</span>
                        </div>
                      )}
                    </div>

                    {/* Profile Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            {profile.display_name || userInfo.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {profile.base_city && `${profile.base_city}, `}
                            {profile.base_country || "Location not specified"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleProfileExpansion(profile._id)}
                            className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                            title={expandedProfile === profile._id ? "Show Less" : "Show More"}
                          >
                            {expandedProfile === profile._id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProfile(profile);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProfile(profile);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Profile"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProfileToDelete(profile._id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            ${profile.hourly_rate?.toFixed(2) || "0.00"}/hr
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            {profile.years_experience || 0} years
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Languages className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            {profile.languages?.length || 0} languages
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            {formatDate(profile.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Bio Preview */}
                      {profile.bio && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}

                      {/* Languages Preview */}
                      {profile.languages && profile.languages.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {profile.languages.slice(0, 3).map((lang, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {lang}
                              </span>
                            ))}
                            {profile.languages.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{profile.languages.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {expandedProfile === profile._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">User ID:</span>
                              <span className="font-mono text-xs text-gray-700">{profile.user_id?.toString().slice(-8)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Email:</span>
                              <span className="text-gray-700 truncate">{userInfo.email}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Phone:</span>
                              <span className="text-gray-700">{userInfo.phone}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Updated:</span>
                              <span className="text-gray-700">{formatDate(profile.updated_at)}</span>
                            </div>
                            
                            {/* Action buttons for pending profiles */}
                            {profile.status === "pending" && (
                              <div className="pt-2 flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setIsApproveModalOpen(true);
                                  }}
                                  className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setIsRejectModalOpen(true);
                                  }}
                                  className="flex-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Driver Profile Modal */}
      {isViewModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Driver Profile Details</h2>
                <p className="text-sm text-gray-600">Complete profile information</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Left Column - Profile Info */}
                <div className="lg:w-2/5 space-y-6">
                  {/* Profile Image */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                    {selectedProfile.profile_image ? (
                      <div className="relative">
                        <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
                          <img
                            src={selectedProfile.profile_image}
                            alt={selectedProfile.display_name || "Driver"}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => openImageViewer(selectedProfile.profile_image!)}
                          />
                          <button
                            onClick={() => openImageViewer(selectedProfile.profile_image!)}
                            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            View Full Size
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <User className="w-16 h-16 mb-4" />
                        <p>No profile image</p>
                      </div>
                    )}
                  </div>

                  {/* Status & Availability */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Status & Availability</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Profile Status</p>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getStatusInfo(selectedProfile.status).color}`}>
                            {getStatusInfo(selectedProfile.status).icon}
                            {getStatusInfo(selectedProfile.status).text}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Availability</p>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full inline-flex items-center gap-1 ${getAvailabilityInfo(selectedProfile.is_available).color}`}>
                            {getAvailabilityInfo(selectedProfile.is_available).icon}
                            {getAvailabilityInfo(selectedProfile.is_available).text}
                          </span>
                        </div>
                      </div>
                      
                      {selectedProfile.status === "rejected" && selectedProfile.rejection_reason && (
                        <div>
                          <p className="text-xs text-gray-500">Rejection Reason</p>
                          <p className="text-gray-700 text-sm mt-1 bg-white p-3 rounded border border-gray-200">
                            {selectedProfile.rejection_reason}
                          </p>
                        </div>
                      )}

                      {selectedProfile.approved_at && (
                        <div>
                          <p className="text-xs text-gray-500">Approved At</p>
                          <p className="text-gray-700 text-sm mt-1">{formatDate(selectedProfile.approved_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {selectedProfile.rating_count && selectedProfile.rating_count > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Rating</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRatingStars(selectedProfile.rating_average)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {selectedProfile.rating_count} review(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Details */}
                <div className="lg:w-3/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Display Name</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.display_name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">User Account</p>
                          <div className="space-y-1">
                            <p className="text-gray-900 font-medium">{getUserInfo(selectedProfile).fullName}</p>
                            <p className="text-gray-600 text-sm">{getUserInfo(selectedProfile).email}</p>
                            <p className="text-gray-600 text-sm">{getUserInfo(selectedProfile).phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Location</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Base City</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.base_city || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Region</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.base_region || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Country</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.base_country || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Details */}
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Professional Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Hourly Rate</p>
                          <div className="flex items-center gap-2 mt-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">${selectedProfile.hourly_rate?.toFixed(2) || "0.00"}/hour</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Years Experience</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{selectedProfile.years_experience || 0} years</p>
                          </div>
                        </div>
                      </div>
                      
                      {selectedProfile.bio && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">Bio</p>
                          <p className="text-gray-700 text-sm mt-1 bg-white p-3 rounded border border-gray-200">
                            {selectedProfile.bio}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    {selectedProfile.languages && selectedProfile.languages.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.languages.map((lang, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2"
                            >
                              <Languages className="w-3 h-3 text-[#1EA2E4]" />
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Identity Document */}
                    {selectedProfile.identity_document && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Identity Document</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Type</p>
                            <p className="text-gray-900 font-medium capitalize">{selectedProfile.identity_document.type?.replace('_', ' ') || "N/A"}</p>
                          </div>
                          {selectedProfile.identity_document.imageUrl && (
                            <div>
                              <p className="text-xs text-gray-500">Document Image</p>
                              <button
                                onClick={() => openImageViewer(selectedProfile.identity_document!.imageUrl!)}
                                className="mt-1 w-full aspect-video rounded border border-gray-300 overflow-hidden hover:border-[#1EA2E4] transition-colors"
                              >
                                <img
                                  src={selectedProfile.identity_document.imageUrl}
                                  alt="Identity Document"
                                  className="w-full h-full object-contain"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Driver License */}
                    {selectedProfile.driver_license && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Driver License</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">License Number</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.driver_license.number || "N/A"}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Country</p>
                              <p className="text-gray-900 font-medium">{selectedProfile.driver_license.country || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Class</p>
                              <p className="text-gray-900 font-medium">{selectedProfile.driver_license.class || "N/A"}</p>
                            </div>
                          </div>
                          {selectedProfile.driver_license.expires_at && (
                            <div>
                              <p className="text-xs text-gray-500">Expires</p>
                              <p className="text-gray-900 font-medium">{formatDate(selectedProfile.driver_license.expires_at)}</p>
                            </div>
                          )}
                          {selectedProfile.driver_license.imageUrl && (
                            <div>
                              <p className="text-xs text-gray-500">License Image</p>
                              <button
                                onClick={() => openImageViewer(selectedProfile.driver_license!.imageUrl!)}
                                className="mt-1 w-full aspect-video rounded border border-gray-300 overflow-hidden hover:border-[#1EA2E4] transition-colors"
                              >
                                <img
                                  src={selectedProfile.driver_license.imageUrl}
                                  alt="Driver License"
                                  className="w-full h-full object-contain"
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Profile Modal */}
      {isEditModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-5xl">
              <div className="h-full bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Edit Driver Profile</h2>
                    <p className="text-sm text-gray-600">Update profile information</p>
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={editForm.display_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="e.g., John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hourly Rate ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.hourly_rate || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="e.g., 25.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base City
                        </label>
                        <input
                          type="text"
                          value={editForm.base_city || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, base_city: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="e.g., Harare"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Region
                        </label>
                        <input
                          type="text"
                          value={editForm.base_region || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, base_region: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="e.g., Mashonaland"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={editForm.base_country || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, base_country: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          <option value="">Select country</option>
                          {COUNTRY_OPTIONS.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years of Experience
                        </label>
                        <select
                          value={editForm.years_experience || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          {EXPERIENCE_YEARS.map(year => (
                            <option key={year} value={year}>{year} year{year !== 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={editForm.status || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as DriverProfileStatus }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio / Description
                      </label>
                      <textarea
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        rows={4}
                        placeholder="Tell us about your driving experience, specialties, etc."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_available"
                        checked={editForm.is_available || false}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_available: e.target.checked }))}
                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                      />
                      <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                        Available for bookings
                      </label>
                    </div>
                  </div>

                  {/* Profile Image Upload */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Profile Image</h3>
                    
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e, 'profile')}
                      className="hidden"
                    />

                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Current/Preview Image */}
                      <div className="md:w-1/3">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Current Image</p>
                          {(profileImagePreview || editForm.profile_image) ? (
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300">
                              <img
                                src={profileImagePreview || editForm.profile_image}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                              <User className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload Area */}
                      <div className="md:w-2/3">
                        <div
                          onClick={() => profileImageInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                        >
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium text-gray-700 mb-2">Upload Profile Image</p>
                          <p className="text-sm text-gray-600">Click to browse or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, WebP (Max 5MB)</p>
                        </div>

                        {profileImageFile && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-700">
                              New image selected: {profileImageFile.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Languages</h3>
                    <p className="text-sm text-gray-600">Select languages this driver speaks</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {LANGUAGE_OPTIONS.map(language => (
                        <div key={language} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`lang-${language}`}
                            checked={(editForm.languages || []).includes(language)}
                            onChange={() => toggleLanguage(language)}
                            className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                          />
                          <label htmlFor={`lang-${language}`} className="ml-2 text-sm text-gray-700">
                            {language}
                          </label>
                        </div>
                      ))}
                    </div>

                    {editForm.languages && editForm.languages.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Selected Languages ({editForm.languages.length}):</p>
                        <div className="flex flex-wrap gap-2">
                          {editForm.languages.map(language => (
                            <span
                              key={language}
                              className="px-3 py-1 bg-[#1EA2E4]/10 text-[#1A8BC9] text-sm rounded-full flex items-center gap-1"
                            >
                              {language}
                              <button
                                type="button"
                                onClick={() => toggleLanguage(language)}
                                className="text-[#1A8BC9] hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Identity Document Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Identity Document</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Document Type
                        </label>
                        <select
                          value={editForm.identity_document?.type || ''}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            identity_document: {
                              ...prev.identity_document,
                              type: e.target.value as "national_id" | "passport"
                            }
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          <option value="">Select type</option>
                          {IDENTITY_DOC_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type.replace('_', ' ').toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Identity Document Upload */}
                    <div>
                      <input
                        ref={identityDocInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'identity')}
                        className="hidden"
                      />

                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Current/Preview Image */}
                        <div className="md:w-1/3">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Current Document</p>
                            {(identityDocPreview || editForm.identity_document?.imageUrl) ? (
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={identityDocPreview || editForm.identity_document?.imageUrl}
                                  alt="Identity document"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <FileText className="w-12 h-12" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upload Area */}
                        <div className="md:w-2/3">
                          <div
                            onClick={() => identityDocInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                          >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">Upload Identity Document</p>
                            <p className="text-sm text-gray-600">Clear photo of National ID or Passport</p>
                            <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG (Max 5MB)</p>
                          </div>

                          {identityDocFile && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700">
                                New document selected: {identityDocFile.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driver License Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Driver License</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number
                        </label>
                        <input
                          type="text"
                          value={editForm.driver_license?.number || ''}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              number: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          placeholder="e.g., DL12345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <select
                          value={editForm.driver_license?.country || ''}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              country: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          <option value="">Select country</option>
                          {COUNTRY_OPTIONS.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Class
                        </label>
                        <select
                          value={editForm.driver_license?.class || ''}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              class: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        >
                          <option value="">Select class</option>
                          {LICENSE_CLASSES.map(licenseClass => (
                            <option key={licenseClass} value={licenseClass}>{licenseClass}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={editForm.driver_license?.expires_at ? new Date(editForm.driver_license.expires_at).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            driver_license: {
                              ...prev.driver_license,
                              expires_at: e.target.value
                            }
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* License Upload */}
                    <div>
                      <input
                        ref={licenseInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'license')}
                        className="hidden"
                      />

                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Current/Preview Image */}
                        <div className="md:w-1/3">
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                            <p className="text-sm font-medium text-gray-700 mb-3">Current License</p>
                            {(licensePreview || editForm.driver_license?.imageUrl) ? (
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-300">
                                <img
                                  src={licensePreview || editForm.driver_license?.imageUrl}
                                  alt="Driver license"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                <BadgeCheck className="w-12 h-12" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Upload Area */}
                        <div className="md:w-2/3">
                          <div
                            onClick={() => licenseInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                          >
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700 mb-2">Upload Driver License</p>
                            <p className="text-sm text-gray-600">Clear photo of valid driver license</p>
                            <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG (Max 5MB)</p>
                          </div>

                          {licenseFile && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-700">
                                New license selected: {licenseFile.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* License Verification */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="license_verified"
                        checked={editForm.driver_license?.verified || false}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          driver_license: {
                            ...prev.driver_license,
                            verified: e.target.checked
                          }
                        }))}
                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                      />
                      <label htmlFor="license_verified" className="ml-2 text-sm text-gray-700">
                        Mark license as verified
                      </label>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isUploading}
                      className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {isApproveModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsApproveModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Approve Driver Profile</h3>
                  <p className="text-sm text-gray-600">This will approve the driver for bookings</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to approve <span className="font-semibold">{selectedProfile.display_name}</span>? 
                This driver will become available for customer bookings.
              </p>

              {/* Check if all required documents are present */}
              {(!selectedProfile.identity_document?.imageUrl || !selectedProfile.driver_license?.imageUrl) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-sm font-medium">Missing Documents</p>
                  </div>
                  <ul className="text-xs text-yellow-600 list-disc list-inside">
                    {!selectedProfile.identity_document?.imageUrl && <li>Identity document not uploaded</li>}
                    {!selectedProfile.driver_license?.imageUrl && <li>Driver license not uploaded</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveProfile}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Approve Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsRejectModalOpen(false);
              setRejectionReason("");
            }}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Reject Driver Profile</h3>
                  <p className="text-sm text-gray-600">Please provide a reason for rejection</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                  rows={3}
                  placeholder="Please specify why this profile is being rejected..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectProfile}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setProfileToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Driver Profile</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this driver profile? All associated data, documents, and images will be permanently removed.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setProfileToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProfile(profileToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity"
            onClick={() => setImageViewerOpen(false)}
          />
          <div className="relative max-w-6xl w-full max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setImageViewerOpen(false)}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <button
                onClick={() => setImageZoom(prev => Math.min(prev + 0.25, 3))}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                disabled={imageZoom >= 3}
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setImageZoom(prev => Math.max(prev - 0.25, 0.5))}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                disabled={imageZoom <= 0.5}
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={resetZoom}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="h-full w-full flex items-center justify-center p-4">
              <div className="relative w-full h-full overflow-auto">
                <img
                  src={currentImageUrl}
                  alt="Full size view"
                  className="mx-auto object-contain"
                  style={{
                    transform: `scale(${imageZoom})`,
                    transition: 'transform 0.2s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${snackbar.type === "success" ? "bg-green-50 border border-green-200 text-green-800" :
                snackbar.type === "error" ? "bg-red-50 border border-red-200 text-red-800" :
                  "bg-blue-50 border border-blue-200 text-blue-800"
            }`}>
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar(prev => ({ ...prev, show: false }))}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfileManagement;