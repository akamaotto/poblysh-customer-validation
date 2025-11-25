'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { userApi, type User } from '@/lib/api';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Form fields
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (!user) throw new Error('User not found');

            // Only update name field (users cannot change email or role)
            await userApi.updateUser(user.id, { name });

            await refreshUser();
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            if (!user) throw new Error('User not found');

            await userApi.changeUserPassword(user.id, newPassword);

            // Clear password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setSuccess('Password changed successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="p-8">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
                <p className="text-muted-foreground">Manage your profile settings and password</p>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-accent/10 border border-accent text-accent-foreground rounded">
                    {success}
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="bg-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Profile Information</h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Email
                            </label>
                            <div className="p-2 border border-border rounded bg-muted text-muted-foreground">
                                {user.email}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                Role
                            </label>
                            <div className="p-2 border border-border rounded bg-muted">
                                <span className={`px-2 py-1 text-xs rounded ${
                                    user.role === 'admin'
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-secondary/20 text-secondary-foreground'
                                }`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Role cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Your name"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-card rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Change Password</h2>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="newPassword">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Enter new password"
                                required
                                minLength={8}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded hover:opacity-90 disabled:opacity-50 font-medium"
                        >
                            {loading ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>

                    <div className="mt-4 p-3 bg-muted rounded">
                        <h3 className="text-sm font-medium text-foreground mb-1">Password Requirements:</h3>
                        <ul className="text-xs text-muted-foreground space-y-1">
                            <li>• At least 8 characters long</li>
                            <li>• Include letters and numbers</li>
                            <li>• Consider using special characters</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Account Status */}
            <div className="mt-8 bg-card rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Account Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium">
                            <span className={`px-2 py-1 text-xs rounded ${
                                user.is_active
                                    ? 'bg-accent/20 text-accent-foreground'
                                    : 'bg-destructive/20 text-destructive'
                            }`}>
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email Verified</p>
                        <p className="font-medium">
                            <span className={`px-2 py-1 text-xs rounded ${
                                user.email_verified
                                    ? 'bg-accent/20 text-accent-foreground'
                                    : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                {user.email_verified ? 'Verified' : 'Not Verified'}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                            {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}