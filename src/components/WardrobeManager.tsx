import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Heart,
  Search,
  Sparkles,
  Upload,
  Check,
  Shirt,
  RotateCcw,
  Edit3,
  CheckSquare,
  Square,
  Waves,
  ShoppingBag,
  Images,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ClothingCategory, ClothingItem, SeasonType, UserProfile, WishlistItem, SAMPLE_WARDROBE_ITEMS, Thickness } from '../types';
import { WardrobeGapAndWishlist } from './OutfitHistoryAndWishlist';
import { WardrobeList } from './WardrobeList';
import { compressImageBase64 } from '../helpers';

interface WardrobeManagerProps {
  wardrobe: ClothingItem[];
  setWardrobe: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
  profile: UserProfile;
  onAddWishlistItemToWardrobe?: (item: WishlistItem) => void;
  customGeminiKey?: string;
}

export interface BatchRegisterItem {
  tempId: string;
  name: string;
  category: ClothingCategory;
  subcategory: string;
  primaryColor: string;
  primaryColorHex: string;
  imageUrl: string;
  seasons: SeasonType[];
  minTemp: number;
  maxTemp: number;
  formality: number;
  styleTags: string[];
  material: string;
  thickness: Thickness;
  waterproof: boolean;
  windproof: boolean;
  notes: string;
  isAiTagged?: boolean;
  isAnalyzing?: boolean;
  isExpanded?: boolean;
  errorMsg?: string;
}

const CATEGORY_TABS: { id: ClothingCategory | 'all'; label: string }[] = [
  { id: 'all', label: '전체 보기' },
  { id: 'outer', label: '아우터' },
  { id: 'top', label: '상의' },
  { id: 'bottom', label: '하의' },
  { id: 'shoes', label: '신발' },
  { id: 'bag', label: '가방' },
  { id: 'accessory', label: '액세서리' },
];

const PRESET_CLOTHING_PREVIEWS = [
  {
    name: '오버핏 울 블레이저 (차콜)',
    category: 'outer' as ClothingCategory,
    subcategory: '블레이저',
    primaryColor: '차콜',
    primaryColorHex: '#2B2D42',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80',
    minTemp: 10,
    maxTemp: 20,
    formality: 4,
    styleTags: ['미니멀', '스마트캐주얼', '오피스'],
    material: '울 80%, 폴리 20%',
    thickness: 'medium' as Thickness,
  },
  {
    name: '릴랙스드 핏 옥스포드 셔츠 (스카이블루)',
    category: 'top' as ClothingCategory,
    subcategory: '셔츠',
    primaryColor: '스카이블루',
    primaryColorHex: '#A8DADC',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80',
    minTemp: 14,
    maxTemp: 24,
    formality: 3,
    styleTags: ['댄디', '프레피', '비즈니스캐주얼'],
    material: '코튼 100%',
    thickness: 'thin' as Thickness,
  },
  {
    name: '테이퍼드 크롭 슬랙스 (베이지)',
    category: 'bottom' as ClothingCategory,
    subcategory: '슬랙스',
    primaryColor: '베이지',
    primaryColorHex: '#D7C4A5',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80',
    minTemp: 12,
    maxTemp: 25,
    formality: 3,
    styleTags: ['미니멀', '깔끔'],
    material: 'TR 혼방',
    thickness: 'medium' as Thickness,
  },
  {
    name: '독일군 레더 스니커즈 (화이트/그레이)',
    category: 'shoes' as ClothingCategory,
    subcategory: '스니커즈',
    primaryColor: '화이트',
    primaryColorHex: '#EAEAEA',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80',
    minTemp: -5,
    maxTemp: 35,
    formality: 2,
    styleTags: ['캐주얼', '데일리'],
    material: '소가죽 + 스웨이드',
    thickness: 'medium' as Thickness,
  },
];

const createDefaultBatchItem = (overrides: Partial<BatchRegisterItem> = {}): BatchRegisterItem => ({
  tempId: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
  name: '',
  category: 'top',
  subcategory: '',
  primaryColor: '블랙',
  primaryColorHex: '#2B2D42',
  imageUrl: '',
  seasons: ['spring', 'fall'],
  minTemp: 10,
  maxTemp: 22,
  formality: 3,
  styleTags: ['캐주얼', '미니멀'],
  material: '코튼 100%',
  thickness: 'medium',
  waterproof: false,
  windproof: false,
  notes: '',
  isAiTagged: false,
  isAnalyzing: false,
  isExpanded: false,
  ...overrides,
});

export const WardrobeManager: React.FC<WardrobeManagerProps> = ({
  wardrobe,
  setWardrobe,
  profile,
  onAddWishlistItemToWardrobe,
  customGeminiKey,
}) => {
  // Main sub-view state: 'inventory' (내 옷 목록) or 'gap_wishlist' (옷장 갭분석 & 위시리스트)
  const [wardrobeSubView, setWardrobeSubView] = useState<'inventory' | 'gap_wishlist'>('inventory');
  const [showLaundryOnly, setShowLaundryOnly] = useState(false);

  const [activeCategory, setActiveCategory] = useState<ClothingCategory | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State (20, 40, 60, 100개 단위 보기)
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selection & Bulk Actions State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Multi-Item Batch Registration Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchRegisterItem[]>([createDefaultBatchItem()]);
  const [batchAiProgress, setBatchAiProgress] = useState<{
    active: boolean;
    current: number;
    total: number;
    currentName: string;
  }>({ active: false, current: 0, total: 0, currentName: '' });
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAiAnalyzing, setEditAiAnalyzing] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  // Add keyboard ESC listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (isEditModalOpen) {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, isEditModalOpen]);

  // 필터나 검색어가 바뀔 때 현재 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, selectedSeason, showLaundryOnly, searchTerm, itemsPerPage]);

  // Filter items
  const filteredItems = wardrobe.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    if (selectedSeason !== 'all' && !item.seasons.includes(selectedSeason as SeasonType)) return false;
    if (showLaundryOnly && !item.inLaundry) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchColor = item.primaryColor.toLowerCase().includes(q);
      const matchTags = item.styleTags.some(t => t.toLowerCase().includes(q));
      const matchMaterial = item.material?.toLowerCase().includes(q);
      if (!matchName && !matchColor && !matchTags && !matchMaterial) return false;
    }
    return true;
  });

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Toggle selection of a single item
  const handleToggleSelectItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select all currently filtered items
  const handleSelectAllFiltered = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedItemIds.size === 0) return;
    const count = selectedItemIds.size;
    if (confirm(`선택한 ${count}벌의 의상을 스마트 옷장에서 영구 삭제하시겠습니까?`)) {
      setWardrobe(prev => prev.filter(item => !selectedItemIds.has(item.id)));
      setSelectedItemIds(new Set());
      setIsSelectionMode(false);
    }
  };

  // Bulk Laundry Status Toggle
  const handleBulkSetLaundry = (inLaundry: boolean) => {
    if (selectedItemIds.size === 0) return;
    setWardrobe(prev => prev.map(item => {
      if (selectedItemIds.has(item.id)) {
        return { ...item, inLaundry };
      }
      return item;
    }));
  };

  // Bulk Favorite Toggle
  const handleBulkSetFavorite = (isFavorite: boolean) => {
    if (selectedItemIds.size === 0) return;
    setWardrobe(prev => prev.map(item => {
      if (selectedItemIds.has(item.id)) {
        return { ...item, isFavorite };
      }
      return item;
    }));
  };

  // Open Edit Modal for a specific item
  const handleOpenEditModal = (item: ClothingItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem({ ...item });
    setEditSuccessMsg(null);
    setIsEditModalOpen(true);
  };

  // Multi-File Upload Handler for Batch Registration
  const handleProcessImageFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      alert('이미지 파일만 등록할 수 있습니다.');
      return;
    }

    let loadedCount = 0;
    const newItems: BatchRegisterItem[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawBase64 = event.target?.result as string;
        const base64 = await compressImageBase64(rawBase64, 640, 640, 0.78);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        newItems.push(createDefaultBatchItem({
          name: cleanName,
          imageUrl: base64,
        }));
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setBatchItems(prev => {
            const hasOnlyEmpty = prev.length === 1 && !prev[0].imageUrl && !prev[0].name;
            return hasOnlyEmpty ? newItems : [...prev, ...newItems];
          });
          setAiSuccessMsg(`${fileArray.length}벌의 의류 사진이 등록 대기열에 추가되었습니다. '전체 일괄 AI 자동 태깅'을 누르면 AI가 속성을 자동 완성합니다.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add a blank slot
  const handleAddBlankBatchItem = () => {
    setBatchItems(prev => [...prev, createDefaultBatchItem()]);
  };

  // Add 1 preset to batch
  const handleAddPresetToBatch = (preset: typeof PRESET_CLOTHING_PREVIEWS[0]) => {
    const newItem = createDefaultBatchItem({
      name: preset.name,
      category: preset.category,
      subcategory: preset.subcategory,
      primaryColor: preset.primaryColor,
      primaryColorHex: preset.primaryColorHex,
      imageUrl: preset.imageUrl,
      minTemp: preset.minTemp,
      maxTemp: preset.maxTemp,
      formality: preset.formality,
      styleTags: preset.styleTags,
      material: preset.material,
      thickness: preset.thickness,
      isAiTagged: true,
      notes: '샘플 프리셋으로 등록된 아이템입니다.',
    });
    setBatchItems(prev => {
      const hasOnlyEmpty = prev.length === 1 && !prev[0].imageUrl && !prev[0].name;
      return hasOnlyEmpty ? [newItem] : [...prev, newItem];
    });
  };

  // Add all 4 sample presets at once
  const handleAddAllPresetsToBatch = () => {
    const newItems = PRESET_CLOTHING_PREVIEWS.map(preset => createDefaultBatchItem({
      name: preset.name,
      category: preset.category,
      subcategory: preset.subcategory,
      primaryColor: preset.primaryColor,
      primaryColorHex: preset.primaryColorHex,
      imageUrl: preset.imageUrl,
      minTemp: preset.minTemp,
      maxTemp: preset.maxTemp,
      formality: preset.formality,
      styleTags: preset.styleTags,
      material: preset.material,
      thickness: preset.thickness,
      isAiTagged: true,
      notes: '샘플 프리셋으로 등록된 아이템입니다.',
    }));
    setBatchItems(prev => {
      const hasOnlyEmpty = prev.length === 1 && !prev[0].imageUrl && !prev[0].name;
      return hasOnlyEmpty ? newItems : [...prev, ...newItems];
    });
    setAiSuccessMsg(`4벌의 인기 에센셜 프리셋이 대기열에 추가되었습니다.`);
  };

  // Remove single item from queue
  const handleRemoveBatchItem = (tempId: string) => {
    setBatchItems(prev => {
      const filtered = prev.filter(item => item.tempId !== tempId);
      return filtered.length > 0 ? filtered : [createDefaultBatchItem()];
    });
  };

  // Clear all items in queue
  const handleClearAllBatchItems = () => {
    if (batchItems.length > 1 || batchItems[0]?.imageUrl || batchItems[0]?.name) {
      if (confirm('대기열의 모든 의류 등록 항목을 비우시겠습니까?')) {
        setBatchItems([createDefaultBatchItem()]);
        setAiSuccessMsg(null);
      }
    }
  };

  // Update item field
  const handleUpdateBatchItem = (tempId: string, updates: Partial<BatchRegisterItem>) => {
    setBatchItems(prev => prev.map(item => item.tempId === tempId ? { ...item, ...updates } : item));
  };

  // Toggle expanded details
  const handleToggleExpandBatchItem = (tempId: string) => {
    setBatchItems(prev => prev.map(item => item.tempId === tempId ? { ...item, isExpanded: !item.isExpanded } : item));
  };

  // Single Item AI Tagging in batch modal
  const handleSingleBatchItemAiTagging = async (tempId: string) => {
    const targetItem = batchItems.find(i => i.tempId === tempId);
    if (!targetItem) return;
    if (!targetItem.imageUrl && !targetItem.name) {
      alert('의류 사진을 업로드하거나 의류 명칭을 먼저 입력해주세요.');
      return;
    }

    handleUpdateBatchItem(tempId, { isAnalyzing: true, errorMsg: undefined });

    try {
      const response = await fetch('/api/gemini/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: targetItem.imageUrl.startsWith('data:') ? targetItem.imageUrl : undefined,
          imageUrl: !targetItem.imageUrl.startsWith('data:') ? targetItem.imageUrl : undefined,
          hintName: targetItem.name,
          customGeminiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.item) {
          const aiData = data.item;
          handleUpdateBatchItem(tempId, {
            name: aiData.name || targetItem.name,
            category: (aiData.category as ClothingCategory) || targetItem.category,
            subcategory: aiData.subcategory || targetItem.subcategory,
            primaryColor: aiData.primaryColor || targetItem.primaryColor,
            primaryColorHex: aiData.primaryColorHex || targetItem.primaryColorHex,
            seasons: aiData.seasons || targetItem.seasons,
            minTemp: aiData.minTemp ?? targetItem.minTemp,
            maxTemp: aiData.maxTemp ?? targetItem.maxTemp,
            formality: aiData.formality ?? targetItem.formality,
            styleTags: aiData.styleTags || targetItem.styleTags,
            material: aiData.material || targetItem.material,
            thickness: aiData.thickness || targetItem.thickness,
            waterproof: aiData.waterproof ?? targetItem.waterproof,
            windproof: aiData.windproof ?? targetItem.windproof,
            notes: aiData.notes || targetItem.notes,
            isAiTagged: true,
            isAnalyzing: false,
          });
        } else {
          handleUpdateBatchItem(tempId, { isAnalyzing: false, errorMsg: 'AI 분석 실패' });
        }
      } else {
        handleUpdateBatchItem(tempId, { isAnalyzing: false, errorMsg: '서버 오류' });
      }
    } catch (e) {
      console.error(e);
      handleUpdateBatchItem(tempId, { isAnalyzing: false, errorMsg: '통신 오류' });
    }
  };

  // Batch AI Auto-tagging all items in queue
  const handleBatchAiAutoTagging = async () => {
    const itemsToAnalyze = batchItems.filter(item => item.imageUrl || item.name);
    if (itemsToAnalyze.length === 0) {
      alert('분석할 의류 사진이나 명칭이 최소 1개 이상 등록되어 있어야 합니다.');
      return;
    }

    setBatchAiProgress({
      active: true,
      current: 0,
      total: itemsToAnalyze.length,
      currentName: 'Gemini AI 비전 일괄 태깅 준비 중...',
    });
    setAiSuccessMsg(null);

    // Set all matching items to analyzing state
    setBatchItems(prev => prev.map(item => (item.imageUrl || item.name) ? { ...item, isAnalyzing: true } : item));

    try {
      const payloadItems = itemsToAnalyze.map(item => ({
        id: item.tempId,
        imageBase64: item.imageUrl.startsWith('data:') ? item.imageUrl : undefined,
        imageUrl: !item.imageUrl.startsWith('data:') ? item.imageUrl : undefined,
        hintName: item.name,
      }));

      const response = await fetch('/api/gemini/analyze-clothing-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          customGeminiKey,
          selectedModel: profile.geminiModel,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.results)) {
          const resultMap = new Map<string, any>();
          data.results.forEach((r: any) => {
            if (r.id) resultMap.set(r.id, r.item);
          });

          setBatchItems(prev => prev.map(item => {
            const aiData = resultMap.get(item.tempId);
            if (aiData) {
              return {
                ...item,
                name: aiData.name || item.name,
                category: (aiData.category as ClothingCategory) || item.category,
                subcategory: aiData.subcategory || item.subcategory,
                primaryColor: aiData.primaryColor || item.primaryColor,
                primaryColorHex: aiData.primaryColorHex || item.primaryColorHex,
                seasons: aiData.seasons || item.seasons,
                minTemp: aiData.minTemp ?? item.minTemp,
                maxTemp: aiData.maxTemp ?? item.maxTemp,
                formality: aiData.formality ?? item.formality,
                styleTags: aiData.styleTags || item.styleTags,
                material: aiData.material || item.material,
                thickness: aiData.thickness || item.thickness,
                waterproof: aiData.waterproof ?? item.waterproof,
                windproof: aiData.windproof ?? item.windproof,
                notes: aiData.notes || item.notes,
                isAiTagged: true,
                isAnalyzing: false,
              };
            }
            return { ...item, isAnalyzing: false };
          }));

          setAiSuccessMsg(`Gemini AI가 ${itemsToAnalyze.length}벌의 의류 속성을 모두 자동 분석·태깅했습니다!`);
        }
      } else {
        // Fallback item by item
        for (let i = 0; i < itemsToAnalyze.length; i++) {
          const item = itemsToAnalyze[i];
          setBatchAiProgress({
            active: true,
            current: i + 1,
            total: itemsToAnalyze.length,
            currentName: `${item.name || `의류 #${i + 1}`} 분석 중...`,
          });
          await handleSingleBatchItemAiTagging(item.tempId);
        }
        setAiSuccessMsg(`Gemini AI가 ${itemsToAnalyze.length}벌의 의류 속성을 순차적으로 자동 태깅했습니다.`);
      }
    } catch (err) {
      console.error('Batch AI tagging error:', err);
      // Fallback item by item
      for (let i = 0; i < itemsToAnalyze.length; i++) {
        const item = itemsToAnalyze[i];
        await handleSingleBatchItemAiTagging(item.tempId);
      }
    } finally {
      setBatchAiProgress({ active: false, current: 0, total: 0, currentName: '' });
      setBatchItems(prev => prev.map(item => ({ ...item, isAnalyzing: false })));
    }
  };

  // Save All Batch Items to Smart Wardrobe
  const handleSaveAllBatchItems = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = batchItems.filter(item => item.name.trim() !== '' && item.imageUrl.trim() !== '');

    if (validItems.length === 0) {
      alert('등록할 의류의 이름과 사진을 최소 1개 이상 입력해주세요.');
      return;
    }

    if (validItems.length < batchItems.length) {
      const invalidCount = batchItems.length - validItems.length;
      if (!confirm(`사진이나 명칭이 누락된 ${invalidCount}개 항목은 제외하고, 정상 입력된 ${validItems.length}벌만 옷장에 일괄 저장하시겠습니까?`)) {
        return;
      }
    }

    const createdList: ClothingItem[] = validItems.map((item, idx) => ({
      id: `item_custom_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name.trim(),
      category: item.category || 'top',
      subcategory: item.subcategory.trim() || (item.category === 'outer' ? '아우터' : item.category === 'top' ? '상의' : item.category === 'bottom' ? '하의' : item.category === 'shoes' ? '신발' : item.category === 'bag' ? '가방' : '액세서리'),
      primaryColor: item.primaryColor.trim() || '기본색',
      primaryColorHex: item.primaryColorHex || '#2B2D42',
      imageUrl: item.imageUrl,
      seasons: (item.seasons && item.seasons.length > 0 ? item.seasons : ['spring', 'fall']) as ('spring' | 'summer' | 'fall' | 'winter')[],
      minTemp: item.minTemp ?? 10,
      maxTemp: item.maxTemp ?? 22,
      formality: item.formality ?? 3,
      styleTags: item.styleTags && item.styleTags.length > 0 ? item.styleTags : ['데일리'],
      material: item.material || '혼방',
      thickness: item.thickness || 'medium',
      waterproof: !!item.waterproof,
      windproof: !!item.windproof,
      isFavorite: false,
      timesWorn: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: item.notes,
    }));

    setWardrobe(prev => [...createdList, ...prev]);
    setIsAddModalOpen(false);
    setBatchItems([createDefaultBatchItem()]);
    setAiSuccessMsg(null);
  };

  // File Upload Handler for Edit
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      const base64 = await compressImageBase64(rawBase64, 640, 640, 0.78);
      setEditingItem(prev => prev ? ({
        ...prev,
        imageUrl: base64,
      }) : null);
    };
    reader.readAsDataURL(file);
  };

  // AI Re-analysis for Editing item
  const handleEditAiAutoTagging = async () => {
    if (!editingItem) return;
    if (!editingItem.imageUrl && !editingItem.name) {
      alert('의류 사진을 업로드하거나 의류 명칭을 먼저 입력해주세요.');
      return;
    }

    setEditAiAnalyzing(true);
    setEditSuccessMsg(null);

    try {
      const response = await fetch('/api/gemini/analyze-clothing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: editingItem.imageUrl?.startsWith('data:') ? editingItem.imageUrl : undefined,
          imageUrl: !editingItem.imageUrl?.startsWith('data:') ? editingItem.imageUrl : undefined,
          hintName: editingItem.name,
          customGeminiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.item) {
          const aiData = data.item;
          setEditingItem(prev => prev ? ({
            ...prev,
            name: aiData.name || prev.name,
            category: (aiData.category as ClothingCategory) || prev.category,
            subcategory: aiData.subcategory || prev.subcategory,
            primaryColor: aiData.primaryColor || prev.primaryColor,
            primaryColorHex: aiData.primaryColorHex || prev.primaryColorHex,
            seasons: aiData.seasons || prev.seasons,
            minTemp: aiData.minTemp ?? prev.minTemp,
            maxTemp: aiData.maxTemp ?? prev.maxTemp,
            formality: aiData.formality ?? prev.formality,
            styleTags: aiData.styleTags || prev.styleTags,
            material: aiData.material || prev.material,
            thickness: aiData.thickness || prev.thickness,
            waterproof: aiData.waterproof ?? prev.waterproof,
            windproof: aiData.windproof ?? prev.windproof,
            notes: aiData.notes || prev.notes,
          }) : null);
          setEditSuccessMsg('Gemini AI가 옷의 속성을 재분석하여 업데이트했습니다!');
        }
      } else {
        alert('AI 분석에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('AI 분석 중 오류가 발생했습니다.');
    } finally {
      setEditAiAnalyzing(false);
    }
  };

  // Single Item edit image drop / file select in batch row
  const handleSingleBatchItemImageUpload = (tempId: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawBase64 = e.target?.result as string;
      const base64 = await compressImageBase64(rawBase64, 640, 640, 0.78);
      handleUpdateBatchItem(tempId, {
        imageUrl: base64,
        name: batchItems.find(i => i.tempId === tempId)?.name || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      });
    };
    reader.readAsDataURL(file);
  };

  // Save changes to editing item
  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || !editingItem.imageUrl) {
      alert('옷 이름과 사진을 입력해주세요.');
      return;
    }

    setWardrobe(prev => prev.map(item =>
      item.id === editingItem.id ? editingItem : item
    ));
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('이 옷을 스마트 옷장에서 삭제하시겠습니까?')) {
      setWardrobe(prev => prev.filter(item => item.id !== id));
      setSelectedItemIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWardrobe(prev => prev.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const handleToggleLaundry = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWardrobe(prev => prev.map(item =>
      item.id === id ? { ...item, inLaundry: !item.inLaundry } : item
    ));
  };

  const handleRestoreSampleWardrobe = () => {
    if (confirm('기본 샘플 옷장(20벌의 코디 아이템)으로 복원하시겠습니까? (기존 수정/등록 항목은 초기화됩니다)')) {
      setWardrobe(SAMPLE_WARDROBE_ITEMS);
      setSelectedItemIds(new Set());
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 gap-1.5">
      {/* Top Main Sub-Navigation Bar: [보유 의류 보관함] vs [옷장 갭분석 & 위시리스트] */}
      <div className="bg-white dark:bg-[#202B38] rounded-sm p-2 px-3 sm:px-4 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left Title & Sub-View Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#7FA8DC] flex items-center justify-center text-white">
              {wardrobeSubView === 'inventory' ? <Shirt size={18} /> : <ShoppingBag size={18} />}
            </div>
            <div>
              <p className="text-[9px] tracking-[0.2em] font-semibold text-[#868E96]">디지털 옷장 통합 센터</p>
              <h3 className="text-sm sm:text-base text-[#20304A] dark:text-white font-bold">
                {wardrobeSubView === 'inventory' ? '나의 보유 의류 보관함' : '옷장 갭분석 & 위시리스트 가상피팅'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F4F7FC] dark:bg-[#26313F] p-1 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
            <button
              id="subtab-wardrobe-inventory"
              onClick={() => setWardrobeSubView('inventory')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${wardrobeSubView === 'inventory'
                  ? 'bg-[#7FA8DC] text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
                }`}
            >
              <Shirt size={15} />
              <span>보유 의류 ({wardrobe.length})</span>
            </button>

            <button
              id="subtab-wardrobe-gaps-wishlist"
              onClick={() => setWardrobeSubView('gap_wishlist')}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${wardrobeSubView === 'gap_wishlist'
                  ? 'bg-[#7FA8DC] text-white shadow-2xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
                }`}
            >
              <ShoppingBag size={15} />
              <span>옷장 갭분석 & 위시리스트</span>
              <span className="text-[10px] bg-amber-400 text-[#20304A] font-extrabold px-1.5 py-0.2 rounded-full">
                AI추천
              </span>
            </button>
          </div>
        </div>

        {/* Right Inventory Quick Controls (only if inventory subview) */}
        {wardrobeSubView === 'inventory' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Selection Mode Toggle Button */}
            <button
              id="btn-toggle-selection-mode"
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedItemIds(new Set());
              }}
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-sm border transition-colors flex items-center gap-1.5 cursor-pointer ${isSelectionMode
                  ? 'bg-[#7FA8DC] text-white border-[#7FA8DC]'
                  : 'bg-[#F4F7FC] dark:bg-[#26313F] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-[#D5E2F3] dark:border-[#2E3D50]'
                }`}
            >
              {isSelectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
              <span>{isSelectionMode ? '선택 모드 종료' : '선택 & 일괄 관리'}</span>
            </button>

            <button
              id="btn-restore-sample-wardrobe"
              onClick={handleRestoreSampleWardrobe}
              className="btn-secondary gap-1.5"
              title="기본 샘플 옷장으로 재설정"
            >
              <RotateCcw size={13} /> 샘플 복원
            </button>

            <button
              id="btn-open-add-clothing-modal"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary gap-1.5"
            >
              <Plus size={15} /> 의류 등록 & AI 일괄 태깅
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: GAP ANALYSIS & WISHLIST VIEW */}
      {wardrobeSubView === 'gap_wishlist' && (
        <div className="flex-1 min-h-0 overflow-y-auto animate-fade-in">
          <WardrobeGapAndWishlist
            wardrobe={wardrobe}
            profile={profile}
            onAddWishlistItemToWardrobe={onAddWishlistItemToWardrobe || ((item) => {
              const newClothing: ClothingItem = {
                id: `item_from_wish_${Date.now()}`,
                name: item.name,
                category: item.category,
                subcategory: item.subcategory,
                primaryColor: item.colorName,
                primaryColorHex: item.colorHex,
                imageUrl: item.imageUrl,
                seasons: ['spring', 'fall'],
                minTemp: 10,
                maxTemp: 22,
                formality: 3,
                styleTags: ['위시리스트', '새구매'],
                material: '신규 소재',
                thickness: 'medium',
                isFavorite: true,
                timesWorn: 0,
                createdAt: new Date().toISOString().split('T')[0],
              };
              setWardrobe(prev => [newClothing, ...prev]);
            })}
          />
        </div>
      )}

      {/* VIEW 2: INVENTORY LIST VIEW */}
      {wardrobeSubView === 'inventory' && (
        <>
          {/* BULK ACTION BAR (Visible when in Selection Mode) */}
          {isSelectionMode && (
            <div className="bg-[#F4F7FC] dark:bg-[#26313F] border border-[#7FA8DC]/40 p-2.5 px-3.5 rounded-sm shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSelectAllFiltered}
                  className="min-h-[44px] text-xs sm:text-sm font-semibold text-[#20304A] dark:text-white hover:text-[#7FA8DC] flex items-center gap-1.5 cursor-pointer"
                >
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                    <CheckSquare size={16} className="text-[#7FA8DC]" />
                  ) : (
                    <Square size={16} className="text-gray-400" />
                  )}
                  <span>현재 목록 전체 선택 ({filteredItems.length}벌)</span>
                </button>

                <span className="text-xs text-gray-400">|</span>

                <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white">
                  {selectedItemIds.size}벌 선택됨
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkSetLaundry(true)}
                  disabled={selectedItemIds.size === 0}
                  className="min-h-[44px] px-3 py-1 bg-white dark:bg-[#202B38] hover:bg-amber-50 text-amber-800 border border-amber-300 disabled:opacity-40 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="선택 의류 세탁 중으로 표시 (코디 추천 시 일시 제외)"
                >
                  <Waves size={13} />
                  <span>세탁 중 설정</span>
                </button>

                <button
                  onClick={() => handleBulkSetLaundry(false)}
                  disabled={selectedItemIds.size === 0}
                  className="min-h-[44px] px-3 py-1 bg-white dark:bg-[#202B38] hover:bg-blue-50 text-blue-800 border border-blue-300 disabled:opacity-40 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="선택 의류 세탁 완료 처리"
                >
                  <Check size={13} />
                  <span>세탁 완료</span>
                </button>

                <button
                  onClick={() => handleBulkSetFavorite(true)}
                  disabled={selectedItemIds.size === 0}
                  className="min-h-[44px] px-3 py-1 bg-white dark:bg-[#202B38] hover:bg-red-50 text-red-700 border border-red-200 disabled:opacity-40 text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Heart size={13} className="fill-red-500" />
                  <span>즐겨찾기</span>
                </button>

                <button
                  id="btn-bulk-delete-clothing"
                  onClick={handleBulkDelete}
                  disabled={selectedItemIds.size === 0}
                  className="min-h-[44px] px-3.5 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold rounded-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>선택 일괄 삭제 ({selectedItemIds.size})</span>
                </button>
              </div>
            </div>
          )}

          {/* Filter Tabs & Search Bar (Single Row Unified Toolbar - 1280px 스크롤 없이 1줄 고정) */}
          <div className="bg-white dark:bg-[#202B38] rounded-sm p-1 px-2.5 sm:px-3 border border-[#D5E2F3] dark:border-[#2E3D50] shadow-xs shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-hidden">
            {/* Left: Category Tabs + Season Filters + Laundry Toggle + 보기 개수 */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
              {/* Category Tabs */}
              <div className="flex items-center gap-0.5 bg-[#F4F7FC] dark:bg-[#26313F] p-0.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`tab-category-${tab.id}`}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`min-h-[28px] px-2 py-0.5 rounded-xs text-xs font-medium transition-all cursor-pointer flex items-center whitespace-nowrap ${activeCategory === tab.id
                        ? 'bg-[#7FA8DC] text-white font-bold shadow-2xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>

              {/* Sub Season Filter */}
              <div className="flex items-center gap-0.5 bg-[#F4F7FC] dark:bg-[#26313F] p-0.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
                <span className="text-[11px] font-bold text-[#20304A] dark:text-gray-200 px-1 hidden md:inline">계절:</span>
                {['all', 'spring', 'summer', 'fall', 'winter'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`min-h-[28px] px-1.5 py-0.5 rounded-xs text-xs font-medium transition-colors cursor-pointer flex items-center whitespace-nowrap ${selectedSeason === s
                        ? 'bg-[#7FA8DC] text-white font-bold shadow-2xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                  >
                    {s === 'all' ? '전체' : s === 'spring' ? '봄' : s === 'summer' ? '여름' : s === 'fall' ? '가을' : '겨울'}
                  </button>
                ))}
              </div>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {/* Laundry Toggle */}
              <button
                type="button"
                onClick={() => setShowLaundryOnly(!showLaundryOnly)}
                className={`min-h-[28px] px-2.5 py-0.5 rounded-xs text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border whitespace-nowrap ${showLaundryOnly
                    ? 'bg-amber-100 text-amber-800 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-[#F4F7FC] dark:bg-[#26313F] text-gray-600 dark:text-gray-300 border-[#D5E2F3] dark:border-[#2E3D50] hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Waves size={12} className={showLaundryOnly ? 'text-amber-600' : 'text-gray-400'} />
                <span>세탁 중</span>
              </button>
            </div>

            {/* Right: Search Input (1280px에서도 짤림 없이 안정적인 고정 너비) */}
            <div className="relative w-48 sm:w-56 shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                id="input-wardrobe-search"
                type="text"
                placeholder="의류명, 색상, 소재 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-base !pl-8 min-h-[28px] py-0.5 text-xs w-full"
              />
            </div>
          </div>

          {/* 의류 목록 영역 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <WardrobeList
              items={paginatedItems}
              isSelectionMode={isSelectionMode}
              selectedItemIds={selectedItemIds}
              onToggleSelectItem={handleToggleSelectItem}
              onToggleFavorite={handleToggleFavorite}
              onToggleLaundry={handleToggleLaundry}
              onOpenEditModal={handleOpenEditModal}
              onDeleteItem={handleDeleteItem}
            />
          </div>

          {/* 하단 페이지네이션 & 보기 개수 필터 바 (화면 하단에 항상 고정) */}
          {filteredItems.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 pb-2 border-t-2 border-[#7FA8DC]/30 dark:border-[#2E3D50] shrink-0 bg-white dark:bg-[#1E2734] px-4 py-2.5 rounded-sm shadow-sm text-xs select-none">
              {/* 왼쪽: 전체 개수 및 현재 표시 범위 */}
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                <span className="font-extrabold text-[#20304A] dark:text-white text-xs sm:text-sm">
                  총 {filteredItems.length}벌
                </span>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)}벌 표시 중
                </span>
              </div>

              {/* 중앙: 페이지 번호 네비게이션 버튼 */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#26313F] text-[#20304A] dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer shadow-2xs"
                  title="이전 페이지"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
                  .map((pageNum, idx, arr) => {
                    const prevNum = arr[idx - 1];
                    const hasGap = prevNum && pageNum - prevNum > 1;
                    return (
                      <React.Fragment key={pageNum}>
                        {hasGap && <span className="px-1 text-gray-400 text-xs">…</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[32px] h-8 px-2 rounded-sm text-xs font-bold transition-all cursor-pointer ${
                            safeCurrentPage === pageNum
                              ? 'bg-[#7FA8DC] text-white shadow-xs scale-105'
                              : 'border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#26313F] text-[#3A4A63] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="w-8 h-8 rounded-sm flex items-center justify-center border border-[#D5E2F3] dark:border-[#2E3D50] bg-white dark:bg-[#26313F] text-[#20304A] dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer shadow-2xs"
                  title="다음 페이지"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 오른쪽: 20개, 40개, 60개, 100개 단위 보기 필터 */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-300 font-bold hidden sm:inline">페이지당:</span>
                <div className="flex items-center gap-1 bg-[#F4F7FC] dark:bg-[#26313F] p-0.5 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50]">
                  {([20, 40, 60, 100] as const).map(count => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        setItemsPerPage(count);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-xs transition-all cursor-pointer ${
                        itemsPerPage === count
                          ? 'bg-[#7FA8DC] text-white shadow-2xs'
                          : 'text-gray-600 dark:text-gray-300 hover:text-[#20304A] dark:hover:text-white'
                      }`}
                    >
                      {count}개
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* EDIT CLOTHING ITEM MODAL */}
      {isEditModalOpen && editingItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditModalOpen(false);
              setEditingItem(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-[#202B38] rounded-sm max-w-2xl w-full p-4 sm:p-5 shadow-2xl border border-[#D5E2F3] dark:border-[#2E3D50] space-y-4 max-h-[90vh] overflow-y-auto my-auto">

            <div className="flex items-center justify-between pb-2.5 border-b border-[#D5E2F3] dark:border-[#2E3D50]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-sm bg-[#7FA8DC] flex items-center justify-center text-white">
                  <Edit3 size={13} />
                </div>
                <div>
                  <span className="text-[9px] tracking-[0.2em] font-semibold text-[#7FA8DC]">의류 속성 편집</span>
                  <h4 className="text-base text-[#20304A] dark:text-white font-bold">
                    [{editingItem.name}] 정보 수정
                  </h4>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-edit-modal"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
                className="min-h-[44px] px-2.5 py-1 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm font-semibold rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-1"
                aria-label="닫기"
              >
                ✕ 닫기
              </button>
            </div>

            {/* AI Auto Re-tagging Option */}
            <div className="p-3 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#7FA8DC]/30 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#7FA8DC] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#20304A] dark:text-white">Gemini AI 재분석: </span>
                  <span className="text-gray-600 dark:text-gray-300">현재 사진과 명칭으로 속성을 AI가 다시 태깅합니다.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEditAiAutoTagging}
                disabled={editAiAnalyzing}
                className="px-3 py-1.5 bg-[#7FA8DC] hover:bg-[#6894CD] text-white text-xs font-semibold rounded-sm transition-all flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
              >
                <Sparkles size={12} className={editAiAnalyzing ? 'animate-spin text-amber-200' : 'text-amber-200'} />
                <span>{editAiAnalyzing ? 'AI 재분석 중...' : 'AI 속성 다시 추출'}</span>
              </button>
            </div>

            {editSuccessMsg && (
              <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-sm border border-emerald-200 flex items-center gap-1.5 animate-fade-in">
                <Check size={13} /> {editSuccessMsg}
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveEditedItem} className="space-y-3.5 pt-1">

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Image Area (5 Cols) */}
                <div className="sm:col-span-5 space-y-2">
                  <label className="block text-[11px] font-semibold text-[#20304A] dark:text-gray-200">의류 사진 변경</label>

                  <div className="relative aspect-4/3 rounded-sm border border-[#D5E2F3] dark:border-[#2E3D50] bg-[#F4F7FC] dark:bg-[#26313F] flex flex-col items-center justify-center overflow-hidden">
                    <img
                      src={editingItem.imageUrl}
                      alt={editingItem.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="block w-full py-1.5 bg-[#7FA8DC] text-white text-center text-xs font-medium rounded-sm cursor-pointer hover:bg-[#6894CD] transition-colors">
                    <span>새 사진 업로드 (내 컴퓨터)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    placeholder="또는 이미지 URL 직접 입력"
                    value={editingItem.imageUrl}
                    onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, imageUrl: e.target.value }) : null)}
                    className="w-full text-xs p-2 min-h-[38px] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                  />
                </div>

                {/* Form Fields (7 Cols) */}
                <div className="sm:col-span-7 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">의류 명칭 *</label>
                    <input
                      type="text"
                      value={editingItem.name}
                      onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      required
                      className="w-full text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none focus:border-[#E07A5F]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">대분류 카테고리</label>
                      <select
                        value={editingItem.category}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, category: e.target.value as ClothingCategory }) : null)}
                        className="w-full text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                      >
                        <option value="outer">아우터 (Outer)</option>
                        <option value="top">상의 (Top)</option>
                        <option value="bottom">하의 (Bottom)</option>
                        <option value="shoes">신발 (Shoes)</option>
                        <option value="bag">가방 (Bag)</option>
                        <option value="accessory">액세서리 (Accessory)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">세부 품목명</label>
                      <input
                        type="text"
                        value={editingItem.subcategory || ''}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, subcategory: e.target.value }) : null)}
                        placeholder="예: 블레이저, 슬랙스, 더비"
                        className="w-full text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">주요 색상</label>
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={editingItem.primaryColorHex || '#2B2D42'}
                          onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, primaryColorHex: e.target.value }) : null)}
                          className="w-9 h-9 rounded-sm p-0 border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editingItem.primaryColor || ''}
                          onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, primaryColor: e.target.value }) : null)}
                          placeholder="색상명 (네이비, 베이지 등)"
                          className="flex-1 text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">소재</label>
                      <input
                        type="text"
                        value={editingItem.material || ''}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, material: e.target.value }) : null)}
                        placeholder="예: 울 80%, 코튼 100%"
                        className="w-full text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[11px] font-semibold text-[#3D405B]">
                        격식도 (1:캐주얼 ~ 5:포멀)
                      </label>
                      <span className="text-xs font-bold text-[#E07A5F]">★ {editingItem.formality}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={editingItem.formality || 3}
                      onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, formality: parseInt(e.target.value) }) : null)}
                      className="w-full accent-[#E07A5F] py-2 cursor-pointer"
                    />
                  </div>

                  {/* Temperature range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">
                        최저 적정 기온 ({editingItem.minTemp}°C)
                      </label>
                      <input
                        type="range"
                        min="-15"
                        max="35"
                        value={editingItem.minTemp ?? 10}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, minTemp: parseInt(e.target.value) }) : null)}
                        className="w-full accent-[#E07A5F] py-2 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">
                        최고 적정 기온 ({editingItem.maxTemp}°C)
                      </label>
                      <input
                        type="range"
                        min="-15"
                        max="38"
                        value={editingItem.maxTemp ?? 22}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, maxTemp: parseInt(e.target.value) }) : null)}
                        className="w-full accent-[#E07A5F] py-2 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Style Tags String */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3D405B] mb-0.5">
                      스타일 태그 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      value={editingItem.styleTags.join(', ')}
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                        setEditingItem(prev => prev ? ({ ...prev, styleTags: tags }) : null);
                      }}
                      placeholder="예: 미니멀, 댄디, 오피스"
                      className="w-full text-xs sm:text-sm p-2 min-h-[38px] bg-[#FBF9F5] border border-[#3D405B]/15 rounded-sm focus:outline-none"
                    />
                  </div>

                  {/* Status Toggles: Laundry & Favorite */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={!!editingItem.inLaundry}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, inLaundry: e.target.checked }) : null)}
                        className="w-4 h-4 accent-[#E07A5F] rounded-xs cursor-pointer"
                      />
                      <span>현재 세탁 중 (추천 목록에서 제외)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={!!editingItem.isFavorite}
                        onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, isFavorite: e.target.checked }) : null)}
                        className="w-4 h-4 accent-[#E07A5F] rounded-xs cursor-pointer"
                      />
                      <span>즐겨찾기 등록</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#3D405B]/10">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('이 옷을 스마트 옷장에서 영구 삭제하시겠습니까?')) {
                      handleDeleteItem(editingItem.id);
                      setIsEditModalOpen(false);
                      setEditingItem(null);
                    }
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-semibold rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>삭제하기</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingItem(null);
                    }}
                    className="btn-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    id="btn-save-edit-clothing"
                    className="btn-primary gap-1.5"
                  >
                    <Check size={14} />
                    <span>수정 사항 저장</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MULTI-ITEM BATCH ADD MODAL */}
      {isAddModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-[#202B38] rounded-sm max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-[#D5E2F3] dark:border-[#2E3D50] space-y-4 max-h-[92vh] flex flex-col my-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#D5E2F3] dark:border-[#2E3D50] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-[#7FA8DC]/15 flex items-center justify-center text-[#7FA8DC]">
                  <Images size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-[0.2em] font-semibold text-[#7FA8DC] uppercase">Smart Multi-Registration</span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] text-[#20304A] dark:text-gray-200 rounded-full">
                      대기열: {batchItems.length}벌
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg text-[#20304A] dark:text-white font-bold">
                    의류 다중 일괄 등록 & Gemini AI 자동 비전 태깅
                  </h4>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-batch-modal"
                onClick={() => setIsAddModalOpen(false)}
                className="min-h-[44px] px-3 py-1 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs sm:text-sm font-semibold rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-1"
                aria-label="닫기"
              >
                ✕ 닫기
              </button>
            </div>

            {/* Top Multi-Upload & Quick Add Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
              {/* Drag and drop / Multi file selector */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files) {
                    handleProcessImageFiles(e.dataTransfer.files);
                  }
                }}
                className={`md:col-span-7 border-2 border-dashed rounded-sm p-3.5 flex flex-col items-center justify-center text-center transition-all ${isDragOver ? 'border-[#7FA8DC] bg-[#F4F7FC] dark:bg-[#26313F]' : 'border-[#D5E2F3] dark:border-[#2E3D50] bg-[#F4F7FC]/50 dark:bg-[#26313F]/50 hover:border-[#7FA8DC]'
                  }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Images size={20} className="text-[#7FA8DC]" />
                  <span className="text-xs sm:text-sm font-bold text-[#20304A] dark:text-white">
                    여러 장의 옷 사진을 한 번에 선택하거나 드래그하세요
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                  휴대폰 사진이나 쇼핑몰 캡처를 여러 개 선택하면 자동으로 개별 옷으로 분할 생성됩니다.
                </p>
                <label className="min-h-[44px] px-4 py-1.5 bg-[#7FA8DC] hover:bg-[#6894CD] text-white text-xs font-semibold rounded-sm cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                  <Upload size={14} />
                  <span>내 기기에서 사진 여러 장 선택 (Ctrl/Shift 다중 선택)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleProcessImageFiles(e.target.files);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sample Preset Quick Add Buttons */}
              <div className="md:col-span-5 bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] p-3 rounded-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-[#20304A] dark:text-white flex items-center gap-1">
                      <Sparkles size={12} className="text-[#7FA8DC]" /> 빠른 샘플 추가
                    </span>
                    <button
                      type="button"
                      onClick={handleAddAllPresetsToBatch}
                      className="text-[10px] font-semibold text-[#7FA8DC] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      ⚡ 4벌 전체 추가
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_CLOTHING_PREVIEWS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPresetToBatch(preset)}
                        className="text-[11px] p-1.5 bg-white dark:bg-[#202B38] hover:bg-gray-100 dark:hover:bg-gray-700 border border-[#D5E2F3] dark:border-[#2E3D50] rounded-xs text-left truncate text-gray-700 dark:text-gray-200 font-medium cursor-pointer transition-colors"
                        title={preset.name}
                      >
                        + {preset.name.split(' ')[0]} {preset.subcategory}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#3D405B]/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddBlankBatchItem}
                    className="text-xs font-semibold text-[#3D405B] hover:text-[#E07A5F] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> 빈 의류 카드 추가
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllBatchItems}
                    className="text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    대기열 초기화
                  </button>
                </div>
              </div>
            </div>

            {/* AI Auto-tagging Global Action Bar */}
            <div className="p-3 bg-[#FAF7F2] border border-[#E07A5F]/20 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#E07A5F] shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#3D405B]">전체 일괄 AI 비전 태깅: </span>
                  <span className="text-gray-600">
                    대기열의 모든 의류 사진을 Gemini AI가 한 번에 스캔하여 카테고리, 색상, 기온, 격식도를 자동 완성합니다.
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-trigger-batch-ai-analyze"
                onClick={handleBatchAiAutoTagging}
                disabled={batchAiProgress.active || batchItems.every(i => !i.imageUrl && !i.name)}
                className="min-h-[38px] px-4 py-1.5 bg-[#E07A5F] hover:bg-[#c9674e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-sm transition-all flex items-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                {batchAiProgress.active ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Gemini AI 분석 중 ({batchAiProgress.current}/{batchAiProgress.total})...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>전체 일괄 AI 자동 태깅 ({batchItems.filter(i => i.imageUrl || i.name).length}벌)</span>
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar when analyzing */}
            {batchAiProgress.active && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-xs space-y-1.5 animate-fade-in shrink-0">
                <div className="flex items-center justify-between font-semibold text-amber-800">
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={13} className="animate-spin text-amber-600" />
                    {batchAiProgress.currentName}
                  </span>
                  <span>{batchAiProgress.current} / {batchAiProgress.total} 완료</span>
                </div>
                <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#E07A5F] h-full transition-all duration-300"
                    style={{
                      width: `${batchAiProgress.total > 0 ? (batchAiProgress.current / batchAiProgress.total) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Success notification message */}
            {aiSuccessMsg && !batchAiProgress.active && (
              <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-sm border border-emerald-200 flex items-center justify-between gap-1.5 animate-fade-in shrink-0">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  {aiSuccessMsg}
                </span>
                <button
                  type="button"
                  onClick={() => setAiSuccessMsg(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Batch Items List (Scrollable Area) */}
            <form onSubmit={handleSaveAllBatchItems} id="form-batch-register" className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="space-y-3">
                {batchItems.map((item, index) => {
                  const isReady = item.name.trim() !== '' && item.imageUrl.trim() !== '';

                  return (
                    <div
                      key={item.tempId}
                      className={`p-3.5 rounded-sm border transition-all ${item.isAnalyzing
                          ? 'bg-amber-50/50 border-amber-300'
                          : isReady
                            ? 'bg-[#FCFAF7] border-[#3D405B]/20 shadow-2xs'
                            : 'bg-white border-[#3D405B]/10'
                        }`}
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#3D405B]/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2 py-0.5 bg-[#3D405B] text-white rounded-xs text-[11px]">
                            #{index + 1}
                          </span>
                          <span className="font-semibold text-[#3D405B] truncate max-w-[200px] sm:max-w-[300px]">
                            {item.name || '새 의류 항목 (이름 및 사진을 입력해주세요)'}
                          </span>
                          {item.isAiTagged ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full flex items-center gap-1">
                              <Sparkles size={10} /> AI 태깅 완료
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full">
                              수동 작성
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSingleBatchItemAiTagging(item.tempId)}
                            disabled={item.isAnalyzing || (!item.imageUrl && !item.name)}
                            className="px-2 py-1 bg-white hover:bg-[#FAF7F2] border border-[#E07A5F]/30 text-[#E07A5F] text-[11px] font-semibold rounded-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="이 의류만 Gemini AI로 자동 분석"
                          >
                            {item.isAnalyzing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            <span>AI 분석</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleExpandBatchItem(item.tempId)}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-[11px] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>세부속성</span>
                            {item.isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {batchItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchItem(item.tempId)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer rounded-xs"
                              title="이 항목 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                        {/* Image Thumbnail / Selector (3 cols) */}
                        <div className="sm:col-span-3 space-y-1.5">
                          <div className="relative aspect-square rounded-xs border border-[#3D405B]/20 bg-[#FBF9F5] flex flex-col items-center justify-center overflow-hidden group">
                            {item.imageUrl ? (
                              <>
                                <img
                                  src={item.imageUrl}
                                  alt={item.name || '미리보기'}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <label className="text-[10px] text-white bg-[#3D405B]/80 px-2 py-1 rounded cursor-pointer hover:bg-[#3D405B]">
                                    사진 교체
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleSingleBatchItemImageUpload(item.tempId, file);
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                                <Upload size={20} className="mb-1 text-gray-300" />
                                <span className="text-[10px] block font-medium">사진 선택</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSingleBatchItemImageUpload(item.tempId, file);
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="또는 이미지 URL 입력"
                            value={item.imageUrl}
                            onChange={(e) => handleUpdateBatchItem(item.tempId, { imageUrl: e.target.value })}
                            className="w-full text-[11px] p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none focus:border-[#E07A5F]"
                          />
                        </div>

                        {/* Primary Metadata (9 cols) */}
                        <div className="sm:col-span-9 space-y-2">
                          {/* Row 1: Name, Category, Subcategory */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">의류 명칭 *</label>
                              <input
                                type="text"
                                placeholder="예: 싱글 울 자켓, 오버핏 셔츠"
                                value={item.name}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, { name: e.target.value })}
                                required
                                className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none focus:border-[#E07A5F]"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">카테고리</label>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, { category: e.target.value as ClothingCategory })}
                                className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none"
                              >
                                <option value="outer">아우터 (Outer)</option>
                                <option value="top">상의 (Top)</option>
                                <option value="bottom">하의 (Bottom)</option>
                                <option value="shoes">신발 (Shoes)</option>
                                <option value="bag">가방 (Bag)</option>
                                <option value="accessory">액세서리 (Accessory)</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">세부 품목</label>
                              <input
                                type="text"
                                placeholder="블레이저, 셔츠 등"
                                value={item.subcategory}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, { subcategory: e.target.value })}
                                className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Row 2: Color, Material, Formality */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">주요 색상</label>
                              <div className="flex gap-1">
                                <input
                                  type="color"
                                  value={item.primaryColorHex || '#2B2D42'}
                                  onChange={(e) => handleUpdateBatchItem(item.tempId, { primaryColorHex: e.target.value })}
                                  className="w-7 h-7 rounded-xs p-0 border border-gray-300 cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  placeholder="색상명 (예: 네이비)"
                                  value={item.primaryColor}
                                  onChange={(e) => handleUpdateBatchItem(item.tempId, { primaryColor: e.target.value })}
                                  className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">소재</label>
                              <input
                                type="text"
                                placeholder="예: 코튼 100%, 울 혼방"
                                value={item.material}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, { material: e.target.value })}
                                className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <div className="flex justify-between items-center mb-0.5">
                                <label className="text-[10px] font-semibold text-[#3D405B]">격식도 ({item.formality}점)</label>
                                <span className="text-[9px] text-gray-400">
                                  {item.formality <= 2 ? '캐주얼' : item.formality === 3 ? '스마트캐주얼' : '포멀'}
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={item.formality}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, { formality: parseInt(e.target.value) })}
                                className="w-full accent-[#E07A5F] py-1 cursor-pointer"
                              />
                            </div>
                          </div>

                          {/* Row 3: Temperature Range & Style Tags */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-6">
                              <div className="flex justify-between items-center mb-0.5">
                                <label className="text-[10px] font-semibold text-[#3D405B]">적정 기온 범위</label>
                                <span className="text-[10px] font-bold text-[#E07A5F]">
                                  {item.minTemp}°C ~ {item.maxTemp}°C
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="range"
                                  min="-15"
                                  max="35"
                                  value={item.minTemp}
                                  onChange={(e) => handleUpdateBatchItem(item.tempId, { minTemp: parseInt(e.target.value) })}
                                  className="w-full accent-[#E07A5F] py-1 cursor-pointer"
                                  title={`최저 ${item.minTemp}°C`}
                                />
                                <input
                                  type="range"
                                  min="-15"
                                  max="38"
                                  value={item.maxTemp}
                                  onChange={(e) => handleUpdateBatchItem(item.tempId, { maxTemp: parseInt(e.target.value) })}
                                  className="w-full accent-[#E07A5F] py-1 cursor-pointer"
                                  title={`최고 ${item.maxTemp}°C`}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-6">
                              <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">스타일 태그 (쉼표로 구분)</label>
                              <input
                                type="text"
                                placeholder="예: 미니멀, 데일리, 오피스"
                                value={item.styleTags.join(', ')}
                                onChange={(e) => handleUpdateBatchItem(item.tempId, {
                                  styleTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                })}
                                className="w-full text-xs p-1.5 bg-white border border-[#3D405B]/15 rounded-xs focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Expanded details accordion drawer */}
                          {item.isExpanded && (
                            <div className="p-2.5 bg-white border border-[#3D405B]/10 rounded-xs space-y-2 mt-2 animate-fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-[10px] font-semibold text-[#3D405B] mb-1">착용 계절</label>
                                  <div className="flex gap-2">
                                    {(['spring', 'summer', 'fall', 'winter'] as ('spring' | 'summer' | 'fall' | 'winter')[]).map((s) => {
                                      const labelMap = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' };
                                      const isChecked = item.seasons.includes(s);
                                      return (
                                        <label key={s} className="flex items-center gap-1 text-[11px] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const newSeasons = e.target.checked
                                                ? [...item.seasons, s]
                                                : item.seasons.filter(x => x !== s);
                                              handleUpdateBatchItem(item.tempId, { seasons: newSeasons });
                                            }}
                                            className="accent-[#E07A5F]"
                                          />
                                          <span>{labelMap[s]}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-[#3D405B] mb-1">두께감 & 특수기능</label>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                    <select
                                      value={item.thickness}
                                      onChange={(e) => handleUpdateBatchItem(item.tempId, { thickness: e.target.value as Thickness })}
                                      className="p-1 border border-gray-300 rounded text-[11px]"
                                    >
                                      <option value="thin">얇음 (Thin)</option>
                                      <option value="medium">보통 (Medium)</option>
                                      <option value="thick">도톰함 (Thick)</option>
                                      <option value="heavy">매우 두꺼움 (Heavy)</option>
                                    </select>

                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.waterproof}
                                        onChange={(e) => handleUpdateBatchItem(item.tempId, { waterproof: e.target.checked })}
                                        className="accent-[#E07A5F]"
                                      />
                                      <span>방수</span>
                                    </label>

                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.windproof}
                                        onChange={(e) => handleUpdateBatchItem(item.tempId, { windproof: e.target.checked })}
                                        className="accent-[#E07A5F]"
                                      />
                                      <span>방풍</span>
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-[#3D405B] mb-0.5">스타일링 메모</label>
                                <input
                                  type="text"
                                  placeholder="세탁 주의사항이나 특별한 코디 팁"
                                  value={item.notes}
                                  onChange={(e) => handleUpdateBatchItem(item.tempId, { notes: e.target.value })}
                                  className="w-full text-xs p-1.5 bg-gray-50 border border-gray-200 rounded-xs"
                                />
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </form>

            {/* Bottom Sticky Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#3D405B]/10 shrink-0 bg-white">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-semibold text-[#3D405B]">
                  총 {batchItems.length}벌 중 {batchItems.filter(i => i.name.trim() && i.imageUrl.trim()).length}벌 등록 준비 완료
                </span>
                {batchItems.some(i => i.isAiTagged) && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ✨ AI 태깅 {batchItems.filter(i => i.isAiTagged).length}벌
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleAddBlankBatchItem}
                  className="btn-secondary gap-1"
                >
                  <Plus size={13} />
                  <span>의류 1벌 더 추가</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  취소
                </button>

                <button
                  type="submit"
                  form="form-batch-register"
                  id="btn-save-batch-clothing"
                  disabled={batchItems.filter(i => i.name.trim() && i.imageUrl.trim()).length === 0}
                  className="btn-primary gap-1.5"
                >
                  <Check size={15} />
                  <span>
                    스마트 옷장에 {batchItems.filter(i => i.name.trim() && i.imageUrl.trim()).length}벌 일괄 등록하기
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
