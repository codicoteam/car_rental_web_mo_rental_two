import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    createVehicleIncident,
    fetchAllVehicleIncidents,
    updateVehicleIncident,
    deleteVehicleIncident,
    getErrorDisplay,
    type IVehicleIncident,
    type CreateVehicleIncidentPayload,
    type UpdateVehicleIncidentPayload,
    type VehicleIncidentType,
    type VehicleIncidentSeverity,
    type VehicleIncidentStatus,
    type IVehicleIncidentVehicleRef,
    type IVehicleIncidentReservationRef,
    type IBranchRef,
} from "../../../Services/adminAndManager/vehicle_incident_manager";
import { fetchAllReservations,} from "../../../Services/adminAndManager/reservations_service";
import { fetchVehicleUnits,  } from "../../../Services/adminAndManager/vehicle_units_services";
import { fetchBranches } from "../../../Services/adminAndManager/admin_branch_service";
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
    Car,
    AlertTriangle,
    DollarSign,
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
    Shield,
    Wrench,
    User,
    Building,
    FileText,
    Clock,
    CheckSquare,
    
    Circle,
    DollarSign as DollarIcon,
    Car as CarIcon,
    UserCheck,
    Users,
    MapPin,
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

// Incident type options (from model)
const INCIDENT_TYPE_OPTIONS: { value: VehicleIncidentType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "accident", label: "Accident", icon: <Car className="w-4 h-4" />, color: "bg-red-100 text-red-800" },
    { value: "scratch", label: "Scratch/Dent", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-yellow-100 text-yellow-800" },
    { value: "tyre", label: "Tyre Damage", icon: <Circle className="w-4 h-4" />, color: "bg-orange-100 text-orange-800" },
    { value: "windshield", label: "Windshield", icon: <AlertTriangle className="w-4 h-4" />, color: "bg-blue-100 text-blue-800" },
    { value: "mechanical_issue", label: "Mechanical Issue", icon: <Wrench className="w-4 h-4" />, color: "bg-purple-100 text-purple-800" },
    { value: "other", label: "Other", icon: <AlertCircle className="w-4 h-4" />, color: "bg-gray-100 text-gray-800" },
];

// Severity options
const SEVERITY_OPTIONS: { value: VehicleIncidentSeverity; label: string; color: string }[] = [
    { value: "minor", label: "Minor", color: "bg-yellow-100 text-yellow-800" },
    { value: "major", label: "Major", color: "bg-red-100 text-red-800" },
];

// Status options
const STATUS_OPTIONS: { value: VehicleIncidentStatus; label: string; color: string }[] = [
    { value: "open", label: "Open", color: "bg-blue-100 text-blue-800" },
    { value: "under_review", label: "Under Review", color: "bg-purple-100 text-purple-800" },
    { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
    { value: "written_off", label: "Written Off", color: "bg-gray-100 text-gray-800" },
];

interface ReservationOption {
    _id: string;
    code: string;
    user_id?: { full_name?: string; email?: string } | string;
    vehicle_id?: { vin?: string; plate_number?: string } | string;
    status?: string;
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

interface VehicleOption {
    _id: string;
    vin: string;
    plate_number: string;
    vehicle_model_id?: { make?: string; model?: string; year?: number } | string;
    status: string;
}

const VehicleIncidentManagement: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [incidents, setIncidents] = useState<IVehicleIncident[]>([]);
    const [reservations, setReservations] = useState<ReservationOption[]>([]);
    const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [loadingVehicles, setLoadingVehicles] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

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

    // Form states
    const [createForm, setCreateForm] = useState<CreateVehicleIncidentPayload>({
        vehicle_id: "",
        reservation_id: "",
        reported_by: "",
        branch_id: "",
        type: "accident",
        severity: "minor",
        photos: [],
        description: "",
        occurred_at: new Date().toISOString(),
        estimated_cost: "",
        final_cost: "",
        status: "open",
        chargeable_to_customer_amount: "",
        payment_id: "",
    });

    const [editForm, setEditForm] = useState<UpdateVehicleIncidentPayload>({});

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
        type: "",
        severity: "",
        status: "",
        vehicle_id: "",
        reservation_id: "",
        branch_id: "",
        minCost: "",
        maxCost: "",
        startDate: "",
        endDate: "",
    });
    const [showFilters, setShowFilters] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ show: false, message: "", type: "info" });

    // Load incidents
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetchAllVehicleIncidents();
            setIncidents(response.data || []);
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            setError(errorDisplay.message || "Failed to load vehicle incidents");
            showSnackbar(errorDisplay.message, "error");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load reservations
    const loadReservations = async () => {
        try {
            setLoadingReservations(true);
            const response = await fetchAllReservations();
            setReservations(response.data || []);
        } catch (err) {
            console.error("Failed to load reservations:", err);
            showSnackbar("Failed to load reservations", "error");
        } finally {
            setLoadingReservations(false);
        }
    };

    // Load vehicles
    const loadVehicles = async () => {
        try {
            setLoadingVehicles(true);
            const response = await fetchVehicleUnits(1, 1000);
            setVehicles(response.data.items || []);
        } catch (err) {
            console.error("Failed to load vehicles:", err);
            showSnackbar("Failed to load vehicles", "error");
        } finally {
            setLoadingVehicles(false);
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
    useEffect(() => {
        loadData();
        loadReservations();
        loadVehicles();
        loadBranches();
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

    // Handle create incident
    const handleCreateIncident = async () => {
        try {
            // Validate required fields
            if (!createForm.vehicle_id || !createForm.type || !createForm.severity || !createForm.occurred_at) {
                showSnackbar("Please fill in all required fields (Vehicle, Type, Severity, Occurrence Date)", "error");
                return;
            }

            let photoUrls: string[] = [];

            // Upload photos if selected
            if (photoFiles.length > 0) {
                photoUrls = await uploadPhotos(photoFiles);
            }

            // Prepare payload - convert string numbers to actual numbers
            const payload: CreateVehicleIncidentPayload = {
                ...createForm,
                photos: photoUrls,
                estimated_cost: createForm.estimated_cost ? Number(createForm.estimated_cost) : undefined,
                final_cost: createForm.final_cost ? Number(createForm.final_cost) : undefined,
                chargeable_to_customer_amount: createForm.chargeable_to_customer_amount ? Number(createForm.chargeable_to_customer_amount) : undefined,
            };

            const newIncident = await createVehicleIncident(payload);
            showSnackbar("Vehicle incident created successfully", "success");
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

    // Handle update incident
    const handleUpdateIncident = async () => {
        if (!selectedIncident) return;

        try {
            let newPhotoUrls: string[] = [];

            // Upload new photos if selected
            if (editNewPhotoFiles.length > 0) {
                newPhotoUrls = await uploadPhotos(editNewPhotoFiles);
            }

            // Combine existing and new photos
            const allPhotos = [...editExistingPhotos, ...newPhotoUrls];

            // Prepare payload with number conversions
            const updatePayload: UpdateVehicleIncidentPayload = {
                ...editForm,
                photos: allPhotos,
                estimated_cost: editForm.estimated_cost ? Number(editForm.estimated_cost) : undefined,
                final_cost: editForm.final_cost ? Number(editForm.final_cost) : undefined,
                chargeable_to_customer_amount: editForm.chargeable_to_customer_amount ? Number(editForm.chargeable_to_customer_amount) : undefined,
            };

            await updateVehicleIncident(selectedIncident._id, updatePayload);
            showSnackbar("Vehicle incident updated successfully", "success");
            setIsEditModalOpen(false);
            resetEditForm();
            loadData();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle delete incident
    const handleDeleteIncident = async (incidentId: string) => {
        try {
            await deleteVehicleIncident(incidentId);
            showSnackbar("Vehicle incident deleted successfully", "success");
            setIncidentToDelete(null);
            loadData();
        } catch (err) {
            const errorDisplay = getErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
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
            occurred_at: new Date().toISOString(),
            estimated_cost: "",
            final_cost: "",
            status: "open",
            chargeable_to_customer_amount: "",
            payment_id: "",
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

    // Update edit form when incident is selected
    useEffect(() => {
        if (selectedIncident && isEditModalOpen) {
            setEditForm({
                vehicle_id: selectedIncident.vehicle_id,
                reservation_id: selectedIncident.reservation_id,
                reported_by: selectedIncident.reported_by,
                branch_id: selectedIncident.branch_id,
                type: selectedIncident.type,
                severity: selectedIncident.severity,
                description: selectedIncident.description,
                occurred_at: selectedIncident.occurred_at,
                estimated_cost: selectedIncident.estimated_cost,
                final_cost: selectedIncident.final_cost,
                status: selectedIncident.status,
                chargeable_to_customer_amount: selectedIncident.chargeable_to_customer_amount,
                payment_id: selectedIncident.payment_id,
            });
            // Set existing photos
            setEditExistingPhotos(selectedIncident.photos || []);
            // Reset new photos
            setEditNewPhotoFiles([]);
            setEditNewPhotoPreviews([]);
        }
    }, [selectedIncident, isEditModalOpen]);

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

    // Format currency
    const formatCurrency = (amount?: string | number | { $numberDecimal: string }) => {
        if (!amount) return "$0.00";
        
        let value = 0;
        if (typeof amount === 'object' && amount !== null && '$numberDecimal' in amount) {
            value = parseFloat((amount as any).$numberDecimal);
        } else if (typeof amount === 'string') {
            value = parseFloat(amount);
        } else if (typeof amount === 'number') {
            value = amount;
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    // Get incident type label
    const getIncidentTypeLabel = (type?: string) => {
        const option = INCIDENT_TYPE_OPTIONS.find(opt => opt.value === type);
        return option ? option.label : type || "Unknown";
    };

    // Get incident type color
    const getIncidentTypeColor = (type?: string) => {
        const option = INCIDENT_TYPE_OPTIONS.find(opt => opt.value === type);
        return option ? option.color : "bg-gray-100 text-gray-800";
    };

    // Get incident type icon
    const getIncidentTypeIcon = (type?: string) => {
        const option = INCIDENT_TYPE_OPTIONS.find(opt => opt.value === type);
        return option ? option.icon : <AlertCircle className="w-4 h-4" />;
    };

    // Get severity color
    const getSeverityColor = (severity?: string) => {
        const option = SEVERITY_OPTIONS.find(opt => opt.value === severity);
        return option ? option.color : "bg-gray-100 text-gray-800";
    };

    // Get status color
    const getStatusColor = (status?: string) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return option ? option.color : "bg-gray-100 text-gray-800";
    };

    // Get vehicle info
    const getVehicleInfo = (incident: IVehicleIncident) => {
        if (!incident.vehicle_id) return { vin: "N/A", plate: "N/A" };
        
        if (typeof incident.vehicle_id === 'object') {
            return {
                vin: (incident.vehicle_id as IVehicleIncidentVehicleRef).vin || "N/A",
                plate: (incident.vehicle_id as IVehicleIncidentVehicleRef).plate_number || "N/A",
            };
        }
        
        const vehicle = vehicles.find(v => v._id === incident.vehicle_id);
        return {
            vin: vehicle?.vin || "N/A",
            plate: vehicle?.plate_number || "N/A",
        };
    };

    // Get reservation info
    const getReservationInfo = (incident: IVehicleIncident) => {
        if (!incident.reservation_id) return { code: "N/A", user: "N/A" };
        
        if (typeof incident.reservation_id === 'object') {
            const reservation = incident.reservation_id as IVehicleIncidentReservationRef;
            return {
                code: reservation._id || "N/A",
                user: "N/A",
            };
        }
        
        const reservation = reservations.find(r => r._id === incident.reservation_id);
        if (!reservation) return { code: "N/A", user: "N/A" };
        
        let userName = "Unknown User";
        if (typeof reservation.user_id === 'object' && reservation.user_id?.full_name) {
            userName = reservation.user_id.full_name;
        }
        
        return {
            code: reservation.code || reservation._id.slice(-8),
            user: userName,
        };
    };

    // Get branch info
    const getBranchInfo = (incident: IVehicleIncident) => {
        if (!incident.branch_id) return { name: "N/A", city: "N/A" };
        
        if (typeof incident.branch_id === 'object') {
            const branch = incident.branch_id as IBranchRef;
            return {
                name: branch.name || "N/A",
                city: branch.address?.city || "N/A",
            };
        }
        
        const branch = branches.find(b => b._id === incident.branch_id);
        return {
            name: branch?.name || "N/A",
            city: branch?.address.city || "N/A",
        };
    };

    // Toggle incident expansion
    const toggleIncidentExpansion = (incidentId: string) => {
        setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
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

    // Filtered incidents
    const filteredIncidents = incidents.filter(incident => {
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const vehicleInfo = getVehicleInfo(incident);
            const reservationInfo = getReservationInfo(incident);
            
            if (
                !incident._id.toLowerCase().includes(query) &&
                !vehicleInfo.vin.toLowerCase().includes(query) &&
                !vehicleInfo.plate.toLowerCase().includes(query) &&
                !reservationInfo.code.toLowerCase().includes(query) &&
                !incident.description?.toLowerCase().includes(query)
            ) {
                return false;
            }
        }

        // Additional filters
        if (filters.type && incident.type !== filters.type) return false;
        if (filters.severity && incident.severity !== filters.severity) return false;
        if (filters.status && incident.status !== filters.status) return false;
        if (filters.vehicle_id && incident.vehicle_id !== filters.vehicle_id) {
            if (typeof incident.vehicle_id === 'object') {
                if ((incident.vehicle_id as any)._id !== filters.vehicle_id) return false;
            } else if (incident.vehicle_id !== filters.vehicle_id) return false;
        }
        if (filters.reservation_id && incident.reservation_id !== filters.reservation_id) {
            if (typeof incident.reservation_id === 'object') {
                if ((incident.reservation_id as any)._id !== filters.reservation_id) return false;
            } else if (incident.reservation_id !== filters.reservation_id) return false;
        }
        if (filters.branch_id && incident.branch_id !== filters.branch_id) {
            if (typeof incident.branch_id === 'object') {
                if ((incident.branch_id as any)._id !== filters.branch_id) return false;
            } else if (incident.branch_id !== filters.branch_id) return false;
        }
        
        // Cost filters
        const estimatedCost = typeof incident.estimated_cost === 'object' && incident.estimated_cost !== null && '$numberDecimal' in incident.estimated_cost
            ? parseFloat((incident.estimated_cost as any).$numberDecimal)
            : parseFloat(incident.estimated_cost as string) || 0;
            
        if (filters.minCost && estimatedCost < parseFloat(filters.minCost)) return false;
        if (filters.maxCost && estimatedCost > parseFloat(filters.maxCost)) return false;
        
        // Date filters
        if (filters.startDate) {
            const incidentDate = new Date(incident.occurred_at);
            const startDate = new Date(filters.startDate);
            if (incidentDate < startDate) return false;
        }
        
        if (filters.endDate) {
            const incidentDate = new Date(incident.occurred_at);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            if (incidentDate > endDate) return false;
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

    // Calculate statistics
    const calculateStats = () => {
        const total = filteredIncidents.length;
        const openCount = filteredIncidents.filter(i => i.status === 'open').length;
        const resolvedCount = filteredIncidents.filter(i => i.status === 'resolved').length;
        const totalCost = filteredIncidents.reduce((sum, incident) => {
            const cost = typeof incident.final_cost === 'object' && incident.final_cost !== null && '$numberDecimal' in incident.final_cost
                ? parseFloat((incident.final_cost as any).$numberDecimal)
                : parseFloat(incident.final_cost as string) || 0;
            return sum + cost;
        }, 0);
        
        return { total, openCount, resolvedCount, totalCost };
    };

    const stats = calculateStats();

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
                                <h1 className="text-2xl font-bold text-gray-800">Vehicle Incidents</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage all vehicle incidents and damage reports
                                </p>
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

                {/* Stats Overview */}
                <div className="px-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Incidents</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Open Incidents</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.openCount}</p>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Resolved</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.resolvedCount}</p>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                    <CheckSquare className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Cost</p>
                                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalCost)}</p>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-red-600" />
                                </div>
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
                                        placeholder="Search by VIN, plate, reservation code, or description..."
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
                                    loadReservations();
                                    loadVehicles();
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
                                            Type
                                        </label>
                                        <select
                                            value={filters.type}
                                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Types</option>
                                            {INCIDENT_TYPE_OPTIONS.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Severity
                                        </label>
                                        <select
                                            value={filters.severity}
                                            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Severity</option>
                                            {SEVERITY_OPTIONS.map(severity => (
                                                <option key={severity.value} value={severity.value}>{severity.label}</option>
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
                                            <option value="">All Status</option>
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle
                                        </label>
                                        <select
                                            value={filters.vehicle_id}
                                            onChange={(e) => setFilters(prev => ({ ...prev, vehicle_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Vehicles</option>
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle._id} value={vehicle._id}>
                                                    {vehicle.plate_number} ({vehicle.vin.slice(-6)})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Reservation
                                        </label>
                                        <select
                                            value={filters.reservation_id}
                                            onChange={(e) => setFilters(prev => ({ ...prev, reservation_id: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                        >
                                            <option value="">All Reservations</option>
                                            {reservations.map(reservation => (
                                                <option key={reservation._id} value={reservation._id}>
                                                    {reservation.code}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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

                                    {/* Date and Cost Filters (full width) */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Occurrence Date Range
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="date"
                                                value={filters.startDate}
                                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            />
                                            <input
                                                type="date"
                                                value={filters.endDate}
                                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estimated Cost Range ($)
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={filters.minCost}
                                                onChange={(e) => setFilters(prev => ({ ...prev, minCost: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder="Min"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={filters.maxCost}
                                                onChange={(e) => setFilters(prev => ({ ...prev, maxCost: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setFilters({
                                            type: "",
                                            severity: "",
                                            status: "",
                                            vehicle_id: "",
                                            reservation_id: "",
                                            branch_id: "",
                                            minCost: "",
                                            maxCost: "",
                                            startDate: "",
                                            endDate: "",
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
                                <p className="text-gray-600">Loading vehicle incidents...</p>
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
                    ) : filteredIncidents.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicle Incidents Found</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {searchQuery || Object.values(filters).some(v => v)
                                    ? "No incidents match your search criteria. Try adjusting your filters."
                                    : "No vehicle incidents have been reported yet."}
                            </p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Report First Incident
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredIncidents.map((incident) => {
                                const vehicleInfo = getVehicleInfo(incident);
                                const reservationInfo = getReservationInfo(incident);
                                const branchInfo = getBranchInfo(incident);
                                
                                return (
                                    <div
                                        key={incident._id}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Incident Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-2 ${getIncidentTypeColor(incident.type)}`}>
                                                            {getIncidentTypeIcon(incident.type)}
                                                            {getIncidentTypeLabel(incident.type)}
                                                        </span>
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                                                            {incident.severity}
                                                        </span>
                                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                                                            {incident.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700 text-sm">{incident.description || "No description provided"}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleIncidentExpansion(incident._id)}
                                                        className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
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
                                                        className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
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
                                        </div>

                                        {/* Incident Details */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                {/* Vehicle Info */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Car className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">Vehicle:</span>
                                                        <span className="text-gray-600">
                                                            {vehicleInfo.plate} ({vehicleInfo.vin.slice(-6)})
                                                        </span>
                                                    </div>
                                                    {incident.reservation_id && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <UserCheck className="w-4 h-4 text-gray-400" />
                                                            <span className="font-medium text-gray-700">Reservation:</span>
                                                            <span className="text-gray-600">{reservationInfo.code}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Costs */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">Estimated:</span>
                                                        <span className="text-gray-600">{formatCurrency(incident.estimated_cost)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <DollarIcon className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">Final:</span>
                                                        <span className="text-gray-600">{formatCurrency(incident.final_cost)}</span>
                                                    </div>
                                                </div>

                                                {/* Dates */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">Occurred:</span>
                                                        <span className="text-gray-600">{formatDate(incident.occurred_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="w-4 h-4 text-gray-400" />
                                                        <span className="font-medium text-gray-700">Reported:</span>
                                                        <span className="text-gray-600">{formatDate(incident.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Photos Preview */}
                                            {incident.photos && incident.photos.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700">Photos ({incident.photos.length})</span>
                                                    </div>
                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                        {incident.photos.slice(0, 4).map((img, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => openImageViewer(img)}
                                                                className="flex-shrink-0 w-20 h-20 rounded border border-gray-300 overflow-hidden hover:opacity-90 transition-opacity"
                                                            >
                                                                <img
                                                                    src={img}
                                                                    alt={`Incident photo ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expanded Details */}
                                            {expandedIncident === incident._id && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h4>
                                                            <div className="space-y-2 text-sm">
                                                                {incident.chargeable_to_customer_amount && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Customer Charge:</span>
                                                                        <span className="font-medium">{formatCurrency(incident.chargeable_to_customer_amount)}</span>
                                                                    </div>
                                                                )}
                                                                {branchInfo.name !== "N/A" && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Building className="w-4 h-4 text-gray-400" />
                                                                        <span className="text-gray-600">Branch:</span>
                                                                        <span>{branchInfo.name} ({branchInfo.city})</span>
                                                                    </div>
                                                                )}
                                                                {incident.payment_id && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Payment ID:</span>
                                                                        <span className="font-mono text-xs">{incident.payment_id}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Timestamps</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Incident ID:</span>
                                                                    <span className="font-mono text-xs">{incident._id.slice(-8)}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Last Updated:</span>
                                                                    <span>{incident.updated_at ? formatDate(incident.updated_at) : "N/A"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
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

            {/* View Incident Modal */}
            {isViewModalOpen && selectedIncident && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsViewModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Vehicle Incident Details</h2>
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
                                {/* Photos Section */}
                                <div className="lg:w-2/5">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                                        {selectedIncident.photos && selectedIncident.photos.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Main Photo */}
                                                <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
                                                    <img
                                                        src={selectedIncident.photos[0]}
                                                        alt="Incident photo"
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

                                                {/* Thumbnails */}
                                                {selectedIncident.photos.length > 1 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-2">More Photos</p>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {selectedIncident.photos.slice(1).map((img, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => openImageViewer(img)}
                                                                    className="aspect-square rounded border border-gray-300 overflow-hidden hover:border-[#1EA2E4] transition-colors"
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt={`Incident photo ${index + 2}`}
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
                                                <p>No photos available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Details Section */}
                                <div className="lg:w-3/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Incident Details */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Incident Details</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Type</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getIncidentTypeIcon(selectedIncident.type)}
                                                        <p className="text-gray-900 font-medium">{getIncidentTypeLabel(selectedIncident.type)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Severity</p>
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full mt-1 inline-block ${getSeverityColor(selectedIncident.severity)}`}>
                                                        {selectedIncident.severity}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Status</p>
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full mt-1 inline-block ${getStatusColor(selectedIncident.status)}`}>
                                                        {selectedIncident.status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Occurred At</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <p className="text-gray-900 font-medium">{formatDate(selectedIncident.occurred_at)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vehicle Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Vehicle Information</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500">Vehicle</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Car className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="text-gray-900 font-medium">{getVehicleInfo(selectedIncident).plate}</p>
                                                            <p className="text-sm text-gray-600">VIN: {getVehicleInfo(selectedIncident).vin}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedIncident.reservation_id && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Reservation</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <UserCheck className="w-4 h-4 text-gray-400" />
                                                            <div>
                                                                <p className="text-gray-900 font-medium">{getReservationInfo(selectedIncident).code}</p>
                                                                <p className="text-sm text-gray-600">Customer: {getReservationInfo(selectedIncident).user}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedIncident.branch_id && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Branch</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Building className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{getBranchInfo(selectedIncident).name}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cost Information */}
                                        <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Cost Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Estimated Cost</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <DollarSign className="w-4 h-4 text-gray-400" />
                                                        <p className="text-gray-900 font-medium text-lg">{formatCurrency(selectedIncident.estimated_cost)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Final Cost</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <DollarIcon className="w-4 h-4 text-gray-400" />
                                                        <p className="text-gray-900 font-medium text-lg">{formatCurrency(selectedIncident.final_cost)}</p>
                                                    </div>
                                                </div>
                                                {selectedIncident.chargeable_to_customer_amount && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Customer Charge</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium text-lg">{formatCurrency(selectedIncident.chargeable_to_customer_amount)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Description</h4>
                                            <p className="text-gray-700 text-sm bg-white p-3 rounded border border-gray-200 min-h-[100px]">
                                                {selectedIncident.description || "No description provided."}
                                            </p>
                                        </div>

                                        {/* Additional Information */}
                                        <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Additional Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500">Incident ID</p>
                                                    <p className="text-gray-900 font-mono text-sm">{selectedIncident._id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Created</p>
                                                    <p className="text-gray-900 font-medium">{formatDate(selectedIncident.created_at)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Last Updated</p>
                                                    <p className="text-gray-900 font-medium">{formatDate(selectedIncident.updated_at)}</p>
                                                </div>
                                                {selectedIncident.payment_id && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Payment ID</p>
                                                        <p className="text-gray-900 font-medium">{selectedIncident.payment_id}</p>
                                                    </div>
                                                )}
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
                                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                                >
                                    Edit Incident
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Incident Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsCreateModalOpen(false)}
                    />
                    <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="relative w-screen max-w-5xl">
                            <div className="h-full bg-white shadow-2xl overflow-y-auto">
                                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Report New Incident</h2>
                                        <p className="text-sm text-gray-600">Report a new vehicle incident</p>
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
                                                    value={createForm.vehicle_id as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingVehicles}
                                                    required
                                                >
                                                    <option value="">Select a vehicle</option>
                                                    {vehicles.map(vehicle => (
                                                        <option key={vehicle._id} value={vehicle._id}>
                                                            {vehicle.plate_number} ({vehicle.vin}) - {vehicle.status}
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingVehicles && (
                                                    <p className="text-xs text-gray-500 mt-1">Loading vehicles...</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Reservation (Optional)
                                                </label>
                                                <select
                                                    value={createForm.reservation_id as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, reservation_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingReservations}
                                                >
                                                    <option value="">Select a reservation (optional)</option>
                                                    {reservations.map(reservation => (
                                                        <option key={reservation._id} value={reservation._id}>
                                                            {reservation.code} - {typeof reservation.user_id === 'object'}
                                                        </option>
                                                    ))}
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
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, type: e.target.value as VehicleIncidentType }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                >
                                                    {INCIDENT_TYPE_OPTIONS.map(type => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Severity *
                                                </label>
                                                <select
                                                    value={createForm.severity}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, severity: e.target.value as VehicleIncidentSeverity }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                >
                                                    {SEVERITY_OPTIONS.map(severity => (
                                                        <option key={severity.value} value={severity.value}>{severity.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status *
                                                </label>
                                                <select
                                                    value={createForm.status}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, status: e.target.value as VehicleIncidentStatus }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {STATUS_OPTIONS.map(status => (
                                                        <option key={status.value} value={status.value}>{status.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Occurrence Date & Time *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={createForm.occurred_at ? new Date(createForm.occurred_at).toISOString().slice(0, 16) : ""}
                                                    onChange={(e) => setCreateForm(prev => ({ 
                                                        ...prev, 
                                                        occurred_at: new Date(e.target.value).toISOString() 
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch (Optional)
                                                </label>
                                                <select
                                                    value={createForm.branch_id as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, branch_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingBranches}
                                                >
                                                    <option value="">Select a branch (optional)</option>
                                                    {branches.map(branch => (
                                                        <option key={branch._id} value={branch._id}>
                                                            {branch.name} ({branch.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={createForm.description || ""}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                rows={4}
                                                placeholder="Describe the incident, damage, or issue..."
                                            />
                                        </div>
                                    </div>

                                    {/* Cost Information */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Cost Information</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Cost ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={createForm.estimated_cost as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Final Cost ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={createForm.final_cost as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, final_cost: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Customer Charge ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={createForm.chargeable_to_customer_amount as string}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, chargeable_to_customer_amount: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment ID (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={createForm.payment_id || ""}
                                                onChange={(e) => setCreateForm(prev => ({ ...prev, payment_id: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder="Payment reference ID"
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
                                                <p className="text-lg font-medium text-gray-700 mb-2">Upload Incident Photos</p>
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
                                            disabled={!createForm.vehicle_id || !createForm.type || !createForm.severity || !createForm.occurred_at || isUploading}
                                            className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? 'Uploading...' : 'Report Incident'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Incident Modal */}
            {isEditModalOpen && selectedIncident && (
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
                                        <h2 className="text-xl font-bold text-gray-800">Edit Vehicle Incident</h2>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Vehicle *
                                                </label>
                                                <select
                                                    value={editForm.vehicle_id as string || selectedIncident.vehicle_id as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingVehicles}
                                                    required
                                                >
                                                    {vehicles.map(vehicle => (
                                                        <option key={vehicle._id} value={vehicle._id}>
                                                            {vehicle.plate_number} ({vehicle.vin}) - {vehicle.status}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Reservation (Optional)
                                                </label>
                                                <select
                                                    value={editForm.reservation_id as string || selectedIncident.reservation_id as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, reservation_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingReservations}
                                                >
                                                    <option value="">No reservation</option>
                                                    {reservations.map(reservation => (
                                                        <option key={reservation._id} value={reservation._id}>
                                                            {reservation.code} - {typeof reservation.user_id === 'object' }
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Incident Type *
                                                </label>
                                                <select
                                                    value={editForm.type || selectedIncident.type}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as VehicleIncidentType }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                >
                                                    {INCIDENT_TYPE_OPTIONS.map(type => (
                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Severity *
                                                </label>
                                                <select
                                                    value={editForm.severity || selectedIncident.severity}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value as VehicleIncidentSeverity }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                >
                                                    {SEVERITY_OPTIONS.map(severity => (
                                                        <option key={severity.value} value={severity.value}>{severity.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Status *
                                                </label>
                                                <select
                                                    value={editForm.status || selectedIncident.status}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as VehicleIncidentStatus }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {STATUS_OPTIONS.map(status => (
                                                        <option key={status.value} value={status.value}>{status.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Occurrence Date & Time *
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    value={editForm.occurred_at ? new Date(editForm.occurred_at).toISOString().slice(0, 16) : new Date(selectedIncident.occurred_at).toISOString().slice(0, 16)}
                                                    onChange={(e) => setEditForm(prev => ({ 
                                                        ...prev, 
                                                        occurred_at: new Date(e.target.value).toISOString() 
                                                    }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Branch (Optional)
                                                </label>
                                                <select
                                                    value={editForm.branch_id as string || selectedIncident.branch_id as string}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, branch_id: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    disabled={loadingBranches}
                                                >
                                                    <option value="">No branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch._id} value={branch._id}>
                                                            {branch.name} ({branch.code})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={editForm.description || selectedIncident.description || ""}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                rows={4}
                                                placeholder="Describe the incident, damage, or issue..."
                                            />
                                        </div>
                                    </div>

                                    {/* Cost Information */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Cost Information</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Estimated Cost ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.estimated_cost || selectedIncident.estimated_cost || ""}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Final Cost ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.final_cost || selectedIncident.final_cost || ""}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, final_cost: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Customer Charge ($)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={editForm.chargeable_to_customer_amount || selectedIncident.chargeable_to_customer_amount || ""}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, chargeable_to_customer_amount: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment ID (Optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={editForm.payment_id || selectedIncident.payment_id || ""}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, payment_id: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder="Payment reference ID"
                                            />
                                        </div>
                                    </div>

                                    {/* Photo Management Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Photos</h3>

                                        {/* Existing Photos */}
                                        {editExistingPhotos.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-gray-700">Existing Photos</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {editExistingPhotos.map((img, index) => (
                                                        <div key={index} className="relative group">
                                                            <div className="aspect-square rounded-lg border border-gray-300 overflow-hidden">
                                                                <img
                                                                    src={img}
                                                                    alt={`Existing ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEditExistingPhoto(index)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
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
                                            disabled={!editForm.vehicle_id && !selectedIncident.vehicle_id || isUploading}
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
                                    <h3 className="text-lg font-bold text-gray-900">Delete Vehicle Incident</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this vehicle incident? All associated data and photos will be permanently removed.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIncidentToDelete(null)}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteIncident(incidentToDelete)}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete Incident
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

export default VehicleIncidentManagement;