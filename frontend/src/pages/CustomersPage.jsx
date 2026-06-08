import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Edit2, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Money } from "@/components/shared/Money";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useCustomers } from "@/features/customers/useCustomers";
import { useDeactivateCustomer } from "@/features/customers/useDeactivateCustomer";
import { CustomerDialog } from "@/features/customers/CustomerDialog";

export default function CustomersPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [customerToDeactivate, setCustomerToDeactivate] = useState(null);

  const deactivateMutation = useDeactivateCustomer();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const params = {
    page,
    perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useCustomers(params);
  
  const customers = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta.last_page || 1;

  const handleCreate = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer, e) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDeactivate = (customer, e) => {
    e.stopPropagation();
    setCustomerToDeactivate(customer);
    setDeactivateOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!customerToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync(customerToDeactivate.id);
      toast.success("Customer deactivated successfully");
      setDeactivateOpen(false);
    } catch {
      toast.error("Failed to deactivate customer");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Manage user loyalty accounts and points status.">
        <Button onClick={handleCreate} className="rounded-full px-5 h-11 active:scale-95 text-[15px]">
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name or email..."
            className="pl-11 pr-4 h-11 rounded-full w-full bg-background"
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-11 rounded-lg">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <div className="border border-border rounded-card overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 font-semibold">Name</TableHead>
                <TableHead className="px-6 font-semibold">Email</TableHead>
                <TableHead className="px-6 font-semibold">Phone</TableHead>
                <TableHead className="px-6 font-semibold text-right">Points Balance</TableHead>
                <TableHead className="px-6 font-semibold">Status</TableHead>
                <TableHead className="px-6 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-sans">
                    No customers found matching the search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="cursor-pointer hover:bg-secondary/40 transition-colors"
                  >
                    <TableCell className="px-6 py-4 font-medium text-foreground">{customer.name}</TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">{customer.email}</TableCell>
                    <TableCell className="px-6 py-4 text-muted-foreground">{customer.phone}</TableCell>
                    <TableCell className="px-6 py-4 text-right font-medium">
                      <Money points={customer.points_balance} />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <StatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(customer, e)}
                          className="h-9 w-9 rounded-lg hover:bg-secondary active:scale-95"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {customer.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDeactivate(customer, e)}
                            className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95"
                          >
                            <UserX className="w-4 h-4" />
                            <span className="sr-only">Deactivate</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] text-muted-foreground">
              Page {page} of {totalPages} ({meta.total || 0} total customers)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg h-9 active:scale-95"
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg h-9 active:scale-95"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </QueryBoundary>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
      />

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-display font-semibold text-lg">Deactivate Customer</DialogTitle>
            <DialogDescription className="font-sans">
              Are you sure you want to deactivate {customerToDeactivate?.name}? They will no longer be able to redeem points.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeactivateOpen(false)}
              className="rounded-lg h-11 active:scale-95"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivateConfirm}
              className="rounded-lg px-5 h-11 active:scale-95"
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
