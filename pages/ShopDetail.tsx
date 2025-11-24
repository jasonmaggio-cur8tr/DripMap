
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CHEEKY_VIBES_OPTIONS } from '../constants';
import { uploadImages } from '../services/storageService';
import Button from '../components/Button';
import TagChip from '../components/TagChip';
import { useToast } from '../context/ToastContext';

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { shops, user, toggleSaveShop, toggleVisitedShop, addReview, updateShop, claimRequests, getShopCommunity } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const shop = shops.find(s => s.id === id);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'owner' | 'community'>('all');
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  // Community Tabs
  const [communityTab, setCommunityTab] = useState<'visited' | 'saved'>('visited');

  // Photo Upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Lightbox Keyboard Navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIndex === null) return;
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowRight') handleNextImage(e);
    if (e.key === 'ArrowLeft') handlePrevImage(e);
  }, [lightboxIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!shop) {
    return <div className="p-10 text-center">Shop not found</div>;
  }

  const isSaved = user?.savedShops.includes(shop.id);
  const isVisited = user?.visitedShops.includes(shop.id);
  const isOwner = user && (shop.claimedBy === user.id || user.isAdmin);
  
  const pendingRequest = user ? claimRequests.find(r => r.shopId === shop.id && r.userId === user.id && r.status === 'pending') : null;
  
  // Get Social Data
  const { savers, visitors } = getShopCommunity(shop.id);
  const communityList = communityTab === 'visited' ? visitors : savers;

  // Filter Logic
  const filteredImages = shop.gallery.filter(img => 
    galleryFilter === 'all' || img.type === galleryFilter
  );

  // For Masonry, we usually want to show more images initially to make the effect look good
  const displayedImages = isGalleryExpanded ? filteredImages : filteredImages.slice(0, 9);
  const showExpandButton = filteredImages.length > 9 && !isGalleryExpanded;

  // Handlers
  const handleSaveClick = () => {
      if (!user) {
          navigate('/auth');
          return;
      }
      toggleSaveShop(shop.id);
      if (!isSaved) toast.success("Added to your saved spots!");
  };

  const handleVisitedClick = () => {
    if (!user) {
        navigate('/auth');
        return;
    }

    if (isVisited) {
        toggleVisitedShop(shop.id);
    } else {
        // Trigger animation via state or simple toast for now
        setShowReviewModal(true);
    }
  };

  const handleSubmitReview = () => {
    if (!shop) return;
    addReview(shop.id, {
        rating: newReview.rating,
        comment: newReview.comment
    });
    toggleVisitedShop(shop.id);
    setShowReviewModal(false);
    setNewReview({ rating: 5, comment: '' });
    toast.success("Passport Stamped & Review Posted!");
  };

  const handleSkipReview = () => {
    toggleVisitedShop(shop.id);
    setShowReviewModal(false);
    toast.success("Passport Stamped!");
  };

  // Lightbox Handlers
  const handleNextImage = (e: any) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % filteredImages.length));
  };

  const handlePrevImage = (e: any) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + filteredImages.length) % filteredImages.length));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!e.target.files || e.target.files.length === 0) return;

    setIsUploadingPhoto(true);
    try {
      const files = Array.from(e.target.files) as File[];
      const result = await uploadImages(files, 'shops');

      if (!result.success) {
        toast.error(`Upload failed: ${result.error}`);
        return;
      }

      // Add new photos to shop gallery as 'community' type
      const newImages = (result.urls || []).map(url => ({
        url,
        type: 'community' as const
      }));

      const updatedShop = {
        ...shop,
        gallery: [...shop.gallery, ...newImages]
      };

      // Update shop in context
      await updateShop(updatedShop);

      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added!`);
      
      // Reset input
      e.target.value = '';
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photos. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const renderVibeCheck = (vibe: string) => {
    const hasVibe = shop.cheekyVibes.includes(vibe);
    return (
        <label key={vibe} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-default ${hasVibe ? 'bg-coffee-50 border-coffee-200 shadow-sm' : 'bg-white border-transparent hover:bg-coffee-50/50'}`}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${hasVibe ? 'bg-coffee-900 border-coffee-900' : 'border-coffee-300 bg-transparent'}`}>
                <i className={`fas fa-check text-volt-400 text-[10px] transform transition-transform ${hasVibe ? 'scale-100' : 'scale-0'}`}></i>
            </div>
            <input type="checkbox" checked={hasVibe} readOnly className="hidden" />
            <span className={`text-sm font-medium transition-colors ${hasVibe ? 'text-coffee-900' : 'text-coffee-400 group-hover:text-coffee-600'}`}>
                {vibe}
            </span>
        </label>
    );
  };

  return (
    <div className="min-h-screen pb-20 bg-coffee-50 relative">
      
      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
            <button 
                onClick={() => setLightboxIndex(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-50"
            >
                <i className="fas fa-times text-xl"></i>
            </button>

            <button 
                onClick={handlePrevImage}
                className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-40"
            >
                <i className="fas fa-chevron-left text-xl"></i>
            </button>

            <div className="max-w-6xl max-h-[85vh] px-4 relative">
                <img 
                    src={filteredImages[lightboxIndex].url} 
                    alt="Lightbox view" 
                    className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                     <div className="inline-block bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 text-sm font-bold">
                        <span className="uppercase text-volt-400 text-xs mr-2 tracking-wider">{filteredImages[lightboxIndex].type}</span>
                        {lightboxIndex + 1} / {filteredImages.length}
                     </div>
                </div>
            </div>

            <button 
                onClick={handleNextImage}
                className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors z-40"
            >
                <i className="fas fa-chevron-right text-xl"></i>
            </button>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-coffee-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-coffee-100 animate-in fade-in zoom-in duration-200 relative overflow-hidden">
                {/* Decorative Stamp BG */}
                <div className="absolute -right-10 -top-10 text-coffee-50/80 transform rotate-12 pointer-events-none">
                    <i className="fas fa-stamp text-9xl"></i>
                </div>

                <div className="text-center mb-6 relative z-10">
                    <h2 className="text-2xl font-serif font-bold text-coffee-900">Stamp Your Passport?</h2>
                    <p className="text-coffee-600 text-sm mt-1">Leave a review to document your visit.</p>
                </div>

                <div className="flex justify-center gap-2 mb-6 relative z-10">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                        >
                            <i className={`fas fa-star ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-200'}`}></i>
                        </button>
                    ))}
                </div>

                <textarea
                    className="w-full p-4 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none mb-6 text-coffee-900 placeholder-coffee-400 relative z-10"
                    rows={3}
                    placeholder="What's the vibe? How's the coffee?"
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                />

                <div className="flex flex-col gap-3 relative z-10">
                    <Button onClick={handleSubmitReview} className="w-full py-3">
                        Post Review & Stamp
                    </Button>
                    <button 
                        onClick={handleSkipReview}
                        className="text-coffee-400 text-xs font-bold hover:text-coffee-900 uppercase tracking-wide"
                    >
                        Just Stamp Passport
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="h-[50vh] w-full relative group cursor-pointer" onClick={() => setLightboxIndex(0)}>
        <img src={shop.gallery[0].url} alt={shop.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold text-sm border border-white/30">
                <i className="fas fa-expand-arrows-alt mr-2"></i> View Gallery
            </div>
        </div>
        
        {/* Visited Stamp Overlay */}
        {isVisited && (
            <div className="absolute top-24 right-8 transform rotate-12 animate-in zoom-in duration-500 pointer-events-none">
                <div className="w-24 h-24 rounded-full border-4 border-volt-400/80 flex items-center justify-center bg-coffee-900/80 backdrop-blur-sm shadow-lg">
                    <div className="text-center transform -rotate-12">
                        <p className="text-volt-400 text-[10px] font-bold uppercase tracking-widest">DripMap</p>
                        <p className="text-white font-serif font-bold text-sm">VISITED</p>
                        <i className="fas fa-check text-volt-400 mt-1"></i>
                    </div>
                </div>
            </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 text-white">
            <div className="container mx-auto">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    {shop.isClaimed && (
                        <span className="bg-volt-400 text-coffee-900 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.4)] animate-pulse-slow">
                            <i className="fas fa-certificate"></i> VERIFIED
                        </span>
                    )}
                    <div className="flex items-center text-volt-400 font-bold bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <i className="fas fa-star mr-1"></i> {shop.rating.toFixed(1)} ({shop.reviewCount})
                    </div>
                    <div className="flex items-center text-white/80 font-bold text-xs bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                        <i className="fas fa-stamp mr-1.5"></i> {shop.stampCount} Passports Stamped
                    </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold mb-2">{shop.name}</h1>
                <p className="text-white/90 text-lg flex items-center gap-2">
                   <i className="fas fa-map-marker-alt"></i> {shop.location.city}, {shop.location.state}
                </p>
            </div>
        </div>

        <Link to="/" onClick={(e) => e.stopPropagation()} className="absolute top-6 left-6 md:top-8 md:left-8 bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white hover:text-coffee-900 text-white transition-all">
            <i className="fas fa-arrow-left text-xl"></i>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-10">
                {/* About */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100">
                    <h2 className="text-2xl font-serif font-bold text-coffee-900 mb-4">The Lowdown</h2>
                    <p className="text-lg text-coffee-800/80 leading-relaxed mb-6">
                        {shop.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {shop.vibes.map(vibe => (
                            <TagChip key={vibe} label={vibe} isSelected />
                        ))}
                    </div>
                </section>

                {/* Aesthetic Gallery (Masonry) */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <h2 className="text-2xl font-serif font-bold text-coffee-900">The Aesthetic</h2>
                        
                        <div className="flex p-1 bg-coffee-100 rounded-full w-fit shadow-inner">
                            {(['all', 'owner', 'community'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => { setGalleryFilter(type); setIsGalleryExpanded(false); }}
                                    className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300 ${
                                        galleryFilter === type 
                                        ? 'bg-white text-coffee-900 shadow-sm transform scale-105' 
                                        : 'text-coffee-500 hover:text-coffee-800 hover:bg-coffee-50'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {displayedImages.length > 0 ? (
                        <div className="columns-2 md:columns-3 gap-4 space-y-4">
                            {displayedImages.map((img, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setLightboxIndex(idx)}
                                    className="break-inside-avoid relative rounded-2xl overflow-hidden bg-coffee-200 cursor-zoom-in group shadow-sm hover:shadow-md transition-all"
                                >
                                    <img 
                                        src={img.url} 
                                        alt={`Gallery ${idx}`} 
                                        loading="lazy"
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                        {img.type}
                                    </div>
                                </div>
                            ))}
                            
                            {/* Add Photo Button mixed into Masonry if expanding or short list */}
                            {(isGalleryExpanded || displayedImages.length < 9) && (
                                <button 
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={isUploadingPhoto}
                                    className="break-inside-avoid w-full aspect-square rounded-2xl border-2 border-dashed border-coffee-300 flex flex-col items-center justify-center text-coffee-400 hover:border-volt-400 hover:text-volt-500 hover:bg-coffee-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-12 h-12 rounded-full bg-coffee-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        {isUploadingPhoto ? (
                                            <i className="fas fa-spinner fa-spin text-coffee-500"></i>
                                        ) : (
                                            <i className="fas fa-plus text-coffee-500 group-hover:text-volt-500"></i>
                                        )}
                                    </div>
                                    <span className="font-bold text-xs">
                                        {isUploadingPhoto ? 'Uploading...' : 'Add Photo'}
                                    </span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-coffee-400 bg-coffee-50 rounded-xl border border-coffee-100 border-dashed">
                            <i className="fas fa-images text-3xl mb-3 opacity-30"></i>
                            <p className="text-sm font-medium">
                                {galleryFilter === 'all' 
                                    ? "No photos yet." 
                                    : `No ${galleryFilter} photos yet.`}
                            </p>
                        </div>
                    )}

                    {/* Hidden file input */}
                    <input 
                        type="file" 
                        ref={photoInputRef} 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                    />

                    {showExpandButton && (
                        <div className="relative mt-6">
                            {/* Fade effect for non-expanded */}
                            <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                            <Button 
                                variant="outline" 
                                className="w-full border-coffee-200 text-coffee-600 hover:text-coffee-900 hover:border-coffee-900 relative z-10" 
                                onClick={() => setIsGalleryExpanded(true)}
                            >
                                See All Images ({filteredImages.length})
                            </Button>
                        </div>
                    )}
                    
                    {isGalleryExpanded && filteredImages.length > 9 && (
                         <Button 
                            variant="ghost" 
                            className="w-full mt-6 text-sm text-coffee-500" 
                            onClick={() => setIsGalleryExpanded(false)}
                        >
                            Show Less
                        </Button>
                    )}
                </section>

                {/* Cheeky Vibe Check */}
                <section>
                    <h2 className="text-2xl font-serif font-bold text-coffee-900 mb-6 flex items-center gap-2">
                        <i className="fas fa-tasks text-volt-400"></i> Vibe Check
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {CHEEKY_VIBES_OPTIONS.map(vibe => renderVibeCheck(vibe))}
                    </div>
                </section>

                {/* Reviews */}
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif font-bold text-coffee-900">Reviews</h2>
                        <span className="text-coffee-500 text-sm">{shop.reviews.length} {shop.reviews.length === 1 ? 'review' : 'reviews'}</span>
                     </div>
                     <div className="space-y-6">
                        {shop.reviews.length > 0 ? (
                            shop.reviews.map((review, i) => (
                                <div key={i} className="border-b border-coffee-100 last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Link to={`/profile/${review.userId}`} className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden hover:opacity-80 transition-opacity">
                                            <img src={review.avatarUrl} alt={review.username} className="w-full h-full object-cover" />
                                        </Link>
                                        <div>
                                            <Link to={`/profile/${review.userId}`} className="font-bold text-coffee-900 text-sm hover:text-volt-500 transition-colors">
                                                {review.username}
                                            </Link>
                                            <div className="flex text-yellow-500 text-xs">
                                                {[...Array(5)].map((_, i) => (
                                                    <i key={i} className={`fas fa-star ${i < review.rating ? '' : 'text-gray-300'}`}></i>
                                                ))}
                                            </div>
                                        </div>
                                        <span className="ml-auto text-xs text-coffee-400">{review.date}</span>
                                    </div>
                                    <p className="text-coffee-800/80 text-sm">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-coffee-400 italic">
                                No reviews yet. Be the first!
                            </div>
                        )}
                        
                        {/* Hardcoded Examples if empty (for demo purposes) */}
                        {shop.reviews.length === 0 && [1, 2].map((_, i) => (
                            <div key={`mock-${i}`} className="border-b border-coffee-100 last:border-0 pb-6 last:pb-0 opacity-50">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                                    <div>
                                        <p className="font-bold text-coffee-900 text-sm">CoffeeLover{i+99}</p>
                                        <div className="flex text-yellow-500 text-xs">
                                            <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-coffee-800/80 text-sm">
                                    {i === 0 ? "Honestly, the best matcha I've had. The vibes are immaculate." : "Great spot for working, but can get crowded on weekends."}
                                </p>
                            </div>
                        ))}
                     </div>
                     {/* Trigger review modal manually if needed */}
                     <Button variant="outline" className="w-full mt-6" onClick={() => setShowReviewModal(true)}>
                         Write a Review
                     </Button>
                </section>
            </div>

            {/* Right Column: Sticky Actions */}
            <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-6">
                    {/* Action Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-coffee-100 relative overflow-hidden">
                        {isOwner && (
                            <div className="absolute top-0 left-0 right-0 bg-volt-400 h-1.5"></div>
                        )}

                        {shop.isClaimed && (
                            <div className="mb-6 bg-coffee-900 rounded-xl p-4 flex items-center gap-3 shadow-md">
                                <div className="w-10 h-10 rounded-full bg-volt-400 flex items-center justify-center shrink-0 text-coffee-900 text-lg">
                                    <i className="fas fa-check"></i>
                                </div>
                                <div>
                                    <p className="text-volt-400 font-bold text-sm">Verified Business</p>
                                    <p className="text-coffee-100 text-xs opacity-80">Managed by Owner</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <p className="text-sm font-bold text-coffee-400 mb-1">ADDRESS</p>
                            <p className="text-coffee-900">{shop.location.address}</p>
                            <p className="text-coffee-900">{shop.location.city}, {shop.location.state}</p>
                        </div>
                        <div className="mb-8">
                            <p className="text-sm font-bold text-coffee-400 mb-1">HOURS</p>
                            {shop.openHours && Object.values(shop.openHours).some(v => v) ? (
                              <div className="space-y-1">
                                {shop.openHours.monday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Mon:</span> {shop.openHours.monday}</p>}
                                {shop.openHours.tuesday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Tue:</span> {shop.openHours.tuesday}</p>}
                                {shop.openHours.wednesday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Wed:</span> {shop.openHours.wednesday}</p>}
                                {shop.openHours.thursday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Thu:</span> {shop.openHours.thursday}</p>}
                                {shop.openHours.friday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Fri:</span> {shop.openHours.friday}</p>}
                                {shop.openHours.saturday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Sat:</span> {shop.openHours.saturday}</p>}
                                {shop.openHours.sunday && <p className="text-coffee-900 text-sm"><span className="font-semibold">Sun:</span> {shop.openHours.sunday}</p>}
                              </div>
                            ) : (
                              <p className="text-coffee-500 text-sm italic">Hours not available</p>
                            )}
                        </div>

                        <div className="space-y-3">
                             {isOwner && (
                                <Button 
                                    onClick={() => navigate(`/edit-shop/${shop.id}`)}
                                    className="w-full bg-coffee-900 text-volt-400 hover:bg-coffee-800 border-2 border-transparent hover:border-volt-400 transition-all mb-4"
                                >
                                    <i className="fas fa-pen mr-2"></i> Edit Shop Details
                                </Button>
                             )}

                             {user && (
                                <>
                                    <Button 
                                        variant={isSaved ? "secondary" : "outline"} 
                                        className="w-full"
                                        onClick={handleSaveClick}
                                    >
                                        <i className={`${isSaved ? 'fas' : 'far'} fa-heart mr-2`}></i> 
                                        {isSaved ? 'Saved' : 'Save Spot'}
                                    </Button>
                                    <Button 
                                        variant={isVisited ? "secondary" : "outline"}
                                        className={`w-full ${isVisited ? 'border-volt-400' : ''}`}
                                        onClick={handleVisitedClick}
                                    >
                                        <i className={`${isVisited ? 'fas fa-check-circle' : 'fas fa-stamp'} mr-2`}></i> 
                                        {isVisited ? 'Visited' : 'Stamp My Passport'}
                                    </Button>
                                </>
                            )}
                            <Button className="w-full bg-coffee-900 text-volt-400 hover:bg-coffee-800">
                                <i className="fas fa-location-arrow mr-2"></i> Get Directions
                            </Button>
                        </div>

                        {/* Claim Logic */}
                         {!shop.isClaimed && (
                            <div className="mt-6 pt-6 border-t border-coffee-100 text-center">
                                {pendingRequest ? (
                                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-yellow-800 text-xs font-bold">
                                        <i className="fas fa-clock mr-1"></i> Verification Pending
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-xs text-coffee-500 mb-3 font-medium">Own this business?</p>
                                        <Button 
                                            variant="secondary" 
                                            className="w-full font-bold"
                                            onClick={() => {
                                                if (user) {
                                                    navigate(`/claim/${shop.id}`);
                                                } else {
                                                    navigate('/auth');
                                                }
                                            }}
                                        >
                                            Claim My Shop
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Community Section */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100">
                        <h3 className="text-lg font-serif font-bold text-coffee-900 mb-4 flex items-center gap-2">
                           <i className="fas fa-users text-coffee-400"></i> The Community
                        </h3>

                        {/* Tabs */}
                        <div className="flex p-1 bg-coffee-50 rounded-xl mb-4">
                             <button 
                                onClick={() => setCommunityTab('visited')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    communityTab === 'visited' 
                                    ? 'bg-white text-coffee-900 shadow-sm' 
                                    : 'text-coffee-500 hover:text-coffee-800'
                                }`}
                             >
                                 Visited ({shop.stampCount})
                             </button>
                             <button 
                                onClick={() => setCommunityTab('saved')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                    communityTab === 'saved' 
                                    ? 'bg-white text-coffee-900 shadow-sm' 
                                    : 'text-coffee-500 hover:text-coffee-800'
                                }`}
                             >
                                 Saved
                             </button>
                        </div>

                        {/* Facepile */}
                        {communityList.length > 0 ? (
                            <div>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {communityList.map((person, i) => (
                                        <Link 
                                            key={person.id} 
                                            to={`/profile/${person.id}`}
                                            title={person.username}
                                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden hover:scale-110 transition-transform hover:border-volt-400 -ml-2 first:ml-0 relative z-0 hover:z-10"
                                        >
                                            <img src={person.avatarUrl} alt={person.username} className="w-full h-full object-cover" />
                                        </Link>
                                    ))}
                                </div>
                                <p className="text-xs text-coffee-500">
                                    <span className="font-bold text-coffee-900">{communityList[0].username}</span> and {shop.stampCount > communityList.length ? `${shop.stampCount - communityList.length} others` : 'friends'} have {communityTab === 'visited' ? 'been here' : 'saved this'}.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-coffee-400 italic text-center py-4">
                                No one has {communityTab} this yet. Be the first!
                            </p>
                        )}

                        {shop.isClaimed && (
                             <div className="mt-4 pt-4 border-t border-coffee-50">
                                 <button className="w-full text-[10px] font-bold text-volt-500 hover:text-volt-600 uppercase tracking-wide flex items-center justify-center gap-1">
                                     <i className="fas fa-bullhorn"></i> Send Offer to {communityTab === 'visited' ? 'Visitors' : 'Savers'}
                                 </button>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetail;
