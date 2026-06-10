import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    fetchVehicleUnits,
    createVehicleUnit,
    updateVehicleUnit,
    deleteVehicleUnit,
    getErrorDisplay,
    type IVehicleUnit,
    type IVehiclesResponse,
    type CreateVehiclePayload,
    type UpdateVehiclePayload,
    type VehicleStatus,
    type AvailabilityState,
      updateVehicleAvailability,
       recordVehicleService, 
       type RecordServicePayload
 } from "../../Services/adminAndManager/vehicle_units_services";
 import { fetchVehicleModels } from "../../Services/adminAndManager/vehicle_model_service";
 import { fetchBranches } from "../../Services/adminAndManager/admin_branch_service";
 import ManagerSidebar from "../../components/ManagerSideBar";
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
    Car,
    Fuel,
    Activity,
    Cog,
    Users,
    DoorOpen,
    MapPin,
    Hash,
    Palette,
    Gauge,
    Wrench,
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
    HardDrive,
    Settings,
    Shield,
    Layers,
    ArrowUp,
    ArrowDown,
    GripVertical,
    Database,
    Car as CarIcon,
    Building,
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
const STATUS_OPTIONS: VehicleStatus[] = ["active", "inactive", "pending"];
const AVAILABILITY_OPTIONS: AvailabilityState[] = ["available", "reserved", "rented", "out_of_service"];

// Color options
const COLOR_OPTIONS = [
    "Black", "White", "Silver", "Gray", "Red", "Blue", "Green", "Yellow",
    "Orange", "Purple", "Brown", "Beige", "Gold", "Navy", "Burgundy", "Teal"
];

// Metadata feature options
const METADATA_FEATURE_OPTIONS = [
    "GPS Tracking",
    "Bluetooth Audio",
    "Backup Camera",
    "Parking Sensors",
    "Sunroof",
    "Leather Seats",
    "Heated Seats",
    "Navigation System",
    "Keyless Entry",
    "Remote Start",
    "Apple CarPlay",
    "Android Auto",
    "Blind Spot Monitor",
    "Lane Departure Warning",
    "Adaptive Cruise Control",
    "Premium Sound System",
    "Third Row Seating",
    "Towing Package",
    "All-Wheel Drive",
    "Four-Wheel Drive",
];

interface VehicleModelOption {
    _id: string;
    make: string;
    model: string;
    year: number;
    class?: string;
}

interface BranchOption {
    _id: string;
    name: string;
    code: string;
    address: {
        city: string;
        country: string;
    };
}

const VehicleUnitMngmnt: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);
    const [vehicleModels, setVehicleModels] = useState<VehicleModelOption[]>([]);
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modal states
    const [selectedUnit, setSelectedUnit] = useState<IVehicleUnit | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
    const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
    const [imageZoom, setImageZoom] = useState(1);

    // Form states
    const [createForm, setCreateForm] = useState<CreateVehiclePayload>({
        vin: "",
        plate_number: "",
        vehicle_model_id: "",
        branch_id: "",
        odometer_km: 0,
        color: "",
        status: "active",
        availability_state: "available",
        photos: [],
        metadata: {
            gps_device_id: "",
            notes: "",
            seats: 5,
            doors: 4,
            features: [],
        },
    });

    const [editForm, setEditForm] = useState<UpdateVehiclePayload>({});

    // File upload states
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState(false);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit modal photo management
    const [editExistingPhotos, setEditExistingPhotos] = useState<string[]>([]);
    const [editNewPhotoFiles, setEditNewPhotoFiles] = useState<File[]>([]);
    const [editNewPhotoPreviews, setEditNewPhotoPreviews] = useState<string[]>([]);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        branch_id: "",
        status: "",
        availability_state: "",
        color: "",
        minOdometer: "",
        maxOdometer: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
const [selectedUnitForAction, setSelectedUnitForAction] = useState<IVehicleUnit | null>(null);
const [availabilityForm, setAvailabilityForm] = useState<{
  availability_state: AvailabilityState;
}>({
  availability_state: "available"
});
const [serviceForm, setServiceForm] = useState<{
  date: string;
  odometer_km: number;
}>({
  date: new Date().toISOString(),
  odometer_km: 0
});
const [serviceActionLoading, setServiceActionLoading] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ show: false, message: "", type: "info" });

    // Drag and drop states
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

       // Get user ID from localStorage
        const getLoggedInUserId = (): string | null => {
            try {
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    return user._id;
                }
                return null;
            } catch (error) {
                console.error('Error getting user from localStorage:', error);
                return null;
            }
        };

    // Load vehicle units
    const loadData = useCallback(async () => {
    try {
        setLoading(true);
        setError(null);

        // Get current user from localStorage using the correct key
        const authData = localStorage.getItem('car_rental_auth');
        console.log('Auth data from localStorage:', authData);
        
        if (!authData) {
            console.log('No auth data found');
            setVehicleUnits([]);
            setLoading(false);
            return;
        }
        
        const auth = JSON.parse(authData);
        const currentUserId = auth.user._id;
        console.log('Current User ID:', currentUserId);

        // Fetch all vehicle units
        const response: IVehiclesResponse = await fetchVehicleUnits(1, 100);
        const allUnits = response.data.items || [];
        console.log('Total vehicles:', allUnits.length);

        // Filter vehicles by branch manager ID
        const filteredUnits = allUnits.filter(unit => {
            if (unit.branch_id && typeof unit.branch_id === 'object') {
                const branchManagerId = (unit.branch_id as any).branchManager;
                console.log(`Vehicle ${unit.plate_number} - Branch Manager: ${branchManagerId}, Current User: ${currentUserId}, Match: ${branchManagerId === currentUserId}`);
                return branchManagerId === currentUserId;
            }
            return false;
        });

        console.log('Filtered vehicles count:', filteredUnits.length);
        setVehicleUnits(filteredUnits);
        
    } catch (err) {
        const errorDisplay = getErrorDisplay(err);
        console.error('Error loading vehicles:', err);
        setError(errorDisplay.message || "Failed to load vehicle units");
        showSnackbar(errorDisplay.message, "error");
    } finally {
        setLoading(false);
    }
}, []);

    // Load vehicle models
    const loadVehicleModels = async () => {
        try {
            setLoadingModels(true);
            const response = await fetchVehicleModels();
            setVehicleModels(response.data.items || []);
        } catch (err) {
            console.error("Failed to load vehicle models:", err);
            showSnackbar("Failed to load vehicle models", "error");
        } finally {
            setLoadingModels(false);
        }
    };

    // Load branches
    const loadBranches = async () => {
        try {
            setLoadingBranches(true);
            const response = await fetchBranches();
            setBranches(response.data || []);
        } catch (err) {
            console.error("Failed to load branches:", err);
            showSnackbar("Failed to load branches", "error");
        } finally {
            setLoadingBranches(false);
        }
    };

    // Initial load
    // useEffect(() => {
    //     loadData();
    //     loadVehicleModels();
    //     loadBranches();
    // }, []);

    useEffect(() => {
    const initialize = async () => {
        await loadBranches();
        await loadData();
        await loadVehicleModels();
    };
    initialize();
}, []);

    // Snackbar helper
    const showSnackbar = (message: string, type: "success" | "error" | "info") => {
        setSnackbar({ show: true, message, type });
        setTimeout(() => {
            setSnackbar(prev => ({ ...prev, show: false }));
        }, 3000);
    };

    // Handle file selection for photos (Create modal)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validFiles: File[] = [];

        files.forEach(file => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                showSnackbar(`Skipped ${file.name}: Not an image file`, 'error');
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showSnackbar(`Skipped ${file.name}: File size should be less than 5MB`, 'error');
                return;
            }

            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            setPhotoFiles(prev => [...prev, ...validFiles]);

            // Create previews
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPhotoPreviews(prev => [...prev, reader.result as string]);
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
            // Check file type
            if (!file.type.startsWith('image/')) {
                showSnackbar(`Skipped ${file.name}: Not an image file`, 'error');
                return;
            }

            // Check file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                showSnackbar(`Skipped ${file.name}: File size should be less than 5MB`, 'error');
                return;
            }

            validFiles.push(file);
        });

        if (validFiles.length > 0) {
            setEditNewPhotoFiles(prev => [...prev, ...validFiles]);

            // Create previews
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditNewPhotoPreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // Upload photos (generic function)
    const uploadPhotos = async (files: File[]): Promise<string[]> => {
        if (files.length === 0) return [];

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const uploadedUrls: string[] = [];
            const totalFiles = files.length;

            for (let i = 0; i < totalFiles; i++) {
                const file = files[i];

                // Update progress
                setUploadProgress(Math.round((i / totalFiles) * 100));

                try {
                    const photoUrl = await uploadFileToSupabase(file, "topics");
                    uploadedUrls.push(photoUrl);
                    showSnackbar(`Uploaded ${file.name}`, 'success');
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

    // Handle create vehicle unit
    const handleCreateUnit = async () => {
        try {
            // Validate required fields
            if (!createForm.vin || !createForm.plate_number || !createForm.vehicle_model_id || !createForm.branch_id) {
                showSnackbar("Please fill in all required fields (VIN, Plate Number, Vehicle Model, Branch)", "error");
                return;
            }

            let photoUrls: string[] = [];

            // Upload photos if selected
            if (photoFiles.length > 0) {
                photoUrls = await uploadPhotos(photoFiles);
            }

            // Prepare payload
            const payload: CreateVehiclePayload = {
                ...createForm,
                photos: photoUrls,
                metadata: createForm.metadata || {
                    seats: 5,
                    doors: 4,
                    features: [],
                },
            };

            const newUnit = await createVehicleUnit(payload);
            showSnackbar("Vehicle unit created successfully", "success");
            setIsCreateModalOpen(false);
            resetCreateForm();
            setPhotoFiles([]);
            setPhotoPreviews([]);
            loadData();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle update vehicle unit
    const handleUpdateUnit = async () => {
        if (!selectedUnit) return;

        try {
            let newPhotoUrls: string[] = [];

            // Upload new photos if selected
            if (editNewPhotoFiles.length > 0) {
                newPhotoUrls = await uploadPhotos(editNewPhotoFiles);
            }

            // Combine existing (after reordering and removal) and new photos
            const allPhotos = [...editExistingPhotos, ...newPhotoUrls];

            // Prepare payload with metadata
            const updatePayload: UpdateVehiclePayload = {
                ...editForm,
                photos: allPhotos,
                metadata: editForm.metadata || selectedUnit.metadata,
            };

            await updateVehicleUnit(selectedUnit._id, updatePayload);
            showSnackbar("Vehicle unit updated successfully", "success");
            setIsEditModalOpen(false);
            resetEditForm();
            loadData();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle delete vehicle unit
    const handleDeleteUnit = async (unitId: string) => {
        try {
            await deleteVehicleUnit(unitId);
            showSnackbar("Vehicle unit deleted successfully", "success");
            setUnitToDelete(null);
            loadData();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    const handleOpenAvailabilityModal = (unit: IVehicleUnit) => {
  setSelectedUnitForAction(unit);
  setAvailabilityForm({
    availability_state: unit.availability_state || "available"
  });
  setIsAvailabilityModalOpen(true);
};

const handleOpenServiceModal = (unit: IVehicleUnit) => {
  setSelectedUnitForAction(unit);
  setServiceForm({
    date: new Date().toISOString(),
    odometer_km: unit.odometer_km || 0
  });
  setIsServiceModalOpen(true);
};

const handleUpdateAvailability = async () => {
  if (!selectedUnitForAction) return;
  
  try {
    setServiceActionLoading(true);
    await updateVehicleAvailability(selectedUnitForAction._id, {
      availability_state: availabilityForm.availability_state
    });
    
    showSnackbar(`Vehicle availability updated to ${availabilityForm.availability_state}`, "success");
    setIsAvailabilityModalOpen(false);
    loadData();
  } catch (err) {
    const errorDisplay = getErrorDisplay(err);
    showSnackbar(errorDisplay.message, "error");
  } finally {
    setServiceActionLoading(false);
  }
};

const handleRecordService = async () => {
  if (!selectedUnitForAction) return;
  
  if (serviceForm.odometer_km < (selectedUnitForAction.odometer_km || 0)) {
    showSnackbar("Service odometer reading cannot be less than current odometer", "error");
    return;
  }
  
  try {
    setServiceActionLoading(true);
    await recordVehicleService(selectedUnitForAction._id, {
      date: serviceForm.date,
      odometer_km: serviceForm.odometer_km
    });
    
    showSnackbar("Service record added successfully", "success");
    setIsServiceModalOpen(false);
    loadData();
  } catch (err) {
    const errorDisplay = getErrorDisplay(err);
    showSnackbar(errorDisplay.message, "error");
  } finally {
    setServiceActionLoading(false);
  }
};

    // Reset create form
    const resetCreateForm = () => {
        setCreateForm({
            vin: "",
            plate_number: "",
            vehicle_model_id: "",
            branch_id: "",
            odometer_km: 0,
            color: "",
            status: "active",
            availability_state: "available",
            photos: [],
            metadata: {
                gps_device_id: "",
                notes: "",
                seats: 5,
                doors: 4,
                features: [],
            },
        });
        setPhotoFiles([]);
        setPhotoPreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Reset edit form
    const resetEditForm = () => {
        setEditForm({});
        setEditExistingPhotos([]);
        setEditNewPhotoFiles([]);
        setEditNewPhotoPreviews([]);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    // Update edit form when unit is selected
    useEffect(() => {
        if (selectedUnit && isEditModalOpen) {
            setEditForm({
                vin: selectedUnit.vin,
                plate_number: selectedUnit.plate_number,
                vehicle_model_id: typeof selectedUnit.vehicle_model_id === 'object' 
                    ? selectedUnit.vehicle_model_id._id 
                    : selectedUnit.vehicle_model_id,
                branch_id: typeof selectedUnit.branch_id === 'object'
                    ? selectedUnit.branch_id._id
                    : selectedUnit.branch_id,
                odometer_km: selectedUnit.odometer_km,
                color: selectedUnit.color,
                status: selectedUnit.status,
                availability_state: selectedUnit.availability_state,
                metadata: selectedUnit.metadata,
            });
            // Set existing photos
            setEditExistingPhotos(selectedUnit.photos || []);
            // Reset new photos
            setEditNewPhotoFiles([]);
            setEditNewPhotoPreviews([]);
        }
    }, [selectedUnit, isEditModalOpen]);

    // Format date
    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status color
    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "active": return "bg-green-100 text-green-800";
            case "inactive": return "bg-gray-100 text-gray-800";
            case "pending": return "bg-yellow-100 text-yellow-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Get availability color
    const getAvailabilityColor = (availability?: string) => {
        switch (availability?.toLowerCase()) {
            case "available": return "bg-green-100 text-green-800";
            case "reserved": return "bg-blue-100 text-blue-800";
            case "rented": return "bg-purple-100 text-purple-800";
            case "out_of_service": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Get vehicle model name
    const getVehicleModelName = (unit: IVehicleUnit) => {
        if (typeof unit.vehicle_model_id === 'object' && unit.vehicle_model_id !== null) {
            const model = unit.vehicle_model_id;
            return `${model.make} ${model.model} (${model.year})`;
        }
        const model = vehicleModels.find(m => m._id === unit.vehicle_model_id);
        return model ? `${model.make} ${model.model} (${model.year})` : "Unknown Model";
    };

    // Get branch name
    const getBranchName = (unit: IVehicleUnit) => {
        if (typeof unit.branch_id === 'object' && unit.branch_id !== null) {
            const branch = unit.branch_id;
            return `${branch.name} (${branch.code})`;
        }
        const branch = branches.find(b => b._id === unit.branch_id);
        return branch ? `${branch.name} (${branch.code})` : "Unknown Branch";
    };

    // Toggle unit expansion
    const toggleUnitExpansion = (unitId: string) => {
        setExpandedUnit(expandedUnit === unitId ? null : unitId);
    };

    // Remove photo from create modal
    const removePhoto = (index: number) => {
        if (index < photoFiles.length) {
            setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        }
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Remove existing photo from edit modal
    const removeEditExistingPhoto = (index: number) => {
        setEditExistingPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Remove new photo from edit modal
    const removeEditNewPhoto = (index: number) => {
        setEditNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setEditNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Move photo up in edit modal
    const movePhotoUp = (index: number) => {
        if (index === 0) return;
        const newPhotos = [...editExistingPhotos];
        [newPhotos[index], newPhotos[index - 1]] = [newPhotos[index - 1], newPhotos[index]];
        setEditExistingPhotos(newPhotos);
    };

    // Move photo down in edit modal
    const movePhotoDown = (index: number) => {
        if (index === editExistingPhotos.length - 1) return;
        const newPhotos = [...editExistingPhotos];
        [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
        setEditExistingPhotos(newPhotos);
    };

    // Drag and drop functions
    const handleDragStart = (index: number) => {
        setDraggedPhotoIndex(index);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (index: number) => {
        if (draggedPhotoIndex === null || draggedPhotoIndex === index) return;

        const newPhotos = [...editExistingPhotos];
        const draggedPhoto = newPhotos[draggedPhotoIndex];
        newPhotos.splice(draggedPhotoIndex, 1);
        newPhotos.splice(index, 0, draggedPhoto);
        setEditExistingPhotos(newPhotos);
        setDraggedPhotoIndex(null);
    };

    // Toggle metadata feature
    const toggleMetadataFeature = (feature: string, formType: 'create' | 'edit') => {
        if (formType === 'create') {
            setCreateForm(prev => ({
                ...prev,
                metadata: {
                    ...prev.metadata,
                    features: prev.metadata?.features?.includes(feature)
                        ? prev.metadata.features.filter(f => f !== feature)
                        : [...(prev.metadata?.features || []), feature]
                }
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                metadata: {
                    ...prev.metadata,
                    features: (prev.metadata?.features?.includes(feature))
                        ? prev.metadata.features.filter(f => f !== feature)
                        : [...(prev.metadata?.features || []), feature]
                }
            }));
        }
    };

    // Filtered vehicle units
    const filteredUnits = vehicleUnits.filter(unit => {
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
                !unit.vin.toLowerCase().includes(query) &&
                !unit.plate_number.toLowerCase().includes(query) &&
                !unit.color?.toLowerCase().includes(query) &&
                !getVehicleModelName(unit).toLowerCase().includes(query)
            ) {
                return false;
            }
        }

        // Additional filters
        if (filters.branch_id && 
            (typeof unit.branch_id === 'object' ? unit.branch_id._id : unit.branch_id) !== filters.branch_id) 
            return false;
        if (filters.status && unit.status !== filters.status) return false;
        if (filters.availability_state && unit.availability_state !== filters.availability_state) return false;
        if (filters.color && unit.color?.toLowerCase() !== filters.color.toLowerCase()) return false;
        if (filters.minOdometer && (unit.odometer_km || 0) < parseInt(filters.minOdometer)) return false;
        if (filters.maxOdometer && (unit.odometer_km || 0) > parseInt(filters.maxOdometer)) return false;

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

    // Format odometer
    const formatOdometer = (km?: number) => {
        if (!km && km !== 0) return "N/A";
        return `${km.toLocaleString()} km`;
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans relative">
            {/* Sidebar */}
            <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                                <h1 className="text-2xl font-bold text-gray-800">Vehicle Units</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage all vehicle units in the system
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <span className="font-semibold">{filteredUnits.length}</span> unit(s)
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Unit</span>
                            </button>
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
                                        placeholder="Search by VIN, plate, model, or color..."
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
                                onClick={() => {
                                    loadData();
                                    loadVehicleModels();
                                    loadBranches();
                                }}
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
                                            Branch
                                        </label>
                                        <select
                                            value={filters.branch_id}
                                            onChange={(e) => setFilters(prev => ({ ...prev, branch_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Branches</option>
                                            {branches.map(branch => (
                                                <option key={branch._id} value={branch._id}>
                                                    {branch.name} ({branch.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                                            value={filters.availability_state}
                                            onChange={(e) => setFilters(prev => ({ ...prev, availability_state: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Availability</option>
                                            {AVAILABILITY_OPTIONS.map(availability => (
                                                <option key={availability} value={availability}>{availability}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Color
                                        </label>
                                        <select
                                            value={filters.color}
                                            onChange={(e) => setFilters(prev => ({ ...prev, color: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Colors</option>
                                            {COLOR_OPTIONS.map(color => (
                                                <option key={color} value={color.toLowerCase()}>{color}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Min Odometer (km)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000000"
                                            value={filters.minOdometer}
                                            onChange={(e) => setFilters(prev => ({ ...prev, minOdometer: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            placeholder="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Odometer (km)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000000"
                                            value={filters.maxOdometer}
                                            onChange={(e) => setFilters(prev => ({ ...prev, maxOdometer: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            placeholder="1000000"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setFilters({
                                            branch_id: "",
                                            status: "",
                                            availability_state: "",
                                            color: "",
                                            minOdometer: "",
                                            maxOdometer: "",
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
                                <p className="text-gray-600">Loading vehicle units...</p>
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
                    ) : filteredUnits.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                <CarIcon className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicle Units Found</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {searchQuery || Object.values(filters).some(v => v)
                                    ? "No units match your search criteria. Try adjusting your filters."
                                    : "You haven't added any vehicle units yet. Create your first unit to get started."}
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add First Unit
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUnits.map((unit) => (
                                <div
                                    key={unit._id}
                                    className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {/* Image Section */}
                                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                                        {unit.photos && unit.photos.length > 0 ? (
                                            <>
                                                <img
                                                    src={unit.photos[0]}
                                                    alt={`${unit.vin} - ${unit.plate_number}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(unit.status)}`}>
                                                        {unit.status || "N/A"}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(unit.availability_state)}`}>
                                                        {unit.availability_state || "N/A"}
                                                    </span>
                                                </div>
                                                {unit.photos.length > 1 && (
                                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                        +{unit.photos.length - 1} more
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{unit.plate_number}</h3>
                                                <p className="text-sm text-gray-600">{unit.vin}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleUnitExpansion(unit._id)}
                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                    title={expandedUnit === unit._id ? "Show Less" : "Show More"}
                                                >
                                                    {expandedUnit === unit._id ? (
                                                        <ChevronUp className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUnit(unit);
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenAvailabilityModal(unit)}
                                                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Update Availability"
                                                    >
                                                    <Activity className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                    onClick={() => handleOpenServiceModal(unit)}
                                                    className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Record Service"
                                                    >
                                                    <Wrench className="w-4 h-4" />
                                                    </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUnit(unit);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Edit Unit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setUnitToDelete(unit._id)}
                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Unit"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Model and Branch */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Car className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-gray-700 font-medium">{getVehicleModelName(unit)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-gray-600">{getBranchName(unit)}</span>
                                            </div>
                                        </div>

                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-4 gap-2 mb-4">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500">
                                                    <Palette className="w-3 h-3" />
                                                    <span className="text-xs">{unit.color || "N/A"}</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500">
                                                    <Gauge className="w-3 h-3" />
                                                    <span className="text-xs">{formatOdometer(unit.odometer_km)}</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500">
                                                    <Users className="w-3 h-3" />
                                                    <span className="text-xs">{unit.metadata?.seats || "N/A"} seats</span>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-500">
                                                    <DoorOpen className="w-3 h-3" />
                                                    <span className="text-xs">{unit.metadata?.doors || "N/A"} doors</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features Preview */}
                                        {unit.metadata?.features && unit.metadata.features.length > 0 && (
                                            <div className="mb-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {unit.metadata.features.slice(0, 3).map((feature, index) => (
                                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            {feature}
                                                        </span>
                                                    ))}
                                                    {unit.metadata.features.length > 3 && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            +{unit.metadata.features.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expanded Details */}
                                        {expandedUnit === unit._id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">ID:</span>
                                                        <span className="font-mono text-xs text-gray-700">{unit._id.slice(-8)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">Created:</span>
                                                        <span className="text-gray-700">{unit.created_at ? formatDate(unit.created_at) : "N/A"}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">Updated:</span>
                                                        <span className="text-gray-700">{unit.updated_at ? formatDate(unit.updated_at) : "N/A"}</span>
                                                    </div>
                                                    {unit.last_service_at && (
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">Last Service:</span>
                                                            <span className="text-gray-700">{formatDate(unit.last_service_at)}</span>
                                                        </div>
                                                    )}
                                                    {unit.photos && unit.photos.length > 0 && (
                                                        <div className="pt-2">
                                                            <p className="text-xs text-gray-500 mb-2">Photos:</p>
                                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                                {unit.photos.slice(0, 3).map((img, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => openImageViewer(img)}
                                                                        className="flex-shrink-0 w-16 h-16 rounded border border-gray-300 overflow-hidden hover:opacity-90 transition-opacity"
                                                                    >
                                                                        <img
                                                                            src={img}
                                                                            alt={`${unit.plate_number} - ${index + 1}`}
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

            {/* View Vehicle Unit Modal - Centered */}
            {isViewModalOpen && selectedUnit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsViewModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Vehicle Unit Details</h2>
                                <p className="text-sm text-gray-600">Complete unit information</p>
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
                                {/* Photos Section */}
                                <div className="lg:w-2/5">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                                        {selectedUnit.photos && selectedUnit.photos.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Main Photo */}
                                                <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
                                                    <img
                                                        src={selectedUnit.photos[0]}
                                                        alt={`${selectedUnit.vin} - ${selectedUnit.plate_number}`}
                                                        className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => openImageViewer(selectedUnit.photos![0])}
                                                    />
                                                    <button
                                                        onClick={() => openImageViewer(selectedUnit.photos![0])}
                                                        className="absolute bottom-2 right-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                                                    >
                                                        <Maximize2 className="w-3 h-3" />
                                                        View Full Size
                                                    </button>
                                                </div>

                                                {/* Thumbnails */}
                                                {selectedUnit.photos.length > 1 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-2">More Photos</p>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {selectedUnit.photos.slice(1).map((img, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => openImageViewer(img)}
                                                                    className="aspect-square rounded border border-gray-300 overflow-hidden hover:border-[#1EA2E4] transition-colors"
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt={`${selectedUnit.vin} - ${selectedUnit.plate_number} - ${index + 2}`}
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
                                                <Car className="w-16 h-16 mb-4" />
                                                <p>No photos available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="lg:w-3/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Basic Info */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Basic Information</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">VIN</p>
                                                    <p className="text-gray-900 font-medium text-lg">{selectedUnit.vin}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Plate Number</p>
                                                    <p className="text-gray-900 font-medium text-lg">{selectedUnit.plate_number}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Color</p>
                                                    <p className="text-gray-900 font-medium">{selectedUnit.color || "N/A"}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Status</p>
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedUnit.status)}`}>
                                                            {selectedUnit.status || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Availability</p>
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getAvailabilityColor(selectedUnit.availability_state)}`}>
                                                            {selectedUnit.availability_state || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Specifications */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Specifications</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Vehicle Model</p>
                                                    <p className="text-gray-900 font-medium">{getVehicleModelName(selectedUnit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Branch</p>
                                                    <p className="text-gray-900 font-medium">{getBranchName(selectedUnit)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Odometer</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Gauge className="w-4 h-4 text-gray-400" />
                                                        <p className="text-gray-900 font-medium">{formatOdometer(selectedUnit.odometer_km)}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Seats</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedUnit.metadata?.seats || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Doors</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <DoorOpen className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedUnit.metadata?.doors || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Last Service */}
                                        {(selectedUnit.last_service_at || selectedUnit.last_service_odometer_km) && (
                                            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Last Service</h4>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {selectedUnit.last_service_at && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Date</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                                <p className="text-gray-900 font-medium">{formatDate(selectedUnit.last_service_at)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedUnit.last_service_odometer_km && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Odometer at Service</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Gauge className="w-4 h-4 text-gray-400" />
                                                                <p className="text-gray-900 font-medium">{selectedUnit.last_service_odometer_km.toLocaleString()} km</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Features - Full Width */}
                                        {selectedUnit.metadata?.features && selectedUnit.metadata.features.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Features</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedUnit.metadata.features.map((feature, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg flex items-center gap-2"
                                                        >
                                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                                            {feature}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Metadata */}
                                        {(selectedUnit.metadata?.gps_device_id || selectedUnit.metadata?.notes) && (
                                            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Additional Information</h4>
                                                <div className="space-y-3">
                                                    {selectedUnit.metadata?.gps_device_id && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">GPS Device ID</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Database className="w-4 h-4 text-gray-400" />
                                                                <p className="text-gray-900 font-medium">{selectedUnit.metadata.gps_device_id}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {selectedUnit.metadata?.notes && (
                                                        <div>
                                                            <p className="text-xs text-gray-500">Notes</p>
                                                            <p className="text-gray-700 text-sm mt-1 bg-white p-3 rounded border border-gray-200">
                                                                {selectedUnit.metadata.notes}
                                                            </p>
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
                                    Edit Unit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Vehicle Unit Modal - Side Modal (Wider) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsCreateModalOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="relative w-screen max-w-5xl"> {/* Changed from max-w-3xl to max-w-5xl */}
                            <div className="h-full bg-white shadow-2xl overflow-y-auto">
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Create New Vehicle Unit</h2>
                                        <p className="text-sm text-gray-600">Add a new vehicle unit to the system</p>
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
                                                    VIN *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={createForm.vin}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, vin: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., 1HGBH41JXMN109186"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Plate Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={createForm.plate_number}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, plate_number: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., ABC123"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Vehicle Model *
                                                </label>
                                                <select
                                                    value={createForm.vehicle_model_id}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, vehicle_model_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingModels}
                                                    required
                                                >
                                                    <option value="">Select a vehicle model</option>
                                                    {vehicleModels.map(model => (
                                                        <option key={model._id} value={model._id}>
                                                            {model.make} {model.model} ({model.year}) - {model.class}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingModels && (
                                                    <p className="text-xs text-gray-500 mt-1">Loading models...</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch *
                                                </label>
                                                <select
                                                    value={createForm.branch_id}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, branch_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingBranches}
                                                    required
                                                >
                                                    <option value="">Select a branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch._id} value={branch._id}>
                                                            {branch.name} ({branch.code}) - {branch.address.city}, {branch.address.country}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingBranches && (
                                                    <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Odometer (km)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1000000"
                                                    value={createForm.odometer_km}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, odometer_km: parseInt(e.target.value) || 0 }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Color
                                                </label>
                                                <select
                                                    value={createForm.color}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, color: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    <option value="">Select color</option>
                                                    {COLOR_OPTIONS.map(color => (
                                                        <option key={color} value={color.toLowerCase()}>{color}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Seats
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={createForm.metadata?.seats || 5}
                                                    onChange={(e) => setCreateForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            seats: parseInt(e.target.value) || 5
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status
                                                </label>
                                                <select
                                                    value={createForm.status}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as VehicleStatus }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {STATUS_OPTIONS.map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Availability
                                                </label>
                                                <select
                                                    value={createForm.availability_state}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, availability_state: e.target.value as AvailabilityState }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {AVAILABILITY_OPTIONS.map(availability => (
                                                        <option key={availability} value={availability}>{availability}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Doors
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={createForm.metadata?.doors || 4}
                                                    onChange={(e) => setCreateForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            doors: parseInt(e.target.value) || 4
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* GPS Device ID */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    GPS Device ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={createForm.metadata?.gps_device_id || ""}
                                                    onChange={(e) => setCreateForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            gps_device_id: e.target.value
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., GPS-123456"
                                                />
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Notes
                                            </label>
                                            <textarea
                                                value={createForm.metadata?.notes || ""}
                                                onChange={(e) => setCreateForm(prev => ({
                                                    ...prev,
                                                    metadata: {
                                                        ...prev.metadata,
                                                        notes: e.target.value
                                                    }
                                                }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                rows={3}
                                                placeholder="Additional notes about this vehicle unit..."
                                            />
                                        </div>
                                    </div>

                                    {/* Photo Upload Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Photos</h3>

                                        <div className="space-y-4">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                multiple
                                                className="hidden"
                                            />

                                            {/* Upload Area */}
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                                            >
                                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                <p className="text-lg font-medium text-gray-700 mb-2">Upload Vehicle Photos</p>
                                                <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
                                                <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                                            </div>

                                            {/* Upload Progress */}
                                            {isUploading && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm text-gray-600">
                                                        <span>Uploading photos...</span>
                                                        <span>{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#1EA2E4] transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Photo Previews */}
                                            {photoPreviews.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            Selected Photos ({photoPreviews.length})
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setPhotoFiles([]);
                                                                setPhotoPreviews([]);
                                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                                            }}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {photoPreviews.map((preview, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className="aspect-square rounded-lg border border-gray-300 overflow-hidden">
                                                                    <img
                                                                        src={preview}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removePhoto(index)}
                                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                                                                    {photoFiles[index]?.name || `Photo ${index + 1}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Features</h3>
                                        <p className="text-sm text-gray-600">Select features available in this vehicle unit</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                                            {METADATA_FEATURE_OPTIONS.map(feature => (
                                                <div key={feature} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`feature-${feature}`}
                                                        checked={createForm.metadata?.features?.includes(feature) || false}
                                                        onChange={() => toggleMetadataFeature(feature, 'create')}
                                                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-gray-700">
                                                        {feature}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {createForm.metadata?.features && createForm.metadata.features.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600 mb-2">Selected Features ({createForm.metadata.features.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {createForm.metadata.features.map(feature => (
                                                        <span
                                                            key={feature}
                                                            className="px-3 py-1 bg-[#1EA2E4]/10 text-[#1A8BC9] text-sm rounded-full flex items-center gap-1"
                                                        >
                                                            {feature}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMetadataFeature(feature, 'create')}
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
                                            onClick={handleCreateUnit}
                                            disabled={!createForm.vin || !createForm.plate_number || !createForm.vehicle_model_id || !createForm.branch_id || isUploading}
                                            className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? 'Uploading...' : 'Create Vehicle Unit'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Vehicle Unit Modal - Side Modal (Wider) */}
            {isEditModalOpen && selectedUnit && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsEditModalOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="relative w-screen max-w-5xl"> {/* Changed from max-w-3xl to max-w-5xl */}
                            <div className="h-full bg-white shadow-2xl overflow-y-auto">
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Edit Vehicle Unit</h2>
                                        <p className="text-sm text-gray-600">Update unit information</p>
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
                                                    VIN *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.vin || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, vin: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Plate Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.plate_number || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, plate_number: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Vehicle Model *
                                                </label>
                                                <select
                                                    value={editForm.vehicle_model_id || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, vehicle_model_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingModels}
                                                    required
                                                >
                                                    <option value="">Select a vehicle model</option>
                                                    {vehicleModels.map(model => (
                                                        <option key={model._id} value={model._id}>
                                                            {model.make} {model.model} ({model.year}) - {model.class}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch *
                                                </label>
                                                <select
                                                    value={editForm.branch_id || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, branch_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingBranches}
                                                    required
                                                >
                                                    <option value="">Select a branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch._id} value={branch._id}>
                                                            {branch.name} ({branch.code}) - {branch.address.city}, {branch.address.country}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Odometer (km)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="1000000"
                                                    value={editForm.odometer_km || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, odometer_km: parseInt(e.target.value) || 0 }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Color
                                                </label>
                                                <select
                                                    value={editForm.color || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    <option value="">Select color</option>
                                                    {COLOR_OPTIONS.map(color => (
                                                        <option key={color} value={color.toLowerCase()}>{color}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Seats
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={editForm.metadata?.seats || selectedUnit.metadata?.seats || 5}
                                                    onChange={(e) => setEditForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            seats: parseInt(e.target.value) || 5
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status
                                                </label>
                                                <select
                                                    value={editForm.status || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as VehicleStatus }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {STATUS_OPTIONS.map(status => (
                                                        <option key={status} value={status}>{status}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Availability
                                                </label>
                                                <select
                                                    value={editForm.availability_state || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, availability_state: e.target.value as AvailabilityState }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {AVAILABILITY_OPTIONS.map(availability => (
                                                        <option key={availability} value={availability}>{availability}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Doors
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={editForm.metadata?.doors || selectedUnit.metadata?.doors || 4}
                                                    onChange={(e) => setEditForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            doors: parseInt(e.target.value) || 4
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* GPS Device ID */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    GPS Device ID
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.metadata?.gps_device_id || selectedUnit.metadata?.gps_device_id || ''}
                                                    onChange={(e) => setEditForm(prev => ({
                                                        ...prev,
                                                        metadata: {
                                                            ...prev.metadata,
                                                            gps_device_id: e.target.value
                                                        }
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., GPS-123456"
                                                />
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Notes
                                            </label>
                                            <textarea
                                                value={editForm.metadata?.notes || selectedUnit.metadata?.notes || ''}
                                                onChange={(e) => setEditForm(prev => ({
                                                    ...prev,
                                                    metadata: {
                                                        ...prev.metadata,
                                                        notes: e.target.value
                                                    }
                                                }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                rows={3}
                                                placeholder="Additional notes about this vehicle unit..."
                                            />
                                        </div>
                                    </div>

                                    {/* Photo Management Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Photos</h3>

                                        {/* Existing Photos with Reordering */}
                                        {editExistingPhotos.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-gray-700">Existing Photos</p>
                                                <div className="space-y-2">
                                                    {editExistingPhotos.map((img, index) => (
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
                                                                <img
                                                                    src={img}
                                                                    alt={`Existing ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-600">Photo {index + 1}</p>
                                                                <p className="text-xs text-gray-400 truncate">{img.substring(0, 50)}...</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => movePhotoUp(index)}
                                                                    disabled={index === 0}
                                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Move up"
                                                                >
                                                                    <ArrowUp className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => movePhotoDown(index)}
                                                                    disabled={index === editExistingPhotos.length - 1}
                                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Move down"
                                                                >
                                                                    <ArrowDown className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeEditExistingPhoto(index)}
                                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                                                    title="Remove photo"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Photo Upload */}
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
                                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#1EA2E4] transition-colors"
                                            >
                                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-sm text-gray-600">Click to add more photos</p>
                                                <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                                            </div>

                                            {/* Upload Progress */}
                                            {isUploading && (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm text-gray-600">
                                                        <span>Uploading photos...</span>
                                                        <span>{uploadProgress}%</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#1EA2E4] transition-all duration-300"
                                                            style={{ width: `${uploadProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Photo Previews */}
                                            {editNewPhotoPreviews.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            New Photos ({editNewPhotoPreviews.length})
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditNewPhotoFiles([]);
                                                                setEditNewPhotoPreviews([]);
                                                                if (editFileInputRef.current) editFileInputRef.current.value = '';
                                                            }}
                                                            className="text-sm text-red-600 hover:text-red-800"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {editNewPhotoPreviews.map((preview, index) => (
                                                            <div key={index} className="relative group">
                                                                <div className="aspect-square rounded-lg border border-gray-300 overflow-hidden">
                                                                    <img
                                                                        src={preview}
                                                                        alt={`New ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeEditNewPhoto(index)}
                                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                                                                    {editNewPhotoFiles[index]?.name || `New Photo ${index + 1}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Features</h3>
                                        <p className="text-sm text-gray-600">Select features available in this vehicle unit</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                                            {METADATA_FEATURE_OPTIONS.map(feature => (
                                                <div key={feature} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`edit-feature-${feature}`}
                                                        checked={(editForm.metadata?.features || selectedUnit.metadata?.features || []).includes(feature)}
                                                        onChange={() => toggleMetadataFeature(feature, 'edit')}
                                                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`edit-feature-${feature}`} className="ml-2 text-sm text-gray-700">
                                                        {feature}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {(editForm.metadata?.features || selectedUnit.metadata?.features || []).length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600 mb-2">Selected Features ({(editForm.metadata?.features || selectedUnit.metadata?.features || []).length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(editForm.metadata?.features || selectedUnit.metadata?.features || []).map(feature => (
                                                        <span
                                                            key={feature}
                                                            className="px-3 py-1 bg-[#1EA2E4]/10 text-[#1A8BC9] text-sm rounded-full flex items-center gap-1"
                                                        >
                                                            {feature}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleMetadataFeature(feature, 'edit')}
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
                                            onClick={handleUpdateUnit}
                                            disabled={!editForm.vin || !editForm.plate_number || !editForm.vehicle_model_id || !editForm.branch_id || isUploading}
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
            {/* Update Availability Modal */}
{isAvailabilityModalOpen && selectedUnitForAction && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAvailabilityModalOpen(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Update Availability</h3>
            <p className="text-sm text-gray-600">{selectedUnitForAction.plate_number}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Availability State</label>
          <select
            value={availabilityForm.availability_state}
            onChange={(e) => setAvailabilityForm({ availability_state: e.target.value as AvailabilityState })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
          >
            {AVAILABILITY_OPTIONS.map(option => (
              <option key={option} value={option}>{option.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setIsAvailabilityModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleUpdateAvailability} disabled={serviceActionLoading} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] disabled:opacity-50">
            {serviceActionLoading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Record Service Modal */}
{isServiceModalOpen && selectedUnitForAction && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsServiceModalOpen(false)} />
    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
            <Wrench className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Record Service</h3>
            <p className="text-sm text-gray-600">{selectedUnitForAction.plate_number}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Date</label>
            <input
              type="datetime-local"
              value={serviceForm.date.slice(0, 16)}
              onChange={(e) => setServiceForm({ ...serviceForm, date: new Date(e.target.value).toISOString() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Odometer (km)</label>
            <input
              type="number"
              value={serviceForm.odometer_km}
              onChange={(e) => setServiceForm({ ...serviceForm, odometer_km: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]"
            />
            <p className="text-xs text-gray-500 mt-1">Current: {formatOdometer(selectedUnitForAction.odometer_km)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleRecordService} disabled={serviceActionLoading} className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] disabled:opacity-50">
            {serviceActionLoading ? 'Recording...' : 'Record Service'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

            {/* Delete Confirmation Modal */}
            {unitToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setUnitToDelete(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Vehicle Unit</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this vehicle unit? All associated data and photos will be permanently removed.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setUnitToDelete(null)}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteUnit(unitToDelete)}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete Unit
                                </button>
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

export default VehicleUnitMngmnt;