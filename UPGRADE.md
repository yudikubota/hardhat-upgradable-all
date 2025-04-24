# Smart Contract Upgrade Guide

This guide explains how to upgrade your deployed proxy contracts using the `scripts/upgrade.ts` script.

## Prerequisites

- Deployed proxy contracts (UUPS, Transparent, or Beacon)
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## Environment Setup

1. Create a `.env` file in the project root (copy from `.env.example` if available)
2. Add the addresses of your deployed proxies:

```
# UUPS Proxy address
UUPS_PROXY_ADDRESS=0x...

# Transparent Proxy address
TRANSPARENT_PROXY_ADDRESS=0x...

# Beacon address
BEACON_ADDRESS=0x...

# Minimal Proxy address (for information only, cannot be upgraded)
MINIMAL_PROXY_ADDRESS=0x...
```

You only need to provide the addresses for the proxies you wish to upgrade.

## Upgrading Your Contracts

Run the upgrade script:

```bash
npm run upgrade
```

This will:
1. Load your environment variables
2. Connect to your network using Hardhat
3. Check and display owner/admin information for each contract
4. Upgrade each specified proxy to the V2 implementation

## Owner Verification

The script now automatically checks and displays the owner/admin for each contract:

- For UUPS proxies: Shows the implementation contract owner
- For Transparent proxies: Shows the admin address
- For Beacon proxies: Shows the beacon owner
- For Minimal proxies: Shows the implementation contract owner (for information only)

This verification helps ensure you have the necessary permissions to perform the upgrade.

## About Proxy Types

### UUPS Proxy

Upgradable proxy where the upgrade functionality is in the implementation contract itself.

### Transparent Proxy

Upgradable proxy with separate admin and user functionality.

### Beacon Proxy

A proxy that points to a beacon contract which holds the implementation address.
Upgrading the beacon automatically upgrades all proxies pointing to it.

### Minimal Proxy (EIP-1167)

Minimal proxies cannot be upgraded. They are clones that permanently point to the same implementation.
To "upgrade," you must deploy a new clone from a new implementation. 