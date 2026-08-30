import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Database,
  Cpu,
  Trash2,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await updateProfile(name.trim());
      setProfileMsg({ type: 'success', text: 'Name updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update name.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await api.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="p-3.5 sm:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="pb-5 sm:pb-6 border-b border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Account & System Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your personal profile, security credentials, and view system RAG configuration.
        </p>
      </div>

      {/* Profile Info Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <UserIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {profileMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Registered on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl sm:rounded-lg shadow-xs shadow-indigo-100 transition-colors disabled:opacity-60 min-h-[40px]"
          >
            {profileLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Lock className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Security & Password</h2>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {profileMsg?.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl sm:rounded-lg shadow-xs shadow-indigo-100 transition-colors disabled:opacity-60 min-h-[40px]"
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* RAG Infrastructure Status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">RAG Engine Architecture</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Generation LLM</span>
            </div>
            <div className="text-gray-600">Gemini 3.7 Flash (`gemini-3.7-flash`)</div>
            <div className="text-[11px] text-gray-400">Strict grounding prompt to prevent hallucinations</div>
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Vector Similarity Engine</span>
            </div>
            <div className="text-gray-600">Cosine Similarity Search (3072 Dimensions)</div>
            <div className="text-[11px] text-gray-400">Embedding: `gemini-embedding-2-preview` / High-Res Semantic Vectorizer</div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-rose-900">
          <Trash2 className="w-5 h-5 text-rose-600" />
          <h2 className="text-sm font-semibold">Danger Zone</h2>
        </div>

        <p className="text-xs text-rose-700">
          Permanently delete your account, purge all uploaded documents, chunk embeddings, and past conversation threads. This action is irreversible.
        </p>

        <button
          id="btn-trigger-delete-account"
          onClick={() => setShowDeleteModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-xs font-semibold text-rose-700 hover:text-white bg-rose-100 hover:bg-rose-600 active:bg-rose-700 border border-rose-300 hover:border-transparent rounded-xl sm:rounded-lg transition-colors min-h-[40px]"
        >
          Delete Account and Purge Data
        </button>
      </div>

      {/* Delete Account Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account & All Data?"
        message="WARNING: This will permanently delete your account, purge all uploaded college documents, vector index embeddings, and chat histories. This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        isDestructive={true}
        loading={isDeletingAccount}
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

