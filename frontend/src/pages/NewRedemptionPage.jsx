import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Money } from "@/components/shared/Money";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useCustomers } from "@/features/customers/useCustomers";
import { useCustomer } from "@/features/customers/useCustomer";
import { useCreateRedemption } from "@/features/redemptions/useCreateRedemption";

const redemptionSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  service_type: z.string().min(1, "Service type is required"),
  points: z.string().refine((val) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num > 0 && String(num) === val;
  }, {
    message: "Points must be a positive integer",
  }),
  amountNaira: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, {
    message: "Amount must be positive",
  }),
});

function ResultPanel({ result, onReset }) {
  const { data: customer, isLoading, isError, error, refetch } = useCustomer(result.customer_id);

  const status = result.status;
  let statusColor = "text-status-pending bg-status-pending-bg";
  let StatusIcon = Clock;
  let statusText = "Redemption Pending";
  let statusDesc = "The transaction is being processed and will reconcile shortly.";

  if (status === "successful") {
    statusColor = "text-status-success bg-status-success-bg";
    StatusIcon = CheckCircle2;
    statusText = "Redemption Successful";
    statusDesc = "Points have been successfully deducted from the customer's balance.";
  } else if (status === "failed") {
    statusColor = "text-status-failed bg-status-failed-bg";
    StatusIcon = XCircle;
    statusText = "Redemption Failed";
    statusDesc = "The transaction failed on the billing network. Points have been refunded.";
  }

  return (
    <Card className="rounded-card max-w-xl mx-auto border-border bg-card">
      <CardContent className="pt-6 space-y-6">
        <div className={`flex flex-col items-center justify-center p-6 rounded-card text-center ${statusColor}`}>
          <StatusIcon className="w-12 h-12 mb-3" />
          <h3 className="font-display font-semibold text-lg">{statusText}</h3>
          <p className="text-sm opacity-90 max-w-xs mt-1">{statusDesc}</p>
        </div>

        <div className="border border-border rounded-lg p-4 space-y-3 font-sans text-sm">
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-semibold text-foreground">{result.payment_reference}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Service Type</span>
            <span className="font-semibold text-foreground capitalize">{result.service_type?.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Points Deducted</span>
            <span className="font-semibold text-foreground"><Money points={result.points_deducted} /></span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/50">
            <span className="text-muted-foreground">Value</span>
            <span className="font-semibold text-foreground"><Money kobo={result.amount} /></span>
          </div>
          <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
            {customer && (
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground font-semibold">New Points Balance</span>
                <span className="font-bold text-primary"><Money points={customer.points_balance} /></span>
              </div>
            )}
          </QueryBoundary>
        </div>

        <Button onClick={onReset} className="w-full rounded-full h-11 active:scale-95 text-[15px]">
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>New Redemption</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function NewRedemptionPage() {
  const [result, setResult] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const createMutation = useCreateRedemption();
  const { data: customersData, isLoading, isError, error, refetch } = useCustomers({
    status: "active",
    perPage: 100,
  });

  const activeCustomers = customersData?.data || [];

  const form = useForm({
    resolver: zodResolver(redemptionSchema),
    defaultValues: {
      customer_id: "",
      service_type: "",
      points: "",
      amountNaira: "",
    },
  });

  const { reset, setError, handleSubmit, formState } = form;
  const isSubmitting = formState.isSubmitting;

  const onSubmit = async (data) => {
    const payload = {
      customer_id: parseInt(data.customer_id, 10),
      service_type: data.service_type,
      points: parseInt(data.points, 10),
      amount: Math.round(parseFloat(data.amountNaira) * 100),
      idempotency_key: idempotencyKey,
    };

    try {
      const res = await createMutation.mutateAsync(payload);
      setResult(res);
      toast.success("Redemption request submitted successfully");
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          let field = key;
          if (key === "amount") field = "amountNaira";
          setError(field, { type: "server", message: validationErrors[key][0] });
        });
      }
    }
  };

  const handleReset = () => {
    setResult(null);
    setIdempotencyKey(crypto.randomUUID());
    reset({
      customer_id: "",
      service_type: "",
      points: "",
      amountNaira: "",
    });
  };

  if (result) {
    return (
      <div className="space-y-6">
        <PageHeader title="Redemption Result" description="Review status of the points redemption transaction." />
        <ResultPanel result={result} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Redemption" description="Process points deduction and issue mobile billing utility values." />

      <QueryBoundary isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <Card className="rounded-card max-w-xl mx-auto border-border bg-card">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg w-full font-sans text-[15px]">
                            <SelectValue placeholder="Select an active customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg">
                          {activeCustomers.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.email}) — Balance: {c.points_balance} pts
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-lg w-full font-sans text-[15px]">
                            <SelectValue placeholder="Select service category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="airtime">Airtime Purchase</SelectItem>
                          <SelectItem value="data">Data Bundle</SelectItem>
                          <SelectItem value="electricity">Electricity Bill</SelectItem>
                          <SelectItem value="cable_tv">Cable TV Subscription</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points to Deduct</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="e.g. 500" 
                            className="h-11 rounded-lg font-sans text-[15px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amountNaira"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (₦)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="e.g. 1500.00" 
                            className="h-11 rounded-lg font-sans text-[15px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full h-11 active:scale-95 text-[15px] pt-0.5"
                >
                  {isSubmitting ? "Processing Redemption..." : "Confirm & Redeem"}
                  <ArrowRight className="w-4 h-4 ml-1.5 inline-block shrink-0" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </QueryBoundary>
    </div>
  );
}
