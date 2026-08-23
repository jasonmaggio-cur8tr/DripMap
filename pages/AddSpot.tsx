
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { resetSupabaseAuthState, getAccessTokenFast } from '../lib/authUtils';
import { Shop, Vibe, ShopImage, Brand } from '../types';
import { ALL_VIBES, CHEEKY_VIBES_OPTIONS } from '../constants';
import { generateShopDescription } from '../services/geminiService';
import { uploadImages } from '../services/storageService';
import Button from '../components/Button';
import TagChip from '../components/TagChip';
import LocationPicker from '../components/LocationPicker';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import { useToast } from '../context/ToastContext';

// Dark Roast input treatment (design_handoff_dark_roast/README.md → Design Tokens)
const darkInput =
  'w-full px-4 py-3 bg-[#2f251d] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-xl focus:ring-2 focus:ring-volt-400 outline-none';

const AddSpot: React.FC = () => {
  const { addShop, addBrand, user, loading, shops, brands } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 });
  const [sessionIssue, setSessionIssue] = useState<string | null>(null);
  const [similarShops, setSimilarShops] = useState<typeof shops>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Brand State — explicit 3-way mode
  type BrandMode = 'independent' | 'existing' | 'new';
  const [brandMode, setBrandMode] = useState<BrandMode>('independent');
  const [newBrandData, setNewBrandData] = useState({
    name: '',
    description: '',
    websiteUrl: ''
  });

  const [formData, setFormData] = useState({
    brandId: '',
    name: '',
    locationName: '',
    city: '',
    state: '',
    country: '',
    address: '',
    description: '',
  });
  
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [selectedCheekyVibes, setSelectedCheekyVibes] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{file: File; preview: string | null; loading: boolean}[]>([]);
  const [openHours, setOpenHours] = useState({
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Only redirect to the auth page once we've finished the app/session initialization
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, navigate, loading]);

  // Check for duplicate/similar shop names
  useEffect(() => {
    if (formData.name.length < 3) {
      setSimilarShops([]);
      setShowDuplicateWarning(false);
      return;
    }

    const searchName = formData.name.toLowerCase().trim();
    const matches = shops.filter(shop => {
      const shopName = shop.name.toLowerCase();
      // Check for exact match or if names are very similar
      return shopName === searchName ||
             shopName.includes(searchName) ||
             searchName.includes(shopName);
    });

    setSimilarShops(matches);
    setShowDuplicateWarning(matches.length > 0);
  }, [formData.name, shops]);

  // If the app is still hydrating/loading session, don't render the form yet.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e1712] pt-24 pb-[110px] px-4 flex items-center justify-center">
        <div className="max-w-3xl mx-auto bg-[#2b221b] rounded-3xl p-6 md:p-10 border border-white/[0.09] text-center">
          <p className="text-[rgba(243,239,224,0.5)]">Preparing your session — please wait...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
      // Log auth + profile state before creating spot so we can debug first-attempt failures
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      console.log('createSpot user:', currentUser, userError);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser?.id)
        .single();
      console.log('createSpot profile:', profile, profileError);

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
      const files: File[] = Array.from(e.target.files);

      // Add placeholders for each selected file so we can track per-file loading
      const placeholders = files.map(file => ({ file, preview: null as string | null, loading: true }));
      setUploadedImages(prev => [...prev, ...placeholders]);

      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
          if (event.target?.result) {
            setUploadedImages(prev => prev.map(item => {
              // match by object identity (File reference) and loading state
              if (item.file === file && item.loading) {
                return { file: item.file, preview: event.target!.result as string, loading: false };
              }
              return item;
            }));
          }
        };
        reader.readAsDataURL(file);
      });

      toast.success(`${files.length} photo(s) added`);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Are all previews finished loading?
  const allPreviewsReady = uploadedImages.length > 0 && uploadedImages.every(img => !img.loading && !!img.preview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
        toast.error("Please pin the location on the map.");
        return;
    }

    if (uploadedImages.length === 0) {
        toast.error("Please upload at least one photo.");
        return;
    }

    if (uploadedImages.some(img => img.loading)) {
      toast.error('Please wait until all images have finished loading before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!user) {
        toast.error('Please log in to add a shop.');
        setIsSubmitting(false);
        return;
      }

      // Upload images to Supabase Storage
      const imageFiles = uploadedImages.map(img => img.file);

      // Get the auth token ONCE here and pass it directly to the upload
      // functions so they never call getSession() themselves. Uses
      // getAccessTokenFast(): getSession() can hang on its cross-tab lock
      // (the "submit keeps timing out" bug), so after a short race it falls
      // back to the token persisted in localStorage.
      const accessToken = await getAccessTokenFast();

      if (!accessToken) {
        throw new Error('Could not authenticate. Please log out and log back in, then try again.');
      }

      setUploadProgress({ completed: 0, total: imageFiles.length });
      const uploadResult = await uploadImages(imageFiles, 'shops', (completed, total) => {
        setUploadProgress({ completed, total });
      }, accessToken);

      console.log('Upload result:', uploadResult);

      console.log('Images uploaded successfully, creating shop...');

      // Convert URLs to ShopImage objects
      const galleryImages: ShopImage[] = uploadResult.urls.map(url => ({
        url,
        type: 'owner'
      }));

      // Handle Brand Logic
      let finalBrandId = formData.brandId;
      let finalShopName = formData.name;

      if (brandMode === 'new') {
        if (!newBrandData.name) {
          toast.error("Please enter a Brand Name.");
          setIsSubmitting(false);
          return;
        }

        // Create new Brand
        finalBrandId = `brand-${Math.random().toString(36).substr(2, 9)}`;
        const newBrand: Brand = {
          id: finalBrandId,
          name: newBrandData.name,
          slug: newBrandData.name.toLowerCase().replace(/\s+/g, '-'),
          description: newBrandData.description || undefined,
          websiteUrl: newBrandData.websiteUrl || undefined,
          logoUrl: galleryImages[0]?.url
        };

        addBrand(newBrand);
        finalShopName = newBrandData.name;
      } else if (brandMode === 'independent') {
        finalBrandId = '';
      }

      // Create shop
      await addShop({
        name: finalShopName,
        brandId: finalBrandId || undefined,
        locationName: formData.locationName || undefined,
        description: formData.description,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country
        },
        gallery: galleryImages,
        vibes: selectedVibes,
        cheekyVibes: selectedCheekyVibes,
        openHours: openHours,
        isClaimed: false,
        claimedBy: undefined
      });

      if (brandMode === 'new') {
        toast.success("Brand registered & spot added successfully!");
      } else {
        toast.success("Spot added successfully!");
      }
      navigate('/');
    } catch (error: any) {
      // Surface the real reason to console so it's visible when debugging first-attempt failures
      console.error('Error adding spot (createSpot path):', error);
      
      // Check if it's a session/auth error
      const errorMsg = error.message || error.toString() || 'Failed to add spot. Please try again.';
      if (errorMsg.includes('session') || errorMsg.includes('expired') || errorMsg.includes('401') || errorMsg.includes('JWT')) {
        toast.error('Your session has expired. Please log in again to continue.');
        // Give user time to read the message before redirecting
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress({ completed: 0, total: 0 });
      // clear any transient session issue after an attempt (on success it will be cleared)
      setSessionIssue(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1712] pt-24 pb-[110px] px-4">
      {/* Sticky glass header */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
        style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2b221b' }}
          >
            <i className="fas fa-arrow-left text-sm" style={{ color: '#f3efe0' }}></i>
          </button>
          <h1 className="font-serif text-[19px] font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
            Add a Spot
          </h1>
        </div>
      </header>
      <div className="max-w-3xl mx-auto bg-[#2b221b] rounded-3xl p-6 md:p-10 border border-white/[0.09]">
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl font-serif font-black text-[#f3efe0] mb-2" style={{ letterSpacing: '-0.02em' }}>Add a New Spot</h1>
            <p className="text-[rgba(243,239,224,0.5)]">Share a hidden gem with the DripMap community.</p>
        </div>
        {sessionIssue && (
          <div className="mb-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-200">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm">{sessionIssue}</div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      console.log('User clicked session refresh - signing out and reloading');
                      await supabase.auth.signOut();
                    } catch (e) {
                      console.error('Error signing out during session refresh:', e);
                    }
                    // Force full reload to clear stale state
                    window.location.href = '/auth';
                  }}
                  className="text-xs bg-yellow-600 text-[#1e1712] font-bold px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-volt-400"
                >
                  Log out & refresh
                </button>
                <button
                  onClick={() => setSessionIssue(null)}
                  className="text-xs bg-[#2f251d] text-[#e4ddce] border border-white/[0.09] px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-volt-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-wider border-b border-white/[0.07] pb-2">The Basics</h2>

             {/* Brand / Chain Association */}
             <div>
                 <label className="block text-sm font-bold text-[#f3efe0] mb-3">Brand / Chain Association</label>

                 {/* 3-option radio group */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                   {[
                     { value: 'independent', label: 'Independent Spot', icon: 'fa-store', desc: 'One-of-a-kind shop, no chain' },
                     { value: 'existing', label: 'Existing Brand', icon: 'fa-link', desc: 'Add a location to a brand already on DripMap' },
                     { value: 'new', label: 'Register New Brand', icon: 'fa-plus-circle', desc: 'Create a new brand / chain' },
                   ].map(opt => {
                     const active = brandMode === opt.value;
                     return (
                       <button
                         key={opt.value}
                         type="button"
                         onClick={() => {
                           setBrandMode(opt.value as BrandMode);
                           // Reset dependent state when switching modes
                           if (opt.value !== 'existing') {
                             setFormData(prev => ({ ...prev, brandId: '' }));
                           }
                           if (opt.value !== 'new') {
                             setNewBrandData({ name: '', description: '', websiteUrl: '' });
                           }
                           if (opt.value === 'independent') {
                             setFormData(prev => ({ ...prev, name: '' }));
                           }
                         }}
                         className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                           active
                             ? 'border-volt-400 bg-[rgba(163,230,53,0.10)]'
                             : 'border-white/[0.09] bg-[#2f251d] hover:border-white/[0.2]'
                         }`}
                       >
                         <div className="flex items-center gap-2">
                           <i className={`fas ${opt.icon} ${active ? 'text-volt-400' : 'text-[rgba(243,239,224,0.45)]'}`} />
                           <span className={`text-sm font-bold ${active ? 'text-[#f3efe0]' : 'text-[#e4ddce]'}`}>
                             {opt.label}
                           </span>
                         </div>
                         <span className="text-xs text-[rgba(243,239,224,0.5)] leading-tight">{opt.desc}</span>
                       </button>
                     );
                   })}
                 </div>

                 {/* Existing brand dropdown */}
                 {brandMode === 'existing' && (
                   <div>
                     {brands.length === 0 ? (
                       <p className="text-sm text-[rgba(243,239,224,0.5)] italic">
                         No brands registered yet.{' '}
                         <button
                           type="button"
                           className="text-volt-400 font-bold hover:underline"
                           onClick={() => { setBrandMode('new'); setFormData(prev => ({ ...prev, brandId: '', name: '' })); }}
                         >
                           Register the first one →
                         </button>
                       </p>
                     ) : (
                       <div className="space-y-2">
                         <label className="block text-[10px] font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-[0.08em]">Select Brand</label>
                         <select
                           className={`${darkInput} appearance-none`}
                           value={formData.brandId}
                           onChange={e => {
                             const selectedBrand = brands.find(b => b.id === e.target.value);
                             setFormData(prev => ({
                               ...prev,
                               brandId: e.target.value,
                               name: selectedBrand ? selectedBrand.name : prev.name,
                             }));
                           }}
                         >
                           <option value="">— Select a brand —</option>
                           {brands.map(b => (
                             <option key={b.id} value={b.id}>{b.name}</option>
                           ))}
                         </select>
                         {formData.brandId && (
                           <p className="text-xs text-volt-400 font-semibold">
                             ✓ This location will be added to the <strong>{brands.find(b => b.id === formData.brandId)?.name}</strong> brand.
                           </p>
                         )}
                       </div>
                     )}
                   </div>
                 )}

                 {/* New brand form */}
                 {brandMode === 'new' && (
                   <div className="bg-[#2f251d] border border-white/[0.09] rounded-xl p-4 space-y-4 animate-in fade-in duration-300">
                       <div className="flex items-center gap-2 text-[rgba(243,239,224,0.5)] text-[10px] font-bold uppercase tracking-[0.08em] mb-2">
                           <i className="fas fa-plus-circle text-volt-400"></i> Creating New Brand
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-[#f3efe0] mb-1">Brand Name</label>
                               <input
                                   required={brandMode === 'new'}
                                   placeholder="e.g. Blue Bottle Coffee"
                                   className="w-full px-3 py-2 bg-[#2b221b] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none"
                                   value={newBrandData.name}
                                   onChange={e => setNewBrandData({...newBrandData, name: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-[#f3efe0] mb-1">Brand Website <span className="text-[rgba(243,239,224,0.45)] font-normal">(Optional)</span></label>
                               <input
                                   placeholder="https://..."
                                   className="w-full px-3 py-2 bg-[#2b221b] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none"
                                   value={newBrandData.websiteUrl}
                                   onChange={e => setNewBrandData({...newBrandData, websiteUrl: e.target.value})}
                               />
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-[#f3efe0] mb-1">Brand Description <span className="text-[rgba(243,239,224,0.45)] font-normal">(Optional)</span></label>
                           <input
                               placeholder="Short slogan or story about the brand"
                               className="w-full px-3 py-2 bg-[#2b221b] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none"
                               value={newBrandData.description}
                               onChange={e => setNewBrandData({...newBrandData, description: e.target.value})}
                           />
                       </div>
                   </div>
                 )}
             </div>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-[#f3efe0] mb-2">
                      Shop Name
                      {brandMode === 'existing' && formData.brandId && <span className="text-xs font-normal text-[rgba(243,239,224,0.45)] ml-2">(auto-filled from brand)</span>}
                      {brandMode === 'new' && <span className="text-xs font-normal text-[rgba(243,239,224,0.45)] ml-2">(uses brand name)</span>}
                    </label>
                    <input
                        required
                        placeholder={brandMode === 'new' ? "Will use Brand Name" : "e.g. The Daily Grind"}
                        className={`${darkInput} ${(brandMode === 'existing' && !!formData.brandId) || brandMode === 'new' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={brandMode === 'new' ? newBrandData.name : formData.name}
                        onChange={e => brandMode === 'independent' && setFormData({...formData, name: e.target.value})}
                        readOnly={(brandMode === 'existing' && !!formData.brandId) || brandMode === 'new'}
                    />
                    {showDuplicateWarning && similarShops.length > 0 && (
                      <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-sm text-amber-300 font-medium mb-2">
                          <i className="fas fa-exclamation-triangle mr-2"></i>
                          Similar shop(s) already exist:
                        </p>
                        <ul className="space-y-1">
                          {similarShops.slice(0, 3).map(shop => (
                            <li key={shop.id} className="text-sm text-amber-200/80 flex items-center justify-between">
                              <span>{shop.name} - {shop.location.city}</span>
                              <button
                                type="button"
                                onClick={() => navigate(`/shop/${shop.id}`)}
                                className="text-xs text-amber-300 hover:text-amber-200 underline"
                              >
                                View
                              </button>
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-amber-300/70 mt-2">
                          If this is the same shop, please don't create a duplicate.
                        </p>
                      </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-bold text-[#f3efe0] mb-2">City</label>
                    <input
                        required
                        placeholder="e.g. Sacramento"
                        className={darkInput}
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-[#f3efe0] mb-2">State</label>
                        <input
                            placeholder="e.g. California"
                            className={darkInput}
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#f3efe0] mb-2">Country</label>
                        <input
                            placeholder="e.g. USA"
                            className={darkInput}
                            value={formData.country}
                            onChange={e => setFormData({...formData, country: e.target.value})}
                        />
                    </div>
                </div>
             </div>
          </section>

          {/* Section 2: Location */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-wider border-b border-white/[0.07] pb-2">Location</h2>
             <div>
                <label className="block text-sm font-bold text-[#f3efe0] mb-2">Full Address</label>
                <input
                    required
                    placeholder="123 Bean St, Sacramento, CA"
                    className={`${darkInput} mb-4`}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                />
                
                {/* Map Picker */}
                <LocationPicker 
                    searchAddress={`${formData.address} ${formData.city}`}
                    value={location || undefined}
                    onLocationSelect={(loc) => {
                        setLocation({ lat: loc.lat, lng: loc.lng });
                        // Optional: Update address field if we got a reverse geocode result (not implemented in picker for simplicity)
                    }}
                />
             </div>
          </section>

          {/* Section 3: Vibes & Description */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-wider border-b border-white/[0.07] pb-2">The Vibe</h2>
            
            <div>
                <label className="block text-sm font-bold text-[#f3efe0] mb-3">Standard Vibes</label>
                <div className="flex flex-wrap gap-2 mb-1">
                    {ALL_VIBES.map(vibe => (
                        <TagChip
                            key={vibe}
                            label={vibe}
                            isSelected={selectedVibes.includes(vibe)}
                            onClick={() => handleVibeToggle(vibe)}
                            type="button"
                            className={selectedVibes.includes(vibe)
                                ? '!bg-volt-400 !text-coffee-900 !border-volt-400 font-bold'
                                : '!bg-[#2f251d] !text-[#e4ddce] !border-white/[0.09] hover:!border-white/[0.25] hover:!bg-[#2f251d]'}
                        />
                    ))}
                </div>
                <p className="text-xs text-[rgba(243,239,224,0.5)] mt-2">
                    {selectedVibes.length > 0 
                        ? `${selectedVibes.length} vibe${selectedVibes.length > 1 ? 's' : ''} selected` 
                        : 'Select at least one vibe'}
                </p>
            </div>

            <div>
                <label className="block text-sm font-bold text-[#f3efe0] mb-3">
                    Cheeky Vibes <span className="text-[rgba(243,239,224,0.45)] font-normal">(Optional personality traits)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CHEEKY_VIBES_OPTIONS.map(vibe => (
                        <label 
                            key={vibe} 
                            className="flex items-center gap-3 p-3 rounded-xl border-2 border-white/[0.09] hover:border-volt-400 cursor-pointer transition-all bg-[#2f251d]"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCheekyVibes.includes(vibe)}
                                onChange={() => handleCheekyVibeToggle(vibe)}
                                className="w-5 h-5 rounded border-white/[0.2] bg-[#1e1712] text-volt-400 focus:ring-2 focus:ring-volt-400 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-[#e4ddce]">{vibe}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-[rgba(243,239,224,0.5)] mt-2">
                    {selectedCheekyVibes.length > 0 
                        ? `${selectedCheekyVibes.length} cheeky vibe${selectedCheekyVibes.length > 1 ? 's' : ''} selected` 
                        : 'Add some personality to your spot'}
                </p>
            </div>

            <div>
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-bold text-[#f3efe0]">Description</label>
                    <button
                        type="button"
                        onClick={handleAiGenerate}
                        disabled={!formData.name || !formData.city || isGenerating}
                        className="text-xs text-volt-400 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                    >
                        <i className="fas fa-magic"></i>
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
                <textarea
                    required
                    rows={4}
                    className={darkInput}
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Tell us what makes this place special..."
                />
            </div>
          </section>

          {/* Section 4: Opening Hours */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-wider border-b border-white/[0.07] pb-2">Opening Hours (Optional)</h2>
            <p className="text-xs text-[rgba(243,239,224,0.5)]">Leave blank for days you're closed. Example: "8:00 AM - 5:00 PM" or "Closed"</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                <div key={day}>
                  <label className="block text-sm font-bold text-[#f3efe0] mb-2 capitalize">{day}</label>
                  <input
                    type="text"
                    placeholder="e.g. 8:00 AM - 5:00 PM"
                    className="w-full px-4 py-2 bg-[#2f251d] border border-white/[0.09] text-[#f3efe0] placeholder:text-[rgba(243,239,224,0.35)] rounded-lg focus:ring-2 focus:ring-volt-400 outline-none text-sm"
                    value={openHours[day as keyof typeof openHours]}
                    onChange={(e) => setOpenHours({...openHours, [day]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Photos */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[rgba(243,239,224,0.5)] uppercase tracking-wider border-b border-white/[0.07] pb-2">Photos</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-[#2f251d] flex items-center justify-center">
                    {img.preview && !img.loading ? (
                      <img src={img.preview} alt="Upload" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 text-[rgba(243,239,224,0.45)]">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="text-xs font-medium">Loading preview...</div>
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                    {idx === 0 && (
                       <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-bold text-center py-1">
                        HERO IMAGE
                       </div>
                    )}
                  </div>
                ))}
                
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/[0.15] flex flex-col items-center justify-center text-[rgba(243,239,224,0.45)] hover:border-volt-400 hover:text-volt-400 hover:bg-white/[0.03] transition-all focus:outline-none focus:ring-2 focus:ring-volt-400"
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
             <p className="text-xs text-[rgba(243,239,224,0.45)] mt-2">
               <i className="fas fa-info-circle mr-1"></i>
               Photos are auto-compressed. Max 3MB per image after compression. For large phone photos, they will be resized automatically.
             </p>
          </section>

          <div className="pt-4">
            <Button
              type="submit"
              variant="secondary"
              className="w-full py-4 text-lg font-extrabold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
              isLoading={isSubmitting}
              disabled={!allPreviewsReady}
            >
                {isSubmitting 
                  ? (uploadProgress.total > 0 && uploadProgress.completed < uploadProgress.total
                      ? `Uploading photos... (${uploadProgress.completed}/${uploadProgress.total})`
                      : uploadProgress.completed > 0
                        ? 'Saving spot...' 
                        : 'Uploading...')
                  : 'Submit Spot'}
                <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </form>
      </div>
      <BottomTabBar />
    </div>
  );
};

export default AddSpot;
