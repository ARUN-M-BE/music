"use client";

import React, { useState } from "react";
import Image from "next/image";
import { MusicUser } from "@/types/music";
import { musicService } from "@/services/music.service";
import { useLanguage } from "@/context/LanguageContext";
import { Shield, ShieldAlert, Trash2, CheckCircle2, Clock, Search, Loader2 } from "lucide-react";
import { ConfirmationModal } from "@/components/Common/ConfirmationModal";

interface UsersTableProps {
  users: MusicUser[];
  onUserUpdated: () => void;
}

export function UsersTable({ users, onUserUpdated }: UsersTableProps) {
  const { t } = useLanguage();
  const [filterText, setFilterText] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(filterText.toLowerCase()) ||
      u.email.toLowerCase().includes(filterText.toLowerCase())
  );

  const [confirmModal, setConfirmModal] = useState<{
    type: "role" | "delete";
    user: MusicUser;
    newRole?: "admin" | "member";
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRoleToggleClick = (user: MusicUser) => {
    const newRole = user.role === "admin" ? "member" : "admin";
    setConfirmModal({
      type: "role",
      user,
      newRole,
    });
  };

  const handleDeleteUserClick = (user: MusicUser) => {
    setConfirmModal({
      type: "delete",
      user,
    });
  };

  const handleExecuteAction = async () => {
    if (!confirmModal) return;
    setIsProcessing(true);
    setLoadingId(confirmModal.user._id);
    try {
      if (confirmModal.type === "role" && confirmModal.newRole) {
        await musicService.updateUserRole(confirmModal.user._id, confirmModal.newRole);
      } else if (confirmModal.type === "delete") {
        await musicService.deleteUser(confirmModal.user._id);
      }
      onUserUpdated();
      setConfirmModal(null);
    } catch (err) {
      console.error("User management error:", err);
    } finally {
      setIsProcessing(false);
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
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
        <span className="text-xs text-[#b3b3b3] shrink-0">
          Total Members: {users.length}
        </span>
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
              filtered.map((user) => (
                <tr key={user._id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-8 rounded-full overflow-hidden bg-[#242424] shrink-0">
                        <Image
                          src={user.imageURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
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
                  <td className="py-2.5 px-4 font-mono text-xs">{user.email}</td>
                  <td className="py-2.5 px-4">
                    {user.email_verified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        {t("users.verified")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                        <Clock className="size-3" />
                        {t("users.pending")}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === "admin"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {user.role === "admin" ? <ShieldAlert className="size-3" /> : <Shield className="size-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleRoleToggleClick(user)}
                        disabled={loadingId === user._id}
                        className="px-2.5 py-1 rounded bg-[#282828] hover:bg-[#333333] text-white text-[10px] font-semibold transition-colors"
                      >
                        {user.role === "admin" ? t("users.makeMember") : t("users.makeAdmin")}
                      </button>
                      <button
                        onClick={() => handleDeleteUserClick(user)}
                        disabled={loadingId === user._id}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title={t("users.removeUser")}
                      >
                        {loadingId === user._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!confirmModal}
        title={confirmModal?.type === "role" ? "Update User Role" : "Remove User Permanently"}
        message={
          confirmModal?.type === "role"
            ? `Are you sure you want to change this user's role to ${confirmModal.newRole?.toUpperCase()}?`
            : "Are you sure you want to permanently delete this user account? This action cannot be undone."
        }
        highlight={
          confirmModal ? `${confirmModal.user.name} (${confirmModal.user.email})` : undefined
        }
        confirmText={
          confirmModal?.type === "role"
            ? `Change to ${confirmModal.newRole?.toUpperCase()}`
            : "Delete User"
        }
        cancelText="Cancel"
        type={confirmModal?.type === "delete" ? "danger" : "warning"}
        isLoading={isProcessing}
        onConfirm={handleExecuteAction}
        onClose={() => setConfirmModal(null)}
      />
    </div>
  );
}

