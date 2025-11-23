
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import { Vibe, User, Shop } from '../types';
import { useToast } from '../context/ToastContext';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout, shops, updateUserProfile, getProfileById, getProfileByUsername, toggleFollow } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State
  const [editData, setEditData] = useState({
    username: '',
    bio: '',
    avatarUrl: '',
    socialLinks: {
        instagram: '',
        x: '',
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we are viewing our own profile
  const isOwnProfile = !id || (currentUser && (id === currentUser.id || id === currentUser.username));
  const profileIdentifier = id || currentUser?.username;

  // Fetch Profile Data
  useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true);
        console.log('Fetching profile for:', id, 'isOwnProfile:', isOwnProfile);
        
        if (isOwnProfile) {
            if (!currentUser) {
                console.log('No current user, redirecting to auth');
                navigate('/auth');
                setLoading(false);
                return;
            }
            console.log('Setting viewed user to current user:', currentUser.username);
            setViewedUser(currentUser);
            setLoading(false);
        } else if (profileIdentifier) {
            console.log('Fetching profile by identifier:', profileIdentifier);
            
            // Try to fetch by username first, then by ID
            let profile = await getProfileByUsername(profileIdentifier);
            console.log('Profile by username:', profile);
            
            if (!profile) {
                console.log('Trying to fetch by ID');
                profile = await getProfileById(profileIdentifier);
                console.log('Profile by ID:', profile);
            }
            
            if (profile) {
                console.log('Profile found:', profile.username);
                setViewedUser(profile);
            } else {
                console.log('No profile found');
                toast.error("User not found");
                navigate('/');
            }
            setLoading(false);
        } else {
            console.log('No profile identifier');
            setLoading(false);
        }
    };
    fetchProfile();
  }, [id, currentUser, isOwnProfile, navigate, getProfileById, getProfileByUsername]);

  if (loading) return <div className="min-h-screen pt-20 text-center text-coffee-500">Loading profile...</div>;
  if (!viewedUser) {
    return (
      <div className="min-h-screen pt-20 text-center">
        <p className="text-coffee-500">Unable to load profile</p>
        <button onClick={() => navigate('/')} className="mt-4 text-volt-500 hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  // --- Data Derivation for Gamification ---
  const savedSpots = shops.filter(shop => viewedUser.savedShops.includes(shop.id));
  const visitedSpots = shops.filter(shop => viewedUser.visitedShops.includes(shop.id));
  const claimedSpots = shops.filter(shop => shop.claimedBy === viewedUser.id);

  // Organize Visited Spots by City for Passport Book
  const passportBook = visitedSpots.reduce((acc, shop) => {
      const key = `${shop.location.city}, ${shop.location.state}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(shop);
      return acc;
  }, {} as Record<string, typeof visitedSpots>);

  // Calculate Drip Score
  const userReviewCount = shops.reduce((acc, shop) => acc + shop.reviews.filter(r => r.userId === viewedUser.id).length, 0);
  const dripScore = (visitedSpots.length * 10) + (savedSpots.length * 5) + (userReviewCount * 20) + (claimedSpots.length * 50);

  // Badges Logic
  const uniqueCitiesVisited = new Set(visitedSpots.map(s => s.location.city)).size;
  const matchaSpotsVisited = visitedSpots.filter(s => s.vibes.includes(Vibe.MATCHA)).length;
  
  const BADGES = [
    {
        id: 'first-sip',
        name: 'First Sip',
        desc: 'Visit your first spot',
        icon: 'fas fa-mug-hot',
        unlocked: visitedSpots.length >= 1
    },
    {
        id: 'tastemaker',
        name: 'Tastemaker',
        desc: 'Leave 3 Reviews',
        icon: 'fas fa-feather-alt',
        unlocked: userReviewCount >= 3
    },
    {
        id: 'nomad',
        name: 'The Nomad',
        desc: 'Visit 3 Cities',
        icon: 'fas fa-globe-americas',
        unlocked: uniqueCitiesVisited >= 3
    },
    {
        id: 'matcha-fix',
        name: 'Green Goddess',
        desc: 'Visit 3 Matcha Spots',
        icon: 'fas fa-leaf',
        unlocked: matchaSpotsVisited >= 3
    },
    {
        id: 'curator',
        name: 'The Curator',
        desc: 'Save 5 Spots',
        icon: 'fas fa-bookmark',
        unlocked: savedSpots.length >= 5
    },
    {
        id: 'boss',
        name: 'The Boss',
        desc: 'Claim a Shop',
        icon: 'fas fa-briefcase',
        unlocked: claimedSpots.length >= 1
    }
  ];

  const startEditing = () => {
    setEditData({
      username: viewedUser.username,
      bio: viewedUser.bio || '',
      avatarUrl: viewedUser.avatarUrl,
      socialLinks: {
          instagram: viewedUser.socialLinks?.instagram || '',
          x: viewedUser.socialLinks?.x || '',
      }
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    updateUserProfile({
      username: editData.username,
      bio: editData.bio,
      avatarUrl: editData.avatarUrl,
      socialLinks: editData.socialLinks
    });
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditData(prev => ({ ...prev, avatarUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSocialChange = (key: keyof typeof editData.socialLinks, value: string) => {
    setEditData(prev => ({
        ...prev,
        socialLinks: {
            ...prev.socialLinks,
            [key]: value
        }
    }));
  };

  const handleShareProfile = () => {
      // Generate shareable profile URL with username
      const baseUrl = window.location.origin + window.location.pathname;
      const profileUrl = viewedUser.username ? `${baseUrl}#/profile/${viewedUser.username}` : window.location.href;
      
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
  };

  const handleToggleFollow = async () => {
      if (!currentUser) {
          navigate('/auth');
          return;
      }
      const result = await toggleFollow(viewedUser.id);
      if (result.success) {
          toast.success(isFollowing ? "Unfollowed!" : "Following!");
      } else {
          toast.error("Follow feature requires database setup. Please run add_followers.sql in Supabase.");
      }
  };

  const isFollowing = currentUser?.followingIds?.includes(viewedUser.id) || false;

  const renderSocialIcon = (url: string | undefined, iconClass: string, label: string, colorClass: string = 'text-coffee-900') => {
      if (!url) return null;
      const safeUrl = url.startsWith('http') ? url : `https://${url}`;
      return (
          <a 
            href={safeUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`w-10 h-10 rounded-full bg-coffee-50 flex items-center justify-center transition-all hover:scale-110 hover:bg-white hover:shadow-md border border-transparent hover:border-coffee-100 ${colorClass}`}
            title={label}
          >
              <i className={`${iconClass} text-lg`}></i>
          </a>
      );
  };

  return (
    <div className="min-h-screen bg-coffee-50 pt-16 sm:pt-20 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
         
         {/* Header Card */}
         <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 border border-coffee-100 flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8 relative mb-6 sm:mb-8">
            
            {/* Avatar Section */}
            <div className="flex-shrink-0 mx-auto md:mx-0 relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 sm:border-4 border-coffee-100 shadow-sm">
                    <img 
                        src={isEditing ? editData.avatarUrl : viewedUser.avatarUrl} 
                        alt={viewedUser.username} 
                        className="w-full h-full object-cover" 
                    />
                </div>
                {isEditing && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <i className="fas fa-camera text-2xl"></i>
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                />
            </div>

            {/* Info / Edit Form */}
            <div className="flex-1 w-full text-center md:text-left">
                {isEditing ? (
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-coffee-400 uppercase mb-1">Username</label>
                            <input 
                                type="text" 
                                value={editData.username}
                                onChange={(e) => setEditData({...editData, username: e.target.value})}
                                className="w-full px-4 py-2 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none font-bold text-coffee-900"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-coffee-400 uppercase mb-1">Bio</label>
                            <textarea 
                                value={editData.bio}
                                onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                rows={3}
                                className="w-full px-4 py-2 bg-coffee-50 border border-coffee-200 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none text-sm text-coffee-800"
                                placeholder="Tell us about your coffee journey..."
                            />
                        </div>

                        <div className="pt-2 border-t border-coffee-100">
                            <label className="block text-xs font-bold text-coffee-400 uppercase mb-3">Social Connections</label>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="relative">
                                    <i className="fab fa-instagram absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Instagram URL"
                                        value={editData.socialLinks.instagram}
                                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-coffee-50 border border-coffee-200 rounded-lg focus:ring-1 focus:ring-volt-400 outline-none"
                                    />
                                </div>
                                <div className="relative">
                                    <i className="fab fa-x-twitter absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400"></i>
                                    <input 
                                        type="text" 
                                        placeholder="X (Twitter) URL"
                                        value={editData.socialLinks.x}
                                        onChange={(e) => handleSocialChange('x', e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm bg-coffee-50 border border-coffee-200 rounded-lg focus:ring-1 focus:ring-volt-400 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 justify-center md:justify-start">
                            <Button onClick={handleSave} size="sm">Save Profile</Button>
                            <Button onClick={handleCancel} variant="ghost" size="sm">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 justify-center sm:justify-start">
                            <h1 className="text-2xl sm:text-3xl font-bold text-coffee-900">@{viewedUser.username}</h1>
                            {isOwnProfile && <span className="text-coffee-500 text-xs sm:text-sm bg-coffee-50 px-2 py-1 rounded-lg">{viewedUser.email}</span>}
                            
                            {/* Drip Score Pill */}
                            <div className="ml-0 sm:ml-4 flex items-center gap-1 bg-coffee-900 text-volt-400 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                                <i className="fas fa-bolt"></i>
                                <span>{dripScore} DripScore</span>
                            </div>
                        </div>
                        
                        {viewedUser.bio ? (
                            <p className="text-sm sm:text-base text-coffee-700 italic mb-4 max-w-lg mx-auto sm:mx-0">"{viewedUser.bio}"</p>
                        ) : (
                            <p className="text-coffee-400 text-xs sm:text-sm mb-4">No bio yet.</p>
                        )}

                        {viewedUser.socialLinks && Object.values(viewedUser.socialLinks).some(v => v) && (
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                                {renderSocialIcon(viewedUser.socialLinks.instagram, "fab fa-instagram", "Instagram", "text-pink-600")}
                                {renderSocialIcon(viewedUser.socialLinks.x, "fab fa-x-twitter", "X", "text-black")}
                            </div>
                        )}

                        <div className="flex justify-center sm:justify-start gap-3 sm:gap-4 mb-6 pt-2 border-t border-coffee-50 sm:border-none flex-wrap">
                            <div className="text-center sm:text-left">
                                <span className="block font-bold text-lg sm:text-xl text-coffee-900">{savedSpots.length}</span>
                                <span className="text-[10px] sm:text-xs text-coffee-500 uppercase tracking-wide">Saved</span>
                            </div>
                            <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-coffee-100">
                                <span className="block font-bold text-lg sm:text-xl text-coffee-900">{visitedSpots.length}</span>
                                <span className="text-[10px] sm:text-xs text-coffee-500 uppercase tracking-wide">Visited</span>
                            </div>
                            <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-coffee-100">
                                <span className="block font-bold text-lg sm:text-xl text-coffee-900">{claimedSpots.length}</span>
                                <span className="text-[10px] sm:text-xs text-coffee-500 uppercase tracking-wide">Owned</span>
                            </div>
                            <div className="text-center sm:text-left pl-3 sm:pl-4 border-l border-coffee-100">
                                <span className="block font-bold text-lg sm:text-xl text-coffee-900">{viewedUser.followerIds?.length || 0}</span>
                                <span className="text-[10px] sm:text-xs text-coffee-500 uppercase tracking-wide">Followers</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start flex-wrap">{isOwnProfile ? (
                                <>
                                    <Button variant="outline" size="sm" onClick={startEditing}>
                                        <i className="fas fa-edit mr-2"></i> Edit Profile
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleShareProfile} className="text-volt-500 hover:bg-volt-50">
                                        <i className="fas fa-share mr-2"></i> Share Profile
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={async () => { await logout(); navigate('/'); }} className="text-red-500 hover:bg-red-50">
                                        Log Out
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant={isFollowing ? "secondary" : "primary"} size="sm" onClick={handleToggleFollow}>
                                        <i className={`fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'} mr-2`}></i> 
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={handleShareProfile}>
                                        <i className="fas fa-share mr-2"></i> Share Profile
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
         </div>

         {/* GAMIFICATION: Badges */}
         <div className="mb-6 sm:mb-10">
             <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-coffee-900">Achievements</h2>
                <span className="bg-volt-400/20 text-coffee-900 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Beta</span>
             </div>
             
             <div className="bg-white p-3 sm:p-4 md:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-coffee-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                    {BADGES.map(badge => (
                        <div 
                            key={badge.id}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-3 text-center border-2 transition-all duration-300 group ${
                                badge.unlocked 
                                ? 'bg-coffee-50 border-volt-400 shadow-md scale-105' 
                                : 'bg-gray-50 border-gray-100 grayscale opacity-60'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 text-xl ${
                                badge.unlocked ? 'bg-coffee-900 text-volt-400' : 'bg-gray-200 text-gray-400'
                            }`}>
                                <i className={badge.icon}></i>
                            </div>
                            <h3 className="font-bold text-coffee-900 text-xs mb-1">{badge.name}</h3>
                            <p className="text-[9px] text-coffee-500 uppercase font-bold">{badge.desc}</p>
                            
                            {badge.unlocked && (
                                <div className="mt-2 text-[9px] font-bold text-white bg-volt-400 px-2 py-0.5 rounded-full">
                                    UNLOCKED
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             </div>
         </div>

         {/* PASSPORT BOOK */}
         <div className="mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-coffee-900 mb-3 sm:mb-4 flex items-center gap-2">
                <i className="fas fa-passport text-coffee-400"></i> Your Passport Book
            </h2>
            
            {Object.keys(passportBook).length > 0 ? (
                <div className="bg-[#FDFBF7] border-2 border-coffee-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-2xl relative overflow-hidden">
                    {/* Book Binding Gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none z-10"></div>
                    
                    {(Object.entries(passportBook) as [string, Shop[]][]).map(([location, shops]) => (
                        <div key={location} className="mb-8 last:mb-0 relative z-0">
                            <h3 className="text-sm font-bold text-coffee-400 uppercase tracking-widest border-b border-coffee-200 pb-2 mb-6 flex items-center gap-2">
                                <i className="fas fa-map-pin text-volt-400"></i> {location}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-6 gap-y-6 sm:gap-y-8">
                                {shops.map((shop, index) => {
                                    // Randomize rotation slightly for organic "stamped" look
                                    const rotations = ['rotate-3', '-rotate-3', 'rotate-6', '-rotate-6', 'rotate-2', '-rotate-2'];
                                    const rotationClass = rotations[index % rotations.length];
                                    
                                    return (
                                        <div 
                                            key={shop.id} 
                                            onClick={() => navigate(`/shop/${shop.id}`)}
                                            className="cursor-pointer group flex flex-col items-center"
                                        >
                                            <div className={`
                                                relative w-24 h-24 rounded-full border-[3px] flex flex-col items-center justify-center p-2 text-center transform transition-transform duration-300 hover:scale-110 hover:rotate-0
                                                ${rotationClass}
                                                ${shop.isClaimed 
                                                    ? 'border-yellow-500/60 text-yellow-700 bg-yellow-50/50' // Gold Stamp
                                                    : 'border-coffee-900/40 text-coffee-900/60 hover:border-coffee-900 hover:text-coffee-900' // Standard Ink
                                                }
                                            `}>
                                                {/* Rough texture overlay for ink effect */}
                                                <div className="absolute inset-0 rounded-full opacity-20 bg-noise pointer-events-none"></div>

                                                <div className="font-serif font-black text-[10px] leading-tight mb-1 line-clamp-2 uppercase tracking-tighter">
                                                    {shop.name}
                                                </div>
                                                <div className="text-[8px] uppercase font-bold opacity-60 border-t border-current pt-0.5 mt-0.5 w-1/2">
                                                    {new Date().toLocaleDateString(undefined, { month: 'short', year: '2-digit'})}
                                                </div>
                                                
                                                {shop.isClaimed && (
                                                    <i className="fas fa-star text-yellow-400 absolute -top-2 -right-1 text-sm filter drop-shadow-sm animate-pulse-slow"></i>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-coffee-50 border-2 border-dashed border-coffee-200 rounded-3xl p-12 text-center">
                     <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <i className="fas fa-passport text-4xl text-coffee-200"></i>
                     </div>
                     <h3 className="text-lg font-bold text-coffee-900 mb-2">Your passport is empty</h3>
                     <p className="text-coffee-500 mb-6 max-w-xs mx-auto">Check into shops to earn stamps, track your travels, and unlock badges.</p>
                     <Button variant="primary" onClick={() => navigate('/')}>Start Exploring</Button>
                </div>
            )}
         </div>

         {/* Managed Shops (Owners Only) */}
         {claimedSpots.length > 0 && (
             <div className="mt-10 pb-10">
                <h2 className="text-xl font-serif font-bold text-coffee-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-briefcase text-coffee-400"></i> Your Managed Shops
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {claimedSpots.map(shop => (
                        <div 
                            key={shop.id} 
                            onClick={() => navigate(`/shop/${shop.id}`)} 
                            className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-volt-400 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-coffee-900 group-hover:text-coffee-600 transition-colors pr-8">{shop.name}</h3>
                                <div className="absolute top-5 right-5">
                                    <span className="bg-coffee-900 text-volt-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <i className="fas fa-check-circle"></i>
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-coffee-500 mb-4">{shop.location.address}, {shop.location.city}</p>
                            
                            <div className="flex items-center justify-between text-xs font-bold text-volt-500 uppercase tracking-wide mt-auto pt-3 border-t border-coffee-50">
                                <span>Manage Page</span>
                                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
         )}

         {/* Saved Spots */}
         <div className="mt-10 pb-20">
            <h2 className="text-xl font-serif font-bold text-coffee-900 mb-4 flex items-center gap-2">
                <i className="fas fa-heart text-coffee-400"></i> Your Saved Spots
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedSpots.length > 0 ? savedSpots.map(shop => (
                    <div key={shop.id} onClick={() => navigate(`/shop/${shop.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-coffee-100 cursor-pointer hover:shadow-md transition-all group">
                        <h3 className="font-bold text-coffee-900 group-hover:text-volt-500 transition-colors">{shop.name}</h3>
                        <p className="text-sm text-coffee-600 mb-2">{shop.location.city}</p>
                        <div className="flex gap-1">
                            {shop.vibes.slice(0,2).map(v => (
                                <span key={v} className="text-[9px] bg-coffee-50 text-coffee-400 border border-coffee-100 px-1.5 py-0.5 rounded">{v}</span>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-8 text-center border-2 border-dashed border-coffee-200 rounded-xl">
                        <p className="text-coffee-400 italic">No saved spots yet.</p>
                        <Button variant="ghost" className="mt-2 text-sm" onClick={() => navigate('/')}>Explore Map</Button>
                    </div>
                )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
