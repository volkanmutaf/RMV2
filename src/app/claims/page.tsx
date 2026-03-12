
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Archive, List } from 'lucide-react'
import VehicleGrid from '@/components/claims/VehicleGrid'
import VehicleModal from '@/components/claims/VehicleModal'

export default function ClaimsSummaryPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleAddClick = () => {
        setEditingVehicle(null)
        setIsModalOpen(true)
    }

    const handleEditClick = (vehicle: any) => {
        setEditingVehicle(vehicle)
        setIsModalOpen(true)
    }

    const handleSave = async (formData: any) => {
        const url = editingVehicle ? `/api/claim-vehicles/${editingVehicle.id}` : '/api/claim-vehicles'
        const method = editingVehicle ? 'PATCH' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setRefreshTrigger(prev => prev + 1)
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-blue-500 transition-all border border-gray-100">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">CLAIMS</h1>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Vehicle Management Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/claims/archive"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-xl font-bold shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                        >
                            <Archive size={18} />
                            <span>ARCHIVE</span>
                        </Link>
                        <Link
                            href="/claims/list"
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 text-gray-600 rounded-xl font-bold shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
                        >
                            <List size={18} />
                            <span>LEGACY LIST</span>
                        </Link>
                        <Link
                            href="/claims/new"
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-extrabold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                        >
                            <span>NEW PDF CLAIM</span>
                        </Link>
                    </div>
                </div>

                {/* Main Content: Vehicle Grid */}
                <VehicleGrid
                    onAddClick={handleAddClick}
                    onEditClick={handleEditClick}
                    refreshTrigger={refreshTrigger}
                />

                {/* Modal for Add/Edit */}
                <VehicleModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingVehicle}
                />
            </div>
        </div>
    )
}
