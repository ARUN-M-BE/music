"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MusicUser } from "@/types/music";
import { musicService } from "@/services/music.service";
import {
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";

interface UsersTableProps {
  users: MusicUser[];
  currentUserEmail?: string;
  isSuperAdmin?: boolean;
  onUserUpdated: () => void;
}

export function UsersTable({
  users,
  currentUserEmail,
  isSuperAdmin = true,
  onUserUpdated,
}: UsersTableProps) {
  const [filterText, setFilterText] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      (u.name || "").toLowerCase().includes(filterText.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(filterText.toLowerCase())
  );

  const [confirmModal, setConfirmModal] = useState<{
    type: "role" | "status" | "delete";
    user: MusicUser;
    newRole?: "admin" | "member";
    newStatus?: "approved" | "pending";
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Count summaries
  const adminCount = users.filter((u) => u.role === "admin").length;
  const memberCount = users.filter((u) => u.role === "member").length;
  const superCount = users.filter((u) => u.role === "superadmin").length;

  const handleRoleToggleClick = (user: MusicUser) => {
    if (
      user.role === "superadmin" ||
      user.email.toLowerCase() === "arunm102301@gmail.com" ||
      user.email.toLowerCase() === "arun102301@gmail.com" ||
      (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase())
    ) {
      return;
    }
    const newRole = user.role === "admin" ? "member" : "admin";
    setConfirmModal({
      type: "role",
      user,
      newRole,
    });
  };

  const handleStatusToggleClick = (user: MusicUser) => {
    if (
      user.role === "superadmin" ||
      user.email.toLowerCase() === "arunm102301@gmail.com" ||
      user.email.toLowerCase() === "arun102301@gmail.com" ||
      (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase())
    ) {
      return;
    }
    const currentStatus = user.status || (user.email_verified ? "approved" : "pending");
    const newStatus = currentStatus === "approved" ? "pending" : "approved";
    setConfirmModal({
      type: "status",
      user,
      newStatus,
    });
  };

  const handleDeleteUserClick = (user: MusicUser) => {
    if (
      user.role === "superadmin" ||
      user.email.toLowerCase() === "arunm102301@gmail.com" ||
      user.email.toLowerCase() === "arun102301@gmail.com" ||
      (currentUserEmail && user.email.toLowerCase() === currentUserEmail.toLowerCase())
    ) {
      return;
    }
    setConfirmModal({
      type: "delete",
      user,
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setLoadingId(confirmModal.user._id);
    setErrorMessage(null);

    try {
      if (confirmModal.type === "role" && confirmModal.newRole) {
        await musicService.updateUserRole(confirmModal.user._id, confirmModal.newRole);
      } else if (confirmModal.type === "status" && confirmModal.newStatus) {
        await musicService.updateUserStatus(confirmModal.user._id, confirmModal.newStatus);
      } else if (confirmModal.type === "delete") {
        await musicService.deleteUser(confirmModal.user._id);
      }
      onUserUpdated();
      setConfirmModal(null);
    } catch (err: any) {
      console.error("User management error:", err);
      setErrorMessage(err.message || "Failed to execute user action.");
    } finally {
      setIsProcessing(false);
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search & Breakdown Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#b3b3b3]" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#242424] border border-[#383838] focus:border-[#1db954] text-xs text-white outline-none"
          />
        </div>

        {/* Detailed User Breakdown */}
        <div className="flex flex-wrap items-center gap-2 text-xs shrink-0 font-medium">
          <span className="px-2.5 py-1 rounded-lg bg-[#242424] text-white border border-[#383838]">
            Total Users: <strong className="text-[#1db954] font-mono">{users.length}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-bold">
            Admins: <strong className="font-mono">{adminCount}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#b3b3b3] border border-white/10 text-[10px] font-bold">
            Members: <strong className="font-mono">{memberCount}</strong>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
            Superadmin: <strong className="font-mono">{superCount}</strong>
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto rounded-xl border border-[#282828] bg-[#181818]">
        <table className="w-full text-left text-xs text-[#b3b3b3]">
          <thead className="bg-[#202020] text-[11px] uppercase tracking-wider font-semibold text-white border-b border-[#282828]">
            <tr>
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#282828]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#727272]">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const isCurrentUser =
                  !!currentUserEmail &&
                  user.email.toLowerCase() === currentUserEmail.toLowerCase();
                const isPrimarySuper =
                  user.role === "superadmin" ||
                  user.email.toLowerCase() === "arunm102301@gmail.com" ||
                  user.email.toLowerCase() === "arun102301@gmail.com";
                const isProtectedAccount = isCurrentUser || isPrimarySuper;
                const userStatus = user.status || (user.email_verified ? "approved" : "pending");

                return (
                  <tr key={user._id} className="hover:bg-white/5 transition-colors">
                    {/* User profile */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative size-8 rounded-full overflow-hidden bg-[#242424] shrink-0">
                          <Image
                            src={
                              user.imageURL ||
                              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            }
                            alt={user.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-semibold text-white">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-2.5 px-4 font-mono text-xs">{user.email}</td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4">
                      {userStatus === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="size-3" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <Clock className="size-3" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Role badge */}
                    <td className="py-2.5 px-4">
                      {user.role === "superadmin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/40">
                          <ShieldAlert className="size-3 text-purple-400" />
                          SUPERADMIN
                        </span>
                      ) : user.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                          <ShieldAlert className="size-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-white border border-white/10">
                          <Shield className="size-3" />
                          MEMBER
                        </span>
                      )}
                    </td>

                    {/* Account Actions */}
                    <td className="py-2.5 px-4 text-right">
                      {isProtectedAccount ? (
                        <span className="text-[10px] text-purple-400/90 font-mono italic font-semibold">
                          {isCurrentUser ? "Your Account (Active)" : "Primary Superadmin"}
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {/* Status toggle button */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleStatusToggleClick(user)}
                              disabled={loadingId === user._id}
                              className={`px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                                userStatus === "approved"
                                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                              title={
                                userStatus === "approved"
                                  ? "Click to set status to Pending"
                                  : "Click to Approve user"
                              }
                            >
                              {loadingId === user._id && confirmModal?.user._id === user._id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : userStatus === "approved" ? (
                                <>
                                  <UserX className="size-3" />
                                  <span>Make Pending</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="size-3" />
                                  <span>Approve</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Role toggle button */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRoleToggleClick(user)}
                              disabled={loadingId === user._id}
                              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-colors border ${
                                user.role === "admin"
                                  ? "bg-[#282828] hover:bg-[#333333] text-gray-300 border-[#383838]"
                                  : "bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30"
                              }`}
                            >
                              {user.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                            </button>
                          )}

                          {/* Delete action */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUserClick(user)}
                              disabled={loadingId === user._id}
                              className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                              title="Remove User"
                            >
                              {loadingId === user._id && confirmModal?.type === "delete" ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmModal}
        title={
          confirmModal?.type === "role"
            ? "Update User Role"
            : confirmModal?.type === "status"
            ? "Change User Status"
            : "Remove User Permanently"
        }
        message={
          confirmModal?.type === "role"
            ? `Are you sure you want to change ${confirmModal.user.name}'s role to ${confirmModal.newRole?.toUpperCase()}?`
            : confirmModal?.type === "status"
            ? `Are you sure you want to set ${confirmModal.user.name}'s status to ${confirmModal.newStatus?.toUpperCase()}?`
            : "Are you sure you want to permanently delete this user account? This action cannot be undone."
        }
        highlight={
          confirmModal ? `${confirmModal.user.name} (${confirmModal.user.email})` : undefined
        }
        confirmText={
          confirmModal?.type === "role"
            ? `Confirm: Change to ${confirmModal.newRole?.toUpperCase()}`
            : confirmModal?.type === "status"
            ? `Confirm: Set to ${confirmModal.newStatus?.toUpperCase()}`
            : "Delete User"
        }
        cancelText="Cancel"
        type={confirmModal?.type === "delete" ? "danger" : "warning"}
        isLoading={isProcessing}
        onConfirm={handleExecuteAction}
        onClose={() => setConfirmModal(null)}
      />

      {/* Error Feedback Alert Modal */}
      {errorMessage && (
        <ConfirmationModal
          isOpen={!!errorMessage}
          title="Operation Failed"
          message={errorMessage}
          type="danger"
          confirmText="OK"
          isAlertOnly={true}
          onConfirm={() => setErrorMessage(null)}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
