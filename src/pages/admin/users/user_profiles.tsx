import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  fetchProfilesByUserId,
  createCustomerProfileByStaff,
  createAgentProfileByStaff,
  createManagerProfileByStaff,
  updateProfileById,
  deleteProfileById,
  getErrorDisplay,
  type IProfile,
  type IProfilesByUserResponse,
  type CreateCustomerProfilePayload,
  type CreateAgentProfilePayload,
  type CreateManagerProfilePayload,
  type UpdateProfilePayload,
  type DriverLicense,
} from "../../../Services/adminAndManager/admin_profiles_service";
import Sidebar from "../../../components/Sidebar";
import {
  ArrowLeft,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  User,
  Shield,
  Briefcase,
  Award,
  FileText,
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  Building,
  Plus,
  Maximize2,
  Minus,
  ZoomIn,
} from "lucide-react";

// Supabase Client
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hfbudnmvjbzvpefvtiuu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYnVkbm12amJ6dnBlZnZ0aXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE2NTgsImV4cCI6MjA2Mjk2NzY1OH0.ionCach1O5vekQDoP7Bx6pSVaLXduJN9kYbWwlaRzKk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Sanitize filename helper
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

// File upload function
const uploadFileToSupabase = async (file: File, bucket: string, _setProgress?: (progress: number) => void): Promise<string> => {
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

const AdminUserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [profiles, setProfiles] = useState<IProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal states
  const [selectedProfile, setSelectedProfile] = useState<IProfile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageZoom, setImageZoom] = useState(1);

  // Form states
  const [profileType, setProfileType] = useState<"customer" | "agent" | "manager">("customer");
  const [createForm, setCreateForm] = useState<CreateCustomerProfilePayload | CreateAgentProfilePayload | CreateManagerProfilePayload>({
    target_user_id: userId || "",
    full_name: "",
    role: "customer",
  } as CreateCustomerProfilePayload);
  
  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});

  // File upload states
  const [driverLicenseFile, setDriverLicenseFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [driverLicensePreview, setDriverLicensePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load profiles
  const loadData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Load profiles
      const response: IProfilesByUserResponse = await fetchProfilesByUserId(userId);
      setProfiles(response.data.profiles || []);
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      setError(errorDisplay.message || "Failed to load profiles");
      showSnackbar(errorDisplay.message, "error");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle file selection for driver's license
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select an image file', 'error');
        return;
      }
      
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar('File size should be less than 5MB', 'error');
        return;
      }

      setDriverLicenseFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setDriverLicensePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload driver's license image
  const uploadDriverLicenseImage = async (): Promise<string | undefined> => {
    if (!driverLicenseFile) return undefined;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const imageUrl = await uploadFileToSupabase(driverLicenseFile, "topics", setUploadProgress);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setIsUploading(false);
      
      showSnackbar('Driver license image uploaded successfully', 'success');
      return imageUrl;
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      showSnackbar(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      throw err;
    }
  };

  // Handle create profile with image upload
  const handleCreateProfile = async () => {
    try {
      let imageUrl: string | undefined;
      
      // Upload driver's license image if selected
      if (driverLicenseFile) {
        imageUrl = await uploadDriverLicenseImage();
      }

      // Prepare driver license data
      const driverLicenseData: DriverLicense = {
        ...(createForm.driver_license || {}),
        ...(imageUrl ? { imageUrl } : {})
      };

      let newProfile: IProfile;

      switch (profileType) {
        case "customer": {
          const customerPayload: CreateCustomerProfilePayload = {
            ...(createForm as CreateCustomerProfilePayload),
            driver_license: Object.keys(driverLicenseData).length > 0 ? driverLicenseData : undefined
          };
          newProfile = await createCustomerProfileByStaff(customerPayload) as IProfile;
          break;
        }
        case "agent": {
          const agentPayload: CreateAgentProfilePayload = {
            ...(createForm as CreateAgentProfilePayload),
            driver_license: Object.keys(driverLicenseData).length > 0 ? driverLicenseData : undefined
          };
          newProfile = await createAgentProfileByStaff(agentPayload) as IProfile;
          break;
        }
        case "manager": {
          const managerPayload: CreateManagerProfilePayload = {
            ...(createForm as CreateManagerProfilePayload),
            driver_license: Object.keys(driverLicenseData).length > 0 ? driverLicenseData : undefined
          };
          newProfile = await createManagerProfileByStaff(managerPayload) as IProfile;
          break;
        }
        default:
          throw new Error("Invalid profile type");
      }

      showSnackbar(`${profileType.charAt(0).toUpperCase() + profileType.slice(1)} profile created successfully`, "success");
      setIsCreateModalOpen(false);
      resetCreateForm();
      setDriverLicenseFile(null);
      setDriverLicensePreview(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle update profile with image upload
  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    try {
      let imageUrl: string | undefined;
      
      // Upload new driver's license image if selected
      if (driverLicenseFile) {
        imageUrl = await uploadDriverLicenseImage();
      }

      // Prepare updated driver license data
      const driverLicenseData: DriverLicense = {
        ...(editForm.driver_license || {}),
        ...(imageUrl ? { imageUrl } : {}),
        // Preserve existing data if not overwritten
        ...(selectedProfile.driver_license || {})
      };

      const updatePayload: UpdateProfilePayload = {
        ...editForm,
        driver_license: Object.keys(driverLicenseData).length > 0 ? driverLicenseData : undefined
      };

      await updateProfileById(selectedProfile._id, updatePayload);
      showSnackbar("Profile updated successfully", "success");
      setIsEditModalOpen(false);
      setDriverLicenseFile(null);
      setDriverLicensePreview(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Handle delete profile
  const handleDeleteProfile = async (profileId: string) => {
    try {
      await deleteProfileById(profileId);
      showSnackbar("Profile deleted successfully", "success");
      setProfileToDelete(null);
      loadData();
    } catch (err) {
      const errorDisplay = getErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      target_user_id: userId || "",
      full_name: "",
      role: profileType,
    } as CreateCustomerProfilePayload);
    setDriverLicenseFile(null);
    setDriverLicensePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update edit form when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      setEditForm({
        full_name: selectedProfile.full_name,
        role: selectedProfile.role,
        dob: selectedProfile.dob,
        national_id: selectedProfile.national_id,
        driver_license: selectedProfile.driver_license,
        address: selectedProfile.address,
        preferences: selectedProfile.preferences,
        gdpr: selectedProfile.gdpr,
        loyalty_points: selectedProfile.loyalty_points,
        branch_id: selectedProfile.branch_id,
        branch_ids: selectedProfile.branch_ids,
        approval_limit_usd: selectedProfile.approval_limit_usd,
        can_apply_discounts: selectedProfile.can_apply_discounts,
        verified: selectedProfile.verified,
      });
      // Set preview for existing driver license image
      if (selectedProfile.driver_license?.imageUrl) {
        setDriverLicensePreview(selectedProfile.driver_license.imageUrl);
      } else {
        setDriverLicensePreview(null);
      }
    }
  }, [selectedProfile]);

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-100 text-purple-800";
      case "driver": return "bg-blue-100 text-blue-800";
      case "agent": return "bg-indigo-100 text-indigo-800";
      case "customer": return "bg-cyan-100 text-cyan-800";
      case "manager": return "bg-amber-100 text-amber-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get profile type icon
  const getProfileIcon = (role: string) => {
    switch (role) {
      case "customer": return <User className="w-5 h-5" />;
      case "agent": return <Briefcase className="w-5 h-5" />;
      case "manager": return <Shield className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  // Toggle profile expansion
  const toggleProfileExpansion = (profileId: string) => {
    setExpandedProfile(expandedProfile === profileId ? null : profileId);
  };

  // Remove driver's license image
  const removeDriverLicenseImage = () => {
    setDriverLicenseFile(null);
    setDriverLicensePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditForm(prev => ({
      ...prev,
      driver_license: {
        ...prev.driver_license,
        imageUrl: undefined
      }
    }));
  };

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

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">User ID Missing</h1>
          <p className="text-gray-600 mb-6">Please go back and select a user to view profiles.</p>
          <button
            onClick={() => navigate("/admin-users")}
            className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

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
                onClick={() => navigate("/admin-users")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Users"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">User Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Managing profiles for User ID: <span className="font-semibold">{userId.slice(-8)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{profiles.length}</span> profile(s)
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                <p className="text-gray-600">Loading profiles...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 p-6">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-red-600 text-center mb-4">{error}</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create First Profile
              </button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Profiles Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This user doesn't have any profiles yet. Create a profile to enable additional features and permissions.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium inline-flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Create First Profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {profiles.map((profile) => (
                <div
                  key={profile._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Profile Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          profile.role === "customer" ? "bg-cyan-100 text-cyan-800" :
                          profile.role === "agent" ? "bg-indigo-100 text-indigo-800" :
                          profile.role === "manager" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {getProfileIcon(profile.role)}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{profile.full_name}</h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(profile.role)}`}>
                              {profile.role.toUpperCase()}
                            </span>
                            {profile.verified && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Profile ID: <span className="font-mono text-xs">{profile._id.slice(-8)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProfileExpansion(profile._id)}
                          className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                          title={expandedProfile === profile._id ? "Show Less" : "Show Details"}
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
                          className="p-2 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit Profile"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setProfileToDelete(profile._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedProfile === profile._id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Basic Info</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                DOB: {profile.dob ? formatDate(profile.dob) : "Not provided"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                National ID: {profile.national_id || "Not provided"}
                              </span>
                            </div>
                            {profile.driver_license?.imageUrl && (
                              <div className="pt-2">
                                <p className="text-xs text-gray-500 mb-1">Driver's License:</p>
                                <button
                                  onClick={() => openImageViewer(profile.driver_license?.imageUrl!)}
                                  className="inline-flex items-center gap-1 text-sm text-[#1EA2E4] hover:underline"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                  View Image
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Role Specific</h4>
                          <div className="space-y-2">
                            {profile.role === "customer" && profile.loyalty_points !== undefined && (
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  Loyalty Points: <span className="font-semibold">{profile.loyalty_points}</span>
                                </span>
                              </div>
                            )}
                            {profile.role === "agent" && profile.branch_id && (
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  Branch: <span className="font-semibold">{profile.branch_id.slice(-8)}</span>
                                </span>
                              </div>
                            )}
                            {profile.role === "manager" && profile.branch_ids && profile.branch_ids.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  Manages: <span className="font-semibold">{profile.branch_ids.length}</span> branches
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Metadata</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                Created: {formatDate(profile.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">
                                Updated: {formatDate(profile.updated_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Profile Modal - Centered */}
      {isViewModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Profile Details</h2>
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
                <div className="lg:w-1/3">
                  <div className="bg-gradient-to-br from-[#1EA2E4] to-[#0F6FA8] rounded-xl p-8 text-white text-center">
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                      {getProfileIcon(selectedProfile.role)}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{selectedProfile.full_name}</h3>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedProfile.role === "customer" ? "bg-cyan-100 text-cyan-800" :
                        selectedProfile.role === "agent" ? "bg-indigo-100 text-indigo-800" :
                        selectedProfile.role === "manager" ? "bg-amber-100 text-amber-800" :
                        "bg-white/20"
                      }`}>
                        {selectedProfile.role.toUpperCase()}
                      </span>
                      {selectedProfile.verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 text-sm">
                      Profile ID: {selectedProfile._id.slice(-12)}
                    </p>
                  </div>
                </div>

                <div className="lg:w-2/3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Personal Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.full_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.dob ? formatDate(selectedProfile.dob) : "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">National ID</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.national_id || "Not provided"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Role Information</h4>
                      <div className="space-y-3">
                        {selectedProfile.role === "customer" && (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Loyalty Points</p>
                              <p className="text-gray-900 font-medium">{selectedProfile.loyalty_points || 0}</p>
                            </div>
                          </>
                        )}
                        {selectedProfile.role === "agent" && (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Branch ID</p>
                              <p className="text-gray-900 font-medium">{selectedProfile.branch_id || "Not assigned"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Discount Permissions</p>
                              <p className="text-gray-900 font-medium">
                                {selectedProfile.can_apply_discounts ? "Allowed" : "Not Allowed"}
                              </p>
                            </div>
                          </>
                        )}
                        {selectedProfile.role === "manager" && (
                          <>
                            <div>
                              <p className="text-xs text-gray-500">Managed Branches</p>
                              <p className="text-gray-900 font-medium">
                                {selectedProfile.branch_ids?.length || 0} branch(es)
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Approval Limit</p>
                              <p className="text-gray-900 font-medium">
                                ${selectedProfile.approval_limit_usd?.toLocaleString() || "0"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {selectedProfile.address && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Address</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Street</p>
                            <p className="text-gray-900 font-medium">
                              {selectedProfile.address.line1 || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">City</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.address.city || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Region</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.address.region || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Postal Code</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.address.postal_code || "Not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedProfile.driver_license && (
                      <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                        <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Driver's License</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">License Number</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.driver_license.number || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Country</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.driver_license.country || "Not provided"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Expires</p>
                            <p className="text-gray-900 font-medium">
                              {selectedProfile.driver_license.expires_at ? formatDate(selectedProfile.driver_license.expires_at) : "Not provided"}
                            </p>
                          </div>
                          {selectedProfile.driver_license.imageUrl && (
                            <div className="md:col-span-3 mt-4">
                              <p className="text-xs text-gray-500 mb-2">License Image</p>
                              <div className="relative w-full max-w-lg h-64 border border-gray-300 rounded-lg overflow-hidden">
                                <img
                                  src={selectedProfile.driver_license.imageUrl}
                                  alt="Driver's License"
                                  className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openImageViewer(selectedProfile.driver_license?.imageUrl!)}
                                />
                                <button
                                  onClick={() => openImageViewer(selectedProfile.driver_license?.imageUrl!)}
                                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                  View Full Size
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Profile created</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedProfile.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last updated</p>
                    <p className="text-gray-900 font-medium">{formatDate(selectedProfile.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="text-gray-900 font-medium font-mono text-xs">{selectedProfile.user.slice(-8)}</p>
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

      {/* Create Profile Modal - Side Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-2xl">
              <div className="h-full bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Create New Profile</h2>
                    <p className="text-sm text-gray-600">Add a new profile for user {userId?.slice(-8)}</p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Type</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {(["customer", "agent", "manager"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setProfileType(type);
                            setCreateForm({
                              target_user_id: userId || "",
                              full_name: "",
                              role: type,
                            } as CreateCustomerProfilePayload);
                          }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            profileType === type
                              ? "border-[#1EA2E4] bg-[#1EA2E4]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                            type === "customer" ? "bg-cyan-100 text-cyan-800" :
                            type === "agent" ? "bg-indigo-100 text-indigo-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {getProfileIcon(type)}
                          </div>
                          <span className="text-sm font-medium text-gray-800 capitalize">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={createForm.full_name}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={createForm.dob ? new Date(createForm.dob).toISOString().split('T')[0] : ''}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          National ID
                        </label>
                        <input
                          type="text"
                          value={createForm.national_id || ''}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, national_id: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Driver's License Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">Driver's License Information</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            License Number
                          </label>
                          <input
                            type="text"
                            value={createForm.driver_license?.number || ''}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              driver_license: {
                                ...prev.driver_license,
                                number: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            value={createForm.driver_license?.country || ''}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              driver_license: {
                                ...prev.driver_license,
                                country: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            License Class
                          </label>
                          <input
                            type="text"
                            value={createForm.driver_license?.class || ''}
                            onChange={(e) => setCreateForm(prev => ({
                              ...prev,
                              driver_license: {
                                ...prev.driver_license,
                                class: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={createForm.driver_license?.expires_at ? new Date(createForm.driver_license.expires_at).toISOString().split('T')[0] : ''}
                            onChange={(e) => setCreateForm(prev => ({
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

                      {/* Driver's License Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Driver's License Image
                        </label>
                        <div className="space-y-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                          >
                            {driverLicensePreview ? (
                              <div className="space-y-3">
                                <div className="relative w-32 h-32 mx-auto border border-gray-300 rounded-lg overflow-hidden">
                                  <img
                                    src={driverLicensePreview}
                                    alt="Driver's License Preview"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <p className="text-sm text-gray-600">Click to change image</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                                <p className="text-sm text-gray-600">Click to upload driver's license image</p>
                                <p className="text-xs text-gray-500">Supports: JPG, PNG, WebP (Max 5MB)</p>
                              </div>
                            )}
                          </div>

                          {isUploading && (
                            <div className="space-y-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1EA2E4] transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 text-center">Uploading: {uploadProgress}%</p>
                            </div>
                          )}

                          {driverLicenseFile && !isUploading && (
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-700">{driverLicenseFile.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(driverLicenseFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDriverLicenseFile(null);
                                  setDriverLicensePreview(null);
                                  if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role-specific fields */}
                    {profileType === "customer" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Initial Loyalty Points
                        </label>
                        <input
                          type="number"
                          value={(createForm as CreateCustomerProfilePayload).loyalty_points || ''}
                          onChange={(e) => setCreateForm(prev => ({ 
                            ...prev, 
                            loyalty_points: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          min="0"
                        />
                      </div>
                    )}

                    {profileType === "agent" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Branch ID *
                          </label>
                          <input
                            type="text"
                            value={(createForm as CreateAgentProfilePayload).branch_id || ''}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, branch_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="canApplyDiscounts"
                            checked={(createForm as CreateAgentProfilePayload).can_apply_discounts || false}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              can_apply_discounts: e.target.checked 
                            }))}
                            className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                          />
                          <label htmlFor="canApplyDiscounts" className="ml-2 text-sm text-gray-700">
                            Can apply discounts
                          </label>
                        </div>
                      </div>
                    )}

                    {profileType === "manager" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Branch IDs (comma-separated) *
                          </label>
                          <textarea
                            value={(createForm as CreateManagerProfilePayload).branch_ids?.join(', ') || ''}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              branch_ids: e.target.value.split(',').map(id => id.trim()) 
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
                            rows={3}
                            placeholder="branch-1, branch-2, branch-3"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval Limit (USD)
                          </label>
                          <input
                            type="number"
                            value={(createForm as CreateManagerProfilePayload).approval_limit_usd || ''}
                            onChange={(e) => setCreateForm(prev => ({ 
                              ...prev, 
                              approval_limit_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="verified"
                          checked={createForm.verified || false}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, verified: e.target.checked }))}
                          className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                        />
                        <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                          Mark profile as verified
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProfile}
                      disabled={!createForm.full_name || 
                        (profileType === "agent" && !(createForm as CreateAgentProfilePayload).branch_id) || 
                        (profileType === "manager" && !(createForm as CreateManagerProfilePayload).branch_ids) ||
                        isUploading
                      }
                      className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : 'Create Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal - Side Modal */}
      {isEditModalOpen && selectedProfile && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-2xl">
              <div className="h-full bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.full_name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={editForm.dob ? new Date(editForm.dob).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          National ID
                        </label>
                        <input
                          type="text"
                          value={editForm.national_id || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, national_id: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Driver's License Section for Edit */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700">Driver's License Information</h4>
                      
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
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            value={editForm.driver_license?.country || ''}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              driver_license: {
                                ...prev.driver_license,
                                country: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            License Class
                          </label>
                          <input
                            type="text"
                            value={editForm.driver_license?.class || ''}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              driver_license: {
                                ...prev.driver_license,
                                class: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
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

                      {/* Driver's License Image Upload for Edit */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Driver's License Image
                        </label>
                        <div className="space-y-4">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          
                          {driverLicensePreview || editForm.driver_license?.imageUrl ? (
                            <div className="space-y-3">
                              <div className="relative w-32 h-32 mx-auto border border-gray-300 rounded-lg overflow-hidden">
                                <img
                                  src={driverLicensePreview || editForm.driver_license?.imageUrl}
                                  alt="Driver's License Preview"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-3 py-1.5 text-sm bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors"
                                >
                                  Change Image
                                </button>
                                <button
                                  type="button"
                                  onClick={removeDriverLicenseImage}
                                  className="px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                  Remove Image
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                              <p className="text-sm text-gray-600 mt-2">Click to upload driver's license image</p>
                              <p className="text-xs text-gray-500">Supports: JPG, PNG, WebP (Max 5MB)</p>
                            </div>
                          )}

                          {isUploading && (
                            <div className="space-y-2">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#1EA2E4] transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 text-center">Uploading: {uploadProgress}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Role-specific fields */}
                    {selectedProfile.role === "customer" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loyalty Points
                        </label>
                        <input
                          type="number"
                          value={editForm.loyalty_points || ''}
                          onChange={(e) => setEditForm(prev => ({ 
                            ...prev, 
                            loyalty_points: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          min="0"
                        />
                      </div>
                    )}

                    {selectedProfile.role === "agent" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Branch ID
                          </label>
                          <input
                            type="text"
                            value={editForm.branch_id || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, branch_id: e.target.value }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="editCanApplyDiscounts"
                            checked={editForm.can_apply_discounts || false}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              can_apply_discounts: e.target.checked 
                            }))}
                            className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                          />
                          <label htmlFor="editCanApplyDiscounts" className="ml-2 text-sm text-gray-700">
                            Can apply discounts
                          </label>
                        </div>
                      </div>
                    )}

                    {selectedProfile.role === "manager" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Branch IDs (comma-separated)
                          </label>
                          <textarea
                            value={editForm.branch_ids?.join(', ') || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              branch_ids: e.target.value.split(',').map(id => id.trim()) 
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent resize-none"
                            rows={3}
                            placeholder="branch-1, branch-2, branch-3"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Approval Limit (USD)
                          </label>
                          <input
                            type="number"
                            value={editForm.approval_limit_usd || ''}
                            onChange={(e) => setEditForm(prev => ({ 
                              ...prev, 
                              approval_limit_usd: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="editVerified"
                          checked={editForm.verified || false}
                          onChange={(e) => setEditForm(prev => ({ ...prev, verified: e.target.checked }))}
                          className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                        />
                        <label htmlFor="editVerified" className="ml-2 text-sm text-gray-700">
                          Mark profile as verified
                        </label>
                      </div>
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
                      disabled={!editForm.full_name || isUploading}
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

      {/* Image Viewer Modal - Centered */}
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
                  <h3 className="text-lg font-bold text-gray-900">Delete Profile</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this profile? All associated data will be permanently removed.
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

      {/* Snackbar */}
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

export default AdminUserProfilePage;