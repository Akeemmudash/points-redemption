import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Clock, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Money } from "@/components/shared/Money";
import { DateText } from "@/components/shared/DateText";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransaction } from "@/features/redemptions/useTransaction";
import { useReconcile } from "@/features/reconciliation/useReconcile";

export default function TransactionDetailPage() {
  const { id } = useParams();
  
  const { data: transaction, isLoading, isError, error, refetch } = useTransaction(id);
  const reconcileMutation = useReconcile();

  const handleReconcile = async () => {
    try {
      await reconcileMutation.mutateAsync();
      toast.success("Reconciliation run completed successfully");
      refetch();
    } catch {
      toast.error("Failed to run reconciliation");
    }
  };

  const logs = transaction?.logs || [];
  const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const getLogDotColor = (log) => {
    const status = log.to_status;
    if (status === "successful") return "bg-status-success border-status-success";
    if (status === "failed") return "bg-status-failed border-status-failed";
    if (status === "pending") return "bg-status-pending border-status-pending";
    return "bg-muted-foreground/60 border-muted-foreground/60";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="rounded-lg h-9 active:scale-95 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Link to="/transactions">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Transactions</span>
          </Link>
        </Button>
      </div>

      <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        {transaction && (
          <div className="space-y-6">
            <PageHeader 
              title={`Ref: ${transaction.payment_reference}`}
              description="View transaction details and verification logs."
            >
              <div className="flex items-center gap-3">
                <StatusBadge status={transaction.status} />
                
                {transaction.status === "pending" && (
                  <Button
                    onClick={handleReconcile}
                    disabled={reconcileMutation.isPending}
                    className="rounded-full px-5 h-11 active:scale-95 text-[15px]"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
                    <span>Run Reconciliation</span>
                  </Button>
                )}
              </div>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="rounded-card border-border bg-card md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 font-sans text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Customer</span>
                    {transaction.customer ? (
                      <Link 
                        to={`/customers/${transaction.customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {transaction.customer.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <span className="text-xs text-muted-foreground block">{transaction.customer?.email}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Service Type</span>
                    <span className="font-semibold text-foreground capitalize">
                      {transaction.service_type?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Points Deducted</span>
                    <span className="font-bold text-foreground">
                      <Money points={transaction.points_deducted} />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Value (Naira)</span>
                    <span className="font-bold text-foreground">
                      <Money kobo={transaction.amount} />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Requery Attempts</span>
                    <span className="font-medium text-foreground">
                      {transaction.requery_attempts}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block text-xs">Last Requery At</span>
                    <span className="font-medium text-foreground">
                      <DateText value={transaction.last_requery_at} relative />
                    </span>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-muted-foreground block text-xs">Created At</span>
                    <span className="font-medium text-foreground">
                      <DateText value={transaction.created_at} relative />
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-card border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Audit Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground font-sans">
                      <Clock className="w-8 h-8 mb-2 opacity-45" />
                      <span className="text-sm">No verification logs available.</span>
                    </div>
                  ) : (
                    <div className="relative border-l border-border pl-6 space-y-6 py-2 ml-3">
                      {sortedLogs.map((log) => (
                        <div key={log.id} className="relative font-sans text-sm">
                          <span 
                            className={`absolute left-[-31px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background ${getLogDotColor(log)}`} 
                          />
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">
                              {log.action}
                            </span>
                            
                            {log.from_status && log.to_status && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-0.5">
                                <span className="capitalize">{log.from_status}</span>
                                <span>→</span>
                                <span className="capitalize text-foreground font-medium">{log.to_status}</span>
                              </div>
                            )}

                            {log.context && (
                              <div className="bg-secondary/40 text-[12px] text-muted-foreground p-2 rounded-lg my-1 font-mono break-all leading-normal">
                                {typeof log.context === "object" 
                                  ? JSON.stringify(log.context) 
                                  : String(log.context)}
                              </div>
                            )}

                            <span className="text-xs text-muted-foreground block pt-0.5">
                              <DateText value={log.created_at} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
