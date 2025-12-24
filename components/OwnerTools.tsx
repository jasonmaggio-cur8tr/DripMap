
import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { HappeningNowStatus, BrewItem, Barista, PlantMilkInfo, Campaign } from '../types';
import { useApp } from '../context/AppContext';

/**
 * --------------------------------------------------------------------------
 * ICONS & UI PRIMITIVES
 * --------------------------------------------------------------------------
 */
export const Icons = {
  Lock: () => <i className="fas fa-lock w-4 h-4" />,
  Edit: () => <i className="fas fa-pen w-3 h-3" />,
  Plus: () => <i className="fas fa-plus w-4 h-4" />,
  Trash: () => <i className="fas fa-trash w-3 h-3" />,
  Star: () => <i className="fas fa-star w-3 h-3" />,
  Info: () => <i className="fas fa-info-circle w-3 h-3" />,
  Megaphone: () => <i className="fas fa-bullhorn w-5 h-5" />,
  Image: () => <i className="fas fa-image w-5 h-5" />,
  Mug: () => <i className="fas fa-mug-hot w-4 h-4" />,
  Bolt: () => <i className="fas fa-bolt w-4 h-4" />,
  Clock: () => <i className="far fa-clock w-3 h-3" />,
  Refresh: () => <i className="fas fa-sync-alt w-3 h-3" />,
  Users: () => <i className="fas fa-users w-4 h-4" />,
  Cocktail: () => <i className="fas fa-cocktail w-4 h-4" />,
  Leaf: () => <i className="fas fa-leaf w-4 h-4" />
};

export const LockedOverlay = ({ label, onUpgrade }: { label?: string, onUpgrade?: () => void }) => (
  <div className="absolute inset-0 bg-gradient-to-br from-coffee-900/85 via-coffee-800/80 to-coffee-900/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center py-2 px-3 border-2 border-dashed border-volt-400/40 rounded-xl">
    <div className="bg-volt-400 w-6 h-6 rounded-full shadow-lg mb-1.5 animate-pulse flex items-center justify-center">
      <i className="fas fa-lock text-coffee-900 text-[10px]" />
    </div>
    <p className="text-[11px] font-black text-volt-400 mb-0.5 uppercase tracking-wide leading-none">{label || "Pro Feature"}</p>
    <p className="text-[8px] text-white/80 mb-1.5 font-medium leading-none">Upgrade to unlock</p>
    <button
      onClick={onUpgrade}
      className="px-3 py-1 bg-volt-400 text-coffee-900 font-black rounded shadow-md hover:shadow-lg transition-all hover:-translate-y-px uppercase tracking-wide text-[9px]"
    >
      Unlock Pro
    </button>
  </div>
);

/**
 * --------------------------------------------------------------------------
 * EDITABLE FIELD
 * --------------------------------------------------------------------------
 */
interface EditableFieldProps {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  isOwner: boolean;
  isEditing: boolean;
  isLocked?: boolean;
  multiline?: boolean;
  placeholder?: string;
  icon?: string;
  onUpgrade?: () => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({ 
  label, value, onChange, isOwner, isEditing, isLocked, multiline, placeholder, icon, onUpgrade
}) => {
  // Read-only view
  if (!isEditing) {
    if (!value) return isOwner ? (
        <div className="mb-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-coffee-600 mb-1 flex items-center gap-2">
                {icon && <i className={`fas ${icon}`}></i>} {label}
            </h4>
            <p className="text-xs italic text-coffee-500">Not set yet.</p>
        </div>
    ) : null; 

    return (
      <div className="mb-4 animate-in fade-in">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-2">
            {icon && <i className={`fas ${icon}`}></i>} {label}
        </h4>
        <p className="text-sm font-medium text-coffee-900 whitespace-pre-wrap">{value}</p>
      </div>
    );
  }

  // Edit view
  return (
    <div className="mb-5 relative group">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            {icon && <i className={`fas ${icon}`}></i>} {label}
        </label>
      </div>
      
      <div className="relative">
        {isLocked && <LockedOverlay label={`Edit ${label}`} onUpgrade={onUpgrade} />}
        
        {multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            className={`w-full bg-white border border-coffee-200 rounded p-3 text-sm focus:outline-none focus:ring-2 focus:ring-volt-400 min-h-[80px]`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            className={`w-full bg-white border border-coffee-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-volt-400`}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
};

/**
 * --------------------------------------------------------------------------
 * SPECIALTY MENU EDITOR
 * --------------------------------------------------------------------------
 */
export const SpecialtyMenuEditor = ({ 
    items, 
    isOwner, 
    isLocked, 
    onUpgrade,
    onUpdate 
}: { 
    items: {name: string, desc: string}[] | undefined, 
    isOwner: boolean, 
    isLocked: boolean, 
    onUpgrade: () => void,
    onUpdate: (items: {name: string, desc: string}[]) => void
}) => {
  const safeItems = items || [];
  const [newItem, setNewItem] = useState({ name: '', desc: '' });
  const [isAdding, setIsAdding] = useState(false);

  if (!isOwner && safeItems.length === 0) return null;

  const handleAdd = () => {
      if (newItem.name) {
          onUpdate([...safeItems, newItem]);
          setNewItem({ name: '', desc: '' });
          setIsAdding(false);
      }
  };

  const handleRemove = (idx: number) => {
      onUpdate(safeItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100 relative mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-4 border-b border-coffee-100 pb-2">
        <h3 className="text-xl font-serif font-bold flex items-center gap-2 text-coffee-900">
            <Icons.Cocktail /> Signature Drinks
        </h3>
        {isOwner && !isLocked && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-xs font-bold bg-coffee-50 text-coffee-900 px-3 py-1.5 rounded hover:bg-volt-400 transition-colors flex items-center gap-1"
          >
              <Icons.Plus /> Add
          </button>
        )}
      </div>

      {isLocked && isOwner && <LockedOverlay label="Showcase your menu" onUpgrade={onUpgrade} />}

      <div className="space-y-4">
        {safeItems.map((drink, idx) => (
          <div key={idx} className="flex justify-between items-start group">
            <div>
              <p className="font-bold text-sm text-coffee-900">{drink.name}</p>
              <p className="text-xs text-gray-600">{drink.desc}</p>
            </div>
            {isOwner && !isLocked && (
              <button 
                onClick={() => handleRemove(idx)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                  <Icons.Trash />
              </button>
            )}
          </div>
        ))}
        {safeItems.length === 0 && !isOwner && <p className="text-sm italic text-gray-400">No signature drinks listed.</p>}
        {safeItems.length === 0 && isOwner && !isAdding && <p className="text-sm italic text-gray-400">List your best sellers here.</p>}
        
        {isAdding && (
            <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-200 animate-in fade-in">
                <input 
                    placeholder="Drink Name (e.g. Lavender Latte)" 
                    className="w-full mb-2 p-2 text-sm bg-coffee-900 border border-coffee-800 rounded text-volt-400 font-bold focus:outline-none focus:border-volt-400 placeholder-coffee-600"
                    value={newItem.name}
                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
                <input 
                    placeholder="Description" 
                    className="w-full mb-2 p-2 text-sm bg-coffee-900 border border-coffee-800 rounded text-volt-400 focus:outline-none focus:border-volt-400 placeholder-coffee-600"
                    value={newItem.desc}
                    onChange={e => setNewItem({...newItem, desc: e.target.value})}
                />
                <div className="flex gap-2">
                    <button onClick={handleAdd} className="bg-coffee-900 text-volt-400 px-3 py-1 rounded text-xs font-bold hover:bg-black">Add</button>
                    <button onClick={() => setIsAdding(false)} className="text-gray-500 text-xs font-bold">Cancel</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

/**
 * --------------------------------------------------------------------------
 * VEGAN INFO EDITOR
 * --------------------------------------------------------------------------
 */
const MILK_TYPES = ['Almond', 'Oat', 'Soy', 'Cashew', 'Hemp', 'Watermelon', 'Other'] as const;

export const VeganInfoEditor = ({ 
    hasOptions, 
    milks, 
    isOwner, 
    isLocked, 
    isEditing,
    onUpgrade, 
    onUpdate 
}: { 
    hasOptions?: boolean, 
    milks?: PlantMilkInfo[], 
    isOwner: boolean, 
    isLocked: boolean,
    isEditing: boolean,
    onUpgrade: () => void, 
    onUpdate: (updates: { veganFoodOptions?: boolean, plantMilks?: PlantMilkInfo[] }) => void 
}) => {
    const safeMilks = milks || [];
    const [isAdding, setIsAdding] = useState(false);
    const [newMilk, setNewMilk] = useState<Partial<PlantMilkInfo>>({ type: 'Almond', brand: '', customType: '' });
    const { toast } = useToast();

    // If viewer (not owner) and no data, hide completely
    if (!isOwner && !hasOptions && safeMilks.length === 0) return null;

    const handleAdd = () => {
        if (!newMilk.type) return;
        if (newMilk.type === 'Other' && !newMilk.customType) {
            toast.error("Please enter the name for the 'Other' milk.");
            return;
        }

        onUpdate({ plantMilks: [...safeMilks, newMilk as PlantMilkInfo] });
        setNewMilk({ type: 'Almond', brand: '', customType: '' });
        setIsAdding(false);
    };

    const handleRemove = (idx: number) => {
        onUpdate({ plantMilks: safeMilks.filter((_, i) => i !== idx) });
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100 relative mb-8 overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-coffee-100 pb-3">
                <h3 className="text-xl font-serif font-bold flex items-center gap-2 text-coffee-900">
                    <Icons.Leaf /> Vegan & Plant Based
                </h3>
                {isEditing && isOwner && !isLocked && !isAdding && (
                     <button 
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-bold bg-volt-400 text-coffee-900 px-4 py-2 rounded-xl hover:bg-black hover:text-volt-400 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <Icons.Plus /> Add Milk Offering
                    </button>
                )}
            </div>

            {isLocked && isOwner && <LockedOverlay label="Plant Based Section" onUpgrade={onUpgrade} />}

            <div className="space-y-8">
                {/* Food Options Toggle */}
                <div className="flex items-center justify-between p-4 bg-coffee-50 rounded-2xl border border-coffee-100 transition-all hover:bg-white hover:shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${hasOptions ? 'bg-volt-400 text-coffee-900' : 'bg-white text-coffee-200 border border-coffee-100'}`}>
                            <i className="fas fa-carrot text-lg"></i>
                        </div>
                        <div>
                            <span className={`text-sm font-black transition-colors ${hasOptions ? 'text-coffee-900' : 'text-coffee-300'}`}>
                                Vegan Food Options Available
                            </span>
                            <p className="text-[10px] text-coffee-400 font-bold uppercase tracking-tight">Selection of plant-based pastries or snacks</p>
                        </div>
                    </div>
                    
                    {isEditing && isOwner && !isLocked && (
                        <button 
                            onClick={() => onUpdate({ veganFoodOptions: !hasOptions })}
                            className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 shadow-inner ${hasOptions ? 'bg-coffee-900' : 'bg-gray-200'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full absolute transition-all shadow-md flex items-center justify-center ${hasOptions ? 'translate-x-7 bg-volt-400' : 'translate-x-0 bg-white'}`}>
                                {hasOptions && <i className="fas fa-check text-[8px] text-coffee-900"></i>}
                            </div>
                        </button>
                    )}
                    {(!isEditing || !isOwner) && hasOptions && (
                        <div className="bg-green-50 text-green-700 font-black text-[9px] uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5">
                            <i className="fas fa-check"></i> Available
                        </div>
                    )}
                </div>

                {/* Milk List Section */}
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-coffee-300 mb-4 flex items-center gap-4">
                        Milk Alternatives
                        <div className="h-px flex-1 bg-coffee-50"></div>
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {safeMilks.map((milk, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-[#faf9f6] p-4 rounded-2xl border border-coffee-50 shadow-sm animate-in fade-in slide-in-from-bottom-2 group hover:border-volt-400 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-coffee-900 shadow-sm text-xs border border-coffee-50 font-bold">
                                        {milk.type.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="font-black text-coffee-900 text-sm leading-none block mb-1">
                                            {milk.type === 'Other' ? milk.customType : milk.type}
                                        </span>
                                        {milk.brand ? (
                                            <span className="text-[10px] text-volt-600 font-black uppercase tracking-widest bg-volt-400/10 px-1.5 py-0.5 rounded">{milk.brand}</span>
                                        ) : (
                                            <span className="text-[9px] text-coffee-300 font-bold uppercase italic">House Brand</span>
                                        )}
                                    </div>
                                </div>
                                {isEditing && isOwner && !isLocked && (
                                    <button 
                                        onClick={() => handleRemove(idx)}
                                        className="w-8 h-8 rounded-full text-coffee-200 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center"
                                        title="Remove Offering"
                                    >
                                        <Icons.Trash />
                                    </button>
                                )}
                            </div>
                        ))}

                        {safeMilks.length === 0 && !isAdding && (
                            <div className="col-span-full py-10 text-center bg-coffee-50/50 rounded-2xl border-2 border-dashed border-coffee-100 flex flex-col items-center justify-center">
                                <i className="fas fa-droplet text-coffee-100 text-2xl mb-2"></i>
                                <p className="text-xs text-coffee-300 font-black uppercase tracking-widest leading-none">No plant milks listed</p>
                                {isEditing && isOwner && (
                                    <button 
                                        onClick={() => setIsAdding(true)}
                                        className="mt-3 text-[10px] font-black text-volt-600 hover:text-coffee-900 transition-colors uppercase"
                                    >
                                        + Add your first milk
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Add Milk Form Overlay/Inline */}
                    {isAdding && isEditing && isOwner && (
                        <div className="mt-6 bg-coffee-900 p-6 rounded-3xl border border-coffee-800 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                            <button 
                                onClick={() => setIsAdding(false)}
                                className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                            
                            <h5 className="text-[11px] font-black text-volt-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                                <i className="fas fa-plus-circle"></i> Add New Milk Offering
                            </h5>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="relative">
                                        <label className="text-[9px] font-black text-coffee-400 uppercase block mb-2 ml-1">Milk Type Selection</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full p-3.5 text-sm bg-white/5 border border-white/10 rounded-2xl text-white font-black focus:outline-none focus:border-volt-400 appearance-none cursor-pointer hover:bg-white/10 transition-colors pr-10"
                                                value={newMilk.type}
                                                onChange={e => setNewMilk({ ...newMilk, type: e.target.value as any })}
                                            >
                                                {MILK_TYPES.map(t => <option key={t} value={t} className="text-coffee-900">{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-volt-400">
                                                <i className="fas fa-chevron-down text-[10px]"></i>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {newMilk.type === 'Other' && (
                                        <div className="animate-in slide-in-from-top-2">
                                            <label className="text-[9px] font-black text-coffee-400 uppercase block mb-2 ml-1">Custom Milk Name</label>
                                            <input 
                                                autoFocus
                                                className="w-full p-3.5 text-sm bg-white/5 border border-white/10 rounded-2xl text-white font-black placeholder-coffee-700 focus:outline-none focus:border-volt-400"
                                                placeholder="e.g. Pistachio, Macadamia"
                                                value={newMilk.customType || ''}
                                                onChange={e => setNewMilk({ ...newMilk, customType: e.target.value })}
                                            />
                                        </div>
                                    )}

                                    <div className={newMilk.type !== 'Other' ? 'md:col-span-1' : 'md:col-span-2'}>
                                        <label className="text-[9px] font-black text-coffee-400 uppercase block mb-2 ml-1">Brand Name (Optional)</label>
                                        <div className="relative">
                                            <i className="fas fa-tag absolute left-4 top-1/2 -translate-y-1/2 text-coffee-700 text-xs"></i>
                                            <input 
                                                className="w-full pl-10 p-3.5 text-sm bg-white/5 border border-white/10 rounded-2xl text-white font-black placeholder-coffee-700 focus:outline-none focus:border-volt-400"
                                                placeholder="e.g. Oatly, Califia, Pacific"
                                                value={newMilk.brand || ''}
                                                onChange={e => setNewMilk({ ...newMilk, brand: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button 
                                        onClick={handleAdd} 
                                        className="flex-1 py-4 bg-volt-400 text-coffee-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:scale-[1.02] active:scale-100 transition-all shadow-lg shadow-volt-400/20"
                                    >
                                        Save Offering
                                    </button>
                                    <button 
                                        onClick={() => setIsAdding(false)} 
                                        className="px-8 py-4 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * --------------------------------------------------------------------------
 * BARISTA EDITOR
 * --------------------------------------------------------------------------
 */
export const BaristaEditor = ({ 
    baristas, 
    isOwner, 
    isLocked, 
    onUpgrade,
    onUpdate
}: { 
    baristas: Barista[] | undefined, 
    isOwner: boolean, 
    isLocked: boolean, 
    onUpgrade: () => void,
    onUpdate: (list: Barista[]) => void
}) => {
    const safeBaristas = baristas || [];
    const [isAdding, setIsAdding] = useState(false);
    const [newPerson, setNewPerson] = useState<Partial<Barista>>({});

    if (!isOwner && safeBaristas.length === 0) return null;

    const handleAdd = () => {
        if (newPerson.name && newPerson.role) {
            onUpdate([...safeBaristas, {
                id: Math.random().toString(36).substr(2,9),
                name: newPerson.name,
                role: newPerson.role,
                bio: newPerson.bio || '',
                imageUrl: newPerson.imageUrl || `https://ui-avatars.com/api/?name=${newPerson.name}&background=231b15&color=ccff00`
            }]);
            setNewPerson({});
            setIsAdding(false);
        }
    };

    const handleRemove = (id: string) => {
        onUpdate(safeBaristas.filter(b => b.id !== id));
    };
  
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100 relative mb-8 overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-coffee-100 pb-2">
          <h3 className="text-xl font-serif font-bold flex items-center gap-2 text-coffee-900">
              <Icons.Users /> Meet the Team
          </h3>
          {isOwner && !isLocked && !isAdding && (
            <button 
                onClick={() => setIsAdding(true)}
                className="text-xs font-bold bg-coffee-50 text-coffee-900 px-3 py-1.5 rounded hover:bg-volt-400 transition-colors flex items-center gap-1"
            >
                <Icons.Plus /> Add Profile
            </button>
          )}
        </div>
  
        {isLocked && isOwner && <LockedOverlay label="Barista Profiles" onUpgrade={onUpgrade} />}
  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {safeBaristas.map((person) => (
            <div key={person.id} className="flex items-center gap-3 bg-[#faf9f6] p-3 rounded-xl border border-gray-100 group">
              <img src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover border border-coffee-100" />
              <div className="flex-1">
                <p className="font-bold text-sm leading-tight text-coffee-900">{person.name}</p>
                <p className="text-[9px] uppercase font-bold text-volt-500 bg-coffee-900 inline-block px-1.5 rounded-sm my-0.5">{person.role}</p>
                <p className="text-[10px] text-gray-600 leading-tight line-clamp-2">{person.bio}</p>
              </div>
              {isOwner && !isLocked && (
                <button 
                    onClick={() => handleRemove(person.id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Icons.Trash />
                </button>
              )}
            </div>
          ))}
          
          {safeBaristas.length === 0 && !isOwner && <p className="text-sm italic text-gray-400">No team profiles listed.</p>}
          {safeBaristas.length === 0 && isOwner && !isAdding && <p className="text-sm italic text-gray-400">Highlight your best baristas.</p>}
        </div>

        {isAdding && (
            <div className="mt-4 bg-coffee-50 p-4 rounded-xl border border-coffee-200 animate-in fade-in">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input 
                        placeholder="Name" 
                        className="p-2 text-sm bg-coffee-900 border border-coffee-800 rounded text-volt-400 font-bold focus:outline-none focus:border-volt-400 placeholder-coffee-600"
                        value={newPerson.name || ''}
                        onChange={e => setNewPerson({...newPerson, name: e.target.value})}
                    />
                    <input 
                        placeholder="Role (e.g. Head Roaster)" 
                        className="p-2 text-sm bg-coffee-900 border border-coffee-800 rounded text-volt-400 focus:outline-none focus:border-volt-400 placeholder-coffee-600"
                        value={newPerson.role || ''}
                        onChange={e => setNewPerson({...newPerson, role: e.target.value})}
                    />
                </div>
                <textarea 
                    placeholder="Short Bio" 
                    className="w-full mb-3 p-2 text-sm bg-coffee-900 border border-coffee-800 rounded text-volt-400 focus:outline-none focus:border-volt-400 placeholder-coffee-600"
                    rows={2}
                    value={newPerson.bio || ''}
                    onChange={e => setNewPerson({...newPerson, bio: e.target.value})}
                />
                <div className="flex gap-2">
                    <button onClick={handleAdd} className="bg-coffee-900 text-volt-400 px-4 py-2 rounded text-xs font-bold hover:bg-black">Save Profile</button>
                    <button onClick={() => setIsAdding(false)} className="text-gray-500 text-xs font-bold px-2">Cancel</button>
                </div>
            </div>
        )}
      </div>
    );
};

/**
 * --------------------------------------------------------------------------
 * LIVE MENU EDITOR
 * --------------------------------------------------------------------------
 */
const AddBrewItemModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean, onClose: () => void, onAdd: (item: BrewItem) => void }) => {
    const [newItem, setNewItem] = useState<Partial<BrewItem>>({ type: 'Espresso' });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.roaster && newItem.beanName) {
            onAdd({
                id: Math.random().toString(36).substr(2, 9),
                type: newItem.type as any || 'Espresso',
                roaster: newItem.roaster,
                beanName: newItem.beanName,
                notes: newItem.notes || ''
            });
            setNewItem({ type: 'Espresso', roaster: '', beanName: '', notes: '' });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#231b15] w-full max-w-md p-6 rounded-2xl border border-gray-800 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <i className="fas fa-times"></i>
                </button>
                
                <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-2">
                    <i className="fas fa-mug-hot text-[#ccff00]"></i> Add to Menu
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Brew Method</label>
                        <select 
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#ccff00]"
                            value={newItem.type}
                            onChange={e => setNewItem({...newItem, type: e.target.value as any})}
                        >
                            <option value="Espresso" className="text-black">Espresso</option>
                            <option value="Pour Over" className="text-black">Pour Over</option>
                            <option value="Drip" className="text-black">Drip</option>
                            <option value="Cold Brew" className="text-black">Cold Brew</option>
                        </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Roaster</label>
                            <input 
                                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#ccff00]"
                                placeholder="e.g. Onyx"
                                value={newItem.roaster || ''}
                                onChange={e => setNewItem({...newItem, roaster: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Bean Name</label>
                            <input 
                                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#ccff00]"
                                placeholder="e.g. Geometry"
                                value={newItem.beanName || ''}
                                onChange={e => setNewItem({...newItem, beanName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Tasting Notes</label>
                        <input 
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-[#ccff00]"
                            placeholder="e.g. Jasmine, Peach, Honey"
                            value={newItem.notes || ''}
                            onChange={e => setNewItem({...newItem, notes: e.target.value})}
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 bg-[#ccff00] text-[#231b15] font-bold rounded-xl hover:bg-white transition-colors mt-2"
                    >
                        Add to Menu
                    </button>
                </form>
            </div>
        </div>
    );
};

export const NowBrewingEditor = ({ menu, isOwner, isLocked, onUpgrade, onUpdate }: { 
    menu: BrewItem[] | undefined, 
    isOwner: boolean, 
    isLocked: boolean, 
    onUpgrade: () => void,
    onUpdate: (items: BrewItem[]) => void
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const safeMenu = menu || [];

    if (!isOwner && safeMenu.length === 0) return null;

    const handleAdd = (item: BrewItem) => {
        onUpdate([...safeMenu, item]);
        setIsModalOpen(false);
    };

    const handleRemove = (id: string) => {
        onUpdate(safeMenu.filter(i => i.id !== id));
    };

    return (
        <>
            <AddBrewItemModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onAdd={handleAdd} 
            />
            <div className="relative p-6 bg-coffee-900 text-white rounded-3xl shadow-lg border border-coffee-800 overflow-hidden mb-8">
                {/* Decor */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-volt-400 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10 border-b border-white/10 pb-2">
                    <h3 className="text-lg font-serif font-bold flex items-center gap-2 text-white">
                        <Icons.Mug /> Now Brewing
                    </h3>
                    {isOwner && !isLocked && (
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs font-bold bg-white/10 text-white px-3 py-1.5 rounded hover:bg-volt-400 hover:text-coffee-900 transition-colors flex items-center gap-1"
                        >
                            <Icons.Plus /> Update
                        </button>
                    )}
                </div>

                {isLocked && isOwner && <LockedOverlay label='"Now Brewing" Menu' onUpgrade={onUpgrade} />}

                <div className="space-y-3 relative z-10">
                    {safeMenu.map((item) => (
                        <div key={item.id} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between items-start group">
                            <div>
                                <span className="text-[10px] font-bold text-volt-400 uppercase tracking-wider mb-0.5 block">{item.type}</span>
                                <p className="text-sm font-bold text-white leading-tight">{item.roaster}</p>
                                <p className="text-xs text-gray-300 italic">{item.beanName}</p>
                                <p className="text-[10px] text-gray-500 mt-1">{item.notes}</p>
                            </div>
                            {isOwner && !isLocked && (
                                <button 
                                    onClick={() => handleRemove(item.id)}
                                    className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Icons.Trash />
                                </button>
                            )}
                        </div>
                    ))}
                    {safeMenu.length === 0 && !isOwner && <p className="text-sm italic text-gray-500">Menu not updated.</p>}
                    {safeMenu.length === 0 && isOwner && !isLocked && <p className="text-sm italic text-gray-500">Add your current beans to show off your menu.</p>}
                </div>
            </div>
        </>
    );
};

/**
 * --------------------------------------------------------------------------
 * HAPPENING NOW EDITOR (Digital A-Frame)
 * --------------------------------------------------------------------------
 */
const STICKER_PRESETS = ["FRESH DROP", "50% OFF", "LIVE MUSIC", "SOLD OUT", "LIMITED"];

export const HappeningNowEditor = ({ 
    status, 
    isOwner, 
    isLocked, 
    onUpgrade, 
    onUpdate 
}: { 
    status?: HappeningNowStatus, 
    isOwner: boolean, 
    isLocked: boolean, 
    onUpgrade: () => void,
    onUpdate: (status: HappeningNowStatus | undefined) => void
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        sticker: ''
    });
    const { toast } = useToast();

    // Check if expired
    const isExpired = status ? new Date(status.expiresAt) < new Date() : true;
    const isLive = status && !isExpired;

    // Load data into form when editing starts or if expired
    useEffect(() => {
        if (isEditing && status) {
            setFormData({
                title: status.title,
                message: status.message,
                sticker: status.sticker || ''
            });
        }
    }, [isEditing, status]);

    const handlePost = () => {
        if (!formData.title || !formData.message) {
            toast.error("Title and Message are required.");
            return;
        }
        
        const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours from now

        onUpdate({
            id: Math.random().toString(36).substr(2, 9),
            title: formData.title,
            message: formData.message,
            sticker: formData.sticker,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt
        });
        setIsEditing(false);
        toast.success("Board updated! Live for 4 hours.");
    };

    const handleRepost = () => {
        if (!status) return;
        setFormData({
            title: status.title,
            message: status.message,
            sticker: status.sticker || ''
        });
        setIsEditing(true);
    };

    if (!isOwner && !isLive) return null;

    // Format time left
    const formatTimeLeft = (expiry: string) => {
        const diff = new Date(expiry).getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="mt-8 relative p-6 bg-coffee-900 rounded-3xl shadow-xl border border-coffee-800 overflow-hidden group mb-8">
            {/* Background elements to look like a chalkboard/digital board */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-lg font-serif font-bold flex items-center gap-2 text-white">
                    <Icons.Bolt /> Happening Now
                </h3>
                {isOwner && !isLocked && !isEditing && (
                    <div className="flex gap-2">
                        {isLive ? (
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-bold bg-white/10 text-white px-3 py-1 rounded hover:bg-white hover:text-coffee-900 transition-colors"
                            >
                                <Icons.Edit /> Edit
                            </button>
                        ) : status ? (
                             // Repost Button when expired
                             <button 
                                onClick={handleRepost}
                                className="text-xs font-bold bg-volt-400 text-coffee-900 px-3 py-1 rounded hover:bg-white transition-colors flex items-center gap-1"
                            >
                                <Icons.Refresh /> Repost
                            </button>
                        ) : (
                             // Create First Post
                             <button 
                                onClick={() => setIsEditing(true)}
                                className="text-xs font-bold bg-volt-400 text-coffee-900 px-3 py-1 rounded hover:bg-white transition-colors"
                            >
                                <Icons.Plus /> Create Post
                            </button>
                        )}
                    </div>
                )}
            </div>

            {isLocked && isOwner && <LockedOverlay label="Digital A-Frame" onUpgrade={onUpgrade} />}

            {isEditing ? (
                <div className="space-y-4 animate-in fade-in relative z-10">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                        <p className="text-[10px] text-gray-400 mb-2">
                            <i className="fas fa-info-circle mr-1"></i>
                            Posts stay live on your page for <strong>4 hours</strong>. After expiration, the text is saved here so you can easily repost it later.
                        </p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Title <span className="text-red-400">*</span></label>
                        <input 
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-volt-400 font-serif font-bold text-lg placeholder-coffee-800"
                            placeholder="e.g. Fresh Pastries!"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase text-gray-500 mb-1 block">Message <span className="text-red-400">*</span></label>
                        <textarea 
                            className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-volt-400 text-sm placeholder-coffee-800"
                            placeholder="e.g. Just pulled out of the oven. Get them while they're hot."
                            rows={3}
                            value={formData.message}
                            onChange={e => setFormData({...formData, message: e.target.value})}
                        />
                    </div>
                    <div>
                         <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Optional Sticker</label>
                         <div className="flex gap-2 mb-2">
                             <input 
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-volt-400 text-sm placeholder-coffee-800 font-bold tracking-wider uppercase"
                                placeholder="e.g. $2 LATTES"
                                value={formData.sticker}
                                onChange={e => setFormData({...formData, sticker: e.target.value.toUpperCase()})}
                                maxLength={12}
                            />
                            {formData.sticker && (
                                <div className="bg-volt-400 text-coffee-900 text-xs font-black px-4 py-1 shadow-lg transform -rotate-2 flex items-center justify-center rounded border-2 border-coffee-900">
                                    {formData.sticker}
                                </div>
                            )}
                         </div>
                         {/* Presets */}
                         <div className="flex flex-wrap gap-2">
                            {STICKER_PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setFormData({...formData, sticker: preset})}
                                    className="px-2 py-1 rounded border border-white/10 text-[10px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors uppercase"
                                >
                                    {preset}
                                </button>
                            ))}
                         </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={handlePost}
                            className="flex-1 py-3 bg-volt-400 text-coffee-900 font-bold rounded-xl hover:bg-white transition-colors shadow-lg shadow-volt-400/10"
                        >
                            Go Live (4 Hours)
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {status ? (
                         <div className={`relative border-l-4 pl-4 py-1 transition-opacity ${isExpired ? 'border-gray-600 opacity-60' : 'border-volt-400'}`}>
                            {status.sticker && (
                                <div className={`absolute top-0 right-0 transform rotate-6 bg-volt-400 text-coffee-900 text-sm font-black px-3 py-1 shadow-lg border-2 border-coffee-900 ${isExpired ? 'grayscale opacity-50' : ''}`}>
                                    {status.sticker}
                                </div>
                            )}
                            <h4 className={`text-xl font-serif font-black mb-2 ${isExpired ? 'text-gray-400' : 'text-white'}`}>
                                {status.title}
                            </h4>
                            <p className="text-sm text-gray-300 leading-relaxed mb-4">{status.message}</p>
                            
                            {isExpired ? (
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900/50 inline-block px-2 py-1 rounded">
                                    <Icons.Clock /> Expired
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-volt-400 animate-pulse">
                                    <span className="w-2 h-2 bg-volt-400 rounded-full"></span>
                                    Live &bull; Ends in {formatTimeLeft(status.expiresAt)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-xl">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                                <Icons.Bolt />
                            </div>
                            <p className="text-gray-400 text-sm font-bold">Nothing live right now.</p>
                            {isOwner && <p className="text-gray-600 text-[10px] mt-1">Post a real-time update to attract visitors nearby.</p>}
                            {isOwner && !isLocked && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="mt-4 text-xs font-bold bg-volt-400 text-coffee-900 px-4 py-2 rounded-lg hover:bg-white transition-colors"
                                >
                                    Create Post
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/**
 * --------------------------------------------------------------------------
 * MARKETING SUITE (PRO)
 * --------------------------------------------------------------------------
 */
export const MarketingSuite = ({ 
    isPro, 
    onUpgrade, 
    shopName,
    shopId
}: { 
    isPro: boolean, 
    onUpgrade: () => void, 
    shopName: string,
    shopId: string
}) => {
    const { campaigns, submitCampaign } = useApp();
    const { toast } = useToast();
    const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Form State
    const [form, setForm] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        image: 'https://images.unsplash.com/photo-1511537632536-b74c2a6eae92?auto=format&fit=crop&w=800&q=80' // default mock
    });

    const activeCampaigns = campaigns.filter(c => c.shopId === shopId && (c.status === 'active' || c.status === 'pending'));
    
    // Calculate cost
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = isNaN(diffTime) ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    const isValidDates = !isNaN(days) && days > 0;
    const totalCost = isValidDates ? days * 10 : 0;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              setForm(prev => ({ ...prev, image: event.target!.result as string }));
            }
          };
          reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        if (!isValidDates || !form.title) {
            toast.error("Please fill out all fields correctly.");
            return;
        }

        submitCampaign({
            shopId: shopId,
            shopName: shopName,
            title: form.title,
            description: form.description,
            imageUrl: form.image,
            startDate: form.startDate,
            endDate: form.endDate,
            days: days,
            totalCost: totalCost
        });
        toast.success("Campaign Submitted for Approval!");
        setView('dashboard');
        setForm({ title: '', description: '', startDate: '', endDate: '', image: 'https://images.unsplash.com/photo-1511537632536-b74c2a6eae92?auto=format&fit=crop&w=800&q=80' });
    };

    if (!isPro) {
        return (
            <div className="mt-8 bg-gray-50 p-6 rounded-3xl border border-dashed border-gray-300 relative overflow-hidden mb-8">
                <LockedOverlay label="Unlock Marketing Suite" onUpgrade={onUpgrade} />
                <div className="flex items-center gap-2 mb-4 opacity-50">
                    <span className="bg-gray-200 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Pro Feature</span>
                    <h2 className="text-lg font-serif font-bold text-gray-400">Marketing Suite</h2>
                </div>
                <div className="space-y-3 opacity-50">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 grayscale">
                        <div className="bg-gray-100 p-3 rounded-lg"><Icons.Megaphone /></div>
                        <div>
                            <p className="font-bold text-sm">Visitor Offers</p>
                            <p className="text-xs text-gray-500">Push targeted deals to saved users</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'create') {
        return (
            <div className="mt-8 bg-white p-6 rounded-3xl border border-coffee-200 shadow-lg animate-in slide-in-from-right mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-serif font-bold text-coffee-900">Create Campaign</h2>
                    </div>
                    <button onClick={() => setView('dashboard')} className="text-xs font-bold text-gray-500 hover:text-coffee-900">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Form */}
                    <div className="space-y-6">
                        {/* Image Upload */}
                        <div>
                             <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Campaign Image</label>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-volt-400 hover:bg-coffee-50 transition-colors group"
                             >
                                 <div className="w-full h-full relative rounded-xl overflow-hidden">
                                     <img src={form.image} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity" />
                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                                         <Icons.Image />
                                         <span className="text-xs font-bold mt-2 text-coffee-600">Click to Change Image</span>
                                     </div>
                                 </div>
                             </div>
                             <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                                className="hidden" 
                                accept="image/*" 
                             />
                        </div>

                        <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Headline (Max 25 chars)</label>
                            <input 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold bg-white focus:ring-2 focus:ring-volt-400 outline-none"
                                maxLength={25}
                                placeholder="e.g. Free Oat Upgrade"
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                            />
                        </div>
                         <div>
                            <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Offer Details</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-volt-400 outline-none"
                                placeholder="Short details about the offer (e.g. Mention this ad to redeem)"
                                rows={2}
                                value={form.description}
                                onChange={e => setForm({...form, description: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Start Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white"
                                    value={form.startDate}
                                    onChange={e => setForm({...form, startDate: e.target.value})}
                                />
                            </div>
                             <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">End Date</label>
                                <input 
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-3 text-xs bg-white"
                                    value={form.endDate}
                                    onChange={e => setForm({...form, endDate: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="bg-coffee-50 p-4 rounded-xl border border-coffee-100 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Estimated Cost</p>
                                <p className="text-[10px] text-gray-400">$10.00 / day</p>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-coffee-900">${totalCost.toFixed(2)}</span>
                                {isValidDates && <p className="text-[10px] text-gray-500">{days} days</p>}
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={!isValidDates}
                            className="w-full py-4 bg-coffee-900 text-volt-400 font-bold rounded-xl shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit for Approval
                        </button>
                    </div>

                    {/* Live Preview Side */}
                    <div className="bg-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center border-4 border-white shadow-inner">
                        <p className="text-xs font-bold uppercase text-gray-400 mb-4 flex items-center gap-2">
                            <i className="fas fa-mobile-alt"></i> Mobile Feed Preview
                        </p>
                        
                        {/* The Preview Card */}
                        <div className="w-full max-w-sm block group bg-coffee-900 rounded-2xl overflow-hidden shadow-xl border border-coffee-800 relative h-40 flex flex-row">
                             <div className="w-1/3 h-full relative overflow-hidden">
                                <img 
                                    src={form.image} 
                                    alt="Promo" 
                                    className="w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-volt-400/20 mix-blend-overlay"></div>
                            </div>
                            <div className="flex-1 p-5 flex flex-col justify-center relative text-left">
                                <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest text-coffee-400 border border-coffee-700 px-1.5 py-0.5 rounded">
                                    Sponsored
                                </div>
                                <h3 className="text-xl font-serif font-bold text-volt-400 mb-1 leading-tight line-clamp-2">
                                    {form.title || 'Your Headline'}
                                </h3>
                                <p className="text-coffee-100 text-xs mb-3 opacity-80 line-clamp-2">
                                    {form.description || 'Your awesome offer description goes here.'}
                                </p>
                                <div className="mt-auto">
                                    <span className="text-xs font-bold text-coffee-900 bg-volt-400 px-3 py-1.5 rounded-lg inline-flex items-center gap-2">
                                    View Offer <i className="fas fa-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        </div>
                         
                         <div className="mt-4 text-center">
                            <p className="text-[10px] text-gray-400 mb-1">
                                *Campaigns run from 12:00 AM to 11:59 PM local time.
                            </p>
                            <p className="text-[10px] text-gray-400">
                                This card will appear in the main feed for users near your shop.
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-coffee-100 relative overflow-hidden mb-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-volt-400/20 text-coffee-900 rounded-lg"><Icons.Megaphone /></div>
                    <h2 className="text-lg font-serif font-bold text-coffee-900">Marketing Suite</h2>
                </div>
                <button 
                    onClick={() => setView('create')}
                    className="text-xs font-bold bg-coffee-900 text-volt-400 px-3 py-2 rounded-lg hover:bg-black transition-colors shadow-sm"
                >
                    + New Campaign
                </button>
            </div>

            {activeCampaigns.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                    <p className="text-gray-400 text-sm font-medium">No active campaigns.</p>
                    <p className="text-gray-400 text-xs mt-1">Boost your shop visibility today!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeCampaigns.map(c => (
                        <div key={c.id} className="p-4 border border-gray-100 rounded-xl flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden">
                                    <img src={c.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-coffee-900">{c.title}</p>
                                    <p className="text-[10px] text-gray-500">{c.startDate} to {c.endDate}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                c.status === 'active' ? 'bg-green-100 text-green-700' :
                                c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {c.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
