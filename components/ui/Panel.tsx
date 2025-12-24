import React from 'react'


type PanelProps = {
    title: string
    items: {
        label: string
        value: string
    }[]
}

const Panel = ({ title, items }: PanelProps) => {
    return (
        <div className="flex flex-col gap-2 text-text text-left text-sm mb-4 border-2 border-neon-blue rounded-sm bg-foreground-secondary p-2">
            <h3 className="text-3xl font-bold mb-6 text-left pb-2">{title}</h3>
            {items.map((item, index) => (
                <div className="flex flex-row justify-between mr-4">
                    <span className="text-xl font-bold">{item.label}: </span>
                    <span className="italic text-lg">{item.value}</span>
                </div>
            ))}
        </div>
    )
}

export default Panel