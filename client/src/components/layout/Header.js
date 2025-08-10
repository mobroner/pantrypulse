import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ user, logout }) => {
    return (
        <header className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">
                    <Link to="/">Pantry Pulse</Link>
                </h1>
                <nav>
                    {user ? (
                        <>
                            <span className="mr-4">Welcome, {user.email}</span>
                            <Link to="/manage-groups" className="mr-4 hover:text-blue-200">Manage Groups</Link>
                            <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="mr-4 hover:text-blue-200">Login</Link>
                            <Link to="/register" className="hover:text-blue-200">Register</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
