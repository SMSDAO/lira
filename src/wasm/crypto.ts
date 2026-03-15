/**
 * TypeScript host bindings for the WASM cryptographic verification module.
 *
 * Falls back to a pure-JS implementation when the WASM binary is not yet
 * compiled, so the platform remains fully functional during development.
 */

export interface SiweVerifyResult {
  /** Whether the signature is valid for the expected address. */
  valid: boolean;
  error?: string;
}

/**
 * Verify a Sign-In-With-Ethereum (EIP-191) signature.
 *
 * When the WASM binary is available it runs in < 1 ms.
 * The pure-JS fallback uses the viem verifyMessage utility which returns
 * a boolean (not a recovered address). Use a separate recovery helper if
 * you need the recovered address.
 */
export async function verifySiweSignature(
  message: string,
  signature: string,
  expectedAddress: string,
): Promise<SiweVerifyResult> {
  try {
    // Attempt to load WASM binary (compiled via wasm-pack)
    const wasmModule = (globalThis as Record<string, unknown>).__liraWasm;
    if (wasmModule && typeof wasmModule === 'object') {
      const cryptoMod = (wasmModule as Record<string, unknown>).crypto;
      if (cryptoMod && typeof cryptoMod === 'function') {
        const valid: boolean = (cryptoMod as (m: string, s: string, a: string) => boolean)(
          message, signature, expectedAddress,
        );
        return { valid };
      }
    }
  } catch {
    // Fall through to JS implementation
  }

  // Pure-JS fallback: dynamic import to avoid SSR issues
  try {
    const { verifyMessage } = await import('viem');
    // verifyMessage returns a boolean when address is provided
    const valid = await verifyMessage({
      address: expectedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return { valid };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
