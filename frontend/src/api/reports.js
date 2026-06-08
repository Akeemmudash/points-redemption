import { client } from "./client";

export async function getReportSummary(params) {
  const response = await client.get("/reports/summary", { params });
  return response.data;
}

export async function exportReportsCsv(params) {
  const response = await client.get("/reports/export", {
    params,
    responseType: "blob",
  });
  return response.data;
}
