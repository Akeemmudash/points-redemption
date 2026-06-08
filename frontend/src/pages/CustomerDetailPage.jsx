import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Edit2, UserX, ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Money } from "@/components/shared/Money";
import { DateText } from "@/components/shared/DateText";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useCustomer } from "@/features/customers/useCustomer";
import { useTransactions } from "@/features/redemptions/useTransactions";
import { useDeactivateCustomer } from "@/features/customers/useDeactivateCustomer";
import { CustomerDialog } from "@/features/customers/CustomerDialog";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const { data: customer, isLoading, isError, error, refetch: refetchCustomer } = useCustomer(id);
  
  const { data: redemptionsData, isLoading: isRedemptionsLoading, isError: isRedemptionsError, error: redemptionsError, refetch: refetchRedemptions } = useTransactions({
    customer_id: id,
    per_page: 50,
  }, {
    enabled: !!id && id !== "new",
  });

  const deactivateMutation = useDeactivateCustomer();
  const redemptions = redemptionsData?.data || [];

  const handleDeactivateConfirm = async () => {
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success("Customer deactivated successfully");
      setDeactivateOpen(false);
      refetchCustomer();
    } catch {
      toast.error("Failed to deactivate customer");
    }
  };

  const handleRetry = () => {
    refetchCustomer();
    refetchRedemptions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <Link to="/customers" className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={handleRetry}>
        {customer && (
          <>
            <PageHeader title={customer.name} description="Review customer point balances and transaction records.">
              <Button
                variant="secondary"
                onClick={() => setDialogOpen(true)}
                className="rounded-lg h-11 active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </Button>
              {customer.status !== "inactive" && (
                <Button
                  variant="destructive"
                  onClick={() => setDeactivateOpen(true)}
                  className="rounded-lg px-5 h-11 active:scale-95"
                >
                  <UserX className="w-4 h-4" />
                  <span>Deactivate</span>
                </Button>
              )}
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-card border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-[13px] font-semibold text-muted-foreground tracking-wide uppercase font-sans">
                    Points Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-[32px] font-display font-semibold text-primary">
                    <Money points={customer.points_balance} />
                  </span>
                </CardContent>
              </Card>

              <Card className="rounded-card border-border bg-card col-span-2">
                <CardHeader>
                  <CardTitle className="text-[13px] font-semibold text-muted-foreground tracking-wide uppercase font-sans">
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">Email address</span>
                    <p className="font-sans text-[15px] font-medium text-foreground">{customer.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">Phone number</span>
                    <p className="font-sans text-[15px] font-medium text-foreground">{customer.phone}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">Account Status</span>
                    <div>
                      <StatusBadge status={customer.status} />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-muted-foreground">Registered on</span>
                    <div className="flex items-center gap-1 text-[15px] text-foreground font-sans">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <DateText value={customer.created_at} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="font-display font-semibold text-xl">Redemptions History</h2>
              <QueryBoundary isLoading={isRedemptionsLoading} isError={isRedemptionsError} error={redemptionsError} onRetry={refetchRedemptions}>
                <div className="border border-border rounded-card overflow-hidden bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 font-semibold">Reference</TableHead>
                        <TableHead className="px-6 font-semibold">Service Type</TableHead>
                        <TableHead className="px-6 font-semibold text-right">Points Deducted</TableHead>
                        <TableHead className="px-6 font-semibold text-right">Amount (₦)</TableHead>
                        <TableHead className="px-6 font-semibold">Status</TableHead>
                        <TableHead className="px-6 font-semibold">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-sans">
                            No redemption transactions logged for this customer.
                          </TableCell>
                        </TableRow>
                      ) : (
                        redemptions.map((redemption) => (
                          <TableRow
                            key={redemption.id}
                            onClick={() => navigate(`/transactions/${redemption.id}`)}
                            className="cursor-pointer hover:bg-secondary/40 transition-colors"
                          >
                            <TableCell className="px-6 py-4 font-medium font-sans text-foreground">
                              {redemption.payment_reference}
                            </TableCell>
                            <TableCell className="px-6 py-4 font-sans text-muted-foreground capitalize">
                              {redemption.service_type?.replace("_", " ")}
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right font-medium">
                              <Money points={redemption.points_deducted} />
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right font-medium">
                              <Money kobo={redemption.amount} />
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <StatusBadge status={redemption.status} />
                            </TableCell>
                            <TableCell className="px-6 py-4 text-muted-foreground">
                              <DateText value={redemption.created_at} relative />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </QueryBoundary>
            </div>

            <CustomerDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              customer={customer}
            />

            <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
              <DialogContent className="sm:max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="font-display font-semibold text-lg">Deactivate Customer</DialogTitle>
                  <DialogDescription className="font-sans">
                    Are you sure you want to deactivate {customer.name}? This action cannot be undone.
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
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
