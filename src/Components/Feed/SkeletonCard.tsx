import { Card, CardBody, CardFooter, Skeleton } from "@nextui-org/react";
import React, { useMemo } from "react";

interface SkeletonCardProps {
  isVideo?: boolean;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ isVideo = false }) => {
  // 使用useMemo预先计算随机高度，避免在每次渲染时变化
  const randomHeight = useMemo(() => {
    // 更接近实际图片的常见尺寸
    return Math.floor(Math.random() * 150) + 250; // 250px - 400px
  }, []);

  return (
    <div className="caffelabs text-foreground">
      <Card className="mt-1 bg-transparent rounded-xl shadow-none">
        <CardBody className="overflow-visible p-0 bg-background rounded-xl">
          {isVideo ? (
            // 视频骨架：使用固定160px高度，匹配VideoCard的loading状态
            <Skeleton className="w-full rounded-xl border-[1.2px] border-border" style={{ height: '160px' }} />
          ) : (
            // 图片骨架：使用随机高度
            <Skeleton className="w-full object-cover rounded-xl border-[1.2px] border-border mx-auto" style={{ height: `${randomHeight}px` }} />
          )}
        </CardBody>
        
        {/* 标题区域 - 匹配PostCard的第一个CardFooter */}
        <CardFooter className="justify-between pt-2 pr-3 pb-1 pl-3 text-sm">
          <Skeleton className="h-4 w-4/5 rounded-lg" />
        </CardFooter>
        
        {/* 用户信息区域 - 匹配PostCard的第二个CardFooter */}
        <CardFooter className="justify-between pt-0 pr-3 pb-3 pl-3 text-small">
          <div className="flex items-center align-center">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="ml-1 h-3 w-20 rounded-lg" />
          </div>
          <div className="flex flex-col gap-1 items-start align-center text-default-500">
            <div className="flex justify-center items-center">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="ml-1 h-3 w-6 rounded-lg" />
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SkeletonCard; 