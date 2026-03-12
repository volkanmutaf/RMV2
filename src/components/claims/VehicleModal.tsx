
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-md p-4 transition-all duration-500 border-none">
            <div className="bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 ease-out border-none">
                <div className="flex items-center justify-between p-8 pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {initialData ? 'EDIT VEHICLE' : 'NEW VEHICLE'}
                        </h2>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {initialData ? 'Updating existing record' : 'Adding to the grid'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* VIN Entry with special styling */}
                    <div className="relative group">
                        <label className="flex items-center justify-between text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
                            <span>VIN (17 Characters)</span>
                            {isDecodingVin && (
                                <div className="flex items-center gap-2 text-blue-600">
                                    <span className="animate-pulse">DECODING</span>
                                    <Loader2 size={12} className="animate-spin" />
                                </div>
                            )}
                        </label>
                        <input
                            type="text"
                            name="vin"
                            placeholder="Type or paste VIN..."
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.2rem] px-5 py-4 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-mono text-lg tracking-[0.15em] transition-all placeholder:text-gray-300 placeholder:font-sans placeholder:tracking-normal placeholder:text-base font-bold"
                            value={formData.vin}
                            onChange={handleChange}
                            maxLength={17}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1 text-black">YEAR *</label>
                            <input
                                type="text"
                                name="year"
                                required
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.2rem] px-5 py-3 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-bold transition-all"
                                value={formData.year}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">COLOR</label>
                            <input
                                type="text"
                                name="color"
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.2rem] px-5 py-3 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-bold transition-all"
                                value={formData.color}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">MAKE *</label>
                            <input
                                type="text"
                                name="make"
                                required
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.2rem] px-5 py-3 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-bold transition-all"
                                value={formData.make}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">MODEL *</label>
                            <input
                                type="text"
                                name="model"
                                required
                                className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.2rem] px-5 py-3 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-bold transition-all"
                                value={formData.model}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">DESCRIPTION / NOTES</label>
                        <textarea
                            name="description"
                            rows={3}
                            className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] px-5 py-4 outline-none focus:border-blue-500 focus:bg-white text-gray-900 font-bold transition-all resize-none leading-relaxed placeholder:font-medium"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add car history, mechanical issues, etc..."
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-[1.2rem] font-black uppercase tracking-widest text-xs transition-all"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[1.5] px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 ${
                                loading ? 'opacity-50 cursor-not-allowed translate-y-0 shadow-none' : ''
                            }`}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            <span>{loading ? 'SAVING...' : 'SAVE VEHICLE'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
