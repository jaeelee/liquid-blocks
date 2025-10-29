import React from 'react'
import './header.css'

interface HeaderProps {
    title: string
    onBackPress?: () => void
    showBackButton?: boolean
}

export const Header: React.FC<HeaderProps> = ({ title, onBackPress, showBackButton = true }) => {
    return (
        <div className="header">
            <div className="header-content">
                {showBackButton && onBackPress && (
                    <button className="back-btn" onClick={onBackPress}>←</button>
                )}
                <div className="header-title">{title}</div>
                <div className="header-right" />
            </div>
        </div>
    )
}


