import { useAccount } from 'wagmi';
import { getUserRole, UserRole } from '@/lib/rbac';

/**
 * Hook to get the current user's role based on their connected wallet
 */
export function useUserRole(): UserRole {
  const { address } = useAccount();
  return getUserRole(address);
}
