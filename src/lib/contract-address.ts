/**
 * StandAlone Agent token contract address configuration.
 *
 * When the token launches, paste the contract address into CONTRACT_ADDRESS below.
 * The header and on-chain pages read from this single file, so no UI files need edits.
 * Leave it as an empty string until the official contract address is confirmed.
 */
export const CONTRACT_ADDRESS = "Flywhell Soon";

const candidate = CONTRACT_ADDRESS.trim();
export const IS_CONTRACT_ADDRESS_VALID = /^0x[a-fA-F0-9]{40}$/.test(candidate);
export const IS_CONTRACT_ADDRESS_PENDING = candidate.length === 0;

export const CONTRACT_ADDRESS_DISPLAY = IS_CONTRACT_ADDRESS_VALID
  ? `${candidate.slice(0, 6)}…${candidate.slice(-4)}`
  : IS_CONTRACT_ADDRESS_PENDING
    ? "COMING SOON"
    : "VERIFY ADDRESS";

export const CONTRACT_ADDRESS_EXPLORER_URL = IS_CONTRACT_ADDRESS_VALID
  ? `https://robinhoodchain.blockscout.com/address/${candidate}`
  : null;
