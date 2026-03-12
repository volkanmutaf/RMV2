
'use client'

import { X, Calendar, Hash, Palette, FileText, Car } from 'lucide-react'

interface VehicleViewModalProps {
    isOpen: boolean
    onClose: () => void
    vehicle: any
}

export default function VehicleViewModal({ isOpen, onClose, vehicle }: VehicleViewModalProps) {
    if (!isOpen || !vehicle) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-4 transition-all duration-500">
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 ease-out border-none">
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-blue-400 p-8 flex items-end">
                    <button 
                        onClick={onClose} 
                        className="absolute top-6 right-6 p-2 bg-white/20 text-white hover:bg-white/40 rounded-2xl transition-all backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight uppercase">
                            {vehicle.make}
                        </h2>
                        <p className="text-blue-50 font-bold uppercase tracking-[0.2em] text-xs mt-1">
                            {vehicle.model}
                        </p>
                    </div>
                </div>

                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-500">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</p>
                                <p className="text-lg font-bold text-gray-900">{vehicle.year}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-blue-500">
                                <Palette size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</p>
                                <div className="flex items-center gap-2">
                                    {vehicle.color && (
                                        <div className="w-3 h-3 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                                    )}
                                    <p className="text-lg font-bold text-gray-900 uppercase">{vehicle.color || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-[1.5rem] border-2 border-dashed border-gray-100">
                        <div className="flex items-center gap-3 mb-2 text-gray-400">
                            <Hash size={16} />
                            <p className="text-[10px] font-black uppercase tracking-widest">VIN Number</p>
                        </div>
                        <p className="text-2xl font-black text-gray-900 font-mono tracking-[0.1em]">
                            {vehicle.vin || 'NO VIN PROVIDED'}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Description & Notes</h3>
                        </div>
                        <div className="bg-white border-2 border-gray-50 rounded-[2rem] p-8 min-h-[150px] shadow-inner">
                            <p className="text-gray-600 font-medium leading-relaxed italic whitespace-pre-wrap">
                                {vehicle.description ? `"${vehicle.description}"` : 'No additional notes provided for this vehicle.'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 hover:shadow-gray-300 hover:-translate-y-1 transition-all"
                        >
                            CLOSE DETAILS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
