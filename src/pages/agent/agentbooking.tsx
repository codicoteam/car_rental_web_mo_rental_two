import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAppSelector } from "../../app/hooks";
import { selectVehicles } from '../../features/vehicles/vehiclesSelectors';
import ServiceOrderService from '../../Services/service_orders';
import ServiceScheduleService from '../../Services/schedule_service';
import UserService from '../../Services/users_service'; 
import BookingDetails from '../../components/agent/agentbookingmodal';
import type { Pricing, ServiceOrder, ServiceSchedule, User as UserType } from '../../servicetypes';

const AgentbookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceSchedules, setServiceSchedules] = useState<ServiceSchedule[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUserId] = useState<string>('');
  const [selectedUser] = useState<UserType | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingServiceOrders, setLoadingServiceOrders] = useState(false);
  const [loadingServiceSchedules, setLoadingServiceSchedules] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  useEffect(() => {
    console.log("Vehicles from Redux:", vehicles);
    console.log("URL ID:", id);

    const fetchPricing = () => {
      try {
        const pricingArray = getPricingArray();
        console.log("Extracted Pricing Array:", pricingArray);

        const foundPricing = pricingArray.find(p => p._id === id);
        console.log("Found Pricing:", foundPricing);

        if (foundPricing) {
          setPricing(foundPricing);
        } else {
          console.error('Pricing not found');
        }
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, [id, vehicles]);

  useEffect(() => {
    const fetchServiceData = async () => {
      console.log("Fetching all service data...");

      // Fetch Service Orders
      setLoadingServiceOrders(true);
      try {
        const ordersResponse = await ServiceOrderService.getAllServiceOrders();
        console.log("Service Orders API Response:", ordersResponse);

        // Extract service orders from the response
        let ordersData: ServiceOrder[] = [];
        if (ordersResponse && ordersResponse.data && Array.isArray(ordersResponse.data)) {
          console.log("Service Orders Data:", ordersResponse.data);
          ordersData = ordersResponse.data;
        } else if (Array.isArray(ordersResponse)) {
          console.log("Service Orders (direct array):", ordersResponse);
          ordersData = ordersResponse;
        } else {
          console.warn("Unexpected service orders format:", ordersResponse);
        }
        setServiceOrders(ordersData || []);
      } catch (error) {
        console.error('Error fetching service orders:', error);
        setServiceOrders([]);
      } finally {
        setLoadingServiceOrders(false);
      }

      // Fetch Service Schedules
      setLoadingServiceSchedules(true);
      try {
        const schedulesResponse = await ServiceScheduleService.getAllSchedules();
        console.log("Service Schedules API Response:", schedulesResponse);

        // Extract service schedules from the response
        let schedulesData: ServiceSchedule[] = [];
        if (schedulesResponse && schedulesResponse.data && Array.isArray(schedulesResponse.data)) {
          console.log("Service Schedules Data:", schedulesResponse.data);
          schedulesData = schedulesResponse.data;
        } else if (Array.isArray(schedulesResponse)) {
          console.log("Service Schedules (direct array):", schedulesResponse);
          schedulesData = schedulesResponse;
        } else {
          console.warn("Unexpected service schedules format:", schedulesResponse);
        }
        setServiceSchedules(schedulesData || []);
      } catch (error) {
        console.error('Error fetching service schedules:', error);
        setServiceSchedules([]);
      } finally {
        setLoadingServiceSchedules(false);
      }
    };

    fetchServiceData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        // Fetch users from your UserService
        const usersResponse = await UserService.getAllUsers();
        console.log("Users API Response:", usersResponse);

        // Extract users from the response
        let usersData: UserType[] = [];
        if (usersResponse && usersResponse.data && Array.isArray(usersResponse.data)) {
          console.log("Users Data:", usersResponse.data);
          usersData = usersResponse.data;
        } else if (Array.isArray(usersResponse)) {
          console.log("Users (direct array):", usersResponse);
          usersData = usersResponse;
        } else if (usersResponse && typeof usersResponse === 'object') {
          // Try to extract array from other possible structures
          const keys = Object.keys(usersResponse);
          if (keys.length === 1 && Array.isArray(usersResponse[keys[0]])) {
            usersData = usersResponse[keys[0]];
          }
        } else {
          console.warn("Unexpected users format:", usersResponse);
        }
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const getPricingArray = (): Pricing[] => {
    console.log("Processing vehicles state:", vehicles);

    if (!vehicles) return [];

    if (typeof vehicles === 'object' && vehicles !== null) {
      if ('data' in vehicles && typeof vehicles.data === 'object' && vehicles.data !== null) {
        const apiResponse = vehicles as any;
        if ('items' in apiResponse.data && Array.isArray(apiResponse.data.items)) {
          console.log("Detected API response format with items array.");
          return apiResponse.data.items;
        }
      }

      if (Array.isArray(vehicles)) {
        console.log("Detected plain array of vehicles.");
        return vehicles as unknown as Pricing[];
      }
    }

    return [];
  };

  const handleCreateBookingOnBehalf = async (bookingData: any) => {
    setIsCreatingBooking(true);
    setBookingStatus({ type: null, message: '' });
    
    try {
      // Add agent booking flags to the booking data
      const bookingDataWithAgent = {
        ...bookingData,
        bookedByAgent: true,
        agentId: 'current-agent-id', // You'll need to get the actual agent ID from your auth system
      };

      // Call your booking API with the modified data
      console.log('Creating booking as agent with data:', bookingDataWithAgent);
      
      // Simulate API call (replace with your actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success handling
      setBookingStatus({ 
        type: 'success', 
        message: 'Booking successfully created!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setBookingStatus({ type: null, message: '' });
      }, 3000);
      
      // You can also navigate or refresh data here
      // navigate('/agent/bookings');
      
    } catch (error) {
      console.error('Error creating booking:', error);
      
      // Error handling
      setBookingStatus({ 
        type: 'error', 
        message: 'Failed to create booking. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setBookingStatus({ type: null, message: '' });
      }, 5000);
      
    } finally {
      setIsCreatingBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pricing Not Found</h1>
          <p className="text-gray-600 mb-6">The pricing details you're looking for could not be found.</p>
          <button
            onClick={() => navigate('/agent')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
          >
            Back to Vehicles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button
              onClick={() => navigate('/agent')}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="font-medium">Back to Vehicles</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Status Messages */}
      {bookingStatus.type && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300 ${bookingStatus.type ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className={`rounded-lg p-4 ${bookingStatus.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${bookingStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {bookingStatus.type === 'success' ? (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${bookingStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {bookingStatus.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Booking Creation Loader Overlay */}
        {isCreatingBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Creating Booking</h3>
                <p className="text-gray-600 text-center">Please wait while we create your booking...</p>
                <p className="text-sm text-gray-500 mt-2 text-center">This may take a few moments</p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Component */}
        <BookingDetails
          pricing={pricing}
          serviceOrders={serviceOrders}
          serviceSchedules={serviceSchedules}
          loadingServiceOrders={loadingServiceOrders}
          loadingServiceSchedules={loadingServiceSchedules}
          
          
        />
      </div>
    </div>
  );
};

export default AgentbookingPage;