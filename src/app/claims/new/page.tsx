
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClaimPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        vehicleOwner: '',
        claimNumber: '',
        yearMakeModel: '',
        insuranceCompany: '',
        policyNumber: '',
        vin: ''
    })

    const [isDecodingVin, setIsDecodingVin] = useState(false)

    // Helper to pre-format data as typed
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === 'vin') {
            const newVin = value.toUpperCase().slice(0, 17)
            setFormData(prev => ({ ...prev, [name]: newVin }))

            // Auto-decode VIN when 17 chars
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

                if (year && make && model) {
                    const yearMakeModel = `${year} ${make} ${model}`
                    setFormData(prev => ({ ...prev, yearMakeModel }))
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
        setError('')

        try {
            const res = await fetch('/api/claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            let data
            const contentType = res.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                data = await res.json()
            } else {
                const text = await res.text()
                console.error('Non-JSON response:', text)
                throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}...`) // Show start of HTML/text
            }

            if (!res.ok) {
                console.error('Server error details:', data)
                throw new Error(data.error || data.details || 'Failed to create claim')
            }

            const downloadLink = document.createElement('a')
            downloadLink.href = `/api/claims/${data.id}/pdf`
            downloadLink.target = '_blank'
            downloadLink.click()

            router.push('/claims')

        } catch (err) {
            console.error('Submission error:', err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/claims" className="text-gray-500 hover:text-gray-700">
                        ← Back
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Claim Authorization</h1>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vehicle Owner *
                            </label>
                            <input
                                type="text"
                                name="vehicleOwner"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                value={formData.vehicleOwner}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Claim Number
                                </label>
                                <input
                                    type="text"
                                    name="claimNumber"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    value={formData.claimNumber}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Policy Number
                                </label>
                                <input
                                    type="text"
                                    name="policyNumber"
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    value={formData.policyNumber}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                VIN (17 Characters) *
                                {isDecodingVin && <span className="ml-2 text-blue-600 text-xs animate-pulse">Decoding...</span>}
                            </label>
                            <input
                                type="text"
                                name="vin"
                                required
                                minLength={17}
                                maxLength={17}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none font-mono tracking-wider transition-colors"
                                value={formData.vin}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.vin.length} / 17</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Year / Make / Model *
                            </label>
                            <input
                                type="text"
                                name="yearMakeModel"
                                required
                                placeholder="e.g. 2020 Honda Civic"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                value={formData.yearMakeModel}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Insurance Company *
                            </label>
                            <input
                                type="text"
                                name="insuranceCompany"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                value={formData.insuranceCompany}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                            <Link
                                href="/claims"
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? 'Generating...' : 'Generate PDF'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
