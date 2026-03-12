
'use client'

import { Edit2, CheckCircle } from 'lucide-react'

interface VehicleCardProps {
    vehicle: {
        id: string
        year: string
        make: string
        model: string
        color?: string | null
        vin?: string | null
        description?: string | null
        isArchived: boolean
    }
    onEdit: (vehicle: any) => void
    onArchive: (id: string) => void
}

export default function VehicleCard({ vehicle, onEdit, onArchive }: VehicleCardProps) {
    return (
        <div className={`relative flex flex-col p-5 rounded-2xl shadow-sm border-2 transition-all duration-500 group overflow-hidden ${
            vehicle.isArchived 
            ? 'bg-gradient-to-br from-green-50 to-white border-green-200' 
            : 'bg-white border-gray-100 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1'
        }`}>
            {/* Background Accent */}
            <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-colors ${
                vehicle.isArchived ? 'bg-green-500' : 'bg-blue-500'
            }`} />

            <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                        vehicle.isArchived ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {vehicle.year}
                    </span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                            onClick={() => onEdit(vehicle)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit vehicle"
                        >
                            <Edit2 size={15} />
                        </button>
                        <button
                            onClick={() => onArchive(vehicle.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                                vehicle.isArchived 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title={vehicle.isArchived ? "Unarchive" : "Mark as Complete"}
                        >
                            <CheckCircle size={15} />
                        </button>
                    </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                    {vehicle.make}
                </h3>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">
                    {vehicle.model}
                </p>
                
                {vehicle.color && (
                    <div className="flex items-center gap-1.5 mt-3">
                        <div className="w-2 h-2 rounded-full border border-gray-100 shadow-sm" style={{ backgroundColor: vehicle.color.toLowerCase() }} />
                        <span className="text-[11px] font-bold text-gray-400 uppercase">{vehicle.color}</span>
                    </div>
                )}
            </div>

            {vehicle.description && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-100">
                    <p className="text-[11px] text-gray-400 font-medium line-clamp-2 italic leading-relaxed">
                        "{vehicle.description}"
                    </p>
                </div>
            )}
            
            {/* Archive Overlay Pattern if Archived */}
            {vehicle.isArchived && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                    <div className="absolute rotate-12 scale-150">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="whitespace-nowrap text-green-900 font-black text-4xl leading-none">
                                COMPLETED COMPLETED COMPLETED
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
