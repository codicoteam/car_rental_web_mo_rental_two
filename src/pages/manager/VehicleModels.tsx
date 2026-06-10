import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    fetchVehicleModels,
    createVehicleModel,
    updateVehicleModel,
    deleteVehicleModel,
    getVehicleModelErrorDisplay,
    type IVehicleModel,
    type IVehicleModelsResponse,
    type CreateVehicleModelPayload,
    type UpdateVehicleModelPayload,

 } from "../../Services/adminAndManager/vehicle_model_service";
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
    Clock,
    MoreVertical,
    Car,
    Fuel,
    Cog,
    Users,
    DoorOpen,
    Calendar,
    ChevronDown,
    ChevronUp,
    Upload,
    Image as ImageIcon,
    Star,
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

// Vehicle class options
const VEHICLE_CLASSES = ["economy", "compact", "midsize", "suv", "luxury", "van", "truck"];

// Transmission options
const TRANSMISSION_TYPES = ["auto", "manual"];

// Fuel type options
const FUEL_TYPES = ["petrol", "diesel", "hybrid", "ev"];

// Feature options
const FEATURE_OPTIONS = [
    "Air Conditioning",
    "Bluetooth",
    "Navigation",
    "Sunroof",
    "Leather Seats",
    "Heated Seats",
    "Cooled Seats",
    "Keyless Entry",
    "Push Button Start",
    "Backup Camera",
    "Parking Sensors",
    "Adaptive Cruise Control",
    "Lane Keep Assist",
    "Blind Spot Monitoring",
    "Apple CarPlay",
    "Android Auto",
    "WiFi Hotspot",
    "Premium Sound System",
    "All-Wheel Drive",
    "Four-Wheel Drive",
];

const VehicleModels: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [vehicleModels, setVehicleModels] = useState<IVehicleModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modal states
    const [selectedModel, setSelectedModel] = useState<IVehicleModel | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modelToDelete, setModelToDelete] = useState<string | null>(null);
    const [expandedModel, setExpandedModel] = useState<string | null>(null);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
    const [imageZoom, setImageZoom] = useState(1);

    // Form states
    const [createForm, setCreateForm] = useState<CreateVehicleModelPayload>({
        make: "",
        model: "",
        year: new Date().getFullYear(),
        class: "compact",
        transmission: "automatic",
        fuel_type: "petrol",
        seats: 5,
        doors: 4,
        features: [],
        images: [],
    });

    const [editForm, setEditForm] = useState<UpdateVehicleModelPayload>({});

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

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({
        make: "",
        class: "",
        transmission: "",
        fuel_type: "",
        minYear: "",
        maxYear: "",
    });
    const [showFilters, setShowFilters] = useState(false);

    // Snackbar
    const [snackbar, setSnackbar] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "info";
    }>({ show: false, message: "", type: "info" });

    // Drag and drop states
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

    // Load vehicle models
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Load vehicle models
            const response: IVehicleModelsResponse = await fetchVehicleModels();
            setVehicleModels(response.data.items || []);
        } catch (err) {
            const errorDisplay = getVehicleModelErrorDisplay(err);
            setError(errorDisplay.message || "Failed to load vehicle models");
            showSnackbar(errorDisplay.message, "error");
        } finally {
            setLoading(false);
        }
    }, []);

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

    // Handle file selection for images (Create modal)
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
            setImageFiles(prev => [...prev, ...validFiles]);

            // Create previews
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
            setEditNewImageFiles(prev => [...prev, ...validFiles]);

            // Create previews
            validFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditNewImagePreviews(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    // Upload images (generic function)
    const uploadImages = async (files: File[]): Promise<string[]> => {
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
                    const imageUrl = await uploadFileToSupabase(file, "topics");
                    uploadedUrls.push(imageUrl);
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

    // Handle create vehicle model
    const handleCreateModel = async () => {
        try {
            // Validate required fields
            if (!createForm.make || !createForm.model || !createForm.year) {
                showSnackbar("Please fill in all required fields (Make, Model, Year)", "error");
                return;
            }

            let imageUrls: string[] = [];

            // Upload images if selected
            if (imageFiles.length > 0) {
                imageUrls = await uploadImages(imageFiles);
            }

            // Prepare payload
            const payload: CreateVehicleModelPayload = {
                ...createForm,
                images: imageUrls
            };

            const newModel = await createVehicleModel(payload);
            showSnackbar("Vehicle model created successfully", "success");
            setIsCreateModalOpen(false);
            resetCreateForm();
            setImageFiles([]);
            setImagePreviews([]);
            loadData();
        } catch (err) {
            const errorDisplay = getVehicleModelErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle update vehicle model
    const handleUpdateModel = async () => {
        if (!selectedModel) return;

        try {
            let newImageUrls: string[] = [];

            // Upload new images if selected
            if (editNewImageFiles.length > 0) {
                newImageUrls = await uploadImages(editNewImageFiles);
            }

            // Combine existing (after reordering and removal) and new images
            const allImages = [...editExistingImages, ...newImageUrls];

            // Prepare payload
            const updatePayload: UpdateVehicleModelPayload = {
                ...editForm,
                images: allImages
            };

            await updateVehicleModel(selectedModel._id, updatePayload);
            showSnackbar("Vehicle model updated successfully", "success");
            setIsEditModalOpen(false);
            resetEditForm();
            loadData();
        } catch (err) {
            const errorDisplay = getVehicleModelErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Handle delete vehicle model
    const handleDeleteModel = async (modelId: string) => {
        try {
            await deleteVehicleModel(modelId);
            showSnackbar("Vehicle model deleted successfully", "success");
            setModelToDelete(null);
            loadData();
        } catch (err) {
            const errorDisplay = getVehicleModelErrorDisplay(err);
            showSnackbar(errorDisplay.message, "error");
        }
    };

    // Reset create form
    const resetCreateForm = () => {
        setCreateForm({
            make: "",
            model: "",
            year: new Date().getFullYear(),
            class: "Compact",
            transmission: "Automatic",
            fuel_type: "Petrol",
            seats: 5,
            doors: 4,
            features: [],
            images: [],
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

    // Update edit form when model is selected
    useEffect(() => {
        if (selectedModel && isEditModalOpen) {
            setEditForm({
                make: selectedModel.make,
                model: selectedModel.model,
                year: selectedModel.year,
                class: selectedModel.class,
                transmission: selectedModel.transmission,
                fuel_type: selectedModel.fuel_type,
                seats: selectedModel.seats,
                doors: selectedModel.doors,
                features: selectedModel.features,
            });
            // Set existing images
            setEditExistingImages(selectedModel.images || []);
            // Reset new images
            setEditNewImageFiles([]);
            setEditNewImagePreviews([]);
        }
    }, [selectedModel, isEditModalOpen]);

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

    // Get vehicle class color
    const getClassColor = (vehicleClass?: string) => {
        switch (vehicleClass?.toLowerCase()) {
            case "economy": return "bg-green-100 text-green-800";
            case "compact": return "bg-blue-100 text-blue-800";
            case "luxury": return "bg-purple-100 text-purple-800";
            case "suv": return "bg-amber-100 text-amber-800";
            case "sports": return "bg-red-100 text-red-800";
            case "electric": return "bg-emerald-100 text-emerald-800";
            case "hybrid": return "bg-teal-100 text-teal-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    // Toggle model expansion
    const toggleModelExpansion = (modelId: string) => {
        setExpandedModel(expandedModel === modelId ? null : modelId);
    };

    // Remove image from create modal
    const removeImage = (index: number) => {
        if (index < imageFiles.length) {
            setImageFiles(prev => prev.filter((_, i) => i !== index));
        }
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

    // Toggle feature
    const toggleFeature = (feature: string, formType: 'create' | 'edit') => {
        if (formType === 'create') {
            setCreateForm(prev => ({
                ...prev,
                features: prev.features?.includes(feature)
                    ? prev.features.filter(f => f !== feature)
                    : [...(prev.features || []), feature]
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                features: (prev.features?.includes(feature))
                    ? prev.features.filter(f => f !== feature)
                    : [...(prev.features || []), feature]
            }));
        }
    };

    // Filtered vehicle models
    const filteredModels = vehicleModels.filter(model => {
        // Search query filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!model.make.toLowerCase().includes(query) &&
                !model.model.toLowerCase().includes(query) &&
                !model.class?.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Additional filters
        if (filters.make && model.make !== filters.make) return false;
        if (filters.class && model.class !== filters.class) return false;
        if (filters.transmission && model.transmission !== filters.transmission) return false;
        if (filters.fuel_type && model.fuel_type !== filters.fuel_type) return false;
        if (filters.minYear && model.year < parseInt(filters.minYear)) return false;
        if (filters.maxYear && model.year > parseInt(filters.maxYear)) return false;

        return true;
    });

    // Get unique makes for filter dropdown
    const uniqueMakes = Array.from(new Set(vehicleModels.map(model => model.make)));

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

    return (
        <div className="flex h-screen bg-gray-50 font-sans relative overflow-hidden">
            {/* Sidebar */}
            <ManagerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
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
                                onClick={() => navigate("/admin-dashboard")}
                                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Back to Dashboard"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Vehicle Models</h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Manage all vehicle models in the system
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                <span className="font-semibold">{filteredModels.length}</span> model(s)
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Add Model</span>
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
                                {/* Search */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search by make, model, or class..."
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
                                                Make
                                            </label>
                                            <select
                                                value={filters.make}
                                                onChange={(e) => setFilters(prev => ({ ...prev, make: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            >
                                                <option value="">All Makes</option>
                                                {uniqueMakes.map(make => (
                                                    <option key={make} value={make}>{make}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Class
                                            </label>
                                            <select
                                                value={filters.class}
                                                onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            >
                                                <option value="">All Classes</option>
                                                {VEHICLE_CLASSES.map(cls => (
                                                    <option key={cls} value={cls}>{cls}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Transmission
                                            </label>
                                            <select
                                                value={filters.transmission}
                                                onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            >
                                                <option value="">All Transmissions</option>
                                                {TRANSMISSION_TYPES.map(trans => (
                                                    <option key={trans} value={trans}>{trans}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Fuel Type
                                            </label>
                                            <select
                                                value={filters.fuel_type}
                                                onChange={(e) => setFilters(prev => ({ ...prev, fuel_type: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                            >
                                                <option value="">All Fuel Types</option>
                                                {FUEL_TYPES.map(fuel => (
                                                    <option key={fuel} value={fuel}>{fuel}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Min Year
                                            </label>
                                            <input
                                                type="number"
                                                min="2000"
                                                max={new Date().getFullYear() + 1}
                                                value={filters.minYear}
                                                onChange={(e) => setFilters(prev => ({ ...prev, minYear: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder="2000"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Max Year
                                            </label>
                                            <input
                                                type="number"
                                                min="2000"
                                                max={new Date().getFullYear() + 1}
                                                value={filters.maxYear}
                                                onChange={(e) => setFilters(prev => ({ ...prev, maxYear: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                placeholder={String(new Date().getFullYear() + 1)}
                                            />
                                        </div>
                                    </div>

                                    {/* Clear Filters Button */}
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            onClick={() => setFilters({
                                                make: "",
                                                class: "",
                                                transmission: "",
                                                fuel_type: "",
                                                minYear: "",
                                                maxYear: "",
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
                                    <p className="text-gray-600">Loading vehicle models...</p>
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
                        ) : filteredModels.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                    <Car className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Vehicle Models Found</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    {searchQuery || Object.values(filters).some(v => v)
                                        ? "No models match your search criteria. Try adjusting your filters."
                                        : "You haven't added any vehicle models yet. Create your first model to get started."}
                                </p>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add First Model
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredModels.map((model) => (
                                    <div
                                        key={model._id}
                                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        {/* Image Section */}
                                        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                                            {model.images && model.images.length > 0 ? (
                                                <>
                                                    <img
                                                        src={model.images[0]}
                                                        alt={`${model.make} ${model.model}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getClassColor(model.class)}`}>
                                                            {model.class || "N/A"}
                                                        </span>
                                                    </div>
                                                    {model.images.length > 1 && (
                                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                            +{model.images.length - 1} more
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
                                                    <h3 className="text-lg font-bold text-gray-800">{model.make} {model.model}</h3>
                                                    <p className="text-sm text-gray-600">{model.year}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleModelExpansion(model._id)}
                                                        className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                        title={expandedModel === model._id ? "Show Less" : "Show More"}
                                                    >
                                                        {expandedModel === model._id ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedModel(model);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit Model"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setModelToDelete(model._id)}
                                                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete Model"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-gray-500">
                                                        <Fuel className="w-3 h-3" />
                                                        <span className="text-xs">{model.fuel_type || "N/A"}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-gray-500">
                                                        <Cog className="w-3 h-3" />
                                                        <span className="text-xs">{model.transmission || "N/A"}</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-gray-500">
                                                        <Users className="w-3 h-3" />
                                                        <span className="text-xs">{model.seats || "N/A"} seats</span>
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="flex items-center justify-center gap-1 text-gray-500">
                                                        <DoorOpen className="w-3 h-3" />
                                                        <span className="text-xs">{model.doors || "N/A"} doors</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Preview */}
                                            {model.features && model.features.length > 0 && (
                                                <div className="mb-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {model.features.slice(0, 3).map((feature, index) => (
                                                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                {feature}
                                                            </span>
                                                        ))}
                                                        {model.features.length > 3 && (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                +{model.features.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expanded Details */}
                                            {expandedModel === model._id && (
                                                <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-200">
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">ID:</span>
                                                            <span className="font-mono text-xs text-gray-700">{model._id.slice(-8)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">Created:</span>
                                                            <span className="text-gray-700">{model.createdAt ? formatDate(model.createdAt) : "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-500">Updated:</span>
                                                            <span className="text-gray-700">{model.updatedAt ? formatDate(model.updatedAt) : "N/A"}</span>
                                                        </div>
                                                        {model.images && model.images.length > 0 && (
                                                            <div className="pt-2">
                                                                <p className="text-xs text-gray-500 mb-2">Images:</p>
                                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                                    {model.images.slice(0, 3).map((img, index) => (
                                                                        <button
                                                                            key={index}
                                                                            onClick={() => openImageViewer(img)}
                                                                            className="flex-shrink-0 w-16 h-16 rounded border border-gray-300 overflow-hidden hover:opacity-90 transition-opacity"
                                                                        >
                                                                            <img
                                                                                src={img}
                                                                                alt={`${model.make} ${model.model} - ${index + 1}`}
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

            {/* View Vehicle Model Modal - Centered */}
            {isViewModalOpen && selectedModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsViewModalOpen(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Vehicle Model Details</h2>
                                <p className="text-sm text-gray-600">Complete model information</p>
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
                                        {selectedModel.images && selectedModel.images.length > 0 ? (
                                            <div className="space-y-4">
                                                {/* Main Image */}
                                                <div className="relative h-64 rounded-lg overflow-hidden border border-gray-300">
                                                    <img
                                                        src={selectedModel.images[0]}
                                                        alt={`${selectedModel.make} ${selectedModel.model}`}
                                                        className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                                        onClick={() => openImageViewer(selectedModel.images![0])}
                                                    />
                                                    <button
                                                        onClick={() => openImageViewer(selectedModel.images![0])}
                                                        className="absolute bottom-2 right-2 bg-white/80 hover:bg-white px-2 py-1 rounded text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
                                                    >
                                                        <Maximize2 className="w-3 h-3" />
                                                        View Full Size
                                                    </button>
                                                </div>

                                                {/* Thumbnails */}
                                                {selectedModel.images.length > 1 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700 mb-2">More Images</p>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {selectedModel.images.slice(1).map((img, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => openImageViewer(img)}
                                                                    className="aspect-square rounded border border-gray-300 overflow-hidden hover:border-[#1EA2E4] transition-colors"
                                                                >
                                                                    <img
                                                                        src={img}
                                                                        alt={`${selectedModel.make} ${selectedModel.model} - ${index + 2}`}
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
                                                <p>No images available</p>
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
                                                    <p className="text-xs text-gray-500">Make</p>
                                                    <p className="text-gray-900 font-medium text-lg">{selectedModel.make}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Model</p>
                                                    <p className="text-gray-900 font-medium text-lg">{selectedModel.model}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Year</p>
                                                    <p className="text-gray-900 font-medium">{selectedModel.year}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Class</p>
                                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getClassColor(selectedModel.class)}`}>
                                                        {selectedModel.class || "N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Specifications */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Specifications</h4>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Transmission</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Cog className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedModel.transmission || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Fuel Type</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Fuel className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedModel.fuel_type || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Seats</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedModel.seats || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Doors</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <DoorOpen className="w-4 h-4 text-gray-400" />
                                                            <p className="text-gray-900 font-medium">{selectedModel.doors || "N/A"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Features - Full Width */}
                                        {selectedModel.features && selectedModel.features.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                                                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Features</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedModel.features.map((feature, index) => (
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
                                    Edit Model
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Vehicle Model Modal - Side Modal */}
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
                                        <h2 className="text-xl font-bold text-gray-800">Create New Vehicle Model</h2>
                                        <p className="text-sm text-gray-600">Add a new vehicle model to the system</p>
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
                                                    Make *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={createForm.make}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, make: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., Toyota"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={createForm.model}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, model: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    placeholder="e.g., Camry"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Year *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2000"
                                                    max={new Date().getFullYear() + 1}
                                                    value={createForm.year}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Class
                                                </label>
                                                <select
                                                    value={createForm.class}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, class: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {VEHICLE_CLASSES.map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fuel Type
                                                </label>
                                                <select
                                                    value={createForm.fuel_type}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, fuel_type: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {FUEL_TYPES.map(fuel => (
                                                        <option key={fuel} value={fuel}>{fuel}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Transmission
                                                </label>
                                                <select
                                                    value={createForm.transmission}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, transmission: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {TRANSMISSION_TYPES.map(trans => (
                                                        <option key={trans} value={trans}>{trans}</option>
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
                                                    value={createForm.seats}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Doors
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={createForm.doors}
                                                    onChange={(e) => setCreateForm(prev => ({ ...prev, doors: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Upload Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Images</h3>

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
                                                <p className="text-lg font-medium text-gray-700 mb-2">Upload Vehicle Images</p>
                                                <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
                                                <p className="text-xs text-gray-500 mt-2">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                                            </div>

                                            {/* Upload Progress */}
                                            {isUploading && (
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
                                            )}

                                            {/* Image Previews */}
                                            {imagePreviews.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            Selected Images ({imagePreviews.length})
                                                        </p>
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
                                                                    <img
                                                                        src={preview}
                                                                        alt={`Preview ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
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

                                    {/* Features Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Features</h3>
                                        <p className="text-sm text-gray-600">Select features available in this vehicle model</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                                            {FEATURE_OPTIONS.map(feature => (
                                                <div key={feature} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`feature-${feature}`}
                                                        checked={createForm.features?.includes(feature) || false}
                                                        onChange={() => toggleFeature(feature, 'create')}
                                                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`feature-${feature}`} className="ml-2 text-sm text-gray-700">
                                                        {feature}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {createForm.features && createForm.features.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600 mb-2">Selected Features ({createForm.features.length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {createForm.features.map(feature => (
                                                        <span
                                                            key={feature}
                                                            className="px-3 py-1 bg-[#1EA2E4]/10 text-[#1A8BC9] text-sm rounded-full flex items-center gap-1"
                                                        >
                                                            {feature}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleFeature(feature, 'create')}
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
                                            onClick={handleCreateModel}
                                            disabled={!createForm.make || !createForm.model || !createForm.year || isUploading}
                                            className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploading ? 'Uploading...' : 'Create Vehicle Model'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Vehicle Model Modal - Side Modal */}
            {isEditModalOpen && selectedModel && (
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
                                        <h2 className="text-xl font-bold text-gray-800">Edit Vehicle Model</h2>
                                        <p className="text-sm text-gray-600">Update model information</p>
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
                                                    Make *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.make || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, make: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.model || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Year *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2000"
                                                    max={new Date().getFullYear() + 1}
                                                    value={editForm.year || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Class
                                                </label>
                                                <select
                                                    value={editForm.class || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, class: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {VEHICLE_CLASSES.map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Fuel Type
                                                </label>
                                                <select
                                                    value={editForm.fuel_type || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, fuel_type: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {FUEL_TYPES.map(fuel => (
                                                        <option key={fuel} value={fuel}>{fuel}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Transmission
                                                </label>
                                                <select
                                                    value={editForm.transmission || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, transmission: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                >
                                                    {TRANSMISSION_TYPES.map(trans => (
                                                        <option key={trans} value={trans}>{trans}</option>
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
                                                    value={editForm.seats || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Doors
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={editForm.doors || ''}
                                                    onChange={(e) => setEditForm(prev => ({ ...prev, doors: parseInt(e.target.value) }))}
                                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Management Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Images</h3>

                                        {/* Existing Images with Reordering */}
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
                                                                <img
                                                                    src={img}
                                                                    alt={`Existing ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
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
                                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Move up"
                                                                >
                                                                    <ArrowUp className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => moveImageDown(index)}
                                                                    disabled={index === editExistingImages.length - 1}
                                                                    className="p-1.5 text-gray-600 hover:text-[#1EA2E4] hover:bg-[#1EA2E4]/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    title="Move down"
                                                                >
                                                                    <ArrowDown className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeEditExistingImage(index)}
                                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                                                    title="Remove image"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Image Upload */}
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
                                                <p className="text-sm text-gray-600">Click to add more images</p>
                                                <p className="text-xs text-gray-500 mt-1">Supports: JPG, PNG, WebP (Max 5MB per file)</p>
                                            </div>

                                            {/* Upload Progress */}
                                            {isUploading && (
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
                                            )}

                                            {/* New Image Previews */}
                                            {editNewImagePreviews.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            New Images ({editNewImagePreviews.length})
                                                        </p>
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
                                                                    <img
                                                                        src={preview}
                                                                        alt={`New ${index + 1}`}
                                                                        className="w-full h-full object-cover"
                                                                    />
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

                                    {/* Features Section */}
                                    <div className="space-y-4 pt-6 border-t border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-800">Features</h3>
                                        <p className="text-sm text-gray-600">Select features available in this vehicle model</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2">
                                            {FEATURE_OPTIONS.map(feature => (
                                                <div key={feature} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`edit-feature-${feature}`}
                                                        checked={(editForm.features || selectedModel.features || []).includes(feature)}
                                                        onChange={() => toggleFeature(feature, 'edit')}
                                                        className="h-4 w-4 text-[#1EA2E4] focus:ring-[#1EA2E4] border-gray-300 rounded"
                                                    />
                                                    <label htmlFor={`edit-feature-${feature}`} className="ml-2 text-sm text-gray-700">
                                                        {feature}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>

                                        {(editForm.features || selectedModel.features || []).length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600 mb-2">Selected Features ({(editForm.features || selectedModel.features || []).length}):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(editForm.features || selectedModel.features || []).map(feature => (
                                                        <span
                                                            key={feature}
                                                            className="px-3 py-1 bg-[#1EA2E4]/10 text-[#1A8BC9] text-sm rounded-full flex items-center gap-1"
                                                        >
                                                            {feature}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleFeature(feature, 'edit')}
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
                                            onClick={handleUpdateModel}
                                            disabled={!editForm.make || !editForm.model || !editForm.year || isUploading}
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
            {modelToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setModelToDelete(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Vehicle Model</h3>
                                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this vehicle model? All associated data and images will be permanently removed.
                            </p>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setModelToDelete(null)}
                                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteModel(modelToDelete)}
                                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Delete Model
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

export default VehicleModels;