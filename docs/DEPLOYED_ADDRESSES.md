# LIRA Production Deployment Address Registry

This registry keeps the deployed contract addresses for the canonical production environment.

- Primary chain: Base (8453)
- Test deployment target: Base Sepolia (84532)
- Real production values should be passed via Vercel environment variables prior to deployment.

## Required environment variables

- `NEXT_PUBLIC_LIRA_TOKEN`
- `NEXT_PUBLIC_LIRA_REGISTRY`
- `NEXT_PUBLIC_LIRA_PROFILE`
- `NEXT_PUBLIC_LIRA_SOCIAL_GRAPH`
- `NEXT_PUBLIC_FACTORY`
- `NEXT_PUBLIC_USER_FACTORY`
- `NEXT_PUBLIC_ADMIN_WALLET`

## Current status

The application accepts `NOT_DEPLOYED` during local UI development, but real values are mandatory before production launch.

## Example

```env
NEXT_PUBLIC_LIRA_TOKEN=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_LIRA_REGISTRY=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_LIRA_PROFILE=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_LIRA_SOCIAL_GRAPH=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_FACTORY=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_USER_FACTORY=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_ADMIN_WALLET=0x0000000000000000000000000000000000000000
```

## Deployment note

After contract deployment and verification, update these values in Vercel and re-run the production validation step before final deploy.
