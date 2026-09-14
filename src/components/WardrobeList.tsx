import React from 'react';
import { ClothingItem } from '../types';
import { WardrobeItemCard } from './WardrobeItemCard';
import { Shirt } from 'lucide-react';

interface WardrobeListProps {
  items: ClothingItem[];
  isSelectionMode: boolean;
  selectedItemIds: Set<string>;
  onToggleSelectItem: (id: string, e?: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleLaundry: (id: string, e?: React.MouseEvent) => void;
  onOpenEditModal: (item: ClothingItem, e?: React.MouseEvent) => void;
  onDeleteItem: (id: string, e?: React.MouseEvent) => void;
}

export const WardrobeList: React.FC<WardrobeListProps> = React.memo(({
  items,
  isSelectionMode,
  selectedItemIds,
  onToggleSelectItem,
  onToggleFavorite,
  onToggleLaundry,
  onOpenEditModal,
  onDeleteItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-sm border border-dashed border-gray-200">
        <Shirt size={28} className="mx-auto mb-2 text-gray-300" />
        <p className="text-xs font-semibold text-gray-600">해당 조건의 의류가 없습니다.</p>
        <p className="text-xs text-gray-400 mt-0.5">검색어를 바꾸거나 새 의류를 등록해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 overflow-y-auto flex-1 min-h-0 pr-1">
      {items.map((item) => (
        <WardrobeItemCard
          key={item.id}
          item={item}
          isSelectionMode={isSelectionMode}
          isSelected={selectedItemIds.has(item.id)}
          onToggleSelectItem={onToggleSelectItem}
          onToggleFavorite={onToggleFavorite}
          onToggleLaundry={onToggleLaundry}
          onOpenEditModal={onOpenEditModal}
          onDeleteItem={onDeleteItem}
        />
      ))}
    </div>
  );
});

WardrobeList.displayName = 'WardrobeList';
