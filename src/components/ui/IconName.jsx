import React, { useState } from 'react';
import { Settings, Sun, Moon } from 'lucide-react';
import { getInitial } from '../../utils/ExtractorIniciales';
import { useNavigate } from 'react-router-dom';

export const IconName = ({ toggleDarkMode, isDarkMode }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const userName = localStorage.getItem('name') || 'Usuario';

    const handleNavigate = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleToggleMode = () => {
        setIsOpen(false);
        if (toggleDarkMode) {
            toggleDarkMode();
        }
    };

    return (
        <div className='relative'>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center 
                           text-indigo-700 font-bold border-2 border-white shadow-md 
                           hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
                {getInitial(userName)}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    <div
                        className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-20 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <p className="text-sm font-semibold text-gray-800">Hola, {userName} 👋</p>
                            <p className="text-xs text-gray-500">Administrador de finanzas</p>
                        </div>

                        <div className="p-1">
                            <button
                                onClick={() => handleNavigate('/dashboard/configuraciones')}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            >
                                <Settings className="mr-3 h-4 w-4" />
                                Configuraciones
                            </button>

                            <button
                                onClick={handleToggleMode}
                                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            >
                                {isDarkMode ? (
                                    <>
                                        <Sun className="mr-3 h-4 w-4" />
                                        Modo Claro
                                    </>
                                ) : (
                                    <>
                                        <Moon className="mr-3 h-4 w-4" />
                                        Modo Oscuro
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};