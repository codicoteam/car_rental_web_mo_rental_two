import React, { useState, useEffect, useCallback, useRef } from "react";
import Sidebar from "../../../components/ManagerSideBar";
import {
  Search,
  Eye,
  Filter,
  X,
  Star,
  MapPin,
   DollarSign,
 Calendar,
  Phone,
  Mail,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Languages,
  Briefcase,
  IdCard,
  Verified,
  Users,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertTriangle,
  UserCheck,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Edit,
  Upload
 
} from "lucide-react";
import DriverProfileService, { 
  type DriverProfile, 
  type UpdateDriverPayload
} from "../../../Services/adminAndManager/driver_profiles_service";
import { createClient } from "@supabase/supabase-js";


const supabaseUrl = "https://hfbudnmvjbzvpefvtiuu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYnVkbm12amJ6dnBlZnZ0aXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczOTE2NTgsImV4cCI6MjA2Mjk2NzY1OH0.ionCach1O5vekQDoP7Bx6pSVaLXduJN9kYbWwlaRzKk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

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

    const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to get file URL after upload");
    }

    return publicUrlData.publicUrl;
};

const AdminDriverProfiles: React.FC = () => {
  // State
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [driverToAct, setDriverToAct] = useState<DriverProfile | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [editForm, setEditForm] = useState<Partial<DriverProfile>>({});
const [uploadProgress, setUploadProgress] = useState<number>(0);
const [isUploading, setIsUploading] = useState(false);
const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
const [profileImagePreview, setProfileImagePreview] = useState<string>("");
const [licenseImageFile, setLicenseImageFile] = useState<File | null>(null);
const [licenseImagePreview, setLicenseImagePreview] = useState<string>("");
const [idImageFile, setIdImageFile] = useState<File | null>(null);
const [idImagePreview, setIdImagePreview] = useState<string>("");
const profileImageRef = useRef<HTMLInputElement>(null);
const licenseImageRef = useRef<HTMLInputElement>(null);
const idImageRef = useRef<HTMLInputElement>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load drivers
  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DriverProfileService.getAllDriverProfiles();
      
      if (response.success) {
        setDrivers(response.data);
        showSnackbar(`Loaded ${response.data.length} drivers successfully`, "success");
      } else {
        throw new Error("Failed to load drivers");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load driver profiles");
      showSnackbar(err.message || "Failed to load driver profiles", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Open view modal
  const openViewModal = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setIsViewModalOpen(true);
  };

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(drivers.map(driver => driver.base_city)));

  // Filter drivers
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      searchTerm === "" ||
      driver.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.user_id.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.user_id.full_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity = cityFilter === "all" || driver.base_city === cityFilter;
    
    const matchesAvailability = 
      availabilityFilter === "all" || 
      (availabilityFilter === "available" && driver.is_available) ||
      (availabilityFilter === "unavailable" && !driver.is_available);
    
    const matchesRating = 
      ratingFilter === "all" ||
      (ratingFilter === "4plus" && driver.rating_average >= 4) ||
      (ratingFilter === "3to4" && driver.rating_average >= 3 && driver.rating_average < 4) ||
      (ratingFilter === "below3" && driver.rating_average < 3);

    return matchesSearch && matchesCity && matchesAvailability && matchesRating;
  });

  const handleApprove = async (driver: DriverProfile) => {
  setIsSubmitting(true);
  try {
    const response = await DriverProfileService.approveDriverProfile(driver._id);
    if (response.success) {
      showSnackbar(`Driver ${driver.display_name} approved successfully`, "success");
      loadDrivers();
      setIsApproveModalOpen(false);
      setDriverToAct(null);
    }
  } catch (err: any) {
    showSnackbar(err.message || "Failed to approve driver", "error");
  } finally {
    setIsSubmitting(false);
  }
};

const handleReject = async () => {
  if (!rejectReason.trim()) {
    showSnackbar("Please provide a reason for rejection", "error");
    return;
  }
  setIsSubmitting(true);
  try {
    const response = await DriverProfileService.rejectDriverProfile(driverToAct!._id, rejectReason);
    if (response.success) {
      showSnackbar(`Driver ${driverToAct?.display_name} rejected`, "success");
      loadDrivers();
      setIsRejectModalOpen(false);
      setDriverToAct(null);
      setRejectReason("");
    }
  } catch (err: any) {
    showSnackbar(err.message || "Failed to reject driver", "error");
  } finally {
    setIsSubmitting(false);
  }
};

const handleDelete = async () => {
  setIsSubmitting(true);
  try {
    const response = await DriverProfileService.deleteDriverProfile(driverToAct!._id);
    if (response.success) {
      showSnackbar(`Driver ${driverToAct?.display_name} deleted successfully`, "success");
      loadDrivers();
      setIsDeleteModalOpen(false);
      setDriverToAct(null);
    }
  } catch (err: any) {
    showSnackbar(err.message || "Failed to delete driver", "error");
  } finally {
    setIsSubmitting(false);
  }
};

 const uploadImage = async (file: File): Promise<string> => {
    const sanitizedFileName = sanitizeFilename(file.name);
    const fileName = `${Date.now()}_${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
        .from("topics")
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
        });

    if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
        .from("topics")
        .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to get file URL after upload");
    }

    return publicUrlData.publicUrl;
};

 const handleUpdateDriver = async () => {
    if (!selectedDriver) return;
    
    setIsUploading(true);
    
    try {
        let profileImageUrl = editForm.profile_image;
        let licenseImageUrl = editForm.driver_license?.imageUrl;
        let idImageUrl = editForm.identity_document?.imageUrl;
        
        if (profileImageFile) {
            profileImageUrl = await uploadImage(profileImageFile);
        }
        
        if (licenseImageFile) {
            licenseImageUrl = await uploadImage(licenseImageFile);
        }
        
        if (idImageFile) {
            idImageUrl = await uploadImage(idImageFile);
        }
        
        const updatePayload: UpdateDriverPayload = {
            display_name: editForm.display_name || "",
            base_city: editForm.base_city || "",
            base_region: editForm.base_region || "",
            base_country: editForm.base_country || "",
            hourly_rate: editForm.hourly_rate || 0,
            bio: editForm.bio || "",
            years_experience: editForm.years_experience || 0,
            languages: editForm.languages || [],
            is_available: editForm.is_available || false,
            profile_image: profileImageUrl || "",
            driver_license: {
                number: editForm.driver_license?.number || "",
                imageUrl: licenseImageUrl || "",
                country: editForm.driver_license?.country || "",
                class: editForm.driver_license?.class || "",
                expires_at: editForm.driver_license?.expires_at || new Date().toISOString(),
                verified: editForm.driver_license?.verified || false,
            },
            identity_document: {
                type: editForm.identity_document?.type || "national_id",
                imageUrl: idImageUrl || "",
            },
        };
        
        const response = await DriverProfileService.updateDriverProfileById(selectedDriver._id, updatePayload);
        
        if (response.success) {
            showSnackbar("Driver profile updated successfully", "success");
            setIsEditModalOpen(false);
            loadDrivers();
            resetEditForm();
        }
    } catch (err: any) {
        showSnackbar(err.message || "Failed to update driver", "error");
    } finally {
        setIsUploading(false);
    }
};
 const openEditModal = (driver: DriverProfile) => {
    setSelectedDriver(driver);
    setEditForm({
        display_name: driver.display_name,
        base_city: driver.base_city,
        base_region: driver.base_region,
        base_country: driver.base_country,
        hourly_rate: driver.hourly_rate,
        bio: driver.bio,
        years_experience: driver.years_experience,
        languages: driver.languages,
        is_available: driver.is_available,
        profile_image: driver.profile_image,
        driver_license: driver.driver_license,
        identity_document: driver.identity_document,
    });
    setProfileImageFile(null);
    setProfileImagePreview("");
    setLicenseImageFile(null);
    setLicenseImagePreview("");
    setIdImageFile(null);
    setIdImagePreview("");
    setIsEditModalOpen(true);
};

const resetEditForm = () => {
    setEditForm({});
    setProfileImageFile(null);
    setProfileImagePreview("");
    setLicenseImageFile(null);
    setLicenseImagePreview("");
    setIdImageFile(null);
    setIdImagePreview("");
    if (profileImageRef.current) profileImageRef.current.value = "";
    if (licenseImageRef.current) licenseImageRef.current.value = "";
    if (idImageRef.current) idImageRef.current.value = "";
};

 const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showSnackbar("Please select an image file", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showSnackbar("File size should be less than 5MB", "error");
            return;
        }
        setProfileImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
};

const handleLicenseImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showSnackbar("Please select an image file", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showSnackbar("File size should be less than 5MB", "error");
            return;
        }
        setLicenseImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setLicenseImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
};

const handleIdImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            showSnackbar("Please select an image file", "error");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showSnackbar("File size should be less than 5MB", "error");
            return;
        }
        setIdImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setIdImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
};

  // Get rating stars
  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="w-4 h-4 text-yellow-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (driver: DriverProfile) => {
    if (driver.status === "approved" && driver.is_available) {
      return { text: "AVAILABLE", color: "bg-green-100 text-green-800", icon: CheckCircle };
    } else if (driver.status === "approved" && !driver.is_available) {
      return { text: "BUSY", color: "bg-yellow-100 text-yellow-800", icon: ClockIcon };
    } else if (driver.status === "pending") {
      return { text: "PENDING", color: "bg-orange-100 text-orange-800", icon: AlertTriangle };
    } else {
      return { text: "REJECTED", color: "bg-red-100 text-red-800", icon: XCircle };
    }
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get driver stats
  const driverStats = {
    total: drivers.length,
    available: drivers.filter(d => d.is_available && d.status === "approved").length,
    busy: drivers.filter(d => !d.is_available && d.status === "approved").length,
    pending: drivers.filter(d => d.status === "pending").length,
    avgRating: drivers.length > 0 
      ? (drivers.reduce((sum, d) => sum + d.rating_average, 0) / drivers.length).toFixed(1)
      : "0.0",
    totalReviews: drivers.reduce((sum, d) => sum + d.rating_count, 0),
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Driver Profiles</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and view all registered drivers</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadDrivers}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Drivers</p>
                    <p className="text-2xl font-bold text-gray-800">{driverStats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-green-600">{driverStats.available}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Busy</p>
                    <p className="text-2xl font-bold text-yellow-600">{driverStats.busy}</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-purple-600">{driverStats.avgRating}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Star className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-orange-600">{driverStats.totalReviews}</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or bio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Cities</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] bg-white appearance-none pr-10 min-w-[140px]"
                    >
                      <option value="all">All Ratings</option>
                      <option value="4plus">4+ Stars</option>
                      <option value="3to4">3-4 Stars</option>
                      <option value="below3">Below 3 Stars</option>
                    </select>
                    <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="px-6 pb-6">
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
                  onClick={loadDrivers}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Users className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No drivers found</p>
                <p className="text-gray-400 text-center">
                  {searchTerm || cityFilter !== "all" || availabilityFilter !== "all" || ratingFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "No drivers are currently registered"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => {
                      const statusBadge = getStatusBadge(driver);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <div
                          key={driver._id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Header with gradient background */}
                          <div className="relative bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] px-6 py-4">
                            <div className="absolute top-3 right-3">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge.color} flex items-center gap-1`}
                              >
                                <StatusIcon className="w-3 h-3" />
                                {statusBadge.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Profile Avatar */}
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
                                {driver.profile_image ? (
                                  <img
                                    src={driver.profile_image}
                                    alt={driver.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-2xl font-bold">
                                    {driver.display_name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">{driver.display_name}</h3>
                                <p className="text-sm text-white/90">{driver.user_id.full_name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  {getRatingStars(driver.rating_average)}
                                  <span className="text-xs text-white/90 ml-1">
                                    ({driver.rating_count} reviews)
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            {/* Basic Info */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.base_city}, {driver.base_region}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{formatCurrency(driver.hourly_rate)} / hour</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Briefcase className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.years_experience} years experience</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Languages className="w-4 h-4 text-[#1EA2E4]" />
                                <span>{driver.languages.join(", ")}</span>
                              </div>
                            </div>

                            {/* Bio Preview */}
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {driver.bio}
                              </p>
                            </div>

                            {/* License Info */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <IdCard className="w-3 h-3 text-gray-500" />
                                  <span className="text-gray-600">License:</span>
                                  <span className="font-mono font-medium">{driver.driver_license.number}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {driver.driver_license.verified ? (
                                    <>
                                      <Verified className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600">Verified</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-3 h-3 text-yellow-500" />
                                      <span className="text-yellow-600">Unverified</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Expires: {formatDate(driver.driver_license.expires_at)}
                              </div>
                            </div>

                            {/* Actions */}
                            {/* <div className="flex justify-end">
                              <button
                                onClick={() => openViewModal(driver)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                            </div> */}
                            <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => openViewModal(driver)}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                                 title="View Driver"
                                >
                                <Eye className="w-4 h-4" />
                                
                                </button>
                                <button
                                    onClick={() => openEditModal(driver)}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                                    title="Edit Driver Profile"
                                >
                                    <Edit className="w-4 h-4" />
                                    
                                </button>
                            {driver.status === "pending" && (
                                <>
                                <button
                                    onClick={() => {
                                    setDriverToAct(driver);
                                    setIsApproveModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                     title="Approve Driver Profile"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    
                                </button>
                                <button
                                    onClick={() => {
                                    setDriverToAct(driver);
                                    setIsRejectModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                     title="Reject Driver Profile"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    
                                </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                setDriverToAct(driver);
                                setIsDeleteModalOpen(true);
                                }}
                                className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                 title="Delete Driver Profile"
                            >
                                <Trash2 className="w-4 h-4" />
                                
                            </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
               {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                {filteredDrivers.map((driver) => {
                    const statusBadge = getStatusBadge(driver);
                    const StatusIcon = statusBadge.icon;

                    return (
                    <div
                        key={driver._id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                    >
                        <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] flex items-center justify-center">
                                {driver.profile_image ? (
                                <img
                                    src={driver.profile_image}
                                    alt={driver.display_name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                                ) : (
                                <span className="text-white text-lg font-bold">
                                    {driver.display_name.charAt(0)}
                                </span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">{driver.display_name}</h3>
                                <div className="flex items-center gap-1">
                                {getRatingStars(driver.rating_average)}
                                </div>
                            </div>
                            </div>
                            <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color} flex items-center gap-1`}
                            >
                            <StatusIcon className="w-3 h-3" />
                            {statusBadge.text}
                            </span>
                        </div>

                        <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{driver.base_city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatCurrency(driver.hourly_rate)}/hr</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button
                            onClick={() => openViewModal(driver)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                            title="View Driver"
                            >
                            <Eye className="w-4 h-4" />
                            
                            </button>

                            <button
                            onClick={() => openEditModal(driver)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors text-sm font-medium"
                            title="Edit Driver Profile"
                            >
                            <Edit className="w-4 h-4" />
                            
                            </button>


                        {driver.status === "pending" && (
                            <>
                                <button
                                onClick={() => {
                                    setDriverToAct(driver);
                                    setIsApproveModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                                title="Approve Driver Profile"
                                >
                                <ThumbsUp className="w-4 h-4" />
                                
                                </button>
                                <button
                                onClick={() => {
                                    setDriverToAct(driver);
                                    setIsRejectModalOpen(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                title="Reject Driver Profile"
                                >
                                <ThumbsDown className="w-4 h-4" />
                                
                                </button>
                            </>
                            )}
                            <button
                            onClick={() => {
                                setDriverToAct(driver);
                                setIsDeleteModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                            title="Delete Driver Profile"
                            >
                            <Trash2 className="w-4 h-4" />
                            
                            </button>
                        </div>
                        </div>
                    </div>
                    );
                })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Driver Details Modal */}
      {isViewModalOpen && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Driver Profile Details</h2>
                <p className="text-sm text-gray-600">Complete driver information and credentials</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="space-y-8">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-[#1EA2E4] to-[#1A8BC9] rounded-xl p-6 text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
                      {selectedDriver.profile_image ? (
                        <img
                          src={selectedDriver.profile_image}
                          alt={selectedDriver.display_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-3xl font-bold">
                          {selectedDriver.display_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedDriver.display_name}</h3>
                      <p className="text-white/90">{selectedDriver.user_id.full_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getRatingStars(selectedDriver.rating_average)}
                        <span className="text-sm">({selectedDriver.rating_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.user_id.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.user_id.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">
                          {selectedDriver.base_city}, {selectedDriver.base_region}, {selectedDriver.base_country}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Years of Experience</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{selectedDriver.years_experience} years</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Languages</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedDriver.languages.map(lang => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Hourly Rate</p>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="text-lg font-bold text-[#1EA2E4]">
                          {formatCurrency(selectedDriver.hourly_rate)}/hour
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Bio
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{selectedDriver.bio}</p>
                </div>

                {/* License Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    License Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">License Number</p>
                      <p className="text-sm font-mono font-medium">{selectedDriver.driver_license.number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">License Class</p>
                      <p className="text-sm font-medium">{selectedDriver.driver_license.class}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Country of Issue</p>
                      <p className="text-sm font-medium">{selectedDriver.driver_license.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expiration Date</p>
                      <p className="text-sm font-medium">{formatDate(selectedDriver.driver_license.expires_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Verification Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedDriver.driver_license.verified ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedDriver.driver_license.imageUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">License Image</p>
                      <img
                        src={selectedDriver.driver_license.imageUrl}
                        alt="Driver License"
                        className="rounded-lg border border-gray-200 max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300/1EA2E4/ffffff?text=License+Image";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Identity Document */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Identity Document
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Document Type</p>
                      <p className="text-sm font-medium capitalize">{selectedDriver.identity_document.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {selectedDriver.identity_document.imageUrl && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Document Image</p>
                      <img
                        src={selectedDriver.identity_document.imageUrl}
                        alt="Identity Document"
                        className="rounded-lg border border-gray-200 max-h-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300/1EA2E4/ffffff?text=Identity+Document";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Admin Approval Information */}
                {selectedDriver.approved_by_admin && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      Admin Approval
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-gray-500">Approved By</p>
                        <div className="flex items-center gap-2 mt-1">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          <p className="text-sm font-medium">{selectedDriver.approved_by_admin.full_name}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Approved At</p>
                        <p className="text-sm font-medium">{formatDate(selectedDriver.approved_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    Status Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-xs text-gray-500">Driver Status</p>
                      <div className="mt-1">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedDriver).color}`}>
                          {getStatusBadge(selectedDriver).text}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedDriver.is_available ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Available for hire</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-600">Currently unavailable</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Joined Date</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium">{formatDate(selectedDriver.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-8 py-5">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


            {/* Edit Driver Modal - Side Modal */}
{isEditModalOpen && selectedDriver && (
    <div className="fixed inset-0 z-50 overflow-hidden">
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
        />
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-3xl">
                <div className="h-full bg-white shadow-2xl overflow-y-auto">
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Edit Driver Profile</h2>
                            <p className="text-sm text-gray-600">Update driver information</p>
                        </div>
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* User ID - Read Only */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Account Information</h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                                <input
                                    type="text"
                                    value={selectedDriver.user_id?._id || (typeof selectedDriver.user_id === "string" ? selectedDriver.user_id : "")}
                                    disabled
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">User ID cannot be changed</p>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={editForm.display_name || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Years Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.years_experience || 0}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base City</label>
                                    <input
                                        type="text"
                                        value={editForm.base_city || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, base_city: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Region</label>
                                    <input
                                        type="text"
                                        value={editForm.base_region || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, base_region: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Country</label>
                                    <input
                                        type="text"
                                        value={editForm.base_country || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, base_country: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editForm.hourly_rate || 0}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Languages (comma separated)</label>
                                    <input
                                        type="text"
                                        value={editForm.languages?.join(", ") || ""}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, languages: e.target.value.split(",").map(l => l.trim()) }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        placeholder="English, Shona, etc."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                <textarea
                                    value={editForm.bio || ""}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.is_available || false}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, is_available: e.target.checked }))}
                                        className="w-4 h-4 text-[#1EA2E4] rounded focus:ring-[#1EA2E4]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Available for hire</span>
                                </label>
                            </div>
                        </div>

                        {/* Driver License Information */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Driver License Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                                    <input
                                        type="text"
                                        value={editForm.driver_license?.number || ""}
                                        onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            driver_license: {
                                                ...prev.driver_license,
                                                number: e.target.value,
                                                imageUrl: prev.driver_license?.imageUrl || "",
                                                country: prev.driver_license?.country || "",
                                                class: prev.driver_license?.class || "",
                                                expires_at: prev.driver_license?.expires_at || "",
                                                verified: prev.driver_license?.verified || false
                                            }
                                        }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">License Class</label>
                                    <input
                                        type="text"
                                        value={editForm.driver_license?.class || ""}
                                        onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            driver_license: {
                                                ...prev.driver_license,
                                                class: e.target.value,
                                                imageUrl: prev.driver_license?.imageUrl || "",
                                                country: prev.driver_license?.country || "",
                                                number: prev.driver_license?.number || "",
                                                expires_at: prev.driver_license?.expires_at || "",
                                                verified: prev.driver_license?.verified || false
                                            }
                                        }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country of Issue</label>
                                    <input
                                        type="text"
                                        value={editForm.driver_license?.country || ""}
                                        onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            driver_license: {
                                                ...prev.driver_license,
                                                country: e.target.value,
                                                imageUrl: prev.driver_license?.imageUrl || "",
                                                number: prev.driver_license?.number || "",
                                                class: prev.driver_license?.class || "",
                                                expires_at: prev.driver_license?.expires_at || "",
                                                verified: prev.driver_license?.verified || false
                                            }
                                        }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date</label>
                                    <input
                                        type="date"
                                        value={editForm.driver_license?.expires_at ? new Date(editForm.driver_license.expires_at).toISOString().split('T')[0] : ""}
                                        onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            driver_license: {
                                                ...prev.driver_license,
                                                expires_at: e.target.value ? new Date(e.target.value).toISOString() : "",
                                                imageUrl: prev.driver_license?.imageUrl || "",
                                                number: prev.driver_license?.number || "",
                                                country: prev.driver_license?.country || "",
                                                class: prev.driver_license?.class || "",
                                                verified: prev.driver_license?.verified || false
                                            }
                                        }))}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={editForm.driver_license?.verified || false}
                                        onChange={(e) => setEditForm(prev => ({
                                            ...prev,
                                            driver_license: {
                                                ...prev.driver_license,
                                                verified: e.target.checked,
                                                imageUrl: prev.driver_license?.imageUrl || "",
                                                number: prev.driver_license?.number || "",
                                                country: prev.driver_license?.country || "",
                                                class: prev.driver_license?.class || "",
                                                expires_at: prev.driver_license?.expires_at || ""
                                            }
                                        }))}
                                        className="w-4 h-4 text-[#1EA2E4] rounded focus:ring-[#1EA2E4]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">License Verified</span>
                                </label>
                            </div>

                            {/* License Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">License Image</label>
                                <input
                                    ref={licenseImageRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLicenseImageSelect}
                                    className="hidden"
                                />
                                {(licenseImagePreview || editForm.driver_license?.imageUrl) && (
                                    <div className="relative inline-block mb-2">
                                        <img
                                            src={licenseImagePreview || editForm.driver_license?.imageUrl}
                                            alt="License"
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLicenseImageFile(null);
                                                setLicenseImagePreview("");
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    driver_license: {
                                                        ...prev.driver_license,
                                                        imageUrl: "",
                                                        number: prev.driver_license?.number || "",
                                                        country: prev.driver_license?.country || "",
                                                        class: prev.driver_license?.class || "",
                                                        expires_at: prev.driver_license?.expires_at || "",
                                                        verified: prev.driver_license?.verified || false
                                                    }
                                                }));
                                                if (licenseImageRef.current) licenseImageRef.current.value = "";
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => licenseImageRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Upload License Image</span>
                                </button>
                            </div>
                        </div>

                        {/* Identity Document */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Identity Document</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                                <select
                                    value={editForm.identity_document?.type || "national_id"}
                                    onChange={(e) => setEditForm(prev => ({
                                        ...prev,
                                        identity_document: {
                                            ...prev.identity_document,
                                            type: e.target.value,
                                            imageUrl: prev.identity_document?.imageUrl || ""
                                        }
                                    }))}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                >
                                    <option value="national_id">National ID</option>
                                    <option value="passport">Passport</option>
                                    <option value="drivers_license">Driver's License</option>
                                </select>
                            </div>

                            {/* ID Document Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Document Image</label>
                                <input
                                    ref={idImageRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleIdImageSelect}
                                    className="hidden"
                                />
                                {(idImagePreview || editForm.identity_document?.imageUrl) && (
                                    <div className="relative inline-block mb-2">
                                        <img
                                            src={idImagePreview || editForm.identity_document?.imageUrl}
                                            alt="ID Document"
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIdImageFile(null);
                                                setIdImagePreview("");
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    identity_document: {
                                                        ...prev.identity_document,
                                                        imageUrl: "",
                                                        type: prev.identity_document?.type || "national_id"
                                                    }
                                                }));
                                                if (idImageRef.current) idImageRef.current.value = "";
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => idImageRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Document Image</span>
                                </button>
                            </div>
                        </div>

                        {/* Profile Image Upload */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Profile Image</h3>

                            <input
                                ref={profileImageRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfileImageSelect}
                                className="hidden"
                            />

                            {(profileImagePreview || editForm.profile_image) && (
                                <div className="relative inline-block">
                                    <img
                                        src={profileImagePreview || editForm.profile_image}
                                        alt="Profile"
                                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileImageFile(null);
                                            setProfileImagePreview("");
                                            setEditForm(prev => ({ ...prev, profile_image: "" }));
                                            if (profileImageRef.current) profileImageRef.current.value = "";
                                        }}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => profileImageRef.current?.click()}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload Profile Image</span>
                            </button>
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
                                onClick={handleUpdateDriver}
                                disabled={isUploading}
                                className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}

      

                {/* Approve Modal */}
                {isApproveModalOpen && driverToAct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsApproveModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <ThumbsUp className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Approve Driver</h3>
                        <p className="text-gray-600 mt-2">
                        Are you sure you want to approve <span className="font-semibold">{driverToAct.display_name}</span>?
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                        onClick={() => setIsApproveModalOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                        >
                        Cancel
                        </button>
                        <button
                        onClick={() => handleApprove(driverToAct)}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                        {isSubmitting ? (
                            <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Approving...
                            </>
                        ) : (
                            "Approve"
                        )}
                        </button>
                    </div>
                    </div>
                </div>
                )}

                {/* Reject Modal */}
                {isRejectModalOpen && driverToAct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsRejectModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <ThumbsDown className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 text-center">Reject Driver</h3>
                        <p className="text-gray-600 text-center mt-2">
                        Are you sure you want to reject <span className="font-semibold">{driverToAct.display_name}</span>?
                        </p>
                        <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reason for rejection *</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Please provide a reason for rejecting this driver..."
                        />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                        onClick={() => {
                            setIsRejectModalOpen(false);
                            setRejectReason("");
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                        >
                        Cancel
                        </button>
                        <button
                        onClick={handleReject}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                        {isSubmitting ? (
                            <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Rejecting...
                            </>
                        ) : (
                            "Reject"
                        )}
                        </button>
                    </div>
                    </div>
                </div>
                )}

                {/* Delete Modal */}
                {isDeleteModalOpen && driverToAct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Delete Driver</h3>
                        <p className="text-gray-600 mt-2">
                        Are you sure you want to delete <span className="font-semibold">{driverToAct.display_name}</span>?
                        </p>
                        <p className="text-red-600 text-sm mt-2">This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isSubmitting}
                        >
                        Cancel
                        </button>
                        <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                        {isSubmitting ? (
                            <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                        </button>
                    </div>
                    </div>
                </div>
                )}

      {/* Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
              snackbar.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : snackbar.type === "error"
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-blue-50 border border-blue-200 text-blue-800"
            }`}
          >
            {snackbar.type === "success" && (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {snackbar.type === "error" && (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button
              onClick={() => setSnackbar((prev) => ({ ...prev, show: false }))}
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

export default AdminDriverProfiles;