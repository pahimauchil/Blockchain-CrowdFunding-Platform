import React, { useEffect, useState, useCallback } from "react";
import { CustomButton, Loader, ConfirmDialog } from "../../components";
import { useStateContext } from "../../context";
import { useNotification } from "../../context/NotificationContext";
import { API_URL } from "../../constants/api";

/**
 * UsersManagement - User list and role management
 */
const UsersManagement = () => {
  const { authToken, address, connect } = useStateContext();
  const { showError, showSuccess } = useNotification();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Role change dialog
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [newRole, setNewRole] = useState("user");

  const fetchUsers = useCallback(async () => {
    if (!authToken) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        sortBy,
      });

      if (userTypeFilter !== "all") {
        params.append("userType", userTypeFilter);
      }
      if (roleFilter !== "all") {
        params.append("role", roleFilter);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load users");
      }

      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      showError(error.message || "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [authToken, currentPage, userTypeFilter, roleFilter, searchQuery, sortBy, usersPerPage, showError, API_URL]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [userTypeFilter, roleFilter, searchQuery, sortBy]);

  const handleRoleChange = (user) => {
    setUserToUpdate(user);
    setNewRole(user.role === "admin" ? "user" : "admin");
    setShowRoleDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!userToUpdate) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/admin/users/${userToUpdate._id}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update user role");
      }

      showSuccess(`User role updated to ${newRole}`);
      setShowRoleDialog(false);
      setUserToUpdate(null);
      fetchUsers();
    } catch (error) {
      showError(error.message || "Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!address || !authToken) {
    return (
      <div className="bg-white dark:bg-secondary-dark p-8 rounded-xl shadow-md text-center">
        <p className="text-text-light dark:text-text-dark mb-4">
          Please connect your wallet to manage users.
        </p>
        <CustomButton
          btnType="button"
          title="Connect Wallet"
          styles="bg-accent-primary text-white hover:bg-accent-hover-primary"
          handleClick={connect}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(isLoading || actionLoading) && <Loader />}

      <div className="bg-white dark:bg-secondary-dark border border-accent-primary/10 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-epilogue font-semibold text-text-light dark:text-text-dark">
            Users Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage users and their roles ({total} total users)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by wallet, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
          >
            <option value="all">All Types</option>
            <option value="donor">Donors</option>
            <option value="creator">Creators</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-accent-primary/20 rounded-lg bg-white dark:bg-secondary-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-accent-primary focus:border-transparent transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No users found.
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="border border-accent-primary/10 rounded-xl p-5 bg-white dark:bg-secondary-dark hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                          {user.creatorDetails?.name || "Anonymous User"}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.userType === "creator"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          }`}
                        >
                          {user.userType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {user.walletAddress}
                      </p>
                      {user.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      )}
                      {user.creatorDetails?.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                          {user.creatorDetails.bio}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          Campaigns: <strong>{user.stats?.campaignsCount || 0}</strong>
                        </span>
                        <span>
                          Donations: <strong>{user.stats?.donationsCount || 0}</strong>
                        </span>
                        <span>
                          Total Donated: <strong>{user.stats?.totalDonated || 0} ETH</strong>
                        </span>
                        <span>
                          Joined:{" "}
                          <strong>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CustomButton
                        btnType="button"
                        title={user.role === "admin" ? "Remove Admin" : "Make Admin"}
                        styles={`${
                          user.role === "admin"
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-purple-500 text-white hover:bg-purple-600"
                        } ${actionLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                        handleClick={() => !actionLoading && handleRoleChange(user)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-accent-primary/10">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages} ({total} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={showRoleDialog}
        title={`${newRole === "admin" ? "Grant" : "Revoke"} Admin Access`}
        message={
          userToUpdate
            ? `Are you sure you want to ${newRole === "admin" ? "grant" : "revoke"} admin access to ${userToUpdate.creatorDetails?.name || userToUpdate.walletAddress}?`
            : ""
        }
        onConfirm={confirmRoleChange}
        onCancel={() => {
          setShowRoleDialog(false);
          setUserToUpdate(null);
        }}
        confirmText={newRole === "admin" ? "Grant Admin" : "Revoke Admin"}
        cancelText="Cancel"
        isDanger={newRole === "user"}
      />
    </div>
  );
};

export default UsersManagement;
