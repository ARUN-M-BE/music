/**
 * Auth feature — public contract.
 *
 * Owns the Firebase session, the guest fallback and the approval gate that
 * guards the rest of the shell. Everything outside this folder must import
 * from `@/features/auth`; the files under `context/` and `components/` are
 * private implementation details.
 */
export { AuthProvider, useAuth, DEFAULT_AVATAR } from "./context/AuthContext";
export { PendingApprovalGate } from "./components/PendingApprovalGate";
