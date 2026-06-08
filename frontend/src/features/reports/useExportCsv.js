import { useMutation } from "@tanstack/react-query";
import { exportReportsCsv } from "@/api/reports";

export function useExportCsv() {
  return useMutation({
    mutationFn: exportReportsCsv,
    onSuccess: (data) => {
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
}
