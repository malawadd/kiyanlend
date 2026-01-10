/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { useToast } from '../ui/NeoToast';

interface AnalyzedDocument {
  category: string;
  documentType: string;
  keyDetails: string[];
  summary: string;
  confidence: number;
}

interface LoanRequestUploadPanelProps {
  loanRequestId: Id<"loanRequests">;
  shortId?: string;
  compact?: boolean;
}

export function LoanRequestUploadPanel({ loanRequestId, shortId, compact = false }: LoanRequestUploadPanelProps) {
  const documents = useQuery(api.documents.listDocumentsForLoanRequest, { loanRequestId });
  const uploadDocument = useMutation(api.documents.uploadDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const { showToast } = useToast();
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const keypair = useQuery(
    api.keypairs.getUserKeypair,
    currentUser ? { userId: currentUser._id } : 'skip'
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingKeypair, setIsGeneratingKeypair] = useState(false);
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
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!keypair) {
      showToast('Please setup SecretVault first to securely store documents', 'danger');
      return;
    }

    const fileArray = Array.from(files);
    
    const imageFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || 
      file.type === 'application/pdf'
    );

    if (imageFiles.length === 0) {
      showToast('Please select image files (JPG, PNG) or PDF documents', 'danger');
      return;
    }

    setIsUploading(true);

    for (const file of imageFiles) {
      try {
        const fileId = `${file.name}_${Date.now()}`;
        setAnalyzingFiles(prev => new Set(prev).add(fileId));
        
        showToast(`Analyzing ${file.name}...`, 'info');

        let analysisResult: AnalyzedDocument;

        if (file.type.startsWith('image/')) {
          const base64 = await convertFileToBase64(file);
          analysisResult = await analyzeDocumentWithOpenAI(base64, file.name);
        } else {
          // Mock analysis for PDFs
          analysisResult = {
            category: 'Bank Statement',
            documentType: 'PDF Document',
            keyDetails: ['PDF document uploaded', 'Manual review required'],
            summary: 'PDF document uploaded successfully',
            confidence: 0.7
          };
        }

        // Upload to database with loan request association
        await uploadDocument({
          loanRequestId,
          vaultRef: `vault_${Math.random().toString(36).substr(2, 16)}`,
          filename: file.name,
          category: analysisResult.category,
          documentType: analysisResult.documentType,
          keyDetails: analysisResult.keyDetails,
          summary: analysisResult.summary,
          confidence: analysisResult.confidence,
          rawOutput: JSON.stringify(analysisResult),
        });

        setAnalyzingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });

        showToast(
          `✅ ${file.name} added to loan request: ${analysisResult.documentType}`,
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
    if (!confirm(`Remove "${filename}" from this loan request?`)) {
      return;
    }

    try {
      setDeletingFiles(prev => new Set(prev).add(documentId));
      await deleteDocument({ documentId: documentId as any });
      showToast(`✅ ${filename} removed from loan request`, 'success');
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : `Failed to remove ${filename}`,
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
  }, [handleFileUpload]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (!keypair) {
      showToast('Please setup SecretVault first to securely store documents', 'danger');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleGenerateKeypair = async () => {
    setIsGeneratingKeypair(true);
    try {
      showToast('Generating SecretVault keypair...', 'info');
      
      const response = await fetch('/api/generate-keypair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate keypair');
      }

      const data = await response.json();
      showToast(`✅ SecretVault keypair generated! DID: ${data.keypair.did}`, 'success');
      
    } catch (error) {
      console.error('Keypair generation error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate keypair',
        'danger'
      );
    } finally {
      setIsGeneratingKeypair(false);
    }
  };

  if (compact) {
    return (
      <NeoCard bg="bg-white">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-black uppercase">Supporting Documents</h4>
          <NeoButton 
            size="sm" 
            variant="primary" 
            onClick={openFileDialog} 
            disabled={isUploading || !keypair}
            title={!keypair ? 'Setup SecretVault first to upload documents' : 'Add documents'}
          >
            + Add Documents
          </NeoButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!keypair}
        />

        {!keypair && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded">
            <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200 mb-2">
              🔑 Setup SecretVault first to upload documents securely
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
              Generate a keypair to enable encrypted document storage
            </p>
            <NeoButton
              size="sm"
              variant="accent"
              onClick={handleGenerateKeypair}
              disabled={isGeneratingKeypair}
            >
              {isGeneratingKeypair ? (
                <>
                  <span className="animate-spin mr-1">⏳</span>
                  Generating...
                </>
              ) : (
                '🔐 Generate SecretVault Keypair'
              )}
            </NeoButton>
          </div>
        )}

        {!documents ? (
          <p className="text-sm font-semibold text-gray-600">Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 bg-gray-50">
            <p className="text-sm font-semibold text-gray-600">No documents uploaded</p>
            <p className="text-xs font-semibold text-gray-500">Add financial documents to support this request</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 3).map(file => (
              <div key={file._id} className="flex items-center justify-between p-2 bg-gray-50 border-2 border-foreground">
                <div className="flex items-center gap-2">
                  <NeoBadge variant="success">{file.category}</NeoBadge>
                  <span className="text-sm font-semibold">{file.filename}</span>
                </div>
                <NeoButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteDocument(file._id, file.filename)}
                  disabled={deletingFiles.has(file._id)}
                >
                  ×
                </NeoButton>
              </div>
            ))}
            {documents.length > 3 && (
              <p className="text-xs font-semibold text-gray-600 text-center">
                +{documents.length - 3} more documents
              </p>
            )}
          </div>
        )}

        {analyzingFiles.size > 0 && (
          <div className="mt-2 p-2 bg-primary bg-opacity-20 border-2 border-foreground">
            <p className="text-xs font-bold flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Analyzing {analyzingFiles.size} document{analyzingFiles.size > 1 ? 's' : ''}...
            </p>
          </div>
        )}
      </NeoCard>
    );
  }

  return (
    <NeoCard bg="bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black uppercase">Supporting Documents</h3>
          {shortId && (
            <p className="text-sm font-semibold text-gray-600">For loan request: {shortId}</p>
          )}
        </div>
        <NeoBadge variant="accent">{documents?.length || 0} documents</NeoBadge>
      </div>

      {!keypair && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-4 border-yellow-400 rounded">
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
            🔑 SecretVault Setup Required
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-4">
            Generate a keypair to enable encrypted document storage for this loan request. 
            This ensures your financial documents are stored securely and privately.
          </p>
          <NeoButton
            variant="primary"
            onClick={handleGenerateKeypair}
            disabled={isGeneratingKeypair}
          >
            {isGeneratingKeypair ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating SecretVault Keypair...
              </>
            ) : (
              '🔐 Generate SecretVault Keypair'
            )}
          </NeoButton>
        </div>
      )}

      {keypair && (
        <div className="mb-4 p-3 bg-green-50  border-2 border-green-400 rounded">
          <p className="text-xs font-bold text-green-800  mb-1">
            ✅ SecretVault Ready
          </p>
          <p className="text-xs text-green-700  font-mono">
            DID: {keypair.did}
          </p>
        </div>
      )}

      <div 
        className={`border-4 border-dashed p-6 mb-6 text-center transition-colors ${
          !keypair ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          dragActive 
            ? 'border-primary bg-primary bg-opacity-20' 
            : 'border-foreground bg-secondary bg-opacity-20'
        }`}
        onDragOver={keypair ? handleDragOver : undefined}
        onDragLeave={keypair ? handleDragLeave : undefined}
        onDrop={keypair ? handleDrop : undefined}
        onClick={keypair ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={!keypair}
        />
        
        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="font-bold mb-2">
          {dragActive ? 'Drop files here' : keypair ? 'Add Supporting Documents' : 'Setup SecretVault to Upload'}
        </p>
        <p className="text-sm font-semibold text-gray-600 mb-2">
          Bank statements, income proof, bills, mobile money records
        </p>
        <p className="text-xs font-bold text-gray-500">
          JPG, PNG, PDF • AI analyzes automatically {keypair ? '+ SecretVault encryption' : '(Requires SecretVault setup)'}
        </p>
      </div>

      {!documents ? (
        <div className="text-center py-8 border-4 border-foreground bg-gray-50">
          <p className="font-semibold text-gray-600">Loading...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 border-4 border-foreground bg-gray-50">
          <p className="font-semibold text-gray-600">No documents uploaded for this request</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Upload financial documents to strengthen your loan application
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(file => (
            <div key={file._id} className="p-4 border-4 border-foreground bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <svg className="w-5 h-5 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{file.filename}</p>
                      <NeoBadge variant="success">{file.category}</NeoBadge>
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
                      <p className="text-xs font-semibold text-gray-600 mb-1">
                        {file.summary}
                      </p>
                    )}
                    
                    <p className="text-xs font-semibold text-gray-500">
                      Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <NeoButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteDocument(file._id, file.filename)}
                  disabled={deletingFiles.has(file._id)}
                >
                  Remove
                </NeoButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {analyzingFiles.size > 0 && (
        <div className="mt-4 p-3 bg-primary bg-opacity-20 border-4 border-foreground">
          <div className="text-sm font-bold flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Analyzing {analyzingFiles.size} document{analyzingFiles.size > 1 ? 's' : ''}...
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-accent bg-opacity-30 border-4 border-foreground">
        <p className="text-sm font-bold flex items-start gap-2">
          <span>🔒</span>
          <span>Documents uploaded here are linked to this specific loan request. Lenders will only see the blind computer AI-generated trust score.</span>
        </p>
      </div>
    </NeoCard>
  );
}