import React from 'react';
import { MdDarkMode } from "react-icons/md";
import { Link } from 'react-router-dom';
import { FaSearch } from "react-icons/fa";

function NavBar() {
    return (
        <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        <button className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out">
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-gray-600">Bounding Box</h1>
                        </div>
                        {/* <div className="mx-auto flex flex-row justify-center items-center">
                            <input type="text" placeholder="Search..." className="px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 bg-gray-100 rounded-l-md" />
                            <button className="bg-primary text-white px-3 py-3 rounded-r-md focus:outline-none focus:ring focus:border-blue-300">
                                <FaSearch />
                            </button>
                        </div> */}
                    </div>
                    {/* <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:bg-gray-100 focus:text-gray-500 transition duration-150 ease-in-out">
                            <MdDarkMode className="h-6 w-6" />
                        </button>
                        <button className='ml-4'>
                            <Link to="/login" className="bg-[#3a53dd] text-white font-bold py-2 px-4 rounded">Login</Link>
                        </button>
                    </div> */}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;
