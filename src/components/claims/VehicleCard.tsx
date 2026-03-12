
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
        <div className={`relative flex flex-col items-center justify-center p-4 rounded-xl shadow-md border-2 transition-all duration-300 group ${
            vehicle.isArchived ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-blue-400 hover:shadow-lg'
        }`}>
            <div className="text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{vehicle.year}</p>
                <h3 className="text-lg font-bold text-gray-800 leading-tight">{vehicle.make}</h3>
                <p className="text-sm font-medium text-gray-600">{vehicle.model}</p>
                {vehicle.color && <p className="text-xs text-gray-400 mt-1">{vehicle.color}</p>}
            </div>

            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(vehicle)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit vehicle"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onArchive(vehicle.id)}
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                    title="Archive vehicle"
                >
                    <CheckCircle size={16} />
                </button>
            </div>

            {vehicle.description && (
                <div className="mt-3 pt-2 border-t border-gray-50 w-full">
                    <p className="text-[10px] text-gray-400 line-clamp-2 text-center italic">
                        "{vehicle.description}"
                    </p>
                </div>
            )}
        </div>
    )
}
