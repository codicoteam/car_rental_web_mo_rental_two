// Admin pages
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { ThemeProvider } from "../components/ThemeProvider";
import Welcome from "../pages/public/WelcomePage";
import LandingPage from "../pages/public/LandingPage";
import Dashboard from "../pages/admin/AdminDashboardPage";
import Bookings from "../pages/admin/BookingsPage";
import Customers from "../pages/admin/CustomersPage";
import Staff from "../pages/admin/StaffPage";
import RoleSelection from "../pages/admin/RolesPage";
import SignupScreen from "../pages/public/SignUpPage";
import SignInScreen from "../pages/public/SignInPage";
import AdminReservationsPage from "../pages/admin/reservations/AdminReservationsPage";
import ReservationDetailPage from "../pages/admin/reservations/ReservationDetailPage";
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
import BranchDetailPage from "../pages/admin/branch_manager/BranchDetailPage";
import VehicleUnitManagement from "../pages/admin/vehicle_management/vehicle_unit_management";
import RatePlanScreen from "../pages/admin/rate_plan/rate_plan_page";
import RatePlanDetailPage from "../pages/admin/rate_plan/RatePlanDetailPage";
import VehicleUnitDetailPage from "../pages/admin/vehicle_management/VehicleUnitDetailPage";
import PromoCodeScreen from "../pages/admin/promo_code_manager/promo_code_screen";
import ServiceScheduleScreen from "../pages/admin/services/service_schedule_screen";
import ServiceOrderScreen from "../pages/admin/services/service_order_screen";
import ChatAdminScreen from "../pages/admin/chats/chats_admin_page";
import CreateReservation from "../pages/customer/CreateReservation";
import CustomerReservationDetailPage from "../pages/customer/CustomerReservationDetailPage";
import PaymentPage from "../pages/customer/PaymentPage";
import PaymentStatusPage from "../pages/customer/PaymentStatusPage";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import VehicleModels from "../pages/manager/VehicleModels";
import VehicleUnitMngmnt from "../pages/manager/VehicleUnitMngnt";
import ManagerReservations from "../pages/manager/ReservationsPage";
import ManagerUsersPage from "../pages/manager/ManagerUsersPage";
import ManagerServiceOrder from "../pages/manager/services/ManagerServicesOrder";
import ManagerServiceSchedules from "../pages/manager/services/ManagerServiceSchedules";
import RatePlans from "../pages/manager/rate_plans/RatePlans";
import ManagerRatePlanDetailPage from "../pages/manager/rate_plans/ManagerRatePlanDetailPage";
import ManagerVehicleUnitDetailPage from "../pages/manager/VehicleUnitDetailPage";
import PromoCodesPage from "../pages/manager/promocodes/PromoCodesPage";
import VehicleIncidents from "../pages/manager/vehicle_incidents/VehicleIncidents";
import ManagerDriverBookings from "../pages/manager/driver_bookings/ManagerDriverBookings";
import DriverProfilesPage from "../pages/manager/driver_profiles/DriverProfilesPage";
import ManagerDriverProfileDetailPage from "../pages/manager/driver_profiles/ManagerDriverProfileDetailPage";
import ManagerNotificationsScreen from "../pages/manager/notifications/ManagerNotificationsScreen";
import PaymentsScreen from "../pages/admin/payments/PaymentsScreen";
import VehicleTrackersScreen from "../pages/admin/vehicle_trackers/VehicleTrackersScreen";
import AdminReports from "../pages/admin/reports/AdminReports";
import NotificationScreen from "../pages/customer/notification";
import AdminNotificationsScreen from "../pages/admin/notifications/NotificationsScreen";
import AdminProfilePage from "../pages/admin/AdminProfilePage";
import DriverDashboard from "../pages/driver/DriverDashboard";
import MyBookings from "../pages/driver/driver-bookings/MyBookings";
import DriverProfileScreen from "../pages/driver/driver-profile/DriverProfile";
// Receptionist pages
import ReceptionistDashboard from "../pages/receptionist/ReceptionistDashboard";
import ReceptionistVehicleModels from "../pages/receptionist/VehicleModels";
import ReceptionistVehicleUnitMngnt from "../pages/receptionist/VehicleUnitMngnt";
import ReceptionistReservations from "../pages/receptionist/ReservationsPage";
import ReceptionistUsersPage from "../pages/receptionist/ReceptionistUsersPage";
import ReceptionistServiceOrder from "../pages/receptionist/services/ReceptionistServicesOrder";
import ReceptionistServiceSchedules from "../pages/receptionist/services/ReceptionistServiceSchedules";
import ReceptionistRatePlans from "../pages/receptionist/rate_plans/RatePlans";
import ReceptionistRatePlanDetailPage from "../pages/receptionist/rate_plans/ReceptionistRatePlanDetailPage";
import ReceptionistVehicleUnitDetailPage from "../pages/receptionist/VehicleUnitDetailPage";
import ReceptionistPromoCodesPage from "../pages/receptionist/promocodes/PromoCodesPage";
import ReceptionistVehicleIncidents from "../pages/receptionist/vehicle_incidents/VehicleIncidents";
import ReceptionistDriverBookings from "../pages/receptionist/driver_bookings/ReceptionistDriverBookings";
import ReceptionistDriverProfilesPage from "../pages/receptionist/driver_profiles/DriverProfilesPage";
import ReceptionistDriverProfileDetailPage from "../pages/receptionist/driver_profiles/ReceptionistDriverProfileDetailPage";
import ReceptionistNotificationsScreen from "../pages/receptionist/notifications/ReceptionistNotificationsScreen";
import AdminExpensesPage from "../pages/admin/expenses/AdminExpensesPage";
import ManagerExpensesPage from "../pages/manager/ManagerExpensesPage";
import ReceptionistExpensesPage from "../pages/receptionist/ReceptionistExpensesPage";
import AdminAccountingPage from "../pages/admin/accounting/AdminAccountingPage";
import ManagerAccountingPage from "../pages/manager/accounting/ManagerAccountingPage";
import ReceptionistAccountingPage from "../pages/receptionist/accounting/ReceptionistAccountingPage";
import ReceptionistProfilePage from "../pages/receptionist/ReceptionistProfilePage";
import ManagerProfilePage from "../pages/manager/ManagerProfilePage";
import StaffCreateReservationPage from "../pages/shared/StaffCreateReservationPage";
import ManagerChatPage from "../pages/manager/chat/ManagerChatPage";
import ReceptionistChatPage from "../pages/receptionist/chat/ReceptionistChatPage";

// driver routes

function App() {
  usePushNotifications();
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Admin routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/roles" element={<RoleSelection/>} />
          <Route path="/signup" element={<SignupScreen/>} />
          <Route path="/login" element={<SignInScreen/>} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/admin-users" element={<UsersPage />} />
          <Route path="/admin/user-profiles/:userId" element={<AdminUserProfilePage />} />
          <Route path="/admin-branches" element={<BranchManagementScreen />} />
          <Route path="/admin/branch/:branchId" element={<BranchDetailPage />} />
          <Route path="/admin-vehicle-models" element={<VehicleModelManagement />} />
          <Route path="/admin-rate-plans" element={<RatePlanScreen />} />
          <Route path="/admin/rate-plan/:planId" element={<RatePlanDetailPage />} />
          <Route path="/admin/vehicle/:vehicleId" element={<VehicleUnitDetailPage />} />
          <Route path="/admin-service-schedules" element={<ServiceScheduleScreen />} />
          <Route path="/admin-service-orders" element={<ServiceOrderScreen />} />
          <Route path="/admin-chats" element={<ChatAdminScreen />} />
          <Route path="/admin-promo-codes" element={<PromoCodeScreen />} />
          <Route path="/admin-vehicles" element={<VehicleUnitManagement />} />
          <Route path="/admin-bookings" element={<Bookings />} />
          <Route path="/admin-customers" element={<Customers />} />
          <Route path="/admin-reservations" element={<AdminReservationsPage />}/>
          <Route path="/admin/reservation/:reservationId" element={<ReservationDetailPage />} />
          <Route path="/admin-vehicle-incidents" element={<AdminVehicleIncidents />} />
          <Route path="/admin-staff" element={<Staff />} />
          <Route path="/admin-driver-profiles" element={<AdminDriverProfiles />} />
          <Route path="/admin-driver-bookings" element={<DriverBookingScreen />}/>
          <Route path="/admin-payments" element={<PaymentsScreen />}/>
          <Route path="/admin-vehicle-trackers" element={<VehicleTrackersScreen />}/>
          <Route path="/admin-notifications" element={<AdminNotificationsScreen />}/>
          <Route path="/admin-reports" element={<AdminReports />}/>
          <Route path="/admin-profile" element={<AdminProfilePage />}/>
          {/* Customer routes */}
          <Route path="/dashboardy" element={<Dashboardy/>} />
          <Route path="/vehicle" element={<Vihicles/>} />
          <Route path="/reservations" element={<Reservation/>} />
          <Route path="/orders" element={<Service/>} />
          <Route path="/profile" element={<Profile/>} />
          <Route path="/driver" element={<Drivers/>} />
          <Route path="/book/:id" element={<CreateReservation/>} />
          <Route path="/reservations/:id" element={<CustomerReservationDetailPage/>} />
          <Route path="/payment/:reservationId" element={<PaymentPage/>} />
          <Route path="/payment/status/:paymentId" element={<PaymentStatusPage/>} />
          <Route path="/chart" element={<ChatScreen/>} />
          <Route path="/notification" element={<NotificationScreen/>} />
          {/* Agent routes */}
          <Route path="/agentdashboard" element={<AgentDashboard/>} />
          <Route path="/agentbook/:id" element={<AgentbookingPage/>} />
          <Route path="/user" element={<UsersListScreen/>} />
          <Route path="/agent" element={<AgentVehicles/>} />
          <Route path="/agentdriver" element={<Agentdrivers/>} />
          <Route path="/agentreservations" element={<AgentReservation/>} />
          <Route path="/agentchart" element={<AgentChatScreen/>} />
          <Route path="/agentprofile" element={<AgentProfile/>} />
          <Route path="/agentnotification" element={<AgentNotification/>} />
          {/* Manager routes */}
          <Route path="/branch-manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-vehicle-models" element={<VehicleModels />}/>
          <Route path="/manager-vehicles" element={<VehicleUnitMngmnt />}/>
          <Route path="/manager-reservations" element={<ManagerReservations />}/>
          <Route path="/manager-users" element={<ManagerUsersPage />} />
          <Route path="/manager-service-orders" element={<ManagerServiceOrder/>} />
          <Route path="/manager-service-schedules" element={<ManagerServiceSchedules />}/>
          <Route path="/manager-rate-plans" element={<RatePlans />}/>
          <Route path="/manager/rate-plan/:planId" element={<ManagerRatePlanDetailPage />}/>
          <Route path="/manager/vehicle/:vehicleId" element={<ManagerVehicleUnitDetailPage />}/>
          <Route path="/manager-promo-codes" element={<PromoCodesPage />}/>
          <Route path="/manager-vehicle-incidents" element={<VehicleIncidents />}/>
          <Route path="/manager-driver-bookings" element={<ManagerDriverBookings />}/>
          <Route path="/manager-driver-profiles" element={<DriverProfilesPage />}/>
          <Route path="/manager/driver-profile/:driverId" element={<ManagerDriverProfileDetailPage />}/>
          <Route path="/manager-notifications" element={<ManagerNotificationsScreen />}/>
          <Route path="/manager-chats" element={<ManagerChatPage />}/>
          <Route path="/manager-profile" element={<ManagerProfilePage />} />
          {/* Receptionist routes */}
          <Route path="/receptionist-dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist-vehicle-models" element={<ReceptionistVehicleModels />} />
          <Route path="/receptionist-vehicles" element={<ReceptionistVehicleUnitMngnt />} />
          <Route path="/receptionist-reservations" element={<ReceptionistReservations />} />
          <Route path="/receptionist-users" element={<ReceptionistUsersPage />} />
          <Route path="/receptionist-service-orders" element={<ReceptionistServiceOrder />} />
          <Route path="/receptionist-service-schedules" element={<ReceptionistServiceSchedules />} />
          <Route path="/receptionist-rate-plans" element={<ReceptionistRatePlans />} />
          <Route path="/receptionist/rate-plan/:planId" element={<ReceptionistRatePlanDetailPage />} />
          <Route path="/receptionist/vehicle/:vehicleId" element={<ReceptionistVehicleUnitDetailPage />} />
          <Route path="/receptionist-promo-codes" element={<ReceptionistPromoCodesPage />} />
          <Route path="/receptionist-vehicle-incidents" element={<ReceptionistVehicleIncidents />} />
          <Route path="/receptionist-driver-bookings" element={<ReceptionistDriverBookings />} />
          <Route path="/receptionist-driver-profiles" element={<ReceptionistDriverProfilesPage />} />
          <Route path="/receptionist/driver-profile/:driverId" element={<ReceptionistDriverProfileDetailPage />} />
          <Route path="/receptionist-notifications" element={<ReceptionistNotificationsScreen />} />
          <Route path="/receptionist-chats" element={<ReceptionistChatPage />} />
          <Route path="/receptionist-expenses" element={<ReceptionistExpensesPage />} />
          <Route path="/receptionist-profile" element={<ReceptionistProfilePage />} />
          {/* Shared staff create reservation */}
          <Route path="/staff/create-reservation" element={<StaffCreateReservationPage />} />
          {/* Expense routes */}
          <Route path="/admin-expenses" element={<AdminExpensesPage />} />
          <Route path="/manager-expenses" element={<ManagerExpensesPage />} />
          {/* Accounting routes */}
          <Route path="/admin-accounting" element={<AdminAccountingPage />} />
          <Route path="/manager-accounting" element={<ManagerAccountingPage />} />
          <Route path="/receptionist-accounting" element={<ReceptionistAccountingPage />} />
          {/* Driver routes */}
          <Route path="/driver-dashboard" element={<DriverDashboard/>} />
          <Route path="/driver/bookings" element={<MyBookings/>} />
          <Route path="/driver/profile" element={<DriverProfileScreen/>} />
             

           



       </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
