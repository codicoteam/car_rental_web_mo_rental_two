// Define Booking interface
export interface Booking {
  id: number;
  driverName: string;
  price: number;
  location: string;
  date: string;
  driverId: string;
  hours: number;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'paid' | 'cancelled';
}

// Define the Driver interface to match Redux state
export interface Driver {
  _id: string;
  user_id: {
    email: string;
    phone: string;
    _id: string;
    full_name: string;
  };
  display_name: string;
  base_city: string;
  base_region: string;
  base_country: string;
  hourly_rate: number;
  bio: string;
  years_experience: number;
  languages: string[];
  identity_document?: {
    type: string;
    imageUrl: string;
  };
  driver_license?: {
    number: string;
    imageUrl: string;
    country: string;
    class: string;
    expires_at: string;
    verified: boolean;
  };
  status: string;
  is_available: boolean;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

// New Booking Details interface
export interface BookingFormData {
  customer_id: string;
  driver_profile_id: string;
  start_at: string;
  end_at: string;
  // pickup_location: {
  //   label: string;
  //   address: string;
  //   latitude: number;
  //   longitude: number;
  // };
  pickup_location: Location;
  dropoff_location: Location;
  // dropoff_location: {
  //   label: string;
  //   address: string;
  //   latitude: number;
  //   longitude: number;
  // };
  notes: string;
  pricing: {
    currency: string;
    hours_requested: number;
  };
}

export interface BookingDrawerData {
  driver: Driver;
  hours: number;
  totalAmount: number;
  bookingDate: string;
  specialInstructions: string;
}

// API Booking Interface
export interface ApiBooking {
  _id: string;
  driver_profile_id: {
    _id: string;
    user_id: {
      full_name: string;
    };
    display_name?: string;
    hourly_rate: number;
  };
  customer_id: string;
  start_at: string;
  end_at: string;
  pickup_location?: {
    label: string;
    address: string;
  };
  dropoff_location?: {
    label: string;
    address: string;
  };
  pricing: {
    hours_requested: number;
    currency: string;
  };
  status: 'pending' | 'accepted' | 'paid' | 'cancelled';
  payment_status: 'pending' | 'completed' | 'failed';
  notes?: string;
  created_at: string;
}