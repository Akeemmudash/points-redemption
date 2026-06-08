import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Money } from "@/components/shared/Money";
import { DateText } from "@/components/shared/DateText";
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
import { useTransactions } from "@/features/redemptions/useTransactions";

export default function TransactionsPage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const params = {
    page,
    per_page: perPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(serviceTypeFilter !== "all" ? { service_type: serviceTypeFilter } : {}),
    ...(fromDate ? { from: fromDate } : {}),
    ...(toDate ? { to: toDate } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useTransactions(params);

  const transactions = data?.data || [];
  const meta = data?.meta || {};
  const totalPages = meta.last_page || 1;

  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setServiceTypeFilter("all");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="View customer points redemption transactions and audit trails." />

      <div className="space-y-4 py-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, name or email..."
              className="pl-11 pr-4 h-11 rounded-full w-full bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
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

            <Select value={serviceTypeFilter} onValueChange={(val) => { setServiceTypeFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[240px] h-11 rounded-lg">
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
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-sans">From:</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              className="h-11 rounded-lg border-border bg-background px-3 text-[14px] w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-sans">To:</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              className="h-11 rounded-lg border-border bg-background px-3 text-[14px] w-[160px]"
            />
          </div>

          {(statusFilter !== "all" || serviceTypeFilter !== "all" || fromDate || toDate || searchTerm) && (
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

      <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <div className="border border-border rounded-card overflow-hidden bg-card w-full max-w-full min-w-0">
          <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 font-semibold">Reference</TableHead>
                <TableHead className="px-6 font-semibold">Customer</TableHead>
                <TableHead className="px-6 font-semibold">Service Type</TableHead>
                <TableHead className="px-6 font-semibold text-right">Points Deducted</TableHead>
                <TableHead className="px-6 font-semibold text-right">Value</TableHead>
                <TableHead className="px-6 font-semibold">Status</TableHead>
                <TableHead className="px-6 font-semibold">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground font-sans">
                    No transactions found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow
                    key={t.id}
                    onClick={() => navigate(`/transactions/${t.id}`)}
                    className="cursor-pointer hover:bg-secondary/40 transition-colors"
                  >
                    <TableCell className="px-6 py-4 font-mono font-medium text-foreground text-[14px]">
                      {t.payment_reference}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{t.customer?.name || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground font-sans">{t.customer?.email}</span>
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
                    <TableCell className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <DateText value={t.created_at} relative />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] text-muted-foreground">
              Page {page} of {totalPages} ({meta.total || 0} total records)
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
    </div>
  );
}
