/**
 * Non-custodial wallet implementation for the Lira mobile app.
 *
 * Uses ethers.js v5 (browser-compatible) and Expo SecureStore to persist the
 * encrypted private key on device.  Biometric authentication is required
 * before the key is accessed.
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { ethers } from '@ethersproject/wallet';
import type { WalletState, Transaction, HexAddress } from '../../../packages/types';

const WALLET_KEY = 'lira_wallet_pk';

// ──────────────────────────────────────────────────────────────────────────────
// Biometric gate
// ──────────────────────────────────────────────────────────────────────────────

/** Prompt biometric authentication. Returns `true` if authenticated. */
export async function authenticateBiometric(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return true; // allow on devices without biometrics

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return true; // no biometrics configured — skip gate

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your Lira wallet',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
  });
  return result.success;
}

// ──────────────────────────────────────────────────────────────────────────────
// Key management
// ──────────────────────────────────────────────────────────────────────────────

/** Generate a new wallet and persist the private key in SecureStore. */
export async function createWallet(): Promise<{ address: HexAddress; mnemonic: string }> {
  const wallet = ethers.Wallet.createRandom();
  await SecureStore.setItemAsync(WALLET_KEY, wallet.privateKey);
  return {
    address: wallet.address as HexAddress,
    mnemonic: wallet.mnemonic?.phrase ?? '',
  };
}

/** Import an existing wallet by mnemonic phrase. */
export async function importWalletFromMnemonic(mnemonic: string): Promise<HexAddress> {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);
  await SecureStore.setItemAsync(WALLET_KEY, wallet.privateKey);
  return wallet.address as HexAddress;
}

/**
 * Load the wallet — requires biometric authentication.
 * Returns `null` if the user cancels or authentication fails.
 */
export async function loadWallet(): Promise<ethers.Wallet | null> {
  const authenticated = await authenticateBiometric();
  if (!authenticated) return null;

  const pk = await SecureStore.getItemAsync(WALLET_KEY);
  if (!pk) return null;
  return new ethers.Wallet(pk);
}

/** Delete the persisted private key (logout / factory reset). */
export async function deleteWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(WALLET_KEY);
}

/** Check whether a wallet has been set up on this device. */
export async function hasWallet(): Promise<boolean> {
  const pk = await SecureStore.getItemAsync(WALLET_KEY);
  return !!pk;
}

// ──────────────────────────────────────────────────────────────────────────────
// Lira Pay — signed transfer intent
// ──────────────────────────────────────────────────────────────────────────────

export interface LiraPayIntent {
  to: HexAddress;
  token: string;
  amount: string; // human-readable, e.g. "10.5"
  memo?: string;
}

/**
 * Sign a Lira Pay intent using EIP-191 personal sign.
 * The signed payload is submitted to the core-engine API which validates and
 * executes the transfer on-chain.
 */
export async function signLiraPayIntent(
  intent: LiraPayIntent,
): Promise<{ signature: string; payload: string } | null> {
  const wallet = await loadWallet();
  if (!wallet) return null;

  const payload = JSON.stringify({
    ...intent,
    from: wallet.address,
    timestamp: Date.now(),
  });
  const signature = await wallet.signMessage(payload);
  return { signature, payload };
}

// ──────────────────────────────────────────────────────────────────────────────
// Initial wallet state
// ──────────────────────────────────────────────────────────────────────────────

export const EMPTY_WALLET_STATE: WalletState = {
  address: null,
  balance: 0n,
  balanceUsd: 0,
  pendingTx: [],
  biometricEnabled: false,
  connected: false,
};

/** Build a WalletState from an ethers wallet and on-chain data. */
export function buildWalletState(
  wallet: ethers.Wallet,
  balance: bigint,
  balanceUsd: number,
  pendingTx: Transaction[],
  biometricEnabled: boolean,
): WalletState {
  return {
    address: wallet.address as HexAddress,
    balance,
    balanceUsd,
    pendingTx,
    biometricEnabled,
    connected: true,
  };
}
