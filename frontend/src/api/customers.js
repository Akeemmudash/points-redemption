import { client } from "./client";

export async function getCustomers(params) {
  const response = await client.get("/customers", { params });
  return response.data;
}

export async function getCustomer(id) {
  const response = await client.get(`/customers/${id}`);
  return response.data.data;
}

export async function createCustomer(data) {
  const response = await client.post("/customers", data);
  return response.data.data;
}

export async function updateCustomer({ id, data }) {
  const response = await client.put(`/customers/${id}`, data);
  return response.data.data;
}

export async function deactivateCustomer(id) {
  const response = await client.patch(`/customers/${id}/deactivate`);
  return response.data.data;
}
