'use client';

import {useAuth} from '@/lib/auth-context';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {userApi, type User} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function UsersPage() {
    const {user} = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Redirect if not admin
    useEffect(() => {
        if (!loading && user && user.role !== 'admin') {
            router.push('/');
        }
    }, [user, loading, router]);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load users',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete user');
            }

            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete user');
        }
    };

    const handleToggleUserStatus = async (
        userId: string,
        currentStatus: boolean,
    ) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            await userApi.updateUser(userId, {is_active: !currentStatus});
            fetchUsers();
        } catch (err) {
            alert(
                err instanceof Error ? err.message : `Failed to ${action} user`,
            );
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
    };

    const handleUpdateUser = async (
        userId: string,
        updates: {email?: string; name?: string | null; role?: string},
    ) => {
        try {
            // Convert null values to undefined to match UpdateUserRequest interface
            const sanitizedUpdates = {
                ...updates,
                name: updates.name === null ? undefined : updates.name
            };
            await userApi.updateUser(userId, sanitizedUpdates);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update user');
        }
    };

    const renderPageShell = (content: React.ReactNode) => (
        <div className='min-h-screen bg-background p-8'>
            <div className='max-w-7xl mx-auto'>{content}</div>
        </div>
    );

    if (loading) {
        return renderPageShell(
            <p className='text-muted-foreground'>Loading...</p>,
        );
    }

    if (!user || user.role !== 'admin') {
        return renderPageShell(
            <p className='text-destructive'>Access denied. Admin only.</p>,
        );
    }

    return renderPageShell(
        <>
            <div className='flex flex-wrap gap-3 justify-between items-center mb-6'>
                <h1 className='text-3xl font-bold text-foreground'>
                    User Management
                </h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className='px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 font-medium'
                >
                    Create User
                </button>
            </div>

            {error && (
                <div className='mb-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive rounded-md'>
                    {error}
                </div>
            )}

            {showCreateForm && (
                <CreateUserForm
                    onClose={() => setShowCreateForm(false)}
                    onSuccess={() => {
                        setShowCreateForm(false);
                        fetchUsers();
                    }}
                />
            )}

            {editingUser && (
                <EditUserForm
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUpdate={handleUpdateUser}
                />
            )}

            <div className='bg-card rounded-lg shadow overflow-hidden'>
                <table className='w-full'>
                    <thead className='bg-muted'>
                        <tr>
                            <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                Email
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                Name
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                Role
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                Status
                            </th>
                            <th className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-border'>
                        {users.map((u) => (
                            <tr key={u.id} className='hover:bg-muted/50'>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                                    {u.email}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm text-foreground'>
                                    {u.name || '-'}
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                    <span
                                        className={`px-2 py-1 text-xs rounded ${
                                            u.role === 'admin'
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-secondary/20 text-secondary-foreground'
                                        }`}
                                    >
                                        {u.role}
                                    </span>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap'>
                                    <span
                                        className={`px-2 py-1 text-xs rounded ${
                                            u.is_active
                                                ? 'bg-accent/20 text-accent-foreground'
                                                : 'bg-destructive/20 text-destructive'
                                        }`}
                                    >
                                        {u.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                    <div className='flex gap-2'>
                                        <button
                                            onClick={() => handleEditUser(u)}
                                            className='text-primary hover:underline'
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleToggleUserStatus(
                                                    u.id,
                                                    u.is_active,
                                                )
                                            }
                                            className={`hover:underline ${
                                                u.is_active
                                                    ? 'text-yellow-600'
                                                    : 'text-green-600'
                                            }`}
                                        >
                                            {u.is_active
                                                ? 'Deactivate'
                                                : 'Activate'}
                                        </button>
                                        {u.id !== user?.id && (
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(u.id)
                                                }
                                                className='text-destructive hover:underline'
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>,
    );
}

function CreateUserForm({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    name: name || null,
                    role,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create user');
            }

            onSuccess();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to create user',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-card p-6 rounded-lg shadow-lg w-full max-w-md'>
                <h2 className='text-xl font-bold mb-4 text-foreground'>
                    Create New User
                </h2>

                {error && (
                    <div className='mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded'>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Email *
                        </label>
                        <input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Password *
                        </label>
                        <input
                            type='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Name
                        </label>
                        <input
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Role *
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        >
                            <option value='user'>User</option>
                            <option value='admin'>Admin</option>
                        </select>
                    </div>

                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex-1 py-2 px-4 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 font-medium'
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                        <button
                            type='button'
                            onClick={onClose}
                            className='flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded hover:opacity-90 font-medium'
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function EditUserForm({
    user,
    onClose,
    onUpdate,
}: {
    user: User;
    onClose: () => void;
    onUpdate: (
        userId: string,
        updates: {email?: string; name?: string | null; role?: string},
    ) => Promise<void>;
}) {
    const [email, setEmail] = useState(user.email);
    const [name, setName] = useState(user.name || '');
    const [role, setRole] = useState(user.role);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const updates: {
                email?: string;
                name?: string | null;
                role?: string;
            } = {};

            if (email !== user.email) updates.email = email;
            if (name !== (user.name || '')) updates.name = name || null;
            if (role !== user.role) updates.role = role;

            await onUpdate(user.id, updates);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to update user',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
            <div className='bg-card p-6 rounded-lg shadow-lg w-full max-w-md'>
                <h2 className='text-xl font-bold mb-4 text-foreground'>
                    Edit User
                </h2>

                {error && (
                    <div className='mb-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded'>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Email *
                        </label>
                        <input
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Name
                        </label>
                        <input
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-foreground mb-1'>
                            Role *
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className='w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                        >
                            <option value='user'>User</option>
                            <option value='admin'>Admin</option>
                        </select>
                    </div>

                    <div className='flex gap-2'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='flex-1 py-2 px-4 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50 font-medium'
                        >
                            {loading ? 'Updating...' : 'Update User'}
                        </button>
                        <button
                            type='button'
                            onClick={onClose}
                            className='flex-1 py-2 px-4 bg-secondary text-secondary-foreground rounded hover:opacity-90 font-medium'
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
