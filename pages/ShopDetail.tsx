import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { CHEEKY_VIBES_OPTIONS } from "../constants";
import LazyImage from "../components/LazyImage";
import { uploadImages } from "../services/storageService";
import {
  addShopImages,
  updateHappeningNow,
  updateNowBrewing,
  updateCoffeeTech,
  updateBaristaProfiles,
  updateSpecialtyMenu,
  updateVeganOptions,
  deleteShopImage,
  reorderShopImages,
} from "../services/dbService";
import Button from "../components/Button";
import TagChip from "../components/TagChip";
import { useToast } from "../context/ToastContext";
import ShopPricingModal from "../components/ShopPricingModal";
import { createShopCheckoutSession, getCustomerPortalUrl, updateProPlusDiscountEnabled } from "../services/subscriptionService";
import { BillingInterval, ShopAggregate } from "../types";
import { getShopAggregate } from "../services/dbService";
import ExperienceLogModal from "../components/ExperienceLogModal";
import {
  HappeningNowEditor,
  NowBrewingEditor,
  SpecialtyMenuEditor,
  BaristaEditor,
  VeganInfoEditor,
  EditableField,
} from "../components/OwnerTools";
import EventsSection from "../components/EventsSection";

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    shops,
    user,
    toggleSaveShop,
    toggleVisitedShop,
    addReview,
    updateShop,
    claimRequests,
    getShopCommunity,
    refreshShops,
  } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const shop = shops.find(s => s.id === id || s.slug === id);

  const [galleryFilter, setGalleryFilter] = useState<
    "all" | "owner" | "community"
  >("all");
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [localGallery, setLocalGallery] = useState(shop?.gallery || []);

  useEffect(() => {
    if (shop?.gallery) {
      setLocalGallery(shop.gallery.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    }
  }, [shop]);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Experience Log State
  const [showExperienceLogModal, setShowExperienceLogModal] = useState(false);
  const [shopAggregate, setShopAggregate] = useState<ShopAggregate | null>(null);

  // Fetch Drip Score Data
  const fetchAggregate = useCallback(async () => {
    if (shop?.id) {
      const agg = await getShopAggregate(shop.id);
      setShopAggregate(agg);
    }
  }, [shop?.id]);

  useEffect(() => {
    fetchAggregate();
  }, [fetchAggregate]);

  // Community Tabs
  const [communityTab, setCommunityTab] = useState<"visited" | "saved">(
    "visited"
  );

  // Photo Upload
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // PRO Features State
  const [showPricing, setShowPricing] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [coffeeTechEditMode, setCoffeeTechEditMode] = useState(false);
  const [discountEnabled, setDiscountEnabled] = useState(shop?.proPlusDiscountEnabled ?? true);
  const [isTogglingDiscount, setIsTogglingDiscount] = useState(false);

  // Coffee Date Modal
  const [showCoffeeDateModal, setShowCoffeeDateModal] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  // Lightbox Keyboard Navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") handleNextImage(e);
      if (e.key === "ArrowLeft") handlePrevImage(e);
    },
    [lightboxIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!shop) {
    return <div className="p-10 text-center">Shop not found</div>;
  }
  const isSaved = user?.savedShops.includes(shop.id);
  const isVisited = user?.visitedShops.includes(shop.id);
  // Separate actual owner from admin viewing
  const isActualOwner = user && shop.claimedBy && shop.claimedBy === user.id;
  const isAdminViewing = user?.isAdmin && !isActualOwner;
  const isOwner = isActualOwner || isAdminViewing; // Can manage shop (actual owner OR admin)
  const isPro = shop.subscriptionTier === 'pro' || shop.subscriptionTier === 'pro_plus';
  const isProPlus = shop.subscriptionTier === 'pro_plus';
  const hasAlreadyReviewed = user && shop.reviews?.some(r => r.userId === user.id);

  // Handler for updating shop PRO fields - saves immediately for features with explicit save buttons
  const handleUpdateShop = async (updates: Partial<typeof shop>, saveImmediately = true) => {
    // Update local state immediately
    updateShop({ ...shop, ...updates });

    // Save to database if requested
    if (saveImmediately) {
      await saveChangesToDB(updates);
    }
  };

  // Save changes to database
  const saveChangesToDB = async (changes: Partial<typeof shop>) => {
    if (Object.keys(changes).length === 0) return;

    try {
      // Happening Now
      if ('happeningNow' in changes) {
        const status = changes.happeningNow;
        await updateHappeningNow(shop.id, status ? {
          title: status.title,
          message: status.message,
          sticker: status.sticker,
        } : null);
      }

      // Now Brewing Menu
      if ('currentMenu' in changes && changes.currentMenu) {
        await updateNowBrewing(shop.id, changes.currentMenu);
      }

      // Coffee Tech
      if ('sourcingInfo' in changes || 'espressoMachine' in changes || 'grinderDetails' in changes) {
        await updateCoffeeTech(shop.id, {
          sourcingInfo: changes.sourcingInfo ?? shop.sourcingInfo,
          espressoMachine: changes.espressoMachine ?? shop.espressoMachine,
          grinderDetails: changes.grinderDetails ?? shop.grinderDetails,
        });
      }

      // Barista Profiles
      if ('baristas' in changes && changes.baristas) {
        await updateBaristaProfiles(shop.id, changes.baristas);
      }

      // Specialty Menu
      if ('specialtyDrinks' in changes && changes.specialtyDrinks) {
        await updateSpecialtyMenu(shop.id, changes.specialtyDrinks);
      }

      // Vegan Options
      if ('veganFoodOptions' in changes || 'plantMilks' in changes) {
        await updateVeganOptions(shop.id, {
          veganFoodOptions: changes.veganFoodOptions ?? shop.veganFoodOptions ?? false,
          plantMilks: changes.plantMilks ?? shop.plantMilks ?? [],
        });
      }

      toast.success("Changes saved!");
    } catch (error) {
      console.error("Error saving PRO features:", error);
      toast.error("Failed to save changes");
    }
  };

  // Save Coffee Tech changes when clicking Save button
  const saveCoffeeTechChanges = async () => {
    await saveChangesToDB({
      sourcingInfo: shop.sourcingInfo,
      espressoMachine: shop.espressoMachine,
      grinderDetails: shop.grinderDetails,
    });
  };

  const pendingRequest = user
    ? claimRequests.find(
      r =>
        r.shopId === shop.id && r.userId === user.id && r.status === "pending"
    )
    : null;

  // Get Social Data
  const [communityData, setCommunityData] = useState<{ savers: any[], visitors: any[] }>({ savers: [], visitors: [] });

  useEffect(() => {
    const fetchCommunity = async () => {
      if (shop?.id) {
        const data = await getShopCommunity(shop.id);
        setCommunityData(data);
      }
    };
    fetchCommunity();
  }, [shop?.id, getShopCommunity]);

  const { savers, visitors } = communityData;
  const communityList = communityTab === "visited" ? visitors : savers;

  // Filter Logic
  const filteredImages = localGallery.filter(
    img => galleryFilter === "all" || img.type === galleryFilter
  );

  // For Masonry, we usually want to show more images initially to make the effect look good
  const displayedImages = isGalleryExpanded
    ? filteredImages
    : filteredImages.slice(0, 9);
  const showExpandButton = filteredImages.length > 9 && !isGalleryExpanded;

  // Handlers
  const handleSaveClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggleSaveShop(shop.id);
    if (!isSaved) toast.success("Added to your saved spots!");
  };

  const handleVisitedClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (isVisited) {
      toggleVisitedShop(shop.id);
    } else {
      // Open Experience Log Modal instead of simple review
      setShowExperienceLogModal(true);
    }
  };

  const handleExperienceLogSuccess = async () => {
    await fetchAggregate(); // Refresh scores
    await refreshShops(); // Refresh shop list (stamps etc)
    toast.success("Passport Stamped!");
  };

  // Lightbox Handlers
  const handleNextImage = (e: any) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev =>
      prev === null ? null : (prev + 1) % filteredImages.length
    );
  };

  const handlePrevImage = (e: any) => {
    e?.stopPropagation();
    if (lightboxIndex === null) return;
    setLightboxIndex(prev =>
      prev === null
        ? null
        : (prev - 1 + filteredImages.length) % filteredImages.length
    );
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!e.target.files || e.target.files.length === 0) return;

    // Prevent duplicate uploads if already in progress
    if (isUploadingPhoto) {
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const files = Array.from(e.target.files) as File[];
      let result;
      try {
        result = await uploadImages(files, "shops");
      } catch (err: any) {
        console.error("Supabase upload error (ShopDetail):", err);
        toast.error(err.message || "Failed to upload photos");
        setIsUploadingPhoto(false);
        return;
      }

      // Add new photos to shop gallery as 'community' type
      const newImages = (result.urls || []).map(url => ({
        url,
        type: "community" as const,
      }));

      // Reset input BEFORE refresh to prevent re-trigger
      e.target.value = "";

      // Save images to database
      const dbResult = await addShopImages(shop.id, newImages);

      if (!dbResult.success) {
        toast.error(
          "Images uploaded but failed to save to database. Please refresh the page."
        );
        return;
      }

      // Refresh shop data from database to get the new images
      await refreshShops();

      toast.success(
        `${files.length} photo${files.length > 1 ? "s" : ""} added!`
      );
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error("Failed to upload photos. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this image?")) return;

    // Optimistic update
    const newGallery = localGallery.filter(img => img.id !== imageId);
    setLocalGallery(newGallery);

    const result = await deleteShopImage(imageId);
    if (result.success) {
      toast.success("Image deleted");
      refreshShops(); // Background refresh to sync
    } else {
      toast.error("Failed to delete image");
      setLocalGallery(shop.gallery); // Revert
    }
  };

  const handleMoveImage = async (index: number, direction: 'left' | 'right', e: React.MouseEvent) => {
    e.stopPropagation();
    if (galleryFilter !== 'all') {
      toast.error("Switch to 'All' view to rearrange images");
      return;
    }

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localGallery.length) return;

    // Swap
    const newGallery = [...localGallery];
    const temp = newGallery[index];
    newGallery[index] = newGallery[newIndex];
    newGallery[newIndex] = temp;

    setLocalGallery(newGallery);

    // Debounced save could be better, but for now explicit save or save on move?
    // Let's implementation immediate save for simplicity and reliability, 
    // but maybe we just wait for the user to finish? 
    // The requirement says "rearrange", usually implies drag-and-drop or move buttons.
    // Let's triggers the update in background.

    // We need to send the whole list of IDs in the new order
    const orderedIds = newGallery.map(img => img.id);
    // Don't await this to keep UI snappy, but maybe show a saving indicator?
    reorderShopImages(shop.id, orderedIds).then(res => {
      if (!res.success) {
        toast.error("Failed to save new order");
        setLocalGallery(shop.gallery); // Revert
      } else {
        // Silent success
      }
    });
  };



  const renderVibeCheck = (vibe: string) => {
    const hasVibe = shop.cheekyVibes.includes(vibe);
    return (
      <label
        key={vibe}
        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-default ${hasVibe
          ? "bg-coffee-50 border-coffee-200 shadow-sm"
          : "bg-white border-transparent hover:bg-coffee-50/50"
          }`}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${hasVibe
            ? "bg-coffee-900 border-coffee-900"
            : "border-coffee-300 bg-transparent"
            }`}
        >
          <i
            className={`fas fa-check text-volt-400 text-[10px] transform transition-transform ${hasVibe ? "scale-100" : "scale-0"
              }`}
          ></i>
        </div>
        <input type="checkbox" checked={hasVibe} readOnly className="hidden" />
        <span
          className={`text-sm font-medium transition-colors ${hasVibe
            ? "text-coffee-900"
            : "text-coffee-400 group-hover:text-coffee-600"
            }`}
        >
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
                <span className="uppercase text-volt-400 text-xs mr-2 tracking-wider">
                  {filteredImages[lightboxIndex].type}
                </span>
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

      {/* Experience Log Modal */}
      {showExperienceLogModal && (
        <ExperienceLogModal
          shopId={shop.id}
          shopName={shop.name}
          vibeTags={shop.vibes}
          onClose={() => setShowExperienceLogModal(false)}
          onSuccess={handleExperienceLogSuccess}
        />
      )}

      {/* Hero Header */}
      <div
        className="h-[50vh] w-full relative group cursor-pointer"
        onClick={() => setLightboxIndex(0)}
      >
        <img
          src={shop.gallery[0].url}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
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
                <p className="text-volt-400 text-[10px] font-bold uppercase tracking-widest">
                  DripMap
                </p>
                <p className="text-white font-serif font-bold text-sm">
                  VISITED
                </p>
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
              {isProPlus ? (
                <span className="bg-gradient-to-r from-purple-600 to-volt-400 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(204,255,0,0.3)]">
                  <i className="fas fa-crown"></i> PRO+
                </span>
              ) : isPro && (
                <span className="bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-400">
                  <i className="fas fa-star"></i> PRO
                </span>
              )}
              <div className="flex items-center text-volt-400 font-bold bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                {/* Show Drip Score if available, else show Score Pending */}
                {shopAggregate?.dripScore ? (
                  <>
                    <i className="fas fa-tint mr-1"></i> {shopAggregate.dripScore.toFixed(0)} <span className="text-[10px] ml-1 opacity-70">DRIP SCORE</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-clock mr-1"></i> <span className="text-xs">SCORE PENDING</span>
                  </>
                )}
              </div>
              <div className="flex items-center text-white/80 font-bold text-xs bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                <i className="fas fa-stamp mr-1.5"></i> {shop.stampCount}{" "}
                Passports Stamped
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-2">
              {shop.name}
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <i className="fas fa-map-marker-alt"></i> {[shop.location.city, shop.location.state, shop.location.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        <Link
          to="/"
          onClick={e => e.stopPropagation()}
          className="absolute top-6 left-6 md:top-8 md:left-8 bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white hover:text-coffee-900 text-white transition-all"
        >
          <i className="fas fa-arrow-left text-xl"></i>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* About */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100 relative">
              {/* Coffee Date Button (Floating or inline) */}
              <div className="absolute top-8 right-8 flex flex-col gap-2">
                <button
                  onClick={() => setShowCoffeeDateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coffee-900 to-coffee-800 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-bold text-sm"
                >
                  <i className="fas fa-mug-hot text-volt-400"></i>
                  Make a Coffee Date
                </button>

                <button
                  onClick={handleSaveClick}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border transition-all font-bold text-sm ${isSaved
                    ? 'bg-coffee-100 text-coffee-900 border-coffee-200'
                    : 'bg-white text-coffee-600 border-coffee-200 hover:bg-coffee-50'}`}
                >
                  <i className={`fas ${isSaved ? 'fa-bookmark' : 'fa-bookmark'} ${isSaved ? 'text-volt-500' : 'text-coffee-400'}`}></i>
                  {isSaved ? 'Saved' : 'Save for Later'}
                </button>
              </div>

              <h2 className="text-2xl font-serif font-bold text-coffee-900 mb-4">
                The Lowdown
              </h2>
              <p className="text-lg text-coffee-800/80 leading-relaxed mb-6 whitespace-pre-wrap">
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
                <h2 className="text-2xl font-serif font-bold text-coffee-900">
                  The Aesthetic
                </h2>

                <div className="flex items-center gap-2">
                  {isOwner && (
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isEditMode
                        ? "bg-volt-400 text-coffee-900"
                        : "bg-coffee-100 text-coffee-600 hover:bg-coffee-200"
                        }`}
                    >
                      <i className={`fas ${isEditMode ? "fa-check" : "fa-edit"} mr-1`}></i>
                      {isEditMode ? "Done" : "Edit"}
                    </button>
                  )}

                  <div className="flex p-1 bg-coffee-100 rounded-full w-fit shadow-inner">
                    {(["all", "owner", "community"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setGalleryFilter(type);
                          setIsGalleryExpanded(false);
                        }}
                        className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300 ${galleryFilter === type
                          ? "bg-white text-coffee-900 shadow-sm transform scale-105"
                          : "text-coffee-500 hover:text-coffee-800 hover:bg-coffee-50"
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
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
                      <LazyImage
                        src={img.url}
                        alt={`Gallery ${idx}`}
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                      <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        {img.type}
                      </div>

                      {isEditMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-100">
                          <button
                            onClick={(e) => handleMoveImage(filteredImages.indexOf(img), 'left', e)}
                            className="w-8 h-8 rounded-full bg-white text-coffee-900 hover:bg-volt-400 flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                            disabled={filteredImages.indexOf(img) === 0}
                          >
                            <i className="fas fa-arrow-left"></i>
                          </button>
                          <button
                            onClick={(e) => handleDeleteImage(img.id, e)}
                            className="w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                          <button
                            onClick={(e) => handleMoveImage(filteredImages.indexOf(img), 'right', e)}
                            className="w-8 h-8 rounded-full bg-white text-coffee-900 hover:bg-volt-400 flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                            disabled={filteredImages.indexOf(img) === filteredImages.length - 1}
                          >
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      )}
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
                        {isUploadingPhoto ? "Uploading..." : "Add Photo"}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-coffee-400 bg-coffee-50 rounded-xl border border-coffee-100 border-dashed">
                  <i className="fas fa-images text-3xl mb-3 opacity-30"></i>
                  <p className="text-sm font-medium">
                    {galleryFilter === "all"
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

            {/* Happening Now - PRO Feature */}
            <HappeningNowEditor
              status={shop.happeningNow}
              isOwner={!!isOwner}
              isLocked={!isPro}
              onUpgrade={() => setShowPricing(true)}
              onUpdate={(status) => handleUpdateShop({ happeningNow: status }, true)}
            />

            {/* Now Brewing Menu - PRO Feature */}
            <NowBrewingEditor
              menu={shop.currentMenu}
              isOwner={!!isOwner}
              isLocked={!isPro}
              onUpgrade={() => setShowPricing(true)}
              onUpdate={(items) => handleUpdateShop({ currentMenu: items })}
            />

            {/* Coffee Tech - PRO Feature */}
            {(isOwner || shop.sourcingInfo || shop.espressoMachine || shop.grinderDetails) && (
              <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-coffee-900 flex items-center gap-2">
                    <i className="fas fa-cogs text-volt-400"></i> Coffee Tech
                    {!isPro && <i className="fas fa-lock text-gray-400 text-sm ml-2"></i>}
                  </h2>
                  {isOwner && isPro && (
                    <button
                      onClick={async () => {
                        if (coffeeTechEditMode) {
                          await saveCoffeeTechChanges();
                        }
                        setCoffeeTechEditMode(!coffeeTechEditMode);
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${coffeeTechEditMode
                        ? 'bg-volt-400 text-coffee-900'
                        : 'bg-coffee-800 text-white hover:bg-coffee-700'
                        }`}
                    >
                      {coffeeTechEditMode ? 'Save Changes' : 'Edit'}
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <EditableField
                    label="Sourcing"
                    value={shop.sourcingInfo}
                    onChange={(val) => handleUpdateShop({ sourcingInfo: val }, false)}
                    isOwner={!!isOwner}
                    isEditing={coffeeTechEditMode}
                    isLocked={!isPro}
                    onUpgrade={() => setShowPricing(true)}
                    multiline
                    placeholder="Direct trade details..."
                    icon="fa-globe-americas"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <EditableField
                      label="Espresso Machine"
                      value={shop.espressoMachine}
                      onChange={(val) => handleUpdateShop({ espressoMachine: val }, false)}
                      isOwner={!!isOwner}
                      isEditing={coffeeTechEditMode}
                      isLocked={!isPro}
                      onUpgrade={() => setShowPricing(true)}
                      icon="fa-cogs"
                    />
                    <EditableField
                      label="Grinder"
                      value={shop.grinderDetails}
                      onChange={(val) => handleUpdateShop({ grinderDetails: val }, false)}
                      isOwner={!!isOwner}
                      isEditing={coffeeTechEditMode}
                      isLocked={!isPro}
                      onUpgrade={() => setShowPricing(true)}
                      icon="fa-microchip"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* Specialty Menu - PRO Feature */}
            <SpecialtyMenuEditor
              items={shop.specialtyDrinks}
              isOwner={!!isOwner}
              isLocked={!isPro}
              onUpgrade={() => setShowPricing(true)}
              onUpdate={(items) => handleUpdateShop({ specialtyDrinks: items })}
            />

            {/* Vegan Options - PRO Feature */}
            <VeganInfoEditor
              hasOptions={shop.veganFoodOptions}
              milks={shop.plantMilks}
              isOwner={!!isOwner}
              isLocked={!isPro}
              isEditing={true}
              onUpgrade={() => setShowPricing(true)}
              onUpdate={(updates) => handleUpdateShop(updates)}
            />

            {/* Barista Profiles - PRO Feature */}
            <BaristaEditor
              baristas={shop.baristas}
              isOwner={!!isOwner}
              isLocked={!isPro}
              onUpgrade={() => setShowPricing(true)}
              onUpdate={(items) => handleUpdateShop({ baristas: items })}
            />

            {/* Events - PRO Feature */}
            {isOwner && (
              <EventsSection
                shopId={shop.id}
                isPro={isPro}
                onUpgrade={() => setShowPricing(true)}
              />
            )}

            {/* Experience Logs */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-coffee-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-coffee-900 flex items-center gap-2">
                    Experience Logs
                    {(shop.experienceLogs?.length || 0) > 0 ? (
                      <span className="bg-coffee-100 text-coffee-600 text-xs font-sans font-bold px-2 py-1 rounded-full">
                        {shop.experienceLogs?.length}
                      </span>
                    ) : null}
                  </h2>
                </div>
                {/* Drip Score Mini Badge */}
                {shopAggregate?.dripScore && (
                  <div className="flex items-center gap-1 text-volt-500 font-bold bg-coffee-900 px-3 py-1 rounded-lg shadow-sm">
                    <i className="fas fa-tint"></i>
                    <span>{shopAggregate.dripScore.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* Mini Dashboard */}
              {shopAggregate && shopAggregate.logCount > 0 && (() => {
                // Helper to calculate "Rec" score (Average Bring Friend Score) from logs if not in aggregate
                const recScore = shop.experienceLogs && shop.experienceLogs.length > 0
                  ? (shop.experienceLogs.reduce((acc, log) => acc + (log.bringFriendScore || 0), 0) / shop.experienceLogs.length).toFixed(1)
                  : (shopAggregate.npsNormalized ? (shopAggregate.npsNormalized / 10).toFixed(1) : "--");

                // Helper for Quality Text
                const getQualityText = (q: number) => {
                  if (q >= 90) return "Exceptional";
                  if (q >= 80) return "Excellent";
                  if (q >= 70) return "Solid";
                  return "Good";
                };

                // Helper for Vibe Text
                const getVibeText = (v: number) => {
                  if (v >= 65) return "Leans Lively";
                  if (v <= 35) return "Leans Quiet";
                  return "Balanced";
                };

                return (
                  <div className="bg-coffee-50/50 rounded-2xl p-6 mb-8 border border-coffee-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-coffee-50">
                      <div className="text-xs text-coffee-500 font-bold uppercase tracking-wider mb-1">Drip Score</div>
                      <div className="text-2xl font-black text-volt-500 flex items-center justify-center gap-1">
                        <i className="fas fa-tint text-lg"></i>
                        {shopAggregate.dripScore?.toFixed(0) || "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-coffee-50">
                      <div className="text-xs text-coffee-500 font-bold uppercase tracking-wider mb-1">Quality</div>
                      <div className="text-lg font-black text-coffee-800 flex items-center justify-center h-8">
                        {shopAggregate.avgOverallQuality ? getQualityText(shopAggregate.avgOverallQuality) : "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-coffee-50">
                      <div className="text-xs text-coffee-500 font-bold uppercase tracking-wider mb-1">Vibe</div>
                      <div className="text-lg font-black text-coffee-800 flex items-center justify-center h-8">
                        {shopAggregate.avgVibeEnergy ? getVibeText(shopAggregate.avgVibeEnergy) : "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-coffee-50">
                      <div className="text-xs text-coffee-500 font-bold uppercase tracking-wider mb-1">Rec.</div>
                      <div className="text-2xl font-black text-coffee-800 flex items-center justify-center gap-1">
                        {recScore}<span className="text-sm text-coffee-400 font-bold">/10</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                {/* Experience Logs List - Prioritize new logs */}
                {(shop.experienceLogs && shop.experienceLogs.length > 0) ? (
                  shop.experienceLogs.map((log) => (
                    <div key={log.id} className="p-5 rounded-2xl bg-white border border-coffee-100 hover:border-volt-400 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${log.userId}`} className="block shrink-0">
                            <div className="w-10 h-10 rounded-full bg-coffee-100 overflow-hidden border border-coffee-200">
                              {log.userAvatar ? (
                                <img src={log.userAvatar} alt={log.userName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-coffee-400">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                            </div>
                          </Link>
                          <div>
                            <Link to={`/profile/${log.userId}`} className="font-bold text-coffee-900 text-sm hover:text-volt-600 block">
                              {log.userName}
                            </Link>
                            <div className="text-xs text-coffee-400">
                              {new Date(log.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 bg-coffee-900 text-volt-400 px-2 py-1 rounded-md">
                            <i className="fas fa-tint text-[10px]"></i>
                            <span className="text-sm font-bold">{log.overallQuality}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Ratings Grid */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {log.coffeeStyle !== null && log.coffeeStyle !== undefined && (
                          <div className="bg-coffee-50 rounded px-2 py-1 text-center">
                            <div className="text-[10px] text-coffee-500 uppercase">Coffee</div>
                            <div className="text-xs font-bold text-coffee-800">
                              {log.coffeeStyle >= 70 ? "Modern" : log.coffeeStyle <= 30 ? "Classic" : "Balanced"}
                            </div>
                          </div>
                        )}
                        {log.vibeEnergy !== null && log.vibeEnergy !== undefined && (
                          <div className="bg-coffee-50 rounded px-2 py-1 text-center">
                            <div className="text-[10px] text-coffee-500 uppercase">Vibe</div>
                            <div className="text-xs font-bold text-coffee-800">
                              {log.vibeEnergy >= 70 ? "Lively" : log.vibeEnergy <= 30 ? "Quiet" : "Balanced"}
                            </div>
                          </div>
                        )}
                        {log.bringFriendScore !== undefined && (
                          <div className="bg-coffee-50 rounded px-2 py-1 text-center">
                            <div className="text-[10px] text-coffee-500 uppercase">Rec.</div>
                            <div className="text-xs font-bold text-coffee-800">{log.bringFriendScore}/10</div>
                          </div>
                        )}
                      </div>

                      {log.quickTake && (
                        <div className="relative pl-3 border-l-2 border-volt-400">
                          <p className="text-coffee-700 italic text-sm">"{log.quickTake}"</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : shop.reviews && shop.reviews.length > 0 ? (
                  // Fallback to legacy reviews if no new logs
                  shop.reviews.map((review, i) => (
                    <div
                      key={i}
                      className="bg-coffee-50 rounded-2xl p-5 border border-coffee-100 opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        {/* Legacy Review Item (Simplified) */}
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-coffee-900">{review.username}</span>
                            <span className="text-xs text-coffee-400">{review.date}</span>
                          </div>
                          <p className="text-sm text-coffee-800">"{review.comment}"</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 rounded-2xl border-2 border-dashed border-coffee-200 bg-coffee-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-coffee-100">
                      <i className="fas fa-feather-alt text-2xl text-volt-500"></i>
                    </div>
                    <h3 className="text-lg font-bold text-coffee-900 mb-1">No Logs Yet</h3>
                    <p className="text-coffee-500 text-sm max-w-xs mx-auto mb-6">
                      Be the first to verify the vibe. Your deep intel helps the community.
                    </p>

                    {/* Mock Cards for "What it will look like" */}
                    <div className="opacity-50 scale-90 pointer-events-none blur-[1px] select-none" aria-hidden="true">
                      <div className="p-3 rounded-xl bg-white border border-coffee-100 mb-2 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-coffee-200"></div>
                          <div className="h-2 w-20 bg-coffee-100 rounded"></div>
                        </div>
                        <div className="h-3 w-full bg-coffee-50 rounded mb-1"></div>
                        <div className="h-3 w-2/3 bg-coffee-50 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Trigger review modal manually if needed */}
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowExperienceLogModal(true)}
              >
                Log Experience
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

                {/* Admin Viewing Indicator */}
                {isAdminViewing && (
                  <div className="mb-4 bg-amber-100 border border-amber-300 rounded-lg p-3 flex items-center gap-2">
                    <i className="fas fa-shield-alt text-amber-600"></i>
                    <span className="text-amber-800 text-sm font-medium">Admin View Mode</span>
                  </div>
                )}

                {shop.isClaimed && (
                  <div className="mb-6 bg-coffee-900 rounded-xl p-4 flex items-center gap-3 shadow-md">
                    <div className="w-10 h-10 rounded-full bg-volt-400 flex items-center justify-center shrink-0 text-coffee-900 text-lg">
                      <i className="fas fa-check"></i>
                    </div>
                    <div>
                      <p className="text-volt-400 font-bold text-sm">
                        Verified Business
                      </p>
                      <p className="text-coffee-100 text-xs opacity-80">
                        Managed by Owner
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-bold text-coffee-400 mb-1">
                    ADDRESS
                  </p>
                  <p className="text-coffee-900">{shop.location.address}</p>
                  <p className="text-coffee-900">
                    {[shop.location.city, shop.location.state, shop.location.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="mb-8">
                  <p className="text-sm font-bold text-coffee-400 mb-1">
                    HOURS
                  </p>
                  {shop.openHours &&
                    Object.values(shop.openHours).some(v => v) ? (
                    <div className="space-y-1">
                      {shop.openHours.monday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Mon:</span>{" "}
                          {shop.openHours.monday}
                        </p>
                      )}
                      {shop.openHours.tuesday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Tue:</span>{" "}
                          {shop.openHours.tuesday}
                        </p>
                      )}
                      {shop.openHours.wednesday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Wed:</span>{" "}
                          {shop.openHours.wednesday}
                        </p>
                      )}
                      {shop.openHours.thursday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Thu:</span>{" "}
                          {shop.openHours.thursday}
                        </p>
                      )}
                      {shop.openHours.friday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Fri:</span>{" "}
                          {shop.openHours.friday}
                        </p>
                      )}
                      {shop.openHours.saturday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Sat:</span>{" "}
                          {shop.openHours.saturday}
                        </p>
                      )}
                      {shop.openHours.sunday && (
                        <p className="text-coffee-900 text-sm">
                          <span className="font-semibold">Sun:</span>{" "}
                          {shop.openHours.sunday}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-coffee-500 text-sm italic">
                      Hours not available
                    </p>
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
                        <i
                          className={`${isSaved ? "fas" : "far"} fa-heart mr-2`}
                        ></i>
                        {isSaved ? "Saved" : "Save Spot"}
                      </Button>
                      <Button
                        variant={isVisited ? "secondary" : "outline"}
                        className={`w-full ${isVisited ? "border-volt-400" : ""
                          }`}
                        onClick={handleVisitedClick}
                      >
                        <i
                          className={`${isVisited ? "fas fa-check-circle" : "fas fa-stamp"
                            } mr-2`}
                        ></i>
                        {isVisited ? "Visited" : "Stamp My Passport"}
                      </Button>
                    </>
                  )}
                  <Button className="w-full bg-coffee-900 text-volt-400 hover:bg-coffee-800">
                    <i className="fas fa-location-arrow mr-2"></i> Get
                    Directions
                  </Button>
                </div>

                {/* Claim Logic */}
                {!shop.isClaimed && (
                  <div className="mt-6 pt-6 border-t border-coffee-100 text-center">
                    {pendingRequest ? (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-yellow-800 text-xs font-bold">
                        <i className="fas fa-clock mr-1"></i> Verification
                        Pending
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-coffee-500 mb-3 font-medium">
                          Own this business?
                        </p>
                        <Button
                          variant="secondary"
                          className="w-full font-bold"
                          onClick={() => {
                            if (user) {
                              navigate(`/claim/${shop.id}`);
                            } else {
                              navigate("/auth");
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

              {/* Owner Subscription Management Card */}
              {isOwner && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border border-coffee-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isProPlus ? 'bg-volt-400' : isPro ? 'bg-purple-100' : 'bg-coffee-100'
                      }`}>
                      <i className={`fas ${isProPlus || isPro ? 'fa-crown' : 'fa-store'} ${isProPlus ? 'text-coffee-900' : isPro ? 'text-purple-600' : 'text-coffee-800'
                        }`}></i>
                    </div>
                    <div>
                      <p className="text-xs text-coffee-800 font-medium">Current Plan</p>
                      <p className={`font-black ${isProPlus ? 'text-volt-500' : isPro ? 'text-purple-600' : 'text-coffee-900'
                        }`}>
                        {isProPlus ? 'PRO+' : isPro ? 'PRO' : 'Basic (Free)'}
                      </p>
                    </div>
                  </div>

                  {(isPro || isProPlus) && (
                    <div className="bg-coffee-50 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-coffee-800">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span>Active subscription</span>
                      </div>
                      {isProPlus && (
                        <div className="mt-3 pt-3 border-t border-coffee-100">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-percent text-volt-500"></i>
                              <div>
                                <span className="text-xs font-bold text-coffee-900">DripClub 10% Discount</span>
                                <p className="text-[10px] text-coffee-800">Offer discount to DripClub members</p>
                              </div>
                            </div>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={discountEnabled}
                                disabled={isTogglingDiscount}
                                onChange={async (e) => {
                                  const newValue = e.target.checked;
                                  setIsTogglingDiscount(true);
                                  try {
                                    const success = await updateProPlusDiscountEnabled(shop.id, newValue);
                                    if (success) {
                                      setDiscountEnabled(newValue);
                                      toast.success(newValue ? 'Discount enabled for DripClub members' : 'Discount disabled');
                                      refreshShops();
                                    } else {
                                      toast.error('Failed to update discount setting');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to update discount setting');
                                  } finally {
                                    setIsTogglingDiscount(false);
                                  }
                                }}
                                className="sr-only peer"
                              />
                              <div className={`w-11 h-6 bg-coffee-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-volt-400 ${isTogglingDiscount ? 'opacity-50' : ''}`}></div>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {(isPro || isProPlus) && shop.stripeCustomerId && (
                      <button
                        onClick={async () => {
                          try {
                            const result = await getCustomerPortalUrl(shop.stripeCustomerId!, window.location.href);
                            if ('error' in result) {
                              toast.error(result.error);
                            } else {
                              window.location.href = result.url;
                            }
                          } catch (error: any) {
                            toast.error('Failed to open billing portal');
                          }
                        }}
                        className="w-full py-2.5 px-4 bg-coffee-100 text-coffee-900 rounded-xl text-sm font-bold hover:bg-coffee-800 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-credit-card"></i>
                        Manage Billing
                      </button>
                    )}
                    <button
                      onClick={() => setShowPricing(true)}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${isPro || isProPlus
                        ? 'bg-coffee-50 text-coffee-800 hover:bg-coffee-100'
                        : 'bg-volt-400 text-coffee-900 hover:bg-volt-500'
                        }`}
                    >
                      <i className="fas fa-arrow-up"></i>
                      {isPro || isProPlus ? 'Change Plan' : 'Upgrade to PRO'}
                    </button>
                  </div>
                </div>
              )}

              {/* Community Section */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100">
                <h3 className="text-lg font-serif font-bold text-coffee-900 mb-4 flex items-center gap-2">
                  <i className="fas fa-users text-coffee-400"></i> The Community
                </h3>

                {/* Tabs */}
                <div className="flex p-1 bg-coffee-50 rounded-xl mb-4">
                  <button
                    onClick={() => setCommunityTab("visited")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${communityTab === "visited"
                      ? "bg-white text-coffee-900 shadow-sm"
                      : "text-coffee-500 hover:text-coffee-800"
                      }`}
                  >
                    Visited ({shop.stampCount})
                  </button>
                  <button
                    onClick={() => setCommunityTab("saved")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${communityTab === "saved"
                      ? "bg-white text-coffee-900 shadow-sm"
                      : "text-coffee-500 hover:text-coffee-800"
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
                          <LazyImage
                            src={person.avatarUrl}
                            alt={person.username}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ))}
                    </div>
                    <p className="text-xs text-coffee-500">
                      <span className="font-bold text-coffee-900">
                        {communityList[0].username}
                      </span>{" "}
                      and{" "}
                      {shop.stampCount > communityList.length
                        ? `${shop.stampCount - communityList.length} others`
                        : "friends"}{" "}
                      have{" "}
                      {communityTab === "visited" ? "been here" : "saved this"}.
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
                      <i className="fas fa-bullhorn"></i> Send Offer to{" "}
                      {communityTab === "visited" ? "Visitors" : "Savers"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRO/PRO+ Pricing Modal */}
      <ShopPricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        currentTier={shop.subscriptionTier}
        isLoading={isCheckingOut}
        onSubscribe={async (tier: 'pro' | 'pro_plus', billingInterval: BillingInterval) => {
          if (!user) {
            toast.error('Please sign in to upgrade');
            return;
          }
          setIsCheckingOut(true);
          try {
            const result = await createShopCheckoutSession(shop.id, tier, billingInterval);
            if ('error' in result) {
              toast.error(result.error);
              setIsCheckingOut(false);
            } else {
              window.location.href = result.url;
            }
          } catch (error: any) {
            toast.error(error?.message || 'Failed to start checkout');
            setIsCheckingOut(false);
          }
        }}
      />
      {showCoffeeDateModal && (
        <React.Suspense fallback={null}>
          <CoffeeDateCreateModal
            shopId={shop.id}
            shopName={shop.name}
            onClose={() => setShowCoffeeDateModal(false)}
            onSuccess={() => setShowCoffeeDateModal(false)}
          />
        </React.Suspense>
      )}
    </div>
  );
};

// Lazy load
const CoffeeDateCreateModal = React.lazy(() => import('../components/CoffeeDateCreateModal'));

export default ShopDetail;

