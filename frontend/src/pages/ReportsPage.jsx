import { useState } from "react";
import { Download, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Money } from "@/components/shared/Money";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useReportSummary } from "@/features/reports/useReportSummary";
import { useExportCsv } from "@/features/reports/useExportCsv";
import { useCustomers } from "@/features/customers/useCustomers";

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [customerIdFilter, setCustomerIdFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const customersQuery = useCustomers({ perPage: 100 });
  const activeCustomers = customersQuery.data?.data || [];

  const params = {
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(serviceTypeFilter !== "all" ? { service_type: serviceTypeFilter } : {}),
    ...(customerIdFilter !== "all" ? { customer_id: parseInt(customerIdFilter, 10) } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data: summaryData, isLoading, isError, error, refetch } = useReportSummary(params);
  const exportMutation = useExportCsv();

  const summary = summaryData?.data || {};

  const handleExportCsv = async () => {
    try {
      await exportMutation.mutateAsync(params);
      toast.success("CSV export initiated");
    } catch {
      toast.error("Failed to export report CSV");
    }
  };

  const handleClearFilters = () => {
    setStatusFilter("all");
    setServiceTypeFilter("all");
    setCustomerIdFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate aggregate summaries and download point transaction reports.">
        <Button 
          onClick={handleExportCsv} 
          disabled={exportMutation.isPending}
          className="rounded-full px-5 h-11 active:scale-95 text-[15px]"
        >
          <Download className="w-4 h-4 mr-2" />
          <span>Export CSV</span>
        </Button>
      </PageHeader>

      <div className="space-y-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={customerIdFilter} onValueChange={setCustomerIdFilter}>
            <SelectTrigger className="w-[220px] h-11 rounded-lg">
              <span className="text-muted-foreground mr-1">Customer:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All</SelectItem>
              {activeCustomers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11 rounded-lg">
              <span className="text-muted-foreground mr-1">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger className="w-[200px] h-11 rounded-lg">
              <span className="text-muted-foreground mr-1">Service:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="airtime">Airtime Purchase</SelectItem>
              <SelectItem value="data">Data Bundle</SelectItem>
              <SelectItem value="electricity">Electricity Bill</SelectItem>
              <SelectItem value="cable_tv">Cable TV</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-sans">From:</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-11 rounded-lg border-border bg-background px-3 text-[14px] w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-sans">To:</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-11 rounded-lg border-border bg-background px-3 text-[14px] w-[160px]"
            />
          </div>

          {(statusFilter !== "all" || serviceTypeFilter !== "all" || customerIdFilter !== "all" || fromDate || toDate) && (
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="h-11 rounded-lg px-4 text-sm active:scale-95 text-primary hover:bg-secondary/50"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <QueryBoundary isLoading={isLoading || customersQuery.isLoading} isError={isError} error={error} onRetry={refetch}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-card border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Filtered Transactions</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-display tracking-tight">
                {summary.total_transactions || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Transactions matching parameters</p>
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
              <p className="text-xs text-muted-foreground mt-1">Pending reconciliation</p>
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
              <p className="text-xs text-muted-foreground mt-1">Refunded points</p>
            </CardContent>
          </Card>
        </div>
      </QueryBoundary>
    </div>
  );
}
