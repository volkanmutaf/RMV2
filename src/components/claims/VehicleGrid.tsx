
'use client'

import { useState, useEffect } from 'react'
import VehicleCard from './VehicleCard'
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'

interface VehicleGridProps {
    onAddClick: () => void
    onEditClick: (vehicle: any) => void
    refreshTrigger: number
    archived?: boolean
}

export default function VehicleGrid({ onAddClick, onEditClick, refreshTrigger, archived = false }: VehicleGridProps) {
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({ currentPage: 1, pages: 1 })

    useEffect(() => {
        fetchVehicles(pagination.currentPage)
    }, [refreshTrigger, pagination.currentPage, archived])

    const fetchVehicles = async (page: number) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/claim-vehicles?page=${page}&archived=${archived}`)
            const data = await res.json()
            if (res.ok) {
                setVehicles(data.vehicles)
                setPagination({
                    currentPage: data.pagination.currentPage,
                    pages: data.pagination.pages
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleArchive = async (id: string) => {
        try {
            const res = await fetch(`/api/claim-vehicles/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchived: !archived })
            })
            if (res.ok) {
                fetchVehicles(pagination.currentPage)
            }
        } catch (error) {
            console.error(error)
        }
    }

    if (loading && vehicles.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500 font-medium">Loading vehicles...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {!archived && (
                    <button
                        onClick={onAddClick}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-4 border-dashed border-gray-100 bg-gray-50/50 text-gray-400 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-500 transition-all duration-300 group min-h-[200px]"
                    >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold uppercase tracking-widest text-xs">Add Vehicle</span>
                    </button>
                )}

                {vehicles.map((vehicle: any) => (
                    <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onEdit={onEditClick}
                        onArchive={handleArchive}
                    />
                ))}
            </div>

            {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 pb-8">
                    <button
                        disabled={pagination.currentPage === 1}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <span className="font-bold text-gray-600">
                        Page {pagination.currentPage} of {pagination.pages}
                    </span>
                    <button
                        disabled={pagination.currentPage === pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            )}

            {!loading && vehicles.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    <p className="text-gray-400 font-medium">No vehicles found.</p>
                </div>
            )}
        </div>
    )
}
