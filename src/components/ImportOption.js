'use client';

import { useRef, useState } from 'react';
import { useCustomMappings } from '../contexts/CustomMappingsContext';

export default function ImportOption({
    title,
    parser,
    type,
    icon: Icon,
    accept,
    color = 'primary',
    setPreviewData,
    setError,
    error,
    uploadStatus,
    setUploadStatus,
}) {
    const { customMappings } = useCustomMappings();
    const fileInputRef = useRef();
    const [file, setFile] = useState(null);
    const [transactionCount, setTransactionCount] = useState(0);

    // Set color based on import type
    const importColor = {
        pdf: {
            hoverBorderColorClass: "hover:border-red-600",
            hoverBgColorClass: "hover:bg-red-600/5",
            iconColorClass: "text-red-600",
            buttonBgClass: "bg-red-600",
            buttonHoverClass: "hover:bg-red-600-dark"
        },
        csv: {
            hoverBorderColorClass: "hover:border-green-600",
            hoverBgColorClass: "hover:bg-green-600/5",
            iconColorClass: "text-green-600",
            buttonBgClass: "bg-green-600",
            buttonHoverClass: "hover:bg-green-600-dark"
        },
        splitwise: {
            hoverBorderColorClass: "hover:border-teal-500",
            hoverBgColorClass: "hover:bg-teal-500/5",
            iconColorClass: "text-teal-500",
            buttonBgClass: "bg-teal-500",
            buttonHoverClass: "hover:bg-teal-500-dark"
        },
        smart: {
            hoverBorderColorClass: "hover:border-primary",
            hoverBgColorClass: "hover:bg-primary/5",
            iconColorClass: "text-primary",
            buttonBgClass: "bg-primary",
            buttonHoverClass: "hover:bg-primary-dark"
        }
    }[type] || color;

    // Generate color-related class names
    const hoverBorderColorClass = importColor["hoverBorderColorClass"];
    const hoverBgColorClass = importColor["hoverBgColorClass"];
    const iconColorClass = importColor["iconColorClass"];
    const buttonBgClass = importColor["buttonBgClass"];
    const buttonHoverClass = importColor["buttonHoverClass"];

    const onFileSelect = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        let transactions = null;

        try {
            transactions = await parser(selectedFile, customMappings);
            if (!transactions || transactions.length === 0) {
                throw new Error('No valid transactions found in the file');
            }
            setUploadStatus((prev) => ({ ...prev, [type]: 'success' }));
            setTransactionCount(transactions.length);
            setPreviewData(transactions);
        } catch (err) {
            console.error('Error parsing file:', err);
            setError((prev) => ({ ...prev, [type]: err.message || 'Error parsing file. Please check the file format and try again.' }));
            setUploadStatus((prev) => ({ ...prev, [type]: 'error' }));
            setPreviewData(null);
        } finally {
            // Reset the file input to ensure it can be reselected
            event.target.value = '';
        }
    };




    return (
        <div
            className="bg-white rounded-lg p-6 shadow-md transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl h-[320px] flex flex-col"
            data-import-type={type}
        >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 line-clamp-2 h-14">{title}</h3>
            <div className="flex-grow mb-4">
                <label className={`flex flex-col items-center justify-center h-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer ${hoverBorderColorClass} ${hoverBgColorClass} transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md group`}>
                    <input
                        type="file"
                        accept={accept}
                        onChange={onFileSelect}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <Icon className={`text-4xl mb-2 ${iconColorClass} transition-all duration-300 ease-in-out transform group-hover:scale-110 group-hover:rotate-3`} />
                    <span className="text-sm font-medium text-gray-600 text-center group-hover:text-gray-800 transition-all duration-300 transform group-hover:scale-105">Select <span className="uppercase">{type}</span> File</span>
                </label>
            </div>
            <div className="mt-auto">
                {uploadStatus?.[type] && uploadStatus?.[type] === 'success' && (
                    <div className={`text-sm mb-2 truncate ${uploadStatus?.[type] === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        <span>✓ Successfully parsed {transactionCount} transactions</span>
                    </div>
                )}
                {error && (
                    <div className="mt-2 text-sm text-red-600 truncate text-wrap">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}