'use client';

import { useState } from 'react';
import type { SpotifyAlbumData } from '@/types/album';
import CreateReleaseForm from './CreateReleaseForm';

interface CreateAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotifyAlbumData?: SpotifyAlbumData | null;
}

export default function CreateReleaseModal({
  isOpen,
  onClose,
  spotifyAlbumData,
}: CreateAlbumModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--background-lighter)] bg-[var(--background)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[var(--background-lighter)] bg-[var(--background)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Créer un nouvel album et son édition
            </h2>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-[var(--foreground-muted)] hover:bg-[var(--background-lighter)] hover:text-[var(--foreground)]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

        {/* Content */}
        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-500">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Composant de création d'album */}
          <CreateReleaseForm spotifyAlbumData={spotifyAlbumData} onSuccess={handleClose} onClose={handleClose}/>
        </div>
      </div>
    </div>
  );
}
