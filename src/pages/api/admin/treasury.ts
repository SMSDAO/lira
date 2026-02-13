import type { NextApiRequest, NextApiResponse} from 'next';
import { ethers } from 'ethers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_ADDRESS;
      const rpcUrl = process.env.BASE_SEPOLIA_RPC || process.env.NEXT_PUBLIC_RPC_URL;

      if (!treasuryAddress) {
        return res.status(400).json({ error: 'Treasury address not configured' });
      }

      if (!rpcUrl) {
        return res.status(400).json({ error: 'RPC URL not configured' });
      }

      // Connect to provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Get ETH balance
      const ethBalance = await provider.getBalance(treasuryAddress);
      const ethBalanceFormatted = ethers.formatEther(ethBalance);

      // Get LIRA token balance (if LIRA token address is set)
      let liraBalance = '0';
      const liraTokenAddress = process.env.NEXT_PUBLIC_LIRA_TOKEN;
      
      if (liraTokenAddress) {
        const liraToken = new ethers.Contract(
          liraTokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        
        try {
          const balance = await liraToken.balanceOf(treasuryAddress);
          liraBalance = ethers.formatEther(balance);
        } catch (err) {
          console.error('Error fetching LIRA balance:', err);
        }
      }

      // Get network info
      const network = await provider.getNetwork();

      // Block explorer URLs
      const explorerUrl = network.chainId === 84532n 
        ? 'https://sepolia.basescan.org'
        : 'https://basescan.org';

      res.status(200).json({
        treasuryAddress,
        balances: {
          eth: ethBalanceFormatted,
          lira: liraBalance
        },
        network: {
          name: network.name,
          chainId: Number(network.chainId)
        },
        explorerLinks: {
          address: `${explorerUrl}/address/${treasuryAddress}`,
          transactions: `${explorerUrl}/address/${treasuryAddress}#transactions`
        }
      });
    } catch (error) {
      console.error('Error fetching treasury data:', error);
      res.status(500).json({ error: 'Failed to fetch treasury data' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
