/**
 * Admin feature — public contract.
 *
 * Back-office surface: dashboard, stats, track/user tables and the local
 * secrets vault. Admin-only; guarded by `useAuth().isAdmin` at the route level.
 */
export { AdminDashboard } from "./components/AdminDashboard";
export { StatsCards } from "./components/StatsCards";
export { TrackTable } from "./components/TrackTable";
export { UsersTable } from "./components/UsersTable";
export { BulkUploadModal } from "./components/BulkUploadModal";
export { SecretBox } from "./components/SecretBox";
