import { AdminLayout } from "@/components/admin/AdminLayout";
import { UserManagement } from "@/components/admin/UserManagement";

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View, search, and manage all users</p>
        </div>
        <UserManagement />
      </div>
    </AdminLayout>
  );
}
