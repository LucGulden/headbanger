import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useVinylsPagination } from '../hooks/useVinylsPagination';
import { removeVinylFromUser, moveToCollection } from '../lib/vinyls';
import VinylGrid from '../components/VinylGrid';
import Button from '../components/Button';
import AddVinylModal from '../components/AddVinylModal';

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Hook de pagination
  const {
    vinyls,
    loading,
    loadingMore,
    hasMore,
    error,
    total,
    loadMore,
    refresh,
    removeVinylFromList,
  } = useVinylsPagination({
    userId: user?.id || '',
    type: 'wishlist',
  });

  // Supprimer un vinyle
  const handleRemove = async (vinylId: string) => {
    if (!user) return;

    if (!confirm('Êtes-vous sûr de vouloir retirer ce vinyle de votre wishlist ?')) {
      return;
    }

    try {
      await removeVinylFromUser(user.id, vinylId, 'wishlist');
      removeVinylFromList(vinylId);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  // Déplacer vers la collection
  const handleMoveToCollection = async (vinylId: string) => {
    if (!user) return;

    try {
      await moveToCollection(user.id, vinylId);
      removeVinylFromList(vinylId);
      
      // Notification de succès
      alert('Vinyle ajouté à votre collection ! 🎉');
    } catch (err) {
      console.error('Erreur lors du déplacement:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors du déplacement');
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    refresh();
  };

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
              Ma Wishlist
            </h1>
            <p className="text-[var(--foreground-muted)]">
              {loading
                ? 'Chargement...'
                : total === 0
                ? 'Aucun vinyle pour le moment'
                : `${total} vinyle${total > 1 ? 's' : ''} dans votre wishlist`}
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="sm:w-auto"
          >
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ajouter des vinyles
            </span>
          </Button>
        </div>

        {/* Grille de vinyles */}
        <VinylGrid
          vinyls={vinyls}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
          total={total}
          onLoadMore={loadMore}
          onRefresh={refresh}
          onRemove={handleRemove}
          onMoveToCollection={handleMoveToCollection}
          emptyMessage="Votre wishlist est vide"
          emptyIcon="⭐"
          type="wishlist"
        />

        {/* Modal d'ajout */}
        <AddVinylModal
          key={isModalOpen ? 'modal-open' : 'modal-closed'}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
          userId={user.id}
          targetType="wishlist"
        />
      </div>
    </div>
  );
}