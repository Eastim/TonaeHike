import { CalendarDays, MapPinned, Clock3, ArrowRight, User, Trash2 } from 'lucide-react';
import type { TripPlan } from '../../types';

interface PlanCardProps {
  plan: TripPlan;
  userAvatar?: string;
  userNickname?: string;
  onViewDetail: () => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

const API_BASE_URL = 'http://localhost:3000';

export function PlanCard({ plan, userAvatar, userNickname, onViewDetail, onDelete, showDelete = false }: PlanCardProps) {
  const getCityImage = (city: string) => {
    return `http://localhost:3000/CityView/${city}.jpg`;
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'http://localhost:3000/CityView/上海.jpg';
  };

  const totalSpots = plan.days.reduce((sum, day) => sum + day.spots.length, 0);

  return (
    <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg cursor-pointer group bg-white">
      {/* 背景图片 */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={getCityImage(plan.destination)}
          alt={plan.destination}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={handleImageError}
        />
        {/* 渐变遮罩 - 从底部向上渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>
      
      {/* 内容 */}
      <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
        {/* 顶部 - 目的地标签和删除按钮 */}
        <div className="flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium">
            <MapPinned className="h-3.5 w-3.5" />
            {plan.destination}
          </span>
          {showDelete && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="w-8 h-8 opacity-0 group-hover:opacity-100 bg-red-500/80 text-white rounded-full flex items-center justify-center transition-all hover:bg-red-600 hover:scale-110"
              title="删除行程"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* 中部 - 行程名称 */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{plan.name}</h3>
          
          {/* 行程基本信息 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
              <CalendarDays className="h-4 w-4 text-white/90" />
              <span className="text-sm font-medium">
                {plan.startDate} ~ {plan.endDate}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
              <Clock3 className="h-4 w-4 text-white/90" />
              <span className="text-sm font-medium">共 {plan.days.length} 天</span>
            </div>
            {totalSpots > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm">
                <MapPinned className="h-4 w-4 text-white/90" />
                <span className="text-sm font-medium">{totalSpots} 个景点</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 底部 - 用户信息和查看按钮 */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            {userAvatar ? (
              <img
                src={userAvatar.startsWith('http') 
                  ? userAvatar 
                  : `${API_BASE_URL}${userAvatar}`}
                alt="用户头像"
                className="w-9 h-9 rounded-full border-2 border-white/40 object-cover bg-gray-200 shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `${API_BASE_URL}/avatar/default.png`;
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center">
                <User className="h-5 w-5 text-white/80" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{userNickname || '用户'}</p>
              <p className="text-xs text-white/60">创建于 {plan.createdAt?.split('T')[0]}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            查看详情
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}