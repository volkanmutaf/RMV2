
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Claim {
    id: string
    vehicleOwner: string
    claimNumber: string | null
    yearMakeModel: string
    insuranceCompany: string
    policyNumber: string | null
    vin: string
    pdfPath: string
    createdAt: string
}

export default function ClaimsPage() {
    const [claims, setClaims] = useState<Claim[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchClaims()
    }, [])

    const fetchClaims = async (query = '') => {
        setLoading(true)
        try {
            const url = query ? `/api/claims?query=${encodeURIComponent(query)}` : '/api/claims'
            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setClaims(data)
            }
        } catch (error) {
            console.error('Failed to fetch claims', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchClaims(searchTerm)
    }


    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this claim?')) return

        try {
            const res = await fetch(`/api/claims/${id}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete')
            fetchClaims(searchTerm) // Refresh list
        } catch (error) {
            console.error(error)
            alert('Failed to delete claim')
        }
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
                    <Link
                        href="/claims/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Create New Claim
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Search by owner, VIN, or claim number..."
                            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Search
                        </button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">VIN</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Claim #</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Insurance</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                                    </tr>
                                ) : claims.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No claims found.</td>
                                    </tr>
                                ) : (
                                    claims.map((claim) => (
                                        <tr key={claim.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(claim.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {claim.vehicleOwner}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {claim.yearMakeModel}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                {claim.vin}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {claim.claimNumber || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {claim.insuranceCompany}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                                <a
                                                    href={`/api/claims/${claim.id}/pdf`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                                                >
                                                    Download PDF
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(claim.id)}
                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )

}
