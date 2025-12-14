import { Place } from '@/lib/places'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { apiClient } from '@/utils/enhanced-api-client'
import Panel from './ui/Panel'

const ScrapeContacts = ({ places, country, city, type }: { places: Place[], country: string, city: string, type: string }) => {
    const [contacts, setContacts] = useState<{
        url: string
        emails: string[]
        phoneNumbers: string[]
    }[]>([])
    const [summary, setSummary] = useState<{
        total: number
        successful: number
        failed: number
        totalEmails: number
        totalPhoneNumbers: number
    }>({
        total: 0,
        successful: 0,
        failed: 0,
        totalEmails: 0,
        totalPhoneNumbers: 0,
    })


    const scrapeContacts = async () => {
        console.log(country)

        const contacts = await apiClient.scrapeContacts({ 
            urls: places.map(place => place.Url),
            country: country
        })
        setContacts(contacts.results)
        setSummary(contacts.summary)
    }

    const downloadCsv = (contacts: {
        url: string
        emails: string[]
        phoneNumbers: string[]
    }[]) => {
        const csv = contacts.map(contact => `${contact.url},${contact.emails.join(',')},${contact.phoneNumbers.join(',')}`).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${city}${type}contacts.csv`
        a.click()
    }
    return (
        <div>
            <span className="text-text text-2xl text-left font-semibold">Scrape contact details for {places.length} places (Beta)</span>
            <div className="w-2/3 mx-auto">
                <Button
                    variant="outline"
                    onClick={() => scrapeContacts()}
                    className="px-6 bg-foreground border-2 border-border rounded-md text-lg font-semibold hover:bg-slate-700 hover:scale-95 transition duration-300">
                    Scrape
                </Button>

                {contacts.length > 0 && <Panel title="Summary" items={Object.entries(summary).map(([key, value]) => ({ label: key, value: value.toString() }))}/>}
                {contacts.length > 0 && <Button onClick={() => downloadCsv(contacts)}>Download CSV</Button>}
            </div>
        </div>
    )

}

export default ScrapeContacts