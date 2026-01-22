import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface ListUsersInput {
  search?: string;
  role?: string;
  subscriptionStatus?: string;
}

export async function listUsers(
  ctx: AppContext,
  input: ListUsersInput = {}
): Promise<User[]> {
  let users = await ctx.storage.getAllUsers();
  
  if (input.search) {
    const searchLower = input.search.toLowerCase();
    users = users.filter(u => 
      u.email.toLowerCase().includes(searchLower) ||
      (u.name && u.name.toLowerCase().includes(searchLower))
    );
  }
  
  if (input.role) {
    users = users.filter(u => u.role === input.role);
  }
  
  if (input.subscriptionStatus) {
    users = users.filter(u => u.subscriptionStatus === input.subscriptionStatus);
  }
  
  return users;
}
