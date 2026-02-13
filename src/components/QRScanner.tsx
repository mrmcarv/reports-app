/**
 * QR Scanner Component
 *
 * Reusable QR code scanner using device camera.
 * Uses @zxing/browser for scanning functionality.
 *
 * Usage:
 * <QRScanner
 *   onScan={(result) => console.log(result)}
 *   onError={(error) => console.error(error)}
 * />
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    let mounted = true;

    const startScanning = async () => {
      try {
        setIsScanning(true);
        setError(null);

        // Initialize QR code reader
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        // Get available video devices
        const videoInputDevices = await reader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          throw new Error('No camera found');
        }

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
        );

        const deviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        // Start scanning
        if (videoRef.current && mounted) {
          await reader.decodeFromVideoDevice(
            deviceId,
            videoRef.current,
            (result, error) => {
              if (result && mounted) {
                onScan(result.getText());
                cleanup();
              }
              if (error && mounted && error.name !== 'NotFoundException') {
                console.error('QR scan error:', error);
              }
            }
          );
        }
      } catch (err) {
        if (mounted) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to start camera';
          setError(errorMessage);
          onError?.(errorMessage);
        }
      }
    };

    startScanning();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [onScan, onError]);

  const cleanup = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-75 p-4 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">Scan QR Code</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-white rounded-lg opacity-50" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-6 z-10">
        {error ? (
          <div className="text-red-400 text-center">
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="text-white text-center">
            <p className="text-sm">
              {isScanning
                ? 'Position the QR code within the frame'
                : 'Starting camera...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
