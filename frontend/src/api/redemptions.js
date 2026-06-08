import { client } from "./client";

export async function getRedemptions(params) {
  const response = await client.get("/redemptions", { params });
  return response.data;
}

export async function getRedemption(id) {
  const response = await client.get(`/redemptions/${id}`);
  return response.data.data;
}

export async function createRedemption(data) {
  const response = await client.post("/redemptions", data);
  return response.data.data;
}
