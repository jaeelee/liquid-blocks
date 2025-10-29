import React, { useEffect, useState } from 'react'
import './bottom-picker.css'

interface PickerProps<T extends string | number> {
    title?: string
    selectedValue: T
    onValueChange: (value: T) => void
    values: T[]
    isVisible: boolean
    setIsVisible: (isVisible: boolean) => void
}

export function BottomPicker<T extends string | number>({ title, selectedValue, onValueChange, values, isVisible, setIsVisible }: PickerProps<T>) {
    const [selected, setSelected] = useState<T>(selectedValue)
    useEffect(() => { setSelected(selectedValue) }, [selectedValue])

    if (!isVisible) return null
    return (
        <div className="picker-overlay" onClick={() => setIsVisible(false)}>
            <div className="picker-body" onClick={(e) => e.stopPropagation()}>
                <div className="picker-title">{title}</div>
                <div className="picker-row">
                    <select className="picker-select" value={String(selected)} onChange={(e) => {
                        const raw = e.target.value
                        const parsed = (typeof selectedValue === 'number') ? (Number(raw) as T) : (raw as unknown as T)
                        setSelected(parsed)
                    }}>
                        {values.map(v => (
                            <option key={String(v)} value={String(v)}>{String(v)}</option>
                        ))}
                    </select>
                </div>
                <div className="picker-actions">
                    <button onClick={() => setIsVisible(false)}>취소</button>
                    <button onClick={() => { onValueChange(selected); setIsVisible(false) }}>확인</button>
                </div>
            </div>
        </div>
    )
}


