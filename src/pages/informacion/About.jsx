import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    Github,
    Code,
    Users,
    GitBranch,
    Star,
    ExternalLink,
    Layers,
    Coffee
} from 'lucide-react';
import { FaFacebook, FaDiscord, FaGithub } from 'react-icons/fa';

export const About = () => {
    const contributors = [
        { name: "Omar Salcedo", role: "Desarrollador principal" },
        { name: "Comunidad Open Source", role: "Contribuidores" },
        { name: "Alister", role: "Contribuidor" }
    ];

    const techStack = [
        { name: "React 18", icon: "⚛️" },
        { name: "Vite", icon: "⚡" },
        { name: "Tailwind CSS", icon: "🎨" },
        { name: "Lucide Icons", icon: "🖌️" },
        { name: "React Router", icon: "🛣️" },
        { name: "SweetAlert2", icon: "🔔" }
    ];

    const socialLinks = [
        { name: "Facebook", url: "https://facebook.com/omarsalcedo_bs", icon: <FaFacebook size={20} /> },
        { name: "Discord", url: "https://discord.gg/omarsalcedo_bs", icon: <FaDiscord size={20} /> },
        { name: "Github", url: "https://github.com/omarsalcedo_bs", icon: <FaGithub size={20} /> }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* HEADER SECTION */}
            <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                    <Star size={16} className="fill-indigo-700" />
                    <span>Proyecto Open Source</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    MyPocket <span className="text-indigo-600">Community</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Una herramienta financiera transparente, construida por desarrolladores para estudiantes y entusiastas del código limpio.
                </p>

                <div className="flex justify-center gap-4 pt-4">
                    <Button onClick={() => window.open('https://github.com/OmarSalcedo-BS/MyPocketAppWeb', '_blank')} className="rounded-full px-8">
                        <Github size={20} />
                        Ver en GitHub
                    </Button>
                    
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN - PROJECT INFO */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Code size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Filosofía del Proyecto</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    MyPocket no es solo una app de finanzas; es un experimento de código abierto diseñado para enseñar buenas prácticas de desarrollo web moderno.
                                    Todo el código es público, auditable y mejorable por la comunidad. Creemos en el software transparente y en el aprendizaje colaborativo.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <GitBranch className="text-emerald-500" />
                                <h3 className="font-bold text-slate-800">Contribuir</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                ¿Encontraste un bug o tienes una idea genial? Haz un fork del repositorio, crea una rama y envía tu Pull Request.
                            </p>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Reportar Issues
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Proponer Features
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                    Mejorar Documentación
                                </li>
                            </ul>
                        </Card>

                        <Card>
                            <div className="flex items-center gap-3 mb-4">
                                <Layers className="text-blue-500" />
                                <h3 className="font-bold text-slate-800">Stack Tecnológico</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {techStack.map((tech, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">
                                        {tech.icon} {tech.name}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* RIGHT COLUMN - COMMUNITY & CREDITS */}
                <div className="space-y-8">
                    <Card className="bg-slate-900 text-white border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="text-indigo-400" />
                            <h3 className="font-bold text-white">Créditos</h3>
                        </div>
                        <div className="space-y-4">
                            {contributors.map((contributor, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs">
                                            {contributor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-black font-bold">{contributor.name}</p>
                                            <p className="text-xs text-slate-400">{contributor.role}</p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-500" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10 text-center">
                            <p className="text-xs text-slate-400 mb-3">¿Quieres aparecer aquí?</p>
                            <Button variant="secondary" className="w-full text-xs py-2 h-auto">
                                <Coffee size={14} className="mr-1" />
                                Invítanos un café
                            </Button>
                        </div>
                    </Card>

                    <div className="text-center space-y-4">
                        <p className="text-sm text-black">Síguenos en nuestras redes</p>
                        <div className="flex justify-center gap-4">
                            {socialLinks.map((social) => (
                                <button key={social.name} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                                    <span className="sr-only">{social.name}</span>
                                    {/* Placeholder icons */}
                                    {social.icon}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs pt-4 text-black">
                            Licencia Omar Salcedo • v1.0.0 • 2025
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};