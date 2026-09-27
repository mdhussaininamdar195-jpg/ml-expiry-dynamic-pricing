import { apiRequest } from "./api";

export async function login(username, password) {
  const formData = new URLSearchParams();

  formData.append(
    "username",
    username
  );

  formData.append(
    "password",
    password
  );

  const data = await apiRequest(
    "/token",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!data?.access_token) {
    throw new Error(
      "Login failed: no access token received."
    );
  }

  localStorage.setItem(
    "access_token",
    data.access_token
  );

  localStorage.setItem(
    "user_role",
    data.role || ""
  );

  return data;
}


export async function getCurrentUser() {
  return apiRequest("/auth/me");
}


export function logout() {
  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "user_role"
  );
}