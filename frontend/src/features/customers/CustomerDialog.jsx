import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { useCreateCustomer } from "./useCreateCustomer";
import { useUpdateCustomer } from "./useUpdateCustomer";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
});

export function CustomerDialog({ open, onOpenChange, customer }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isEdit = !!customer;

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const { reset, setError, handleSubmit, formState } = form;
  const isSubmitting = formState.isSubmitting;

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
      });
    }
  }, [customer, reset, open]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: customer.id, data });
        toast.success("Customer updated successfully");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Customer created successfully");
      }
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors;
        Object.keys(validationErrors).forEach((key) => {
          setError(key, { type: "server", message: validationErrors[key][0] });
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold">
            {isEdit ? "Edit Customer" : "New Customer"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className="h-11 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" className="h-11 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+2348012345678" className="h-11 rounded-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="rounded-lg h-11 active:scale-95"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full px-5 h-11 active:scale-95 text-[15px]"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
