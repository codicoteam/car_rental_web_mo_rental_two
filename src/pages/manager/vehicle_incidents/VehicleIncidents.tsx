import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from '../../../app/store';
import ManagerSidebar from "../../../components/ManagerSideBar";
import { fetchAllIncidents,
     createIncident,
  updateIncident,
  deleteIncident,
  getIncidentErrorDisplay,
  type IVehicleIncident,
  type CreateIncidentPayload,
  type UpdateIncidentPayload,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,

 } from "../../../Services/vehicle_incidents";
// import {
//   fetchVehicles,
//   type IVehicle,
// } from "../../Services/adminAndManager/admin_vehicle_service";
import { 
    fetchVehicleUnits,
    type IVehicleUnit,
} from "../../../Services/adminAndManager/vehicle_units_services";

// import {
//   fetchReservations,
//   type IReservation,
// } from "../../Services/adminAndManager/admin_reservation_service";
import { fetchReservations } from '../../../features/reservation/reservationthunks';
import { useDispatch, useSelector } from 'react-redux';

import { selectReservations } from '../../../features/reservation/reservationSelectors';
import { branchesService } from '../../../Services/branchesService';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Car,
  Calendar,
  ChevronDown,
  ChevronUp,
  Upload,
  Filter,
  Search,
  RefreshCw,
  Maximize2,
  Minus,
  ZoomIn,
  DollarSign,
  MapPin,
  AlertTriangle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
} from "lucide-react";

import { supabase } from "../../../helpers/supa_base_client";

// Helper function to get user ID from localStorage
const getUserId = (): string | null => {
  try {
    const authData = localStorage.getItem('car_rental_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed?.user?._id || parsed?.userId || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Helper function to get manager branch ID
const getManagerBranchId = (): string | null => {
  try {
    return localStorage.getItem('manager_branch_id');
  } catch (error) {
    console.error('Error getting branch ID:', error);
    return null;
  }
};


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

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to get file URL after upload");
  }

  return publicUrlData.publicUrl;
};

// Options
const INCIDENT_TYPES: IncidentType[] = ["accident", "tyre", "scratch", "windshield", "mechanical_issue", "other"];
const INCIDENT_SEVERITIES: IncidentSeverity[] = ["minor", "major"];
const INCIDENT_STATUSES: IncidentStatus[] = ["open", "under_review", "resolved", "written_off"];

const VehicleIncidents: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [incidents, setIncidents] = useState<IVehicleIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dropdown data
  const [vehicles, setVehicles] = useState<IVehicleUnit[]>([]);
  const [reservations, setReservations] = useState<any>([]);

  const dispatch = useDispatch<AppDispatch>();

 

  // Modal states
  const [selectedIncident, setSelectedIncident] = useState<IVehicleIncident | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageZoom, setImageZoom] = useState(1);

  // Add these with your other state declarations (around line 60-80)
const [reservationSearch, setReservationSearch] = useState("");
const [isReservationDropdownOpen, setIsReservationDropdownOpen] = useState(false);
const reservationDropdownRef = useRef<HTMLDivElement>(null);

// For edit modal (add these as well)
const [editReservationSearch, setEditReservationSearch] = useState("");
const [isEditReservationDropdownOpen, setIsEditReservationDropdownOpen] = useState(false);
const editReservationDropdownRef = useRef<HTMLDivElement>(null);
// For edit modal reservation dropdown

  // Form states
 // In your createForm state, keep estimated_cost, final_cost, chargeable_to_customer_amount as numbers
const [createForm, setCreateForm] = useState<CreateIncidentPayload>({
  vehicle_id: "",
  reservation_id: "",
  reported_by: "",
  branch_id: "",
  type: "accident",
  severity: "minor",
  photos: [],
  description: "",
  occurred_at: new Date().toISOString().slice(0, 16),
  estimated_cost: undefined,
  final_cost: undefined,
  status: "open",
  chargeable_to_customer_amount: undefined,
  payment_id: "",
});

  const [editForm, setEditForm] = useState<UpdateIncidentPayload>({});

  // File upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit modal image management
  const [editExistingImages, setEditExistingImages] = useState<string[]>([]);
  const [editNewImageFiles, setEditNewImageFiles] = useState<File[]>([]);
  const [editNewImagePreviews, setEditNewImagePreviews] = useState<string[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  // Add this state after your other state declarations
const [filteredReservationsForDropdown, setFilteredReservationsForDropdown] = useState<any[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    severity: "",
    status: "",
    branch_id: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Drag and drop states
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  // Load data
const loadData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    
    const managerBranchId = getManagerBranchId();
    console.log('Manager Branch ID:', managerBranchId);
    
    const [incidentsResponse, vehiclesResponse, reservationsResponse] = await Promise.all([
      fetchAllIncidents(),
      fetchVehicleUnits(),
      dispatch(fetchReservations()).unwrap(),
    ]);
    
    // Filter incidents by manager's branch - FIXED with proper null handling
    const filteredIncidents = incidentsResponse.data.filter(incident => {
      // Handle cases where branch_id might be null, string, or object
      let incidentBranchId = null;
      
      if (incident.branch_id === null || incident.branch_id === undefined) {
        incidentBranchId = null;
      } else if (typeof incident.branch_id === 'string') {
        incidentBranchId = incident.branch_id;
      } else if (incident.branch_id._id) {
        incidentBranchId = incident.branch_id._id;
      }
      
      // Only include incidents that belong to the manager's branch
      // AND have a valid branch_id (not null)
      return incidentBranchId !== null && incidentBranchId === managerBranchId;
    });
    
    console.log('Original incidents:', incidentsResponse.data.length);
    console.log('Filtered incidents:', filteredIncidents.length);
    console.log('Manager branch ID used:', managerBranchId);
    
    setIncidents(filteredIncidents);
    
    const vehicleList = (vehiclesResponse as any)?.data?.items || [];
    setVehicles(vehicleList);
    
    const reservationsList = (reservationsResponse as any)?.data || 
                            (Array.isArray(reservationsResponse) ? reservationsResponse : []);
    setReservations(reservationsList);
    
  } catch (err) {
    console.error('Error in loadData:', err);
    const errorDisplay = getIncidentErrorDisplay(err);
    setError(errorDisplay.message || "Failed to load incidents");
    showSnackbar(errorDisplay.message, "error");
  } finally {
    setLoading(false);
  }
}, [dispatch]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add this useEffect after your loadData function
useEffect(() => {
  if (reservations && reservations.length > 0) {
    const managerBranchId = localStorage.getItem('manager_branch_id');
    
    if (!managerBranchId) {
      console.log('No manager branch ID found');
      setFilteredReservationsForDropdown([]);
      return;
    }
    
    // Filter reservations where pickup branch or dropoff branch matches manager's branch
    const filtered = reservations.filter((reservation: any) => {
      const pickupBranchId = reservation.pickup?.branch_id?._id || reservation.pickup_branch_id;
      const dropoffBranchId = reservation.dropoff?.branch_id?._id || reservation.dropoff_branch_id;
      
      return pickupBranchId === managerBranchId || dropoffBranchId === managerBranchId;
    });
    
    console.log(`Found ${filtered.length} reservations for branch ${managerBranchId}`);
    setFilteredReservationsForDropdown(filtered);
  }
}, [reservations]);

// Click outside handler for create modal reservation dropdown
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (reservationDropdownRef.current && !reservationDropdownRef.current.contains(event.target as Node)) {
      setIsReservationDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Click outside handler for edit modal reservation dropdown
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (editReservationDropdownRef.current && !editReservationDropdownRef.current.contains(event.target as Node)) {
      setIsEditReservationDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

// Click outside handler for edit modal reservation dropdown
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (editReservationDropdownRef.current && !editReservationDropdownRef.current.contains(event.target as Node)) {
      setIsEditReservationDropdownOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  // Snackbar helper
  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle file selection for images (Create modal)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showSnackbar(`Skipped ${file.name}: Not an image file`, 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar(`Skipped ${file.name}: File size should be less than 5MB`, 'error');
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle file selection for edit modal
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        showSnackbar(`Skipped ${file.name}: Not an image file`, 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar(`Skipped ${file.name}: File size should be less than 5MB`, 'error');
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setEditNewImageFiles(prev => [...prev, ...validFiles]);
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload images
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadedUrls: string[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        setUploadProgress(Math.round((i / totalFiles) * 100));

        try {
          const imageUrl = await uploadFileToSupabase(file, "topics");
          uploadedUrls.push(imageUrl);
        } catch (err) {
          showSnackbar(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
          throw err;
        }
      }

      setUploadProgress(100);
      setIsUploading(false);
      return uploadedUrls;
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      throw err;
    }
  };

const handleCreateIncident = async () => {
  try {
     setIsUploading(true);
    if (!createForm.vehicle_id || !createForm.description) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      imageUrls = await uploadImages(imageFiles);
    }

    const userId = getUserId();
    const branchId = getManagerBranchId();
    
    if (!userId) {
      showSnackbar("User ID not found. Please login again.", "error");
      return;
    }
    
    if (!branchId) {
      showSnackbar("Branch ID not found. Please login again.", "error");
      return;
    }
    
    // Format the occurred_at date to ISO string
    const occurredAt = createForm.occurred_at 
      ? new Date(createForm.occurred_at).toISOString()
      : new Date().toISOString();
    
    const payload: CreateIncidentPayload = {
      vehicle_id: createForm.vehicle_id,
      reservation_id: createForm.reservation_id || undefined,
      reported_by: userId,
      branch_id: branchId,
      type: createForm.type,
      severity: createForm.severity,
      photos: imageUrls,
      description: createForm.description,
      occurred_at: occurredAt,
      estimated_cost: createForm.estimated_cost ? Number(createForm.estimated_cost) : undefined,
      final_cost: createForm.final_cost ? Number(createForm.final_cost) : undefined,
      status: createForm.status,
      chargeable_to_customer_amount: createForm.chargeable_to_customer_amount ? Number(createForm.chargeable_to_customer_amount) : undefined,
      payment_id: createForm.payment_id || undefined,
    };

    console.log('Creating incident with payload:', payload);

    await createIncident(payload);
    showSnackbar("Incident reported successfully", "success");
    setIsCreateModalOpen(false);
    resetCreateForm();
    loadData();
  } catch (err) {
    const errorDisplay = getIncidentErrorDisplay(err);
    showSnackbar(errorDisplay.message, "error");
  }
  finally{
     setIsUploading(false);
  }
};

  // Handle update incident
  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;

    try {
    setIsUploading(true);
      let newImageUrls: string[] = [];
      if (editNewImageFiles.length > 0) {
        newImageUrls = await uploadImages(editNewImageFiles);
      }

      const allImages = [...editExistingImages, ...newImageUrls];

      const updatePayload: UpdateIncidentPayload = {
        ...editForm,
        photos: allImages,
      };

      await updateIncident(selectedIncident._id, updatePayload);
      showSnackbar("Incident updated successfully", "success");
      setIsEditModalOpen(false);
      resetEditForm();
      loadData();
    } catch (err) {
      const errorDisplay = getIncidentErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
    finally{
         setIsUploading(false);
    }
  };

  // Handle delete incident
  const handleDeleteIncident = async (incidentId: string) => {
    try {
        setIsUploading(true);
      await deleteIncident(incidentId);
      showSnackbar("Incident deleted successfully", "success");
      setIncidentToDelete(null);
      loadData();
    } catch (err) {
      const errorDisplay = getIncidentErrorDisplay(err);
      showSnackbar(errorDisplay.message, "error");
    }
    finally{
         setIsUploading(false);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({
      vehicle_id: "",
      reservation_id: "",
      reported_by: "",
      branch_id: "",
      type: "accident",
      severity: "minor",
      photos: [],
      description: "",
      occurred_at: new Date().toISOString().slice(0, 16),
      estimated_cost: undefined,
      final_cost: undefined,
      status: "open",
      chargeable_to_customer_amount: undefined,
      payment_id: "",
    });
    setImageFiles([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset edit form
  const resetEditForm = () => {
    setEditForm({});
    setEditExistingImages([]);
    setEditNewImageFiles([]);
    setEditNewImagePreviews([]);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Update edit form when incident is selected
  useEffect(() => {
    if (selectedIncident && isEditModalOpen) {
      setEditForm({
        vehicle_id: typeof selectedIncident.vehicle_id === 'string' ? selectedIncident.vehicle_id : selectedIncident.vehicle_id?._id,
        reservation_id: typeof selectedIncident.reservation_id === 'string' ? selectedIncident.reservation_id : selectedIncident.reservation_id?._id,
        type: selectedIncident.type,
        severity: selectedIncident.severity,
        description: selectedIncident.description,
        occurred_at: selectedIncident.occurred_at?.slice(0, 16),
        estimated_cost: selectedIncident.estimated_cost,
        final_cost: selectedIncident.final_cost,
        status: selectedIncident.status,
        chargeable_to_customer_amount: selectedIncident.chargeable_to_customer_amount,
        payment_id: selectedIncident.payment_id || undefined,
      });
      setEditExistingImages(selectedIncident.photos || []);
      setEditNewImageFiles([]);
      setEditNewImagePreviews([]);
    }
  }, [selectedIncident, isEditModalOpen]);

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get severity color
  const getSeverityColor = (severity?: IncidentSeverity) => {
    switch (severity) {
      case "minor": return "bg-green-100 text-green-800";
      case "major": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status color
  const getStatusColor = (status?: IncidentStatus) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "under_review": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "written_off": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };



  // Get vehicle display name
  const getVehicleDisplay = (incident: IVehicleIncident) => {
    if (typeof incident.vehicle_id !== 'string' && incident.vehicle_id) {
      return `${incident.vehicle_id.vin} - ${incident.vehicle_id.plate_number}`;
    }
    return incident.vehicle_id || "Unknown Vehicle";
  };

  // Get branch display name
  const getBranchDisplay = (incident: IVehicleIncident) => {
    if (typeof incident.branch_id !== 'string' && incident.branch_id) {
      return incident.branch_id.name;
    }
    return incident.branch_id || "Unknown Branch";
  };

  // Toggle incident expansion
  const toggleIncidentExpansion = (incidentId: string) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  // Remove image from create modal
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing image from edit modal
  const removeEditExistingImage = (index: number) => {
    setEditExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove new image from edit modal
  const removeEditNewImage = (index: number) => {
    setEditNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setEditNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Move image up in edit modal
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...editExistingImages];
    [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
    setEditExistingImages(newImages);
  };

  // Move image down in edit modal
  const moveImageDown = (index: number) => {
    if (index === editExistingImages.length - 1) return;
    const newImages = [...editExistingImages];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setEditExistingImages(newImages);
  };

  // Drag and drop functions
  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    const newImages = [...editExistingImages];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setEditExistingImages(newImages);
    setDraggedImageIndex(null);
  };

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const vehicleName = getVehicleDisplay(incident).toLowerCase();
      if (!vehicleName.includes(query) && !incident.description?.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filters.type && incident.type !== filters.type) return false;
    if (filters.severity && incident.severity !== filters.severity) return false;
    if (filters.status && incident.status !== filters.status) return false;
    if (filters.branch_id) {
      const branchId = typeof incident.branch_id === 'string' ? incident.branch_id : incident.branch_id?._id;
      if (branchId !== filters.branch_id) return false;
    }
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

    // Add this helper function in your component
    const formatDecimal = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value === 'object' && '$numberDecimal' in value) {
        return parseFloat(value.$numberDecimal);
    }
    return 0;
    };

    // For displaying formatted currency
    const formatCurrencyValue = (value: any): string => {
    const num = formatDecimal(value);
    return num.toFixed(2);
    };

  return (
    <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
      <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/manager-dashboard")}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Vehicle Incidents</h1>
                <p className="text-sm text-gray-600 mt-1">Manage vehicle incidents and damages</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">{filteredIncidents.length}</span> incident(s)
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Report Incident</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Search and Filters */}
          <div className="px-6 pt-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by vehicle or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

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

                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Types</option>
                        {INCIDENT_TYPES.map(type => (
                          <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                        value={filters.severity}
                        onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Severities</option>
                        {INCIDENT_SEVERITIES.map(severity => (
                          <option key={severity} value={severity}>{severity.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Statuses</option>
                        {INCIDENT_STATUSES.map(status => (
                          <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                      <select
                        value={filters.branch_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, branch_id: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="">All Branches</option>
                        {/* {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>{branch.name}</option>
                        ))} */}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setFilters({ type: "", severity: "", status: "", branch_id: "" })}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                  <p className="text-gray-600">Loading incidents...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Incidents Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery || Object.values(filters).some(v => v)
                    ? "No incidents match your search criteria. Try adjusting your filters."
                    : "No incidents have been reported yet. Create your first incident report to get started."}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Report First Incident
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident._id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Image Section */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                      {incident.photos && incident.photos.length > 0 ? (
                        <>
                          <img
                            src={incident.photos[0]}
                            alt="Incident"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                              {incident.severity?.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                              {incident.status?.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          {incident.photos.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              +{incident.photos.length - 1} more
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <AlertTriangle className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{getVehicleDisplay(incident)}</h3>
                          <p className="text-sm text-gray-600 capitalize">{incident.type?.replace('_', ' ')}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleIncidentExpansion(incident._id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={expandedIncident === incident._id ? "Show Less" : "Show More"}
                          >
                            {expandedIncident === incident._id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Incident"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIncidentToDelete(incident._id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Incident"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{incident.description}</p>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">{formatDate(incident.occurred_at)}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-gray-500">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs">${formatCurrencyValue(incident.estimated_cost)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedIncident === incident._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Branch:</span>
                              <span className="text-gray-700">{getBranchDisplay(incident)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Final Cost:</span>
                              <span className="text-gray-700">${formatCurrencyValue(incident.final_cost)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Customer Charge:</span>
                              <span className="text-gray-700">${formatCurrencyValue(incident.chargeable_to_customer_amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Reported:</span>
                              <span className="text-gray-700">{formatDate(incident.created_at)}</span>
                            </div>
                            {incident.photos && incident.photos.length > 1 && (
                              <div className="pt-2">
                                <p className="text-xs text-gray-500 mb-2">Additional Images:</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {incident.photos.slice(1, 4).map((img, index) => (
                                    <button
                                      key={index}
                                      onClick={() => openImageViewer(img)}
                                      className="flex-shrink-0 w-16 h-16 rounded border border-gray-300 overflow-hidden hover:opacity-90 transition-opacity"
                                    >
                                      <img
                                        src={img}
                                        alt={`Incident ${index + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Incident Modal - Centered */}
      {isViewModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Incident Details</h2>
                <p className="text-sm text-gray-600">Complete incident information</p>
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
                {/* Images Section */}
                <div className="lg:w-2/5">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                    {selectedIncident.photos && selectedIncident.photos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
                          <img
                            src={selectedIncident.photos[0]}
                            alt="Incident"
                            className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => openImageViewer(selectedIncident.photos![0])}
                          />
                          <button
                            onClick={() => openImageViewer(selectedIncident.photos![0])}
                            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            View Full Size
                          </button>
                        </div>
                        {selectedIncident.photos.length > 1 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">More Images</p>
                            <div className="grid grid-cols-4 gap-2">
                              {selectedIncident.photos.slice(1).map((img, index) => (
                                <button
                                  key={index}
                                  onClick={() => openImageViewer(img)}
                                  className="aspect-square rounded border border-gray-300 overflow-hidden hover:border-red-500 transition-colors"
                                >
                                  <img
                                    src={img}
                                    alt={`Incident ${index + 2}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <AlertTriangle className="w-16 h-16 mb-4" />
                        <p>No images available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="lg:w-3/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Incident Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Incident Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-gray-900 font-medium text-lg capitalize">{selectedIncident.type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Severity</p>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(selectedIncident.severity)}`}>
                            {selectedIncident.severity?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Status</p>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>
                            {selectedIncident.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Occurred At</p>
                          <p className="text-gray-900">{formatDate(selectedIncident.occurred_at)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Branch Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Location Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Vehicle</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Car className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900 font-medium">{getVehicleDisplay(selectedIncident)}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Branch</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{getBranchDisplay(selectedIncident)}</p>
                          </div>
                        </div>
                        {selectedIncident.reservation_id && (
                          <div>
                            <p className="text-xs text-gray-500">Reservation ID</p>
                            <p className="text-gray-900 font-mono text-sm">
                              {typeof selectedIncident.reservation_id === 'string' 
                                ? selectedIncident.reservation_id 
                                : selectedIncident.reservation_id?._id}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Financial Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Estimated Cost</p>
                          <p className="text-lg font-bold text-gray-900">${formatCurrencyValue(selectedIncident.estimated_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Final Cost</p>
                          <p className="text-gray-900">${formatCurrencyValue(selectedIncident.final_cost)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Chargeable to Customer</p>
                          <p className="text-gray-900">${formatCurrencyValue(selectedIncident.chargeable_to_customer_amount)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description - Full Width */}
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Description</h4>
                      <p className="text-gray-700">{selectedIncident.description}</p>
                    </div>

                    {/* Meta Information */}
                    <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Meta Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Incident ID</p>
                          <p className="text-xs font-mono text-gray-600">{selectedIncident._id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Reported By</p>
                          <p className="text-sm text-gray-900">{selectedIncident.reported_by}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Created At</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedIncident.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Last Updated</p>
                          <p className="text-sm text-gray-900">{formatDate(selectedIncident.updated_at)}</p>
                        </div>
                      </div>
                    </div>
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
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Edit Incident
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Incident Modal - Side Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-3xl">
              <div className="h-full bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Report New Incident</h2>
                    <p className="text-sm text-gray-600">Create a new vehicle incident report</p>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
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
                          Vehicle *
                        </label>
                        <select
                          value={createForm.vehicle_id}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Vehicle</option>
                          {vehicles.map(vehicle => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {vehicle.vin} - {vehicle.plate_number}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch *
                        </label>
                        <select
                          value={createForm.branch_id}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, branch_id: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select Branch</option>
                          {/* {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name}
                            </option>
                          ))} */}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Incident Type *
                        </label>
                        <select
                          value={createForm.type}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as IncidentType }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {INCIDENT_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severity *
                        </label>
                        <select
                          value={createForm.severity}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, severity: e.target.value as IncidentSeverity }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {INCIDENT_SEVERITIES.map(severity => (
                            <option key={severity} value={severity}>{severity.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={createForm.status}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as IncidentStatus }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          {INCIDENT_STATUSES.map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occurred At *
                        </label>
                        <input
                          type="datetime-local"
                          value={createForm.occurred_at}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, occurred_at: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          required
                        />
                      </div>

                     
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reservation ID (Optional)
                        </label>
                        <div className="relative" ref={reservationDropdownRef}>
                            <div
                            onClick={() => setIsReservationDropdownOpen(!isReservationDropdownOpen)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer bg-white flex items-center justify-between"
                            >
                            <span className={createForm.reservation_id ? "text-gray-900" : "text-gray-400"}>
                                {createForm.reservation_id 
                                ? filteredReservationsForDropdown.find((r: any) => r._id === createForm.reservation_id)?._id || "Select Reservation"
                                : "Select Reservation"}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isReservationDropdownOpen ? "rotate-180" : ""}`} />
                            </div>
                            
                            {isReservationDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                {/* Search Input */}
                                <div className="p-2 border-b border-gray-200">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                    type="text"
                                    placeholder="Search by ID or status..."
                                    value={reservationSearch}
                                    onChange={(e) => setReservationSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                </div>
                                
                                {/* Options List with Fixed Height */}
                                <div className="max-h-64 overflow-y-auto">
                                {filteredReservationsForDropdown.filter((reservation: any) => {
                                    const searchLower = reservationSearch.toLowerCase();
                                    return reservation._id.toLowerCase().includes(searchLower) ||
                                        (reservation.status && reservation.status.toLowerCase().includes(searchLower));
                                }).length > 0 ? (
                                    filteredReservationsForDropdown
                                    .filter((reservation: any) => {
                                        const searchLower = reservationSearch.toLowerCase();
                                        return reservation._id.toLowerCase().includes(searchLower) ||
                                            (reservation.status && reservation.status.toLowerCase().includes(searchLower));
                                    })
                                    .map((reservation: any) => (
                                        <div
                                        key={reservation._id}
                                        onClick={() => {
                                            setCreateForm(prev => ({ ...prev, reservation_id: reservation._id }));
                                            setIsReservationDropdownOpen(false);
                                            setReservationSearch("");
                                        }}
                                        className={`px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                                            createForm.reservation_id === reservation._id ? "bg-red-50 text-red-600" : "text-gray-700"
                                        }`}
                                        >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm">{reservation._id.slice(-8)}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                            reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                                            reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                            reservation.status === "active" ? "bg-blue-100 text-blue-800" :
                                            "bg-gray-100 text-gray-800"
                                            }`}>
                                            {reservation.status}
                                            </span>
                                        </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                                    No reservations found for your branch
                                    </div>
                                )}
                                </div>
                            </div>
                            )}
                        </div>
                        </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={createForm.description}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={4}
                        placeholder="Describe the incident in detail..."
                        required
                      />
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Financial Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Cost
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                         
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={createForm.estimated_cost || ''}
                            onChange={(e) => setCreateForm(prev => ({ 
                                ...prev, 
                                estimated_cost: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="0.00"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Final Cost
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                         
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={createForm.final_cost || ''}
                            onChange={(e) => setCreateForm(prev => ({ 
                                ...prev, 
                                final_cost: e.target.value ? parseFloat(e.target.value) : undefined 
                            }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="0.00"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chargeable to Customer
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          
                          <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={createForm.chargeable_to_customer_amount || ''}
                                onChange={(e) => setCreateForm(prev => ({ 
                                    ...prev, 
                                    chargeable_to_customer_amount: e.target.value ? parseFloat(e.target.value) : undefined 
                                }))}
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="0.00"
                                />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Incident Photos</h3>

                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
                      >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700 mb-2">Upload Incident Photos</p>
                        <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
                        <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                      </div>

                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Uploading images...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}

                      {imagePreviews.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-700">Selected Images ({imagePreviews.length})</p>
                            <button
                              type="button"
                              onClick={() => {
                                setImageFiles([]);
                                setImagePreviews([]);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg border border-gray-300 overflow-hidden">
                                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                                  {imageFiles[index]?.name || `Image ${index + 1}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                      onClick={handleCreateIncident}
                      disabled={!createForm.vehicle_id || !createForm.description || isUploading}
                      className="px-4 py-2.5  bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                     
                    >
                      
                       {isUploading ? (
                            <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Recording...</span>
                            </>
                        ) : (
                            <>
                            
                            <span>Record Incident</span>
                            </>
                        )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Incident Modal - Side Modal */}
     
{isEditModalOpen && selectedIncident && (
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
              <h2 className="text-xl font-bold text-gray-800">Edit Incident</h2>
              <p className="text-sm text-gray-600">Update incident information</p>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle *</label>
                  <select
                    value={editForm.vehicle_id || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.vin} - {vehicle.plate_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type *</label>
                  <select
                    value={editForm.type || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as IncidentType }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {INCIDENT_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity *</label>
                  <select
                    value={editForm.severity || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value as IncidentSeverity }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {INCIDENT_SEVERITIES.map(severity => (
                      <option key={severity} value={severity}>{severity.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm.status || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as IncidentStatus }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {INCIDENT_STATUSES.map(status => (
                      <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occurred At *</label>
                  <input
                    type="datetime-local"
                    value={editForm.occurred_at || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, occurred_at: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Reservation Dropdown for Edit Modal */}
            
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reservation ID (Optional)
                </label>
                <div className="relative" ref={editReservationDropdownRef}>
                    <div
                    onClick={() => setIsEditReservationDropdownOpen(!isEditReservationDropdownOpen)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent cursor-pointer bg-white flex items-center justify-between"
                    >
                    <span className={editForm.reservation_id ? "text-gray-900" : "text-gray-400"}>
                        {editForm.reservation_id 
                        ? filteredReservationsForDropdown.find((r: any) => r._id === editForm.reservation_id)?._id || "Select Reservation"
                        : "Select Reservation"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isEditReservationDropdownOpen ? "rotate-180" : ""}`} />
                    </div>
                    
                    {isEditReservationDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                            type="text"
                            placeholder="Search by ID or status..."
                            value={editReservationSearch}
                            onChange={(e) => setEditReservationSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        </div>
                        
                        {/* Options List with Fixed Height */}
                        <div className="max-h-64 overflow-y-auto">
                        {filteredReservationsForDropdown.filter((reservation: any) => {
                            const searchLower = editReservationSearch.toLowerCase();
                            return reservation._id.toLowerCase().includes(searchLower) ||
                                (reservation.status && reservation.status.toLowerCase().includes(searchLower));
                        }).length > 0 ? (
                            filteredReservationsForDropdown
                            .filter((reservation: any) => {
                                const searchLower = editReservationSearch.toLowerCase();
                                return reservation._id.toLowerCase().includes(searchLower) ||
                                    (reservation.status && reservation.status.toLowerCase().includes(searchLower));
                            })
                            .map((reservation: any) => (
                                <div
                                key={reservation._id}
                                onClick={() => {
                                    setEditForm(prev => ({ ...prev, reservation_id: reservation._id }));
                                    setIsEditReservationDropdownOpen(false);
                                    setEditReservationSearch("");
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors ${
                                    editForm.reservation_id === reservation._id ? "bg-red-50 text-red-600" : "text-gray-700"
                                }`}
                                >
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-sm">{reservation._id.slice(-8)} {reservation.code} {reservation.vehicle_id.plate_number}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                    reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                                    reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                    reservation.status === "active" ? "bg-blue-100 text-blue-800" :
                                    "bg-gray-100 text-gray-800"
                                    }`}>
                                    {reservation.status}
                                    </span>
                                </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-gray-500 text-sm">
                            No reservations found for your branch
                            </div>
                        )}
                        </div>
                    </div>
                    )}
                </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.estimated_cost || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, estimated_cost: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Final Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.final_cost || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, final_cost: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chargeable to Customer</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.chargeable_to_customer_amount || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, chargeable_to_customer_amount: e.target.value ? parseFloat(e.target.value) : undefined }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Management Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Incident Photos</h3>

              {editExistingImages.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Existing Images</p>
                  <div className="space-y-2">
                    {editExistingImages.map((img, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={() => handleDrop(index)}
                      >
                        <div className="flex-shrink-0">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move hover:text-gray-600" />
                        </div>
                        <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-300 overflow-hidden">
                          <img src={img} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Image {index + 1}</p>
                          <p className="text-xs text-gray-400 truncate">{img.substring(0, 50)}...</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveImageUp(index)}
                            disabled={index === 0}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveImageDown(index)}
                            disabled={index === editExistingImages.length - 1}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEditExistingImage(index)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileSelect}
                  multiple
                  className="hidden"
                />

                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to add more images</p>
                  <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Uploading images...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {editNewImagePreviews.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-700">New Images ({editNewImagePreviews.length})</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditNewImageFiles([]);
                          setEditNewImagePreviews([]);
                          if (editFileInputRef.current) editFileInputRef.current.value = '';
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {editNewImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg border border-gray-300 overflow-hidden">
                            <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditNewImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                            {editNewImageFiles[index]?.name || `New Image ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                onClick={handleUpdateIncident}
                disabled={!editForm.vehicle_id || !editForm.description || isUploading}
                className="px-4 py-2.5  bg-[#1EA2E4]  hover:bg-[#1A8BC9] text-white rounded-lg  transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                
                 {isUploading ? (
                    <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Updating...</span>
                    </>
                ) : (
                    <>
                  
                    <span>Save Changes</span>
                    </>
                )}
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
      {incidentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIncidentToDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Incident</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this incident report? All associated data and images will be permanently removed.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  disabled={isUploading}
                  onClick={() => setIncidentToDelete(null)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteIncident(incidentToDelete)}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                   {isUploading ? (
                        <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Deleting...</span>
                        </>
                    ) : (
                        <>
                     
                        <span>Delete Incident</span>
                        </>
                    )}
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

export default VehicleIncidents;