// Admin pages
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "../components/ThemeProvider";
import Welcome from "../pages/public/WelcomePage";
import Dashboard from "../pages/admin/AdminDashboardPage";
import Bookings from "../pages/admin/BookingsPage";
import Customers from "../pages/admin/CustomersPage";
import Staff from "../pages/admin/StaffPage";
import RoleSelection from "../pages/admin/RolesPage";
import SignupScreen from "../pages/public/SignUpPage";
import SignInScreen from "../pages/public/SignInPage";
import AdminReservationsPage from "../pages/admin/reservations/AdminReservationsPage";
import AdminVehicleIncidents from "../pages/admin/incidents/AdminVehicleIncidents";
import AdminDriverProfiles from "../pages/admin/driver_profiles/AdminDriverProfiles";
import DriverBookingScreen from "../pages/admin/driver_bookings/DriverBookingScreen";
//Custormer pages 
import Dashboardy from "../pages/customer/CustomerDashboardPage";
import Vihicles from "../pages/customer/Vihicle";
import Reservation from "../pages/customer/CustomerReservationsPage";
import Service from "../pages/customer/CustomerServicePage";
import Profile from "../pages/customer/CustomerProfilePage";
import Drivers from "../pages/customer/CustomerDriversPage";
import ChatScreen from "../pages/customer/Chat";
import NotificationScreen from "../pages/customer/notification";
//Agent Pages
import AgentDashboard from "../pages/agent/agentdashboard";
import AgentbookingPage from "../pages/agent/agentbooking";
import UsersListScreen from "../pages/agent/users";
import AgentVehicles from "../pages/agent/agentvihicles";
import Agentdrivers from "../pages/agent/agentdriver";
import AgentReservation from "../pages/agent/agentreservation";
import AgentChatScreen from "../pages/agent/agentchart";
import AgentProfile from "../pages/agent/agentprofile";
import AgentNotification from "../pages/agent/agentnotification";
import UsersPage from "../pages/admin/users/users_page";
import AdminUserProfilePage from "../pages/admin/users/user_profiles";
import VehicleModelManagement from "../pages/admin/vehicle_management/vehicle_management_page";
import BranchManagementScreen from "../pages/admin/branch_manager/branch_manager_page";
import VehicleUnitManagement from "../pages/admin/vehicle_management/vehicle_unit_management";
import RatePlanScreen from "../pages/admin/rate_plan/rate_plan_page";
import PromoCodeScreen from "../pages/admin/promo_code_manager/promo_code_screen";
import ServiceScheduleScreen from "../pages/admin/services/service_schedule_screen";
import ServiceOrderScreen from "../pages/admin/services/service_order_screen";
import ChatAdminScreen from "../pages/admin/chats/chats_admin_page";
import CreateReservation from "../pages/customer/CreateReservation";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import VehicleModels from "../pages/manager/VehicleModels";
import VehicleUnitMngmnt from "../pages/manager/VehicleUnitMngnt";
import ManagerReservations from "../pages/manager/ReservationsPage";
import ManagerUsersPage from "../pages/manager/ManagerUsersPage";
import ManagerServiceOrder from "../pages/manager/services/ManagerServicesOrder";
import ManagerServiceSchedules from "../pages/manager/services/ManagerServiceSchedules";
import RatePlans from "../pages/manager/rate_plans/RatePlans";
import PromoCodesPage from "../pages/manager/promocodes/PromoCodesPage";
import VehicleIncidents from "../pages/manager/vehicle_incidents/VehicleIncidents";
import ManagerDriverBookings from "../pages/manager/driver_bookings/ManagerDriverBookings";
import DriverProfilesPage from "../pages/manager/driver_profiles/DriverProfilesPage";
import PaymentsScreen from "../pages/admin/payments/PaymentsScreen";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
        //Admin routes
          <Route path="/" element={<Welcome />} />
          <Route path="/roles" element={<RoleSelection/>} />
          <Route path="/signup" element={<SignupScreen/>} />
          <Route path="/login" element={<SignInScreen/>} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/admin-users" element={<UsersPage />} />
          <Route path="/admin/user-profiles/:userId" element={<AdminUserProfilePage />} />
          <Route path="/admin-branches" element={<BranchManagementScreen />} />
          <Route path="/admin-vehicle-models" element={<VehicleModelManagement />} />
          <Route path="/admin-rate-plans" element={<RatePlanScreen />} />
          <Route path="/admin-service-schedules" element={<ServiceScheduleScreen />} />
          <Route path="/admin-service-orders" element={<ServiceOrderScreen />} />
          <Route path="/admin-chats" element={<ChatAdminScreen />} />
          <Route path="/admin-promo-codes" element={<PromoCodeScreen />} />
          <Route path="/admin-vehicles" element={<VehicleUnitManagement />} />
          <Route path="/admin-bookings" element={<Bookings />} />
          <Route path="/admin-customers" element={<Customers />} />
          <Route path="/admin-reservations" element={<AdminReservationsPage />}/>
          <Route path="/admin-vehicle-incidents" element={<AdminVehicleIncidents />} />
          <Route path="/admin-staff" element={<Staff />} />
          <Route path="/admin-driver-profiles" element={<AdminDriverProfiles />} />
          <Route path="/admin-driver-bookings" element={<DriverBookingScreen />}/>
          <Route path="/admin-payments" element={<PaymentsScreen />}/>
          // customer Routes
          <Route path="/dashboardy" element={<Dashboardy/>} />
          <Route path="/vehicle" element={<Vihicles/>} />
          <Route path="/reservations" element={<Reservation/>} />
          <Route path="/orders" element={<Service/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/driver" element={<Drivers/>} />
         
          {/* <Route path="/book/:id" element={<BookingPage/>} /> */}
          <Route path="/book/:id" element={<CreateReservation/>} />
           <Route path="/chart" element={<ChatScreen/>} />
           <Route path="/notification" element={<NotificationScreen/>} />

           //Agent Routes
            <Route path="/agentdashboard" element={<AgentDashboard/>} />
            <Route path="/agentbook/:id" element={<AgentbookingPage/>} />
            <Route path="/user" element={<UsersListScreen/>} />
            <Route path="/agent" element={<AgentVehicles/>} />
            <Route path="/agentdriver" element={<Agentdrivers/>} />
            <Route path="/agentreservations" element={<AgentReservation/>} />
            <Route path="/agentchart" element={<AgentChatScreen/>} />
            <Route path="/agentprofile" element={<AgentProfile/>} />
             <Route path="/agentnotification" element={<AgentNotification/>} />

             // Manager routes
             <Route path="/branch-manager-dashboard" element={<ManagerDashboard />} />
             <Route path="/manager-vehicle-models" element={<VehicleModels />}/>
             <Route path="/manager-vehicles" element={<VehicleUnitMngmnt />}/>
             <Route path="/manager-reservations" element={<ManagerReservations />}/>
            <Route path="/manager-users" element={<ManagerUsersPage />} />
            <Route path="/manager-service-orders" element= {<ManagerServiceOrder/>} />
            <Route path="/manager-service-schedules" element={<ManagerServiceSchedules />}/>
            <Route path="/manager-rate-plans" element={<RatePlans />}/>
            <Route path="/manager-promo-codes" element={<PromoCodesPage />}/>
             <Route path="/manager-vehicle-incidents" element={<VehicleIncidents />}/>
            <Route path="/manager-driver-bookings" element={<ManagerDriverBookings />}/>
            <Route path="/manager-driver-profiles" element={<DriverProfilesPage />}/>
           



       </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
