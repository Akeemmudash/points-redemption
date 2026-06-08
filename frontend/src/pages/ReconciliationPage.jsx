import { useState } from "react";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateText } from "@/components/shared/DateText";
import { Money } from "@/components/shared/Money";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTransactions } from "@/features/redemptions/useTransactions";
import { useReconcile } from "@/features/reconciliation/useReconcile";

export default function ReconciliationPage() {
  const navigate = useNavigate();
  const [lastResult, setLastResult] = useState(null);

  const { data, isLoading, isError, error, refetch } = useTransactions({
    status: "pending",
    per_page: 50,
  });

  const reconcileMutation = useReconcile();
  const pendingTransactions = data?.data || [];
  const pendingCount = data?.meta?.total ?? pendingTransactions.length;

  const handleReconcile = async () => {
    try {
      const result = await reconcileMutation.mutateAsync();
      setLastResult(result);
      refetch();
      if (result.queued === 0) {
        toast.info("No eligible pending transactions to reconcile.");
      } else {
        toast.success(`Queued ${result.queued} transaction(s) for reconciliation.`);
      }
    } catch {
      toast.error("Reconciliation run failed.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reconciliation"
        description="Requery pending transactions against the billing network and update their final status."
      >
        <Button
          onClick={handleReconcile}
          disabled={reconcileMutation.isPending}
          className="rounded-full px-5 h-11 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${reconcileMutation.isPending ? "animate-spin" : ""}`} />
          {reconcileMutation.isPending ? "Running…" : "Run Reconciliation"}
        </Button>
      </PageHeader>

      {lastResult && (
        <Card className="rounded-card border-border">
          <CardContent className="py-4 flex items-center gap-3 text-sm font-sans">
            <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
            <span>
              Last run queued <strong>{lastResult.queued}</strong> pending transaction(s) for reconciliation.
            </span>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold font-display">
          Pending Transactions
          {!isLoading && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({pendingCount})</span>
          )}
        </h2>

        <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
          <div className="border border-border rounded-card overflow-hidden bg-card w-full">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-semibold">Reference</TableHead>
                    <TableHead className="px-6 font-semibold">Customer</TableHead>
                    <TableHead className="px-6 font-semibold">Service</TableHead>
                    <TableHead className="px-6 font-semibold text-right">Points</TableHead>
                    <TableHead className="px-6 font-semibold text-right">Value</TableHead>
                    <TableHead className="px-6 font-semibold text-right">Requery Attempts</TableHead>
                    <TableHead className="px-6 font-semibold">Created</TableHead>
                    <TableHead className="px-6 font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-48 text-center text-muted-foreground font-sans">
                        No pending transactions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTransactions.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => navigate(`/transactions/${t.id}`)}
                        className="cursor-pointer hover:bg-secondary/40 transition-colors"
                      >
                        <TableCell className="px-6 py-4 font-mono text-[14px] font-medium">
                          {t.payment_reference}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{t.customer?.name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{t.customer?.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 capitalize text-muted-foreground">
                          {t.service_type?.replace("_", " ")}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-medium">
                          <Money points={t.points_deducted} />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right font-semibold">
                          <Money kobo={t.amount} />
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right text-muted-foreground">
                          {t.requery_attempts}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <DateText value={t.created_at} relative />
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <StatusBadge status={t.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </QueryBoundary>
      </div>
    </div>
  );
}
