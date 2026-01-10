/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { useToast } from '../ui/NeoToast';
import { SecretVaultManager } from './SecretVaultManager';

interface AnalyzedDocument {
  category: string;
  documentType: string;
  keyDetails: string[];
  summary: string;
  confidence: number;
}

export function UploadPanel() {
  const documents = useQuery(api.documents.listDocuments, {});
  const uploadDocument = useMutation(api.documents.uploadDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const { showToast } = useToast();
  
  // SecretVault integration
  const vaultManager = SecretVaultManager();
  
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeDocumentWithOpenAI = async (base64Image: string, filename: string): Promise<AnalyzedDocument> => {
    const response = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        filename: filename,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze document');
    }

    return response.json();
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Filter for image files
    const imageFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf'
    );

    if (imageFiles.length === 0) {
      showToast('Please select image files (JPG, PNG) or PDF documents', 'danger');
      return;
    }

    // Check if SecretVault is set up
    if (!vaultManager.hasKeypair) {
      showToast('Please setup SecretVault first to securely store documents', 'danger');
      return;
    }

    setIsUploading(true);

    for (const file of imageFiles) {
      try {
        const fileId = `${file.name}_${Date.now()}`;
        setAnalyzingFiles(prev => new Set(prev).add(fileId));
        
        showToast(`Analyzing ${file.name}...`, 'info');

        let analysisResult: AnalyzedDocument;
        let base64Image: string;

        if (file.type.startsWith('image/')) {
          // Handle image files
          base64Image = await convertFileToBase64(file);
          analysisResult = await analyzeDocumentWithOpenAI(base64Image, file.name);
        } else {
          // For PDFs, we'll need to convert to image first or handle differently
          // For now, let's create a mock analysis for PDFs
          base64Image = await convertFileToBase64(file);
          analysisResult = {
            category: 'Bank Statement',
            documentType: 'PDF Document',
            keyDetails: ['PDF document uploaded', 'Manual review required'],
            summary: 'PDF document uploaded successfully',
            confidence: 0.7
          };
        }

        // Upload to database with analysis results
        const documentId = await uploadDocument({
          vaultRef: `vault_${Math.random().toString(36).substr(2, 16)}`,
          filename: file.name,
          category: analysisResult.category,
          documentType: analysisResult.documentType,
          keyDetails: analysisResult.keyDetails,
          summary: analysisResult.summary,
          confidence: analysisResult.confidence,
          rawOutput: JSON.stringify(analysisResult), // Store the complete analysis result
        });

        // Store in SecretVault (encrypted storage)
        showToast(`Encrypting ${file.name} in SecretVault...`, 'info');
        await vaultManager.storeInVault(documentId, analysisResult, base64Image);

        setAnalyzingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });

        showToast(
          `✅ ${file.name} analyzed and secured: ${analysisResult.documentType} (${(analysisResult.confidence * 100).toFixed(0)}% confidence)`,
          'success'
        );

      } catch (error: unknown) {
        const fileId = `${file.name}_${Date.now()}`;
        setAnalyzingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        
        showToast(
          error instanceof Error ? error.message : `Failed to analyze ${file.name}`,
          'danger'
        );
      }
    }

    setIsUploading(false);
  };

  const handleDeleteDocument = async (documentId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingFiles(prev => new Set(prev).add(documentId));
      await deleteDocument({ documentId: documentId as any }); // Type assertion for Convex ID
      showToast(`✅ ${filename} deleted successfully`, 'success');
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : `Failed to delete ${filename}`,
        'danger'
      );
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset the input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const categories = ['Mobile Money', 'Utilities', 'Income Proof', 'Bank Statement', 'Other'];

  return (
    <NeoCard bg="bg-white">
      <h3 className="text-2xl font-black uppercase mb-6">Upload Financial Documents</h3>

      {/* SecretVault Status */}
      <vaultManager.VaultStatus />

      <div 
        className={`border-4 border-dashed p-8 mb-6 text-center transition-colors cursor-pointer ${
          dragActive 
            ? 'border-primary bg-primary bg-opacity-20' 
            : 'border-foreground bg-secondary bg-opacity-20'
        } ${!vaultManager.hasKeypair ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={vaultManager.hasKeypair ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!vaultManager.hasKeypair}
        />
        
        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="font-bold text-lg mb-2">
          {dragActive ? 'Drop files here' : vaultManager.hasKeypair ? 'Click to upload or drag & drop' : 'Setup SecretVault to upload'}
        </p>
        <p className="text-sm font-semibold mb-2 text-gray-600">
          📱 Bank statements, bills, pay stubs, mobile money records
        </p>
        <p className="text-xs font-bold text-gray-500">
          Supports: JPG, PNG, PDF • AI analyzes + SecretVault encryption
        </p>
        {isUploading && (
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-bold text-sm rounded">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Analyzing & encrypting documents...
            </div>
          </div>
        )}
      </div>

      {/* Quick Upload Categories */}
      <div className="mb-6">
        <p className="font-bold text-sm uppercase tracking-wide mb-3">Quick Upload by Category:</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <NeoButton
              key={cat}
              size="sm"
              variant="accent"
              onClick={openFileDialog}
              disabled={isUploading || !vaultManager.hasKeypair}
            >
              + {cat}
            </NeoButton>
          ))}
        </div>
        <p className="text-xs font-semibold text-gray-500 mt-2">
          AI will automatically categorize your documents + store in SecretVault
        </p>
      </div>

      {/* Document List */}
      <div>
        <p className="font-bold text-sm uppercase tracking-wide mb-3">
          Uploaded Documents ({documents?.length || 0}):
        </p>
        {!documents ? (
          <div className="text-center py-8 border-4 border-foreground bg-gray-50">
            <p className="font-semibold text-gray-600">Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 border-4 border-foreground bg-gray-50">
            <p className="font-semibold text-gray-600">No documents uploaded yet</p>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              Upload bank statements, bills, or financial documents to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(file => (
              <div key={file._id} className="p-4 border-4 border-foreground bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex flex-col items-center">
                      <svg className="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs mt-1">🔐</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm">{file.filename}</p>
                        <NeoBadge variant="success">{file.category}</NeoBadge>
                        <NeoBadge variant="accent">Encrypted</NeoBadge>
                        {file.confidence && (
                          <NeoBadge variant={file.confidence > 0.8 ? 'success' : file.confidence > 0.6 ? 'accent' : 'neutral'}>
                            {(file.confidence * 100).toFixed(0)}%
                          </NeoBadge>
                        )}
                      </div>
                      
                      {file.documentType && (
                        <p className="text-xs font-bold text-gray-600 mb-1">
                          📄 {file.documentType}
                        </p>
                      )}
                      
                      {file.summary && (
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          {file.summary}
                        </p>
                      )}
                      
                      {file.keyDetails && file.keyDetails.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-bold text-gray-700 mb-2">Extracted Financial Details:</p>
                          <div className="space-y-1">
                            {file.keyDetails.map((detail, idx) => (
                              <div key={idx} className="text-xs bg-gray-100 px-2 py-1 border border-gray-300 font-semibold rounded">
                                {detail}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs font-semibold text-gray-500 mt-2">
                        Uploaded {new Date(file.uploadedAt).toLocaleDateString()} • Stored in SecretVault
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <NeoButton
                      size="sm"
                      variant="accent"
                      onClick={() => vaultManager.retrieveFromVault(file._id)}
                    >
                      View Encrypted
                    </NeoButton>
                    <NeoButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteDocument(file._id, file.filename)}
                      disabled={deletingFiles.has(file._id)}
                    >
                      Delete
                    </NeoButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analyzing Status */}
      {analyzingFiles.size > 0 && (
        <div className="mt-4 p-3 bg-primary bg-opacity-20 border-4 border-foreground">
          <p className="text-sm font-bold flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Analyzing & encrypting {analyzingFiles.size} document{analyzingFiles.size > 1 ? 's' : ''}...
          </p>
        </div>
      )}

      {/* Privacy Note */}
      <div className="mt-6 p-4 bg-accent bg-opacity-30 border-4 border-foreground">
        <p className="text-sm font-bold flex items-start gap-2">
          <span>🔐</span>
          <span>Enhanced Security: Documents analyzed by AI, then encrypted in your personal SecretVault using Nillions Private Storage. Only you can decrypt and access raw documents. Lenders see AI summaries only.</span>
        </p>
      </div>
    </NeoCard>
  );
}
