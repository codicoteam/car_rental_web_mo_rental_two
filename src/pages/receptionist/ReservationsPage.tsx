// src/pages/AdminReservationsPage.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { fetchReservations , removeReservation , updateStatus } from "../../features/reservation/reservationthunks";
import { reservationsService } from "../../Services/reservations_service";
import ReceptionistSideBar from "../../components/ReceptionistSideBar";
import {
  createReservation,
  type CreateReservationPayload,
} from "../../Services/adminAndManager/reservations_service";
import {
  fetchBranches,
  type IBranch,
} from "../../Services/adminAndManager/admin_branch_service";
import {
  fetchVehicleUnits,
  type IVehicleUnit,
  type IVehicleModelSummary,
  type IBranchSummary,
} from "../../Services/adminAndManager/vehicle_units_services";
import {
  fetchAllUsers,
  fetchProfilesByUserId,
  type IUser,
} from "../../Services/adminAndManager/admi_users_service";
import {
  Search,
  Eye,
  Plus,
  Filter,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Calendar,
  Clock,
  Car,
  RefreshCw,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Hash,
  Tag,
  Gauge,
  AlertTriangle,
  Building,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2  
} from "lucide-react";

// Types based on your API response
interface Reservation {
  _id: string;
  code: string;
  status: string;
  created_at: string;
  pickup: {
    branch_id: {
      _id?: string;
      name: string;
      address?: {
        city?: string;
      };
    };
    at: string;
  };
  dropoff: {
    branch_id: {
      _id?: string;
      name: string;
      address?: {
        city?: string;
      };
    };
    at: string;
  };
  driver_snapshot: {
    full_name: string;
    phone: string;
    email: string;
    driver_license: {
      number: string;
      class: string;
      expires_at: string;
      verified: boolean;
    };
  };
  vehicle_id: {
    plate_number: string;
    vin: string;
    color: string;
    odometer_km: number;
    photos: string[];
    metadata?: {
      seats?: number;
      doors?: number;
      features?: string[];
    };
  };
  vehicle_model_id: {
    make: string;
    model: string;
    year: number;
    class: string;
  };
  pricing: {
    currency: string;
    grand_total: { $numberDecimal: string };
    breakdown: Array<{ label: string; quantity: number; total: { $numberDecimal: string } }>;
  };
  payment_summary: {
    status: string;
    paid_total: { $numberDecimal: string };
    outstanding: { $numberDecimal: string };
  };
}

interface TransformedReservation {
  id: string;
  code: string;
  customer: string;
  email: string;
  phone: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
  vehicleClass: string;
  plateNumber: string;
  vin: string;
  color: string;
  odometer: string;
  photos: string[];
  startDate: string;
  endDate: string;
  startDateTime: string;
  endDateTime: string;
  startFormatted: string;
  endFormatted: string;
  status: string;
  rawStatus: string;
  totalAmount: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupBranchId: string;
  dropoffBranchId: string;
  duration: number;
  createdDate: string;
  paymentStatus: string;
  paidAmount: string;
  outstandingAmount: string;
  seats: number;
  doors: number;
  features: string[];
  licenseClass: string;
  licenseNumber: string;
  licenseVerified: boolean;
  pricingBreakdown: Array<{ label: string; quantity: number; total: { $numberDecimal: string } }>;
}

const ReservationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const apiResponse = useSelector(
    (state: any) => state.reservations.reservations
  );

  const reservations: Reservation[] = apiResponse?.data || [];

  const loading = useSelector(
    (state: any) => state.reservations?.isLoading
  );

  const error = useSelector(
    (state: any) => state.reservations?.error
  );
  
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatusReservation, setSelectedStatusReservation] = useState<Reservation | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedReservationForEdit, setSelectedReservationForEdit] = useState<Reservation | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isUpdatingReservation, setIsUpdatingReservation] = useState(false);

  // ── Create Reservation panel ──────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelStep, setPanelStep] = useState(1);
  const [panelSubmitting, setPanelSubmitting] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [branches, setBranches] = useState<IBranch[]>([]);
  const [vehicleUnits, setVehicleUnits] = useState<IVehicleUnit[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userDropOpen, setUserDropOpen] = useState(false);
  const userDropRef = useRef<HTMLDivElement>(null);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [licNumber, setLicNumber] = useState("");
  const [licClass, setLicClass] = useState("");
  const [licCountry, setLicCountry] = useState("ZW");
  const [licExpiry, setLicExpiry] = useState("");
  const [licVerified, setLicVerified] = useState(false);
  // Customer profile state for registered customer flow
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [proceedWithoutProfile, setProceedWithoutProfile] = useState(false);
  const [pickupBranchId, setPickupBranchId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [dropoffBranchId, setDropoffBranchId] = useState("");
  const [pickupAt, setPickupAt] = useState("");
  const [dropoffAt, setDropoffAt] = useState("");
  const [reservationNotes, setReservationNotes] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [pricingCurrency, setPricingCurrency] = useState("USD");

  const getCurrentUserRoles = (): string[] => {
    try {
      const raw = localStorage.getItem('car_rental_auth');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed?.user?.roles || [];
    } catch { return []; }
  };

  const getManagerBranchId = (): string | null => {
    try {
      const branchData = localStorage.getItem('manager_branch_data');
      if (branchData) {
        const parsed = JSON.parse(branchData);
        return parsed._id || null;
      }
      return localStorage.getItem('manager_branch_id');
    } catch { return null; }
  };

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  useEffect(() => {
    dispatch(fetchReservations());
  }, [dispatch]);

  const showSnackbar = (message: string, type: "success" | "error" | "info") => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Transform reservation for display - ADD pickupBranchId and dropoffBranchId
  const transformReservation = (res: Reservation): TransformedReservation => {
    const pickupDate = new Date(res.pickup.at);
    const dropoffDate = new Date(res.dropoff.at);
    const durationDays = Math.ceil((dropoffDate.getTime() - pickupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    };

    const formatDateTime = (date: string) => {
      return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    };

    const formatCurrency = (amount: string) => {
      const num = parseFloat(amount);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: res.pricing?.currency || "USD"
      }).format(num || 0);
    };

    const pickupBranchId = res.pickup.branch_id?._id || '';
    const dropoffBranchId = res.dropoff.branch_id?._id || '';

    return {
      id: res._id,
      code: res.code,
      customer: res.driver_snapshot?.full_name || "N/A",
      email: res.driver_snapshot?.email || "N/A",
      phone: res.driver_snapshot?.phone || "N/A",
      vehicleName: `${res.vehicle_model_id?.make || ""} ${res.vehicle_model_id?.model || ""}`.trim(),
      make: res.vehicle_model_id?.make || "N/A",
      model: res.vehicle_model_id?.model || "N/A",
      year: res.vehicle_model_id?.year || 0,
      vehicleClass: res.vehicle_model_id?.class || "N/A",
      plateNumber: res.vehicle_id?.plate_number || "N/A",
      vin: res.vehicle_id?.vin || "N/A",
      color: res.vehicle_id?.color || "N/A",
      odometer: res.vehicle_id?.odometer_km?.toLocaleString() || "0",
      photos: res.vehicle_id?.photos || [],
      startDate: formatDate(res.pickup.at),
      endDate: formatDate(res.dropoff.at),
      startDateTime: res.pickup.at,
      endDateTime: res.dropoff.at,
      startFormatted: formatDateTime(res.pickup.at),
      endFormatted: formatDateTime(res.dropoff.at),
      status: res.status?.charAt(0).toUpperCase() + res.status?.slice(1) || "Pending",
      rawStatus: res.status,
      totalAmount: formatCurrency(res.pricing?.grand_total?.$numberDecimal || "0"),
      pickupLocation: res.pickup.branch_id?.name || "N/A",
      dropoffLocation: res.dropoff.branch_id?.name || "N/A",
      pickupBranchId: pickupBranchId,
      dropoffBranchId: dropoffBranchId,
      duration: durationDays,
      createdDate: formatDate(res.created_at),
      paymentStatus: res.payment_summary?.status || "unpaid",
      paidAmount: formatCurrency(res.payment_summary?.paid_total?.$numberDecimal || "0"),
      outstandingAmount: formatCurrency(res.payment_summary?.outstanding?.$numberDecimal || "0"),
      seats: res.vehicle_id?.metadata?.seats || 4,
      doors: res.vehicle_id?.metadata?.doors || 4,
      features: res.vehicle_id?.metadata?.features || [],
      licenseClass: res.driver_snapshot?.driver_license?.class || "N/A",
      licenseNumber: res.driver_snapshot?.driver_license?.number || "N/A",
      licenseVerified: res.driver_snapshot?.driver_license?.verified || false,
      pricingBreakdown: res.pricing?.breakdown || []
    };
  };

  // First transform all reservations
  const allReservations = reservations.map(transformReservation);

  // Admins see all; managers/receptionists see their branch
  const filterReservationsByBranch = (reservationsList: TransformedReservation[]): TransformedReservation[] => {
    const roles = getCurrentUserRoles();
    if (roles.includes('admin')) return reservationsList;

    const managerBranchId = getManagerBranchId();
    if (!managerBranchId) return reservationsList;

    return reservationsList.filter(r =>
      r.pickupBranchId === managerBranchId || r.dropoffBranchId === managerBranchId
    );
  };

  // Then filter by manager's branch
  const branchFilteredReservations = filterReservationsByBranch(allReservations);

  // Then apply tab and search filters
  const filteredReservations = branchFilteredReservations.filter(res => {
    let matchesTab = selectedTab === 'all';
    if (!matchesTab) {
      if (selectedTab === 'closed') {
        matchesTab = res.rawStatus === 'closed' || res.rawStatus === 'completed';
      } else if (selectedTab === 'checked_in') {
        matchesTab = res.rawStatus === 'checked_in' || res.rawStatus === 'returned';
      } else {
        matchesTab = res.rawStatus === selectedTab;
      }
    }
    const matchesSearch = searchTerm === "" ||
      res.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Statistics
  const stats = {
    total: branchFilteredReservations.length,
    pending: branchFilteredReservations.filter(r => r.rawStatus === "pending").length,
    active: branchFilteredReservations.filter(r => ["confirmed", "checked_out", "checked_in", "returned"].includes(r.rawStatus)).length,
    completed: branchFilteredReservations.filter(r => ["closed", "completed"].includes(r.rawStatus)).length,
  };

  const handleDeleteReservation = async (reservationId: string) => {
    setIsDeleting(true);
    try {
      await dispatch(removeReservation(reservationId)).unwrap();
      showSnackbar("Reservation deleted successfully", "success");
      setReservationToDelete(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to delete reservation", "error");
    }
    finally{
      setIsDeleting(false)
    }
  };

  const openStatusModal = (reservation: Reservation) => {
    setSelectedStatusReservation(reservation);
    setSelectedNewStatus(reservation.status);
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedStatusReservation || !selectedNewStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await dispatch(updateStatus({ 
        reservationId: selectedStatusReservation._id, 
        status: selectedNewStatus 
      })).unwrap();
      showSnackbar(`Reservation status updated to ${selectedNewStatus}`, "success");
      setShowStatusModal(false);
      setSelectedStatusReservation(null);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openEditModal = (reservation: Reservation) => {
    setSelectedReservationForEdit(reservation);
    
    const pickupBranchId = typeof reservation.pickup.branch_id === 'object' 
      ? (reservation.pickup.branch_id as any)._id || (reservation.pickup.branch_id as any).id || ""
      : reservation.pickup.branch_id;
      
    const dropoffBranchId = typeof reservation.dropoff.branch_id === 'object' 
      ? (reservation.dropoff.branch_id as any)._id || (reservation.dropoff.branch_id as any).id || ""
      : reservation.dropoff.branch_id;
    
    const vehicleId = typeof reservation.vehicle_id === 'object' 
      ? (reservation.vehicle_id as any)._id || (reservation.vehicle_id as any).id || ""
      : reservation.vehicle_id;
    
    const vehicleModelId = typeof reservation.vehicle_model_id === 'object' 
      ? (reservation.vehicle_model_id as any)._id || (reservation.vehicle_model_id as any).id || ""
      : reservation.vehicle_model_id;
    
    setEditFormData({
      code: reservation.code,
      user_id: (reservation as any).user_id || "",
      created_by: (reservation as any).created_by || "",
      created_channel: (reservation as any).created_channel || "web",
      vehicle_id: vehicleId,
      vehicle_model_id: vehicleModelId,
      pickup: {
        branch_id: pickupBranchId,
        at: reservation.pickup.at
      },
      dropoff: {
        branch_id: dropoffBranchId,
        at: reservation.dropoff.at
      },
      status: reservation.status,
      pricing: {
        currency: (reservation.pricing as any)?.currency || "USD",
        breakdown: (reservation.pricing as any)?.breakdown || [],
        fees: (reservation.pricing as any)?.fees || [],
        taxes: (reservation.pricing as any)?.taxes || [],
        discounts: (reservation.pricing as any)?.discounts || [],
        grand_total: (reservation.pricing as any)?.grand_total?.$numberDecimal || (reservation.pricing as any)?.grand_total || "0",
        computed_at: (reservation.pricing as any)?.computed_at || new Date().toISOString()
      },
      payment_summary: {
        status: (reservation.payment_summary as any)?.status || "unpaid",
        paid_total: (reservation.payment_summary as any)?.paid_total?.$numberDecimal || (reservation.payment_summary as any)?.paid_total || "0",
        outstanding: (reservation.payment_summary as any)?.outstanding?.$numberDecimal || (reservation.payment_summary as any)?.outstanding || "0",
        last_payment_at: (reservation.payment_summary as any)?.last_payment_at || null
      },
      driver_snapshot: {
        full_name: reservation.driver_snapshot?.full_name || "",
        phone: reservation.driver_snapshot?.phone || "",
        email: reservation.driver_snapshot?.email || "",
        driver_license: {
          number: reservation.driver_snapshot?.driver_license?.number || "",
          country: (reservation.driver_snapshot?.driver_license as any)?.country || "ZW",
          class: reservation.driver_snapshot?.driver_license?.class || "",
          expires_at: reservation.driver_snapshot?.driver_license?.expires_at || "",
          verified: reservation.driver_snapshot?.driver_license?.verified || false
        }
      },
      notes: (reservation as any).notes || "",
      created_at: (reservation as any).created_at || "",
      updated_at: (reservation as any).updated_at || ""
    });
    
    setIsEditModalOpen(true);
  };

  const handleUpdateReservation = async () => {
    if (!selectedReservationForEdit || !editFormData) return;
    
    setIsUpdatingReservation(true);
    try {
      await reservationsService.updateReservation(selectedReservationForEdit._id, editFormData);
      showSnackbar("Reservation updated successfully", "success");
      setIsEditModalOpen(false);
      dispatch(fetchReservations());
    } catch (err: any) {
      showSnackbar(err.message || "Failed to update reservation", "error");
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  // Load branches + vehicles on mount
  useEffect(() => {
    fetchBranches().then(r => setBranches(r.data || [])).catch(() => {});
    fetchVehicleUnits(1, 200).then(r => setVehicleUnits(r.data?.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node))
        setUserDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetPanel = () => {
    setPanelStep(1); setIsWalkIn(true);
    setUserSearch(""); setSelectedUserId(""); setUserDropOpen(false);
    setCustName(""); setCustPhone(""); setCustEmail("");
    setLicNumber(""); setLicClass(""); setLicCountry("ZW"); setLicExpiry(""); setLicVerified(false);
    setCustomerProfile(null); setProfileLoading(false); setProfileNotFound(false); setProceedWithoutProfile(false);
    setPickupBranchId(""); setSelectedVehicleId("");
    setDropoffBranchId(""); setPickupAt(""); setDropoffAt(""); setReservationNotes("");
    setTotalAmount(""); setPricingCurrency("USD");
    setPanelSubmitting(false);
  };

  const openPanel = async () => {
    resetPanel();
    setPanelOpen(true);
    if (users.length === 0) {
      setUsersLoading(true);
      try { const r = await fetchAllUsers(1, 300); setUsers(r.data?.users || []); }
      catch { /* silent */ } finally { setUsersLoading(false); }
    }
  };

  const selectUser = (u: IUser) => {
    setSelectedUserId(u._id);
    setCustName(u.full_name || "");
    setCustPhone(u.phone || "");
    setCustEmail(u.email || "");
    setUserSearch(u.full_name || u.email || "");
    setUserDropOpen(false);
    // Reset and fetch customer profile
    setCustomerProfile(null);
    setProfileNotFound(false);
    setProceedWithoutProfile(false);
    setLicNumber(""); setLicClass(""); setLicCountry("ZW"); setLicExpiry(""); setLicVerified(false);
    setProfileLoading(true);
    fetchProfilesByUserId(u._id)
      .then(res => {
        const profiles: any[] = res.data?.profiles || [];
        const custProf = profiles.find((p: any) => p.role === "customer") || null;
        if (custProf) {
          setCustomerProfile(custProf);
          if (custProf.full_name) setCustName(custProf.full_name);
          const lic = custProf.driver_license;
          if (lic) {
            setLicNumber(lic.number || "");
            setLicClass(lic.class || "");
            setLicCountry(lic.country || "ZW");
            setLicExpiry(lic.expires_at ? lic.expires_at.slice(0, 10) : "");
            setLicVerified(lic.verified || false);
          }
        } else {
          setProfileNotFound(true);
        }
      })
      .catch(() => setProfileNotFound(true))
      .finally(() => setProfileLoading(false));
  };

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
  }).slice(0, 20);

  const getVehicleBranchId = (v: IVehicleUnit): string => {
    if (!v.branch_id) return "";
    return typeof v.branch_id === "object" ? (v.branch_id as IBranchSummary)._id || "" : v.branch_id as string;
  };

  const getVehicleLabel = (v: IVehicleUnit): string => {
    if (!v.vehicle_model_id) return v.plate_number;
    if (typeof v.vehicle_model_id === "object") {
      const m = v.vehicle_model_id as IVehicleModelSummary;
      return `${m.make || ""} ${m.model || ""} (${m.year || ""}) – ${v.plate_number}`;
    }
    return v.plate_number;
  };

  const vehiclesForBranch = vehicleUnits.filter(v => pickupBranchId && getVehicleBranchId(v) === pickupBranchId);
  const selectedVehicle = vehicleUnits.find(v => v._id === selectedVehicleId) || null;

  const step1Valid = () => {
    if (!custName.trim() || !custPhone.trim() || !custEmail.trim()) return false;
    if (!isWalkIn) {
      if (!selectedUserId) return false;
      if (profileLoading) return false;
      if (profileNotFound && !proceedWithoutProfile) return false;
    }
    return true;
  };
  const step2Valid = () => !!(pickupBranchId && selectedVehicleId);
  const step3Valid = () => !!(dropoffBranchId && pickupAt && dropoffAt && totalAmount && parseFloat(totalAmount) > 0);

  const handleCreateReservation = async () => {
    if (!selectedVehicle) return;
    setPanelSubmitting(true);
    try {
      let vmId = "";
      const vm = selectedVehicle.vehicle_model_id;
      if (vm) vmId = typeof vm === "object" ? (vm as IVehicleModelSummary)._id : (vm as string);

      const days = Math.max(1, Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000));
      const grandTotal = parseFloat(totalAmount) || 0;
      const unitAmount = (grandTotal / days).toFixed(2);

      const payload: CreateReservationPayload = {
        vehicle_id: selectedVehicle._id,
        vehicle_model_id: vmId,
        pickup:  { branch_id: pickupBranchId,  at: new Date(pickupAt).toISOString() },
        dropoff: { branch_id: dropoffBranchId, at: new Date(dropoffAt).toISOString() },
        user_id: isWalkIn ? null : (selectedUserId || null),
        created_channel: "web",
        pricing: {
          currency: pricingCurrency,
          breakdown: [{
            label: "Daily rental rate",
            quantity: days,
            unit_amount: unitAmount as any,
            total: grandTotal.toFixed(2) as any,
          }],
          grand_total: grandTotal.toFixed(2) as any,
          computed_at: new Date().toISOString(),
        },
        driver_snapshot: {
          full_name: custName, phone: custPhone, email: custEmail,
          driver_license: {
            number:     licNumber  || "N/A",
            country:    licCountry || "ZW",
            class:      licClass   || "4",
            expires_at: licExpiry ? new Date(licExpiry).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
            verified:   licVerified,
          },
        },
        notes: reservationNotes || undefined,
      };

      await createReservation(payload);
      dispatch(fetchReservations());
      showSnackbar("Reservation created successfully", "success");
      setPanelOpen(false);
      resetPanel();
    } catch (e: any) {
      showSnackbar(e?.message || "Failed to create reservation", "error");
    } finally {
      setPanelSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:     "bg-amber-100 text-amber-800 border-amber-200",
      confirmed:   "bg-blue-100 text-blue-800 border-blue-200",
      checked_out: "bg-indigo-100 text-indigo-800 border-indigo-200",
      checked_in:  "bg-cyan-100 text-cyan-800 border-cyan-200",
      returned:    "bg-cyan-100 text-cyan-800 border-cyan-200",
      closed:      "bg-emerald-100 text-emerald-800 border-emerald-200",
      completed:   "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled:   "bg-rose-100 text-rose-800 border-rose-200",
      no_show:     "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-emerald-100 text-emerald-800",
      unpaid: "bg-rose-100 text-rose-800",
      partial: "bg-amber-100 text-amber-800"
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const openViewModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar - Fixed */}
      <ReceptionistSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
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
                <h1 className="text-2xl font-bold text-gray-800">Reservations Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage and track all vehicle reservations</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/staff/create-reservation")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl hover:opacity-90 font-semibold text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Reservation
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Stats Overview */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reservations</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Car className="w-6 h-6 text-[#1EA2E4]" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-cyan-600">{stats.active}</p>
                  </div>
                  <div className="p-2 bg-cyan-50 rounded-lg">
                    <Car className="w-6 h-6 text-cyan-500" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col gap-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reservations by customer, vehicle, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent transition-all"
                  />
                </div>
                <div className="hidden sm:flex gap-2 flex-wrap">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'confirmed', label: 'Confirmed' },
                    { value: 'checked_out', label: 'Checked Out' },
                    { value: 'checked_in', label: 'Checked In' },
                    { value: 'closed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedTab(value)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        selectedTab === value
                          ? 'bg-[#1EA2E4] text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:shadow-md'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowMobileFilters(true)} className="sm:hidden flex items-center gap-3 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

               

          {/* Reservations Grid */}
          <div className="px-6 pb-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1EA2E4] mb-4"></div>
                  <p className="text-gray-600">Loading reservations...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-red-600 text-center mb-4">{error}</p>
                <button
                  onClick={() => dispatch(fetchReservations())}
                  className="px-4 py-2 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-6">
                <Car className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">No reservations found</p>
                <p className="text-gray-400 text-center mb-6">
                  {searchTerm || selectedTab !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "No reservations found for your branch"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReservations.map((res) => {
                      const originalRes = reservations.find(r => r._id === res.id);
                      return (
                        <div
                          key={res.id}
                          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                        >
                          {/* Vehicle Image */}
                          {res.photos && res.photos.length > 0 && (
                            <div className="h-40 overflow-hidden">
                              <img
                                src={res.photos[0]}
                                alt={res.vehicleName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(res.vehicleName)}`;
                                }}
                              />
                            </div>
                          )}

                          <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {res.vehicleName}
                                  </h3>
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(res.rawStatus)}`}
                                  >
                                    {res.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Hash className="w-4 h-4" />
                                  <span className="font-mono">{res.code}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{res.customer}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Mail className="w-3 h-3" />
                                <span>{res.email}</span>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>Pick-up</span>
                                </div>
                                <span className="font-medium text-gray-800">{res.startDate}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Calendar className="w-4 h-4" />
                                  <span>Drop-off</span>
                                </div>
                                <span className="font-medium text-gray-800">{res.endDate}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-xs text-gray-500">Total Amount</p>
                                <p className="text-xl font-bold text-[#1EA2E4]">{res.totalAmount}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Payment</p>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(res.paymentStatus)}`}>
                                  {res.paymentStatus.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{res.pickupLocation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{res.dropoffLocation}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex justify-end gap-2">
                            <button
                              onClick={() => originalRes && openStatusModal(originalRes)}
                              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              title="Update Status"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => originalRes && openViewModal(originalRes)}
                              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => originalRes && openEditModal(originalRes)}
                              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Reservation"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => setReservationToDelete(res.id)}
                              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Reservation"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredReservations.map((res) => {
                    const originalRes = reservations.find(r => r._id === res.id);
                    return (
                      <div
                        key={res.id}
                        className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
                      >
                        {res.photos && res.photos.length > 0 && (
                          <div className="h-32 overflow-hidden">
                            <img
                              src={res.photos[0]}
                              alt={res.vehicleName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x200/1EA2E4/ffffff?text=${encodeURIComponent(res.vehicleName)}`;
                              }}
                            />
                          </div>
                        )}

                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900">{res.vehicleName}</h3>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(res.rawStatus)}`}
                                >
                                  {res.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 font-mono">{res.code}</p>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="font-medium text-gray-900">{res.customer}</p>
                            <p className="text-xs text-gray-500">{res.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500">Pick-up</p>
                              <p className="text-sm font-medium">{res.startDate}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Drop-off</p>
                              <p className="text-sm font-medium">{res.endDate}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3 pt-2">
                            <div>
                              <p className="text-lg font-bold text-[#1EA2E4]">{res.totalAmount}</p>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPaymentStatusColor(res.paymentStatus)}`}>
                                {res.paymentStatus}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{res.pickupLocation}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 p-3 bg-gray-50 flex flex-wrap gap-2 justify-end">
                          <button
                            onClick={() => originalRes && openStatusModal(originalRes)}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => originalRes && openViewModal(originalRes)}
                            className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={() => originalRes && openEditModal(originalRes)}
                            className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-blue-50"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => setReservationToDelete(res.id)}
                            className="p-1.5 bg-white border border-gray-300 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          </button>
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

      {/* View Reservation Details Modal */}
      {isViewModalOpen && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Reservation Details</h2>
                <p className="text-sm text-gray-600">Complete reservation information</p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto p-8" style={{ maxHeight: "calc(90vh - 80px)" }}>
              {(() => {
                const details = transformReservation(selectedReservation);
                return (
                  <div className="space-y-8">
                    <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(details.rawStatus)}`}>
                        {details.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${getPaymentStatusColor(details.paymentStatus)}`}>
                        {details.paymentStatus.toUpperCase()}
                      </span>
                      <span className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                        {details.duration} Day{details.duration !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {details.photos.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Vehicle Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {details.photos.slice(0, 3).map((photo, idx) => (
                            <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 aspect-video">
                              <img src={photo} alt={`${details.vehicleName} ${idx + 1}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="text-lg font-bold text-gray-900">{details.customer}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.email}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Driver License</p>
                          <p className="text-gray-900">{details.licenseClass} • {details.licenseNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Car className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Vehicle Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Make & Model</p>
                          <p className="text-lg font-bold text-gray-900">{details.vehicleName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Year</p>
                          <p className="text-gray-900">{details.year}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Plate Number</p>
                          <p className="font-mono text-gray-900">{details.plateNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">VIN</p>
                          <p className="font-mono text-sm text-gray-900">{details.vin}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Color</p>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: details.color.toLowerCase() }}></div>
                            <p className="text-gray-900">{details.color}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Odometer</p>
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{details.odometer} km</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Seats</p>
                          <p className="text-gray-900">{details.seats}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Doors</p>
                          <p className="text-gray-900">{details.doors}</p>
                        </div>
                      </div>
                      {details.features.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Features</p>
                          <div className="flex flex-wrap gap-2">
                            {details.features.map((feature, idx) => (
                              <span key={idx} className="px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border border-gray-200">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Rental Details</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Pick-up Location</p>
                              <p className="text-gray-900">{details.pickupLocation}</p>
                              <p className="text-sm text-gray-500 mt-1">{details.startFormatted}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-gray-700">Drop-off Location</p>
                              <p className="text-gray-900">{details.dropoffLocation}</p>
                              <p className="text-sm text-gray-500 mt-1">{details.endFormatted}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-[#1EA2E4]" />
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Payment Summary</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-2xl font-bold text-[#1EA2E4]">{details.totalAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Paid Amount</p>
                          <p className="text-2xl font-bold text-emerald-600">{details.paidAmount}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500">Outstanding</p>
                          <p className="text-2xl font-bold text-rose-600">{details.outstandingAmount}</p>
                        </div>
                      </div>
                      {details.pricingBreakdown.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-3">Pricing Breakdown</p>
                          <div className="space-y-2">
                            {details.pricingBreakdown.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-gray-600">{item.label} (x{item.quantity})</span>
                                <span className="font-medium text-gray-900">
                                  {new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: selectedReservation.pricing?.currency || "USD"
                                  }).format(parseFloat(item.total.$numberDecimal))}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileFilters(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Filter by Status</h3>
              <button onClick={() => setShowMobileFilters(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'checked_out', label: 'Checked Out' },
                { value: 'checked_in', label: 'Checked In' },
                { value: 'closed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setSelectedTab(value);
                    setShowMobileFilters(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-colors ${
                    selectedTab === value
                      ? "bg-[#1EA2E4] text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
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
            {snackbar.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {snackbar.type === "error" && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{snackbar.message}</span>
            <button onClick={() => setSnackbar((prev) => ({ ...prev, show: false }))} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {isEditModalOpen && selectedReservationForEdit && editFormData && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsEditModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-4xl">
              <div className="h-full bg-white shadow-2xl overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Edit Reservation</h2>
                    <p className="text-sm text-gray-600">Update reservation details</p>
                  </div>
                  <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reservation Code</label>
                        <input type="text" value={editFormData.code || ""} onChange={(e) => setEditFormData({...editFormData, code: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select value={editFormData.status || "pending"} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="checked_out">Checked Out</option>
                          <option value="checked_in">Checked In</option>
                          <option value="closed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                        <input type="text" value={editFormData.user_id || ""} onChange={(e) => setEditFormData({...editFormData, user_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
                        <input type="text" value={editFormData.created_by || ""} onChange={(e) => setEditFormData({...editFormData, created_by: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created Channel</label>
                        <select value={editFormData.created_channel || "web"} onChange={(e) => setEditFormData({...editFormData, created_channel: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
                          <option value="web">Web</option>
                          <option value="mobile">Mobile</option>
                          <option value="admin">Admin</option>
                          <option value="call_center">Call Center</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle ID</label>
                        <input type="text" value={editFormData.vehicle_id || ""} onChange={(e) => setEditFormData({...editFormData, vehicle_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model ID</label>
                        <input type="text" value={editFormData.vehicle_model_id || ""} onChange={(e) => setEditFormData({...editFormData, vehicle_model_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                    </div>
                  </div>

                  {/* Pickup & Dropoff */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Pickup & Dropoff</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Branch ID</label>
                        <input type="text" value={editFormData.pickup?.branch_id || ""} onChange={(e) => setEditFormData({...editFormData, pickup: {...editFormData.pickup, branch_id: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date & Time</label>
                        <input type="datetime-local" value={editFormData.pickup?.at ? editFormData.pickup.at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, pickup: {...editFormData.pickup, at: new Date(e.target.value).toISOString()}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Branch ID</label>
                        <input type="text" value={editFormData.dropoff?.branch_id || ""} onChange={(e) => setEditFormData({...editFormData, dropoff: {...editFormData.dropoff, branch_id: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Date & Time</label>
                        <input type="datetime-local" value={editFormData.dropoff?.at ? editFormData.dropoff.at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, dropoff: {...editFormData.dropoff, at: new Date(e.target.value).toISOString()}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                    </div>
                  </div>

                  {/* Driver Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Driver Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" value={editFormData.driver_snapshot?.full_name || ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, full_name: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input type="text" value={editFormData.driver_snapshot?.phone || ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, phone: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" value={editFormData.driver_snapshot?.email || ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, email: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                        <input type="text" value={editFormData.driver_snapshot?.driver_license?.number || ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, driver_license: {...editFormData.driver_snapshot?.driver_license, number: e.target.value}}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Country</label>
                        <input type="text" value={editFormData.driver_snapshot?.driver_license?.country || "ZW"} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, driver_license: {...editFormData.driver_snapshot?.driver_license, country: e.target.value}}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Class</label>
                        <input type="text" value={editFormData.driver_snapshot?.driver_license?.class || ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, driver_license: {...editFormData.driver_snapshot?.driver_license, class: e.target.value}}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry</label>
                        <input type="datetime-local" value={editFormData.driver_snapshot?.driver_license?.expires_at ? editFormData.driver_snapshot.driver_license.expires_at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, driver_license: {...editFormData.driver_snapshot?.driver_license, expires_at: new Date(e.target.value).toISOString()}}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Verified</label>
                        <select value={editFormData.driver_snapshot?.driver_license?.verified ? "true" : "false"} onChange={(e) => setEditFormData({...editFormData, driver_snapshot: {...editFormData.driver_snapshot, driver_license: {...editFormData.driver_snapshot?.driver_license, verified: e.target.value === "true"}}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Pricing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <input type="text" value={editFormData.pricing?.currency || "USD"} onChange={(e) => setEditFormData({...editFormData, pricing: {...editFormData.pricing, currency: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Grand Total</label>
                        <input type="text" value={editFormData.pricing?.grand_total || "0"} onChange={(e) => setEditFormData({...editFormData, pricing: {...editFormData.pricing, grand_total: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Computed At</label>
                        <input type="datetime-local" value={editFormData.pricing?.computed_at ? editFormData.pricing.computed_at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, pricing: {...editFormData.pricing, computed_at: new Date(e.target.value).toISOString()}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fees (JSON)</label>
                      <textarea value={JSON.stringify(editFormData.pricing?.fees || [], null, 2)} onChange={(e) => { try { const fees = JSON.parse(e.target.value); setEditFormData({...editFormData, pricing: {...editFormData.pricing, fees}}); } catch(err) {} }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] font-mono text-sm" placeholder='[{"code": "AIRPORT_FEE", "amount": "10.00"}]' />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discounts (JSON)</label>
                      <textarea value={JSON.stringify(editFormData.pricing?.discounts || [], null, 2)} onChange={(e) => { try { const discounts = JSON.parse(e.target.value); setEditFormData({...editFormData, pricing: {...editFormData.pricing, discounts}}); } catch(err) {} }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] font-mono text-sm" placeholder='[{"promo_code_id": "promo01", "amount": "5.00"}]' />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Taxes (JSON)</label>
                      <textarea value={JSON.stringify(editFormData.pricing?.taxes || [], null, 2)} onChange={(e) => { try { const taxes = JSON.parse(e.target.value); setEditFormData({...editFormData, pricing: {...editFormData.pricing, taxes}}); } catch(err) {} }} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] font-mono text-sm" placeholder='[{"code": "VAT", "rate": 0.15, "amount": "24.00"}]' />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Breakdown (JSON)</label>
                      <textarea value={JSON.stringify(editFormData.pricing?.breakdown || [], null, 2)} onChange={(e) => { try { const breakdown = JSON.parse(e.target.value); setEditFormData({...editFormData, pricing: {...editFormData.pricing, breakdown}}); } catch(err) {} }} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4] font-mono text-sm" placeholder='[{"label": "Base daily rate", "quantity": 3, "unit_amount": "50.00", "total": "150.00"}]' />
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Payment Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                        <select value={editFormData.payment_summary?.status || "unpaid"} onChange={(e) => setEditFormData({...editFormData, payment_summary: {...editFormData.payment_summary, status: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]">
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="partial">Partial</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Paid Total</label>
                        <input type="text" value={editFormData.payment_summary?.paid_total || "0"} onChange={(e) => setEditFormData({...editFormData, payment_summary: {...editFormData.payment_summary, paid_total: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Outstanding</label>
                        <input type="text" value={editFormData.payment_summary?.outstanding || "0"} onChange={(e) => setEditFormData({...editFormData, payment_summary: {...editFormData.payment_summary, outstanding: e.target.value}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Payment At</label>
                        <input type="datetime-local" value={editFormData.payment_summary?.last_payment_at ? editFormData.payment_summary.last_payment_at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, payment_summary: {...editFormData.payment_summary, last_payment_at: e.target.value ? new Date(e.target.value).toISOString() : null}})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Notes</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea value={editFormData.notes || ""} onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" placeholder="Additional notes about this reservation..." />
                    </div>
                  </div>

                  {/* Created/Updated Timestamps */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Timestamps</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created At</label>
                        <input type="datetime-local" value={editFormData.created_at ? editFormData.created_at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, created_at: new Date(e.target.value).toISOString()})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Updated At</label>
                        <input type="datetime-local" value={editFormData.updated_at ? editFormData.updated_at.slice(0, 16) : ""} onChange={(e) => setEditFormData({...editFormData, updated_at: new Date(e.target.value).toISOString()})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1EA2E4]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
                    <button onClick={handleUpdateReservation} disabled={isUpdatingReservation} className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 flex items-center gap-2">
                      {isUpdatingReservation ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Updating...</> : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedStatusReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => !isUpdatingStatus && setShowStatusModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Update Reservation Status</h3>
                  <p className="text-sm text-gray-600">Reservation: {selectedStatusReservation.code}</p>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Status</label>
                <select value={selectedNewStatus} onChange={(e) => setSelectedNewStatus(e.target.value)} disabled={isUpdatingStatus} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1EA2E4] focus:border-transparent disabled:opacity-50">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowStatusModal(false)} disabled={isUpdatingStatus} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Cancel</button>
                <button onClick={handleConfirmStatusUpdate} disabled={isUpdatingStatus || selectedNewStatus === selectedStatusReservation.status} className="px-4 py-2.5 bg-[#1EA2E4] text-white rounded-lg hover:bg-[#1A8BC9] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isUpdatingStatus ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Updating...</> : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Reservation Panel ── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !panelSubmitting && setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="relative w-screen max-w-lg bg-white shadow-2xl flex flex-col h-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">New Reservation</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Step {panelStep} of 3 — {panelStep === 1 ? "Customer" : panelStep === 2 ? "Vehicle" : "Dates & Notes"}</p>
                </div>
                <button onClick={() => !panelSubmitting && setPanelOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="px-6 pt-4 pb-2 flex items-center gap-2">
                {[1,2,3].map(s => (
                  <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${panelStep >= s ? "bg-[#1EA2E4]" : "bg-gray-200"}`} />
                ))}
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {panelStep === 1 && (
                  <>
                    {/* Walk-in / Registered toggle */}
                    <div className="flex gap-3">
                      {[{v: true, label: "Walk-in"}, {v: false, label: "Registered Customer"}].map(opt => (
                        <button
                          key={String(opt.v)}
                          onClick={() => {
                            setIsWalkIn(opt.v);
                            setSelectedUserId(""); setUserSearch("");
                            setCustomerProfile(null); setProfileNotFound(false); setProceedWithoutProfile(false);
                            setCustName(""); setCustPhone(""); setCustEmail("");
                            setLicNumber(""); setLicClass(""); setLicCountry("ZW"); setLicExpiry(""); setLicVerified(false);
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${isWalkIn === opt.v ? "border-[#1EA2E4] bg-[#1EA2E4]/5 text-[#1EA2E4]" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Registered Customer flow ── */}
                    {!isWalkIn && (
                      <>
                        <div>
                          <div ref={userDropRef} className="relative">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Customer</label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Name, email or phone..."
                                value={userSearch}
                                onChange={e => { setUserSearch(e.target.value); setUserDropOpen(true); setSelectedUserId(""); setCustomerProfile(null); setProfileNotFound(false); setProceedWithoutProfile(false); }}
                                onFocus={() => setUserDropOpen(true)}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]"
                              />
                            </div>
                            {userDropOpen && (
                              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {usersLoading ? (
                                  <div className="py-4 text-center text-sm text-gray-400">Loading...</div>
                                ) : filteredUsers.length === 0 ? (
                                  <div className="py-4 text-center text-sm text-gray-400">No customers found</div>
                                ) : filteredUsers.map(u => (
                                  <button key={u._id} onClick={() => selectUser(u)} className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex flex-col transition-colors">
                                    <span className="text-sm font-medium text-gray-800">{u.full_name}</span>
                                    <span className="text-xs text-gray-500">{u.email}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setPanelOpen(false); navigate("/receptionist-users"); }}
                            className="mt-2 text-xs text-[#1EA2E4] hover:underline font-medium flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> New customer? Add them first →
                          </button>
                        </div>

                        {/* Profile loading indicator */}
                        {selectedUserId && profileLoading && (
                          <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
                            <div className="w-4 h-4 border-2 border-[#1EA2E4] border-t-transparent rounded-full animate-spin" />
                            Loading customer profile...
                          </div>
                        )}

                        {/* No profile warning */}
                        {selectedUserId && !profileLoading && profileNotFound && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-amber-800">No customer profile found</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  <span className="font-medium">{custName}</span> doesn't have a customer profile yet. Driver's licence information won't be available. You can still proceed or add their profile first.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setProceedWithoutProfile(true)}
                                className="flex-1 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg transition-colors"
                              >
                                Proceed without profile
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPanelOpen(false); navigate("/receptionist-users"); }}
                                className="flex-1 py-2 text-xs font-semibold bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 rounded-lg transition-colors"
                              >
                                Add profile first
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Proceed-without-profile confirmation chip */}
                        {selectedUserId && !profileLoading && profileNotFound && proceedWithoutProfile && (
                          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            Proceeding without customer profile — no licence info will be captured.
                          </div>
                        )}

                        {/* Customer profile card (auto-populated) */}
                        {selectedUserId && !profileLoading && customerProfile && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Customer Profile (auto-populated)</p>
                            <div className="space-y-1.5 text-sm text-gray-700">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                <span className="font-medium">{custName}</span>
                              </div>
                              {custEmail && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>{custEmail}</span>
                                </div>
                              )}
                              {custPhone && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span>{custPhone}</span>
                                </div>
                              )}
                            </div>
                            {customerProfile.driver_license ? (
                              <div className="border-t border-emerald-200 pt-3 space-y-1">
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5" /> Driver's Licence
                                  {licVerified && <span className="ml-1 text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full text-xs">Verified</span>}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                                  {licNumber && <span><span className="font-medium text-gray-700">No.</span> {licNumber}</span>}
                                  {licClass && <span><span className="font-medium text-gray-700">Class</span> {licClass}</span>}
                                  {licCountry && <span><span className="font-medium text-gray-700">Country</span> {licCountry}</span>}
                                  {licExpiry && <span><span className="font-medium text-gray-700">Expires</span> {licExpiry}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="border-t border-amber-200 pt-2 flex items-center gap-1.5 text-xs text-amber-700">
                                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                No driver's licence on file for this customer.
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── Walk-in flow: manual customer details ── */}
                    {isWalkIn && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                            <input type="text" placeholder="John Doe" value={custName} onChange={e => setCustName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone *</label>
                            <input type="text" placeholder="+263..." value={custPhone} onChange={e => setCustPhone(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                            <input type="email" placeholder="john@example.com" value={custEmail} onChange={e => setCustEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Driver's Licence</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Licence No.</label><input type="text" placeholder="e.g. ZW123456" value={licNumber} onChange={e => setLicNumber(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Class</label><input type="text" placeholder="e.g. 4" value={licClass} onChange={e => setLicClass(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Country</label><input type="text" value={licCountry} onChange={e => setLicCountry(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                            <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Expiry</label><input type="date" value={licExpiry} onChange={e => setLicExpiry(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
                {panelStep === 2 && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pickup Branch *</label>
                      <select value={pickupBranchId} onChange={e => { setPickupBranchId(e.target.value); setSelectedVehicleId(""); }} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white">
                        <option value="">Select branch...</option>
                        {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                    </div>
                    {pickupBranchId && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle *</label>
                        {vehiclesForBranch.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">No available vehicles at this branch</div>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {vehiclesForBranch.map(v => (
                              <button key={v._id} onClick={() => setSelectedVehicleId(v._id)}
                                className={`w-full text-left p-3 border-2 rounded-xl transition-all ${selectedVehicleId === v._id ? "border-[#1EA2E4] bg-[#1EA2E4]/5" : "border-gray-200 hover:border-gray-300"}`}>
                                <p className="text-sm font-semibold text-gray-800">{getVehicleLabel(v)}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-500">{v.color}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.availability_state === "available" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{v.availability_state || "available"}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {panelStep === 3 && (
                  <>
                    {/* Customer details card for registered customers */}
                    {!isWalkIn && selectedUserId && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Customer Details</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <User className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="font-medium">{custName}</span>
                        </div>
                        {custEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{custEmail}</span>
                          </div>
                        )}
                        {custPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{custPhone}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-3">
                      <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Pickup Date & Time *</label><input type="datetime-local" value={pickupAt} onChange={e => setPickupAt(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dropoff Branch *</label>
                        <select value={dropoffBranchId} onChange={e => setDropoffBranchId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white">
                          <option value="">Select branch...</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Dropoff Date & Time *</label><input type="datetime-local" value={dropoffAt} min={pickupAt} onChange={e => setDropoffAt(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" /></div>
                      {/* Pricing */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Amount *</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="number" min="0" step="0.01" placeholder="0.00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4]" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Currency</label>
                          <select value={pricingCurrency} onChange={e => setPricingCurrency(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] appearance-none bg-white">
                            <option value="USD">USD</option>
                            <option value="ZWL">ZWL</option>
                          </select>
                        </div>
                      </div>
                      <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes (optional)</label><textarea rows={2} placeholder="Any special requests or notes..." value={reservationNotes} onChange={e => setReservationNotes(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1EA2E4]/30 focus:border-[#1EA2E4] resize-none" /></div>
                    </div>
                    {selectedVehicle && pickupAt && dropoffAt && (
                      <div className="bg-[#F0F6FF] rounded-xl p-4 space-y-2 text-sm">
                        <p className="font-semibold text-gray-700">Booking Summary</p>
                        <div className="flex justify-between text-gray-600"><span>Customer</span><span className="font-medium text-gray-800">{custName}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Vehicle</span><span className="font-medium text-gray-800">{getVehicleLabel(selectedVehicle)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Duration</span><span className="font-medium text-gray-800">{Math.max(1, Math.ceil((new Date(dropoffAt).getTime() - new Date(pickupAt).getTime()) / 86400000))} day(s)</span></div>
                        <div className="flex justify-between text-gray-600"><span>Type</span><span className={`font-medium ${isWalkIn ? "text-amber-600" : "text-emerald-600"}`}>{isWalkIn ? "Walk-in" : "Registered"}</span></div>
                        {totalAmount && parseFloat(totalAmount) > 0 && (
                          <div className="flex justify-between text-gray-700 font-semibold border-t border-blue-200 pt-2 mt-1">
                            <span>Total</span>
                            <span className="text-[#1EA2E4]">{pricingCurrency} {parseFloat(totalAmount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                {panelStep > 1 && (
                  <button onClick={() => setPanelStep(s => s - 1)} disabled={panelSubmitting} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50">Back</button>
                )}
                <button
                  onClick={() => { if (panelStep < 3) { setPanelStep(s => s + 1); } else { handleCreateReservation(); } }}
                  disabled={panelSubmitting || (panelStep === 1 && !step1Valid()) || (panelStep === 2 && !step2Valid()) || (panelStep === 3 && !step3Valid())}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#0A1628] to-[#1A5FA8] text-white rounded-xl hover:opacity-90 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {panelSubmitting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : panelStep < 3 ? "Next →" : "Create Reservation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reservationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setReservationToDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Reservation</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this reservation? This will permanently remove all reservation data and cannot be recovered.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setReservationToDelete(null)} disabled={isDeleting} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                <button onClick={() => handleDeleteReservation(reservationToDelete)} disabled={isDeleting} className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isDeleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Deleting...</> : "Delete Reservation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsPage;