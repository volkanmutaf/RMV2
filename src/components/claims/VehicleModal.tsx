
'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

interface VehicleModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: any) => void
    initialData?: any
}

export default function VehicleModal({ isOpen, onClose, onSave, initialData }: VehicleModalProps) {
    const [loading, setLoading] = useState(false)
    const [isDecodingVin, setIsDecodingVin] = useState(false)
    const [formData, setFormData] = useState({
        year: '',
        make: '',
        model: '',
        color: '',
        vin: '',
        description: ''
    })

    useEffect(() => {
        if (initialData) {
            setFormData({
                year: initialData.year || '',
                make: initialData.make || '',
                model: initialData.model || '',
                color: initialData.color || '',
                vin: initialData.vin || '',
                description: initialData.description || ''
            })
        } else {
            setFormData({
                year: '',
                make: '',
                model: '',
                color: '',
                vin: '',
                description: ''
            })
        }
    }, [initialData, isOpen])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'vin') {
            const newVin = value.toUpperCase().slice(0, 17)
            setFormData(prev => ({ ...prev, [name]: newVin }))

            if (newVin.length === 17) {
                decodeVin(newVin)
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const decodeVin = async (vin: string) => {
        setIsDecodingVin(true)
        try {
            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${encodeURIComponent(vin)}?format=json`)
            const data = await response.json()

            if (data.Results) {
                let year = ''
                let make = ''
                let model = ''

                data.Results.forEach((item: any) => {
                    if (item.Variable === 'Model Year') year = item.Value
                    if (item.Variable === 'Make') make = item.Value
                    if (item.Variable === 'Model') model = item.Value
                })

                if (year || make || model) {
                    setFormData(prev => ({
                        ...prev,
                        year: year || prev.year,
                        make: make || prev.make,
                        model: model || prev.model
                    }))
                }
            }
        } catch (error) {
            console.error('Error decoding VIN:', error)
        } finally {
            setIsDecodingVin(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Vehicle' : 'Add New Vehicle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            VIN (17 Characters)
                            {isDecodingVin && <Loader2 size={14} className="inline ml-2 animate-spin text-blue-600" />}
                        </label>
                        <input
                            type="text"
                            name="vin"
                            placeholder="Enter VIN for auto-fill"
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-mono tracking-widest transition-all"
                            value={formData.vin}
                            onChange={handleChange}
                            maxLength={17}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year *</label>
                            <input
                                type="text"
                                name="year"
                                required
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                value={formData.year}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Color</label>
                            <input
                                type="text"
                                name="color"
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                value={formData.color}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Make *</label>
                            <input
                                type="text"
                                name="make"
                                required
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                value={formData.make}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model *</label>
                            <input
                                type="text"
                                name="model"
                                required
                                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all"
                                value={formData.model}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition-all resize-none"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add any notes here..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-bold transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {loading ? 'Saving...' : 'Save Vehicle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
