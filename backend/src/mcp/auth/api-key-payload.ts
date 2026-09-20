export interface UserPayload {
  userId: string;
  apiKeyId: string;
  scopes: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
}