
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shop, Vibe, ShopImage } from '../types';
import { ALL_VIBES, CHEEKY_VIBES_OPTIONS } from '../constants';
import { generateShopDescription } from '../services/geminiService';
import { uploadImages } from '../services/storageService';
import Button from '../components/Button';
import TagChip from '../components/TagChip';
import LocationPicker from '../components/LocationPicker';
import { useToast } from '../context/ToastContext';

const EditShop: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { shops, updateShop, user } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    description: '',
  });
  
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [selectedCheekyVibes, setSelectedCheekyVibes] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{url: string, isNew: boolean, file?: File}[]>([]);
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Shop Data on Mount
  useEffect(() => {
    if (!user) {
        navigate('/auth');
        return;
    }

    const shopToEdit = shops.find(s => s.id === id);
    
    if (!shopToEdit) {
        toast.error("Shop not found");
        navigate('/');
        return;
    }

    // Security Check: Ensure user owns this shop or is admin
    if (shopToEdit.claimedBy !== user.id && !user.isAdmin) {
        toast.error("You are not authorized to edit this shop.");
        navigate(`/shop/${id}`);
        return;
    }

    // Populate Form
    setFormData({
        name: shopToEdit.name,
        city: shopToEdit.location.city,
        state: shopToEdit.location.state,
        address: shopToEdit.location.address,
        description: shopToEdit.description
    });
    setLocation({
        lat: shopToEdit.location.lat,
        lng: shopToEdit.location.lng
    });
    setSelectedVibes(shopToEdit.vibes);
    setSelectedCheekyVibes(shopToEdit.cheekyVibes || []);
    
    // Load opening hours if they exist
    if (shopToEdit.openHours) {
      setOpenHours({
        monday: shopToEdit.openHours.monday || '',
        tuesday: shopToEdit.openHours.tuesday || '',
        wednesday: shopToEdit.openHours.wednesday || '',
        thursday: shopToEdit.openHours.thursday || '',
        friday: shopToEdit.openHours.friday || '',
        saturday: shopToEdit.openHours.saturday || '',
        sunday: shopToEdit.openHours.sunday || ''
      });
    }
    
    // Map existing gallery to preview format
    setUploadedImages(shopToEdit.gallery.map(img => ({ url: img.url, isNew: false })));
    
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const originalShop = shops.find(s => s.id === id);
    if (!originalShop || !location) return;

    if (uploadedImages.length === 0) {
        toast.error("Please add at least one photo.");
        return;
    }

    setIsUploading(true);

    try {
      // Upload any new images to Supabase Storage
      const newImagesToUpload = uploadedImages.filter(img => img.isNew && img.file);
      let finalGallery: ShopImage[] = [];

      if (newImagesToUpload.length > 0) {
        console.log(`Uploading ${newImagesToUpload.length} new images...`);
        const files = newImagesToUpload.map(img => img.file!);

        let uploadResult;
        try {
          uploadResult = await uploadImages(files);
        } catch (err: any) {
          console.error('Supabase upload error (EditShop):', err);
          toast.error(err.message || 'Failed to upload images');
          setIsUploading(false);
          return;
        }

        // Build gallery: keep existing images + add newly uploaded URLs
        const existingImages = uploadedImages
          .filter(img => !img.isNew)
          .map(img => {
            const existing = originalShop.gallery.find(g => g.url === img.url);
            return {
              url: img.url,
              type: existing ? existing.type : 'owner' as const
            };
          });

        const newImages = (uploadResult.urls || []).map(url => ({
          url: url,
          type: 'owner' as const
        }));

        finalGallery = [...existingImages, ...newImages];
      } else {
        // No new images, just preserve existing ones
        finalGallery = uploadedImages.map(img => {
          const existing = originalShop.gallery.find(g => g.url === img.url);
          return {
            url: img.url,
            type: existing ? existing.type : 'owner' as const
          };
        });
      }

      const updatedShop: Shop = {
        ...originalShop,
        name: formData.name,
        description: formData.description,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: formData.address,
          city: formData.city,
          state: formData.state
        },
        gallery: finalGallery,
        vibes: selectedVibes,
        cheekyVibes: selectedCheekyVibes,
        openHours: openHours,
      };
      
      await updateShop(updatedShop);
      toast.success("Shop updated successfully!");
      navigate(`/shop/${id}`);
    } catch (error) {
      console.error('Error updating shop:', error);
      toast.error('Failed to update shop. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">The Basics</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-coffee-900 mb-2">Shop Name</label>
                    <input
                        required
                        className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-coffee-900 mb-2">City</label>
                    <input
                        required
                        className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                        value={formData.city}
                        onChange={e => setFormData({...formData, city: e.target.value})}
                    />
                </div>
             </div>
          </section>

          {/* Section 2: Location */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">Location</h2>
             <div>
                <label className="block text-sm font-bold text-coffee-900 mb-2">Full Address</label>
                <input
                    required
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none mb-4"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                />
                
                <LocationPicker 
                    searchAddress={`${formData.address} ${formData.city}`}
                    value={location || undefined}
                    onLocationSelect={(loc) => {
                        setLocation({ lat: loc.lat, lng: loc.lng });
                    }}
                />
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
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
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
                    onChange={(e) => setOpenHours({...openHours, [day]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Photos */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-coffee-400 uppercase tracking-wider border-b border-coffee-100 pb-2">Photos</h2>
            
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

          <div className="pt-4 flex gap-4">
            <Button 
              type="submit" 
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
        </form>
      </div>
    </div>
  );
};

export default EditShop;
