import React from 'react';
import { ClothingItem } from '../types';
import { ProgressiveImage } from '../helpers';
import { Heart, Waves, Edit3, Trash2, Check, Square } from 'lucide-react';

interface WardrobeItemCardProps {
  item: ClothingItem;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelectItem: (id: string, e?: React.MouseEvent) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleLaundry: (id: string, e?: React.MouseEvent) => void;
  onOpenEditModal: (item: ClothingItem, e?: React.MouseEvent) => void;
  onDeleteItem: (id: string, e?: React.MouseEvent) => void;
}

export const WardrobeItemCard: React.FC<WardrobeItemCardProps> = React.memo(({
  item,
  isSelectionMode,
  isSelected,
  onToggleSelectItem,
  onToggleFavorite,
  onToggleLaundry,
  onOpenEditModal,
  onDeleteItem,
}) => {
  return (
    <div
      onClick={() => {
        if (isSelectionMode) {
          onToggleSelectItem(item.id);
        }
      }}
      className={`bg-white dark:bg-[#202B38] rounded-sm p-2 border transition-all flex flex-col justify-between shadow-xs group relative ${
        isSelected
          ? 'border-[#7FA8DC] ring-2 ring-[#7FA8DC]/40 bg-[#F4F7FC]/70 dark:bg-[#26313F]/70'
          : 'border-[#D5E2F3] dark:border-[#2E3D50] hover:border-[#7FA8DC]'
      } ${isSelectionMode ? 'cursor-pointer select-none' : ''}`}
    >
      <div>
        {/* Image & Quick Badges */}
        <div className="relative aspect-square rounded-xs overflow-hidden bg-gray-100 dark:bg-gray-800">
          <ProgressiveImage
            src={item.imageUrl}
            alt={item.name}
            fallbackColorHex={item.primaryColorHex}
            categoryName={item.subcategory || item.category}
          />
          
          {/* Category Badge */}
          <span className="absolute top-1 left-1 text-xs font-bold bg-[#20304A] text-white px-1.5 py-0.5 rounded-xs shadow-xs">
            {item.category === 'outer' ? '아우터' : item.category === 'top' ? '상의' : item.category === 'bottom' ? '하의' : item.category === 'shoes' ? '신발' : item.category === 'bag' ? '가방' : '액세서리'}
          </span>

          {/* Selection Checkbox Overlay */}
          {isSelectionMode && (
            <div className="absolute top-1 right-1 z-10">
              <div className={`w-6 h-6 rounded-sm flex items-center justify-center shadow-md transition-transform ${
                isSelected ? 'bg-[#7FA8DC] text-white scale-105' : 'bg-white/95 text-gray-400 hover:bg-white border border-gray-200'
              }`}>
                {isSelected ? <Check size={14} className="stroke-[3]" /> : <Square size={14} />}
              </div>
            </div>
          )}

          {/* Favorite Heart Button (when not in selection mode) */}
          {!isSelectionMode && (
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`min-w-[28px] min-h-[28px] absolute top-1 right-1 p-1 rounded-full bg-white/95 dark:bg-[#202B38]/95 shadow-xs transition-all flex items-center justify-center cursor-pointer text-gray-400 hover:text-red-400`}
              title="즐겨찾기"
            >
              <Heart size={13} fill={item.isFavorite ? 'currentColor' : 'none'} className={item.isFavorite ? 'text-red-500' : ''} />
            </button>
          )}

          {/* Laundry Badge if inLaundry */}
          {item.inLaundry && (
            <div className="absolute top-6 left-1 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-0.5">
              <Waves size={9} />
              <span>세탁 중</span>
            </div>
          )}

          {/* Formality Stars Badge */}
          <div className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-white text-xs px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
            <span>격식 ★{item.formality}</span>
          </div>

          {/* Edit Quick Button on Hover */}
          {!isSelectionMode && (
            <button
              onClick={(e) => onOpenEditModal(item, e)}
              className="min-h-[24px] absolute bottom-1 right-1 bg-white/95 dark:bg-[#202B38]/95 hover:bg-white text-gray-700 dark:text-gray-200 hover:text-[#7FA8DC] text-xs font-semibold px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-0.5 transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
              title="의류 정보 수정"
            >
              <Edit3 size={10} />
              <span>수정</span>
            </button>
          )}
        </div>

        {/* Info Details */}
        <div className="mt-1.5 space-y-1">
          <h4 className="font-bold text-xs text-[#20304A] dark:text-white truncate" title={item.name}>
            {item.name}
          </h4>

          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: item.primaryColorHex }} />
            <span className="truncate">{item.primaryColor}</span>
            <span>·</span>
            <span className="truncate">{item.material || '혼방'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>{item.minTemp}°~{item.maxTemp}°C</span>
            <span>착용 {item.timesWorn || 0}회</span>
          </div>

          {/* Style Tags - Uniform Height Slot (h-[22px]) */}
          <div className="flex items-center gap-0.5 pt-0.5 min-h-[22px] h-[22px] overflow-hidden">
            {item.styleTags && item.styleTags.length > 0 ? (
              item.styleTags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] leading-none bg-[#F4F7FC] dark:bg-[#26313F] border border-[#D5E2F3] dark:border-[#2E3D50] text-gray-600 dark:text-gray-300 px-1 py-0.5 rounded-xs truncate">
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-[10px] leading-none text-gray-400">#기본</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions - Fixed Uniform Height Bar with Adequate Headroom */}
      <div className="pt-1.5 mt-1 border-t border-[#D5E2F3] dark:border-[#2E3D50] flex items-center justify-between min-h-[30px] shrink-0">
        <span className="text-[11px] text-gray-400 truncate max-w-[90px]" title={item.subcategory || '기본'}>
          {item.subcategory || '기본'}
        </span>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => onToggleLaundry(item.id, e)}
            className={`min-h-[24px] text-[11px] px-1.5 py-0.5 rounded-xs border transition-colors cursor-pointer flex items-center gap-0.5 leading-none ${
              item.inLaundry
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                : 'bg-[#F4F7FC] dark:bg-[#26313F] text-gray-600 dark:text-gray-300 border-[#D5E2F3] dark:border-[#2E3D50] hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={item.inLaundry ? '세탁 완료로 변경' : '세탁 중으로 변경'}
          >
            {item.inLaundry ? '세탁중' : '세탁'}
          </button>

          <button
            onClick={(e) => onOpenEditModal(item, e)}
            className="min-h-[24px] min-w-[24px] text-gray-500 dark:text-gray-400 hover:text-[#7FA8DC] p-1 rounded-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center cursor-pointer"
            title="수정하기"
          >
            <Edit3 size={13} />
          </button>

          <button
            onClick={(e) => onDeleteItem(item.id, e)}
            className="min-h-[24px] min-w-[24px] text-gray-400 hover:text-red-500 p-1 rounded-xs hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer"
            title="삭제"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
});

WardrobeItemCard.displayName = 'WardrobeItemCard';
