
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shop, Vibe, ShopImage, BrewItem, Barista, PlantMilkInfo } from '../types';
import { ALL_VIBES, CHEEKY_VIBES_OPTIONS } from '../constants';
import { generateShopDescription } from '../services/geminiService';
import { uploadImages } from '../services/storageService';
import { updateShopInDB, addShopImages, deleteShopImage, reorderShopImages, fetchShops } from '../services/dbService';
import Button from '../components/Button';
import TagChip from '../components/TagChip';
import LocationPicker from '../components/LocationPicker';
import { NowBrewingEditor, SpecialtyMenuEditor, VeganInfoEditor, BaristaEditor } from '../components/OwnerTools';
import { useToast } from '../context/ToastContext';

// Purple locked teaser shown in place of each PRO section for free-tier shops
const ProLockedTeaser: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
    <i className="fas fa-lock"></i>
    <span>{text}</span>
  </div>
);

const EditShop: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Use refreshShops to update state after save
  const { shops, updateShop, user, refreshShops, brands, addBrand } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    country: '',
    address: '',
    description: '',
    websiteUrl: '',
    instagramUrl: '',
  });

  const [parkingInfo, setParkingInfo] = useState('');
  const [isProShop, setIsProShop] = useState(false);

  // PRO feature state (persisted in the same save as the basics)
  const [happeningNow, setHappeningNow] = useState({ title: '', message: '', sticker: '' });
  const [coffeeTech, setCoffeeTech] = useState({ espressoMachine: '', grinderDetails: '', sourcingInfo: '' });
  const [currentMenu, setCurrentMenu] = useState<BrewItem[]>([]);
  const [specialtyDrinks, setSpecialtyDrinks] = useState<{ name: string; desc: string }[]>([]);
  const [veganFoodOptions, setVeganFoodOptions] = useState(false);
  const [plantMilks, setPlantMilks] = useState<PlantMilkInfo[]>([]);
  const [baristas, setBaristas] = useState<Barista[]>([]);
  const [premiumLinks, setPremiumLinks] = useState({ spotifyPlaylistUrl: '', onlineOrderUrl: '', mapsUrl: '' });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [selectedCheekyVibes, setSelectedCheekyVibes] = useState<string[]>([]);
  const [customVibes, setCustomVibes] = useState<string[]>([]);
  const [newCustomVibe, setNewCustomVibe] = useState('');
  const [uploadedImages, setUploadedImages] = useState<{ id?: string, url: string, isNew: boolean, file?: File }[]>([]);
  const [openHours, setOpenHours] = useState<{
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  }>({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  });
  const [isUploading, setIsUploading] = useState(false);

  // Brand state
  const [brandId, setBrandId] = useState('');
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [newBrandData, setNewBrandData] = useState({ name: '', description: '', websiteUrl: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Tracks which shop the form was populated for, so a background refreshShops()
  // doesn't re-run the populate effect and wipe the owner's in-progress edits.
  const populatedShopIdRef = useRef<string | null>(null);

  // Fetch Shop Data on Mount
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const init = async () => {
      // Force refresh shops to ensure we have IDs
      await refreshShops();
    };
    init();
  }, [user, navigate]); // Removed id/toast to minimize re-runs

  // Separate effect to load data once shops are ready/refreshed
  useEffect(() => {
    if (!shops.length) return;

    // Find shop from updated context
    const shopToEdit = shops.find(s => s.id === id || s.slug === id);

    if (!shopToEdit) return;

    // Only populate once per shop — later `shops` updates must not reset the form mid-edit
    if (populatedShopIdRef.current === shopToEdit.id) return;

    // Security Check: Ensure user owns this shop or is admin
    const isActualOwner = shopToEdit.claimedBy && shopToEdit.claimedBy === user?.id;
    if (!isActualOwner && !user?.isAdmin) {
      toast.error("You are not authorized to edit this shop.");
      navigate(`/shop/${id}`);
      return;
    }

    // Populate Form
    setFormData({
      name: shopToEdit.name,
      city: shopToEdit.location.city,
      state: shopToEdit.location.state,
      country: shopToEdit.location.country || '',
      address: shopToEdit.location.address,
      description: shopToEdit.description,
      websiteUrl: shopToEdit.websiteUrl || '',
      instagramUrl: shopToEdit.instagramUrl || '',
    });
    setLocation({
      lat: shopToEdit.location.lat,
      lng: shopToEdit.location.lng
    });
    setSelectedVibes(shopToEdit.vibes);
    setSelectedCheekyVibes(shopToEdit.cheekyVibes || []);
    setCustomVibes(shopToEdit.customVibes || []);
    setBrandId((shopToEdit as any).brandId || '');
    setParkingInfo(shopToEdit.parkingInfo || '');
    setIsProShop(shopToEdit.subscriptionTier === 'pro' || shopToEdit.subscriptionTier === 'pro_plus');

    // PRO fields
    // Only prefill a Happening Now post that is still live (no expiry, or expiry in the future);
    // an expired 4h post must not be silently revived as a persistent post on save.
    const hn = shopToEdit.happeningNow;
    const hnLive = !!hn && (!hn.expiresAt || new Date(hn.expiresAt) > new Date());
    setHappeningNow({
      title: hnLive ? hn.title || '' : '',
      message: hnLive ? hn.message || '' : '',
      sticker: hnLive ? hn.sticker || '' : '',
    });
    setCoffeeTech({
      espressoMachine: shopToEdit.espressoMachine || '',
      grinderDetails: shopToEdit.grinderDetails || '',
      sourcingInfo: shopToEdit.sourcingInfo || '',
    });
    setCurrentMenu(shopToEdit.currentMenu || []);
    setSpecialtyDrinks(shopToEdit.specialtyDrinks || []);
    setVeganFoodOptions(!!shopToEdit.veganFoodOptions);
    setPlantMilks(shopToEdit.plantMilks || []);
    setBaristas(shopToEdit.baristas || []);
    setPremiumLinks({
      spotifyPlaylistUrl: shopToEdit.spotifyPlaylistUrl || '',
      onlineOrderUrl: shopToEdit.onlineOrderUrl || '',
      mapsUrl: shopToEdit.mapsUrl || '',
    });

    // Load opening hours
    if (shopToEdit.openHours) {
      setOpenHours(prev => ({ ...prev, ...shopToEdit.openHours }));
    }

    // Map existing gallery to preview format - CRITICAL: Ensure IDs are present
    console.log('[EditShop] Loading gallery with IDs:', shopToEdit.gallery.map(g => g.id));
    setUploadedImages(shopToEdit.gallery.map(img => ({
      id: img.id, // Keep the ID for deletion tracking
      url: img.url,
      isNew: false
    })));

    populatedShopIdRef.current = shopToEdit.id;
    setIsLoading(false);
  }, [id, shops, user, navigate, toast]);


  const handleVibeToggle = (vibe: Vibe) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const handleCheekyVibeToggle = (vibe: string) => {
    setSelectedCheekyVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  const handleAiGenerate = async () => {
    if (!formData.name || !formData.city) return;

    setIsGenerating(true);
    try {
      const description = await generateShopDescription(formData.name, selectedVibes.map(String), formData.city);
      setFormData(prev => ({ ...prev, description }));
      toast.success("Description generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate description");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setUploadedImages(prev => [...prev, {
              url: event.target!.result as string,
              isNew: true,
              file: file // Store the actual file for upload later
            }]);
          }
        };
        reader.readAsDataURL(file);
      });
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added`);

      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Reorder gallery images. The first image (index 0) is the hero shown on the shop card.
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= uploadedImages.length || from === to) return;
    setUploadedImages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  // Empty strings → null so we never persist blank PRO text fields
  const textOrNull = (v: string) => v.trim() || null;
  const urlOrNull = (v: string) => {
    const t = v.trim();
    if (!t) return null;
    return /^https?:\/\//i.test(t) ? t : `https://${t}`;
  };

  // PRO columns — only included in the save payload when the shop is PRO / PRO+
  const buildProUpdates = () => {
    const hnTitle = textOrNull(happeningNow.title);
    const hnMessage = textOrNull(happeningNow.message);
    const hasHappeningNow = !!(hnTitle || hnMessage);
    return {
      parking_info: textOrNull(parkingInfo),
      // Happening Now set from here is persistent (no 4h expiry) until the owner clears it
      happening_now_title: hasHappeningNow ? hnTitle : null,
      happening_now_message: hasHappeningNow ? hnMessage : null,
      happening_now_sticker: hasHappeningNow ? textOrNull(happeningNow.sticker) : null,
      happening_now_expires_at: null,
      sourcing_info: textOrNull(coffeeTech.sourcingInfo),
      espresso_machine: textOrNull(coffeeTech.espressoMachine),
      grinder_details: textOrNull(coffeeTech.grinderDetails),
      current_menu: currentMenu,
      specialty_drinks: specialtyDrinks,
      vegan_food_options: veganFoodOptions,
      plant_milks: plantMilks,
      baristas,
      spotify_playlist_url: urlOrNull(premiumLinks.spotifyPlaylistUrl),
      online_order_url: urlOrNull(premiumLinks.onlineOrderUrl),
      maps_url: urlOrNull(premiumLinks.mapsUrl),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const originalShop = shops.find(s => s.id === id || s.slug === id);
    if (!originalShop || !location) return;

    if (uploadedImages.length === 0) {
      toast.error("Please add at least one photo.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Handle Deletions
      const originalIds = originalShop.gallery?.map(img => img.id).filter(Boolean) || [];
      const currentIds = uploadedImages.filter(img => !img.isNew && img.id).map(img => img.id);
      const deletedIds = originalIds.filter(id => !currentIds.includes(id));

      console.log('[EditShop] Debug Info:', {
        originalGalleryLength: originalShop.gallery?.length,
        originalIds,
        uploadedImagesLength: uploadedImages.length,
        currentIds,
        deletedIds
      });

      if (deletedIds.length > 0) {
        console.log(`Deleting ${deletedIds.length} images...Ids:`, deletedIds);
        // Parallel deletion
        await Promise.all(deletedIds.map(id => deleteShopImage(id!)));
      }

      // 2. Handle New Uploads & Additions
      const newImagesToUpload = uploadedImages.filter(img => img.isNew && img.file);
      const newIdByImage = new Map<any, string>();

      if (newImagesToUpload.length > 0) {
        console.log(`Uploading ${newImagesToUpload.length} new images...`);
        const files = newImagesToUpload.map(img => img.file!);

        try {
          const uploadResult = await uploadImages(files);

          if (uploadResult.urls && uploadResult.urls.length > 0) {
            const newImagesData = uploadResult.urls.map(url => ({
              url,
              type: 'owner' as const
            }));
            const addResult = await addShopImages(originalShop.id, newImagesData);
            // Map freshly-inserted rows back to their image objects (by uploaded URL)
            // so the gallery order below can include newly added photos.
            const urlToId = new Map<string, string>(
              (addResult?.data || []).map((row: any) => [row.url, row.id])
            );
            newImagesToUpload.forEach((imgObj, i) => {
              const insertedId = urlToId.get(uploadResult.urls![i]);
              if (insertedId) newIdByImage.set(imgObj, insertedId);
            });
          }
        } catch (err: any) {
          console.error('Supabase upload error (EditShop):', err);
          toast.error(err.message || 'Failed to upload images');
          setIsUploading(false);
          return;
        }
      }

      // 2b. Persist the gallery order (index 0 = hero image shown on the shop card)
      const orderedImageIds = uploadedImages
        .map(img => (img.isNew ? newIdByImage.get(img) : img.id))
        .filter((v): v is string => !!v);
      if (orderedImageIds.length > 0) {
        await reorderShopImages(originalShop.id, orderedImageIds);
      }

      // Handle brand update
      let finalBrandId = brandId;
      if (isCreatingBrand && newBrandData.name) {
        const generatedId = `brand-${Math.random().toString(36).substr(2, 9)}`;
        addBrand({
          id: generatedId,
          name: newBrandData.name,
          slug: newBrandData.name.toLowerCase().replace(/\s+/g, '-'),
          description: newBrandData.description || undefined,
          websiteUrl: newBrandData.websiteUrl || undefined,
        });
        finalBrandId = generatedId;
      }

      // 3. Update Shop Details (excluding gallery, which is handled via shop_images)
      const shopUpdates = {
        name: formData.name,
        description: formData.description,
        lat: location.lat,
        lng: location.lng,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        vibes: selectedVibes,
        cheeky_vibes: selectedCheekyVibes,
        custom_vibes: customVibes,
        open_hours: openHours,
        brand_id: finalBrandId || null,
        website_url: formData.websiteUrl.trim() || null,
        instagram_url: (() => {
          const ig = formData.instagramUrl.trim().replace(/^@/, '');
          if (!ig) return null;
          return /^https?:\/\//i.test(ig) ? ig : `https://instagram.com/${ig}`;
        })(),
        ...(isProShop ? buildProUpdates() : {}),
      };

      const updateResult = await updateShopInDB(originalShop.id, shopUpdates);
      if (!updateResult.success) {
        throw updateResult.error || new Error("Failed to update shop details in database");
      }

      // 4. Update Local State & Redirect
      // We refresh shops to get the updated gallery (with new IDs) and details
      await refreshShops();

      toast.success("Shop updated successfully!");
      navigate(`/shop/${id}`);
    } catch (error) {
      console.error('Error updating shop:', error);
      toast.error('Failed to update shop. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // The reused OwnerTools editors require an onUpgrade handler; PRO upgrades live on the shop page
  const goToShopPage = () => navigate(`/shop/${id}`);

  if (isLoading) {
    return <div className="min-h-screen pt-24 text-center text-coffee-500">Loading editor...</div>;
  }

  return (
    <div className="min-h-screen bg-coffee-50 pt-24 pb-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-coffee-100 border-t-4 border-t-volt-400">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-coffee-900 mb-2">Edit Shop Details</h1>
            <p className="text-coffee-500">Update the Lowdown for <span className="font-bold">{formData.name}</span>.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/shop/${id}`)}>
            Cancel
          </Button>
        </div>

        <form id="edit-shop-form" onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">The Basics</h2>

            {/* Brand / Chain Association */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-coffee-900 mb-3">Brand / Chain Association</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { value: 'independent', label: 'Independent Spot', icon: 'fa-store', desc: 'One-of-a-kind, no chain' },
                  { value: 'existing', label: 'Existing Brand', icon: 'fa-link', desc: 'Part of a brand on DripMap' },
                  { value: 'new', label: 'Register New Brand', icon: 'fa-plus-circle', desc: 'Create a new brand' },
                ].map(opt => {
                  const active =
                    (opt.value === 'independent' && !isCreatingBrand && !brandId) ||
                    (opt.value === 'existing' && !isCreatingBrand && !!brandId) ||
                    (opt.value === 'new' && isCreatingBrand);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (opt.value === 'new') { setIsCreatingBrand(true); setBrandId(''); }
                        else if (opt.value === 'existing') { setIsCreatingBrand(false); setNewBrandData({ name: '', description: '', websiteUrl: '' }); }
                        else { setIsCreatingBrand(false); setBrandId(''); setNewBrandData({ name: '', description: '', websiteUrl: '' }); }
                      }}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                        active ? 'border-volt-400 bg-coffee-50' : 'border-coffee-100 bg-white hover:border-coffee-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`fas ${opt.icon} ${active ? 'text-volt-500' : 'text-coffee-400'}`} />
                        <span className={`text-sm font-bold ${active ? 'text-coffee-900' : 'text-coffee-600'}`}>{opt.label}</span>
                      </div>
                      <span className="text-xs text-coffee-400 leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Existing brand dropdown */}
              {!isCreatingBrand && brands.length > 0 && (
                <div className="space-y-2">
                  <select
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none appearance-none"
                    value={brandId}
                    onChange={e => setBrandId(e.target.value)}
                  >
                    <option value="">— No brand (independent) —</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {brandId && (
                    <p className="text-xs text-volt-600 font-semibold">
                      ✓ Linked to <strong>{brands.find(b => b.id === brandId)?.name}</strong>
                    </p>
                  )}
                </div>
              )}
              {!isCreatingBrand && brands.length === 0 && (
                <p className="text-sm text-coffee-400 italic">No brands on DripMap yet. Use "Register New Brand" above.</p>
              )}

              {/* New brand form */}
              {isCreatingBrand && (
                <div className="bg-coffee-50 border border-coffee-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-coffee-900 mb-1">Brand Name</label>
                      <input placeholder="e.g. Blue Bottle Coffee" className="w-full px-3 py-2 bg-white border border-coffee-200 rounded-lg focus:ring-2 focus:ring-volt-400 outline-none" value={newBrandData.name} onChange={e => setNewBrandData({...newBrandData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-coffee-900 mb-1">Website <span className="text-coffee-400 font-normal">(optional)</span></label>
                      <input placeholder="https://..." className="w-full px-3 py-2 bg-white border border-coffee-200 rounded-lg focus:ring-2 focus:ring-volt-400 outline-none" value={newBrandData.websiteUrl} onChange={e => setNewBrandData({...newBrandData, websiteUrl: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Description <span className="text-coffee-400 font-normal">(optional)</span></label>
                    <input placeholder="Short tagline or story" className="w-full px-3 py-2 bg-white border border-coffee-200 rounded-lg focus:ring-2 focus:ring-volt-400 outline-none" value={newBrandData.description} onChange={e => setNewBrandData({...newBrandData, description: e.target.value})} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-coffee-900 mb-2">Shop Name</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-coffee-900 mb-2">City</label>
                <input
                  className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-coffee-900 mb-2">State</label>
                  <input
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-coffee-900 mb-2">Country</label>
                  <input
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                    value={formData.country}
                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Location */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">Location</h2>
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">Full Address</label>
              <input
                className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none mb-4"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />

              <LocationPicker
                searchAddress={`${formData.address} ${formData.city}`}
                value={location || undefined}
                onLocationSelect={(loc) => {
                  setLocation({ lat: loc.lat, lng: loc.lng });
                }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-coffee-900 mb-2">Website <span className="text-coffee-400 font-normal">(optional)</span></label>
                <input
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                  value={formData.websiteUrl}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-coffee-900 mb-2">Instagram <span className="text-coffee-400 font-normal">(handle or URL)</span></label>
                <input
                  placeholder="@yourshop"
                  className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                  value={formData.instagramUrl}
                  onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Vibes & Description */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">The Vibe</h2>

            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-3">Standard Vibes</label>
              <div className="flex flex-wrap gap-2">
                {ALL_VIBES.map(vibe => (
                  <TagChip
                    key={vibe}
                    label={vibe}
                    isSelected={selectedVibes.includes(vibe)}
                    onClick={() => handleVibeToggle(vibe)}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-3">
                Custom Vibes <span className="text-coffee-400 font-normal">(Add your own tags)</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {customVibes.map(vibe => (
                  <div key={vibe} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-volt-400 text-coffee-900 font-bold text-sm">
                    {vibe}
                    <button
                      type="button"
                      onClick={() => setCustomVibes(prev => prev.filter(v => v !== vibe))}
                      className="ml-1 text-coffee-900/60 hover:text-coffee-900"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Secret Menu, Free Wi-Fi"
                  className="flex-1 px-4 py-2 bg-coffee-50 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-volt-400"
                  value={newCustomVibe}
                  onChange={e => setNewCustomVibe(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newCustomVibe.trim() && !customVibes.includes(newCustomVibe.trim())) {
                        setCustomVibes(prev => [...prev, newCustomVibe.trim()]);
                        setNewCustomVibe('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newCustomVibe.trim() && !customVibes.includes(newCustomVibe.trim())) {
                      setCustomVibes(prev => [...prev, newCustomVibe.trim()]);
                      setNewCustomVibe('');
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-3">
                Cheeky Vibes <span className="text-coffee-400 font-normal">(Optional personality traits)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHEEKY_VIBES_OPTIONS.map(vibe => (
                  <label
                    key={vibe}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 border-coffee-100 hover:border-volt-400 cursor-pointer transition-all bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCheekyVibes.includes(vibe)}
                      onChange={() => handleCheekyVibeToggle(vibe)}
                      className="w-5 h-5 rounded border-coffee-300 text-volt-400 focus:ring-2 focus:ring-volt-400 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-coffee-900">{vibe}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-bold text-coffee-900">The Lowdown (Description)</label>
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={!formData.name || !formData.city || isGenerating}
                  className="text-xs text-volt-500 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                >
                  <i className="fas fa-magic"></i>
                  {isGenerating ? 'Generating...' : 'Regenerate with AI'}
                </button>
              </div>
              <textarea
                rows={4}
                className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </section>

          {/* Section 4: Opening Hours */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">Opening Hours</h2>
            <p className="text-xs text-coffee-500">Leave blank for days you're closed. Example: "8:00 AM - 5:00 PM" or "Closed"</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day}>
                  <label className="block text-sm font-bold text-coffee-900 mb-2 capitalize">{day}</label>
                  <input
                    type="text"
                    placeholder="e.g. 8:00 AM - 5:00 PM"
                    className="w-full px-4 py-2 bg-coffee-50 border border-coffee-200 rounded-lg focus:ring-2 focus:ring-volt-400 outline-none text-sm"
                    value={openHours[day as keyof typeof openHours]}
                    onChange={(e) => setOpenHours({ ...openHours, [day]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Photos */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">Photos</h2>
            <p className="text-xs text-coffee-400 -mt-1">Use the arrows to reorder your photos — the first one is the hero image shown on your shop card.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={img.url} alt="Upload" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fas fa-times text-xs"></i>
                  </button>
                  {/* Reorder controls — the first image is the hero */}
                  <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx - 1)}
                      disabled={idx === 0}
                      aria-label="Move image earlier"
                      className="bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm disabled:opacity-30"
                    >
                      <i className="fas fa-chevron-left text-xs"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage(idx, idx + 1)}
                      disabled={idx === uploadedImages.length - 1}
                      aria-label="Move image later"
                      className="bg-black/60 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm disabled:opacity-30"
                    >
                      <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                  </div>
                  {idx === 0 ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1">
                      HERO IMAGE
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => moveImage(idx, 0)}
                      className="absolute bottom-1 left-1 right-1 bg-black/50 hover:bg-volt-400 hover:text-black text-white text-[10px] font-bold text-center py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Make hero
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-coffee-300 flex flex-col items-center justify-center text-coffee-400 hover:border-volt-400 hover:text-volt-500 hover:bg-coffee-50 transition-all"
              >
                <i className="fas fa-camera text-2xl mb-2"></i>
                <span className="text-xs font-bold">Add Photos</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                multiple
                accept="image/*"
              />
            </div>
          </section>
        </form>

        {/*
          PRO FEATURES — rendered as a sibling of the form (not inside it) because the reused
          OwnerTools editors have untyped buttons / a nested <form> modal that would otherwise
          submit the whole page. The Save button below targets the form via its `form` attribute.
        */}
        <div className="mt-8 space-y-8">
          <section className="space-y-6">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2 flex items-center gap-2">
              Pro Features
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-700">PRO</span>
            </h2>
            {isProShop ? (
              <p className="text-xs text-coffee-500 -mt-3">These sections are saved together with everything above when you hit Save Changes.</p>
            ) : (
              <p className="text-xs text-coffee-500 -mt-3">Upgrade to PRO from your shop page to unlock these sections.</p>
            )}

            {/* ⚡ Happening Now */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">⚡ Happening Now</label>
              {isProShop ? (
                <div className="space-y-3">
                  <input
                    placeholder="Title (e.g. Fresh Pastries!)"
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                    value={happeningNow.title}
                    onChange={e => setHappeningNow({ ...happeningNow, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Message — what's going on right now?"
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none resize-none"
                    rows={3}
                    value={happeningNow.message}
                    onChange={e => setHappeningNow({ ...happeningNow, message: e.target.value })}
                  />
                  <input
                    placeholder="Sticker (optional, e.g. FRESH DROP)"
                    maxLength={20}
                    className="w-full sm:w-1/2 px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                    value={happeningNow.sticker}
                    onChange={e => setHappeningNow({ ...happeningNow, sticker: e.target.value })}
                  />
                  <p className="text-xs text-coffee-400">Clear the title and message to take the board down. Posts made here stay live until you clear them.</p>
                </div>
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to post real-time updates on your shop page." />
              )}
            </div>

            {/* 🅿️ Parking Info */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">🅿️ Parking Info</label>
              {isProShop ? (
                <textarea
                  placeholder="e.g. Parking Pro Tip: there is free parking all day on the block behind our cafe."
                  className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none resize-none"
                  rows={3}
                  value={parkingInfo}
                  onChange={e => setParkingInfo(e.target.value)}
                />
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to share parking tips with visitors." />
              )}
            </div>

            {/* ⚙️ Coffee Tech */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">⚙️ Coffee Tech</label>
              {isProShop ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Espresso Machine</label>
                    <input
                      placeholder="e.g. La Marzocco Linea PB"
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                      value={coffeeTech.espressoMachine}
                      onChange={e => setCoffeeTech({ ...coffeeTech, espressoMachine: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Grinder</label>
                    <input
                      placeholder="e.g. Mahlkönig EK43"
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                      value={coffeeTech.grinderDetails}
                      onChange={e => setCoffeeTech({ ...coffeeTech, grinderDetails: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Sourcing / Roaster</label>
                    <textarea
                      placeholder="Direct trade details, house roaster, origins..."
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none resize-none"
                      rows={2}
                      value={coffeeTech.sourcingInfo}
                      onChange={e => setCoffeeTech({ ...coffeeTech, sourcingInfo: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to show off your espresso machine, grinder and sourcing." />
              )}
            </div>

            {/* ☕ Now Brewing */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">☕ Now Brewing</label>
              {isProShop ? (
                <NowBrewingEditor
                  menu={currentMenu}
                  isOwner={true}
                  isLocked={false}
                  onUpgrade={goToShopPage}
                  onUpdate={setCurrentMenu}
                />
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to list the beans you're brewing right now." />
              )}
            </div>

            {/* 🌟 Specialty Menu */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">🌟 Specialty Menu</label>
              {isProShop ? (
                <SpecialtyMenuEditor
                  items={specialtyDrinks}
                  isOwner={true}
                  isLocked={false}
                  onUpgrade={goToShopPage}
                  onUpdate={setSpecialtyDrinks}
                />
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to showcase your signature drinks." />
              )}
            </div>

            {/* 🌱 Vegan & Plant Milks */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">🌱 Vegan & Plant Milks</label>
              {isProShop ? (
                <VeganInfoEditor
                  hasOptions={veganFoodOptions}
                  milks={plantMilks}
                  isOwner={true}
                  isLocked={false}
                  isEditing={true}
                  onUpgrade={goToShopPage}
                  onUpdate={(updates) => {
                    if (updates.veganFoodOptions !== undefined) setVeganFoodOptions(updates.veganFoodOptions);
                    if (updates.plantMilks !== undefined) setPlantMilks(updates.plantMilks);
                  }}
                />
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to list vegan food and plant milk options." />
              )}
            </div>

            {/* 👤 Barista Profiles */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">👤 Barista Profiles</label>
              {isProShop ? (
                <BaristaEditor
                  baristas={baristas}
                  isOwner={true}
                  isLocked={false}
                  onUpgrade={goToShopPage}
                  onUpdate={setBaristas}
                />
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to introduce your team." />
              )}
            </div>

            {/* 🔗 Premium Links */}
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2">🔗 Premium Links</label>
              {isProShop ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Spotify Playlist URL</label>
                    <input
                      placeholder="https://open.spotify.com/..."
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                      value={premiumLinks.spotifyPlaylistUrl}
                      onChange={e => setPremiumLinks({ ...premiumLinks, spotifyPlaylistUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Online Order URL</label>
                    <input
                      placeholder="https://..."
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                      value={premiumLinks.onlineOrderUrl}
                      onChange={e => setPremiumLinks({ ...premiumLinks, onlineOrderUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-coffee-900 mb-1">Google Maps URL</label>
                    <input
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                      value={premiumLinks.mapsUrl}
                      onChange={e => setPremiumLinks({ ...premiumLinks, mapsUrl: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <ProLockedTeaser text="Upgrade to PRO to add Spotify, online ordering and Google Maps links." />
              )}
            </div>
          </section>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              form="edit-shop-form"
              className="flex-1 py-4 text-lg shadow-xl hover:shadow-2xl"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default EditShop;
