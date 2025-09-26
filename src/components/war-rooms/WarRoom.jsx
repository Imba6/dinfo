
import React from 'react';
import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlayerCard from '../player-roster/PlayerCard';

const TOTAL_SLOTS = 8;

const BATTLE_GROUPS = [
  { label: '+8', rooms: [1, 2, 3] },
  { label: '+4', rooms: [4, 5, 6] },
  { label: '+2', rooms: [7, 8, 9] },
  { label: '+1', rooms: [10, 11, 12] }
];

function getRoomLabel(roomNumber) {
  if ([1, 2, 3].includes(roomNumber)) return "+8";
  if ([4, 5, 6].includes(roomNumber)) return "+4";
  if ([7, 8, 9].includes(roomNumber)) return "+2";
  if ([10, 11, 12].includes(roomNumber)) return "+1";
  return "";
}

const EmptySlot = ({ isClickable }) => (
    <div className={`p-0 min-h-[76px] border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500 transition-colors ${
        isClickable ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/5' : ''
    }`}>
        <Shield className="w-6 h-6 opacity-30"/>
        <span className="text-sm mt-1">
            {isClickable ? 'Click to Place' : 'Empty Slot'}
        </span>
    </div>
);

export default function WarRoom({ roomNumber, players, onPlayerRemove, onRoomClick, onPlayerClick, selectedPlayer, displayRoomNumber }) {
    const isRoomClickable = selectedPlayer && players.some(p => p === null);
    const [draggable, setDraggable] = useState(null);

    return (
        <Droppable droppableId={`room-${roomNumber}`}>
            {(provided, snapshot) => (
                <Card 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-fit min-w-[296px] lg:min-w-[296px] 2xl:min-w[296px] bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 overflow-hidden transition-all duration-200 ${
                        isRoomClickable ? 'cursor-pointer hover:border-cyan-500' : ''
                    } ${
                        snapshot.isDraggingOver ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : ''
                    }`}
                    onClick={() => isRoomClickable && onRoomClick(roomNumber)}
                >
                    <div className="p-1">
                        <div className="flex items-center justify-center gap-2 p-1">
                            <h3 className="ml-1 font-bold text-white text-md">Room {displayRoomNumber} ({getRoomLabel(roomNumber)})</h3>
                            <Badge variant="outline" className="mr-1 border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                                {players.filter(p => p).length}/8
                            </Badge>
                        </div>
                        
                        <div className="grid gap-y-1">
                            {Array.from({ length: 8 }).map((_, index) => {
                                const player = players[index];
                                return (
                                    <div key={index} className="min-w-[256px] 2xl:min-w-[256px]">
                                        {player ? (
                                            <Draggable draggableId={player.id.toString()} index={index}>
                                                {(provided, snapshot) => {
                                                //snapshot.isDragging ? setDraggable(snapshot) :  setDraggable(null)
                                                return (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="relative group cursor-grab active:cursor-grabbing h-full"
                                                        onClick={(e) => { e.stopPropagation(); onPlayerClick(player); }}
                                                    >
                                                    <PlayerCard 
                                                        member={player}
                                                        isSelected={selectedPlayer?.id === player.id}
                                                    />
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute -top-2 -right-2 w-6 h-6 p-0 text-white bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        onClick={(e) => { e.stopPropagation(); onPlayerRemove(player); }}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                    </div>
                                                )}}
                                            </Draggable>
                                        ) : (
                                            <EmptySlot isClickable={isRoomClickable} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div style={{ display: 'none' }}>{provided.placeholder}</div>
                </Card>
            )}
        </Droppable>
    );
}
