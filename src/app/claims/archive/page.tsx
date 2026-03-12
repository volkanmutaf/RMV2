
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import VehicleGrid from '@/components/claims/VehicleGrid'
import VehicleModal from '@/components/claims/VehicleModal'

export default function ArchivePage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingVehicle, setEditingVehicle] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleEditClick = (vehicle: any) => {
        setEditingVehicle(vehicle)
        setIsModalOpen(true)
    }

    const handleSave = async (formData: any) => {
        if (!editingVehicle) return

        try {
            const res = await fetch(`/api/claim-vehicles/${editingVehicle.id}`, {
                method: 'PATCH',
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
                <div className="flex items-center gap-4">
                    <Link href="/claims" className="p-2 bg-white rounded-xl shadow-sm text-gray-400 hover:text-blue-500 transition-all border border-gray-100">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">ARCHIVE</h1>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">Completed vehicle cards</p>
                    </div>
                </div>

                <VehicleGrid
                    onAddClick={() => {}}
                    onEditClick={handleEditClick}
                    refreshTrigger={refreshTrigger}
                    archived={true}
                />

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
