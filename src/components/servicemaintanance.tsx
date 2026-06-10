import { useState } from 'react';
import { 
  Wrench, 
  History, 
  CalendarDays, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  FileText,
  Gauge,
  Calendar,
  MessageSquare,
  User,
  Repeat,
  TrendingUp,
  Car,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import type { Vehicle, ServiceOrder, ServiceSchedule } from '../servicetypes';

interface Props {
  vehicle: Vehicle;
  serviceOrders: ServiceOrder[];
  serviceSchedules: ServiceSchedule[];
  loadingServiceOrders: boolean;
  loadingServiceSchedules: boolean;
  formatDate: (dateString: string) => string;
}

const ServiceMaintenanceSection = ({
  vehicle,
  serviceOrders,
  serviceSchedules,
  loadingServiceOrders,
  loadingServiceSchedules}: Props) => {
  const [activeTab, setActiveTab] = useState<'history' | 'schedules'>('history');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedScheduleId, setExpandedScheduleId] = useState<string | null>(null);

  const getScheduleStatus = (schedule: ServiceSchedule) => {
    const nextDueDate = schedule.next_due_at ? new Date(schedule.next_due_at) : null;
    const now = new Date();
    
    if (nextDueDate && nextDueDate < now) {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        label: 'Overdue'
      };
    } else if (nextDueDate && nextDueDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      return {
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: Clock,
        label: 'Due Soon'
      };
    } else {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Scheduled'
      };
    }
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        full: date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        iso: dateString
      };
    } catch {
      return null;
    }
  };

  const calculateDaysUntilDue = (dueDate: string | undefined) => {
    if (!dueDate) return null;
    try {
      const due = new Date(dueDate);
      const now = new Date();
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  // Helper function to safely access vehicle properties
  const getVehicleOdometer = () => {
    return vehicle?.odometer_km || 0;
  };

  const toggleHistoryExpansion = (id: string) => {
    setExpandedHistoryId(expandedHistoryId === id ? null : id);
  };

  const toggleScheduleExpansion = (id: string) => {
    setExpandedScheduleId(expandedScheduleId === id ? null : id);
  };

  const formatId = (id: string | undefined) => {
    if (!id) return 'N/A';
    return `${id.substring(0, 12)}...${id.substring(id.length - 6)}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Wrench className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <span className="truncate">Service History & Maintenance</span>
          </h3>
          <p className="text-gray-600">
            Comprehensive service records and scheduled maintenance for this vehicle
          </p>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 flex-wrap">
          <span className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-600 text-sm font-semibold rounded-full border border-blue-200 whitespace-nowrap">
            {serviceOrders?.length || 0} Service Records
          </span>
          <span className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 text-sm font-semibold rounded-full border border-purple-200 whitespace-nowrap">
            {serviceSchedules?.length || 0} Scheduled Services
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 lg:px-6 py-3 font-semibold text-base lg:text-lg transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <History className="w-5 h-5 flex-shrink-0" />
          Service History
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex items-center gap-2 px-4 lg:px-6 py-3 font-semibold text-base lg:text-lg transition-all whitespace-nowrap ${
            activeTab === 'schedules'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CalendarDays className="w-5 h-5 flex-shrink-0" />
          Upcoming Services
        </button>
      </div>

      {/* Service History Tab */}
      {activeTab === 'history' && (
        <>
          {loadingServiceOrders ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <span className="text-gray-600 font-medium">Loading service history...</span>
            </div>
          ) : !serviceOrders || serviceOrders.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-2xl font-bold text-gray-700 mb-3">No Service History</h4>
              <p className="text-gray-600 max-w-md mx-auto text-lg">
                This vehicle has no recorded service history. All maintenance is up-to-date.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {serviceOrders.map((order) => {
                const createdAt = order.created_at ? formatDateTime(order.created_at) : null;
                const updatedAt = order.updated_at ? formatDateTime(order.updated_at) : null;
                const isExpanded = expandedHistoryId === order._id;
                
                return (
                  <div 
                    key={order._id} 
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    {/* Header with Expand Button */}
                    <div className="flex items-start justify-between mb-6 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                            <Calendar className="w-4 h-4" />
                            <span>{createdAt?.date || 'No date'}</span>
                          </div>
                        </div>
                        <h4 className="text-lg lg:text-xl font-bold text-gray-900 truncate">
                          Service Record #{order._id?.substring(0, 8).toUpperCase() || 'N/A'}
                        </h4>
                        <p className="text-gray-600 text-sm mt-1">
                          Vehicle: {vehicle?.license_plate || 'N/A'} • {vehicle?.make || ''} {vehicle?.model || ''}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleHistoryExpansion(order._id!)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <span className="font-medium">{isExpanded ? 'Show Less' : 'Show Details'}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`${isExpanded ? 'block' : 'hidden'} space-y-6`}>
                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Odometer */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 truncate">Odometer</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 break-all">
                            {order.odometer_km?.toLocaleString() || '0'} km
                          </p>
                        </div>

                        {/* Created Date */}
                        {createdAt && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Created</span>
                            </div>
                            <p className="font-bold text-gray-900 truncate">{createdAt.date}</p>
                            <p className="text-sm text-gray-600 truncate">{createdAt.time}</p>
                          </div>
                        )}

                        {/* Updated Date */}
                        {updatedAt && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Last Updated</span>
                            </div>
                            <p className="font-bold text-gray-900 truncate">{updatedAt.date}</p>
                            <p className="text-sm text-gray-600 truncate">{updatedAt.time}</p>
                          </div>
                        )}

                        {/* Performed By */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 truncate">Performed By</span>
                          </div>
                          <p className="font-bold text-gray-900 truncate">
                            {order.performed_by || 'Not Assigned'}
                          </p>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {order.notes && (
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border-2 border-blue-100">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <h5 className="font-semibold text-gray-900">Service Notes</h5>
                                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded">
                                  Technician Notes
                                </span>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                  {order.notes}
                                </p>
                              </div>
                              {order.created_by && (
                                <p className="text-sm text-gray-500 mt-3">
                                  Logged by: <span className="font-medium">{order.created_by}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium flex-shrink-0">Service ID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all min-w-0">
                              {formatId(order._id)}
                            </code>
                            <button 
                              onClick={() => navigator.clipboard.writeText(order._id || '')}
                              className="text-blue-500 hover:text-blue-700 ml-1"
                              title="Copy ID"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium flex-shrink-0">Vehicle ID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all min-w-0">
                              {formatId(order.vehicle_id)}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Service Schedules Tab */}
      {activeTab === 'schedules' && (
        <>
          {loadingServiceSchedules ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
              <span className="text-gray-600 font-medium">Loading service schedules...</span>
            </div>
          ) : !serviceSchedules || serviceSchedules.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <CalendarDays className="w-12 h-12 text-gray-400" />
              </div>
              <h4 className="text-2xl font-bold text-gray-700 mb-3">No Scheduled Services</h4>
              <p className="text-gray-600 max-w-md mx-auto text-lg">
                This vehicle has no scheduled maintenance. All service intervals are up-to-date.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {serviceSchedules.map((schedule) => {
                const created = schedule.created_at ? formatDateTime(schedule.created_at) : null;
                const updated = schedule.updated_at ? formatDateTime(schedule.updated_at) : null;
                const nextDue = schedule.next_due_at ? formatDateTime(schedule.next_due_at) : null;
                const daysUntilDue = schedule.next_due_at ? calculateDaysUntilDue(schedule.next_due_at) : null;
                const statusInfo = getScheduleStatus(schedule);
                const currentOdometer = getVehicleOdometer();
                const isExpanded = expandedScheduleId === schedule._id;
                
                return (
                  <div 
                    key={schedule._id} 
                    className="border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    {/* Header with Status and Expand Button */}
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 border ${statusInfo.color} whitespace-nowrap`}>
                            <statusInfo.icon className="w-4 h-4 flex-shrink-0" />
                            {statusInfo.label}
                          </span>
                          {nextDue && daysUntilDue !== null && (
                            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
                              daysUntilDue < 0 
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : daysUntilDue <= 30
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {daysUntilDue < 0 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : `Due in ${daysUntilDue} days`
                              }
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg lg:text-xl font-bold text-gray-900 truncate">
                          Scheduled Maintenance
                        </h4>
                        {schedule.description && (
                          <p className="text-gray-600 text-sm mt-1 truncate">
                            {schedule.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {/* Next Due Info */}
                        {nextDue && (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 whitespace-nowrap ${
                            daysUntilDue !== null && daysUntilDue < 0 
                              ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' 
                              : daysUntilDue !== null && daysUntilDue <= 30
                              ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                              : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                          }`}>
                            <Calendar className={`w-5 h-5 flex-shrink-0 ${
                              daysUntilDue !== null && daysUntilDue < 0 
                                ? 'text-red-600' 
                                : daysUntilDue !== null && daysUntilDue <= 30
                                ? 'text-amber-600'
                                : 'text-blue-600'
                            }`} />
                            <div>
                              <p className="font-bold text-gray-900">{nextDue.date}</p>
                              <p className="text-xs text-gray-600">{nextDue.time}</p>
                            </div>
                          </div>
                        )}
                        
                        <button
                          onClick={() => toggleScheduleExpansion(schedule._id!)}
                          className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <span className="font-medium hidden sm:inline">
                            {isExpanded ? 'Less' : 'More'}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    <div className={`${isExpanded ? 'block' : 'hidden'} space-y-6`}>
                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Interval Days */}
                        {schedule.interval_days && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Interval (Days)</span>
                            </div>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                              {schedule.interval_days}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 truncate">Every {schedule.interval_days} days</p>
                          </div>
                        )}

                        {/* Interval KM */}
                        {schedule.interval_km && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Repeat className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Interval (KM)</span>
                            </div>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                              {schedule.interval_km?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 truncate">Every {schedule.interval_km?.toLocaleString()} km</p>
                          </div>
                        )}

                        {/* Next Due Odo */}
                        {schedule.next_due_odo && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-100">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Next Due Odometer</span>
                            </div>
                            <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                              {schedule.next_due_odo?.toLocaleString()} km
                            </p>
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {currentOdometer > 0 && `Current: ${currentOdometer.toLocaleString()} km`}
                            </p>
                          </div>
                        )}

                        {/* Vehicle Model */}
                        {schedule.vehicle_model_id && (
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Car className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              <span className="text-sm font-semibold text-gray-700 truncate">Model ID</span>
                            </div>
                            <p className="font-bold text-gray-900 text-lg break-all">
                              {schedule.vehicle_model_id}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">Vehicle Model</p>
                          </div>
                        )}
                      </div>

                      {/* Dates Grid */}
                      {(created || updated || nextDue) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          {/* Created At */}
                          {created && (
                            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-gray-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-700 truncate">Created</span>
                              </div>
                              <p className="font-bold text-gray-900 truncate">{created.date}</p>
                              <p className="text-sm text-gray-600 truncate">{created.time}</p>
                            </div>
                          )}

                          {/* Updated At */}
                          {updated && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-700 truncate">Last Updated</span>
                              </div>
                              <p className="font-bold text-gray-900 truncate">{updated.date}</p>
                              <p className="text-sm text-gray-600 truncate">{updated.time}</p>
                            </div>
                          )}

                          {/* Next Due */}
                          {nextDue && (
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border-2 border-cyan-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-700 truncate">Next Due Date</span>
                              </div>
                              <p className="font-bold text-gray-900 truncate">{nextDue.date}</p>
                              <p className="text-sm text-gray-600 truncate">{nextDue.time}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Section */}
                      {schedule.notes && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <h5 className="font-semibold text-gray-900">Maintenance Notes</h5>
                                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-1 rounded whitespace-nowrap">
                                  Important Information
                                </span>
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                                  {schedule.notes}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium flex-shrink-0">Schedule ID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all min-w-0">
                              {formatId(schedule._id)}
                            </code>
                            <button 
                              onClick={() => navigator.clipboard.writeText(schedule._id || '')}
                              className="text-blue-500 hover:text-blue-700 ml-1"
                              title="Copy ID"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium flex-shrink-0">Vehicle ID:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs break-all min-w-0">
                              {formatId(schedule.vehicle_id)}
                            </code>
                          </div>
                          {schedule.__v !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">Version:</span>
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                                v{schedule.__v}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServiceMaintenanceSection;