import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { useDropzone } from 'react-dropzone';
import './App.css';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState('');
  const [splitPages, setSplitPages] = useState('');

  const handleFileChange = (e) => {
    const fileList = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...fileList]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    const fileItems = document.querySelectorAll('.file-item');
    const fileToRemove = fileItems[index];

    // Add fade-out effect
    fileToRemove.classList.add('removing');

    // Remove after animation ends
    setTimeout(() => {
      const updatedFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(updatedFiles);
    }, 400); // Match with CSS transition time
  };

  const handleSplitPagesChange = (e) => {
    setSplitPages(e.target.value);
  };

  const handleSplit = async () => {
    if (selectedFiles.length === 0) {
      setError('Please upload a PDF file.');
      return;
    }

    try {
      const file = selectedFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageIndices = splitPages.split(',').map((num) => parseInt(num.trim(), 10) - 1);

      for (const index of pageIndices) {
        if (index < 0 || index >= pdfDoc.getPageCount()) {
          setError(`Invalid page number: ${index + 1}`);
          return;
        }
      }

      const newPdfDoc = await PDFDocument.create();

      for (const index of pageIndices) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]);
        newPdfDoc.addPage(copiedPage);
      }

      const newPdfBytes = await newPdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'split.pdf';
      link.click();
    } catch (err) {
      setError('An error occurred while splitting the PDF.');
    }
  };

  const handleMerge = async () => {
    if (selectedFiles.length < 2) {
      setError('Please upload at least two PDF files to merge.');
      return;
    }

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of selectedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'merged.pdf';
      link.click();
    } catch (err) {
      setError('An error occurred while merging the PDFs.');
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: '.pdf',
    onDrop: (acceptedFiles) => {
      setSelectedFiles([...selectedFiles, ...acceptedFiles]);
    },
  });

  return (
    <div className="app-container">
      <h1>PDF Splitter & Merger</h1>

      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        <p>Drag & drop PDF files here, or <b>click</b> to select</p>
      </div>

      <div className="file-list">
        {selectedFiles.map((file, index) => (
          <div key={index} className="file-item">
            <span>{file.name}</span>
            <button onClick={() => handleRemoveFile(index)} className="delete-btn">❌</button>
          </div>
        ))}
      </div>

      <div className="btn-group">
        <input
          type="text"
          placeholder="Pages to split (e.g., 1,3,5)"
          value={splitPages}
          onChange={handleSplitPagesChange}
        />
        <button onClick={handleSplit}>Split PDF</button>
      </div>

      <div className="btn-group">
        <button onClick={handleMerge}>Merge PDFs</button>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default App;
