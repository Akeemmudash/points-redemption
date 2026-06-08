import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Money } from "@/components/shared/Money";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DateText } from "@/components/shared/DateText";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useReportSummary } from "@/features/reports/useReportSummary";
import { useTransactions } from "@/features/redemptions/useTransactions";

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError, error: summaryError, refetch: refetchSummary } = useReportSummary({});
  const { data: transactionsData, isLoading: isTransactionsLoading, isError: isTransactionsError, error: transactionsError, refetch: refetchTransactions } = useTransactions({
    page: 1,
    per_page: 5,
  });

  const summary = summaryData?.data || {};
  const recentTransactions = transactionsData?.data || [];

  const handleRetryAll = () => {
    refetchSummary();
    refetchTransactions();
  };

  const hasErrors = isSummaryError || isTransactionsError;
  const anyError = summaryError || transactionsError;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        description="Overview of point redemptions, system health, and transaction statuses."
      >
        <Button asChild className="rounded-full px-5 h-11 active:scale-95 text-[15px]">
          <Link to="/redemptions/new">
            <span>New Redemption</span>
          </Link>
        </Button>
      </PageHeader>

      <QueryBoundary 
        isLoading={isSummaryLoading || isTransactionsLoading} 
        isError={hasErrors} 
        error={anyError} 
        onRetry={handleRetryAll}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Transactions</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight">
                {summary.total_transactions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total point redemptions attempted</p>
            </CardContent>
          </Card>

          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-status-success uppercase tracking-wider">Successful</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-status-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight text-status-success">
                {summary.total_successful || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Completed successfully</p>
            </CardContent>
          </Card>

          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-status-pending uppercase tracking-wider">Pending</CardTitle>
              <Clock className="w-4 h-4 text-status-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight text-status-pending">
                {summary.total_pending || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting reconciliation sweep</p>
            </CardContent>
          </Card>

          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-status-failed uppercase tracking-wider">Failed</CardTitle>
              <XCircle className="w-4 h-4 text-status-failed" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight text-status-failed">
                {summary.total_failed || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Failed utility charges</p>
            </CardContent>
          </Card>

          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Points Deducted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight text-primary">
                <Money points={summary.total_points_deducted} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net customer points charged</p>
            </CardContent>
          </Card>

          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Points Reversed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight text-destructive">
                <Money points={summary.total_points_reversed} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Refunded due to failed transactions</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display">Recent Transactions</h2>
            <Button asChild variant="ghost" className="rounded-lg text-primary text-sm hover:bg-secondary/50 active:scale-95">
              <Link to="/transactions">
                <span>View All</span>
                <ArrowRight className="w-4 h-4 ml-1 inline-block" />
              </Link>
            </Button>
          </div>

          <div className="border border-border rounded-card overflow-hidden bg-card w-full max-w-full min-w-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 font-semibold">Reference</TableHead>
                    <TableHead className="px-6 font-semibold">Customer</TableHead>
                    <TableHead className="px-6 font-semibold">Service Type</TableHead>
                    <TableHead className="px-6 font-semibold text-right">Points</TableHead>
                    <TableHead className="px-6 font-semibold text-right">Value</TableHead>
                    <TableHead className="px-6 font-semibold">Status</TableHead>
                    <TableHead className="px-6 font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-sans">
                        No transactions registered yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => navigate(`/transactions/${t.id}`)}
                        className="cursor-pointer hover:bg-secondary/40 transition-colors"
                      >
                        <TableCell className="px-6 py-3.5 font-mono font-medium text-foreground text-[14px]">
                          {t.payment_reference}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 font-medium text-foreground">
                          {t.customer?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 capitalize text-muted-foreground">
                          {t.service_type?.replace("_", " ")}
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right font-medium">
                          <Money points={t.points_deducted} />
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right font-semibold">
                          <Money kobo={t.amount} />
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <DateText value={t.created_at} relative />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </QueryBoundary>
    </div>
  );
}
