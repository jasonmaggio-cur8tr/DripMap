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
import { useToast } from "../context/ToastContext";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import { sizedImageUrl } from "../lib/imageUrl";
import ShopPricingModal from "../components/ShopPricingModal";
import { createShopCheckoutSession, getCustomerPortalUrl, updateProPlusDiscountEnabled } from "../services/subscriptionService";
import { BillingInterval, ShopAggregate } from "../types";
import { getShopAggregate, toggleExperienceLogLike } from "../services/dbService";
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

const ExpandableLogCard = ({ log }: { log: any }) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useApp();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState<boolean>(log.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(log.likesCount || 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to like this log.");
      return;
    }
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    // Optimistic UI update
    const previousIsLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      const result = await toggleExperienceLogLike(log.id, user.id);
      if (!result.success) {
        // Revert on failure
        setIsLiked(previousIsLiked);
        setLikesCount((prev) => (previousIsLiked ? prev + 1 : prev - 1));
      }
    } catch (e) {
      // Revert on failure
      setIsLiked(previousIsLiked);
      setLikesCount((prev) => (previousIsLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <div key={log.id}
      onClick={() => setExpanded(!expanded)}
      className="p-5 rounded-2xl bg-[#2b221b] border border-white/[0.07] hover:border-volt-400/50 transition-colors cursor-pointer mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${log.userId}`} onClick={(e) => e.stopPropagation()} className="block shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400">
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/[0.09]">
              {log.userAvatar ? (
                <img src={log.userAvatar} alt={log.userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[rgba(243,239,224,0.5)]">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
          </Link>
          <div>
            <Link to={`/profile/${log.userId}`} onClick={(e) => e.stopPropagation()} className="font-bold text-[#f3efe0] text-sm hover:text-volt-400 block focus:outline-none focus:ring-2 focus:ring-volt-400 rounded">
              {log.userName}
            </Link>
            <div className="text-xs text-[rgba(243,239,224,0.5)]">
              {new Date(log.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-xl border font-black"
            style={{ background: 'rgba(163,230,53,0.16)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635' }}
          >
            <i className="fas fa-tint text-[10px]"></i>
            <span className="text-sm font-bold">{log.overallQuality}</span>
          </div>
        </div>
      </div>

      {/* Quick Overview Grid (Always visible) */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {log.coffeeStyle !== null && log.coffeeStyle !== undefined ? (
          <div className="bg-[#2f251d] rounded px-2 py-1 text-center">
            <div className="text-[10px] text-[rgba(243,239,224,0.5)] uppercase">Coffee</div>
            <div className="text-xs font-bold text-[#e4ddce]">
              {log.coffeeStyle >= 70 ? "Modern" : log.coffeeStyle <= 30 ? "Classic" : "Balanced"}
            </div>
          </div>
        ) : <div></div>}
        {log.vibeEnergy !== null && log.vibeEnergy !== undefined ? (
          <div className="bg-[#2f251d] rounded px-2 py-1 text-center">
            <div className="text-[10px] text-[rgba(243,239,224,0.5)] uppercase">Vibe</div>
            <div className="text-xs font-bold text-[#e4ddce]">
              {log.vibeEnergy >= 70 ? "Lively" : log.vibeEnergy <= 30 ? "Quiet" : "Balanced"}
            </div>
          </div>
        ) : <div></div>}
        {log.bringFriendScore !== undefined ? (
          <div className="bg-[#2f251d] rounded px-2 py-1 text-center">
            <div className="text-[10px] text-[rgba(243,239,224,0.5)] uppercase">Rec.</div>
            <div className="text-xs font-bold text-[#e4ddce]">{log.bringFriendScore}/10</div>
          </div>
        ) : <div></div>}
      </div>

      {log.quickTake && (
        <div className="relative pl-3 border-l-2 border-volt-400 mb-2">
          <p className="text-[#e4ddce] italic text-sm">"{log.quickTake}"</p>
        </div>
      )}

      {/* Expanded Details Wrapper */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 opacity-100 mt-4 border-t border-white/[0.06] pt-4' : 'max-h-0 opacity-0'}`}>
        <div className="text-[10px] font-bold uppercase text-[rgba(243,239,224,0.5)] tracking-[0.08em] mb-2">Full Vibe Check</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {log.matchaProfile !== null && log.matchaProfile !== undefined && (
            <div className="text-sm bg-[#2f251d] p-2 rounded-lg border border-white/[0.06]">
              <span className="block text-xs text-[rgba(243,239,224,0.5)]">Matcha</span>
              <span className="font-medium text-[#e4ddce]">{log.matchaProfile}/100</span>
            </div>
          )}
          {log.pastryCraft !== null && log.pastryCraft !== undefined && (
            <div className="text-sm bg-[#2f251d] p-2 rounded-lg border border-white/[0.06]">
              <span className="block text-xs text-[rgba(243,239,224,0.5)]">Pastry Craft</span>
              <span className="font-medium text-[#e4ddce]">{log.pastryCraft}/100</span>
            </div>
          )}
          {log.specialtyDrink !== null && log.specialtyDrink !== undefined && (
            <div className="text-sm bg-[#2f251d] p-2 rounded-lg border border-white/[0.06]">
              <span className="block text-xs text-[rgba(243,239,224,0.5)]">Specialty Drink</span>
              <span className="font-medium text-[#e4ddce]">{log.specialtyDrink}/100</span>
            </div>
          )}
          {log.laptopFriendly !== null && log.laptopFriendly !== undefined && (
            <div className="text-sm bg-[#2f251d] p-2 rounded-lg border border-white/[0.06]">
              <span className="block text-xs text-[rgba(243,239,224,0.5)]">Laptop Friendly</span>
              <span className="font-medium text-[#e4ddce]">{log.laptopFriendly}%</span>
            </div>
          )}
          {log.parkingEase !== null && log.parkingEase !== undefined && (
            <div className="text-sm bg-[#2f251d] p-2 rounded-lg border border-white/[0.06]">
              <span className="block text-xs text-[rgba(243,239,224,0.5)]">Parking Ease</span>
              <span className="font-medium text-[#e4ddce]">{log.parkingEase}%</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={handleLike}
          disabled={isLikeLoading}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400 ${isLiked
              ? "text-volt-400"
              : "bg-white/5 text-[rgba(243,239,224,0.5)] hover:bg-white/10"
            }`}
          style={isLiked ? { background: 'rgba(163,230,53,0.12)' } : undefined}
        >
          <i className={`${isLiked ? 'fas' : 'far'} fa-heart`}></i>
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>

        <div className="text-center cursor-pointer text-[10px] text-[rgba(243,239,224,0.5)] font-bold uppercase flex items-center gap-1 hover:text-volt-400 transition-colors">
          {expanded ? (<><i className="fas fa-chevron-up"></i> Hide Details</>) : (<><i className="fas fa-chevron-down"></i> Expand Log</>)}
        </div>
      </div>
    </div>
  );
};

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    shops,
    shopsLoading,
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
      setShopAggregate(agg as any);
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

  // Shops load asynchronously; don't flash "not found" while the initial fetch
  // is still running (this is the shared-link entry path).
  if (shopsLoading && !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1e1712' }}>
        <div className="w-10 h-10 border-4 border-white/10 border-t-volt-400 rounded-full animate-spin" />
      </div>
    );
  }
  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-10 text-center" style={{ background: '#1e1712' }}>
        <p className="text-[rgba(243,239,224,0.5)] font-medium">Shop not found.</p>
        <Link to="/" className="text-volt-400 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-volt-400 rounded">Back to map</Link>
      </div>
    );
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
        const res = await updateHappeningNow(shop.id, status ? {
          title: status.title,
          message: status.message,
          sticker: status.sticker,
        } : null);
        if (!res.success) throw res.error;
      }

      // Now Brewing Menu
      if ('currentMenu' in changes && changes.currentMenu) {
        const res = await updateNowBrewing(shop.id, changes.currentMenu);
        if (!res.success) throw res.error;
      }

      // Coffee Tech
      if ('sourcingInfo' in changes || 'espressoMachine' in changes || 'grinderDetails' in changes) {
        const res = await updateCoffeeTech(shop.id, {
          sourcingInfo: changes.sourcingInfo ?? shop.sourcingInfo,
          espressoMachine: changes.espressoMachine ?? shop.espressoMachine,
          grinderDetails: changes.grinderDetails ?? shop.grinderDetails,
        });
        if (!res.success) throw res.error;
      }

      // Barista Profiles
      if ('baristas' in changes && changes.baristas) {
        const mappedBaristas = changes.baristas.map(b => ({
          ...b,
          favoriteOrder: b.favoriteOrder || ''
        }));
        const res = await updateBaristaProfiles(shop.id, mappedBaristas);
        if (!res.success) throw res.error;
      }

      // Specialty Menu
      if ('specialtyDrinks' in changes && changes.specialtyDrinks) {
        const res = await updateSpecialtyMenu(shop.id, changes.specialtyDrinks);
        if (!res.success) throw res.error;
      }

      // Vegan Options
      if ('veganFoodOptions' in changes || 'plantMilks' in changes) {
        const res = await updateVeganOptions(shop.id, {
          veganFoodOptions: changes.veganFoodOptions ?? shop.veganFoodOptions ?? false,
          plantMilks: changes.plantMilks ?? shop.plantMilks ?? [],
        });
        if (!res.success) throw res.error;
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
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleDirections = () => {
    const url =
      shop.mapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${shop.location.lat},${shop.location.lng}`;
    window.open(url, "_blank", "noopener");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: shop.name, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      } catch {
        toast.error("Could not copy link");
      }
    }
  };

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
          ? "bg-[#2b221b] border-white/[0.09]"
          : "bg-transparent border-transparent hover:bg-white/[0.03]"
          }`}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${hasVibe
            ? "bg-volt-400 border-volt-400"
            : "border-white/20 bg-transparent"
            }`}
        >
          <i
            className={`fas fa-check text-[10px] transform transition-transform ${hasVibe ? "scale-100" : "scale-0"
              }`}
            style={{ color: '#231b15' }}
          ></i>
        </div>
        <input type="checkbox" checked={hasVibe} readOnly className="hidden" />
        <span
          className={`text-sm font-medium transition-colors ${hasVibe
            ? "text-[#e4ddce]"
            : "text-[rgba(243,239,224,0.4)] group-hover:text-[rgba(243,239,224,0.6)]"
            }`}
        >
          {vibe}
        </span>
      </label>
    );
  };

  return (
    <div className="min-h-screen pb-[110px] relative" style={{ background: '#1e1712', color: '#f3efe0' }}>
      {/* Lightbox Modal */}
      {lightboxIndex !== null && filteredImages[lightboxIndex] && (
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
        className="h-[400px] w-full relative group cursor-pointer"
        onClick={() => { if (shop.gallery?.length > 0) setLightboxIndex(0); }}
      >
        <img
          src={sizedImageUrl(shop.gallery?.[0]?.url, { width: 1080 }) || "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80"}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient fading into the page color */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(30,23,18,0.4) 0%, rgba(30,23,18,0) 32%, rgba(30,23,18,0.35) 60%, #1e1712 100%)',
          }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-6 py-3 rounded-full text-white font-bold text-sm border border-white/10" style={{ background: 'rgba(35,27,21,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <i className="fas fa-expand-arrows-alt mr-2"></i> View Gallery
          </div>
        </div>

        {/* Visited Stamp Overlay */}
        {isVisited && (
          <div className="absolute top-[112px] right-5 transform rotate-12 animate-in zoom-in duration-500 pointer-events-none z-10">
            <div className="w-24 h-24 rounded-full border-4 border-volt-400/80 flex items-center justify-center backdrop-blur-sm shadow-lg" style={{ background: 'rgba(35,27,21,0.8)' }}>
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

        {/* Bottom overlay: score chip + name + location */}
        <div className="absolute bottom-0 left-0 w-full px-5 pb-4 text-white">
          <div className="mx-auto max-w-md lg:max-w-6xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {shopAggregate?.dripScore ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[15px] font-black"
                  style={{ background: 'rgba(163,230,53,0.16)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635' }}
                >
                  <i className="fas fa-tint text-xs"></i>
                  {shopAggregate.dripScore.toFixed(0)}
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase"
                  style={{ background: 'rgba(163,230,53,0.15)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635', letterSpacing: '0.07em' }}
                >
                  <i className="fas fa-tint"></i> Score Pending
                </span>
              )}
              {shop.isClaimed && (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5" style={{ background: '#a3e635', color: '#231b15', letterSpacing: '0.07em' }}>
                  <i className="fas fa-certificate"></i> Verified
                </span>
              )}
              {isProPlus ? (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 border" style={{ background: 'rgba(163,230,53,0.15)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635', letterSpacing: '0.07em' }}>
                  <i className="fas fa-crown"></i> PRO+
                </span>
              ) : isPro && (
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1.5 border" style={{ background: 'rgba(163,230,53,0.15)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635', letterSpacing: '0.07em' }}>
                  <i className="fas fa-star"></i> PRO
                </span>
              )}
            </div>
            <h1 className="font-serif font-black text-[38px] text-white mb-2" style={{ lineHeight: 0.98, letterSpacing: '-0.02em' }}>
              {shop.name}
            </h1>
            <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <i className="fas fa-map-marker-alt"></i> {[shop.location.city, shop.location.state, shop.location.country].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* Glass back + share buttons */}
        <button
          onClick={e => { e.stopPropagation(); handleBack(); }}
          aria-label="Go back"
          className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-volt-400"
          style={{ background: 'rgba(35,27,21,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <button
          onClick={e => { e.stopPropagation(); handleShare(); }}
          aria-label="Share this shop"
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-volt-400"
          style={{ background: 'rgba(35,27,21,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
        >
          <i className="fas fa-share-nodes"></i>
        </button>
      </div>

      <div className="mx-auto max-w-md px-5 lg:max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Action row: Directions / Save / Coffee Date */}
            <div className="flex gap-2.5 pt-5">
              <button
                onClick={handleDirections}
                className="flex-[1.3] h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[13px] font-extrabold transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#a3e635', color: '#231b15', boxShadow: '0 8px 24px -6px rgba(163,230,53,0.5)' }}
              >
                <i className="fas fa-diamond-turn-right"></i>
                Directions
              </button>
              <button
                onClick={handleSaveClick}
                className="flex-1 h-[52px] rounded-2xl border border-white/[0.08] bg-[#2b221b] flex items-center justify-center gap-2 text-[13px] font-extrabold text-[#f3efe0] transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <i className={`${isSaved ? 'fas' : 'far'} fa-heart`} style={isSaved ? { color: '#a3e635' } : undefined}></i>
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => setShowCoffeeDateModal(true)}
                aria-label="Make a Coffee Date"
                title="Make a Coffee Date"
                className="h-[52px] w-[52px] shrink-0 rounded-2xl border border-white/[0.08] bg-[#2b221b] flex items-center justify-center text-[#f3efe0] transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <i className="far fa-calendar"></i>
              </button>
            </div>

            {/* Stat strip */}
            <div className="flex rounded-2xl border border-white/[0.06] bg-[#2b221b] divide-x divide-white/[0.06]">
              <div className="flex-1 py-4 text-center">
                <div className="font-serif text-[22px] font-black" style={{ color: '#a3e635' }}>
                  {shopAggregate?.dripScore ? shopAggregate.dripScore.toFixed(0) : '—'}
                </div>
                <div className="text-[10px] font-bold uppercase text-[rgba(243,239,224,0.5)]">Drip Score</div>
              </div>
              <div className="flex-1 py-4 text-center">
                <div className="font-serif text-[22px] font-black text-[#f3efe0]">
                  {shop.vibes.length + shop.cheekyVibes.length + (shop.customVibes?.length || 0)}
                </div>
                <div className="text-[10px] font-bold uppercase text-[rgba(243,239,224,0.5)]">Vibes</div>
              </div>
              <div className="flex-1 py-4 text-center">
                <div className="font-serif text-[22px] font-black text-[#f3efe0]">{shop.stampCount}</div>
                <div className="text-[10px] font-bold uppercase text-[rgba(243,239,224,0.5)]">Stamps</div>
              </div>
            </div>

            {/* The Lowdown */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)] mb-2">
                The Lowdown
              </h2>
              <p className="text-[15px] font-medium text-[#e4ddce] whitespace-pre-wrap" style={{ lineHeight: 1.55 }}>
                {shop.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[...(shop.customVibes || []), ...shop.vibes].map(vibe => (
                  <span
                    key={vibe}
                    className="rounded-full bg-[#2b221b] border border-white/[0.09] px-3 py-1.5 text-xs font-medium text-[#e4ddce]"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </section>

            {/* Aesthetic Gallery (Masonry) */}
            <section>
              <div className="flex items-center justify-between mb-3 gap-4">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)]">
                  The Aesthetic
                </h2>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="text-xs font-bold text-volt-400 hover:text-volt-500 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-volt-400 rounded"
                >
                  {isUploadingPhoto ? (
                    <><i className="fas fa-spinner fa-spin mr-1.5"></i>Uploading...</>
                  ) : (
                    <><i className="fas fa-plus mr-1.5"></i>Add photo</>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {isOwner && (
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${isEditMode
                      ? "bg-volt-400 text-coffee-900"
                      : "bg-[#2b221b] border border-white/[0.08] text-[#e4ddce] hover:border-white/20"
                      }`}
                  >
                    <i className={`fas ${isEditMode ? "fa-check" : "fa-edit"} mr-1`}></i>
                    {isEditMode ? "Done" : "Edit"}
                  </button>
                )}

                <div className="flex flex-wrap p-1 bg-[#2b221b] border border-white/[0.06] rounded-full w-fit">
                  {(["all", "owner", "community"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setGalleryFilter(type);
                        setIsGalleryExpanded(false);
                      }}
                      className={`px-5 py-2 rounded-full text-xs font-bold capitalize transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-volt-400 ${galleryFilter === type
                        ? "bg-[#2f251d] text-[#f3efe0]"
                        : "text-[rgba(243,239,224,0.5)] hover:text-[#e4ddce]"
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
                      className="break-inside-avoid relative rounded-2xl overflow-hidden bg-[#2b221b] cursor-zoom-in group transition-all"
                    >
                      <LazyImage
                        src={sizedImageUrl(img.url, { width: 1080 })}
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
                      className="break-inside-avoid w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-[rgba(243,239,224,0.5)] hover:border-volt-400 hover:text-volt-400 transition-all group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-volt-400"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#2b221b] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        {isUploadingPhoto ? (
                          <i className="fas fa-spinner fa-spin text-[#e4ddce]"></i>
                        ) : (
                          <i className="fas fa-plus text-[#e4ddce] group-hover:text-volt-400"></i>
                        )}
                      </div>
                      <span className="font-bold text-xs">
                        {isUploadingPhoto ? "Uploading..." : "Add Photo"}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-[rgba(243,239,224,0.5)] bg-[#2b221b] rounded-2xl border border-dashed border-white/10">
                  <i className="fas fa-images text-3xl mb-3 opacity-30"></i>
                  <p className="text-sm font-medium mb-4">
                    {galleryFilter === "all"
                      ? "No photos yet. Show everyone the vibe."
                      : `No ${galleryFilter} photos yet. Show everyone the vibe.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="rounded-full px-5 py-2.5 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-volt-400 disabled:opacity-50"
                    style={{ background: '#a3e635', color: '#231b15' }}
                  >
                    {isUploadingPhoto ? (
                      <><i className="fas fa-spinner fa-spin mr-1.5"></i>Uploading...</>
                    ) : (
                      <><i className="fas fa-plus mr-1.5"></i>Add Photo</>
                    )}
                  </button>
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
                  <div className="absolute -top-24 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, #1e1712, transparent)' }}></div>
                  <button
                    className="w-full rounded-full border border-white/[0.09] bg-[#2b221b] py-2.5 text-sm font-bold text-[#e4ddce] hover:border-white/20 transition-colors relative z-10 focus:outline-none focus:ring-2 focus:ring-volt-400"
                    onClick={() => setIsGalleryExpanded(true)}
                  >
                    See All Images ({filteredImages.length})
                  </button>
                </div>
              )}

              {isGalleryExpanded && filteredImages.length > 9 && (
                <button
                  className="w-full mt-6 rounded-full py-2.5 text-sm font-bold text-[rgba(243,239,224,0.5)] hover:text-[#e4ddce] transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                  onClick={() => setIsGalleryExpanded(false)}
                >
                  Show Less
                </button>
              )}
            </section>

            {/* Cheeky Vibe Check */}
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)] mb-4">
                Vibe Check
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
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-black text-[#f3efe0] flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                    Experience Logs
                    {(shop.experienceLogs?.length || 0) > 0 ? (
                      <span className="bg-[#2b221b] border border-white/[0.08] text-[#e4ddce] text-xs font-sans font-bold px-2 py-1 rounded-full">
                        {shop.experienceLogs?.length}
                      </span>
                    ) : null}
                  </h2>
                </div>
                {/* Drip Score Mini Badge */}
                {shopAggregate?.dripScore && (
                  <div
                    className="flex items-center gap-1 font-bold px-3 py-1 rounded-xl border"
                    style={{ background: 'rgba(163,230,53,0.16)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635' }}
                  >
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
                  <div className="bg-[#2b221b] rounded-2xl p-4 mb-8 border border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-[#2f251d] rounded-xl border border-white/[0.06]">
                      <div className="text-[10px] text-[rgba(243,239,224,0.5)] font-bold uppercase tracking-[0.08em] mb-1">Drip Score</div>
                      <div className="font-serif text-[22px] font-black flex items-center justify-center gap-1" style={{ color: '#a3e635' }}>
                        <i className="fas fa-tint text-sm"></i>
                        {shopAggregate.dripScore?.toFixed(0) || "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#2f251d] rounded-xl border border-white/[0.06]">
                      <div className="text-[10px] text-[rgba(243,239,224,0.5)] font-bold uppercase tracking-[0.08em] mb-1">Quality</div>
                      <div className="text-lg font-black text-[#e4ddce] flex items-center justify-center h-8">
                        {shopAggregate.avgOverallQuality ? getQualityText(shopAggregate.avgOverallQuality) : "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#2f251d] rounded-xl border border-white/[0.06]">
                      <div className="text-[10px] text-[rgba(243,239,224,0.5)] font-bold uppercase tracking-[0.08em] mb-1">Vibe</div>
                      <div className="text-lg font-black text-[#e4ddce] flex items-center justify-center h-8">
                        {shopAggregate.avgVibeEnergy ? getVibeText(shopAggregate.avgVibeEnergy) : "--"}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#2f251d] rounded-xl border border-white/[0.06]">
                      <div className="text-[10px] text-[rgba(243,239,224,0.5)] font-bold uppercase tracking-[0.08em] mb-1">Rec.</div>
                      <div className="font-serif text-[22px] font-black text-[#e4ddce] flex items-center justify-center gap-1">
                        {recScore}<span className="text-sm text-[rgba(243,239,224,0.5)] font-bold">/10</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                {/* Experience Logs List - Prioritize new logs */}
                {(shop.experienceLogs && shop.experienceLogs.length > 0) ? (
                  shop.experienceLogs.map((log) => {
                    return <ExpandableLogCard key={log.id} log={log} />;
                  })
                ) : shop.reviews && shop.reviews.length > 0 ? (
                  // Fallback to legacy reviews if no new logs
                  shop.reviews.map((review, i) => (
                    <div
                      key={i}
                      className="bg-[#2b221b] rounded-2xl p-5 border border-white/[0.07] opacity-75"
                    >
                      <div className="flex items-start gap-4">
                        {/* Legacy Review Item (Simplified) */}
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-bold text-[#f3efe0]">{review.username}</span>
                            <span className="text-xs text-[rgba(243,239,224,0.5)]">{review.date}</span>
                          </div>
                          <p className="text-sm text-[#e4ddce]">"{review.comment}"</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 rounded-2xl border-2 border-dashed border-white/10 bg-[#2b221b]">
                    <div className="w-16 h-16 bg-[#2f251d] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
                      <i className="fas fa-feather-alt text-2xl text-volt-400"></i>
                    </div>
                    <h3 className="text-lg font-bold text-[#f3efe0] mb-1">No Logs Yet</h3>
                    <p className="text-[rgba(243,239,224,0.5)] text-sm max-w-xs mx-auto mb-6">
                      Be the first to verify the vibe. Your deep intel helps the community.
                    </p>

                    {/* Mock Cards for "What it will look like" */}
                    <div className="opacity-50 scale-90 pointer-events-none blur-[1px] select-none" aria-hidden="true">
                      <div className="p-3 rounded-xl bg-[#2f251d] border border-white/[0.06] mb-2 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-white/10"></div>
                          <div className="h-2 w-20 bg-white/10 rounded"></div>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded mb-1"></div>
                        <div className="h-3 w-2/3 bg-white/5 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Trigger review modal manually if needed */}
              <button
                className="w-full mt-6 rounded-full py-2.5 text-sm font-extrabold transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#a3e635', color: '#231b15' }}
                onClick={() => setShowExperienceLogModal(true)}
              >
                Log Experience
              </button>
            </section>
          </div>

          {/* Right Column: Sticky Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Action Card */}
              <div className="bg-[#2b221b] p-6 rounded-3xl border border-white/[0.07] relative overflow-hidden">
                {isOwner && (
                  <div className="absolute top-0 left-0 right-0 bg-volt-400 h-1.5"></div>
                )}

                {/* Admin Viewing Indicator */}
                {isAdminViewing && (
                  <div className="mb-4 bg-amber-400/10 border border-amber-400/30 rounded-lg p-3 flex items-center gap-2">
                    <i className="fas fa-shield-alt text-amber-300"></i>
                    <span className="text-amber-200 text-sm font-medium">Admin View Mode</span>
                  </div>
                )}

                {shop.isClaimed && (
                  <div className="mb-6 bg-[#1e1712] border border-white/[0.06] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-volt-400 flex items-center justify-center shrink-0 text-lg" style={{ color: '#231b15' }}>
                      <i className="fas fa-check"></i>
                    </div>
                    <div>
                      <p className="text-volt-400 font-bold text-sm">
                        Verified Business
                      </p>
                      <p className="text-[#e4ddce] text-xs opacity-80">
                        Managed by Owner
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)] mb-1">
                    ADDRESS
                  </p>
                  <p className="text-[#e4ddce]">{shop.location.address}</p>
                  <p className="text-[#e4ddce]">
                    {[shop.location.city, shop.location.state, shop.location.country].filter(Boolean).join(', ')}
                  </p>
                </div>
                {shop.parkingInfo && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)] mb-1">
                      PARKING
                    </p>
                    <p className="text-[#e4ddce] text-sm">{shop.parkingInfo}</p>
                  </div>
                )}
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[rgba(243,239,224,0.5)] mb-1">
                    HOURS
                  </p>
                  {shop.openHours &&
                    Object.values(shop.openHours).some(v => v) ? (
                    <div className="space-y-1">
                      {shop.openHours.monday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Mon:</span>{" "}
                          {shop.openHours.monday}
                        </p>
                      )}
                      {shop.openHours.tuesday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Tue:</span>{" "}
                          {shop.openHours.tuesday}
                        </p>
                      )}
                      {shop.openHours.wednesday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Wed:</span>{" "}
                          {shop.openHours.wednesday}
                        </p>
                      )}
                      {shop.openHours.thursday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Thu:</span>{" "}
                          {shop.openHours.thursday}
                        </p>
                      )}
                      {shop.openHours.friday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Fri:</span>{" "}
                          {shop.openHours.friday}
                        </p>
                      )}
                      {shop.openHours.saturday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Sat:</span>{" "}
                          {shop.openHours.saturday}
                        </p>
                      )}
                      {shop.openHours.sunday && (
                        <p className="text-[#e4ddce] text-sm">
                          <span className="font-semibold">Sun:</span>{" "}
                          {shop.openHours.sunday}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[rgba(243,239,224,0.5)] text-sm italic">
                      Hours not available
                    </p>
                  )}
                </div>

                {/* Social Links */}
                {(shop.instagramUrl || shop.websiteUrl || shop.mapsUrl) && (
                  <div className="flex items-center gap-3 mb-6">
                    {shop.instagramUrl && (
                      <a
                        href={shop.instagramUrl.startsWith('http') ? shop.instagramUrl : `https://instagram.com/${shop.instagramUrl.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center transition-all hover:scale-110 hover:border-volt-400 text-[#e4ddce] hover:text-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400"
                        title="Instagram"
                      >
                        <i className="fab fa-instagram text-lg"></i>
                      </a>
                    )}
                    {shop.websiteUrl && (
                      <a
                        href={shop.websiteUrl.startsWith('http') ? shop.websiteUrl : `https://${shop.websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center transition-all hover:scale-110 hover:border-volt-400 text-[#e4ddce] hover:text-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400"
                        title="Website"
                      >
                        <i className="fas fa-globe text-lg"></i>
                      </a>
                    )}
                    {shop.mapsUrl && (
                      <a
                        href={shop.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center transition-all hover:scale-110 hover:border-volt-400 text-[#e4ddce] hover:text-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400"
                        title="Google Maps"
                      >
                        <i className="fas fa-map-marker-alt text-lg"></i>
                      </a>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {isOwner && (
                    <button
                      onClick={() => navigate(`/edit-shop/${shop.id}`)}
                      className="w-full rounded-full py-2.5 font-bold text-volt-400 bg-[#1e1712] border border-white/[0.08] hover:border-volt-400 transition-all mb-4 focus:outline-none focus:ring-2 focus:ring-volt-400"
                    >
                      <i className="fas fa-pen mr-2"></i> Edit Shop Details
                    </button>
                  )}

                  {user && (
                    <>
                      <button
                        className={`w-full rounded-full py-2.5 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400 ${isSaved
                          ? "text-volt-400 border border-volt-400/50"
                          : "text-[#f3efe0] bg-white/5 border border-white/[0.08] hover:border-white/20"
                          }`}
                        style={isSaved ? { background: 'rgba(163,230,53,0.12)' } : undefined}
                        onClick={handleSaveClick}
                      >
                        <i
                          className={`${isSaved ? "fas" : "far"} fa-heart mr-2`}
                        ></i>
                        {isSaved ? "Saved" : "Save Spot"}
                      </button>
                      <button
                        className={`w-full rounded-full py-2.5 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400 ${isVisited
                          ? "text-volt-400 border border-volt-400/50"
                          : "text-[#f3efe0] bg-white/5 border border-white/[0.08] hover:border-white/20"
                          }`}
                        style={isVisited ? { background: 'rgba(163,230,53,0.12)' } : undefined}
                        onClick={handleVisitedClick}
                      >
                        <i
                          className={`${isVisited ? "fas fa-check-circle" : "fas fa-stamp"
                            } mr-2`}
                        ></i>
                        {isVisited ? "Visited" : "Stamp My Passport"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleDirections}
                    className="w-full rounded-full py-2.5 font-extrabold transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-volt-400"
                    style={{ background: '#a3e635', color: '#231b15', boxShadow: '0 8px 24px -6px rgba(163,230,53,0.5)' }}
                  >
                    <i className="fas fa-diamond-turn-right mr-2"></i> Get
                    Directions
                  </button>
                </div>

                {/* Claim Logic */}
                {!shop.isClaimed && (
                  <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                    {pendingRequest ? (
                      <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl text-amber-200 text-xs font-bold">
                        <i className="fas fa-clock mr-1"></i> Verification
                        Pending
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-[rgba(243,239,224,0.5)] mb-3 font-medium">
                          Own this business?
                        </p>
                        <button
                          className="w-full rounded-full py-2.5 font-extrabold focus:outline-none focus:ring-2 focus:ring-volt-400"
                          style={{ background: '#a3e635', color: '#231b15' }}
                          onClick={() => {
                            if (user) {
                              navigate(`/claim/${shop.id}`);
                            } else {
                              navigate("/auth");
                            }
                          }}
                        >
                          Claim My Shop
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Owner Subscription Management Card */}
              {isOwner && (
                <div className="bg-[#2b221b] p-6 rounded-3xl border border-white/[0.07]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${isProPlus ? 'bg-volt-400' : 'bg-white/5 border border-white/[0.08]'
                      }`}>
                      <i className={`fas ${isProPlus || isPro ? 'fa-crown' : 'fa-store'} ${isProPlus ? 'text-coffee-900' : isPro ? 'text-volt-400' : 'text-[#e4ddce]'
                        }`}></i>
                    </div>
                    <div>
                      <p className="text-xs text-[rgba(243,239,224,0.5)] font-medium">Current Plan</p>
                      <p className={`font-black ${isProPlus || isPro ? 'text-volt-400' : 'text-[#f3efe0]'
                        }`}>
                        {isProPlus ? 'PRO+' : isPro ? 'PRO' : 'Basic (Free)'}
                      </p>
                    </div>
                  </div>

                  {(isPro || isProPlus) && (
                    <div className="bg-[#1e1712] border border-white/[0.06] rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-[#e4ddce]">
                        <i className="fas fa-check-circle text-volt-400"></i>
                        <span>Active subscription</span>
                      </div>
                      {isProPlus && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                          <label className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <i className="fas fa-percent text-volt-400"></i>
                              <div>
                                <span className="text-xs font-bold text-[#f3efe0]">DripClub 10% Discount</span>
                                <p className="text-[10px] text-[rgba(243,239,224,0.5)]">Offer discount to DripClub members</p>
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
                              <div className={`w-11 h-6 bg-white/10 peer-focus:ring-2 peer-focus:ring-volt-400 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-volt-400 ${isTogglingDiscount ? 'opacity-50' : ''}`}></div>
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
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/[0.08] text-[#f3efe0] rounded-full text-sm font-bold hover:border-white/20 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-volt-400"
                      >
                        <i className="fas fa-credit-card"></i>
                        Manage Billing
                      </button>
                    )}
                    <button
                      onClick={() => setShowPricing(true)}
                      className={`w-full py-2.5 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-volt-400 ${isPro || isProPlus
                        ? 'bg-white/5 border border-white/[0.08] text-[#e4ddce] hover:border-white/20'
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
              <div className="bg-[#2b221b] p-6 rounded-3xl border border-white/[0.07]">
                <h3 className="text-lg font-serif font-black text-[#f3efe0] mb-4 flex items-center gap-2" style={{ letterSpacing: '-0.02em' }}>
                  <i className="fas fa-users text-[rgba(243,239,224,0.5)]"></i> The Community
                </h3>

                {/* Tabs */}
                <div className="flex p-1 bg-[#1e1712] border border-white/[0.06] rounded-xl mb-4">
                  <button
                    onClick={() => setCommunityTab("visited")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${communityTab === "visited"
                      ? "bg-[#2f251d] text-[#f3efe0]"
                      : "text-[rgba(243,239,224,0.5)] hover:text-[#e4ddce]"
                      }`}
                  >
                    Visited ({shop.stampCount})
                  </button>
                  <button
                    onClick={() => setCommunityTab("saved")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${communityTab === "saved"
                      ? "bg-[#2f251d] text-[#f3efe0]"
                      : "text-[rgba(243,239,224,0.5)] hover:text-[#e4ddce]"
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
                          className="w-10 h-10 rounded-full border-2 border-[#1e1712] overflow-hidden hover:scale-110 transition-transform hover:border-volt-400 -ml-2 first:ml-0 relative z-0 hover:z-10 focus:outline-none focus:ring-2 focus:ring-volt-400"
                        >
                          <LazyImage
                            src={person.avatarUrl}
                            alt={person.username}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                      ))}
                    </div>
                    <p className="text-xs text-[rgba(243,239,224,0.5)]">
                      <span className="font-bold text-[#f3efe0]">
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
                  <p className="text-xs text-[rgba(243,239,224,0.5)] italic text-center py-4">
                    No one has {communityTab} this yet. Be the first!
                  </p>
                )}

                {shop.isClaimed && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <button className="w-full text-[10px] font-bold text-volt-400 hover:text-volt-500 uppercase tracking-wide flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-volt-400 rounded">
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
            shop={shop}
            onClose={() => setShowCoffeeDateModal(false)}
            onSuccess={() => {
              // Optionally refresh logic here if needed
            }}
          />
        </React.Suspense>
      )}

      <BottomTabBar />
    </div>
  );
};

// Lazy load
const CoffeeDateCreateModal = React.lazy(() => import('../components/CoffeeDateCreateModal'));

export default ShopDetail;

