'use client';

import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { SpotifyAlbumData } from '@/types/album';
import { CreateReleaseData } from '@/types/release';
import { createRelease, validateReleaseTextField } from '@/lib/releases';
import { createAlbum } from '@/lib/albums';

interface EditProfileFormProps {
  spotifyAlbumData?: SpotifyAlbumData | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CreateReleaseForm({ spotifyAlbumData, onSuccess, onClose }: EditProfileFormProps) {
  const currentYear = new Date().getFullYear();
  const [releaseFormData, setReleaseFormData] = useState<CreateReleaseData>({
    albumId: '',
    coverUrl: '',
    title: '',
    label: '',
    catalogNumber: '',
    country: '',
    releaseYear: currentYear,
    format: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!releaseFormData.label) {
      newErrors.label = 'Le label est requis';
    } else if (!validateReleaseTextField(releaseFormData.label)) {
      newErrors.label = 'Le label ne peut pas dépasser 100 caractères';
    }

    if (!releaseFormData.catalogNumber) {
      newErrors.catalogNumber = 'Le numéro de catalogue est requis';
    } else if (!validateReleaseTextField(releaseFormData.catalogNumber)) {
      newErrors.catalogNumber = 'Le numéro de catalogue ne peut pas dépasser 100 caractères';
    }

    if (!releaseFormData.country) {
      newErrors.country = 'Le pays de catalogue est requis';
    } else if (!validateReleaseTextField(releaseFormData.country)) {
      newErrors.country = 'Le pays de catalogue ne peut pas dépasser 100 caractères';
    }

    if (!releaseFormData.releaseYear || releaseFormData.releaseYear < 1900 || releaseFormData.releaseYear > currentYear) {
      newErrors.releaseYear = `L'année de sortie doit être entre 1900 et ${currentYear}`;
    }

    if (!releaseFormData.format) {
      newErrors.format = 'Le format est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      if (spotifyAlbumData) {
        try {
          // Création de l'album
          const album = await createAlbum(spotifyAlbumData);
          releaseFormData.albumId = album.id
          releaseFormData.coverUrl = album.coverUrl
        } catch (error) {
          console.error('Erreur lors de la création de l\'album:', error);
          setErrors({ submit: error instanceof Error ? error.message : 'Erreur lors de la création de l\'album' });
          return; // On arrête ici si l'album n'a pas pu être créé
        } 
      }

      try {
        // Création de la release
        await createRelease(releaseFormData);
        
        // Callback de succès (uniquement si tout s'est bien passé)
        onSuccess();
      } catch (error) {
        console.error('Erreur lors de la création de la release:', error);
        setErrors({ submit: error instanceof Error ? error.message : 'Erreur lors de la création de la release' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue: string | number | boolean = value;

    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? 0 : Number(value);
    }

    setReleaseFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erreur globale */}
      {errors.submit && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          {errors.submit}
        </div>
      )}

      {/* Titre */}
      <Input
        label="Titre spécifique de l'édition (optionnel)"
        type="text"
        name="title"
        value={releaseFormData.title}
        onChange={handleChange}
        disabled={loading}
      />

      <Input
        label="Label"
        type="text"
        name="label"
        value={releaseFormData.label}
        onChange={handleChange}
        disabled={loading}
      />

      <Input
        label="Numéro de catalogue"
        type="text"
        name="catalogNumber"
        value={releaseFormData.catalogNumber}
        onChange={handleChange}
        disabled={loading}
      />

      <Input
        label="Pays"
        type="text"
        name="country"
        value={releaseFormData.country}
        onChange={handleChange}
        disabled={loading}
      />

      <Input
        label="Année de sortie de l'édition"
        type="number"
        name="releaseYear"
        value={releaseFormData.releaseYear}
        onChange={handleChange}
        disabled={loading}
        min={1900}
        max={new Date().getFullYear()}
      />

      <Input
        label="Format"
        type="text"
        name="format"
        value={releaseFormData.format}
        onChange={handleChange}
        disabled={loading}
      />

      {/* Bouton de soumission */}
      <Button
        type="submit"
        loading={loading}
        disabled={loading}
      >
        {`Créer l'album et l'édition`}
      </Button>
    </form>
  );
}
