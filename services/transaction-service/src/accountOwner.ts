import axios from "axios";
import { ACCOUNT_SERVICE_URL } from "./config";

export async function resolveAccountOwnerUserId(params: {
  accountId: string;
  authHeader?: string;
}): Promise<string> {
  const { accountId, authHeader } = params;

  const res = await axios.get(
    `${ACCOUNT_SERVICE_URL}/accounts/${accountId}/owner`,
    {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    }
  );

  return res.data.userId as string;
}
