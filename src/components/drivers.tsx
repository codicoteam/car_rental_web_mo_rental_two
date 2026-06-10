import { 
  X, Loader2, CheckCircle, CreditCard, Check, AlertCircle,
  DollarSign, Calendar, Clock3, Navigation, MapPin, Clock } from 'lucide-react';
import type { Driver, ApiBooking, BookingFormData, BookingDrawerData , Location } from '../drivertypes';
// import { MapLocationPicker } from './MapLocationPicker';
import { CombinedMapPicker } from './MapLocationPicker';
// Success Message Component
export const SuccessMessage: React.FC<{
  message: string;
  subMessage: string;
  onClose: () => void;
}> = ({ message, subMessage, onClose }) => (
  <div className="fixed top-4 right-4 z-50 animate-slide-in">
    <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <Check className="w-6 h-6" />
      </div>
      <div>
        <p className="font-semibold">{message}</p>
        <p className="text-sm opacity-90">{subMessage}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-white/20"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Error Message Component
export const ErrorMessage: React.FC<{
  message: string;
  subMessage: string;
  onClose: () => void;
}> = ({ message, subMessage, onClose }) => (
  <div className="fixed top-4 right-4 z-50 animate-slide-in">
    <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <p className="font-semibold">{message}</p>
        <p className="text-sm opacity-90">{subMessage}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-white/20 flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Booking Drawer Component
export const BookingDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  driverImage: string;
  drawerData: BookingDrawerData;
  onHoursChange: (hours: number) => void;
  onSpecialInstructionsChange: (instructions: string) => void;
  onConfirm: () => void;
}> = ({
  isOpen,
  onClose,
  driver,
  driverImage,
  drawerData,
  onHoursChange,
  onSpecialInstructionsChange,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full md:w-2/3 lg:w-1/2 xl:w-1/3 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
      <div className="h-full flex flex-col">
        <div className="bg-gradient-to-r from-blue-800 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Confirm Booking</h2>
              <p className="text-blue-100 mt-1">
                Complete your booking with {driver.user_id.full_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  src={driverImage} 
                  alt={driver.user_id.full_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{driver.user_id.full_name}</h3>
                <p className="text-gray-600">{driver.display_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{driver.base_city}, {driver.base_country}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Required
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onHoursChange(drawerData.hours - 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-gray-900">{drawerData.hours}</span>
                  <span className="text-gray-600 ml-2">hour(s)</span>
                </div>
                <button
                  onClick={() => onHoursChange(drawerData.hours + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={drawerData.specialInstructions}
                onChange={(e) => onSpecialInstructionsChange(e.target.value)}
                placeholder="Any special requirements or instructions..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl">
              <h5 className="font-semibold text-gray-700 mb-3">Pricing Summary</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-medium">${driver.hourly_rate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours</span>
                  <span className="font-medium">{drawerData.hours}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-800">
                      ${drawerData.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex-1"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-gradient-to-r from-blue-800 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useMemo} from 'react';




export const BookingFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  driver: Driver;
  formData: BookingFormData;
  onFormDataChange: (data: BookingFormData) => void;
  onCreateBooking: () => void;
  isCreating: boolean;
}> = ({
  isOpen,
  onClose,
  driver,
  formData,
  onFormDataChange,
  onCreateBooking,
  isCreating
}) => {
  if (!isOpen) return null;

  // const formatDateTimeLocal = (dateString: string) => {
  //   const date = new Date(dateString);
  //   return date.toISOString().slice(0, 16);
  // };

//   const formatDateTimeLocal = (dateString: string) => {
//   const date = new Date(dateString);

//   const pad = (n: number) => n.toString().padStart(2, "0");

//   const year = date.getFullYear();
//   const month = pad(date.getMonth() + 1);
//   const day = pad(date.getDate());
//   const hours = pad(date.getHours());
//   const minutes = pad(date.getMinutes());

//   return `${year}-${month}-${day}T${hours}:${minutes}`;
// };

const formatDateTimeLocal = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  // Get local datetime string in YYYY-MM-DDThh:mm format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

  

  const handleFieldChange = (field: keyof BookingFormData, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
  };

 
  const handlePickupChange = (location: Location) => {
  onFormDataChange({
    ...formData,
    pickup_location: location
  });
};

const handleDropoffChange = (location: Location) => {
  onFormDataChange({
    ...formData,
    dropoff_location: location
  });
};

  // const totalAmount = driver.hourly_rate * formData.pricing.hours_requested;
 const hoursRequested = useMemo(() => {
  if (formData.start_at && formData.end_at) {
    const start = new Date(formData.start_at);
    const end = new Date(formData.end_at);

    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (diff > 0) {
      return Math.round(diff * 10) / 10;
    }
  }

  return formData.pricing.hours_requested;
}, [formData.start_at, formData.end_at]);

  const totalAmount = driver.hourly_rate * hoursRequested;
  const validation = useMemo(() => {
    const isValidCoordinate = (lat: number, lng: number) => {
      return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
    };
    
    const isPickupSelected = !!(formData.pickup_location?.address && 
                                 formData.pickup_location.address.trim() !== '' &&
                                 isValidCoordinate(formData.pickup_location?.latitude, formData.pickup_location?.longitude));
    
    const isDropoffSelected = !!(formData.dropoff_location?.address && 
                                  formData.dropoff_location.address.trim() !== '' &&
                                  isValidCoordinate(formData.dropoff_location?.latitude, formData.dropoff_location?.longitude));
    
    const hasStartTime = !!(formData.start_at && formData.start_at.trim() !== '');
    const hasEndTime = !!(formData.end_at && formData.end_at.trim() !== '');
    
    return {
      isPickupSelected,
      isDropoffSelected,
      hasStartTime,
      hasEndTime,
      isValid: isPickupSelected && isDropoffSelected && hasStartTime && hasEndTime
    };
  }, [formData]);

  return (
    <>
      <div className="fixed inset-0 z-50 lg:left-74 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:left-74">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-scale-up">
          
          <div className="bg-gradient-to-r from-blue-800 to-cyan-600 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Create Booking</h2>
                <p className="text-blue-100 mt-1">
                  Fill in the booking details for {driver.user_id.full_name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Driver Info Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Hourly Rate</p>
                    <p className="text-2xl font-bold text-blue-600">${driver.hourly_rate}/hour</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hours</p>
                    <input
                      type="number"
                      value={formData.pricing.hours_requested}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 1;
                        const endDate = formData.start_at 
                          ? new Date(new Date(formData.start_at).getTime() + hours * 60 * 60 * 1000)
                          : new Date();
                        onFormDataChange({
                          ...formData,
                          pricing: { ...formData.pricing, hours_requested: hours },
                          end_at: endDate.toISOString()
                        });
                      }}
                      min="1"
                      max="24"
                      className="w-20 p-2 border border-gray-300 rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-600">${totalAmount}</p>
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.start_at ? formatDateTimeLocal(formData.start_at) : ""}
                    onChange={(e) => {
                      const startDate = new Date(e.target.value);
                      const endDate = new Date(startDate.getTime() + formData.pricing.hours_requested * 60 * 60 * 1000);
                      handleFieldChange('start_at', startDate.toISOString());
                      handleFieldChange('end_at', endDate.toISOString());
                    }}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_at ? formatDateTimeLocal(formData.end_at) : ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50"
                  />
                </div>
              </div> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Start Date & Time <span className="text-red-500">*</span>
    </label>
    <input
      type="datetime-local"
      value={formData.start_at ? formatDateTimeLocal(formData.start_at) : ""}
      onChange={(e) => {
        if (e.target.value) {
          const startDate = new Date(e.target.value);
          if (!isNaN(startDate.getTime())) {
            handleFieldChange("start_at", startDate.toISOString());
          }
        } else {
          handleFieldChange("start_at", "");
        }
      }}
      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
      required
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      End Date & Time <span className="text-red-500">*</span>
    </label>
    <input
      type="datetime-local"
      value={formData.end_at ? formatDateTimeLocal(formData.end_at) : ""}
      onChange={(e) => {
          if (e.target.value) {
            const endDate = new Date(e.target.value);
            if (!isNaN(endDate.getTime())) {
              handleFieldChange("end_at", endDate.toISOString());
            }
          } else {
            handleFieldChange("end_at", "");
          }
        }}
      className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
    />
  </div>
</div>

              {/* Combined Map Picker */}
              <CombinedMapPicker
                pickupLocation={formData.pickup_location}
                dropoffLocation={formData.dropoff_location}
                onPickupChange={handlePickupChange}
                onDropoffChange={handleDropoffChange}
              />

              

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Any special instructions or requirements..."
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50 sticky bottom-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={onCreateBooking}
                disabled={isCreating || !validation.isValid}
                className={`px-6 py-3 rounded-xl font-semibold shadow-lg transition-opacity flex-1 flex items-center justify-center gap-2 ${
                  validation.isValid && !isCreating
                    ? 'bg-gradient-to-r from-blue-800 to-cyan-600 text-white hover:opacity-90 cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Create Booking
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Location Input Sub-component
const LocationInput: React.FC<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  location: any;
  onChange: (field: string, value: string) => void;
}> = ({ label, icon: Icon, location, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </label>
    <div className="space-y-3">
      <input
        type="text"
        value={location.label}
        onChange={(e) => onChange('label', e.target.value)}
        placeholder="Location label (e.g., Home, Office)"
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        required
      />
      <textarea
        value={location.address}
        onChange={(e) => onChange('address', e.target.value)}
        placeholder={`Full address for ${label.toLowerCase()}`}
        rows={2}
        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
        required
      />
    </div>
  </div>
);

// Payment Confirmation Modal Component
export const PaymentConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  booking: ApiBooking;
  onConfirmPayment: () => void;
  isConfirming: boolean;
  getDriverName: (booking: ApiBooking) => string;
  getDisplayName: (booking: ApiBooking) => string;
  getHourlyRate: (booking: ApiBooking) => number;
  getHoursRequested: (booking: ApiBooking) => number;
  getBookingStatus: (booking: ApiBooking) => string;
}> = ({
  isOpen,
  onClose,
  booking,
  onConfirmPayment,
  isConfirming,
  getDriverName,
  getHourlyRate,
  getHoursRequested,
  getBookingStatus
}) => {
  if (!isOpen) return null;

  const driverName = getDriverName(booking);
  const hourlyRate = getHourlyRate(booking);
  const hoursRequested = getHoursRequested(booking);
  const bookingStatus = getBookingStatus(booking);
  const totalAmount = hourlyRate * hoursRequested;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border border-green-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 lg:left-74 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:left-74">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scale-up">
          
          <div className="bg-gradient-to-r from-blue-800 to-cyan-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Confirm Payment</h2>
                <p className="text-blue-100 mt-1">
                  Complete payment for booking
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Payment</h3>
              <p className="text-gray-600 text-sm">
                Pay for your booking with {driverName}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-medium text-sm">{booking._id?.slice(-8) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver</span>
                  <span className="font-medium">{driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours</span>
                  <span className="font-medium">{hoursRequested} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-medium">${hourlyRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(bookingStatus)}`}>
                    {bookingStatus.toUpperCase()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-800">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Status */}
            <div className="mb-4">
              <div className={`text-sm font-medium px-3 py-2 rounded-lg ${getStatusBadgeColor(bookingStatus)}`}>
                <div className="flex items-center gap-2">
                  {bookingStatus === 'accepted' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Driver has accepted this booking. Ready for payment.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      <span>Booking is {bookingStatus}. {bookingStatus === 'pending' ? 'Awaiting driver acceptance.' : 'Cannot process payment.'}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex flex-col gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirmPayment}
                disabled={isConfirming || bookingStatus !== 'accepted'}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    {bookingStatus === 'accepted' ? 'Confirm Payment' : 'Awaiting Driver Acceptance'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Booking Card Component
export const BookingCard: React.FC<{
  booking: ApiBooking;
  onClick: (booking: ApiBooking) => void;
  getDriverName: (booking: ApiBooking) => string;
  getDisplayName: (booking: ApiBooking) => string;
  getHourlyRate: (booking: ApiBooking) => number;
  getHoursRequested: (booking: ApiBooking) => number;
  getBookingStatus: (booking: ApiBooking) => string;
  getPaymentStatus: (booking: ApiBooking) => string;
}> = ({
  booking,
  onClick,
  getDriverName,
  getDisplayName,
  getHourlyRate,
  getHoursRequested,
  getBookingStatus,
  getPaymentStatus
}) => {
  const driverName = getDriverName(booking);
  const driverImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=3b82f6&color=fff&size=128`;
  const totalAmount = getHourlyRate(booking) * getHoursRequested(booking);
  const bookingStatus = getBookingStatus(booking);
  const paymentStatus = getPaymentStatus(booking);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border border-green-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getPaymentStatusBadgeColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'failed': return 'bg-red-50 text-red-700 border border-red-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const formatDisplayDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date not available';
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 active:scale-[0.99] transition-all"
      onClick={() => onClick(booking)}
    >
      <div className="flex items-start gap-4">
        {/* Driver Image */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <img 
            src={driverImage} 
            alt={driverName}
            className="h-full w-full object-cover"
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-bold text-gray-900 truncate">
                {driverName}
              </h4>
              
              {getDisplayName(booking) && (
                <p className="text-sm text-gray-600 truncate">{getDisplayName(booking)}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(bookingStatus)}`}>
                  {bookingStatus.toUpperCase()}
                </div>
                
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDisplayDate(booking.start_at)}</span>
                </div>
                
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <Clock className="w-3 h-3" />
                  <span>{getHoursRequested(booking)} hour(s)</span>
                </div>
              </div>
              
              {/* Payment Status */}
              <div className="mt-2 flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getPaymentStatusBadgeColor(paymentStatus)}`}>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {paymentStatus.toUpperCase()}
                  </div>
                </div>
                
                {bookingStatus === 'accepted' && paymentStatus === 'pending' && (
                  <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                    <CreditCard className="w-3 h-3" />
                    <span>Click to pay</span>
                  </div>
                )}
                
                {bookingStatus === 'pending' && (
                  <div className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>Awaiting driver acceptance</span>
                  </div>
                )}
                
                {bookingStatus === 'paid' && (
                  <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Payment completed</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Price Section */}
            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold text-blue-800 whitespace-nowrap">
                ${totalAmount.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ${getHourlyRate(booking)}/hr
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bookings Modal Component
export const BookingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  bookings: ApiBooking[];
  isLoading: boolean;
  onBookingClick: (booking: ApiBooking) => void;
  getDriverName: (booking: ApiBooking) => string;
  getDisplayName: (booking: ApiBooking) => string;
  getHourlyRate: (booking: ApiBooking) => number;
  getHoursRequested: (booking: ApiBooking) => number;
  getBookingStatus: (booking: ApiBooking) => string;
  getPaymentStatus: (booking: ApiBooking) => string;
}> = ({
  isOpen,
  onClose,
  bookings,
  isLoading,
  onBookingClick,
  getDriverName,
  getDisplayName,
  getHourlyRate,
  getHoursRequested,
  getBookingStatus,
  getPaymentStatus
}) => {
  if (!isOpen) return null;

  const totalAmount = bookings.reduce((total, b) => total + (getHourlyRate(b) * getHoursRequested(b)), 0);

  return (
    <>
      <div className="fixed inset-0 z-50 lg:left-74 bg-black/50 backdrop-blur-sm"></div>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:left-74">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden animate-scale-up">
          
          <div className="bg-gradient-to-r from-blue-800 to-cyan-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Bookings</h2>
                <p className="text-blue-100 mt-1">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto text-blue-600 animate-spin" />
                <p className="mt-3 text-gray-600">Loading your bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
                <p className="text-gray-500">Book a driver to see your bookings here!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking._id}
                    booking={booking}
                    onClick={onBookingClick}
                    getDriverName={getDriverName}
                    getDisplayName={getDisplayName}
                    getHourlyRate={getHourlyRate}
                    getHoursRequested={getHoursRequested}
                    getBookingStatus={getBookingStatus}
                    getPaymentStatus={getPaymentStatus}
                  />
                ))}
              </div>
            )}
          </div>

          {bookings.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <span className="text-gray-700 font-semibold">Total Bookings:</span>
                  <span className="ml-2 text-blue-800 font-bold text-xl">{bookings.length}</span>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-gray-700 font-semibold">Total Amount:</span>
                  <span className="ml-2 text-3xl font-bold text-blue-800">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};