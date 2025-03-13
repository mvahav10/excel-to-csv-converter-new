'use client';
import { useState } from 'react';
import { Inter } from 'next/font/google';
import * as XLSX from 'xlsx';
/*dfsf */
const inter = Inter({ subsets: ['latin'] });

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setUploadSuccess(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);

        try {
            // Read the Excel file
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // For each sheet in the workbook
                    workbook.SheetNames.forEach((sheetName) => {
                        // Convert sheet to CSV with UTF-8 encoding
                        const worksheet = workbook.Sheets[sheetName];

                        // Use these options to better handle Hebrew and special characters
                        const csvContent = XLSX.utils.sheet_to_csv(worksheet, {
                            // Preserve all whitespace
                            blankrows: true,
                            // Use quotes around fields that contain special characters
                            quoteStrings: true
                        });

                        // Add UTF-8 BOM to ensure Excel recognizes the encoding correctly
                        const utf8BOM = '\uFEFF';
                        const csvWithBOM = utf8BOM + csvContent;

                        // Create a blob with the CSV content with proper encoding
                        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });

                        // Create a filename
                        let filename;
                        if (workbook.SheetNames.length === 1) {
                            filename = `${file.name.split('.')[0]}.csv`;
                        } else {
                            filename = `${file.name.split('.')[0]}_${sheetName}.csv`;
                        }

                        // Create download link and trigger download
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    });

                    setUploadSuccess(true);
                } catch (error) {
                    console.error('Error converting file:', error);
                    alert('Error converting file. Please try again.');
                } finally {
                    setIsUploading(false);
                }
            };

            reader.onerror = () => {
                alert('Error reading file. Please try again.');
                setIsUploading(false);
            };

            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error during file conversion:', error);
            alert('An error occurred during file conversion.');
            setIsUploading(false);
        }
    };

    return (
        <main className={`${inter.className} flex min-h-screen flex-col items-center justify-center p-4 md:p-24`}>
            <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-6 text-center">Excel to CSV Converter</h1>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Upload Excel File
                    </label>
                    <input
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleFileChange}
                        className="w-full p-2 border border-gray-300 rounded"
                    />
                </div>

                {file && (
                    <div className="mb-4 p-3 bg-gray-100 rounded">
                        <p className="text-sm">Selected file: <span className="font-semibold">{file.name}</span></p>
                    </div>
                )}
                
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className={`w-full p-3 rounded font-bold ${!file
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isUploading
                            ? 'bg-blue-300 text-white cursor-wait'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {isUploading ? 'Processing...' : 'Convert to CSV'}
                </button>

                {uploadSuccess && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
                        <p>Conversion successful! Your file has been downloaded.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
