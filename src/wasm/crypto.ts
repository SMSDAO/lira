/**
 * TypeScript host bindings for the WASM cryptographic verification module.
 *
 * Falls back to a pure-JS implementation when the WASM binary is not yet
 * compiled, so the platform remains fully functional during development.
 */

export interface SiweVerifyResult {
  valid: boolean;
  recoveredAddress?: string;
  error?: string;
}

/**
 * Verify a Sign-In-With-Ethereum (EIP-191) signature.
 *
 * When the WASM binary is available it runs in < 1 ms.
 * The pure-JS fallback uses the viem verifyMessage utility.
 */
export async function verifySiweSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<SiweVerifyResult> {
  try {
    // Attempt to load WASM binary (compiled via wasm-pack)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wasmModule = (globalThis as Record<string, unknown>).__liraWasm;
    if (wasmModule && typeof wasmModule === 'object') {
      const cryptoMod = (wasmModule as Record<string, unknown>).crypto;
      if (cryptoMod && typeof cryptoMod === 'function') {
        const recovered: string = (cryptoMod as (m: string, s: string) => string)(message, signature);
        return {
          valid: recovered.toLowerCase() === expectedAddress.toLowerCase(),
          recoveredAddress: recovered,
        };
      }
    }
  } catch {
    // Fall through to JS implementation
  }

  // Pure-JS fallback: dynamic import to avoid SSR issues
  try {
    const { verifyMessage } = await import('viem');
    const recovered = await verifyMessage({
      address: expectedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return {
      valid: recovered,
      recoveredAddress: recovered ? expectedAddress : undefined,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
