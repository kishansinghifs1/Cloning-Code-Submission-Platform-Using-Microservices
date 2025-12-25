// Authentication Modal - Login and Register

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
    const { login, register } = useAuth();
    const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Login form state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register form state
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerFirstName, setRegisterFirstName] = useState('');
    const [registerLastName, setRegisterLastName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const resetForms = () => {
        setLoginEmail('');
        setLoginPassword('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterUsername('');
        setRegisterFirstName('');
        setRegisterLastName('');
        setConfirmPassword('');
        setError(null);
    };

    const handleClose = () => {
        resetForms();
        onClose();
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(loginEmail, loginPassword);
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate passwords match
        if (registerPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await register({
                email: registerEmail,
                password: registerPassword,
                username: registerUsername,
                firstName: registerFirstName || undefined,
                lastName: registerLastName || undefined,
            });
            handleClose();
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md">
                <button
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <h3 className="font-bold text-2xl mb-4">
                    {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
                </h3>

                {/* Tabs */}
                <div role="tablist" className="tabs tabs-boxed mb-4">
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'login' ? 'tab-active' : ''}`}
                        onClick={() => {
                            setActiveTab('login');
                            setError(null);
                        }}
                    >
                        Login
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === 'register' ? 'tab-active' : ''}`}
                        onClick={() => {
                            setActiveTab('register');
                            setError(null);
                        }}
                    >
                        Register
                    </a>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="alert alert-error mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="input input-bordered"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="input input-bordered"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}

                {/* Register Form */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Email *</span>
                            </label>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                className="input input-bordered"
                                value={registerEmail}
                                onChange={(e) => setRegisterEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Username *</span>
                            </label>
                            <input
                                type="text"
                                placeholder="username"
                                className="input input-bordered"
                                value={registerUsername}
                                onChange={(e) => setRegisterUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">First Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="John"
                                    className="input input-bordered"
                                    value={registerFirstName}
                                    onChange={(e) => setRegisterFirstName(e.target.value)}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Last Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Doe"
                                    className="input input-bordered"
                                    value={registerLastName}
                                    onChange={(e) => setRegisterLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Password *</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Create a password"
                                className="input input-bordered"
                                value={registerPassword}
                                onChange={(e) => setRegisterPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Confirm Password *</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm your password"
                                className="input input-bordered"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>
                )}
            </div>
            <div className="modal-backdrop" onClick={handleClose}></div>
        </div>
    );
}
