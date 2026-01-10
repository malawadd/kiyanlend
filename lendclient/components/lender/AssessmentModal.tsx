'use client';

import { useState } from 'react';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { useToast } from '../ui/NeoToast';

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  borrowerName: string;
  fee: number;
}

type Step = 'confirm' | 'processing' | 'result';

export function AssessmentModal({ isOpen, onClose, onConfirm, borrowerName, fee }: AssessmentModalProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [progress, setProgress] = useState(0);
  const { showToast } = useToast();

  const result = {
    trustScore: 78,
    riskAssessment: [
      'Moderate payment history with 2 late payments',
      'Variable monthly income',
      'Debt-to-income ratio within acceptable range',
      'Strong savings pattern over last 6 months',
      'Multiple verified income sources',
    ],
    modelVersion: 'nilAI v1.2',
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      setStep('processing');
      let prog = 0;
      const interval = setInterval(() => {
        prog += 10;
        setProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStep('result');
            showToast('Assessment completed successfully', 'success');
          }, 500);
        }
      }, 300);
    }
  };

  const handleSave = () => {
    showToast('Assessment saved to My Assessments', 'success');
    onClose();
    setStep('confirm');
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground bg-opacity-50">
      <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <NeoCard bg="bg-background">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black uppercase">Private Assessment</h3>
            <button
              onClick={() => {
                onClose();
                setStep('confirm');
                setProgress(0);
              }}
              className="text-2xl font-black hover:text-danger"
            >
              ×
            </button>
          </div>

          {step === 'confirm' && (
            <div className="space-y-6">
              <div>
                <p className="text-lg font-bold mb-2">Requesting assessment for:</p>
                <p className="text-2xl font-black text-primary">{borrowerName}</p>
              </div>

              <div className="p-4 border-4 border-foreground bg-secondary bg-opacity-30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-lg">Assessment Fee</p>
                  <p className="text-2xl font-black">{fee} credits</p>
                </div>
                <p className="text-sm font-semibold">
                  This fee covers the computation cost of running the AI model on encrypted data.
                </p>
              </div>

              <div className="p-4 border-4 border-foreground bg-accent bg-opacity-30">
                <p className="font-bold text-sm mb-2 uppercase">Privacy Note</p>
                <p className="text-sm font-semibold">
                  The assessment will run privately on the borrower&apos;s encrypted data. You will receive only the Trust Score (1-100) and a Risk Assessment summary. Raw financial documents will never be shared.
                </p>
              </div>

              <div className="p-4 border-4 border-foreground bg-success bg-opacity-30">
                <p className="font-bold text-sm mb-2 uppercase flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Borrower Consent Status
                </p>
                <p className="text-sm font-semibold">
                  Borrower has allowed lenders to request assessments. Request will run privately without additional approval needed.
                </p>
              </div>

              <div className="flex gap-3">
                <NeoButton
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  onClick={handleConfirm}
                >
                  Confirm & Pay
                </NeoButton>
                <NeoButton
                  variant="danger"
                  size="lg"
                  onClick={() => {
                    onClose();
                    setStep('confirm');
                  }}
                >
                  Cancel
                </NeoButton>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 border-8 border-foreground border-t-primary rounded-full animate-spin"></div>
                <h4 className="text-2xl font-black mb-2">Processing Assessment</h4>
                <p className="text-lg font-semibold mb-4">
                  AI model is running on encrypted data...
                </p>
                <div className="max-w-md mx-auto">
                  <div className="h-8 border-4 border-foreground bg-white">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm font-bold mt-2">{progress}% Complete</p>
                </div>
              </div>

              <div className="p-4 border-4 border-foreground bg-secondary bg-opacity-30">
                <p className="text-sm font-bold text-center">
                  This process ensures your privacy. No raw data is being accessed.
                </p>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-6">
              <div className="text-center p-6 bg-success bg-opacity-30 border-4 border-foreground">
                <p className="font-bold text-sm uppercase mb-2">Trust Score</p>
                <div className="relative inline-block">
                  <svg className="w-32 h-32" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-gray-300"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${(result.trustScore / 100) * 314} 314`}
                      strokeDashoffset="0"
                      transform="rotate(-90 60 60)"
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black">{result.trustScore}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold mt-2">out of 100</p>
              </div>

              <div>
                <p className="font-bold text-sm uppercase mb-3">Risk Assessment</p>
                <div className="space-y-2">
                  {result.riskAssessment.map((item, idx) => (
                    <div key={idx} className="p-3 border-4 border-foreground bg-white">
                      <p className="text-sm font-semibold flex items-start gap-2">
                        <span className="text-primary font-black">•</span>
                        <span>{item}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-4 border-foreground bg-secondary bg-opacity-30">
                <p className="text-xs font-bold">
                  Model: {result.modelVersion} • Computed on encrypted data • No raw features exposed
                </p>
              </div>

              <div className="flex gap-3">
                <NeoButton
                  variant="success"
                  size="lg"
                  className="flex-1"
                  onClick={handleSave}
                >
                  Save to My Assessments
                </NeoButton>
                <NeoButton
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    onClose();
                    setStep('confirm');
                    setProgress(0);
                  }}
                >
                  Close
                </NeoButton>
              </div>
            </div>
          )}
        </NeoCard>
      </div>
    </div>
  );
}
