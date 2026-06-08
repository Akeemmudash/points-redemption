import { client } from "./client";

export async function runReconciliation() {
  const response = await client.post("/reconciliation/run");
  return response.data;
}
