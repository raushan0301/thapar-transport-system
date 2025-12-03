import React from 'react';
import { Download } from 'lucide-react';

const ExportButton = ({ data, filename = 'export', headers, variant = 'primary' }) => {
    const exportToCSV = () => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        // Create CSV content
        let csvContent = '';

        // Add headers
        if (headers && headers.length > 0) {
            csvContent += headers.join(',') + '\n';
        } else {
            // Use keys from first object as headers
            csvContent += Object.keys(data[0]).join(',') + '\n';
        }

        // Add data rows
        data.forEach(row => {
            const values = headers
                ? headers.map(header => {
                    const value = row[header.key || header];
                    // Escape commas and quotes
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                })
                : Object.values(row).map(value => {
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });

            csvContent += values.join(',') + '\n';
        });

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const buttonClasses = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50'
    };

    return (
        <button
            onClick={exportToCSV}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${buttonClasses[variant]}`}
        >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
        </button>
    );
};

export default ExportButton;
