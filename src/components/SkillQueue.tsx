import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSkillStore } from '../store/useSkillStore';
import { calculateSkillPoints, calculateTrainingTime, formatTime } from '../lib/eveUtils';
import { Trash2, GripVertical, Clock, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMemo } from 'react';
import { SkillLevelSquares } from './ui/SkillLevelSquares';

export function SkillQueue() {
  const { queue, reorderQueue, removeFromQueue, attributes } = useSkillStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(queue);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderQueue(items);
  };

  const queueWithStats = useMemo(() => {
    let cumulativeTime = 0;
    return queue.map((item) => {
      const spTotal = calculateSkillPoints(item.skill.rank, item.level);
      const spPrev = calculateSkillPoints(item.skill.rank, item.level - 1);
      const spNeeded = spTotal - spPrev;

      const primary = attributes[item.skill.primary_attribute];
      const secondary = attributes[item.skill.secondary_attribute];
      
      const time = calculateTrainingTime(spNeeded, primary, secondary);
      cumulativeTime += time;

      return {
        ...item,
        spNeeded,
        time,
        cumulativeTime,
      };
    });
  }, [queue, attributes]);

  const totalTime = queueWithStats.length > 0 ? queueWithStats[queueWithStats.length - 1].cumulativeTime : 0;

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Skill Queue
        </h2>
        <div className="text-xs font-mono text-muted-foreground bg-black/40 px-2 py-1 rounded">
          Total: <span className="text-primary">{formatTime(totalTime)}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-black/20">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="skill-queue">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {queueWithStats.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          "relative group flex items-center gap-3 p-3 rounded-lg border transition-all",
                          snapshot.isDragging 
                            ? "bg-primary/10 border-primary/50 shadow-2xl z-50 scale-105" 
                            : "bg-card/40 border-white/5 hover:bg-card/60 hover:border-white/10"
                        )}
                      >
                        <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-medium truncate text-sm">{item.skill.name}</h4>
                            <SkillLevelSquares targetLevel={item.level} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(item.time)}
                            </span>
                            <span className="opacity-50">
                              x{item.skill.rank}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromQueue(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/20 w-full" />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {queue.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed border-white/5 rounded-lg m-2">
                        <p>Queue is empty</p>
                        <p className="text-xs opacity-50">Drag skills here or add from browser</p>
                    </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
