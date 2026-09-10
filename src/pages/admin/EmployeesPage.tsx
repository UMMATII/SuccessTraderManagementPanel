import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEmployeeStore } from '@/store/employeeStore';
import { employeeService } from '@/services/employeeService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { StatusBadge } from '@/components/ui/Badge';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEmployeeSchema,
  editEmployeeSchema,
  type CreateEmployeeFormData,
  type EditEmployeeFormData,
} from '@/types/forms';
import type { ProfileWithStats } from '@/types/models';
import {
  UserPlus,
  Search,
  KeyRound,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

export function EmployeesPage() {
  const {
    employees,
    isLoading,
    searchQuery,
    statusFilter,
    fetchEmployees,
    setSearchQuery,
    setStatusFilter,
    toggleStatus,
  } = useEmployeeStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<ProfileWithStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form for creating employee
  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      status: 'ACTIVE',
      joining_date: new Date().toISOString().split('T')[0],
    },
  });

  // Form for editing employee
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onCreateEmployee = async (data: CreateEmployeeFormData) => {
    try {
      setIsSubmitting(true);
      const res = await employeeService.createEmployee(data);
      if (res.success) {
        toast.success(`Trader account ${data.employee_id} created successfully!`);
        resetCreate();
        setCreateModalOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || 'Failed to create employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditEmployee = async (data: EditEmployeeFormData) => {
    if (!selectedEmployee) return;
    try {
      setIsSubmitting(true);
      const res = await employeeService.updateEmployee(selectedEmployee.id, data);
      if (res.success) {
        toast.success('Employee updated successfully');
        setEditModalOpen(false);
        fetchEmployees();
      } else {
        toast.error(res.error || 'Failed to update employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (emp: ProfileWithStats) => {
    setSelectedEmployee(emp);
    setEditValue('name', emp.name);
    setEditValue('status', emp.status);
    setEditValue('joining_date', emp.joining_date);
    setEditValue('avatar_url', emp.avatar_url || '');
    setEditModalOpen(true);
  };

  const handlePasswordReset = async (emp: ProfileWithStats) => {
    const email = `${emp.employee_id.toLowerCase()}@successtraders.com`;
    const res = await employeeService.sendEmployeePasswordReset(email);
    if (res.success) {
      toast.success(`Password reset link dispatched for ${emp.name}`);
    } else {
      toast.error(res.error || 'Failed to dispatch reset link');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Trader Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage trader accounts, credentials, statuses, and performance overviews
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          variant="primary"
          size="sm"
          className="shadow-md"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add New Trader
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by trader name or ID (e.g. EMP-101)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="w-full sm:w-44">
          <Select
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active Only' },
              { value: 'INACTIVE', label: 'Inactive Only' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          />
        </div>
      </div>

      {/* Employees Data Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-slate-500" />}
          title="No Traders Found"
          description={
            searchQuery
              ? `No trader matched "${searchQuery}". Try clearing filters.`
              : 'No trader profiles have been added yet.'
          }
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
            >
              Add First Trader
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trader</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Today's Attendance</TableHead>
              <TableHead>Today's Tasks</TableHead>
              <TableHead>Monthly Points</TableHead>
              <TableHead>Working Hours</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-300">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        emp.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <Link
                        to={`/admin/employees/${emp.id}`}
                        className="font-semibold text-slate-200 hover:text-emerald-400 transition-colors"
                      >
                        {emp.name}
                      </Link>
                      <p className="text-[10px] text-slate-400">{emp.employee_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={emp.status} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={emp.todayAttendance || 'NOT_MARKED'} />
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-200">{emp.todayTasksCount || 0}</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-amber-400">{emp.monthlyPoints || 0} pts</span>
                </TableCell>
                <TableCell>
                  <span className="text-slate-300">{emp.monthlyWorkingHours || 0}h</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-slate-300">#{emp.rank || '--'}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link to={`/admin/employees/${emp.id}`}>
                      <button
                        title="View Details"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => openEditModal(emp)}
                      title="Edit Profile"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePasswordReset(emp)}
                      title="Reset Password"
                      className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(emp.id, emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                      title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded hover:bg-slate-800 ${emp.status === 'ACTIVE' ? 'text-slate-400 hover:text-rose-400' : 'text-slate-400 hover:text-emerald-400'}`}
                    >
                      {emp.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* CREATE EMPLOYEE MODAL */}
      <Dialog
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Trader"
        description="Create credentials and profile for a new Success Trader team member"
      >
        <form onSubmit={handleCreateSubmit(onCreateEmployee)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Employee ID"
              placeholder="e.g. EMP-105"
              error={createErrors.employee_id?.message}
              {...registerCreate('employee_id')}
            />
            <Input
              label="Full Name"
              placeholder="Trader Name"
              error={createErrors.name?.message}
              {...registerCreate('name')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="trader@successtraders.com"
            error={createErrors.email?.message}
            {...registerCreate('email')}
          />

          <Input
            label="Temporary Password"
            type="password"
            placeholder="At least 8 characters"
            helperText="Employee will use this to sign in initially"
            error={createErrors.temporaryPassword?.message}
            {...registerCreate('temporaryPassword')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Joining Date"
              type="date"
              error={createErrors.joining_date?.message}
              {...registerCreate('joining_date')}
            />
            <Select
              label="Initial Status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              {...registerCreate('status')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </div>
        </form>
      </Dialog>

      {/* EDIT EMPLOYEE MODAL */}
      <Dialog
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Trader Profile"
        description={`Updating details for ${selectedEmployee?.employee_id}`}
      >
        <form onSubmit={handleEditSubmit(onEditEmployee)} className="space-y-4">
          <Input
            label="Full Name"
            error={editErrors.name?.message}
            {...registerEdit('name')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Joining Date"
              type="date"
              {...registerEdit('joining_date')}
            />
            <Select
              label="Status"
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
              {...registerEdit('status')}
            />
          </div>

          <AvatarUpload
            label="Trader Profile Photo"
            name={selectedEmployee?.name || 'Trader'}
            userId={selectedEmployee?.id}
            value={watchEdit('avatar_url')}
            onChange={(url) => setEditValue('avatar_url', url, { shouldValidate: true })}
            size="md"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
